import type { SavedHighlight } from './types';

const DB_NAME = 'speed-reader-db';
const STORE_NAME = 'highlights';
const LOCAL_STORAGE_KEY = 'speed-reader/highlights';

export async function listHighlights(documentId: string): Promise<SavedHighlight[]> {
  const highlights = await runStoreOperation((database) =>
    withStore(database, 'readonly', (store) => {
      if (store.indexNames.contains('documentId')) {
        return requestToPromise(store.index('documentId').getAll(documentId));
      }

      return requestToPromise(store.getAll());
    })
  );

  return highlights
    .filter((highlight) => highlight.documentId === documentId)
    .sort((left, right) => right.createdAt - left.createdAt);
}

export async function saveHighlight(
  highlight: Omit<SavedHighlight, 'id' | 'createdAt'>
): Promise<SavedHighlight> {
  const existingHighlights = await listHighlights(highlight.documentId);
  const duplicate = existingHighlights.find((entry) => entry.tokenIndex === highlight.tokenIndex);

  if (duplicate) {
    return duplicate;
  }

  const savedHighlight: SavedHighlight = {
    ...highlight,
    id: cryptoSafeId(),
    createdAt: Date.now()
  };

  await runStoreOperation((database) =>
    withStore(database, 'readwrite', (store) => requestToPromise(store.put(savedHighlight)))
  );

  return savedHighlight;
}

export async function deleteHighlight(id: string): Promise<void> {
  await runStoreOperation((database) =>
    withStore(database, 'readwrite', (store) => requestToPromise(store.delete(id)))
  );
}

async function runStoreOperation<T>(operation: (database: IDBDatabase) => Promise<T>): Promise<T> {
  if (typeof indexedDB !== 'undefined') {
    try {
      const database = await openHighlightDatabase();
      return await operation(database);
    } catch {
      return operateOnLocalStorage(operation);
    }
  }

  return operateOnLocalStorage(operation);
}

async function operateOnLocalStorage<T>(operation: (database: IDBDatabase) => Promise<T>): Promise<T> {
  const fakeDatabase = createLocalStorageDatabase();
  return operation(fakeDatabase as unknown as IDBDatabase);
}

function openHighlightDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      const store = database.objectStoreNames.contains(STORE_NAME)
        ? request.transaction?.objectStore(STORE_NAME)
        : database.createObjectStore(STORE_NAME, { keyPath: 'id' });

      if (store && !store.indexNames.contains('documentId')) {
        store.createIndex('documentId', 'documentId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open highlights database.'));
  });
}

function withStore<T>(
  database: IDBDatabase,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => Promise<T>
): Promise<T> {
  const transaction = database.transaction(STORE_NAME, mode);
  const store = transaction.objectStore(STORE_NAME);

  return callback(store);
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function createLocalStorageDatabase() {
  return {
    transaction() {
      return {
        objectStore() {
          return {
            indexNames: {
              contains(name: string) {
                return name === 'documentId';
              }
            },
            index() {
              return {
                getAll(documentId: string) {
                  return createSynchronousRequest(readLocalHighlights().filter((item) => item.documentId === documentId));
                }
              };
            },
            getAll() {
              return createSynchronousRequest(readLocalHighlights());
            },
            put(highlight: SavedHighlight) {
              const highlights = readLocalHighlights().filter((item) => item.id !== highlight.id);
              writeLocalHighlights([...highlights, highlight]);
              return createSynchronousRequest(highlight);
            },
            delete(id: string) {
              writeLocalHighlights(readLocalHighlights().filter((item) => item.id !== id));
              return createSynchronousRequest(undefined);
            }
          };
        }
      };
    }
  };
}

function createSynchronousRequest<T>(result: T): IDBRequest<T> {
  const request = {} as IDBRequest<T>;

  queueMicrotask(() => {
    Object.defineProperty(request, 'result', {
      configurable: true,
      value: result
    });
    request.onsuccess?.(new Event('success') as IDBRequestEventMap['success']);
  });

  return request;
}

function readLocalHighlights(): SavedHighlight[] {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedHighlight[]) : [];
  } catch {
    return [];
  }
}

function writeLocalHighlights(highlights: SavedHighlight[]) {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }

  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(highlights));
}

function cryptoSafeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `highlight-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
