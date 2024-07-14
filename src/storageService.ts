const DB_NAME = 'myAppDB';
const DB_VERSION = 1;
const CLIENT_STORE = 'clientStore';
const CLIENT_ID_KEY = 'clientId';
const CLIENT_VC_KEY = 'vectorClock';

interface StoreItem {
  key: string;
  value: string | { [clientId: string]: number };
}

class StorageService {
  private db: IDBDatabase | null = null;
  private clientIdCache: string | null = null;
  private clockCache: { [clientId: string]: number } | null = null;

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

  async getVectorClock(): Promise<{ [clientId: string]: number }> {
    if (this.clockCache) return this.clockCache;

    await this.init();
    try {
      const result = await this.get(CLIENT_STORE, CLIENT_VC_KEY);
      if (result) {
        this.clockCache = result.value as { [clientId: string]: number };
      } else {
        this.clockCache = {};
        await this.setVectorClock(this.clockCache);
      }
      return this.clockCache;
    } catch (error) {
      console.error('Error getting vector clock:', error);
      return this.fallbackGetClockCache();
    }
  }

  async updateVectorClock(clientId: string): Promise<void> {
    let vectorClock = await this.getVectorClock();
    vectorClock[clientId] = (vectorClock[clientId] || 0) + 1;
    // Save the updated vector clock to IndexedDB
    this.setVectorClock(vectorClock);
  }

  async setVectorClock(clock: { [clientId: string]: number }): Promise<void> {
    await this.init();
    try {
      await this.put(CLIENT_STORE, { key: CLIENT_VC_KEY, value: clock });
      this.clockCache = clock;
    } catch (error) {
      console.error('Error setting vector clock:', error);
      this.fallbackSetClockCache(clock);
    }
  }

  private fallbackGetClockCache(): { [clientId: string]: number } {
    let clock = localStorage.getItem(CLIENT_VC_KEY);
    if (!clock) {
      clock = JSON.stringify({});
      localStorage.setItem(CLIENT_VC_KEY, clock);
    }
    return JSON.parse(clock);
  }

  private fallbackSetClockCache(clock: { [clientId: string]: number }): void {
    localStorage.setItem(CLIENT_VC_KEY, JSON.stringify(clock));
  }

  async getClientId(): Promise<string> {
    if (this.clientIdCache) return this.clientIdCache;

    await this.init();
    try {
      const result = await this.get(CLIENT_STORE, CLIENT_ID_KEY);
      if (result) {
        this.clientIdCache = result.value as string;
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
