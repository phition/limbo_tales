/**
 * 📦 Limbo IndexedDB Storage Manager
 * 대용량 데이터(게임 커스텀 데이터, 백과사전 원문, 턴 세션 스냅샷 등)를
 * localStorage(5MB 한도) 대신 브라우저 대용량 스토리지인 IndexedDB에 안전하게 비동기 저장합니다.
 */

const DB_NAME = 'limbo_engine_idb';
const DB_VERSION = 1;

export const IDB_STORES = {
  GAME_DATA: 'game_data',
  ENCYCLOPEDIA: 'encyclopedia',
  SESSIONS: 'sessions',
} as const;

export type IdbStoreName = typeof IDB_STORES[keyof typeof IDB_STORES];

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB is not supported in this environment'));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        Object.values(IDB_STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
        });
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
    });
  }
  return dbPromise;
}

export async function getIdbItem<T>(storeName: IdbStoreName, key: string): Promise<T | null> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IDB] Read failed for ${storeName}/${key}:`, err);
    return null;
  }
}

export async function setIdbItem<T>(storeName: IdbStoreName, key: string, value: T): Promise<boolean> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IDB] Write failed for ${storeName}/${key}:`, err);
    return false;
  }
}

export async function removeIdbItem(storeName: IdbStoreName, key: string): Promise<boolean> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IDB] Delete failed for ${storeName}/${key}:`, err);
    return false;
  }
}
