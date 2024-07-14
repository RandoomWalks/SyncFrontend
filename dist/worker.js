/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it uses a non-standard name for the exports (exports).
(() => {
var exports = __webpack_exports__;
/*!***********************!*\
  !*** ./src/worker.ts ***!
  \***********************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
const dbName = 'DemoDB';
const storeName = 'Items';
let db;
const openDB = () => {
    return new Promise((resolve, reject) => {
        console.log('Opening IndexedDB...');
        const request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            console.log('Creating object store...');
            db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: false });
        };
        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('IndexedDB opened successfully.');
            resolve(db);
        };
        request.onerror = (event) => {
            console.error('Error opening database:', event.target.error);
            reject('Error opening database');
        };
    });
};
const addItem = (item) => {
    console.time("IDB_ADD");
    return new Promise((resolve, reject) => {
        console.log('Adding item to IndexedDB:', item);
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        // Use a composite key of clientId and updatedAt for the id
        const id = `${item.clientId}-${item.updatedAt}`;
        const itemToAdd = Object.assign(Object.assign({}, item), { id });
        const request = store.put(itemToAdd); // Use put instead of add to update if exists
        request.onsuccess = () => {
            console.log('Item added/updated successfully. Vector clock:', item.vectorClock);
            console.timeEnd("IDB_ADD");
            resolve('Item added/updated successfully');
        };
        request.onerror = (event) => {
            console.error('Error adding/updating item:', event.target.error);
            reject('Error adding/updating item');
        };
    });
};
// const addItem = (item: any): Promise<string> => {
//     console.time("IDB_ADD");
//     return new Promise((resolve, reject) => {
//         console.log('Adding item to IndexedDB:', item);
//         const transaction = db.transaction(storeName, 'readwrite');
//         const store = transaction.objectStore(storeName);
//         const request = store.add(item);
//         request.onsuccess = () => {
//             console.log('Item added successfully.');
//             console.timeEnd("IDB_ADD");
//             console.timeEnd("API CALL");
//             resolve('Item added successfully');
//         };
//         request.onerror = (event: Event) => {
//             console.error('Error adding item:', (event.target as IDBRequest).error);
//             reject('Error adding item');
//         };
//     });
// };
const fetchData = () => {
    return new Promise((resolve, reject) => {
        console.log('Fetching all data from IndexedDB...');
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = (event) => {
            console.log('Data fetched successfully.');
            resolve(event.target.result);
        };
        request.onerror = (event) => {
            console.error('Error fetching data:', event.target.error);
            reject('Error fetching data');
        };
    });
};
const getItemsByClientId = (clientId) => {
    return new Promise((resolve, reject) => {
        console.log(`Fetching items for client ID: ${clientId}`);
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.openCursor();
        const results = [];
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                if (cursor.value.clientId === clientId) {
                    results.push(cursor.value);
                }
                cursor.continue();
            }
            else {
                console.log('Items fetched successfully:', results);
                resolve(results);
            }
        };
        request.onerror = (event) => {
            console.error('Error getting items:', event.target.error);
            reject('Error getting items');
        };
    });
};
const viewDoc = () => {
    return new Promise((resolve, reject) => {
        console.log('Fetching the current document from IndexedDB...');
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = (event) => {
            const changes = event.target.result;
            // Sort changes based on vector clocks
            changes.sort((a, b) => {
                const aTime = new Date(a.updatedAt).getTime();
                const bTime = new Date(b.updatedAt).getTime();
                if (aTime !== bTime)
                    return aTime - bTime;
                return a.clientId.localeCompare(b.clientId);
            });
            let document = '';
            changes.forEach((change) => {
                if (change.type === 'insert') {
                    document = document.slice(0, change.position) + change.text + document.slice(change.position);
                }
                else if (change.type === 'delete') {
                    document = document.slice(0, change.position) + document.slice(change.position + (change.length || 0));
                }
            });
            console.log('Current document constructed:', document);
            resolve(document);
        };
        request.onerror = (event) => {
            console.error('Error fetching document:', event.target.error);
            reject('Error fetching document');
        };
    });
};
self.onmessage = (event) => {
    const { action, data, clientId } = event.data;
    console.log(`Received action: ${action}`, event.data);
    switch (action) {
        case 'addItem':
            openDB()
                .then(() => addItem(data))
                .then((message) => {
                self.postMessage({ action: 'message', data: message });
            })
                .catch((error) => {
                self.postMessage({ action: 'error', data: error });
            });
            break;
        case 'fetchData':
            openDB()
                .then(() => fetchData())
                .then((data) => {
                self.postMessage({ action: 'displayData', data });
            })
                .catch((error) => {
                self.postMessage({ action: 'error', data: error });
            });
            break;
        case 'getItemByClientId':
            openDB()
                .then(() => getItemsByClientId(clientId))
                .then((data) => {
                self.postMessage({ action: 'displayItem', data });
            })
                .catch((error) => {
                self.postMessage({ action: 'error', data: error });
            });
            break;
        case 'viewDoc':
            openDB()
                .then(() => viewDoc())
                .then((data) => {
                self.postMessage({ action: 'displayDoc', data });
            })
                .catch((error) => {
                self.postMessage({ action: 'error', data: error });
            });
            break;
        default:
            console.warn('Unknown action:', action);
            self.postMessage({ action: 'error', data: 'Unknown action' });
    }
};

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQThDLHFDQUFxQztBQUNuRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCLGNBQWMsR0FBRyxlQUFlO0FBQ3RELHdEQUF3RCxXQUFXLElBQUk7QUFDdkUsOENBQThDO0FBQzlDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLHFEQUFxRCxTQUFTO0FBQzlEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZLHlCQUF5QjtBQUNyQyxvQ0FBb0MsT0FBTztBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUNBQW1DLGtDQUFrQztBQUNyRSxhQUFhO0FBQ2I7QUFDQSxtQ0FBbUMsOEJBQThCO0FBQ2pFLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUNBQW1DLDZCQUE2QjtBQUNoRSxhQUFhO0FBQ2I7QUFDQSxtQ0FBbUMsOEJBQThCO0FBQ2pFLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUNBQW1DLDZCQUE2QjtBQUNoRSxhQUFhO0FBQ2I7QUFDQSxtQ0FBbUMsOEJBQThCO0FBQ2pFLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUNBQW1DLDRCQUE0QjtBQUMvRCxhQUFhO0FBQ2I7QUFDQSxtQ0FBbUMsOEJBQThCO0FBQ2pFLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSwrQkFBK0IseUNBQXlDO0FBQ3hFO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9mcm9udGVuZF9taW5pbWFsX2Zvcl9vdF9jaGFuZ2UvLi9zcmMvd29ya2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgZGJOYW1lID0gJ0RlbW9EQic7XG5jb25zdCBzdG9yZU5hbWUgPSAnSXRlbXMnO1xubGV0IGRiO1xuY29uc3Qgb3BlbkRCID0gKCkgPT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdPcGVuaW5nIEluZGV4ZWREQi4uLicpO1xuICAgICAgICBjb25zdCByZXF1ZXN0ID0gaW5kZXhlZERCLm9wZW4oZGJOYW1lLCAxKTtcbiAgICAgICAgcmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGRiID0gZXZlbnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdDcmVhdGluZyBvYmplY3Qgc3RvcmUuLi4nKTtcbiAgICAgICAgICAgIGRiLmNyZWF0ZU9iamVjdFN0b3JlKHN0b3JlTmFtZSwgeyBrZXlQYXRoOiAnaWQnLCBhdXRvSW5jcmVtZW50OiBmYWxzZSB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGRiID0gZXZlbnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJbmRleGVkREIgb3BlbmVkIHN1Y2Nlc3NmdWxseS4nKTtcbiAgICAgICAgICAgIHJlc29sdmUoZGIpO1xuICAgICAgICB9O1xuICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIG9wZW5pbmcgZGF0YWJhc2U6JywgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgICAgIHJlamVjdCgnRXJyb3Igb3BlbmluZyBkYXRhYmFzZScpO1xuICAgICAgICB9O1xuICAgIH0pO1xufTtcbmNvbnN0IGFkZEl0ZW0gPSAoaXRlbSkgPT4ge1xuICAgIGNvbnNvbGUudGltZShcIklEQl9BRERcIik7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ0FkZGluZyBpdGVtIHRvIEluZGV4ZWREQjonLCBpdGVtKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbihzdG9yZU5hbWUsICdyZWFkd3JpdGUnKTtcbiAgICAgICAgY29uc3Qgc3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpO1xuICAgICAgICAvLyBVc2UgYSBjb21wb3NpdGUga2V5IG9mIGNsaWVudElkIGFuZCB1cGRhdGVkQXQgZm9yIHRoZSBpZFxuICAgICAgICBjb25zdCBpZCA9IGAke2l0ZW0uY2xpZW50SWR9LSR7aXRlbS51cGRhdGVkQXR9YDtcbiAgICAgICAgY29uc3QgaXRlbVRvQWRkID0gT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBpdGVtKSwgeyBpZCB9KTtcbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IHN0b3JlLnB1dChpdGVtVG9BZGQpOyAvLyBVc2UgcHV0IGluc3RlYWQgb2YgYWRkIHRvIHVwZGF0ZSBpZiBleGlzdHNcbiAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnSXRlbSBhZGRlZC91cGRhdGVkIHN1Y2Nlc3NmdWxseS4gVmVjdG9yIGNsb2NrOicsIGl0ZW0udmVjdG9yQ2xvY2spO1xuICAgICAgICAgICAgY29uc29sZS50aW1lRW5kKFwiSURCX0FERFwiKTtcbiAgICAgICAgICAgIHJlc29sdmUoJ0l0ZW0gYWRkZWQvdXBkYXRlZCBzdWNjZXNzZnVsbHknKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBhZGRpbmcvdXBkYXRpbmcgaXRlbTonLCBldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgICAgICAgcmVqZWN0KCdFcnJvciBhZGRpbmcvdXBkYXRpbmcgaXRlbScpO1xuICAgICAgICB9O1xuICAgIH0pO1xufTtcbi8vIGNvbnN0IGFkZEl0ZW0gPSAoaXRlbTogYW55KTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbi8vICAgICBjb25zb2xlLnRpbWUoXCJJREJfQUREXCIpO1xuLy8gICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4vLyAgICAgICAgIGNvbnNvbGUubG9nKCdBZGRpbmcgaXRlbSB0byBJbmRleGVkREI6JywgaXRlbSk7XG4vLyAgICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oc3RvcmVOYW1lLCAncmVhZHdyaXRlJyk7XG4vLyAgICAgICAgIGNvbnN0IHN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc3RvcmVOYW1lKTtcbi8vICAgICAgICAgY29uc3QgcmVxdWVzdCA9IHN0b3JlLmFkZChpdGVtKTtcbi8vICAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiB7XG4vLyAgICAgICAgICAgICBjb25zb2xlLmxvZygnSXRlbSBhZGRlZCBzdWNjZXNzZnVsbHkuJyk7XG4vLyAgICAgICAgICAgICBjb25zb2xlLnRpbWVFbmQoXCJJREJfQUREXCIpO1xuLy8gICAgICAgICAgICAgY29uc29sZS50aW1lRW5kKFwiQVBJIENBTExcIik7XG4vLyAgICAgICAgICAgICByZXNvbHZlKCdJdGVtIGFkZGVkIHN1Y2Nlc3NmdWxseScpO1xuLy8gICAgICAgICB9O1xuLy8gICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoZXZlbnQ6IEV2ZW50KSA9PiB7XG4vLyAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBhZGRpbmcgaXRlbTonLCAoZXZlbnQudGFyZ2V0IGFzIElEQlJlcXVlc3QpLmVycm9yKTtcbi8vICAgICAgICAgICAgIHJlamVjdCgnRXJyb3IgYWRkaW5nIGl0ZW0nKTtcbi8vICAgICAgICAgfTtcbi8vICAgICB9KTtcbi8vIH07XG5jb25zdCBmZXRjaERhdGEgPSAoKSA9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ0ZldGNoaW5nIGFsbCBkYXRhIGZyb20gSW5kZXhlZERCLi4uJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oc3RvcmVOYW1lLCAncmVhZG9ubHknKTtcbiAgICAgICAgY29uc3Qgc3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpO1xuICAgICAgICBjb25zdCByZXF1ZXN0ID0gc3RvcmUuZ2V0QWxsKCk7XG4gICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnRGF0YSBmZXRjaGVkIHN1Y2Nlc3NmdWxseS4nKTtcbiAgICAgICAgICAgIHJlc29sdmUoZXZlbnQudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgICAgIHJlcXVlc3Qub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgZGF0YTonLCBldmVudC50YXJnZXQuZXJyb3IpO1xuICAgICAgICAgICAgcmVqZWN0KCdFcnJvciBmZXRjaGluZyBkYXRhJyk7XG4gICAgICAgIH07XG4gICAgfSk7XG59O1xuY29uc3QgZ2V0SXRlbXNCeUNsaWVudElkID0gKGNsaWVudElkKSA9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coYEZldGNoaW5nIGl0ZW1zIGZvciBjbGllbnQgSUQ6ICR7Y2xpZW50SWR9YCk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oc3RvcmVOYW1lLCAncmVhZG9ubHknKTtcbiAgICAgICAgY29uc3Qgc3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpO1xuICAgICAgICBjb25zdCByZXF1ZXN0ID0gc3RvcmUub3BlbkN1cnNvcigpO1xuICAgICAgICBjb25zdCByZXN1bHRzID0gW107XG4gICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjdXJzb3IgPSBldmVudC50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICAgICAgICAgIGlmIChjdXJzb3IudmFsdWUuY2xpZW50SWQgPT09IGNsaWVudElkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChjdXJzb3IudmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJdGVtcyBmZXRjaGVkIHN1Y2Nlc3NmdWxseTonLCByZXN1bHRzKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGdldHRpbmcgaXRlbXM6JywgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgICAgIHJlamVjdCgnRXJyb3IgZ2V0dGluZyBpdGVtcycpO1xuICAgICAgICB9O1xuICAgIH0pO1xufTtcbmNvbnN0IHZpZXdEb2MgPSAoKSA9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ0ZldGNoaW5nIHRoZSBjdXJyZW50IGRvY3VtZW50IGZyb20gSW5kZXhlZERCLi4uJyk7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oc3RvcmVOYW1lLCAncmVhZG9ubHknKTtcbiAgICAgICAgY29uc3Qgc3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpO1xuICAgICAgICBjb25zdCByZXF1ZXN0ID0gc3RvcmUuZ2V0QWxsKCk7XG4gICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjaGFuZ2VzID0gZXZlbnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgIC8vIFNvcnQgY2hhbmdlcyBiYXNlZCBvbiB2ZWN0b3IgY2xvY2tzXG4gICAgICAgICAgICBjaGFuZ2VzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhVGltZSA9IG5ldyBEYXRlKGEudXBkYXRlZEF0KS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgYlRpbWUgPSBuZXcgRGF0ZShiLnVwZGF0ZWRBdCkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgIGlmIChhVGltZSAhPT0gYlRpbWUpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhVGltZSAtIGJUaW1lO1xuICAgICAgICAgICAgICAgIHJldHVybiBhLmNsaWVudElkLmxvY2FsZUNvbXBhcmUoYi5jbGllbnRJZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGxldCBkb2N1bWVudCA9ICcnO1xuICAgICAgICAgICAgY2hhbmdlcy5mb3JFYWNoKChjaGFuZ2UpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoY2hhbmdlLnR5cGUgPT09ICdpbnNlcnQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50ID0gZG9jdW1lbnQuc2xpY2UoMCwgY2hhbmdlLnBvc2l0aW9uKSArIGNoYW5nZS50ZXh0ICsgZG9jdW1lbnQuc2xpY2UoY2hhbmdlLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoY2hhbmdlLnR5cGUgPT09ICdkZWxldGUnKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50ID0gZG9jdW1lbnQuc2xpY2UoMCwgY2hhbmdlLnBvc2l0aW9uKSArIGRvY3VtZW50LnNsaWNlKGNoYW5nZS5wb3NpdGlvbiArIChjaGFuZ2UubGVuZ3RoIHx8IDApKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdDdXJyZW50IGRvY3VtZW50IGNvbnN0cnVjdGVkOicsIGRvY3VtZW50KTtcbiAgICAgICAgICAgIHJlc29sdmUoZG9jdW1lbnQpO1xuICAgICAgICB9O1xuICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZldGNoaW5nIGRvY3VtZW50OicsIGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgICAgICByZWplY3QoJ0Vycm9yIGZldGNoaW5nIGRvY3VtZW50Jyk7XG4gICAgICAgIH07XG4gICAgfSk7XG59O1xuc2VsZi5vbm1lc3NhZ2UgPSAoZXZlbnQpID0+IHtcbiAgICBjb25zdCB7IGFjdGlvbiwgZGF0YSwgY2xpZW50SWQgfSA9IGV2ZW50LmRhdGE7XG4gICAgY29uc29sZS5sb2coYFJlY2VpdmVkIGFjdGlvbjogJHthY3Rpb259YCwgZXZlbnQuZGF0YSk7XG4gICAgc3dpdGNoIChhY3Rpb24pIHtcbiAgICAgICAgY2FzZSAnYWRkSXRlbSc6XG4gICAgICAgICAgICBvcGVuREIoKVxuICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IGFkZEl0ZW0oZGF0YSkpXG4gICAgICAgICAgICAgICAgLnRoZW4oKG1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHsgYWN0aW9uOiAnbWVzc2FnZScsIGRhdGE6IG1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHsgYWN0aW9uOiAnZXJyb3InLCBkYXRhOiBlcnJvciB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2ZldGNoRGF0YSc6XG4gICAgICAgICAgICBvcGVuREIoKVxuICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IGZldGNoRGF0YSgpKVxuICAgICAgICAgICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IGFjdGlvbjogJ2Rpc3BsYXlEYXRhJywgZGF0YSB9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHNlbGYucG9zdE1lc3NhZ2UoeyBhY3Rpb246ICdlcnJvcicsIGRhdGE6IGVycm9yIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnZ2V0SXRlbUJ5Q2xpZW50SWQnOlxuICAgICAgICAgICAgb3BlbkRCKClcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiBnZXRJdGVtc0J5Q2xpZW50SWQoY2xpZW50SWQpKVxuICAgICAgICAgICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IGFjdGlvbjogJ2Rpc3BsYXlJdGVtJywgZGF0YSB9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHNlbGYucG9zdE1lc3NhZ2UoeyBhY3Rpb246ICdlcnJvcicsIGRhdGE6IGVycm9yIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAndmlld0RvYyc6XG4gICAgICAgICAgICBvcGVuREIoKVxuICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHZpZXdEb2MoKSlcbiAgICAgICAgICAgICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgIHNlbGYucG9zdE1lc3NhZ2UoeyBhY3Rpb246ICdkaXNwbGF5RG9jJywgZGF0YSB9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHNlbGYucG9zdE1lc3NhZ2UoeyBhY3Rpb246ICdlcnJvcicsIGRhdGE6IGVycm9yIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignVW5rbm93biBhY3Rpb246JywgYWN0aW9uKTtcbiAgICAgICAgICAgIHNlbGYucG9zdE1lc3NhZ2UoeyBhY3Rpb246ICdlcnJvcicsIGRhdGE6ICdVbmtub3duIGFjdGlvbicgfSk7XG4gICAgfVxufTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==