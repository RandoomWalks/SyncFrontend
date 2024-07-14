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
        const newText = event.target.value;
        const change = generateChangeFromEdit(currentDocument, newText);
        if (change) {
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
        return createChange('insert', position, text);
    }
    else if (newText.length < oldText.length) {
        const position = newText.length;
        const length = oldText.length - newText.length;
        return createChange('delete', position, undefined, length);
    }
    return null;
}
function handleManualOperation(event) {
    return __awaiter(this, void 0, void 0, function* () {
        event.preventDefault();
        const type = document.getElementById('operationType').value;
        const position = parseInt(document.getElementById('position').value, 10);
        const text = document.getElementById('text').value;
        const length = parseInt(document.getElementById('length').value, 10);
        const change = createChange(type, position, text, length);
        pendingOperations.push(change);
        yield syncChanges([change]);
    });
}
function createChange(type, position, text, length) {
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
        if (isSyncing)
            return;
        isSyncing = true;
        console.log("Client #", MYCLIENTID, " set isSyncing TRUE");
        try {
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
                    result.changes.forEach((changeDto) => applyChangeLocally((0, types_1.convertChangeDtoToChange)(changeDto)));
                }
                currentVectorClock = result.serverVC;
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
        const clientVC = yield storageService_1.default.getVectorClock();
        try {
            const response = yield fetch(SERVER_LOCAL_BASE_URL + `sync/server-changes?vectorClock=${encodeURIComponent(JSON.stringify(clientVC))}`);
            const { changes, serverVC } = yield response.json();
            if (changes.length > 0) {
                changes.forEach((changeDto) => {
                    const change = (0, types_1.convertChangeDtoToChange)(changeDto);
                    if (change.clientId !== MYCLIENTID) {
                        applyChangeLocally(change);
                    }
                    else {
                        console.log("Received own update, updating vector clock", change);
                    }
                });
                currentVectorClock = serverVC;
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
}
function viewDoc() {
    const docDisplay = document.getElementById('docDisplay');
    if (docDisplay) {
        docDisplay.textContent = currentDocument;
    }
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
        }
        else {
            debugInfo.style.display = 'none';
        }
    }
}
// Worker message handling
worker.onmessage = (event) => {
    const { action, data } = event.data;
    console.log(`Received action from worker: ${action}`);
    // Handle worker messages if needed
};
// Initialize sync interval
setInterval(() => {
    if (pendingOperations.length > 0) {
        syncChanges(pendingOperations);
    }
    else {
        fetchServerChanges();
    }
}, 5000);


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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bUM7QUFDbkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7Ozs7Ozs7VUMvQ0E7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7OztVRXRCQTtVQUNBO1VBQ0E7VUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2Zyb250ZW5kX21pbmltYWxfZm9yX290X2NoYW5nZS8uL3NyYy9tYWluLnRzIiwid2VicGFjazovL2Zyb250ZW5kX21pbmltYWxfZm9yX290X2NoYW5nZS8uL3NyYy9zdG9yYWdlU2VydmljZS50cyIsIndlYnBhY2s6Ly9mcm9udGVuZF9taW5pbWFsX2Zvcl9vdF9jaGFuZ2UvLi9zcmMvdHlwZXMudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmRfbWluaW1hbF9mb3Jfb3RfY2hhbmdlL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2Zyb250ZW5kX21pbmltYWxfZm9yX290X2NoYW5nZS93ZWJwYWNrL2JlZm9yZS1zdGFydHVwIiwid2VicGFjazovL2Zyb250ZW5kX21pbmltYWxfZm9yX290X2NoYW5nZS93ZWJwYWNrL3N0YXJ0dXAiLCJ3ZWJwYWNrOi8vZnJvbnRlbmRfbWluaW1hbF9mb3Jfb3RfY2hhbmdlL3dlYnBhY2svYWZ0ZXItc3RhcnR1cCJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIGZ1bmN0aW9uIGFkb3B0KHZhbHVlKSB7IHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFAgPyB2YWx1ZSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUodmFsdWUpOyB9KTsgfVxuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGFkb3B0KHJlc3VsdC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XG4gICAgfSk7XG59O1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgdHlwZXNfMSA9IHJlcXVpcmUoXCIuL3R5cGVzXCIpO1xuY29uc3Qgc3RvcmFnZVNlcnZpY2VfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9zdG9yYWdlU2VydmljZVwiKSk7XG5sZXQgTVlDTElFTlRJRDtcbmxldCBjdXJyZW50RG9jdW1lbnQgPSAnJztcbmxldCBjdXJyZW50VmVjdG9yQ2xvY2sgPSB7fTtcbmxldCBwZW5kaW5nT3BlcmF0aW9ucyA9IFtdO1xubGV0IGxhc3RGZXRjaFRpbWUgPSBuZXcgRGF0ZSgwKTtcbmxldCBpc1N5bmNpbmcgPSBmYWxzZTtcbmNvbnN0IFNFUlZFUl9MT0NBTF9CQVNFX1VSTCA9ICdodHRwOi8vMTI3LjAuMC4xOjMwMDAvJztcbi8vIEluaXRpYWxpemUgV2ViIFdvcmtlclxuY29uc3Qgd29ya2VyID0gbmV3IFdvcmtlcignd29ya2VyLmpzJyk7XG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4gX19hd2FpdGVyKHZvaWQgMCwgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgY29uc29sZS5sb2coJ0RPTSBpcyBmdWxseSBsb2FkZWQnKTtcbiAgICBNWUNMSUVOVElEID0geWllbGQgc3RvcmFnZVNlcnZpY2VfMS5kZWZhdWx0LmdldENsaWVudElkKCk7XG4gICAgY29uc3QgY2xpZW50SWRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NsaWVudElkJyk7XG4gICAgaWYgKGNsaWVudElkRWxlbWVudCkge1xuICAgICAgICBjbGllbnRJZEVsZW1lbnQudGV4dENvbnRlbnQgPSBNWUNMSUVOVElEO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZygnVXNpbmcgTVlDTElFTlRJRDonLCBNWUNMSUVOVElEKTtcbiAgICBjb25zdCBlZGl0b3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZWRpdG9yJyk7XG4gICAgY29uc3Qgb3BlcmF0aW9uRm9ybSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdvcGVyYXRpb25Gb3JtJyk7XG4gICAgY29uc3Qgc3luY0J1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzeW5jQnV0dG9uJyk7XG4gICAgY29uc3QgZmV0Y2hDaGFuZ2VzQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZldGNoQ2hhbmdlc0J1dHRvbicpO1xuICAgIGNvbnN0IHZpZXdEb2NCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndmlld0RvY0J1dHRvbicpO1xuICAgIGNvbnN0IHNob3dEZWJ1Z0luZm9CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2hvd0RlYnVnSW5mbycpO1xuICAgIGVkaXRvci5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIGRlYm91bmNlKGhhbmRsZUVkaXRvckNoYW5nZSwgNTAwKSk7XG4gICAgb3BlcmF0aW9uRm9ybS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBoYW5kbGVNYW51YWxPcGVyYXRpb24pO1xuICAgIHN5bmNCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiBzeW5jQ2hhbmdlcyhwZW5kaW5nT3BlcmF0aW9ucykpO1xuICAgIGZldGNoQ2hhbmdlc0J1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZldGNoU2VydmVyQ2hhbmdlcyk7XG4gICAgdmlld0RvY0J1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHZpZXdEb2MpO1xuICAgIHNob3dEZWJ1Z0luZm9CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0b2dnbGVEZWJ1Z0luZm8pO1xuICAgIC8vIEluaXRpYWwgZG9jdW1lbnQgZmV0Y2hcbiAgICB5aWVsZCBmZXRjaFNlcnZlckNoYW5nZXMoKTtcbn0pKTtcbmZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQpIHtcbiAgICBsZXQgdGltZW91dDtcbiAgICByZXR1cm4gZnVuY3Rpb24gZXhlY3V0ZWRGdW5jdGlvbiguLi5hcmdzKSB7XG4gICAgICAgIGNvbnN0IGxhdGVyID0gKCkgPT4ge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgICAgZnVuYyguLi5hcmdzKTtcbiAgICAgICAgfTtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGhhbmRsZUVkaXRvckNoYW5nZShldmVudCkge1xuICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgIGNvbnN0IG5ld1RleHQgPSBldmVudC50YXJnZXQudmFsdWU7XG4gICAgICAgIGNvbnN0IGNoYW5nZSA9IGdlbmVyYXRlQ2hhbmdlRnJvbUVkaXQoY3VycmVudERvY3VtZW50LCBuZXdUZXh0KTtcbiAgICAgICAgaWYgKGNoYW5nZSkge1xuICAgICAgICAgICAgY3VycmVudERvY3VtZW50ID0gbmV3VGV4dDtcbiAgICAgICAgICAgIHBlbmRpbmdPcGVyYXRpb25zLnB1c2goY2hhbmdlKTtcbiAgICAgICAgICAgIHlpZWxkIHN5bmNDaGFuZ2VzKFtjaGFuZ2VdKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVDaGFuZ2VGcm9tRWRpdChvbGRUZXh0LCBuZXdUZXh0KSB7XG4gICAgaWYgKG5ld1RleHQubGVuZ3RoID4gb2xkVGV4dC5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBvbGRUZXh0Lmxlbmd0aDtcbiAgICAgICAgY29uc3QgdGV4dCA9IG5ld1RleHQuc2xpY2Uob2xkVGV4dC5sZW5ndGgpO1xuICAgICAgICByZXR1cm4gY3JlYXRlQ2hhbmdlKCdpbnNlcnQnLCBwb3NpdGlvbiwgdGV4dCk7XG4gICAgfVxuICAgIGVsc2UgaWYgKG5ld1RleHQubGVuZ3RoIDwgb2xkVGV4dC5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBuZXdUZXh0Lmxlbmd0aDtcbiAgICAgICAgY29uc3QgbGVuZ3RoID0gb2xkVGV4dC5sZW5ndGggLSBuZXdUZXh0Lmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUNoYW5nZSgnZGVsZXRlJywgcG9zaXRpb24sIHVuZGVmaW5lZCwgbGVuZ3RoKTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5mdW5jdGlvbiBoYW5kbGVNYW51YWxPcGVyYXRpb24oZXZlbnQpIHtcbiAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjb25zdCB0eXBlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ29wZXJhdGlvblR5cGUnKS52YWx1ZTtcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBwYXJzZUludChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncG9zaXRpb24nKS52YWx1ZSwgMTApO1xuICAgICAgICBjb25zdCB0ZXh0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RleHQnKS52YWx1ZTtcbiAgICAgICAgY29uc3QgbGVuZ3RoID0gcGFyc2VJbnQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xlbmd0aCcpLnZhbHVlLCAxMCk7XG4gICAgICAgIGNvbnN0IGNoYW5nZSA9IGNyZWF0ZUNoYW5nZSh0eXBlLCBwb3NpdGlvbiwgdGV4dCwgbGVuZ3RoKTtcbiAgICAgICAgcGVuZGluZ09wZXJhdGlvbnMucHVzaChjaGFuZ2UpO1xuICAgICAgICB5aWVsZCBzeW5jQ2hhbmdlcyhbY2hhbmdlXSk7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBjcmVhdGVDaGFuZ2UodHlwZSwgcG9zaXRpb24sIHRleHQsIGxlbmd0aCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGUsXG4gICAgICAgIHBvc2l0aW9uLFxuICAgICAgICB0ZXh0LFxuICAgICAgICBsZW5ndGgsXG4gICAgICAgIGNsaWVudElkOiBNWUNMSUVOVElELFxuICAgICAgICB2ZWN0b3JDbG9jazogT2JqZWN0LmFzc2lnbih7fSwgY3VycmVudFZlY3RvckNsb2NrKSxcbiAgICAgICAgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICB9O1xufVxuZnVuY3Rpb24gc3luY0NoYW5nZXMoY2hhbmdlcykge1xuICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgIGlmIChpc1N5bmNpbmcpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlzU3luY2luZyA9IHRydWU7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiQ2xpZW50ICNcIiwgTVlDTElFTlRJRCwgXCIgc2V0IGlzU3luY2luZyBUUlVFXCIpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSB5aWVsZCBmZXRjaChTRVJWRVJfTE9DQUxfQkFTRV9VUkwgKyAnc3luYy9jbGllbnQtY2hhbmdlcycsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShjaGFuZ2VzKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0geWllbGQgcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQ2xpZW50IGNoYW5nZXMgc3VibWl0dGVkIHN1Y2Nlc3NmdWxseScpO1xuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzLmZvckVhY2goY2hhbmdlID0+IGFwcGx5Q2hhbmdlTG9jYWxseShjaGFuZ2UpKTtcbiAgICAgICAgICAgICAgICAgICAgcGVuZGluZ09wZXJhdGlvbnMgPSBwZW5kaW5nT3BlcmF0aW9ucy5maWx0ZXIob3AgPT4gIWNoYW5nZXMuaW5jbHVkZXMob3ApKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdDbGllbnQgb3V0IG9mIHN5bmMsIGFwcGx5aW5nIHNlcnZlciBjaGFuZ2VzJyk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5jaGFuZ2VzLmZvckVhY2goKGNoYW5nZUR0bykgPT4gYXBwbHlDaGFuZ2VMb2NhbGx5KCgwLCB0eXBlc18xLmNvbnZlcnRDaGFuZ2VEdG9Ub0NoYW5nZSkoY2hhbmdlRHRvKSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjdXJyZW50VmVjdG9yQ2xvY2sgPSByZXN1bHQuc2VydmVyVkM7XG4gICAgICAgICAgICAgICAgeWllbGQgc3RvcmFnZVNlcnZpY2VfMS5kZWZhdWx0LnNldFZlY3RvckNsb2NrKGN1cnJlbnRWZWN0b3JDbG9jayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBzdWJtaXR0aW5nIGNsaWVudCBjaGFuZ2U6JywgcmVzcG9uc2Uuc3RhdHVzVGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB5aWVsZCBmZXRjaFNlcnZlckNoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGR1cmluZyBzeW5jOicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ2xpZW50ICNcIiwgTVlDTElFTlRJRCwgXCIgc2V0IGlzU3luY2luZyBGQUxTRVwiKTtcbiAgICAgICAgICAgIGlzU3luY2luZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5mdW5jdGlvbiBmZXRjaFNlcnZlckNoYW5nZXMoKSB7XG4gICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgY29uc3QgY2xpZW50VkMgPSB5aWVsZCBzdG9yYWdlU2VydmljZV8xLmRlZmF1bHQuZ2V0VmVjdG9yQ2xvY2soKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0geWllbGQgZmV0Y2goU0VSVkVSX0xPQ0FMX0JBU0VfVVJMICsgYHN5bmMvc2VydmVyLWNoYW5nZXM/dmVjdG9yQ2xvY2s9JHtlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoY2xpZW50VkMpKX1gKTtcbiAgICAgICAgICAgIGNvbnN0IHsgY2hhbmdlcywgc2VydmVyVkMgfSA9IHlpZWxkIHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICAgIGlmIChjaGFuZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBjaGFuZ2VzLmZvckVhY2goKGNoYW5nZUR0bykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGFuZ2UgPSAoMCwgdHlwZXNfMS5jb252ZXJ0Q2hhbmdlRHRvVG9DaGFuZ2UpKGNoYW5nZUR0byk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGFuZ2UuY2xpZW50SWQgIT09IE1ZQ0xJRU5USUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5Q2hhbmdlTG9jYWxseShjaGFuZ2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZWNlaXZlZCBvd24gdXBkYXRlLCB1cGRhdGluZyB2ZWN0b3IgY2xvY2tcIiwgY2hhbmdlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRWZWN0b3JDbG9jayA9IHNlcnZlclZDO1xuICAgICAgICAgICAgICAgIHlpZWxkIHN0b3JhZ2VTZXJ2aWNlXzEuZGVmYXVsdC5zZXRWZWN0b3JDbG9jayhjdXJyZW50VmVjdG9yQ2xvY2spO1xuICAgICAgICAgICAgICAgIHVwZGF0ZUVkaXRvcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ05vIG5ldyBjaGFuZ2VzIGZyb20gc2VydmVyJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBmZXRjaGluZyBzZXJ2ZXIgY2hhbmdlczonLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGFwcGx5Q2hhbmdlTG9jYWxseShjaGFuZ2UpIHtcbiAgICBpZiAoY2hhbmdlLnR5cGUgPT09ICdpbnNlcnQnKSB7XG4gICAgICAgIGN1cnJlbnREb2N1bWVudCA9IGN1cnJlbnREb2N1bWVudC5zbGljZSgwLCBjaGFuZ2UucG9zaXRpb24pICsgKGNoYW5nZS50ZXh0IHx8ICcnKSArIGN1cnJlbnREb2N1bWVudC5zbGljZShjaGFuZ2UucG9zaXRpb24pO1xuICAgIH1cbiAgICBlbHNlIGlmIChjaGFuZ2UudHlwZSA9PT0gJ2RlbGV0ZScpIHtcbiAgICAgICAgY29uc3QgZGVsZXRlTGVuZ3RoID0gY2hhbmdlLmxlbmd0aCAhPSBudWxsID8gY2hhbmdlLmxlbmd0aCA6IDA7XG4gICAgICAgIGN1cnJlbnREb2N1bWVudCA9IGN1cnJlbnREb2N1bWVudC5zbGljZSgwLCBjaGFuZ2UucG9zaXRpb24pICsgY3VycmVudERvY3VtZW50LnNsaWNlKGNoYW5nZS5wb3NpdGlvbiArIGRlbGV0ZUxlbmd0aCk7XG4gICAgfVxuICAgIHVwZGF0ZUVkaXRvcigpO1xufVxuZnVuY3Rpb24gdXBkYXRlRWRpdG9yKCkge1xuICAgIGNvbnN0IGVkaXRvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlZGl0b3InKTtcbiAgICBlZGl0b3IudmFsdWUgPSBjdXJyZW50RG9jdW1lbnQ7XG59XG5mdW5jdGlvbiB2aWV3RG9jKCkge1xuICAgIGNvbnN0IGRvY0Rpc3BsYXkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZG9jRGlzcGxheScpO1xuICAgIGlmIChkb2NEaXNwbGF5KSB7XG4gICAgICAgIGRvY0Rpc3BsYXkudGV4dENvbnRlbnQgPSBjdXJyZW50RG9jdW1lbnQ7XG4gICAgfVxufVxuZnVuY3Rpb24gdG9nZ2xlRGVidWdJbmZvKCkge1xuICAgIGNvbnN0IGRlYnVnSW5mbyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZWJ1Z0luZm8nKTtcbiAgICBpZiAoZGVidWdJbmZvKSB7XG4gICAgICAgIGlmIChkZWJ1Z0luZm8uc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnKSB7XG4gICAgICAgICAgICBkZWJ1Z0luZm8uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgICAgICBkZWJ1Z0luZm8udGV4dENvbnRlbnQgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgY2xpZW50SWQ6IE1ZQ0xJRU5USUQsXG4gICAgICAgICAgICAgICAgdmVjdG9yQ2xvY2s6IGN1cnJlbnRWZWN0b3JDbG9jayxcbiAgICAgICAgICAgICAgICBwZW5kaW5nT3BlcmF0aW9uczogcGVuZGluZ09wZXJhdGlvbnNcbiAgICAgICAgICAgIH0sIG51bGwsIDIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGVidWdJbmZvLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH1cbiAgICB9XG59XG4vLyBXb3JrZXIgbWVzc2FnZSBoYW5kbGluZ1xud29ya2VyLm9ubWVzc2FnZSA9IChldmVudCkgPT4ge1xuICAgIGNvbnN0IHsgYWN0aW9uLCBkYXRhIH0gPSBldmVudC5kYXRhO1xuICAgIGNvbnNvbGUubG9nKGBSZWNlaXZlZCBhY3Rpb24gZnJvbSB3b3JrZXI6ICR7YWN0aW9ufWApO1xuICAgIC8vIEhhbmRsZSB3b3JrZXIgbWVzc2FnZXMgaWYgbmVlZGVkXG59O1xuLy8gSW5pdGlhbGl6ZSBzeW5jIGludGVydmFsXG5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgaWYgKHBlbmRpbmdPcGVyYXRpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgc3luY0NoYW5nZXMocGVuZGluZ09wZXJhdGlvbnMpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZmV0Y2hTZXJ2ZXJDaGFuZ2VzKCk7XG4gICAgfVxufSwgNTAwMCk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIGZ1bmN0aW9uIGFkb3B0KHZhbHVlKSB7IHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFAgPyB2YWx1ZSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUodmFsdWUpOyB9KTsgfVxuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGFkb3B0KHJlc3VsdC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XG4gICAgfSk7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgREJfTkFNRSA9ICdteUFwcERCJztcbmNvbnN0IERCX1ZFUlNJT04gPSAxO1xuY29uc3QgQ0xJRU5UX1NUT1JFID0gJ2NsaWVudFN0b3JlJztcbmNvbnN0IENMSUVOVF9JRF9LRVkgPSAnY2xpZW50SWQnO1xuY29uc3QgQ0xJRU5UX1ZDX0tFWSA9ICd2ZWN0b3JDbG9jayc7XG5jbGFzcyBTdG9yYWdlU2VydmljZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZGIgPSBudWxsO1xuICAgICAgICB0aGlzLmNsaWVudElkQ2FjaGUgPSBudWxsO1xuICAgICAgICB0aGlzLmNsb2NrQ2FjaGUgPSBudWxsO1xuICAgIH1cbiAgICBpbml0KCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmRiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kYiA9IHlpZWxkIHRoaXMub3BlbkRCKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBvcGVuREIoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gaW5kZXhlZERCLm9wZW4oREJfTkFNRSwgREJfVkVSU0lPTik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9udXBncmFkZW5lZWRlZCA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRiID0gZXZlbnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICBpZiAoIWRiLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMoQ0xJRU5UX1NUT1JFKSkge1xuICAgICAgICAgICAgICAgICAgICBkYi5jcmVhdGVPYmplY3RTdG9yZShDTElFTlRfU1RPUkUsIHsga2V5UGF0aDogJ2tleScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKGV2ZW50KSA9PiByZXNvbHZlKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKGV2ZW50KSA9PiByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGdldFZlY3RvckNsb2NrKCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuY2xvY2tDYWNoZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jbG9ja0NhY2hlO1xuICAgICAgICAgICAgeWllbGQgdGhpcy5pbml0KCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHlpZWxkIHRoaXMuZ2V0KENMSUVOVF9TVE9SRSwgQ0xJRU5UX1ZDX0tFWSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNsb2NrQ2FjaGUgPSByZXN1bHQudmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNsb2NrQ2FjaGUgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgeWllbGQgdGhpcy5zZXRWZWN0b3JDbG9jayh0aGlzLmNsb2NrQ2FjaGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jbG9ja0NhY2hlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZ2V0dGluZyB2ZWN0b3IgY2xvY2s6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmZhbGxiYWNrR2V0Q2xvY2tDYWNoZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgdXBkYXRlVmVjdG9yQ2xvY2soY2xpZW50SWQpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGxldCB2ZWN0b3JDbG9jayA9IHlpZWxkIHRoaXMuZ2V0VmVjdG9yQ2xvY2soKTtcbiAgICAgICAgICAgIHZlY3RvckNsb2NrW2NsaWVudElkXSA9ICh2ZWN0b3JDbG9ja1tjbGllbnRJZF0gfHwgMCkgKyAxO1xuICAgICAgICAgICAgLy8gU2F2ZSB0aGUgdXBkYXRlZCB2ZWN0b3IgY2xvY2sgdG8gSW5kZXhlZERCXG4gICAgICAgICAgICB0aGlzLnNldFZlY3RvckNsb2NrKHZlY3RvckNsb2NrKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHNldFZlY3RvckNsb2NrKGNsb2NrKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICB5aWVsZCB0aGlzLmluaXQoKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgeWllbGQgdGhpcy5wdXQoQ0xJRU5UX1NUT1JFLCB7IGtleTogQ0xJRU5UX1ZDX0tFWSwgdmFsdWU6IGNsb2NrIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xvY2tDYWNoZSA9IGNsb2NrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc2V0dGluZyB2ZWN0b3IgY2xvY2s6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHRoaXMuZmFsbGJhY2tTZXRDbG9ja0NhY2hlKGNsb2NrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGZhbGxiYWNrR2V0Q2xvY2tDYWNoZSgpIHtcbiAgICAgICAgbGV0IGNsb2NrID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oQ0xJRU5UX1ZDX0tFWSk7XG4gICAgICAgIGlmICghY2xvY2spIHtcbiAgICAgICAgICAgIGNsb2NrID0gSlNPTi5zdHJpbmdpZnkoe30pO1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oQ0xJRU5UX1ZDX0tFWSwgY2xvY2spO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKGNsb2NrKTtcbiAgICB9XG4gICAgZmFsbGJhY2tTZXRDbG9ja0NhY2hlKGNsb2NrKSB7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKENMSUVOVF9WQ19LRVksIEpTT04uc3RyaW5naWZ5KGNsb2NrKSk7XG4gICAgfVxuICAgIGdldENsaWVudElkKCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuY2xpZW50SWRDYWNoZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jbGllbnRJZENhY2hlO1xuICAgICAgICAgICAgeWllbGQgdGhpcy5pbml0KCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHlpZWxkIHRoaXMuZ2V0KENMSUVOVF9TVE9SRSwgQ0xJRU5UX0lEX0tFWSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNsaWVudElkQ2FjaGUgPSByZXN1bHQudmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNsaWVudElkQ2FjaGUgPSBjcnlwdG8ucmFuZG9tVVVJRCgpO1xuICAgICAgICAgICAgICAgICAgICB5aWVsZCB0aGlzLnNldENsaWVudElkKHRoaXMuY2xpZW50SWRDYWNoZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNsaWVudElkQ2FjaGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBnZXR0aW5nIGNsaWVudElkOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5mYWxsYmFja0dldENsaWVudElkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBzZXRDbGllbnRJZChjbGllbnRJZCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgeWllbGQgdGhpcy5pbml0KCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHlpZWxkIHRoaXMucHV0KENMSUVOVF9TVE9SRSwgeyBrZXk6IENMSUVOVF9JRF9LRVksIHZhbHVlOiBjbGllbnRJZCB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsaWVudElkQ2FjaGUgPSBjbGllbnRJZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNldHRpbmcgY2xpZW50SWQ6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHRoaXMuZmFsbGJhY2tTZXRDbGllbnRJZChjbGllbnRJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBmYWxsYmFja0dldENsaWVudElkKCkge1xuICAgICAgICBsZXQgY2xpZW50SWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShDTElFTlRfSURfS0VZKTtcbiAgICAgICAgaWYgKCFjbGllbnRJZCkge1xuICAgICAgICAgICAgY2xpZW50SWQgPSBjcnlwdG8ucmFuZG9tVVVJRCgpO1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oQ0xJRU5UX0lEX0tFWSwgY2xpZW50SWQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjbGllbnRJZDtcbiAgICB9XG4gICAgZmFsbGJhY2tTZXRDbGllbnRJZChjbGllbnRJZCkge1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShDTElFTlRfSURfS0VZLCBjbGllbnRJZCk7XG4gICAgfVxuICAgIGdldChzdG9yZU5hbWUsIGtleSkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdLCAncmVhZG9ubHknKTtcbiAgICAgICAgICAgIGNvbnN0IHN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc3RvcmVOYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBzdG9yZS5nZXQoa2V5KTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKGV2ZW50KSA9PiByZXNvbHZlKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKGV2ZW50KSA9PiByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHB1dChzdG9yZU5hbWUsIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgICAgIGNvbnN0IHN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc3RvcmVOYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBzdG9yZS5wdXQodmFsdWUpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKCk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoZXZlbnQpID0+IHJlamVjdChldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5jb25zdCBzdG9yYWdlU2VydmljZSA9IG5ldyBTdG9yYWdlU2VydmljZSgpO1xuZXhwb3J0cy5kZWZhdWx0ID0gc3RvcmFnZVNlcnZpY2U7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuY29udmVydENoYW5nZUR0b1RvQ2hhbmdlID0gY29udmVydENoYW5nZUR0b1RvQ2hhbmdlO1xuZXhwb3J0cy5tZXJnZVZlY3RvckNsb2NrcyA9IG1lcmdlVmVjdG9yQ2xvY2tzO1xuZXhwb3J0cy5jb21wYXJlVmVjdG9yQ2xvY2tzID0gY29tcGFyZVZlY3RvckNsb2NrcztcbmZ1bmN0aW9uIGNvbnZlcnRDaGFuZ2VEdG9Ub0NoYW5nZShkdG8pIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBpZDogYCR7ZHRvLmNsaWVudElkfS0ke2R0by51cGRhdGVkQXQgfHwgbmV3IERhdGUoKS50b0lTT1N0cmluZygpfWAsXG4gICAgICAgIHVwZGF0ZWRBdDogZHRvLnVwZGF0ZWRBdCB8fCBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIHR5cGU6IGR0by50eXBlLFxuICAgICAgICBwb3NpdGlvbjogZHRvLnBvc2l0aW9uLFxuICAgICAgICBjbGllbnRJZDogZHRvLmNsaWVudElkLFxuICAgICAgICB0ZXh0OiBkdG8udGV4dCxcbiAgICAgICAgbGVuZ3RoOiBkdG8ubGVuZ3RoLFxuICAgICAgICB2ZWN0b3JDbG9jazogT2JqZWN0LmFzc2lnbih7fSwgZHRvLnZlY3RvckNsb2NrKVxuICAgIH07XG59XG5mdW5jdGlvbiBtZXJnZVZlY3RvckNsb2Nrcyh2YzEsIHZjMikge1xuICAgIGNvbnN0IG1lcmdlZCA9IE9iamVjdC5hc3NpZ24oe30sIHZjMSk7XG4gICAgZm9yIChjb25zdCBjbGllbnRJZCBpbiB2YzIpIHtcbiAgICAgICAgbWVyZ2VkW2NsaWVudElkXSA9IE1hdGgubWF4KG1lcmdlZFtjbGllbnRJZF0gfHwgMCwgdmMyW2NsaWVudElkXSk7XG4gICAgfVxuICAgIHJldHVybiBtZXJnZWQ7XG59XG5mdW5jdGlvbiBjb21wYXJlVmVjdG9yQ2xvY2tzKHZjMSwgdmMyKSB7XG4gICAgbGV0IGlzTGVzcyA9IGZhbHNlO1xuICAgIGxldCBpc0dyZWF0ZXIgPSBmYWxzZTtcbiAgICBmb3IgKGNvbnN0IGNsaWVudElkIGluIHZjMSkge1xuICAgICAgICBpZiAoIShjbGllbnRJZCBpbiB2YzIpIHx8IHZjMVtjbGllbnRJZF0gPiB2YzJbY2xpZW50SWRdKSB7XG4gICAgICAgICAgICBpc0dyZWF0ZXIgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHZjMVtjbGllbnRJZF0gPCB2YzJbY2xpZW50SWRdKSB7XG4gICAgICAgICAgICBpc0xlc3MgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3QgY2xpZW50SWQgaW4gdmMyKSB7XG4gICAgICAgIGlmICghKGNsaWVudElkIGluIHZjMSkpIHtcbiAgICAgICAgICAgIGlzTGVzcyA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGlzR3JlYXRlciAmJiBpc0xlc3MpXG4gICAgICAgIHJldHVybiAwOyAvLyBDb25jdXJyZW50XG4gICAgaWYgKGlzR3JlYXRlcilcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgaWYgKGlzTGVzcylcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIHJldHVybiAwOyAvLyBFcXVhbFxufVxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIiIsIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgaXMgcmVmZXJlbmNlZCBieSBvdGhlciBtb2R1bGVzIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL21haW4udHNcIik7XG4iLCIiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=