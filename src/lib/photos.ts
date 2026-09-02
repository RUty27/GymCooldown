/**
 * Reference photos of the machine used for an exercise, keyed by exercise id.
 *
 * These live in IndexedDB rather than localStorage: even one compressed photo
 * would eat a meaningful slice of localStorage's ~5MB, and a handful would
 * blow it entirely and take your workout history down with it.
 *
 * Photos never leave the device — there is no upload anywhere.
 */

const DB_NAME = 'gymcooldown-photos';
const DB_VERSION = 1;
const STORE = 'photos';

/** Longest edge, in pixels, that a stored photo is resized down to. */
export const MAX_EDGE = 1024;
export const JPEG_QUALITY = 0.7;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

/**
 * Shrink a camera photo before storing it. Phone cameras produce 3-8MB images;
 * as a "which machine was it?" reminder, a long edge of 1024px is plenty.
 */
export function compressImage(file: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Could not process the image'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Could not process the image'))),
        'image/jpeg',
        JPEG_QUALITY,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file did not look like an image'));
    };
    img.src = url;
  });
}

export async function savePhoto(exerciseId: string, file: Blob): Promise<void> {
  const compressed = await compressImage(file);
  await withStore('readwrite', (s) => s.put(compressed, exerciseId) as IDBRequest<IDBValidKey>);
}

export function getPhoto(exerciseId: string): Promise<Blob | undefined> {
  return withStore('readonly', (s) => s.get(exerciseId) as IDBRequest<Blob | undefined>);
}

export function deletePhoto(exerciseId: string): Promise<void> {
  return withStore('readwrite', (s) => s.delete(exerciseId) as IDBRequest<undefined>).then(
    () => undefined,
  );
}

export function listPhotoIds(): Promise<string[]> {
  return withStore('readonly', (s) => s.getAllKeys() as IDBRequest<IDBValidKey[]>).then((keys) =>
    keys.map(String),
  );
}

export async function clearPhotos(): Promise<void> {
  await withStore('readwrite', (s) => s.clear() as IDBRequest<undefined>);
}
