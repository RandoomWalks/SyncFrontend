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
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/storageService.ts"](0, __webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZVNlcnZpY2UuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFhO0FBQ2I7QUFDQSw0QkFBNEIsK0RBQStELGlCQUFpQjtBQUM1RztBQUNBLG9DQUFvQyxNQUFNLCtCQUErQixZQUFZO0FBQ3JGLG1DQUFtQyxNQUFNLG1DQUFtQyxZQUFZO0FBQ3hGLGdDQUFnQztBQUNoQztBQUNBLEtBQUs7QUFDTDtBQUNBLDhDQUE2QyxFQUFFLGFBQWEsRUFBQztBQUM3RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseURBQXlELGdCQUFnQjtBQUN6RTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtDQUErQyxxQ0FBcUM7QUFDcEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0Esa0JBQWU7Ozs7Ozs7O1VFMUdmO1VBQ0E7VUFDQTtVQUNBO1VBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9mcm9udGVuZF9taW5pbWFsX2Zvcl9vdF9jaGFuZ2UvLi9zcmMvc3RvcmFnZVNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vZnJvbnRlbmRfbWluaW1hbF9mb3Jfb3RfY2hhbmdlL3dlYnBhY2svYmVmb3JlLXN0YXJ0dXAiLCJ3ZWJwYWNrOi8vZnJvbnRlbmRfbWluaW1hbF9mb3Jfb3RfY2hhbmdlL3dlYnBhY2svc3RhcnR1cCIsIndlYnBhY2s6Ly9mcm9udGVuZF9taW5pbWFsX2Zvcl9vdF9jaGFuZ2Uvd2VicGFjay9hZnRlci1zdGFydHVwIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBEQl9OQU1FID0gJ215QXBwREInO1xuY29uc3QgREJfVkVSU0lPTiA9IDE7XG5jb25zdCBDTElFTlRfU1RPUkUgPSAnY2xpZW50U3RvcmUnO1xuY29uc3QgQ0xJRU5UX0lEX0tFWSA9ICdjbGllbnRJZCc7XG5jbGFzcyBTdG9yYWdlU2VydmljZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZGIgPSBudWxsO1xuICAgICAgICB0aGlzLmNsaWVudElkQ2FjaGUgPSBudWxsO1xuICAgIH1cbiAgICBpbml0KCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmRiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kYiA9IHlpZWxkIHRoaXMub3BlbkRCKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBvcGVuREIoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gaW5kZXhlZERCLm9wZW4oREJfTkFNRSwgREJfVkVSU0lPTik7XG4gICAgICAgICAgICByZXF1ZXN0Lm9udXBncmFkZW5lZWRlZCA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRiID0gZXZlbnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICBpZiAoIWRiLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMoQ0xJRU5UX1NUT1JFKSkge1xuICAgICAgICAgICAgICAgICAgICBkYi5jcmVhdGVPYmplY3RTdG9yZShDTElFTlRfU1RPUkUsIHsga2V5UGF0aDogJ2tleScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKGV2ZW50KSA9PiByZXNvbHZlKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKGV2ZW50KSA9PiByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGdldENsaWVudElkKCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuY2xpZW50SWRDYWNoZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jbGllbnRJZENhY2hlO1xuICAgICAgICAgICAgeWllbGQgdGhpcy5pbml0KCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHlpZWxkIHRoaXMuZ2V0KENMSUVOVF9TVE9SRSwgQ0xJRU5UX0lEX0tFWSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNsaWVudElkQ2FjaGUgPSByZXN1bHQudmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNsaWVudElkQ2FjaGUgPSBjcnlwdG8ucmFuZG9tVVVJRCgpO1xuICAgICAgICAgICAgICAgICAgICB5aWVsZCB0aGlzLnNldENsaWVudElkKHRoaXMuY2xpZW50SWRDYWNoZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNsaWVudElkQ2FjaGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBnZXR0aW5nIGNsaWVudElkOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5mYWxsYmFja0dldENsaWVudElkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBzZXRDbGllbnRJZChjbGllbnRJZCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgeWllbGQgdGhpcy5pbml0KCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHlpZWxkIHRoaXMucHV0KENMSUVOVF9TVE9SRSwgeyBrZXk6IENMSUVOVF9JRF9LRVksIHZhbHVlOiBjbGllbnRJZCB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsaWVudElkQ2FjaGUgPSBjbGllbnRJZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNldHRpbmcgY2xpZW50SWQ6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHRoaXMuZmFsbGJhY2tTZXRDbGllbnRJZChjbGllbnRJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBmYWxsYmFja0dldENsaWVudElkKCkge1xuICAgICAgICBsZXQgY2xpZW50SWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShDTElFTlRfSURfS0VZKTtcbiAgICAgICAgaWYgKCFjbGllbnRJZCkge1xuICAgICAgICAgICAgY2xpZW50SWQgPSBjcnlwdG8ucmFuZG9tVVVJRCgpO1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oQ0xJRU5UX0lEX0tFWSwgY2xpZW50SWQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjbGllbnRJZDtcbiAgICB9XG4gICAgZmFsbGJhY2tTZXRDbGllbnRJZChjbGllbnRJZCkge1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShDTElFTlRfSURfS0VZLCBjbGllbnRJZCk7XG4gICAgfVxuICAgIGdldChzdG9yZU5hbWUsIGtleSkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRiLnRyYW5zYWN0aW9uKFtzdG9yZU5hbWVdLCAncmVhZG9ubHknKTtcbiAgICAgICAgICAgIGNvbnN0IHN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc3RvcmVOYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBzdG9yZS5nZXQoa2V5KTtcbiAgICAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKGV2ZW50KSA9PiByZXNvbHZlKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKGV2ZW50KSA9PiByZWplY3QoZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHB1dChzdG9yZU5hbWUsIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGIudHJhbnNhY3Rpb24oW3N0b3JlTmFtZV0sICdyZWFkd3JpdGUnKTtcbiAgICAgICAgICAgIGNvbnN0IHN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc3RvcmVOYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBzdG9yZS5wdXQodmFsdWUpO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiByZXNvbHZlKCk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoZXZlbnQpID0+IHJlamVjdChldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5jb25zdCBzdG9yYWdlU2VydmljZSA9IG5ldyBTdG9yYWdlU2VydmljZSgpO1xuZXhwb3J0cy5kZWZhdWx0ID0gc3RvcmFnZVNlcnZpY2U7XG4iLCIiLCIvLyBzdGFydHVwXG4vLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8vIFRoaXMgZW50cnkgbW9kdWxlIGlzIHJlZmVyZW5jZWQgYnkgb3RoZXIgbW9kdWxlcyBzbyBpdCBjYW4ndCBiZSBpbmxpbmVkXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IHt9O1xuX193ZWJwYWNrX21vZHVsZXNfX1tcIi4vc3JjL3N0b3JhZ2VTZXJ2aWNlLnRzXCJdKDAsIF9fd2VicGFja19leHBvcnRzX18pO1xuIiwiIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9