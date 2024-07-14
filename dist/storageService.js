/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

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


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/storageService.ts"](0, __webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZVNlcnZpY2UuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFhO0FBQ2I7QUFDQSw0QkFBNEIsK0RBQStELGlCQUFpQjtBQUM1RztBQUNBLG9DQUFvQyxNQUFNLCtCQUErQixZQUFZO0FBQ3JGLG1DQUFtQyxNQUFNLG1DQUFtQyxZQUFZO0FBQ3hGLGdDQUFnQztBQUNoQztBQUNBLEtBQUs7QUFDTDtBQUNBLDhDQUE2QyxFQUFFLGFBQWEsRUFBQztBQUM3RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlEQUF5RCxnQkFBZ0I7QUFDekU7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQ0FBK0Msa0NBQWtDO0FBQ2pGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQztBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtDQUErQyxxQ0FBcUM7QUFDcEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0Esa0JBQWU7Ozs7Ozs7O1VFbEtmO1VBQ0E7VUFDQTtVQUNBO1VBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9mcm9udGVuZF9taW5pbWFsX2Zvcl9vdF9jaGFuZ2UvLi9zcmMvc3RvcmFnZVNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmRfbWluaW1hbF9mb3Jfb3RfY2hhbmdlL3dlYnBhY2svYmVmb3JlLXN0YXJ0dXAiLCJ3ZWJwYWNrOi8vZnJvbnRlbmRfbWluaW1hbF9mb3Jfb3RfY2hhbmdlL3dlYnBhY2svc3RhcnR1cCIsIndlYnBhY2s6Ly9mcm9udGVuZF9taW5pbWFsX2Zvcl9vdF9jaGFuZ2Uvd2VicGFjay9hZnRlci1zdGFydHVwIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBEQl9OQU1FID0gJ215QXBwREInO1xuY29uc3QgREJfVkVSU0lPTiA9IDE7XG5jb25zdCBDTElFTlRfU1RPUkUgPSAnY2xpZW50U3RvcmUnO1xuY29uc3QgQ0xJRU5UX0lEX0tFWSA9ICdjbGllbnRJZCc7XG5jb25zdCBDTElFTlRfVkNfS0VZID0gJ3ZlY3RvckNsb2NrJztcbmNsYXNzIFN0b3JhZ2VTZXJ2aWNlIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5kYiA9IG51bGw7XG4gICAgICAgIHRoaXMuY2xpZW50SWRDYWNoZSA9IG51bGw7XG4gICAgICAgIHRoaXMuY2xvY2tDYWNoZSA9IG51bGw7XG4gICAgfVxuICAgIGluaXQoKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZGIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRiID0geWllbGQgdGhpcy5vcGVuREIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIG9wZW5EQigpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBpbmRleGVkREIub3BlbihEQl9OQU1FLCBEQl9WRVJTSU9OKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGIgPSBldmVudC50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgICAgIGlmICghZGIub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucyhDTElFTlRfU1RPUkUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRiLmNyZWF0ZU9iamVjdFN0b3JlKENMSUVOVF9TVE9SRSwgeyBrZXlQYXRoOiAna2V5JyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHJlc29sdmUoZXZlbnQudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoZXZlbnQpID0+IHJlamVjdChldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZ2V0VmVjdG9yQ2xvY2soKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5jbG9ja0NhY2hlKVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNsb2NrQ2FjaGU7XG4gICAgICAgICAgICB5aWVsZCB0aGlzLmluaXQoKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0geWllbGQgdGhpcy5nZXQoQ0xJRU5UX1NUT1JFLCBDTElFTlRfVkNfS0VZKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xvY2tDYWNoZSA9IHJlc3VsdC52YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xvY2tDYWNoZSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICB5aWVsZCB0aGlzLnNldFZlY3RvckNsb2NrKHRoaXMuY2xvY2tDYWNoZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNsb2NrQ2FjaGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBnZXR0aW5nIHZlY3RvciBjbG9jazonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmFsbGJhY2tHZXRDbG9ja0NhY2hlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICB1cGRhdGVWZWN0b3JDbG9jayhjbGllbnRJZCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgbGV0IHZlY3RvckNsb2NrID0geWllbGQgdGhpcy5nZXRWZWN0b3JDbG9jaygpO1xuICAgICAgICAgICAgdmVjdG9yQ2xvY2tbY2xpZW50SWRdID0gKHZlY3RvckNsb2NrW2NsaWVudElkXSB8fCAwKSArIDE7XG4gICAgICAgICAgICAvLyBTYXZlIHRoZSB1cGRhdGVkIHZlY3RvciBjbG9jayB0byBJbmRleGVkREJcbiAgICAgICAgICAgIHRoaXMuc2V0VmVjdG9yQ2xvY2sodmVjdG9yQ2xvY2spO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgc2V0VmVjdG9yQ2xvY2soY2xvY2spIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuaW5pdCgpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB5aWVsZCB0aGlzLnB1dChDTElFTlRfU1RPUkUsIHsga2V5OiBDTElFTlRfVkNfS0VZLCB2YWx1ZTogY2xvY2sgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5jbG9ja0NhY2hlID0gY2xvY2s7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBzZXR0aW5nIHZlY3RvciBjbG9jazonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgdGhpcy5mYWxsYmFja1NldENsb2NrQ2FjaGUoY2xvY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZmFsbGJhY2tHZXRDbG9ja0NhY2hlKCkge1xuICAgICAgICBsZXQgY2xvY2sgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShDTElFTlRfVkNfS0VZKTtcbiAgICAgICAgaWYgKCFjbG9jaykge1xuICAgICAgICAgICAgY2xvY2sgPSBKU09OLnN0cmluZ2lmeSh7fSk7XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShDTElFTlRfVkNfS0VZLCBjbG9jayk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoY2xvY2spO1xuICAgIH1cbiAgICBmYWxsYmFja1NldENsb2NrQ2FjaGUoY2xvY2spIHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oQ0xJRU5UX1ZDX0tFWSwgSlNPTi5zdHJpbmdpZnkoY2xvY2spKTtcbiAgICB9XG4gICAgZ2V0Q2xpZW50SWQoKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5jbGllbnRJZENhY2hlKVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNsaWVudElkQ2FjaGU7XG4gICAgICAgICAgICB5aWVsZCB0aGlzLmluaXQoKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0geWllbGQgdGhpcy5nZXQoQ0xJRU5UX1NUT1JFLCBDTElFTlRfSURfS0VZKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xpZW50SWRDYWNoZSA9IHJlc3VsdC52YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xpZW50SWRDYWNoZSA9IGNyeXB0by5yYW5kb21VVUlEKCk7XG4gICAgICAgICAgICAgICAgICAgIHlpZWxkIHRoaXMuc2V0Q2xpZW50SWQodGhpcy5jbGllbnRJZENhY2hlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50SWRDYWNoZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGdldHRpbmcgY2xpZW50SWQ6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmZhbGxiYWNrR2V0Q2xpZW50SWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHNldENsaWVudElkKGNsaWVudElkKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICB5aWVsZCB0aGlzLmluaXQoKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgeWllbGQgdGhpcy5wdXQoQ0xJRU5UX1NUT1JFLCB7IGtleTogQ0xJRU5UX0lEX0tFWSwgdmFsdWU6IGNsaWVudElkIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xpZW50SWRDYWNoZSA9IGNsaWVudElkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc2V0dGluZyBjbGllbnRJZDonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgdGhpcy5mYWxsYmFja1NldENsaWVudElkKGNsaWVudElkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGZhbGxiYWNrR2V0Q2xpZW50SWQoKSB7XG4gICAgICAgIGxldCBjbGllbnRJZCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKENMSUVOVF9JRF9LRVkpO1xuICAgICAgICBpZiAoIWNsaWVudElkKSB7XG4gICAgICAgICAgICBjbGllbnRJZCA9IGNyeXB0by5yYW5kb21VVUlEKCk7XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShDTElFTlRfSURfS0VZLCBjbGllbnRJZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNsaWVudElkO1xuICAgIH1cbiAgICBmYWxsYmFja1NldENsaWVudElkKGNsaWVudElkKSB7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKENMSUVOVF9JRF9LRVksIGNsaWVudElkKTtcbiAgICB9XG4gICAgZ2V0KHN0b3JlTmFtZSwga2V5KSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkb25seScpO1xuICAgICAgICAgICAgY29uc3Qgc3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpO1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IHN0b3JlLmdldChrZXkpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHJlc29sdmUoZXZlbnQudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoZXZlbnQpID0+IHJlamVjdChldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcHV0KHN0b3JlTmFtZSwgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYi50cmFuc2FjdGlvbihbc3RvcmVOYW1lXSwgJ3JlYWR3cml0ZScpO1xuICAgICAgICAgICAgY29uc3Qgc3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpO1xuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IHN0b3JlLnB1dCh2YWx1ZSk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUoKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9IChldmVudCkgPT4gcmVqZWN0KGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmNvbnN0IHN0b3JhZ2VTZXJ2aWNlID0gbmV3IFN0b3JhZ2VTZXJ2aWNlKCk7XG5leHBvcnRzLmRlZmF1bHQgPSBzdG9yYWdlU2VydmljZTtcbiIsIiIsIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgaXMgcmVmZXJlbmNlZCBieSBvdGhlciBtb2R1bGVzIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0ge307XG5fX3dlYnBhY2tfbW9kdWxlc19fW1wiLi9zcmMvc3RvcmFnZVNlcnZpY2UudHNcIl0oMCwgX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4iLCIiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=