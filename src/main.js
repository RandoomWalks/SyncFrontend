import storageService from './storageService.js';

document.addEventListener('DOMContentLoaded', async () => {
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

    // Initialize Web Worker
    const worker = new Worker('worker.js');
    console.log('Web Worker initialized.');
    const SERVER_BASE_URL = 'https://nestjs-service-app-eed252ab2ac6.herokuapp.com/';

    // Initialize clientId
    let clientId = await storageService.getClientId();
    console.log('Using clientId:', clientId);

    // Handle adding a new item
    addItemForm.addEventListener('submit', (e) => {
        console.log('addEventListener submit CALLED');
        e.preventDefault();
        const type = document.getElementById('type').value;
        const position = document.getElementById('position').value;
        const text = document.getElementById('text').value;
        const length = document.getElementById('length').value;

        // Create a change DTO object
        const changeDto = {
            id: Date.now().toString(), // Unique ID based on updatedAt
            type,
            position: parseInt(position, 10),
            vectorClock: {}, // Vector clock will be updated by the server
            clientId,
            text: type === 'insert' ? text : undefined,
            length: type === 'delete' ? parseInt(fetchServerChangeslength, 10) : undefined,
            updatedAt: new Date().toISOString() // Add a updatedAt
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

    function fetchServerChanges(since) {
        console.log("START fetchServerChanges() , since.toISOString(): ",since.toISOString())
        fetch(SERVER_BASE_URL + `sync/server-changes?since=${encodeURIComponent(since.toISOString())}`)
        .then(response => response.json())
            .then(serverChanges => {
                console.log('Server changes received:', serverChanges);
                if (serverChanges.length > 0) {
                    lastFetchTime = new Date(Math.max(...serverChanges.map(change => new Date(change.updatedAt))));
                    console.log("fetchServerChanges(), New Fetch time set:", lastFetchTime.toISOString()); // Log as ISO string
                    
                    serverChanges.forEach(change => {
                        change.updatedAt = new Date(change.updatedAt).toISOString();
                        worker.postMessage({ action: 'addItem', data: change });
                    });

                    worker.postMessage({ action: 'viewDoc' });
                } else {
                    console.log('No new changes from server');
                }
            })
            .catch(error => {
                console.error('Error fetching server changes:', error);
            });
    }

    setInterval(() => {
        fetchServerChanges(lastFetchTime);
    }, 30000);
});
