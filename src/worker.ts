import { Change } from './types';

const dbName = 'DemoDB';
const storeName = 'Items';
let db: IDBDatabase;

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        console.log('Opening IndexedDB...');
        const request = indexedDB.open(dbName, 1);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            db = (event.target as IDBOpenDBRequest).result;
            console.log('Creating object store...');
            db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: false });
        };

        request.onsuccess = (event: Event) => {
            db = (event.target as IDBOpenDBRequest).result;
            console.log('IndexedDB opened successfully.');
            resolve(db);
        };

        request.onerror = (event: Event) => {
            console.error('Error opening database:', (event.target as IDBOpenDBRequest).error);
            reject('Error opening database');
        };
    });
};

const addItem = (item: Change): Promise<string> => {
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

        request.onerror = (event: Event) => {
            console.error('Error adding item:', (event.target as IDBRequest).error);
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

const fetchData = (): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        console.log('Fetching all data from IndexedDB...');
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = (event: Event) => {
            console.log('Data fetched successfully.');
            resolve((event.target as IDBRequest).result);
        };

        request.onerror = (event: Event) => {
            console.error('Error fetching data:', (event.target as IDBRequest).error);
            reject('Error fetching data');
        };
    });
};

const getItemsByClientId = (clientId: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        console.log(`Fetching items for client ID: ${clientId}`);
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.openCursor();

        const results: any[] = [];

        request.onsuccess = (event: Event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
                if (cursor.value.clientId === clientId) {
                    results.push(cursor.value);
                }
                cursor.continue();
            } else {
                console.log('Items fetched successfully:', results);
                resolve(results);
            }
        };

        request.onerror = (event: Event) => {
            console.error('Error getting items:', (event.target as IDBRequest).error);
            reject('Error getting items');
        };
    });
};

const viewDoc = (): Promise<string> => {
    return new Promise((resolve, reject) => {
        console.log('Fetching the current document from IndexedDB...');
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = (event: Event) => {
            const changes = (event.target as IDBRequest).result;

            changes.sort((a: any, b: any) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

            let document = '';
            changes.forEach((change: any) => {
                if (change.type === 'insert') {
                    document = document.slice(0, change.position) + change.text + document.slice(change.position);
                } else if (change.type === 'delete') {
                    document = document.slice(0, change.position) + document.slice(change.position + change.length);
                }
            });
            console.log('Current document constructed:', document);
            resolve(document);
        };

        request.onerror = (event: Event) => {
            console.error('Error fetching document:', (event.target as IDBRequest).error);
            reject('Error fetching document');
        };
    });
};

self.onmessage = (event: MessageEvent) => {
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
