document.addEventListener('DOMContentLoaded', () => {
    const addItemForm = document.getElementById('addItemForm');
    const fetchDataButton = document.getElementById('fetchDataButton');
    const dataDisplay = document.getElementById('dataDisplay');
    const getItemButton = document.getElementById('getItemButton');
    const clientIdInput = document.getElementById('clientIdInput');
    const message = document.getElementById('message');
    const viewDocButton = document.getElementById('viewDocButton');
    const docDisplay = document.getElementById('docDisplay');

    // Initialize Web Worker
    const worker = new Worker('worker.js');
    console.log('Web Worker initialized.');

    // Handle adding a new item
    addItemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const clientId = document.getElementById('clientId').value;
        const type = document.getElementById('type').value;
        const position = document.getElementById('position').value;
        const text = document.getElementById('text').value;
        const length = document.getElementById('length').value;

        // Create a change DTO object
        const changeDto = {
            id: Date.now(), // Unique ID based on timestamp
            type,
            position: parseInt(position, 10),
            vectorClock: {}, // Vector clock will be updated by the server
            clientId,
            text: type === 'insert' ? text : undefined,
            length: type === 'delete' ? parseInt(length, 10) : undefined,
            timestamp: new Date().toISOString() // Add a timestamp
        };

        console.log('Submitting new change:', changeDto);
        worker.postMessage({
            action: 'addItem',
            data: changeDto
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
});
