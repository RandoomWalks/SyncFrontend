import { Change, ChangeDto, convertChangeDtoToChange, VectorClock } from './types';
import storageService from './storageService';

let MYCLIENTID: string;
let currentDocument = '';
let currentVectorClock: VectorClock = {};
let pendingOperations: Change[] = [];
let lastFetchTime = new Date(0);
let isSyncing = false;

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

    // Initial document fetch
    await fetchServerChanges();
});

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
    const change = generateChangeFromEdit(currentDocument, newText);
    if (change) {
        console.log('Generated change:', change);
        currentDocument = newText;
        pendingOperations.push(change);
        await syncChanges([change]);
    }
}

function generateChangeFromEdit(oldText: string, newText: string): Change | null {
    if (newText.length > oldText.length) {
        const position = oldText.length;
        const text = newText.slice(oldText.length);
        console.log('Change detected: Insert', text, 'at position', position);
        return createChange('insert', position, text);
    } else if (newText.length < oldText.length) {
        const position = newText.length;
        const length = oldText.length - newText.length;
        console.log('Change detected: Delete length', length, 'at position', position);
        return createChange('delete', position, undefined, length);
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

    const change = createChange(type, position, text, length);
    console.log('Manual change created:', change);
    pendingOperations.push(change);
    await syncChanges([change]);
}

function createChange(type: string, position: number, text?: string, length?: number): Change {
    console.log(`Creating change of type ${type} at position ${position}`);
    return {
        type,
        position,
        text,
        length,
        clientId: MYCLIENTID,
        vectorClock: { ...currentVectorClock },
        updatedAt: new Date().toISOString()
    };
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
            const result = await response.json();
            if (result.success) {
                console.log('Client changes submitted successfully');
                changes.forEach(change => applyChangeLocally(change));
                pendingOperations = pendingOperations.filter(op => !changes.includes(op));
            } else {
                console.log('Client out of sync, applying server changes');
                if (result.changes && Array.isArray(result.changes)) {
                    result.changes.forEach((change: ChangeDto) => applyChangeLocally(convertChangeDtoToChange(change)));
                }
            }
            currentVectorClock = result.serverVC;
            console.log('Updated vector clock:', currentVectorClock);
            await storageService.setVectorClock(currentVectorClock);
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
        
        if (result.changes && Array.isArray(result.changes)) {
            result.changes.forEach((changeDto: ChangeDto) => {
                const change = convertChangeDtoToChange(changeDto);
                if (change.clientId !== MYCLIENTID) {
                    console.log('Applying server change:', change);
                    applyChangeLocally(change);
                } else {
                    console.log("Received own update, updating vector clock", change);
                }
            });
            currentVectorClock = result.serverVC;
            console.log('Updated vector clock after fetching server changes:', currentVectorClock);
            await storageService.setVectorClock(currentVectorClock);
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
                vectorClock: currentVectorClock,
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
