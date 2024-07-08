import { Change } from './types';
import storageService from './storageService';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM is fully loaded');

    const addItemForm = document.getElementById('addItemForm') as HTMLFormElement;
    const fetchDataButton = document.getElementById('fetchDataButton') as HTMLButtonElement;
    const dataDisplay = document.getElementById('dataDisplay') as HTMLDivElement;
    const getItemButton = document.getElementById('getItemButton') as HTMLButtonElement;
    const clientIdInput = document.getElementById('clientIdInput') as HTMLInputElement;
    const message = document.getElementById('message') as HTMLDivElement;
    const viewDocButton = document.getElementById('viewDocButton') as HTMLButtonElement;
    const docDisplay = document.getElementById('docDisplay') as HTMLDivElement;
    const resetDocumentButton = document.getElementById('resetDocumentButton') as HTMLButtonElement;
    const applyOperationButton = document.getElementById('applyOperationButton') as HTMLButtonElement;
    const getDocumentButton = document.getElementById('getDocumentButton') as HTMLButtonElement;
    const fetchServerChangesButton = document.getElementById('fetchServerChangesButton') as HTMLButtonElement;
    let lastFetchTime = new Date(0); // Initialize to epoch time

    // Initialize Web Worker
    const worker = new Worker('worker.js');
    console.log('Web Worker initialized.');
    const SERVER_BASE_URL = 'https://nestjs-service-app-eed252ab2ac6.herokuapp.com/';

    // Initialize clientId
    let clientId = await storageService.getClientId();
    console.log('Using clientId:', clientId);

    // Handle adding a new item
    addItemForm.addEventListener('submit', async (e: Event) => {
        console.log('addEventListener submit CALLED');
        e.preventDefault();
        const type = (document.getElementById('type') as HTMLSelectElement).value;
        const position = (document.getElementById('position') as HTMLInputElement).value;
        const text = (document.getElementById('text') as HTMLInputElement).value;
        const length = (document.getElementById('length') as HTMLInputElement).value;

        // Create a change DTO object
        const changeDto: Change = {
            updatedAt: new Date().toISOString(),
            type,
            position: parseInt(position, 10),
            clientId,
            text: type === 'insert' ? text : undefined,
            length: type === 'delete' ? parseInt(length, 10) : undefined,
            vectorClock: {}
        };

        console.log('Submitting new change:', changeDto);

        console.time("API CALL");

        // Send the changeDto to the server
        try {
            const response = await fetch(SERVER_BASE_URL + 'sync/client-changes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([changeDto]),
            });

            if (response.ok) {
                console.log('Client change submitted successfully');
                // Update the IndexedDB
                worker.postMessage({ action: 'addItem', data: changeDto });
            } else {
                console.error('Error submitting client change:', response.statusText);
            }
            console.timeEnd("API CALL");
        } catch (error) {
            console.error('Error submitting client change:', error);
        }
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
    worker.onmessage = (event: MessageEvent) => {
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
    worker.onerror = (error: ErrorEvent) => {
        console.error('Error in worker:', error);
    };

    fetchServerChangesButton.addEventListener('click', () => {
        fetchServerChanges(lastFetchTime);
    });

    function fetchServerChanges(since: Date) {
        console.log("START fetchServerChanges() , since.toISOString(): ", since.toISOString());
        fetch(SERVER_BASE_URL + `sync/server-changes?since=${encodeURIComponent(since.toISOString())}`)
            .then(response => response.json())
            .then((serverChanges: Change[]) => {
                console.log('Server changes received:', serverChanges);
                if (serverChanges.length > 0) {
                    lastFetchTime = new Date(Math.max(...serverChanges.map((change: Change) => new Date(change.updatedAt).getTime())));

                    // lastFetchTime = new Date(Math.max(...serverChanges.map((change: Change) => new Date(change.updatedAt))));
                    console.log("fetchServerChanges(), New Fetch time set:", lastFetchTime.toISOString());

                    serverChanges.forEach((change: Change) => {
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
