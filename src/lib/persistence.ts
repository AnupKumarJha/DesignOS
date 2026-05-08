import { DesignSnapshot, ProjectStatus } from '../store/useStore';
import {
  deleteProjectRow,
  getAllProjects,
  getMeta,
  putMeta,
  putProject,
  requestPersistentStorage,
} from './db';

/**
 * The storage strategy:
 *   1. IndexedDB (durable) is the source of truth.
 *   2. A module-level cache mirrors it for synchronous reads in UI code.
 *   3. localStorage is kept as a one-time migration source so users with
 *      pre-IndexedDB data don't lose anything.
 *   4. All mutating helpers update the cache and fire-and-forget the IDB
 *      write. Caller passes back the new list to Zustand.
 */

const LOCAL_STORAGE_KEY = 'namaste-design-os-projects';
const META_LAST_OPENED = 'lastOpenedProjectId';

let cache: DesignSnapshot[] = [];
let bootstrapped = false;

/**
 * Async-load projects from IndexedDB into the in-memory cache. Call once
 * on app mount before reading.
 */
export async function bootstrapProjects(): Promise<DesignSnapshot[]> {
  // Best-effort: ask the browser to mark our storage as persistent so it
  // isn't evicted under storage pressure.
  void requestPersistentStorage();

  const idbProjects = await getAllProjects();

  // One-time migration: if IDB is empty but localStorage has projects,
  // pull them in so the user keeps their work from before this upgrade.
  if (idbProjects.length === 0) {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const local = JSON.parse(raw) as DesignSnapshot[];
        if (Array.isArray(local) && local.length > 0) {
          for (const snapshot of local) {
            await putProject(snapshot);
          }
          cache = local;
          bootstrapped = true;
          return cache;
        }
      }
    } catch {
      // ignore — bad localStorage data shouldn't block startup
    }
  }

  cache = idbProjects;
  bootstrapped = true;
  return cache;
}

/** Synchronous read of the in-memory cache. */
export function loadProjects(): DesignSnapshot[] {
  return cache;
}

/**
 * Synchronous write to cache + fire-and-forget IndexedDB persist.
 * Returns the updated array for callers that drive Zustand state.
 */
export function upsertProject(snapshot: DesignSnapshot): DesignSnapshot[] {
  cache = [
    snapshot,
    ...cache.filter((project) => project.project.id !== snapshot.project.id),
  ];
  void putProject(snapshot).catch((err) => console.error('IDB save failed:', err));
  return cache;
}

export function deleteProject(projectId: string): DesignSnapshot[] {
  const now = new Date().toISOString();
  cache = cache.map((snapshot) =>
    snapshot.project.id === projectId ? { ...snapshot, deletedAt: now } : snapshot,
  );
  const updated = cache.find((s) => s.project.id === projectId);
  if (updated) void putProject(updated).catch((err) => console.error('IDB save failed:', err));
  return cache;
}

export function restoreProject(projectId: string): DesignSnapshot[] {
  cache = cache.map((snapshot) =>
    snapshot.project.id === projectId ? { ...snapshot, deletedAt: null } : snapshot,
  );
  const updated = cache.find((s) => s.project.id === projectId);
  if (updated) void putProject(updated).catch((err) => console.error('IDB save failed:', err));
  return cache;
}

export function permanentlyDeleteProject(projectId: string): DesignSnapshot[] {
  cache = cache.filter((snapshot) => snapshot.project.id !== projectId);
  void deleteProjectRow(projectId).catch((err) => console.error('IDB delete failed:', err));
  return cache;
}

export function updateProjectStatus(projectId: string, status: ProjectStatus): DesignSnapshot[] {
  const now = new Date().toISOString();
  cache = cache.map((snapshot) =>
    snapshot.project.id === projectId
      ? { ...snapshot, project: { ...snapshot.project, status, updatedAt: now } }
      : snapshot,
  );
  const updated = cache.find((s) => s.project.id === projectId);
  if (updated) void putProject(updated).catch((err) => console.error('IDB save failed:', err));
  return cache;
}

/** Light-weight "auto save" — used by the store subscription. */
export async function autoSaveSnapshot(snapshot: DesignSnapshot): Promise<void> {
  cache = [
    snapshot,
    ...cache.filter((project) => project.project.id !== snapshot.project.id),
  ];
  await putProject(snapshot);
}

export async function setLastOpenedProject(projectId: string | null): Promise<void> {
  await putMeta(META_LAST_OPENED, projectId);
}

export async function getLastOpenedProject(): Promise<string | null> {
  const id = await getMeta<string | null>(META_LAST_OPENED);
  return id ?? null;
}

export function isBootstrapped(): boolean {
  return bootstrapped;
}

export function downloadJson(snapshot: DesignSnapshot) {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${snapshot.project.projectName || 'design-project'}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function readJsonFile(file: File): Promise<DesignSnapshot> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)) as DesignSnapshot);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
