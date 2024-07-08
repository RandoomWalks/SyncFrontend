const dbName = 'DemoDB';
const storeName = 'Items';
let db;

// Open the database
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

// Add an item to the database
const addItem = (item) => {
    console.time("IDB_ADD")

    return new Promise((resolve, reject) => {
        console.log('Adding item to IndexedDB:', item);
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(item);
        
        request.onsuccess = () => {
            console.log('Item added successfully.');
            console.timeEnd("IDB_ADD")

            console.timeEnd("API CALL")

            resolve('Item added successfully');
        };

        request.onerror = (event) => {
            console.error('Error adding item:', event.target.error);
            reject('Error adding item');
        };
    }); 
};

// Fetch all data from the database
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

// Get items by client ID from the database
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
            } else {
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

// View current document by aggregating all changes
const viewDoc = () => {
    return new Promise((resolve, reject) => {
        console.log('Fetching the current document from IndexedDB...');
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = (event) => {
            const changes = event.target.result;

            // Sort changes by updatedAt
            changes.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));

            let document = '';
            changes.forEach(change => {
                if (change.type === 'insert') {
                    document = document.slice(0, change.position) + change.text + document.slice(change.position);
                } else if (change.type === 'delete') {
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

// Handle messages from the main script
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
