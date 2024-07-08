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
const storageService_1 = __importDefault(__webpack_require__(/*! ./storageService */ "./src/storageService.ts"));
document.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
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
    let clientId = yield storageService_1.default.getClientId();
    console.log('Using clientId:', clientId);
    // Handle adding a new item
    addItemForm.addEventListener('submit', (e) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('addEventListener submit CALLED');
        e.preventDefault();
        const type = document.getElementById('type').value;
        const position = document.getElementById('position').value;
        const text = document.getElementById('text').value;
        const length = document.getElementById('length').value;
        // Create a change DTO object
        const changeDto = {
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
            const response = yield fetch(SERVER_BASE_URL + 'sync/client-changes', {
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
            }
            else {
                console.error('Error submitting client change:', response.statusText);
            }
            console.timeEnd("API CALL");
        }
        catch (error) {
            console.error('Error submitting client change:', error);
        }
    }));
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
        }
        else if (action === 'displayItem') {
            console.log('Displaying fetched item:', data);
            message.innerText = data.length ? JSON.stringify(data, null, 2) : 'Item not found';
        }
        else if (action === 'displayDoc') {
            console.log('Displaying current document:', data);
            docDisplay.innerHTML = data;
        }
        else if (action === 'message') {
            console.log('Message from worker:', data);
            message.innerText = data;
        }
        else if (action === 'error') {
            console.error('Error:', data);
            message.innerText = data;
        }
        else {
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
        console.log("START fetchServerChanges() , since.toISOString(): ", since.toISOString());
        fetch(SERVER_BASE_URL + `sync/server-changes?since=${encodeURIComponent(since.toISOString())}`)
            .then(response => response.json())
            .then((serverChanges) => {
            console.log('Server changes received:', serverChanges);
            if (serverChanges.length > 0) {
                lastFetchTime = new Date(Math.max(...serverChanges.map((change) => new Date(change.updatedAt).getTime())));
                // lastFetchTime = new Date(Math.max(...serverChanges.map((change: Change) => new Date(change.updatedAt))));
                console.log("fetchServerChanges(), New Fetch time set:", lastFetchTime.toISOString());
                serverChanges.forEach((change) => {
                    change.updatedAt = new Date(change.updatedAt).toISOString();
                    worker.postMessage({ action: 'addItem', data: change });
                });
                worker.postMessage({ action: 'viewDoc' });
            }
            else {
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
}));


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
class StorageService {
    constructor() {
        this.db = null;
        this.clientIdCache = null;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxrQkFBZTs7Ozs7OztVQzFHZjtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7O1VFdEJBO1VBQ0E7VUFDQTtVQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZnJvbnRlbmRfbWluaW1hbF9mb3Jfb3RfY2hhbmdlLy4vc3JjL21haW4udHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmRfbWluaW1hbF9mb3Jfb3RfY2hhbmdlLy4vc3JjL3N0b3JhZ2VTZXJ2aWNlLnRzIiwid2VicGFjazovL2Zyb250ZW5kX21pbmltYWxfZm9yX290X2NoYW5nZS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9mcm9udGVuZF9taW5pbWFsX2Zvcl9vdF9jaGFuZ2Uvd2VicGFjay9iZWZvcmUtc3RhcnR1cCIsIndlYnBhY2s6Ly9mcm9udGVuZF9taW5pbWFsX2Zvcl9vdF9jaGFuZ2Uvd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL2Zyb250ZW5kX21pbmltYWxfZm9yX290X2NoYW5nZS93ZWJwYWNrL2FmdGVyLXN0YXJ0dXAiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hd2FpdGVyID0gKHRoaXMgJiYgdGhpcy5fX2F3YWl0ZXIpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xuICAgIH0pO1xufTtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IHN0b3JhZ2VTZXJ2aWNlXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vc3RvcmFnZVNlcnZpY2VcIikpO1xuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IF9fYXdhaXRlcih2b2lkIDAsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgIGNvbnNvbGUubG9nKCdET00gaXMgZnVsbHkgbG9hZGVkJyk7XG4gICAgY29uc3QgYWRkSXRlbUZvcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkSXRlbUZvcm0nKTtcbiAgICBjb25zdCBmZXRjaERhdGFCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmV0Y2hEYXRhQnV0dG9uJyk7XG4gICAgY29uc3QgZGF0YURpc3BsYXkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGF0YURpc3BsYXknKTtcbiAgICBjb25zdCBnZXRJdGVtQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2dldEl0ZW1CdXR0b24nKTtcbiAgICBjb25zdCBjbGllbnRJZElucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NsaWVudElkSW5wdXQnKTtcbiAgICBjb25zdCBtZXNzYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lc3NhZ2UnKTtcbiAgICBjb25zdCB2aWV3RG9jQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZpZXdEb2NCdXR0b24nKTtcbiAgICBjb25zdCBkb2NEaXNwbGF5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RvY0Rpc3BsYXknKTtcbiAgICBjb25zdCByZXNldERvY3VtZW50QnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc2V0RG9jdW1lbnRCdXR0b24nKTtcbiAgICBjb25zdCBhcHBseU9wZXJhdGlvbkJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhcHBseU9wZXJhdGlvbkJ1dHRvbicpO1xuICAgIGNvbnN0IGdldERvY3VtZW50QnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2dldERvY3VtZW50QnV0dG9uJyk7XG4gICAgY29uc3QgZmV0Y2hTZXJ2ZXJDaGFuZ2VzQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZldGNoU2VydmVyQ2hhbmdlc0J1dHRvbicpO1xuICAgIGxldCBsYXN0RmV0Y2hUaW1lID0gbmV3IERhdGUoMCk7IC8vIEluaXRpYWxpemUgdG8gZXBvY2ggdGltZVxuICAgIC8vIEluaXRpYWxpemUgV2ViIFdvcmtlclxuICAgIGNvbnN0IHdvcmtlciA9IG5ldyBXb3JrZXIoJ3dvcmtlci5qcycpO1xuICAgIGNvbnNvbGUubG9nKCdXZWIgV29ya2VyIGluaXRpYWxpemVkLicpO1xuICAgIGNvbnN0IFNFUlZFUl9CQVNFX1VSTCA9ICdodHRwczovL25lc3Rqcy1zZXJ2aWNlLWFwcC1lZWQyNTJhYjJhYzYuaGVyb2t1YXBwLmNvbS8nO1xuICAgIC8vIEluaXRpYWxpemUgY2xpZW50SWRcbiAgICBsZXQgY2xpZW50SWQgPSB5aWVsZCBzdG9yYWdlU2VydmljZV8xLmRlZmF1bHQuZ2V0Q2xpZW50SWQoKTtcbiAgICBjb25zb2xlLmxvZygnVXNpbmcgY2xpZW50SWQ6JywgY2xpZW50SWQpO1xuICAgIC8vIEhhbmRsZSBhZGRpbmcgYSBuZXcgaXRlbVxuICAgIGFkZEl0ZW1Gb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIChlKSA9PiBfX2F3YWl0ZXIodm9pZCAwLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2FkZEV2ZW50TGlzdGVuZXIgc3VibWl0IENBTExFRCcpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnN0IHR5cGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHlwZScpLnZhbHVlO1xuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwb3NpdGlvbicpLnZhbHVlO1xuICAgICAgICBjb25zdCB0ZXh0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RleHQnKS52YWx1ZTtcbiAgICAgICAgY29uc3QgbGVuZ3RoID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xlbmd0aCcpLnZhbHVlO1xuICAgICAgICAvLyBDcmVhdGUgYSBjaGFuZ2UgRFRPIG9iamVjdFxuICAgICAgICBjb25zdCBjaGFuZ2VEdG8gPSB7XG4gICAgICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICBwb3NpdGlvbjogcGFyc2VJbnQocG9zaXRpb24sIDEwKSxcbiAgICAgICAgICAgIGNsaWVudElkLFxuICAgICAgICAgICAgdGV4dDogdHlwZSA9PT0gJ2luc2VydCcgPyB0ZXh0IDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgbGVuZ3RoOiB0eXBlID09PSAnZGVsZXRlJyA/IHBhcnNlSW50KGxlbmd0aCwgMTApIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgdmVjdG9yQ2xvY2s6IHt9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnNvbGUubG9nKCdTdWJtaXR0aW5nIG5ldyBjaGFuZ2U6JywgY2hhbmdlRHRvKTtcbiAgICAgICAgY29uc29sZS50aW1lKFwiQVBJIENBTExcIik7XG4gICAgICAgIC8vIFNlbmQgdGhlIGNoYW5nZUR0byB0byB0aGUgc2VydmVyXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IHlpZWxkIGZldGNoKFNFUlZFUl9CQVNFX1VSTCArICdzeW5jL2NsaWVudC1jaGFuZ2VzJywge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KFtjaGFuZ2VEdG9dKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0NsaWVudCBjaGFuZ2Ugc3VibWl0dGVkIHN1Y2Nlc3NmdWxseScpO1xuICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgSW5kZXhlZERCXG4gICAgICAgICAgICAgICAgd29ya2VyLnBvc3RNZXNzYWdlKHsgYWN0aW9uOiAnYWRkSXRlbScsIGRhdGE6IGNoYW5nZUR0byB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHN1Ym1pdHRpbmcgY2xpZW50IGNoYW5nZTonLCByZXNwb25zZS5zdGF0dXNUZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUudGltZUVuZChcIkFQSSBDQUxMXCIpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc3VibWl0dGluZyBjbGllbnQgY2hhbmdlOicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH0pKTtcbiAgICAvLyBIYW5kbGUgZmV0Y2hpbmcgYWxsIGRhdGFcbiAgICBmZXRjaERhdGFCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdGZXRjaGluZyBhbGwgZGF0YSBmcm9tIEluZGV4ZWREQi4nKTtcbiAgICAgICAgd29ya2VyLnBvc3RNZXNzYWdlKHsgYWN0aW9uOiAnZmV0Y2hEYXRhJyB9KTtcbiAgICB9KTtcbiAgICAvLyBIYW5kbGUgZ2V0dGluZyBhbiBpdGVtIGJ5IENsaWVudCBJRFxuICAgIGdldEl0ZW1CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGNsaWVudElkID0gY2xpZW50SWRJbnB1dC52YWx1ZTtcbiAgICAgICAgY29uc29sZS5sb2coJ0ZldGNoaW5nIGRhdGEgZm9yIGNsaWVudCBJRDonLCBjbGllbnRJZCk7XG4gICAgICAgIHdvcmtlci5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICBhY3Rpb246ICdnZXRJdGVtQnlDbGllbnRJZCcsXG4gICAgICAgICAgICBjbGllbnRJZFxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICAvLyBIYW5kbGUgdmlld2luZyB0aGUgY3VycmVudCBkb2N1bWVudFxuICAgIHZpZXdEb2NCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdGZXRjaGluZyB0aGUgY3VycmVudCBkb2N1bWVudC4nKTtcbiAgICAgICAgd29ya2VyLnBvc3RNZXNzYWdlKHsgYWN0aW9uOiAndmlld0RvYycgfSk7XG4gICAgfSk7XG4gICAgLy8gSGFuZGxlIG1lc3NhZ2VzIGZyb20gdGhlIHdvcmtlclxuICAgIHdvcmtlci5vbm1lc3NhZ2UgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgY29uc3QgeyBhY3Rpb24sIGRhdGEgfSA9IGV2ZW50LmRhdGE7XG4gICAgICAgIGlmIChhY3Rpb24gPT09ICdkaXNwbGF5RGF0YScpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdEaXNwbGF5aW5nIGZldGNoZWQgZGF0YTonLCBkYXRhKTtcbiAgICAgICAgICAgIGRhdGFEaXNwbGF5LmlubmVySFRNTCA9IEpTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIDIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGFjdGlvbiA9PT0gJ2Rpc3BsYXlJdGVtJykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0Rpc3BsYXlpbmcgZmV0Y2hlZCBpdGVtOicsIGRhdGEpO1xuICAgICAgICAgICAgbWVzc2FnZS5pbm5lclRleHQgPSBkYXRhLmxlbmd0aCA/IEpTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIDIpIDogJ0l0ZW0gbm90IGZvdW5kJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChhY3Rpb24gPT09ICdkaXNwbGF5RG9jJykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0Rpc3BsYXlpbmcgY3VycmVudCBkb2N1bWVudDonLCBkYXRhKTtcbiAgICAgICAgICAgIGRvY0Rpc3BsYXkuaW5uZXJIVE1MID0gZGF0YTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChhY3Rpb24gPT09ICdtZXNzYWdlJykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ01lc3NhZ2UgZnJvbSB3b3JrZXI6JywgZGF0YSk7XG4gICAgICAgICAgICBtZXNzYWdlLmlubmVyVGV4dCA9IGRhdGE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYWN0aW9uID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvcjonLCBkYXRhKTtcbiAgICAgICAgICAgIG1lc3NhZ2UuaW5uZXJUZXh0ID0gZGF0YTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignVW5rbm93biBhY3Rpb246JywgYWN0aW9uKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLy8gTG9nIGFueSBlcnJvcnMgZnJvbSB0aGUgd29ya2VyXG4gICAgd29ya2VyLm9uZXJyb3IgPSAoZXJyb3IpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gd29ya2VyOicsIGVycm9yKTtcbiAgICB9O1xuICAgIGZldGNoU2VydmVyQ2hhbmdlc0J1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgZmV0Y2hTZXJ2ZXJDaGFuZ2VzKGxhc3RGZXRjaFRpbWUpO1xuICAgIH0pO1xuICAgIGZ1bmN0aW9uIGZldGNoU2VydmVyQ2hhbmdlcyhzaW5jZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIlNUQVJUIGZldGNoU2VydmVyQ2hhbmdlcygpICwgc2luY2UudG9JU09TdHJpbmcoKTogXCIsIHNpbmNlLnRvSVNPU3RyaW5nKCkpO1xuICAgICAgICBmZXRjaChTRVJWRVJfQkFTRV9VUkwgKyBgc3luYy9zZXJ2ZXItY2hhbmdlcz9zaW5jZT0ke2VuY29kZVVSSUNvbXBvbmVudChzaW5jZS50b0lTT1N0cmluZygpKX1gKVxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UuanNvbigpKVxuICAgICAgICAgICAgLnRoZW4oKHNlcnZlckNoYW5nZXMpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdTZXJ2ZXIgY2hhbmdlcyByZWNlaXZlZDonLCBzZXJ2ZXJDaGFuZ2VzKTtcbiAgICAgICAgICAgIGlmIChzZXJ2ZXJDaGFuZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBsYXN0RmV0Y2hUaW1lID0gbmV3IERhdGUoTWF0aC5tYXgoLi4uc2VydmVyQ2hhbmdlcy5tYXAoKGNoYW5nZSkgPT4gbmV3IERhdGUoY2hhbmdlLnVwZGF0ZWRBdCkuZ2V0VGltZSgpKSkpO1xuICAgICAgICAgICAgICAgIC8vIGxhc3RGZXRjaFRpbWUgPSBuZXcgRGF0ZShNYXRoLm1heCguLi5zZXJ2ZXJDaGFuZ2VzLm1hcCgoY2hhbmdlOiBDaGFuZ2UpID0+IG5ldyBEYXRlKGNoYW5nZS51cGRhdGVkQXQpKSkpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZmV0Y2hTZXJ2ZXJDaGFuZ2VzKCksIE5ldyBGZXRjaCB0aW1lIHNldDpcIiwgbGFzdEZldGNoVGltZS50b0lTT1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICBzZXJ2ZXJDaGFuZ2VzLmZvckVhY2goKGNoYW5nZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjaGFuZ2UudXBkYXRlZEF0ID0gbmV3IERhdGUoY2hhbmdlLnVwZGF0ZWRBdCkudG9JU09TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgd29ya2VyLnBvc3RNZXNzYWdlKHsgYWN0aW9uOiAnYWRkSXRlbScsIGRhdGE6IGNoYW5nZSB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB3b3JrZXIucG9zdE1lc3NhZ2UoeyBhY3Rpb246ICd2aWV3RG9jJyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdObyBuZXcgY2hhbmdlcyBmcm9tIHNlcnZlcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZldGNoaW5nIHNlcnZlciBjaGFuZ2VzOicsIGVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgZmV0Y2hTZXJ2ZXJDaGFuZ2VzKGxhc3RGZXRjaFRpbWUpO1xuICAgIH0sIDMwMDAwKTtcbn0pKTtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBEQl9OQU1FID0gJ215QXBwREInO1xuY29uc3QgREJfVkVSU0lPTiA9IDE7XG5jb25zdCBDTElFTlRfU1RPUkUgPSAnY2xpZW50U3RvcmUnO1xuY29uc3QgQ0xJRU5UX0lEX0tFWSA9ICdjbGllbnRJZCc7XG5jbGFzcyBTdG9yYWdlU2VydmljZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZGIgPSBudWxsO1xuICAgICAgICB0aGlzLmNsaWVudElkQ2FjaGUgPSBudWxsO1xuICAgIH1cbiAgICBpbml0KCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmRiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kYiA9IHlpZWxkIHRoaXMub3BlbkRCKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBvcGVuREIoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gaW5kZXhlZERCLm9wZW4oREJfTkFNRSwgREJfVkVSU0lPTik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9udXBncmFkZW5lZWRlZCA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRiID0gZXZlbnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICBpZiAoIWRiLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMoQ0xJRU5UX1NUT1JFKSkge1xuICAgICAgICAgICAgICAgICAgICBkYi5jcmVhdGVPYmplY3RTdG9yZShDTElFTlRfU1RPUkUsIHsga2V5UGF0aDogJ2tleScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKGV2ZW50KSA9PiByZXNvbHZlKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKGV2ZW50KSA9PiByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGdldENsaWVudElkKCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuY2xpZW50SWRDYWNoZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jbGllbnRJZENhY2hlO1xuICAgICAgICAgICAgeWllbGQgdGhpcy5pbml0KCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHlpZWxkIHRoaXMuZ2V0KENMSUVOVF9TVE9SRSwgQ0xJRU5UX0lEX0tFWSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNsaWVudElkQ2FjaGUgPSByZXN1bHQudmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNsaWVudElkQ2FjaGUgPSBjcnlwdG8ucmFuZG9tVVVJRCgpO1xuICAgICAgICAgICAgICAgICAgICB5aWVsZCB0aGlzLnNldENsaWVudElkKHRoaXMuY2xpZW50SWRDYWNoZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNsaWVudElkQ2FjaGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBnZXR0aW5nIGNsaWVudElkOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5mYWxsYmFja0dldENsaWVudElkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBzZXRDbGllbnRJZChjbGllbnRJZCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgeWllbGQgdGhpcy5pbml0KCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHlpZWxkIHRoaXMucHV0KENMSUVOVF9TVE9SRSwgeyBrZXk6IENMSUVOVF9JRF9LRVksIHZhbHVlOiBjbGllbnRJZCB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsaWVudElkQ2FjaGUgPSBjbGllbnRJZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNldHRpbmcgY2xpZW50SWQ6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHRoaXMuZmFsbGJhY2tTZXRDbGllbnRJZChjbGllbnRJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBmYWxsYmFja0dldENsaWVudElkKCkge1xuICAgICAgICBsZXQgY2xpZW50SWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShDTElFTlRfSURfS0VZKTtcbiAgICAgICAgaWYgKCFjbGllbnRJZCkge1xuICAgICAgICAgICAgY2xpZW50SWQgPSBjcnlwdG8ucmFuZG9tVVVJRCgpO1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oQ0xJRU5UX0lEX0tFWSwgY2xpZW50SWQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjbGllbnRJZDtcbiAgICB9XG4gICAgZmFsbGJhY2tTZXRDbGllbnRJZChjbGllbnRJZCkge1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShDTElFTlRfSURfS0VZLCBjbGllbnRJZCk7XG4gICAgfVxuICAgIGdldChzdG9yZU5hbWUsIGtleSkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdLCAncmVhZG9ubHknKTtcbiAgICAgICAgICAgIGNvbnN0IHN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc3RvcmVOYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBzdG9yZS5nZXQoa2V5KTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKGV2ZW50KSA9PiByZXNvbHZlKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKGV2ZW50KSA9PiByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHB1dChzdG9yZU5hbWUsIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgICAgIGNvbnN0IHN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc3RvcmVOYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBzdG9yZS5wdXQodmFsdWUpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKCk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoZXZlbnQpID0+IHJlamVjdChldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5jb25zdCBzdG9yYWdlU2VydmljZSA9IG5ldyBTdG9yYWdlU2VydmljZSgpO1xuZXhwb3J0cy5kZWZhdWx0ID0gc3RvcmFnZVNlcnZpY2U7XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiIiwiLy8gc3RhcnR1cFxuLy8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4vLyBUaGlzIGVudHJ5IG1vZHVsZSBpcyByZWZlcmVuY2VkIGJ5IG90aGVyIG1vZHVsZXMgc28gaXQgY2FuJ3QgYmUgaW5saW5lZFxudmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKFwiLi9zcmMvbWFpbi50c1wiKTtcbiIsIiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==