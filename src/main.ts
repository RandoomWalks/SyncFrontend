import { Change, ChangeDto, convertChangeDtoToChange, VectorClock } from './types';
import storageService from './storageService';

let MYCLIENTID: string = "";
let MYCLIENTVC: { [clientId: string]: number } = {};
let currentDocument: string = '';
let currentVectorClock: VectorClock = {};
let pendingOperations: Change[] = [];
let lastFetchTime: Date = new Date(0);
let isSyncing: boolean = false;

const SERVER_LOCAL_BASE_URL = 'http://127.0.0.1:3000/';

// Initialize Web Worker
const worker = new Worker('worker.js');

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM is fully loaded');

    MYCLIENTID = await storageService.getClientId();
    const clientIdElement = document.getElementById('clientId');
    if (clientIdElement) {
        clientIdElement.textContent = MYCLIENTID;
    }
    console.log('Using MYCLIENTID:', MYCLIENTID);

    MYCLIENTVC = await storageService.getVectorClock();
    const clientVCElement = document.getElementById('clientVC');
    if (clientVCElement) {
        clientVCElement.textContent = JSON.stringify(MYCLIENTVC);
    }
    console.log('Using MYCLIENTVC:', MYCLIENTVC);

    // Connect to the server and fetch the updated server VC
    await connectToServer();


    const editor = document.getElementById('editor') as HTMLTextAreaElement;
    const operationForm = document.getElementById('operationForm') as HTMLFormElement;
    const syncButton = document.getElementById('syncButton') as HTMLButtonElement;
    const fetchChangesButton = document.getElementById('fetchChangesButton') as HTMLButtonElement;
    const viewDocButton = document.getElementById('viewDocButton') as HTMLButtonElement;
    const showDebugInfoButton = document.getElementById('showDebugInfo') as HTMLButtonElement;

    editor.addEventListener('input', debounce(handleEditorChange, 500));
    operationForm.addEventListener('submit', handleManualOperation);
    syncButton.addEventListener('click', () => syncChanges(pendingOperations));
    fetchChangesButton.addEventListener('click', fetchServerChanges);
    viewDocButton.addEventListener('click', viewDoc);
    showDebugInfoButton.addEventListener('click', toggleDebugInfo);


    window.addEventListener('online', () => {
        console.log('Back online, syncing changes...');
        syncChanges(pendingOperations);
    });
    
    window.addEventListener('offline', () => {  
        console.log('Offline mode detected');
        // Implement offline mode UI updates
    });

    const clearDBButton = document.getElementById('clearDbButton');
    if (clearDBButton !== null) {
        clearDBButton.addEventListener('click', async () => {
            // Your event listener logic here
            try {
                const response = await fetch(SERVER_LOCAL_BASE_URL + '/sync/clear-db', { method: 'DELETE' });
                const result = await response.json();
                if (result.success) {
                    console.log('Database cleared successfully');
                    // // Optionally, clear the editor here

                    const editorElement = document.getElementById('editor') as HTMLTextAreaElement;
                    if (editorElement !== null) {
                        editorElement.value = '';
                    } else {
                        console.error('Element with ID "editor" not found');
                    }


                } else {
                    console.error('Failed to clear database:', result.message);
                }
            } catch (error) {
                console.error('Error clearing database:', error);
            }
        });
    } else {
        console.error('Element with ID "clearDbButton" not found');
    }

    const resetDocButton = document.getElementById('resetDocumentButton');
    if (resetDocButton !== null) {
        resetDocButton.addEventListener('click', async () => {
            try {
                const initialContent = document.getElementById('initialContentInput') as HTMLInputElement;
                const response = await fetch(SERVER_LOCAL_BASE_URL + '/sync/reset-document', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ initialContent })
                });
                const result = await response.json();
                if (result.success) {
                    console.log('Document reset successfully');
                    const editorElement = document.getElementById('editor') as HTMLTextAreaElement;
                    if (editorElement !== null) {
                        editorElement.value = initialContent.value;
                    } else {
                        console.error('Element with ID "editor" not found');
                    }
                } else {
                    console.error('Failed to reset document:', result.message);
                }
            } catch (error) {
                console.error('Error resetting document:', error);
            }
        })
    }
    // document.getElementById('resetDocumentButton').addEventListener('click', async () => {
    //     const initialContent = document.getElementById('initialContentInput') as HTMLInputElement;

    //     try {
    //         const response = await fetch('/sync/reset-document', {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ initialContent })
    //         });
    //         const result = await response.json();
    //         if (result.success) {
    //             console.log('Document reset successfully');
    //             document.getElementById('editor').value = initialContent;
    //         } else {
    //             console.error('Failed to reset document:', result.message);
    //         }
    //     } catch (error) {
    //         console.error('Error resetting document:', error);
    //     }
    // });


    // Initial document fetch
    await fetchServerChanges();
});

async function connectToServer() {
    try {
        const _MYCLIENTVC = await storageService.getVectorClock();
        console.log("connectToServer:", JSON.stringify(_MYCLIENTVC));

        const response = await fetch(SERVER_LOCAL_BASE_URL + 'sync/client-connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: MYCLIENTID, vectorClock: _MYCLIENTVC }),
        });

        if (response.ok) {
            const result = await response.json();
            if (result.serverVC) {
                MYCLIENTVC = result.serverVC;
                await storageService.setVectorClock(MYCLIENTVC);
                console.log('Updated vector clock from server:', MYCLIENTVC);

                if (result.needSync) {
                    console.log('Server indicates need for sync. Fetching changes...');
                    await fetchServerChanges();
                }
            } else {
                console.error('Failed to get server vector clock');
            }
        } else {
            console.error('Error connecting to server:', response.statusText);
        }
    } catch (error) {
        console.error('Error during server connection:', error);
    }
}


function debounce(func: (...args: any[]) => void, wait: number) {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function handleEditorChange(event: Event) {
    console.log('Editor content changed');
    const newText = (event.target as HTMLTextAreaElement).value;
    console.log('New text:', newText);
    const change = await generateChangeFromEdit(currentDocument, newText);
    if (change) {
        console.log('Generated change:', change);
        currentDocument = newText;
        pendingOperations.push(change);
        await syncChanges([change]); ``
    }
}

async function generateChangeFromEdit(oldText: string, newText: string): Promise<Change | null> {
    if (newText.length > oldText.length) {
        const position = oldText.length;
        const text = newText.slice(oldText.length);
        console.log('Change detected: Insert', text, 'at position', position);
        return await createChange('insert', position, text);
    } else if (newText.length < oldText.length) {
        const position = newText.length;
        const length = oldText.length - newText.length;
        console.log('Change detected: Delete length', length, 'at position', position);
        return await createChange('delete', position, undefined, length);
    }
    console.log('No change detected');
    return null;
}

async function handleManualOperation(event: Event) {
    event.preventDefault();
    console.log('Manual operation triggered');
    const type = (document.getElementById('operationType') as HTMLSelectElement).value;
    const position = parseInt((document.getElementById('position') as HTMLInputElement).value, 10);
    const text = (document.getElementById('text') as HTMLInputElement).value;
    const length = parseInt((document.getElementById('length') as HTMLInputElement).value, 10);

    const change = await createChange(type, position, text, length);
    console.log('Manual change created:', change);
    pendingOperations.push(change);
    await syncChanges([change]);
}

async function createChange(type: string, position: number, text?: string, length?: number): Promise<Change> {
    console.log(`Creating change of type ${type} at position ${position}`);
    
    let change = {
        type,
        position,
        text,
        length,
        clientId: MYCLIENTID,
        vectorClock: { ...MYCLIENTVC },
        updatedAt: new Date().toISOString()
    };
    storageService.updateVectorClock(MYCLIENTID);
    MYCLIENTVC = await storageService.getVectorClock();
    return change;
}

async function syncChanges(changes: Change[]) {
    if (isSyncing) {
        console.log('Sync already in progress, skipping');
        return;
    }
    isSyncing = true;
    console.log("Client #", MYCLIENTID, " set isSyncing TRUE");

    try {
        console.log('Syncing changes:', changes);
        const response = await fetch(SERVER_LOCAL_BASE_URL + 'sync/client-changes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(changes),
        });

        if (response.ok) {
            console.log('sync/client-changes OK');
            const result = await response.json();
            console.log('sync/client-changes result:', result);

            if (result.success) {
                console.log('Client changes submitted successfully');
                changes.forEach(change => applyChangeLocally(change));
                pendingOperations = pendingOperations.filter(op => !changes.includes(op));

                if (result.serverVC) {
                    MYCLIENTVC = result.serverVC;
                    await storageService.setVectorClock(MYCLIENTVC);
                    console.log('Updated vector clock:', MYCLIENTVC);
                }

            } else if (result.changes && Array.isArray(result.changes)) {
                console.log('Client out of sync, applying server changes');
                console.log('server changes:', result.changes);
                result.changes.forEach((change: ChangeDto) => applyChangeLocally(convertChangeDtoToChange(change)));
                await fetchServerChanges(); // Fetch any additional changes

            }  else if (!result.success && !result.changes) {
                console.error('Sync failed:', result.message);
                throw new Error('!result.success && server changes result dont have changes[]');

                // Implement retry logic or user notification here
            } else {
                throw new Error('server changes result dont have changes[]');
            }

            // Validate vector clock before saving
            if (await storageService.validateVectorClock(result.serverVC)) {
                MYCLIENTVC = result.serverVC;
                console.log('Updated vector clock:', MYCLIENTVC);
                await storageService.setVectorClock(MYCLIENTVC);
            } else {
                console.error('Vector clock validation failed:', result.serverVC);
            }

        } else {
            console.error('Error submitting client change:', response.statusText);
        }

        await fetchServerChanges();
    } catch (error) {
        console.error('Error during sync:', error);
    } finally {
        console.log("Client #", MYCLIENTID, " set isSyncing FALSE");
        isSyncing = false;
    }
}

async function fetchServerChanges() {
    console.log('Fetching server changes');
    const clientVC = await storageService.getVectorClock();
    console.log('Client vector clock:', clientVC);

    try {
        const response = await fetch(SERVER_LOCAL_BASE_URL + `sync/server-changes?vectorClock=${encodeURIComponent(JSON.stringify(clientVC))}`);
        const result = await response.json();

        if (result.success && result.changes && Array.isArray(result.changes)) {
            result.changes.forEach((changeDto: ChangeDto) => {
                const change = convertChangeDtoToChange(changeDto);
                if (change.clientId !== MYCLIENTID) {
                    console.log('Applying server change:', change);
                    applyChangeLocally(change);
                } else {
                    console.log("Received own update, updating vector clock", change);
                }
            });

            if (result.serverVC) {
                MYCLIENTVC = result.serverVC;
                await storageService.setVectorClock(MYCLIENTVC);
                console.log('Updated vector clock after fetching server changes:', MYCLIENTVC);
            }

            // Validate vector clock before saving
            if (await storageService.validateVectorClock(result.serverVC)) {
                MYCLIENTVC = result.serverVC;
                console.log('Updated vector clock after fetching server changes:', MYCLIENTVC);
                await storageService.setVectorClock(MYCLIENTVC);
            } else {
                console.error('Vector clock validation failed:', result.serverVC);
            }
            updateEditor();
        } else {
            console.log('No new changes from server');
        }
    } catch (error) {
        console.error('Error fetching server changes:', error);
    }
}

function applyChangeLocally(change: Change) {
    console.log('Applying change locally:', change);
    if (change.type === 'insert') {
        currentDocument = currentDocument.slice(0, change.position) + (change.text || '') + currentDocument.slice(change.position);
    } else if (change.type === 'delete') {
        const deleteLength = change.length != null ? change.length : 0;
        currentDocument = currentDocument.slice(0, change.position) + currentDocument.slice(change.position + deleteLength);
    }
    updateEditor();
}

function updateEditor() {
    const editor = document.getElementById('editor') as HTMLTextAreaElement;
    editor.value = currentDocument;
    console.log('Editor updated with current document:', currentDocument);
}

function viewDoc() {
    const docDisplay = document.getElementById('docDisplay');
    if (docDisplay) {
        docDisplay.textContent = currentDocument;
    }
    console.log('Document viewed:', currentDocument);
}

function toggleDebugInfo() {
    const debugInfo = document.getElementById('debugInfo');
    if (debugInfo) {
        if (debugInfo.style.display === 'none') {
            debugInfo.style.display = 'block';
            debugInfo.textContent = JSON.stringify({
                clientId: MYCLIENTID,
                vectorClock: MYCLIENTVC,
                pendingOperations: pendingOperations
            }, null, 2);
            console.log('Debug info displayed:', debugInfo.textContent);
        } else {
            debugInfo.style.display = 'none';
            console.log('Debug info hidden');
        }
    }
}

// Worker message handling
worker.onmessage = (event) => {
    const { action, data } = event.data;
    console.log(`Received action from worker: ${action}, data: ${data}`);
    // Handle worker messages if needed
};

// // Initialize sync interval
// setInterval(() => {
//     if (pendingOperations.length > 0) {
//         syncChanges(pendingOperations);
//     } else {
//         fetchServerChanges();
//     }
// }, 5000);
