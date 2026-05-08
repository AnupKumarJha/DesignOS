/**
 * IndexedDB wrapper for Design OS — durable local persistence beyond
 * localStorage (which is ~5MB and gets cleared by browser cache wipes).
 *
 * Two object stores:
 *   - `projects`  → keyed by snapshot.project.id, value = full DesignSnapshot
 *   - `meta`      → keyed by string, value = arbitrary JSON (last opened, etc.)
 *
 * All public functions are async (Promise<T>).
 */

import type { DesignSnapshot } from '../store/useStore';

const DB_NAME = 'namaste-design-os';
const DB_VERSION = 1;
const PROJECTS_STORE = 'projects';
const META_STORE = 'meta';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB blocked — close other tabs and retry.'));
  });
  return dbPromise;
}

interface ProjectRow {
  id: string;
  snapshot: DesignSnapshot;
}

export async function getAllProjects(): Promise<DesignSnapshot[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROJECTS_STORE, 'readonly');
    const store = tx.objectStore(PROJECTS_STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      const rows = (req.result as ProjectRow[]) || [];
      resolve(rows.map((r) => r.snapshot));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getProject(id: string): Promise<DesignSnapshot | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROJECTS_STORE, 'readonly');
    const req = tx.objectStore(PROJECTS_STORE).get(id);
    req.onsuccess = () => {
      const row = req.result as ProjectRow | undefined;
      resolve(row?.snapshot);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function putProject(snapshot: DesignSnapshot): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROJECTS_STORE, 'readwrite');
    const row: ProjectRow = { id: snapshot.project.id, snapshot };
    const req = tx.objectStore(PROJECTS_STORE).put(row);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteProjectRow(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROJECTS_STORE, 'readwrite');
    const req = tx.objectStore(PROJECTS_STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getMeta<T = unknown>(key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readonly');
    const req = tx.objectStore(META_STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function putMeta(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readwrite');
    const req = tx.objectStore(META_STORE).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Request the browser to mark our storage as "persistent" so the OS won't
 * evict it under storage pressure or clear-browsing-data sweeps. Best-effort —
 * on Firefox / Chrome this triggers a prompt or is granted automatically.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage || !navigator.storage.persist) return false;
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
