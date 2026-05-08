import { DesignSnapshot } from '../store/useStore';

const STORAGE_KEY = 'namaste-design-os-projects';

export function loadProjects(): DesignSnapshot[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const projects = JSON.parse(raw) as DesignSnapshot[];
    return Array.isArray(projects) ? projects : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects: DesignSnapshot[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function upsertProject(snapshot: DesignSnapshot): DesignSnapshot[] {
  const projects = loadProjects();
  const next = [
    snapshot,
    ...projects.filter((project) => project.project.id !== snapshot.project.id),
  ];
  saveProjects(next);
  return next;
}

export function deleteProject(projectId: string): DesignSnapshot[] {
  const next = loadProjects().filter((project) => project.project.id !== projectId);
  saveProjects(next);
  return next;
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
