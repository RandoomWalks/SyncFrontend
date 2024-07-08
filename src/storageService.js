const DB_NAME = 'myAppDB';
const DB_VERSION = 1;
const CLIENT_STORE = 'clientStore';
const CLIENT_ID_KEY = 'clientId';

class StorageService {
  constructor() {
    this.db = null;
    this.clientIdCache = null;
  }

  async init() {
    if (!this.db) {
      this.db = await this.openDB();
    }
  }

  async openDB() {
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

  async getClientId() {
    if (this.clientIdCache) return this.clientIdCache;

    await this.init();
    try {
      const result = await this.get(CLIENT_STORE, CLIENT_ID_KEY);
      if (result) {
        this.clientIdCache = result.value;
      } else {
        this.clientIdCache = crypto.randomUUID();
        await this.setClientId(this.clientIdCache);
      }
      return this.clientIdCache;
    } catch (error) {
      console.error('Error getting clientId:', error);
      return this.fallbackGetClientId();
    }
  }

  async setClientId(clientId) {
    await this.init();
    try {
      await this.put(CLIENT_STORE, { key: CLIENT_ID_KEY, value: clientId });
      this.clientIdCache = clientId;
    } catch (error) {
      console.error('Error setting clientId:', error);
      this.fallbackSetClientId(clientId);
    }
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

  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async put(storeName, value) {
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
export default storageService;
