
describe('Worker.js CRDT/CRUD Operations', () => {
    const workerPath = '/worker.js';

    // Custom command to interact with a web worker
    Cypress.Commands.add('workerCommand', (message) => {
        return cy.window().then((win) => {
            return new Cypress.Promise((resolve) => {
                // Create a new worker
                const worker = new win.Worker(workerPath);

                // Set up message handler
                worker.onmessage = (event) => {
                    resolve(event.data);
                    worker.terminate(); // Clean up after receiving the message
                };

                // Send message to worker
                worker.postMessage(message);
            });
        });
    });


    let worker;
    //   
    // beforeEach(() => {
    //     worker = new Worker(workerPath);
    // });

    // afterEach(() => {
    //     if (worker) {

    //         worker.terminate();
    //     }
    // });

    it.only('should add an item to IndexedDB (normal promise / cypress.window())', () => {
        const changeDto = {
            id: Date.now(),
            type: 'insert',
            position: 0,
            vectorClock: {},
            clientId: 'worker-test-client',
            text: 'Hello, Worker!',
            timestamp: new Date().toISOString(),
        };

        // Use cy.window() to access the browser's global scope
        cy.window().then((win) => {
            const worker = new win.Worker('/worker.js');

            // Create a promise that resolves when the worker sends a message
            const workerPromise = new Promise((resolve) => {
                worker.onmessage = (event) => {
                    console.log("event.data:",event.data);
                    console.log("event.data.data:",event.data.data);
    
                    resolve(event.data); };
            });

            // Post message to worker
            worker.postMessage({ action: 'addItem', data: changeDto });

            // Wait for the worker's response and assert
            cy.wrap(workerPromise).should((response) => {
                expect(response.action).to.equal('message');
                expect(response.data).to.equal('Item added successfully');
            });

            // Clean up the worker
            cy.wrap(null).then(() => worker.terminate());
        });
    });


    it('should process data in the worker (Use cypress.promise()/Cypress.Window)', () => {
        cy.workerCommand({ action: 'process', data: [1, 2, 3] })
            .then((result) => {
                expect(result).to.deep.equal([2, 4, 6]);
            });
    });


    it('should add an item to IndexedDB', async () => {
        const changeDto = {
            id: Date.now(),
            type: 'insert',
            position: 0,
            vectorClock: {},
            clientId: 'worker-test-client',
            text: 'Hello, Worker!',
            timestamp: new Date().toISOString(),
        };


        (new Promise((res, rej) => {
            const timeout = setTimeout(() => {
                rej(new Error('Worker TO'));
            }, 5000);

            worker.addEventListener("message", (event) => {
                clearTimeout(timeout);

                if (event.data.action === 'message') {
                    console.log("LOGG");
                    expect(event.data.data).to.equal('Item added successfully');
                    // // done();
                    console.log("Res", res);
                    res("YAY");
                } else {
                    rej(new Error('Unexpected worker response'));
                }
            });
            worker.postMessage({ action: 'addItem', data: changeDto });
            console.log("Res3");

        })).then((result) => {
            console.log("Res2");

            expect(result).to.equal('Item added successfully');
        }).catch((err) => {
            console.log("Res4", err);

        })
        console.log("Res5");

        // return new Promise((res, rej) => {
        //     const timeout = setTimeout(()=> {
        //         rej(new Error('Worker TO'));
        //     }, 5000);

        //     worker.addEventListener("message", (event) => {
        //         clearTimeout(timeout);

        //         if (event.data.action === 'message') {
        //             console.log("LOGG");
        //             expect(event.data.data).to.equal('Item added successfully');
        //             // // done();
        //             console.log("Res", res);
        //             res("YAY");
        //         } else {
        //             rej(new Error ('Unexpected worker response'));
        //         }
        //     });
        //     worker.postMessage({ action: 'addItem', data: changeDto });
        // });

        // return new Cypress.Promise((res, rej) => {
        //   console.log("Res", res); 
        //   worker.onmessage = (event) => {
        //     if (event.data.action === 'message') {
        //       console.log("LOGG");
        //       expect(event.data.data).to.equal('Item added successfully');
        //       // // done();
        //       console.log("Res", res); 
        //       res("YAY");
        //     }
        //   };

        //   setTimeout(() => {
        //     res("timed out");
        //   }, 10000);
        //     // console.log("HI");
        //     // res("YAY");
        //     // worker.onmessage = (event) => {
        //     //     if (event.data.action === 'message') {
        //     //         console.log("LOGG");
        //     //         expect(event.data.data).to.equal('Item added successfully');
        //     //         // done();
        //     //         res("YAY");
        //     //     }
        //     // };
        // })


        //   worker.onmessage = (event) => {
        //     if (event.data.action === 'message') {
        //       console.log("LOGG");
        //       expect(event.data.data).to.equal('Item added successfully');
        //       done();
        //     }
        //   };


    });

    it('should fetch all data from IndexedDB', () => {
        worker.postMessage({ action: 'fetchData' });

        worker.onmessage = (event) => {
            if (event.data.action === 'displayData') {
                cy.log(event.data.data)
                console.log("event.data.data:",event.data.data);

                expect(event.data.data).to.be.an('array');
                done();
            }
        };
    });

    it('should get items by Client ID', () => {
        const clientId = 'worker-test-client';
        worker.postMessage({ action: 'getItemByClientId', clientId });

        worker.onmessage = (event) => {
            if (event.data.action === 'displayItem') {
                expect(event.data.data).to.be.an('array');
                done();
            }
        };
    });

    it('should view the current document by aggregating all changes', () => {
        worker.postMessage({ action: 'viewDoc' });

        worker.onmessage = (event) => {
            if (event.data.action === 'displayDoc') {
                expect(event.data.data).to.be.a('string');
                done();
            }
        };
    });


});
