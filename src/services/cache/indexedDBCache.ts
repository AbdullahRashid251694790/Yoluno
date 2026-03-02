/**
 * IndexedDB Cache
 *
 * Generic IndexedDB cache class for offline data persistence.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  dbName: string;
  storeName: string;
  ttlMs: number;
}

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DB_VERSION = 2; // Bump when adding new stores
const ALL_STORE_NAMES = ['avatars', 'stories'];

export class IndexedDBCache<T> {
  private dbName: string;
  private storeName: string;
  private ttlMs: number;
  private db: IDBDatabase | null = null;

  constructor(options: Partial<CacheOptions> & { storeName: string }) {
    this.dbName = options.dbName ?? 'yoluno-cache';
    this.storeName = options.storeName;
    this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // Create all known stores on upgrade so they're all available
        for (const name of ALL_STORE_NAMES) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath: 'key' });
          }
        }
      };
    });
  }

  async get(key: string): Promise<T | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
          const result = request.result as { key: string; value: CacheEntry<T> } | undefined;
          if (!result) {
            resolve(null);
            return;
          }

          const entry = result.value;
          if (Date.now() > entry.expiresAt) {
            this.delete(key);
            resolve(null);
            return;
          }

          resolve(entry.data);
        };
      });
    } catch {
      return null;
    }
  }

  async set(key: string, data: T): Promise<void> {
    try {
      const db = await this.getDB();
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.ttlMs,
      };

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put({ key, value: entry });

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch {
      // Silently fail cache writes
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch {
      // Silently fail cache deletes
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch {
      // Silently fail cache clears
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAllKeys();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result as string[]);
      });
    } catch {
      return [];
    }
  }
}

export const avatarCache = new IndexedDBCache<string>({
  storeName: 'avatars',
  ttlMs: 7 * 24 * 60 * 60 * 1000, // 7 days
});

export const storyCache = new IndexedDBCache<string>({
  storeName: 'stories',
  ttlMs: 24 * 60 * 60 * 1000, // 24 hours
});
