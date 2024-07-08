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
    // Ensure item has an 'id' property
    if (!item.id) {
        item.id = new Date().getTime(); // Or use any other method to generate a unique id
    }
    return new Promise((resolve, reject) => {
        console.log('Adding item to IndexedDB:', item);
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(item);
        request.onsuccess = () => {
            console.log('Item added successfully.');
            console.timeEnd("IDB_ADD");
            console.timeEnd("API CALL");
            resolve('Item added successfully');
        };
        request.onerror = (event) => {
            console.error('Error adding item:', event.target.error);
            reject('Error adding item');
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
            changes.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
            let document = '';
            changes.forEach((change) => {
                if (change.type === 'insert') {
                    document = document.slice(0, change.position) + change.text + document.slice(change.position);
                }
                else if (change.type === 'delete') {
                    document = document.slice(0, change.position) + document.slice(change.position + change.length);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQThDLHFDQUFxQztBQUNuRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0NBQXdDO0FBQ3hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0EscURBQXFELFNBQVM7QUFDOUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWSx5QkFBeUI7QUFDckMsb0NBQW9DLE9BQU87QUFDM0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1DQUFtQyxrQ0FBa0M7QUFDckUsYUFBYTtBQUNiO0FBQ0EsbUNBQW1DLDhCQUE4QjtBQUNqRSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1DQUFtQyw2QkFBNkI7QUFDaEUsYUFBYTtBQUNiO0FBQ0EsbUNBQW1DLDhCQUE4QjtBQUNqRSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1DQUFtQyw2QkFBNkI7QUFDaEUsYUFBYTtBQUNiO0FBQ0EsbUNBQW1DLDhCQUE4QjtBQUNqRSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1DQUFtQyw0QkFBNEI7QUFDL0QsYUFBYTtBQUNiO0FBQ0EsbUNBQW1DLDhCQUE4QjtBQUNqRSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsK0JBQStCLHlDQUF5QztBQUN4RTtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZnJvbnRlbmRfbWluaW1hbF9mb3Jfb3RfY2hhbmdlLy4vc3JjL3dvcmtlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IGRiTmFtZSA9ICdEZW1vREInO1xuY29uc3Qgc3RvcmVOYW1lID0gJ0l0ZW1zJztcbmxldCBkYjtcbmNvbnN0IG9wZW5EQiA9ICgpID0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZygnT3BlbmluZyBJbmRleGVkREIuLi4nKTtcbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IGluZGV4ZWREQi5vcGVuKGRiTmFtZSwgMSk7XG4gICAgICAgIHJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBkYiA9IGV2ZW50LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnQ3JlYXRpbmcgb2JqZWN0IHN0b3JlLi4uJyk7XG4gICAgICAgICAgICBkYi5jcmVhdGVPYmplY3RTdG9yZShzdG9yZU5hbWUsIHsga2V5UGF0aDogJ2lkJywgYXV0b0luY3JlbWVudDogZmFsc2UgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBkYiA9IGV2ZW50LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnSW5kZXhlZERCIG9wZW5lZCBzdWNjZXNzZnVsbHkuJyk7XG4gICAgICAgICAgICByZXNvbHZlKGRiKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBvcGVuaW5nIGRhdGFiYXNlOicsIGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgICAgICByZWplY3QoJ0Vycm9yIG9wZW5pbmcgZGF0YWJhc2UnKTtcbiAgICAgICAgfTtcbiAgICB9KTtcbn07XG5jb25zdCBhZGRJdGVtID0gKGl0ZW0pID0+IHtcbiAgICBjb25zb2xlLnRpbWUoXCJJREJfQUREXCIpO1xuICAgIC8vIEVuc3VyZSBpdGVtIGhhcyBhbiAnaWQnIHByb3BlcnR5XG4gICAgaWYgKCFpdGVtLmlkKSB7XG4gICAgICAgIGl0ZW0uaWQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTsgLy8gT3IgdXNlIGFueSBvdGhlciBtZXRob2QgdG8gZ2VuZXJhdGUgYSB1bmlxdWUgaWRcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ0FkZGluZyBpdGVtIHRvIEluZGV4ZWREQjonLCBpdGVtKTtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbihzdG9yZU5hbWUsICdyZWFkd3JpdGUnKTtcbiAgICAgICAgY29uc3Qgc3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpO1xuICAgICAgICBjb25zdCByZXF1ZXN0ID0gc3RvcmUuYWRkKGl0ZW0pO1xuICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJdGVtIGFkZGVkIHN1Y2Nlc3NmdWxseS4nKTtcbiAgICAgICAgICAgIGNvbnNvbGUudGltZUVuZChcIklEQl9BRERcIik7XG4gICAgICAgICAgICBjb25zb2xlLnRpbWVFbmQoXCJBUEkgQ0FMTFwiKTtcbiAgICAgICAgICAgIHJlc29sdmUoJ0l0ZW0gYWRkZWQgc3VjY2Vzc2Z1bGx5Jyk7XG4gICAgICAgIH07XG4gICAgICAgIHJlcXVlc3Qub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgYWRkaW5nIGl0ZW06JywgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgICAgIHJlamVjdCgnRXJyb3IgYWRkaW5nIGl0ZW0nKTtcbiAgICAgICAgfTtcbiAgICB9KTtcbn07XG4vLyBjb25zdCBhZGRJdGVtID0gKGl0ZW06IGFueSk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4vLyAgICAgY29uc29sZS50aW1lKFwiSURCX0FERFwiKTtcbi8vICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuLy8gICAgICAgICBjb25zb2xlLmxvZygnQWRkaW5nIGl0ZW0gdG8gSW5kZXhlZERCOicsIGl0ZW0pO1xuLy8gICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKHN0b3JlTmFtZSwgJ3JlYWR3cml0ZScpO1xuLy8gICAgICAgICBjb25zdCBzdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHN0b3JlTmFtZSk7XG4vLyAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBzdG9yZS5hZGQoaXRlbSk7XG4vLyAgICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4ge1xuLy8gICAgICAgICAgICAgY29uc29sZS5sb2coJ0l0ZW0gYWRkZWQgc3VjY2Vzc2Z1bGx5LicpO1xuLy8gICAgICAgICAgICAgY29uc29sZS50aW1lRW5kKFwiSURCX0FERFwiKTtcbi8vICAgICAgICAgICAgIGNvbnNvbGUudGltZUVuZChcIkFQSSBDQUxMXCIpO1xuLy8gICAgICAgICAgICAgcmVzb2x2ZSgnSXRlbSBhZGRlZCBzdWNjZXNzZnVsbHknKTtcbi8vICAgICAgICAgfTtcbi8vICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKGV2ZW50OiBFdmVudCkgPT4ge1xuLy8gICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgYWRkaW5nIGl0ZW06JywgKGV2ZW50LnRhcmdldCBhcyBJREJSZXF1ZXN0KS5lcnJvcik7XG4vLyAgICAgICAgICAgICByZWplY3QoJ0Vycm9yIGFkZGluZyBpdGVtJyk7XG4vLyAgICAgICAgIH07XG4vLyAgICAgfSk7XG4vLyB9O1xuY29uc3QgZmV0Y2hEYXRhID0gKCkgPT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdGZXRjaGluZyBhbGwgZGF0YSBmcm9tIEluZGV4ZWREQi4uLicpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKHN0b3JlTmFtZSwgJ3JlYWRvbmx5Jyk7XG4gICAgICAgIGNvbnN0IHN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc3RvcmVOYW1lKTtcbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IHN0b3JlLmdldEFsbCgpO1xuICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0RhdGEgZmV0Y2hlZCBzdWNjZXNzZnVsbHkuJyk7XG4gICAgICAgICAgICByZXNvbHZlKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICB9O1xuICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZldGNoaW5nIGRhdGE6JywgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgICAgIHJlamVjdCgnRXJyb3IgZmV0Y2hpbmcgZGF0YScpO1xuICAgICAgICB9O1xuICAgIH0pO1xufTtcbmNvbnN0IGdldEl0ZW1zQnlDbGllbnRJZCA9IChjbGllbnRJZCkgPT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBGZXRjaGluZyBpdGVtcyBmb3IgY2xpZW50IElEOiAke2NsaWVudElkfWApO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKHN0b3JlTmFtZSwgJ3JlYWRvbmx5Jyk7XG4gICAgICAgIGNvbnN0IHN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc3RvcmVOYW1lKTtcbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IHN0b3JlLm9wZW5DdXJzb3IoKTtcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IFtdO1xuICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3Vyc29yID0gZXZlbnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgICAgICAgICBpZiAoY3Vyc29yLnZhbHVlLmNsaWVudElkID09PSBjbGllbnRJZCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goY3Vyc29yLnZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnSXRlbXMgZmV0Y2hlZCBzdWNjZXNzZnVsbHk6JywgcmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBnZXR0aW5nIGl0ZW1zOicsIGV2ZW50LnRhcmdldC5lcnJvcik7XG4gICAgICAgICAgICByZWplY3QoJ0Vycm9yIGdldHRpbmcgaXRlbXMnKTtcbiAgICAgICAgfTtcbiAgICB9KTtcbn07XG5jb25zdCB2aWV3RG9jID0gKCkgPT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdGZXRjaGluZyB0aGUgY3VycmVudCBkb2N1bWVudCBmcm9tIEluZGV4ZWREQi4uLicpO1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKHN0b3JlTmFtZSwgJ3JlYWRvbmx5Jyk7XG4gICAgICAgIGNvbnN0IHN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoc3RvcmVOYW1lKTtcbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IHN0b3JlLmdldEFsbCgpO1xuICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2hhbmdlcyA9IGV2ZW50LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgICBjaGFuZ2VzLnNvcnQoKGEsIGIpID0+IG5ldyBEYXRlKGEudXBkYXRlZEF0KS5nZXRUaW1lKCkgLSBuZXcgRGF0ZShiLnVwZGF0ZWRBdCkuZ2V0VGltZSgpKTtcbiAgICAgICAgICAgIGxldCBkb2N1bWVudCA9ICcnO1xuICAgICAgICAgICAgY2hhbmdlcy5mb3JFYWNoKChjaGFuZ2UpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoY2hhbmdlLnR5cGUgPT09ICdpbnNlcnQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50ID0gZG9jdW1lbnQuc2xpY2UoMCwgY2hhbmdlLnBvc2l0aW9uKSArIGNoYW5nZS50ZXh0ICsgZG9jdW1lbnQuc2xpY2UoY2hhbmdlLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoY2hhbmdlLnR5cGUgPT09ICdkZWxldGUnKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50ID0gZG9jdW1lbnQuc2xpY2UoMCwgY2hhbmdlLnBvc2l0aW9uKSArIGRvY3VtZW50LnNsaWNlKGNoYW5nZS5wb3NpdGlvbiArIGNoYW5nZS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0N1cnJlbnQgZG9jdW1lbnQgY29uc3RydWN0ZWQ6JywgZG9jdW1lbnQpO1xuICAgICAgICAgICAgcmVzb2x2ZShkb2N1bWVudCk7XG4gICAgICAgIH07XG4gICAgICAgIHJlcXVlc3Qub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgZG9jdW1lbnQ6JywgZXZlbnQudGFyZ2V0LmVycm9yKTtcbiAgICAgICAgICAgIHJlamVjdCgnRXJyb3IgZmV0Y2hpbmcgZG9jdW1lbnQnKTtcbiAgICAgICAgfTtcbiAgICB9KTtcbn07XG5zZWxmLm9ubWVzc2FnZSA9IChldmVudCkgPT4ge1xuICAgIGNvbnN0IHsgYWN0aW9uLCBkYXRhLCBjbGllbnRJZCB9ID0gZXZlbnQuZGF0YTtcbiAgICBjb25zb2xlLmxvZyhgUmVjZWl2ZWQgYWN0aW9uOiAke2FjdGlvbn1gLCBldmVudC5kYXRhKTtcbiAgICBzd2l0Y2ggKGFjdGlvbikge1xuICAgICAgICBjYXNlICdhZGRJdGVtJzpcbiAgICAgICAgICAgIG9wZW5EQigpXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gYWRkSXRlbShkYXRhKSlcbiAgICAgICAgICAgICAgICAudGhlbigobWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgICAgIHNlbGYucG9zdE1lc3NhZ2UoeyBhY3Rpb246ICdtZXNzYWdlJywgZGF0YTogbWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHNlbGYucG9zdE1lc3NhZ2UoeyBhY3Rpb246ICdlcnJvcicsIGRhdGE6IGVycm9yIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnZmV0Y2hEYXRhJzpcbiAgICAgICAgICAgIG9wZW5EQigpXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gZmV0Y2hEYXRhKCkpXG4gICAgICAgICAgICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHsgYWN0aW9uOiAnZGlzcGxheURhdGEnLCBkYXRhIH0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IGFjdGlvbjogJ2Vycm9yJywgZGF0YTogZXJyb3IgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdnZXRJdGVtQnlDbGllbnRJZCc6XG4gICAgICAgICAgICBvcGVuREIoKVxuICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IGdldEl0ZW1zQnlDbGllbnRJZChjbGllbnRJZCkpXG4gICAgICAgICAgICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHsgYWN0aW9uOiAnZGlzcGxheUl0ZW0nLCBkYXRhIH0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IGFjdGlvbjogJ2Vycm9yJywgZGF0YTogZXJyb3IgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICd2aWV3RG9jJzpcbiAgICAgICAgICAgIG9wZW5EQigpXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gdmlld0RvYygpKVxuICAgICAgICAgICAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IGFjdGlvbjogJ2Rpc3BsYXlEb2MnLCBkYXRhIH0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IGFjdGlvbjogJ2Vycm9yJywgZGF0YTogZXJyb3IgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdVbmtub3duIGFjdGlvbjonLCBhY3Rpb24pO1xuICAgICAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IGFjdGlvbjogJ2Vycm9yJywgZGF0YTogJ1Vua25vd24gYWN0aW9uJyB9KTtcbiAgICB9XG59O1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9