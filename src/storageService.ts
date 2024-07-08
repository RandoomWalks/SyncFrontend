const DB_NAME = 'myAppDB';
const DB_VERSION = 1;
const CLIENT_STORE = 'clientStore';
const CLIENT_ID_KEY = 'clientId';

interface StoreItem {
  key: string;
  value: string;
}

class StorageService {
  private db: IDBDatabase | null = null;
  private clientIdCache: string | null = null;

  async init(): Promise<void> {
    if (!this.db) {
      this.db = await this.openDB();
    }
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(CLIENT_STORE)) {
          db.createObjectStore(CLIENT_STORE, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event: Event) => resolve((event.target as IDBOpenDBRequest).result);
      request.onerror = (event: Event) => reject((event.target as IDBOpenDBRequest).error);
    });
  }

  async getClientId(): Promise<string> {
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

  async setClientId(clientId: string): Promise<void> {
    await this.init();
    try {
      await this.put(CLIENT_STORE, { key: CLIENT_ID_KEY, value: clientId });
      this.clientIdCache = clientId;
    } catch (error) {
      console.error('Error setting clientId:', error);
      this.fallbackSetClientId(clientId);
    }
  }

  private fallbackGetClientId(): string {
    let clientId = localStorage.getItem(CLIENT_ID_KEY);
    if (!clientId) {
      clientId = crypto.randomUUID();
      localStorage.setItem(CLIENT_ID_KEY, clientId);
    }
    return clientId;
  }

  private fallbackSetClientId(clientId: string): void {
    localStorage.setItem(CLIENT_ID_KEY, clientId);
  }

  private get(storeName: string, key: string): Promise<StoreItem | undefined> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = (event: Event) => resolve((event.target as IDBRequest).result);
      request.onerror = (event: Event) => reject((event.target as IDBRequest).error);
    });
  }

  private put(storeName: string, value: StoreItem): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      request.onsuccess = () => resolve();
      request.onerror = (event: Event) => reject((event.target as IDBRequest).error);
    });
  }
}

const storageService = new StorageService();
export default storageService;
