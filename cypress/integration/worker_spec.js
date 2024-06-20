/// <reference types="cypress" />

describe('Worker.js CRDT/CRUD Operations', () => {
    const workerPath = 'src/worker.js';

    // it.only("should", ()=> {
    //     done();

    // //   console.log("done? ", done);
    // })

    let worker;
    //   
    beforeEach(() => {
        worker = new Worker(workerPath);
    });

    afterEach(() => {
        worker.terminate();
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

        worker.postMessage({ action: 'addItem', data: changeDto });

        return new Promise((res, rej) => {
          worker.addEventListener("message", (event) => {
            if (event.data.action === 'message') {
              console.log("LOGG");
              expect(event.data.data).to.equal('Item added successfully');
              // // done();
              console.log("Res", res); 
              res("YAY");
            }
          });
        });

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
