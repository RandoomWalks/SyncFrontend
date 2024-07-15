/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const types_1 = __webpack_require__(/*! ./types */ "./src/types.ts");
const storageService_1 = __importDefault(__webpack_require__(/*! ./storageService */ "./src/storageService.ts"));
let MYCLIENTID;
let currentDocument = '';
let currentVectorClock = {};
let pendingOperations = [];
let lastFetchTime = new Date(0);
let isSyncing = false;
const SERVER_LOCAL_BASE_URL = 'http://127.0.0.1:3000/';
// Initialize Web Worker
const worker = new Worker('worker.js');
document.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('DOM is fully loaded');
    MYCLIENTID = yield storageService_1.default.getClientId();
    const clientIdElement = document.getElementById('clientId');
    if (clientIdElement) {
        clientIdElement.textContent = MYCLIENTID;
    }
    console.log('Using MYCLIENTID:', MYCLIENTID);
    const editor = document.getElementById('editor');
    const operationForm = document.getElementById('operationForm');
    const syncButton = document.getElementById('syncButton');
    const fetchChangesButton = document.getElementById('fetchChangesButton');
    const viewDocButton = document.getElementById('viewDocButton');
    const showDebugInfoButton = document.getElementById('showDebugInfo');
    editor.addEventListener('input', debounce(handleEditorChange, 500));
    operationForm.addEventListener('submit', handleManualOperation);
    syncButton.addEventListener('click', () => syncChanges(pendingOperations));
    fetchChangesButton.addEventListener('click', fetchServerChanges);
    viewDocButton.addEventListener('click', viewDoc);
    showDebugInfoButton.addEventListener('click', toggleDebugInfo);
    const clearDBButton = document.getElementById('clearDbButton');
    if (clearDBButton !== null) {
        clearDBButton.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
            // Your event listener logic here
            try {
                const response = yield fetch('/sync/clear-db', { method: 'DELETE' });
                const result = yield response.json();
                if (result.success) {
                    console.log('Database cleared successfully');
                    // // Optionally, clear the editor here
                    const editorElement = document.getElementById('editor');
                    if (editorElement !== null) {
                        editorElement.value = '';
                    }
                    else {
                        console.error('Element with ID "editor" not found');
                    }
                }
                else {
                    console.error('Failed to clear database:', result.message);
                }
            }
            catch (error) {
                console.error('Error clearing database:', error);
            }
        }));
    }
    else {
        console.error('Element with ID "clearDbButton" not found');
    }
    const resetDocButton = document.getElementById('resetDocumentButton');
    if (resetDocButton !== null) {
        resetDocButton.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const initialContent = document.getElementById('initialContentInput');
                const response = yield fetch('/sync/reset-document', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ initialContent })
                });
                const result = yield response.json();
                if (result.success) {
                    console.log('Document reset successfully');
                    const editorElement = document.getElementById('editor');
                    if (editorElement !== null) {
                        editorElement.value = initialContent.value;
                    }
                    else {
                        console.error('Element with ID "editor" not found');
                    }
                }
                else {
                    console.error('Failed to reset document:', result.message);
                }
            }
            catch (error) {
                console.error('Error resetting document:', error);
            }
        }));
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
    yield fetchServerChanges();
}));
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
function handleEditorChange(event) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Editor content changed');
        const newText = event.target.value;
        console.log('New text:', newText);
        const change = generateChangeFromEdit(currentDocument, newText);
        if (change) {
            console.log('Generated change:', change);
            currentDocument = newText;
            pendingOperations.push(change);
            yield syncChanges([change]);
        }
    });
}
function generateChangeFromEdit(oldText, newText) {
    if (newText.length > oldText.length) {
        const position = oldText.length;
        const text = newText.slice(oldText.length);
        console.log('Change detected: Insert', text, 'at position', position);
        return createChange('insert', position, text);
    }
    else if (newText.length < oldText.length) {
        const position = newText.length;
        const length = oldText.length - newText.length;
        console.log('Change detected: Delete length', length, 'at position', position);
        return createChange('delete', position, undefined, length);
    }
    console.log('No change detected');
    return null;
}
function handleManualOperation(event) {
    return __awaiter(this, void 0, void 0, function* () {
        event.preventDefault();
        console.log('Manual operation triggered');
        const type = document.getElementById('operationType').value;
        const position = parseInt(document.getElementById('position').value, 10);
        const text = document.getElementById('text').value;
        const length = parseInt(document.getElementById('length').value, 10);
        const change = createChange(type, position, text, length);
        console.log('Manual change created:', change);
        pendingOperations.push(change);
        yield syncChanges([change]);
    });
}
function createChange(type, position, text, length) {
    console.log(`Creating change of type ${type} at position ${position}`);
    return {
        type,
        position,
        text,
        length,
        clientId: MYCLIENTID,
        vectorClock: Object.assign({}, currentVectorClock),
        updatedAt: new Date().toISOString()
    };
}
function syncChanges(changes) {
    return __awaiter(this, void 0, void 0, function* () {
        if (isSyncing) {
            console.log('Sync already in progress, skipping');
            return;
        }
        isSyncing = true;
        console.log("Client #", MYCLIENTID, " set isSyncing TRUE");
        try {
            console.log('Syncing changes:', changes);
            const response = yield fetch(SERVER_LOCAL_BASE_URL + 'sync/client-changes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(changes),
            });
            if (response.ok) {
                const result = yield response.json();
                if (result.success) {
                    console.log('Client changes submitted successfully');
                    changes.forEach(change => applyChangeLocally(change));
                    pendingOperations = pendingOperations.filter(op => !changes.includes(op));
                }
                else {
                    console.log('Client out of sync, applying server changes');
                    if (result.changes && Array.isArray(result.changes)) {
                        result.changes.forEach((change) => applyChangeLocally((0, types_1.convertChangeDtoToChange)(change)));
                    }
                }
                currentVectorClock = result.serverVC;
                console.log('Updated vector clock:', currentVectorClock);
                yield storageService_1.default.setVectorClock(currentVectorClock);
            }
            else {
                console.error('Error submitting client change:', response.statusText);
            }
            yield fetchServerChanges();
        }
        catch (error) {
            console.error('Error during sync:', error);
        }
        finally {
            console.log("Client #", MYCLIENTID, " set isSyncing FALSE");
            isSyncing = false;
        }
    });
}
function fetchServerChanges() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Fetching server changes');
        const clientVC = yield storageService_1.default.getVectorClock();
        console.log('Client vector clock:', clientVC);
        try {
            const response = yield fetch(SERVER_LOCAL_BASE_URL + `sync/server-changes?vectorClock=${encodeURIComponent(JSON.stringify(clientVC))}`);
            const result = yield response.json();
            if (result.changes && Array.isArray(result.changes)) {
                result.changes.forEach((changeDto) => {
                    const change = (0, types_1.convertChangeDtoToChange)(changeDto);
                    if (change.clientId !== MYCLIENTID) {
                        console.log('Applying server change:', change);
                        applyChangeLocally(change);
                    }
                    else {
                        console.log("Received own update, updating vector clock", change);
                    }
                });
                currentVectorClock = result.serverVC;
                console.log('Updated vector clock after fetching server changes:', currentVectorClock);
                yield storageService_1.default.setVectorClock(currentVectorClock);
                updateEditor();
            }
            else {
                console.log('No new changes from server');
            }
        }
        catch (error) {
            console.error('Error fetching server changes:', error);
        }
    });
}
function applyChangeLocally(change) {
    console.log('Applying change locally:', change);
    if (change.type === 'insert') {
        currentDocument = currentDocument.slice(0, change.position) + (change.text || '') + currentDocument.slice(change.position);
    }
    else if (change.type === 'delete') {
        const deleteLength = change.length != null ? change.length : 0;
        currentDocument = currentDocument.slice(0, change.position) + currentDocument.slice(change.position + deleteLength);
    }
    updateEditor();
}
function updateEditor() {
    const editor = document.getElementById('editor');
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
        }
        else {
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


/***/ }),

/***/ "./src/storageService.ts":
/*!*******************************!*\
  !*** ./src/storageService.ts ***!
  \*******************************/
/***/ (function(__unused_webpack_module, exports) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const DB_NAME = 'myAppDB';
const DB_VERSION = 1;
const CLIENT_STORE = 'clientStore';
const CLIENT_ID_KEY = 'clientId';
const CLIENT_VC_KEY = 'vectorClock';
class StorageService {
    constructor() {
        this.db = null;
        this.clientIdCache = null;
        this.clockCache = null;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db) {
                this.db = yield this.openDB();
            }
        });
    }
    openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(CLIENT_STORE)) {
                    db.createObjectStore(CLIENT_STORE, { keyPath: 'key' });
                }
            };
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }
    getVectorClock() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.clockCache)
                return this.clockCache;
            yield this.init();
            try {
                const result = yield this.get(CLIENT_STORE, CLIENT_VC_KEY);
                if (result) {
                    this.clockCache = result.value;
                }
                else {
                    this.clockCache = {};
                    yield this.setVectorClock(this.clockCache);
                }
                return this.clockCache;
            }
            catch (error) {
                console.error('Error getting vector clock:', error);
                return this.fallbackGetClockCache();
            }
        });
    }
    updateVectorClock(clientId) {
        return __awaiter(this, void 0, void 0, function* () {
            let vectorClock = yield this.getVectorClock();
            vectorClock[clientId] = (vectorClock[clientId] || 0) + 1;
            // Save the updated vector clock to IndexedDB
            this.setVectorClock(vectorClock);
        });
    }
    setVectorClock(clock) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.init();
            try {
                yield this.put(CLIENT_STORE, { key: CLIENT_VC_KEY, value: clock });
                this.clockCache = clock;
            }
            catch (error) {
                console.error('Error setting vector clock:', error);
                this.fallbackSetClockCache(clock);
            }
        });
    }
    fallbackGetClockCache() {
        let clock = localStorage.getItem(CLIENT_VC_KEY);
        if (!clock) {
            clock = JSON.stringify({});
            localStorage.setItem(CLIENT_VC_KEY, clock);
        }
        return JSON.parse(clock);
    }
    fallbackSetClockCache(clock) {
        localStorage.setItem(CLIENT_VC_KEY, JSON.stringify(clock));
    }
    getClientId() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.clientIdCache)
                return this.clientIdCache;
            yield this.init();
            try {
                const result = yield this.get(CLIENT_STORE, CLIENT_ID_KEY);
                if (result) {
                    this.clientIdCache = result.value;
                }
                else {
                    this.clientIdCache = crypto.randomUUID();
                    yield this.setClientId(this.clientIdCache);
                }
                return this.clientIdCache;
            }
            catch (error) {
                console.error('Error getting clientId:', error);
                return this.fallbackGetClientId();
            }
        });
    }
    setClientId(clientId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.init();
            try {
                yield this.put(CLIENT_STORE, { key: CLIENT_ID_KEY, value: clientId });
                this.clientIdCache = clientId;
            }
            catch (error) {
                console.error('Error setting clientId:', error);
                this.fallbackSetClientId(clientId);
            }
        });
    }
    fallbackGetClientId() {
        let clientId = localStorage.getItem(CLIENT_ID_KEY);
        if (!clientId) {
            clientId = crypto.randomUUID();
            localStorage.setItem(CLIENT_ID_KEY, clientId);
        }
        return clientId;
    }
    fallbackSetClientId(clientId) {
        localStorage.setItem(CLIENT_ID_KEY, clientId);
    }
    get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }
    put(storeName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(value);
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }
}
const storageService = new StorageService();
exports["default"] = storageService;


/***/ }),

/***/ "./src/types.ts":
/*!**********************!*\
  !*** ./src/types.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.convertChangeDtoToChange = convertChangeDtoToChange;
exports.mergeVectorClocks = mergeVectorClocks;
exports.compareVectorClocks = compareVectorClocks;
function convertChangeDtoToChange(dto) {
    return {
        id: `${dto.clientId}-${dto.updatedAt || new Date().toISOString()}`,
        updatedAt: dto.updatedAt || new Date().toISOString(),
        type: dto.type,
        position: dto.position,
        clientId: dto.clientId,
        text: dto.text,
        length: dto.length,
        vectorClock: Object.assign({}, dto.vectorClock)
    };
}
function mergeVectorClocks(vc1, vc2) {
    const merged = Object.assign({}, vc1);
    for (const clientId in vc2) {
        merged[clientId] = Math.max(merged[clientId] || 0, vc2[clientId]);
    }
    return merged;
}
function compareVectorClocks(vc1, vc2) {
    let isLess = false;
    let isGreater = false;
    for (const clientId in vc1) {
        if (!(clientId in vc2) || vc1[clientId] > vc2[clientId]) {
            isGreater = true;
        }
        else if (vc1[clientId] < vc2[clientId]) {
            isLess = true;
        }
    }
    for (const clientId in vc2) {
        if (!(clientId in vc1)) {
            isLess = true;
        }
    }
    if (isGreater && isLess)
        return 0; // Concurrent
    if (isGreater)
        return 1;
    if (isLess)
        return -1;
    return 0; // Equal
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/main.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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RUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7VUV0QkE7VUFDQTtVQUNBO1VBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9mcm9udGVuZF9taW5pbWFsX2Zvcl9vdF9jaGFuZ2UvLi9zcmMvbWFpbi50cyIsIndlYnBhY2s6Ly9mcm9udGVuZF9taW5pbWFsX2Zvcl9vdF9jaGFuZ2UvLi9zcmMvc3RvcmFnZVNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmRfbWluaW1hbF9mb3Jfb3RfY2hhbmdlLy4vc3JjL3R5cGVzLnRzIiwid2VicGFjazovL2Zyb250ZW5kX21pbmltYWxfZm9yX290X2NoYW5nZS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9mcm9udGVuZF9taW5pbWFsX2Zvcl9vdF9jaGFuZ2Uvd2VicGFjay9iZWZvcmUtc3RhcnR1cCIsIndlYnBhY2s6Ly9mcm9udGVuZF9taW5pbWFsX2Zvcl9vdF9jaGFuZ2Uvd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL2Zyb250ZW5kX21pbmltYWxfZm9yX290X2NoYW5nZS93ZWJwYWNrL2FmdGVyLXN0YXJ0dXAiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hd2FpdGVyID0gKHRoaXMgJiYgdGhpcy5fX2F3YWl0ZXIpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xuICAgIH0pO1xufTtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IHR5cGVzXzEgPSByZXF1aXJlKFwiLi90eXBlc1wiKTtcbmNvbnN0IHN0b3JhZ2VTZXJ2aWNlXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vc3RvcmFnZVNlcnZpY2VcIikpO1xubGV0IE1ZQ0xJRU5USUQ7XG5sZXQgY3VycmVudERvY3VtZW50ID0gJyc7XG5sZXQgY3VycmVudFZlY3RvckNsb2NrID0ge307XG5sZXQgcGVuZGluZ09wZXJhdGlvbnMgPSBbXTtcbmxldCBsYXN0RmV0Y2hUaW1lID0gbmV3IERhdGUoMCk7XG5sZXQgaXNTeW5jaW5nID0gZmFsc2U7XG5jb25zdCBTRVJWRVJfTE9DQUxfQkFTRV9VUkwgPSAnaHR0cDovLzEyNy4wLjAuMTozMDAwLyc7XG4vLyBJbml0aWFsaXplIFdlYiBXb3JrZXJcbmNvbnN0IHdvcmtlciA9IG5ldyBXb3JrZXIoJ3dvcmtlci5qcycpO1xuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IF9fYXdhaXRlcih2b2lkIDAsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgIGNvbnNvbGUubG9nKCdET00gaXMgZnVsbHkgbG9hZGVkJyk7XG4gICAgTVlDTElFTlRJRCA9IHlpZWxkIHN0b3JhZ2VTZXJ2aWNlXzEuZGVmYXVsdC5nZXRDbGllbnRJZCgpO1xuICAgIGNvbnN0IGNsaWVudElkRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjbGllbnRJZCcpO1xuICAgIGlmIChjbGllbnRJZEVsZW1lbnQpIHtcbiAgICAgICAgY2xpZW50SWRFbGVtZW50LnRleHRDb250ZW50ID0gTVlDTElFTlRJRDtcbiAgICB9XG4gICAgY29uc29sZS5sb2coJ1VzaW5nIE1ZQ0xJRU5USUQ6JywgTVlDTElFTlRJRCk7XG4gICAgY29uc3QgZWRpdG9yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2VkaXRvcicpO1xuICAgIGNvbnN0IG9wZXJhdGlvbkZvcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb3BlcmF0aW9uRm9ybScpO1xuICAgIGNvbnN0IHN5bmNCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3luY0J1dHRvbicpO1xuICAgIGNvbnN0IGZldGNoQ2hhbmdlc0J1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmZXRjaENoYW5nZXNCdXR0b24nKTtcbiAgICBjb25zdCB2aWV3RG9jQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZpZXdEb2NCdXR0b24nKTtcbiAgICBjb25zdCBzaG93RGVidWdJbmZvQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Nob3dEZWJ1Z0luZm8nKTtcbiAgICBlZGl0b3IuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCBkZWJvdW5jZShoYW5kbGVFZGl0b3JDaGFuZ2UsIDUwMCkpO1xuICAgIG9wZXJhdGlvbkZvcm0uYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgaGFuZGxlTWFudWFsT3BlcmF0aW9uKTtcbiAgICBzeW5jQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gc3luY0NoYW5nZXMocGVuZGluZ09wZXJhdGlvbnMpKTtcbiAgICBmZXRjaENoYW5nZXNCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmZXRjaFNlcnZlckNoYW5nZXMpO1xuICAgIHZpZXdEb2NCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB2aWV3RG9jKTtcbiAgICBzaG93RGVidWdJbmZvQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdG9nZ2xlRGVidWdJbmZvKTtcbiAgICBjb25zdCBjbGVhckRCQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NsZWFyRGJCdXR0b24nKTtcbiAgICBpZiAoY2xlYXJEQkJ1dHRvbiAhPT0gbnVsbCkge1xuICAgICAgICBjbGVhckRCQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gX19hd2FpdGVyKHZvaWQgMCwgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICAvLyBZb3VyIGV2ZW50IGxpc3RlbmVyIGxvZ2ljIGhlcmVcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSB5aWVsZCBmZXRjaCgnL3N5bmMvY2xlYXItZGInLCB7IG1ldGhvZDogJ0RFTEVURScgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0geWllbGQgcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRGF0YWJhc2UgY2xlYXJlZCBzdWNjZXNzZnVsbHknKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gLy8gT3B0aW9uYWxseSwgY2xlYXIgdGhlIGVkaXRvciBoZXJlXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVkaXRvckVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZWRpdG9yJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlZGl0b3JFbGVtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3JFbGVtZW50LnZhbHVlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFbGVtZW50IHdpdGggSUQgXCJlZGl0b3JcIiBub3QgZm91bmQnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGNsZWFyIGRhdGFiYXNlOicsIHJlc3VsdC5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBjbGVhcmluZyBkYXRhYmFzZTonLCBlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0VsZW1lbnQgd2l0aCBJRCBcImNsZWFyRGJCdXR0b25cIiBub3QgZm91bmQnKTtcbiAgICB9XG4gICAgY29uc3QgcmVzZXREb2NCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzZXREb2N1bWVudEJ1dHRvbicpO1xuICAgIGlmIChyZXNldERvY0J1dHRvbiAhPT0gbnVsbCkge1xuICAgICAgICByZXNldERvY0J1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IF9fYXdhaXRlcih2b2lkIDAsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbml0aWFsQ29udGVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbml0aWFsQ29udGVudElucHV0Jyk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSB5aWVsZCBmZXRjaCgnL3N5bmMvcmVzZXQtZG9jdW1lbnQnLCB7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBpbml0aWFsQ29udGVudCB9KVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHlpZWxkIHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0RvY3VtZW50IHJlc2V0IHN1Y2Nlc3NmdWxseScpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlZGl0b3JFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2VkaXRvcicpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWRpdG9yRWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yRWxlbWVudC52YWx1ZSA9IGluaXRpYWxDb250ZW50LnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRWxlbWVudCB3aXRoIElEIFwiZWRpdG9yXCIgbm90IGZvdW5kJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byByZXNldCBkb2N1bWVudDonLCByZXN1bHQubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgcmVzZXR0aW5nIGRvY3VtZW50OicsIGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICAvLyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzZXREb2N1bWVudEJ1dHRvbicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYXN5bmMgKCkgPT4ge1xuICAgIC8vICAgICBjb25zdCBpbml0aWFsQ29udGVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbml0aWFsQ29udGVudElucHV0JykgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICAvLyAgICAgdHJ5IHtcbiAgICAvLyAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goJy9zeW5jL3Jlc2V0LWRvY3VtZW50Jywge1xuICAgIC8vICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgIC8vICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgIC8vICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgaW5pdGlhbENvbnRlbnQgfSlcbiAgICAvLyAgICAgICAgIH0pO1xuICAgIC8vICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgIC8vICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgLy8gICAgICAgICAgICAgY29uc29sZS5sb2coJ0RvY3VtZW50IHJlc2V0IHN1Y2Nlc3NmdWxseScpO1xuICAgIC8vICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlZGl0b3InKS52YWx1ZSA9IGluaXRpYWxDb250ZW50O1xuICAgIC8vICAgICAgICAgfSBlbHNlIHtcbiAgICAvLyAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gcmVzZXQgZG9jdW1lbnQ6JywgcmVzdWx0Lm1lc3NhZ2UpO1xuICAgIC8vICAgICAgICAgfVxuICAgIC8vICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgIC8vICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgcmVzZXR0aW5nIGRvY3VtZW50OicsIGVycm9yKTtcbiAgICAvLyAgICAgfVxuICAgIC8vIH0pO1xuICAgIC8vIEluaXRpYWwgZG9jdW1lbnQgZmV0Y2hcbiAgICB5aWVsZCBmZXRjaFNlcnZlckNoYW5nZXMoKTtcbn0pKTtcbmZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQpIHtcbiAgICBsZXQgdGltZW91dDtcbiAgICByZXR1cm4gZnVuY3Rpb24gZXhlY3V0ZWRGdW5jdGlvbiguLi5hcmdzKSB7XG4gICAgICAgIGNvbnN0IGxhdGVyID0gKCkgPT4ge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgICAgZnVuYyguLi5hcmdzKTtcbiAgICAgICAgfTtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGhhbmRsZUVkaXRvckNoYW5nZShldmVudCkge1xuICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdFZGl0b3IgY29udGVudCBjaGFuZ2VkJyk7XG4gICAgICAgIGNvbnN0IG5ld1RleHQgPSBldmVudC50YXJnZXQudmFsdWU7XG4gICAgICAgIGNvbnNvbGUubG9nKCdOZXcgdGV4dDonLCBuZXdUZXh0KTtcbiAgICAgICAgY29uc3QgY2hhbmdlID0gZ2VuZXJhdGVDaGFuZ2VGcm9tRWRpdChjdXJyZW50RG9jdW1lbnQsIG5ld1RleHQpO1xuICAgICAgICBpZiAoY2hhbmdlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnR2VuZXJhdGVkIGNoYW5nZTonLCBjaGFuZ2UpO1xuICAgICAgICAgICAgY3VycmVudERvY3VtZW50ID0gbmV3VGV4dDtcbiAgICAgICAgICAgIHBlbmRpbmdPcGVyYXRpb25zLnB1c2goY2hhbmdlKTtcbiAgICAgICAgICAgIHlpZWxkIHN5bmNDaGFuZ2VzKFtjaGFuZ2VdKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVDaGFuZ2VGcm9tRWRpdChvbGRUZXh0LCBuZXdUZXh0KSB7XG4gICAgaWYgKG5ld1RleHQubGVuZ3RoID4gb2xkVGV4dC5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBvbGRUZXh0Lmxlbmd0aDtcbiAgICAgICAgY29uc3QgdGV4dCA9IG5ld1RleHQuc2xpY2Uob2xkVGV4dC5sZW5ndGgpO1xuICAgICAgICBjb25zb2xlLmxvZygnQ2hhbmdlIGRldGVjdGVkOiBJbnNlcnQnLCB0ZXh0LCAnYXQgcG9zaXRpb24nLCBwb3NpdGlvbik7XG4gICAgICAgIHJldHVybiBjcmVhdGVDaGFuZ2UoJ2luc2VydCcsIHBvc2l0aW9uLCB0ZXh0KTtcbiAgICB9XG4gICAgZWxzZSBpZiAobmV3VGV4dC5sZW5ndGggPCBvbGRUZXh0Lmxlbmd0aCkge1xuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IG5ld1RleHQubGVuZ3RoO1xuICAgICAgICBjb25zdCBsZW5ndGggPSBvbGRUZXh0Lmxlbmd0aCAtIG5ld1RleHQubGVuZ3RoO1xuICAgICAgICBjb25zb2xlLmxvZygnQ2hhbmdlIGRldGVjdGVkOiBEZWxldGUgbGVuZ3RoJywgbGVuZ3RoLCAnYXQgcG9zaXRpb24nLCBwb3NpdGlvbik7XG4gICAgICAgIHJldHVybiBjcmVhdGVDaGFuZ2UoJ2RlbGV0ZScsIHBvc2l0aW9uLCB1bmRlZmluZWQsIGxlbmd0aCk7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKCdObyBjaGFuZ2UgZGV0ZWN0ZWQnKTtcbiAgICByZXR1cm4gbnVsbDtcbn1cbmZ1bmN0aW9uIGhhbmRsZU1hbnVhbE9wZXJhdGlvbihldmVudCkge1xuICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdNYW51YWwgb3BlcmF0aW9uIHRyaWdnZXJlZCcpO1xuICAgICAgICBjb25zdCB0eXBlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ29wZXJhdGlvblR5cGUnKS52YWx1ZTtcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBwYXJzZUludChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncG9zaXRpb24nKS52YWx1ZSwgMTApO1xuICAgICAgICBjb25zdCB0ZXh0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RleHQnKS52YWx1ZTtcbiAgICAgICAgY29uc3QgbGVuZ3RoID0gcGFyc2VJbnQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xlbmd0aCcpLnZhbHVlLCAxMCk7XG4gICAgICAgIGNvbnN0IGNoYW5nZSA9IGNyZWF0ZUNoYW5nZSh0eXBlLCBwb3NpdGlvbiwgdGV4dCwgbGVuZ3RoKTtcbiAgICAgICAgY29uc29sZS5sb2coJ01hbnVhbCBjaGFuZ2UgY3JlYXRlZDonLCBjaGFuZ2UpO1xuICAgICAgICBwZW5kaW5nT3BlcmF0aW9ucy5wdXNoKGNoYW5nZSk7XG4gICAgICAgIHlpZWxkIHN5bmNDaGFuZ2VzKFtjaGFuZ2VdKTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUNoYW5nZSh0eXBlLCBwb3NpdGlvbiwgdGV4dCwgbGVuZ3RoKSB7XG4gICAgY29uc29sZS5sb2coYENyZWF0aW5nIGNoYW5nZSBvZiB0eXBlICR7dHlwZX0gYXQgcG9zaXRpb24gJHtwb3NpdGlvbn1gKTtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlLFxuICAgICAgICBwb3NpdGlvbixcbiAgICAgICAgdGV4dCxcbiAgICAgICAgbGVuZ3RoLFxuICAgICAgICBjbGllbnRJZDogTVlDTElFTlRJRCxcbiAgICAgICAgdmVjdG9yQ2xvY2s6IE9iamVjdC5hc3NpZ24oe30sIGN1cnJlbnRWZWN0b3JDbG9jayksXG4gICAgICAgIHVwZGF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgfTtcbn1cbmZ1bmN0aW9uIHN5bmNDaGFuZ2VzKGNoYW5nZXMpIHtcbiAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICBpZiAoaXNTeW5jaW5nKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnU3luYyBhbHJlYWR5IGluIHByb2dyZXNzLCBza2lwcGluZycpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlzU3luY2luZyA9IHRydWU7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiQ2xpZW50ICNcIiwgTVlDTElFTlRJRCwgXCIgc2V0IGlzU3luY2luZyBUUlVFXCIpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1N5bmNpbmcgY2hhbmdlczonLCBjaGFuZ2VzKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0geWllbGQgZmV0Y2goU0VSVkVSX0xPQ0FMX0JBU0VfVVJMICsgJ3N5bmMvY2xpZW50LWNoYW5nZXMnLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoY2hhbmdlcyksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHlpZWxkIHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0NsaWVudCBjaGFuZ2VzIHN1Ym1pdHRlZCBzdWNjZXNzZnVsbHknKTtcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlcy5mb3JFYWNoKGNoYW5nZSA9PiBhcHBseUNoYW5nZUxvY2FsbHkoY2hhbmdlKSk7XG4gICAgICAgICAgICAgICAgICAgIHBlbmRpbmdPcGVyYXRpb25zID0gcGVuZGluZ09wZXJhdGlvbnMuZmlsdGVyKG9wID0+ICFjaGFuZ2VzLmluY2x1ZGVzKG9wKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQ2xpZW50IG91dCBvZiBzeW5jLCBhcHBseWluZyBzZXJ2ZXIgY2hhbmdlcycpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmNoYW5nZXMgJiYgQXJyYXkuaXNBcnJheShyZXN1bHQuY2hhbmdlcykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5jaGFuZ2VzLmZvckVhY2goKGNoYW5nZSkgPT4gYXBwbHlDaGFuZ2VMb2NhbGx5KCgwLCB0eXBlc18xLmNvbnZlcnRDaGFuZ2VEdG9Ub0NoYW5nZSkoY2hhbmdlKSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGN1cnJlbnRWZWN0b3JDbG9jayA9IHJlc3VsdC5zZXJ2ZXJWQztcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnVXBkYXRlZCB2ZWN0b3IgY2xvY2s6JywgY3VycmVudFZlY3RvckNsb2NrKTtcbiAgICAgICAgICAgICAgICB5aWVsZCBzdG9yYWdlU2VydmljZV8xLmRlZmF1bHQuc2V0VmVjdG9yQ2xvY2soY3VycmVudFZlY3RvckNsb2NrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHN1Ym1pdHRpbmcgY2xpZW50IGNoYW5nZTonLCByZXNwb25zZS5zdGF0dXNUZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHlpZWxkIGZldGNoU2VydmVyQ2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZHVyaW5nIHN5bmM6JywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJDbGllbnQgI1wiLCBNWUNMSUVOVElELCBcIiBzZXQgaXNTeW5jaW5nIEZBTFNFXCIpO1xuICAgICAgICAgICAgaXNTeW5jaW5nID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGZldGNoU2VydmVyQ2hhbmdlcygpIHtcbiAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnRmV0Y2hpbmcgc2VydmVyIGNoYW5nZXMnKTtcbiAgICAgICAgY29uc3QgY2xpZW50VkMgPSB5aWVsZCBzdG9yYWdlU2VydmljZV8xLmRlZmF1bHQuZ2V0VmVjdG9yQ2xvY2soKTtcbiAgICAgICAgY29uc29sZS5sb2coJ0NsaWVudCB2ZWN0b3IgY2xvY2s6JywgY2xpZW50VkMpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSB5aWVsZCBmZXRjaChTRVJWRVJfTE9DQUxfQkFTRV9VUkwgKyBgc3luYy9zZXJ2ZXItY2hhbmdlcz92ZWN0b3JDbG9jaz0ke2VuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShjbGllbnRWQykpfWApO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0geWllbGQgcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5jaGFuZ2VzICYmIEFycmF5LmlzQXJyYXkocmVzdWx0LmNoYW5nZXMpKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmNoYW5nZXMuZm9yRWFjaCgoY2hhbmdlRHRvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoYW5nZSA9ICgwLCB0eXBlc18xLmNvbnZlcnRDaGFuZ2VEdG9Ub0NoYW5nZSkoY2hhbmdlRHRvKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoYW5nZS5jbGllbnRJZCAhPT0gTVlDTElFTlRJRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0FwcGx5aW5nIHNlcnZlciBjaGFuZ2U6JywgY2hhbmdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5Q2hhbmdlTG9jYWxseShjaGFuZ2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZWNlaXZlZCBvd24gdXBkYXRlLCB1cGRhdGluZyB2ZWN0b3IgY2xvY2tcIiwgY2hhbmdlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRWZWN0b3JDbG9jayA9IHJlc3VsdC5zZXJ2ZXJWQztcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnVXBkYXRlZCB2ZWN0b3IgY2xvY2sgYWZ0ZXIgZmV0Y2hpbmcgc2VydmVyIGNoYW5nZXM6JywgY3VycmVudFZlY3RvckNsb2NrKTtcbiAgICAgICAgICAgICAgICB5aWVsZCBzdG9yYWdlU2VydmljZV8xLmRlZmF1bHQuc2V0VmVjdG9yQ2xvY2soY3VycmVudFZlY3RvckNsb2NrKTtcbiAgICAgICAgICAgICAgICB1cGRhdGVFZGl0b3IoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdObyBuZXcgY2hhbmdlcyBmcm9tIHNlcnZlcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgc2VydmVyIGNoYW5nZXM6JywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5mdW5jdGlvbiBhcHBseUNoYW5nZUxvY2FsbHkoY2hhbmdlKSB7XG4gICAgY29uc29sZS5sb2coJ0FwcGx5aW5nIGNoYW5nZSBsb2NhbGx5OicsIGNoYW5nZSk7XG4gICAgaWYgKGNoYW5nZS50eXBlID09PSAnaW5zZXJ0Jykge1xuICAgICAgICBjdXJyZW50RG9jdW1lbnQgPSBjdXJyZW50RG9jdW1lbnQuc2xpY2UoMCwgY2hhbmdlLnBvc2l0aW9uKSArIChjaGFuZ2UudGV4dCB8fCAnJykgKyBjdXJyZW50RG9jdW1lbnQuc2xpY2UoY2hhbmdlLnBvc2l0aW9uKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoY2hhbmdlLnR5cGUgPT09ICdkZWxldGUnKSB7XG4gICAgICAgIGNvbnN0IGRlbGV0ZUxlbmd0aCA9IGNoYW5nZS5sZW5ndGggIT0gbnVsbCA/IGNoYW5nZS5sZW5ndGggOiAwO1xuICAgICAgICBjdXJyZW50RG9jdW1lbnQgPSBjdXJyZW50RG9jdW1lbnQuc2xpY2UoMCwgY2hhbmdlLnBvc2l0aW9uKSArIGN1cnJlbnREb2N1bWVudC5zbGljZShjaGFuZ2UucG9zaXRpb24gKyBkZWxldGVMZW5ndGgpO1xuICAgIH1cbiAgICB1cGRhdGVFZGl0b3IoKTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZUVkaXRvcigpIHtcbiAgICBjb25zdCBlZGl0b3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZWRpdG9yJyk7XG4gICAgZWRpdG9yLnZhbHVlID0gY3VycmVudERvY3VtZW50O1xuICAgIGNvbnNvbGUubG9nKCdFZGl0b3IgdXBkYXRlZCB3aXRoIGN1cnJlbnQgZG9jdW1lbnQ6JywgY3VycmVudERvY3VtZW50KTtcbn1cbmZ1bmN0aW9uIHZpZXdEb2MoKSB7XG4gICAgY29uc3QgZG9jRGlzcGxheSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkb2NEaXNwbGF5Jyk7XG4gICAgaWYgKGRvY0Rpc3BsYXkpIHtcbiAgICAgICAgZG9jRGlzcGxheS50ZXh0Q29udGVudCA9IGN1cnJlbnREb2N1bWVudDtcbiAgICB9XG4gICAgY29uc29sZS5sb2coJ0RvY3VtZW50IHZpZXdlZDonLCBjdXJyZW50RG9jdW1lbnQpO1xufVxuZnVuY3Rpb24gdG9nZ2xlRGVidWdJbmZvKCkge1xuICAgIGNvbnN0IGRlYnVnSW5mbyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZWJ1Z0luZm8nKTtcbiAgICBpZiAoZGVidWdJbmZvKSB7XG4gICAgICAgIGlmIChkZWJ1Z0luZm8uc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnKSB7XG4gICAgICAgICAgICBkZWJ1Z0luZm8uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgICAgICBkZWJ1Z0luZm8udGV4dENvbnRlbnQgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgY2xpZW50SWQ6IE1ZQ0xJRU5USUQsXG4gICAgICAgICAgICAgICAgdmVjdG9yQ2xvY2s6IGN1cnJlbnRWZWN0b3JDbG9jayxcbiAgICAgICAgICAgICAgICBwZW5kaW5nT3BlcmF0aW9uczogcGVuZGluZ09wZXJhdGlvbnNcbiAgICAgICAgICAgIH0sIG51bGwsIDIpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0RlYnVnIGluZm8gZGlzcGxheWVkOicsIGRlYnVnSW5mby50ZXh0Q29udGVudCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBkZWJ1Z0luZm8uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdEZWJ1ZyBpbmZvIGhpZGRlbicpO1xuICAgICAgICB9XG4gICAgfVxufVxuLy8gV29ya2VyIG1lc3NhZ2UgaGFuZGxpbmdcbndvcmtlci5vbm1lc3NhZ2UgPSAoZXZlbnQpID0+IHtcbiAgICBjb25zdCB7IGFjdGlvbiwgZGF0YSB9ID0gZXZlbnQuZGF0YTtcbiAgICBjb25zb2xlLmxvZyhgUmVjZWl2ZWQgYWN0aW9uIGZyb20gd29ya2VyOiAke2FjdGlvbn0sIGRhdGE6ICR7ZGF0YX1gKTtcbiAgICAvLyBIYW5kbGUgd29ya2VyIG1lc3NhZ2VzIGlmIG5lZWRlZFxufTtcbi8vIC8vIEluaXRpYWxpemUgc3luYyBpbnRlcnZhbFxuLy8gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuLy8gICAgIGlmIChwZW5kaW5nT3BlcmF0aW9ucy5sZW5ndGggPiAwKSB7XG4vLyAgICAgICAgIHN5bmNDaGFuZ2VzKHBlbmRpbmdPcGVyYXRpb25zKTtcbi8vICAgICB9IGVsc2Uge1xuLy8gICAgICAgICBmZXRjaFNlcnZlckNoYW5nZXMoKTtcbi8vICAgICB9XG4vLyB9LCA1MDAwKTtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBEQl9OQU1FID0gJ215QXBwREInO1xuY29uc3QgREJfVkVSU0lPTiA9IDE7XG5jb25zdCBDTElFTlRfU1RPUkUgPSAnY2xpZW50U3RvcmUnO1xuY29uc3QgQ0xJRU5UX0lEX0tFWSA9ICdjbGllbnRJZCc7XG5jb25zdCBDTElFTlRfVkNfS0VZID0gJ3ZlY3RvckNsb2NrJztcbmNsYXNzIFN0b3JhZ2VTZXJ2aWNlIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5kYiA9IG51bGw7XG4gICAgICAgIHRoaXMuY2xpZW50SWRDYWNoZSA9IG51bGw7XG4gICAgICAgIHRoaXMuY2xvY2tDYWNoZSA9IG51bGw7XG4gICAgfVxuICAgIGluaXQoKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZGIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRiID0geWllbGQgdGhpcy5vcGVuREIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIG9wZW5EQigpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBpbmRleGVkREIub3BlbihEQl9OQU1FLCBEQl9WRVJTSU9OKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGIgPSBldmVudC50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgICAgIGlmICghZGIub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucyhDTElFTlRfU1RPUkUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRiLmNyZWF0ZU9iamVjdFN0b3JlKENMSUVOVF9TVE9SRSwgeyBrZXlQYXRoOiAna2V5JyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHJlc29sdmUoZXZlbnQudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoZXZlbnQpID0+IHJlamVjdChldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZ2V0VmVjdG9yQ2xvY2soKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5jbG9ja0NhY2hlKVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNsb2NrQ2FjaGU7XG4gICAgICAgICAgICB5aWVsZCB0aGlzLmluaXQoKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0geWllbGQgdGhpcy5nZXQoQ0xJRU5UX1NUT1JFLCBDTElFTlRfVkNfS0VZKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xvY2tDYWNoZSA9IHJlc3VsdC52YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xvY2tDYWNoZSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICB5aWVsZCB0aGlzLnNldFZlY3RvckNsb2NrKHRoaXMuY2xvY2tDYWNoZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNsb2NrQ2FjaGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBnZXR0aW5nIHZlY3RvciBjbG9jazonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmFsbGJhY2tHZXRDbG9ja0NhY2hlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICB1cGRhdGVWZWN0b3JDbG9jayhjbGllbnRJZCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgbGV0IHZlY3RvckNsb2NrID0geWllbGQgdGhpcy5nZXRWZWN0b3JDbG9jaygpO1xuICAgICAgICAgICAgdmVjdG9yQ2xvY2tbY2xpZW50SWRdID0gKHZlY3RvckNsb2NrW2NsaWVudElkXSB8fCAwKSArIDE7XG4gICAgICAgICAgICAvLyBTYXZlIHRoZSB1cGRhdGVkIHZlY3RvciBjbG9jayB0byBJbmRleGVkREJcbiAgICAgICAgICAgIHRoaXMuc2V0VmVjdG9yQ2xvY2sodmVjdG9yQ2xvY2spO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgc2V0VmVjdG9yQ2xvY2soY2xvY2spIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuaW5pdCgpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB5aWVsZCB0aGlzLnB1dChDTElFTlRfU1RPUkUsIHsga2V5OiBDTElFTlRfVkNfS0VZLCB2YWx1ZTogY2xvY2sgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5jbG9ja0NhY2hlID0gY2xvY2s7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBzZXR0aW5nIHZlY3RvciBjbG9jazonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgdGhpcy5mYWxsYmFja1NldENsb2NrQ2FjaGUoY2xvY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZmFsbGJhY2tHZXRDbG9ja0NhY2hlKCkge1xuICAgICAgICBsZXQgY2xvY2sgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShDTElFTlRfVkNfS0VZKTtcbiAgICAgICAgaWYgKCFjbG9jaykge1xuICAgICAgICAgICAgY2xvY2sgPSBKU09OLnN0cmluZ2lmeSh7fSk7XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShDTElFTlRfVkNfS0VZLCBjbG9jayk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoY2xvY2spO1xuICAgIH1cbiAgICBmYWxsYmFja1NldENsb2NrQ2FjaGUoY2xvY2spIHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oQ0xJRU5UX1ZDX0tFWSwgSlNPTi5zdHJpbmdpZnkoY2xvY2spKTtcbiAgICB9XG4gICAgZ2V0Q2xpZW50SWQoKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5jbGllbnRJZENhY2hlKVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNsaWVudElkQ2FjaGU7XG4gICAgICAgICAgICB5aWVsZCB0aGlzLmluaXQoKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0geWllbGQgdGhpcy5nZXQoQ0xJRU5UX1NUT1JFLCBDTElFTlRfSURfS0VZKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xpZW50SWRDYWNoZSA9IHJlc3VsdC52YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xpZW50SWRDYWNoZSA9IGNyeXB0by5yYW5kb21VVUlEKCk7XG4gICAgICAgICAgICAgICAgICAgIHlpZWxkIHRoaXMuc2V0Q2xpZW50SWQodGhpcy5jbGllbnRJZENhY2hlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50SWRDYWNoZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGdldHRpbmcgY2xpZW50SWQ6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmZhbGxiYWNrR2V0Q2xpZW50SWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHNldENsaWVudElkKGNsaWVudElkKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICB5aWVsZCB0aGlzLmluaXQoKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgeWllbGQgdGhpcy5wdXQoQ0xJRU5UX1NUT1JFLCB7IGtleTogQ0xJRU5UX0lEX0tFWSwgdmFsdWU6IGNsaWVudElkIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xpZW50SWRDYWNoZSA9IGNsaWVudElkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc2V0dGluZyBjbGllbnRJZDonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgdGhpcy5mYWxsYmFja1NldENsaWVudElkKGNsaWVudElkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGZhbGxiYWNrR2V0Q2xpZW50SWQoKSB7XG4gICAgICAgIGxldCBjbGllbnRJZCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKENMSUVOVF9JRF9LRVkpO1xuICAgICAgICBpZiAoIWNsaWVudElkKSB7XG4gICAgICAgICAgICBjbGllbnRJZCA9IGNyeXB0by5yYW5kb21VVUlEKCk7XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShDTElFTlRfSURfS0VZLCBjbGllbnRJZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNsaWVudElkO1xuICAgIH1cbiAgICBmYWxsYmFja1NldENsaWVudElkKGNsaWVudElkKSB7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKENMSUVOVF9JRF9LRVksIGNsaWVudElkKTtcbiAgICB9XG4gICAgZ2V0KHN0b3JlTmFtZSwga2V5KSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkb25seScpO1xuICAgICAgICAgICAgY29uc3Qgc3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpO1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IHN0b3JlLmdldChrZXkpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHJlc29sdmUoZXZlbnQudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoZXZlbnQpID0+IHJlamVjdChldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcHV0KHN0b3JlTmFtZSwgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICAgICAgY29uc3Qgc3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpO1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IHN0b3JlLnB1dCh2YWx1ZSk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUoKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9IChldmVudCkgPT4gcmVqZWN0KGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmNvbnN0IHN0b3JhZ2VTZXJ2aWNlID0gbmV3IFN0b3JhZ2VTZXJ2aWNlKCk7XG5leHBvcnRzLmRlZmF1bHQgPSBzdG9yYWdlU2VydmljZTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5jb252ZXJ0Q2hhbmdlRHRvVG9DaGFuZ2UgPSBjb252ZXJ0Q2hhbmdlRHRvVG9DaGFuZ2U7XG5leHBvcnRzLm1lcmdlVmVjdG9yQ2xvY2tzID0gbWVyZ2VWZWN0b3JDbG9ja3M7XG5leHBvcnRzLmNvbXBhcmVWZWN0b3JDbG9ja3MgPSBjb21wYXJlVmVjdG9yQ2xvY2tzO1xuZnVuY3Rpb24gY29udmVydENoYW5nZUR0b1RvQ2hhbmdlKGR0bykge1xuICAgIHJldHVybiB7XG4gICAgICAgIGlkOiBgJHtkdG8uY2xpZW50SWR9LSR7ZHRvLnVwZGF0ZWRBdCB8fCBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCl9YCxcbiAgICAgICAgdXBkYXRlZEF0OiBkdG8udXBkYXRlZEF0IHx8IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgdHlwZTogZHRvLnR5cGUsXG4gICAgICAgIHBvc2l0aW9uOiBkdG8ucG9zaXRpb24sXG4gICAgICAgIGNsaWVudElkOiBkdG8uY2xpZW50SWQsXG4gICAgICAgIHRleHQ6IGR0by50ZXh0LFxuICAgICAgICBsZW5ndGg6IGR0by5sZW5ndGgsXG4gICAgICAgIHZlY3RvckNsb2NrOiBPYmplY3QuYXNzaWduKHt9LCBkdG8udmVjdG9yQ2xvY2spXG4gICAgfTtcbn1cbmZ1bmN0aW9uIG1lcmdlVmVjdG9yQ2xvY2tzKHZjMSwgdmMyKSB7XG4gICAgY29uc3QgbWVyZ2VkID0gT2JqZWN0LmFzc2lnbih7fSwgdmMxKTtcbiAgICBmb3IgKGNvbnN0IGNsaWVudElkIGluIHZjMikge1xuICAgICAgICBtZXJnZWRbY2xpZW50SWRdID0gTWF0aC5tYXgobWVyZ2VkW2NsaWVudElkXSB8fCAwLCB2YzJbY2xpZW50SWRdKTtcbiAgICB9XG4gICAgcmV0dXJuIG1lcmdlZDtcbn1cbmZ1bmN0aW9uIGNvbXBhcmVWZWN0b3JDbG9ja3ModmMxLCB2YzIpIHtcbiAgICBsZXQgaXNMZXNzID0gZmFsc2U7XG4gICAgbGV0IGlzR3JlYXRlciA9IGZhbHNlO1xuICAgIGZvciAoY29uc3QgY2xpZW50SWQgaW4gdmMxKSB7XG4gICAgICAgIGlmICghKGNsaWVudElkIGluIHZjMikgfHwgdmMxW2NsaWVudElkXSA+IHZjMltjbGllbnRJZF0pIHtcbiAgICAgICAgICAgIGlzR3JlYXRlciA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodmMxW2NsaWVudElkXSA8IHZjMltjbGllbnRJZF0pIHtcbiAgICAgICAgICAgIGlzTGVzcyA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBjbGllbnRJZCBpbiB2YzIpIHtcbiAgICAgICAgaWYgKCEoY2xpZW50SWQgaW4gdmMxKSkge1xuICAgICAgICAgICAgaXNMZXNzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNHcmVhdGVyICYmIGlzTGVzcylcbiAgICAgICAgcmV0dXJuIDA7IC8vIENvbmN1cnJlbnRcbiAgICBpZiAoaXNHcmVhdGVyKVxuICAgICAgICByZXR1cm4gMTtcbiAgICBpZiAoaXNMZXNzKVxuICAgICAgICByZXR1cm4gLTE7XG4gICAgcmV0dXJuIDA7IC8vIEVxdWFsXG59XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiIiwiLy8gc3RhcnR1cFxuLy8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4vLyBUaGlzIGVudHJ5IG1vZHVsZSBpcyByZWZlcmVuY2VkIGJ5IG90aGVyIG1vZHVsZXMgc28gaXQgY2FuJ3QgYmUgaW5saW5lZFxudmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKFwiLi9zcmMvbWFpbi50c1wiKTtcbiIsIiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==