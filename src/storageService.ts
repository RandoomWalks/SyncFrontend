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

      request.onsuccess = (event: Event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log(`Database "${DB_NAME}" opened successfully.`);
        resolve(db);
      };
      
      request.onerror = (event: Event) => {
        console.error(`Failed to open database "${DB_NAME}":`, (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  async getVectorClock(): Promise<{ [clientId: string]: number }> {
    console.log('Fetching vector clock...');
    if (this.clockCache) {
      console.log('Using cached vector clock:', this.clockCache);
      return this.clockCache;
    }

    await this.init();
    try {
      const result = await this.get(CLIENT_STORE, CLIENT_VC_KEY);
      if (result) {
        this.clockCache = result.value as { [clientId: string]: number };
        console.log('Retrieved vector clock from IndexedDB:', this.clockCache);

        if (!await this.validateVectorClock(this.clockCache)){

          throw new Error('getVectorClock: Invalid or empty vector clock');

        }
        if (!this.clockCache || this.clockCache.length < 1) {
            this.clockCache = {};
            if (this.clientIdCache!==null){
              this.clockCache[this.clientIdCache]=0;
            }
            await this.setVectorClock(this.clockCache);
            console.log('Vector clock found in IndexedDB but is undefined. Initialized with empty clock:', this.clockCache);   
        }
      } else {
        this.clockCache = {};
        await this.setVectorClock(this.clockCache);
        console.log('Vector clock not found in IndexedDB. Initialized with empty clock:', this.clockCache);
      }
      return this.clockCache;
    } catch (error) {
      console.error('Error getting vector clock:', error);
      return this.fallbackGetClockCache();
    }
  }

  async updateVectorClock(clientId: string): Promise<void> {
    console.log(`Updating vector clock for clientId "${clientId}"...`);
    let vectorClock = await this.getVectorClock();
    vectorClock[clientId] = (vectorClock[clientId] || 0) + 1;
    
    // Validate vector clock before saving
    if (await this.validateVectorClock(vectorClock)) {
        // Save the updated vector clock to IndexedDB
        await this.setVectorClock(vectorClock);
        console.log('Vector clock updated successfully:', vectorClock);
    } else {
        console.error('Vector clock validation failed:', vectorClock);
    }
  }

  async validateVectorClock(vectorClock: { [clientId: string]: number }): Promise<boolean> {

    if (Object.values(vectorClock).length< 1) {
      
      vectorClock[this.clientIdCache as string]=0;
      console.log('Vector clock is undefined. Initialized with empty clock:', vectorClock);   

      await this.setVectorClock(vectorClock);

    }
      // Add validation logic here (e.g., ensure all values are non-negative integers)
      return ( Object.values(vectorClock).length>0 && Object.values(vectorClock).every(value => Number.isInteger(value) && value >= 0) ) ;
  }

  async setVectorClock(clock: { [clientId: string]: number }): Promise<void> {
    console.log('Setting vector clock in IndexedDB:', clock);

    // Validate vector clock before saving
    if (await this.validateVectorClock(clock)) {
        await this.init();
        try {
            await this.put(CLIENT_STORE, { key: CLIENT_VC_KEY, value: clock });
            this.clockCache = clock;
            console.log('Vector clock set successfully in IndexedDB.');
        } catch (error) {
            console.error('Error setting vector clock:', error);
            this.fallbackSetClockCache(clock);
        }
    } else {
        console.error('Vector clock validation failed:', clock);
    }
  }

  private async fallbackGetClockCache(): Promise<{ [clientId: string]: number } >{
    console.log('Fallback: Getting vector clock from localStorage.');
    let clock = localStorage.getItem(CLIENT_VC_KEY);
    if (!clock) {
        clock = JSON.stringify({});
        localStorage.setItem(CLIENT_VC_KEY, clock);
        console.log('Initialized empty vector clock in localStorage:', JSON.parse(clock));
    } else {
        console.log('Retrieved vector clock from localStorage:', JSON.parse(clock));
    }
    const parsedClock = JSON.parse(clock);
    // Validate the parsed vector clock
    if (await this.validateVectorClock(parsedClock)) {
        return parsedClock;
    } else {
        console.error('Vector clock validation failed in fallback.');
        return {};
    }
  }

  private fallbackSetClockCache(clock: { [clientId: string]: number }): void {
    console.log('Fallback: Setting vector clock in localStorage:', clock);
    localStorage.setItem(CLIENT_VC_KEY, JSON.stringify(clock));
  }

  async getClientId(): Promise<string> {
    console.log('Fetching clientId...');
    if (this.clientIdCache) {
      console.log('Using cached clientId:', this.clientIdCache);
      return this.clientIdCache;
    }

    await this.init();
    try {
      const result = await this.get(CLIENT_STORE, CLIENT_ID_KEY);
      if (result) {
        this.clientIdCache = result.value as string;
        console.log('Retrieved clientId from IndexedDB:', this.clientIdCache);
      } else {
        this.clientIdCache = crypto.randomUUID();
        await this.setClientId(this.clientIdCache);
        console.log('clientId not found in IndexedDB. Generated new clientId:', this.clientIdCache);
      }
      return this.clientIdCache;
    } catch (error) {
      console.error('Error getting clientId:', error);
      return this.fallbackGetClientId();
    }
  }

  async setClientId(clientId: string): Promise<void> {
    console.log('Setting clientId in IndexedDB:', clientId);
    await this.init();
    try {
      await this.put(CLIENT_STORE, { key: CLIENT_ID_KEY, value: clientId });
      this.clientIdCache = clientId;
      console.log('clientId set successfully in IndexedDB.');
    } catch (error) {
      console.error('Error setting clientId:', error);
      this.fallbackSetClientId(clientId);
    }
  }

  private fallbackGetClientId(): string {
    console.log('Fallback: Getting clientId from localStorage.');
    let clientId = localStorage.getItem(CLIENT_ID_KEY);
    if (!clientId) {
      clientId = crypto.randomUUID();
      localStorage.setItem(CLIENT_ID_KEY, clientId);
      console.log('Initialized new clientId in localStorage:', clientId);
    } else {
      console.log('Retrieved clientId from localStorage:', clientId);
    }
    return clientId;
  }

  private fallbackSetClientId(clientId: string): void {
    console.log('Fallback: Setting clientId in localStorage:', clientId);
    localStorage.setItem(CLIENT_ID_KEY, clientId);
  }

  private get(storeName: string, key: string): Promise<StoreItem | undefined> {
    console.log(`Fetching item from store "${storeName}" with key "${key}"...`);
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = (event: Event) => {
        const result = (event.target as IDBRequest).result;
        console.log(`Retrieved item from store "${storeName}" with key "${key}":`, result);
        resolve(result);
      };

      request.onerror = (event: Event) => {
        console.error(`Error fetching item from store "${storeName}" with key "${key}":`, (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }

  private put(storeName: string, value: StoreItem): Promise<void> {
    console.log(`Storing item in store "${storeName}" with key "${value.key}"...`);
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      request.onsuccess = () => {
        console.log(`Item stored successfully in store "${storeName}" with key "${value.key}".`);
        resolve();
      };

      request.onerror = (event: Event) => {
        console.error(`Error storing item in store "${storeName}" with key "${value.key}":`, (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }
}

const storageService = new StorageService();
export default storageService;
