document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM is fully loaded');

    const addItemForm = document.getElementById('addItemForm');
    const fetchDataButton = document.getElementById('fetchDataButton');
    const dataDisplay = document.getElementById('dataDisplay');
    const getItemButton = document.getElementById('getItemButton');
    const clientIdInput = document.getElementById('clientIdInput');
    const message = document.getElementById('message');
    const viewDocButton = document.getElementById('viewDocButton');
    const docDisplay = document.getElementById('docDisplay');
    const resetDocumentButton = document.getElementById('resetDocumentButton');
    const applyOperationButton = document.getElementById('applyOperationButton');
    const getDocumentButton = document.getElementById('getDocumentButton');
    const fetchServerChangesButton = document.getElementById('fetchServerChangesButton');
    let lastFetchTime = new Date(0); // Initialize to epoch time
    // let lastFetchTime = new Date(0).toISOString(); // Initialize to epoch time



    // Initialize Web Worker
    const worker = new Worker('worker.js');
    console.log('Web Worker initialized.');
    const LOCAL_SERVER_BASE_URL = 'http://localhost:3000/';
    const SERVER_BASE_URL = 'https://nestjs-service-app-eed252ab2ac6.herokuapp.com/';

    // Handle adding a new item
    addItemForm.addEventListener('submit', (e) => {
        console.log('addEventListener submit CALLED');
        e.preventDefault();
        const clientId = document.getElementById('clientId').value;
        const type = document.getElementById('type').value;
        const position = document.getElementById('position').value;
        const text = document.getElementById('text').value;
        const length = document.getElementById('length').value;

        // Create a change DTO object
        const changeDto = {
            // The id field in changeDto is now a string, which is more consistent with how MongoDB ObjectIds are typically handled on the client side.
            id: Date.now().toString(), // Unique ID based on updatedAt, use string for consistency as backend
            type,
            position: parseInt(position, 10),
            vectorClock: {}, // Vector clock will be updated by the server
            clientId,
            text: type === 'insert' ? text : undefined,
            length: type === 'delete' ? parseInt(length, 10) : undefined,
            updatedAt: new Date().toISOString() // Add a updatedAt
            // Dates are consistently stored and transmitted as ISO 8601 strings.
        };

        console.log('Submitting new change:', changeDto);

        console.time("API CALL")

        // Send the changeDto to the server
        fetch(SERVER_BASE_URL + 'sync/client-changes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([changeDto]),
        })
            .then(response => {
                if (response.ok) {
                    console.log('Client change submitted successfully');
                    // Update the IndexedDB
                    worker.postMessage({ action: 'addItem', data: changeDto });
                } else {
                    console.error('Error submitting client change:', response.statusText);
                }
                console.timeEnd("API CALL")

            })
            .catch(error => {
                console.error('Error submitting client change:', error);
            });


    });

    // Handle fetching all data
    fetchDataButton.addEventListener('click', () => {
        console.log('Fetching all data from IndexedDB.');
        worker.postMessage({ action: 'fetchData' });
    });

    // Handle getting an item by Client ID
    getItemButton.addEventListener('click', () => {
        const clientId = clientIdInput.value;
        console.log('Fetching data for client ID:', clientId);
        worker.postMessage({
            action: 'getItemByClientId',
            clientId
        });
    });

    // Handle viewing the current document
    viewDocButton.addEventListener('click', () => {
        console.log('Fetching the current document.');
        worker.postMessage({ action: 'viewDoc' });
    });

    // Handle messages from the worker
    worker.onmessage = (event) => {
        const { action, data } = event.data;

        if (action === 'displayData') {
            console.log('Displaying fetched data:', data);
            dataDisplay.innerHTML = JSON.stringify(data, null, 2);
        } else if (action === 'displayItem') {
            console.log('Displaying fetched item:', data);
            message.innerText = data.length ? JSON.stringify(data, null, 2) : 'Item not found';
        } else if (action === 'displayDoc') {
            console.log('Displaying current document:', data);
            docDisplay.innerHTML = data;
        } else if (action === 'message') {
            console.log('Message from worker:', data);
            message.innerText = data;
        } else if (action === 'error') {
            console.error('Error:', data);
            message.innerText = data;
        } else {
            console.warn('Unknown action:', action);
        }
    };

    // Log any errors from the worker
    worker.onerror = (error) => {
        console.error('Error in worker:', error);
    };

    fetchServerChangesButton.addEventListener('click', () => {
        fetchServerChanges(lastFetchTime);
    });

    // Function to fetch server changes
    // function fetchServerChanges(since) {
    //     fetch(SERVER_BASE_URL + `sync/server-changes?since=${encodeURIComponent(since.toISOString())}`)
    //         .then(response => response.json())  // Step 1: Fetch data from the server and parse response as JSON
    //         .then(serverChanges => {  // Step 2: Process the JSON data received from the server
    //             console.log('Server changes received:', serverChanges);
    //             // Process the server changes (e.g., update the IndexedDB)
    //             serverChanges.forEach(change => {
    //                 worker.postMessage({ action: 'addItem', data: change });
    //             });
    //         })
    //         .catch(error => {  // Step 3: Handle errors if the fetch or JSON parsing fails
    //             console.error('Error fetching server changes:', error);
    //         });
    // }
    
    function fetchServerChanges(since) {
        console.log("START fetchServerChanges() , since.toISOString(): ",since.toISOString())
        fetch(SERVER_BASE_URL + `sync/server-changes?since=${encodeURIComponent(since.toISOString())}`)
        .then(response => response.json())
            .then(serverChanges => {
                console.log('Server changes received:', serverChanges);
                if (serverChanges.length > 0) {
                    // Update lastFetchTime to the latest change's updatedAt
                    lastFetchTime = new Date(Math.max(...serverChanges.map(change => new Date(change.updatedAt))));
                    console.log("fetchServerChanges(), New Fetch time set:", lastFetchTime.toISOString()); // Log as ISO string
                    // console("START fetchServerChanges() , since.toISOString(): ",since.toISOString())
                    
                    // Process the server changes
                    serverChanges.forEach(change => {
                        change.updatedAt = new Date(change.updatedAt).toISOString();
                        worker.postMessage({ action: 'addItem', data: change });
                    });

                    // Refresh the document view
                    worker.postMessage({ action: 'viewDoc' });
                } else {
                    console.log('No new changes from server');
                }
            })
            .catch(error => {
                console.error('Error fetching server changes:', error);
            });
    }

    // Call fetchServerChanges periodically or when needed
    // setInterval(() => {
    //     const lastFetchTime = new Date(); // Replace with the actual last fetch time
    //     fetchServerChanges(lastFetchTime);
    // }, 5000); // Fetch server changes every 5 seconds (adjust as needed)

    // Handle resetting the document
    resetDocumentButton.addEventListener('click', () => {
        const initialDocument = prompt('Enter the initial document:');
        if (initialDocument !== null) {
            fetch(SERVER_BASE_URL + 'sync/reset-document', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ initialDocument }),
            })
                .then(response => {
                    if (response.ok) {
                        console.log('Document reset successfully');
                        // You may need to update the IndexedDB and the UI here
                    } else {
                        console.error('Error resetting document:', response.statusText);
                    }
                })
                .catch(error => {
                    console.error('Error resetting document:', error);
                });
        }
    });

    // Handle applying an operation
    applyOperationButton.addEventListener('click', () => {
        const operation = {
            type: 'insert', // or 'delete'
            position: 5,
            text: ' World', // for inserts
            vectorClock: { client1: 1 },
            clientId: 'your-client-id',
        };

        fetch(SERVER_BASE_URL + 'sync/apply-operation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ operation }),
        })
            .then(response => {
                if (response.ok) {
                    console.log('Operation applied successfully');
                    // You may need to update the IndexedDB and the UI here
                } else {
                    console.error('Error applying operation:', response.statusText);
                }
            })
            .catch(error => {
                console.error('Error applying operation:', error);
            });
    });

    // Handle getting the current document
    getDocumentButton.addEventListener('click', () => {
        fetch(SERVER_BASE_URL + 'sync/document')
            .then(response => response.json())
            .then(data => {
                console.log('Current document:', data.document);
                // Update the UI with the current document
                const docDisplay = document.getElementById('docDisplay');
                docDisplay.innerHTML = data.document;
            })
            .catch(error => {
                console.error('Error retrieving document:', error);
            });
    });


    // Fetch server changes every 30 seconds
    setInterval(() => {
        fetchServerChanges(lastFetchTime);
    }, 30000);

});