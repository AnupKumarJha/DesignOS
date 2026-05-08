import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { temporal } from 'zundo';

export interface Point {
  x: number;
  y: number;
}

export interface Wall {
  id: string;
  start: Point;
  end: Point;
  thickness: number;
  height: number;
  color?: string;
  materialId?: string;
  skirtingHeight?: number;
  hasCornice?: boolean;
}

export interface WallOpening {
  id: string;
  wallId: string;
  type: 'WINDOW' | 'DOOR';
  offset: number; // 0 to 1 along the wall
  width: number;
  height: number;
  bottomHeight: number; // Distance from floor
  flip?: boolean;
}

export interface Furniture {
  id: string;
  type: 'CABINET_BASE' | 'CABINET_WALL' | 'CABINET_TALL' | 'TABLE' | 'CHAIR' | 'WARDROBE' | 'SINK_UNIT';
  position: Point;
  rotation: number;
  width: number;
  depth: number;
  height: number;
  color?: string;
  materialId?: string;
  catalogItemId?: string;
  variantId?: string;
  texture?: string;
  shutterCount?: number;
  drawerCount?: number;
  hasHandle?: boolean;
  skirtingHeight?: number;
}

export type ViewMode = '2D' | '3D' | 'SPLIT';
export type CameraPreset = 'FREE' | 'TOP' | 'FRONT' | 'SIDE' | 'ISLAND_FRONT';
export type WorkspaceMode = 'DASHBOARD' | 'DESIGN';
export type Tool = 'SELECT' | 'WALL' | 'FURNITURE' | 'WINDOW' | 'DOOR' | 'DELETE' | 'APPLY_FINISH';
export type CatalogCategory = 'ARCHITECTURE' | 'FURNITURE' | 'FINISHES';

export type ProjectType = 'Residential' | 'Commercial';
export type ProjectStatus = 'Design Phase' | 'In Review' | 'In Production' | 'Completed';

export interface ProjectMeta {
  id: string;
  projectName: string;
  clientName: string;
  clientDetails: string;
  projectId: string;
  projectType: ProjectType;
  building: string;
  floor: string;
  room: string;
  status: ProjectStatus;
  updatedAt: string;
}

export interface DesignSnapshot {
  schemaVersion: 2;
  project: ProjectMeta;
  walls: Wall[];
  openings: WallOpening[];
  furniture: Furniture[];
  viewMode: ViewMode;
  cameraPreset: CameraPreset;
  deletedAt?: string | null;
}

interface AppState {
  // Project
  workspaceMode: WorkspaceMode;
  project: ProjectMeta;
  savedProjects: DesignSnapshot[];
  
  // Data
  walls: Wall[];
  openings: WallOpening[];
  furniture: Furniture[];
  selection: { id: string, type: 'wall' | 'furniture' | 'opening' } | null;
  
  // UI State
  viewMode: ViewMode;
  cameraPreset: CameraPreset;
  activeTool: Tool;
  catalogOpen: boolean;
  activeCategory: CatalogCategory;
  activeFinish: string | null;
  selectedCatalogItem: string | null;
  materialDrawerOpen: boolean;
  materialDrawerCategory: string;

  // Actions
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  updateProject: (updates: Partial<ProjectMeta>) => void;
  setSavedProjects: (projects: DesignSnapshot[]) => void;
  loadSnapshot: (snapshot: DesignSnapshot) => void;
  getSnapshot: () => DesignSnapshot;
  addWall: (wall: Wall) => void;
  removeWall: (id: string) => void;
  updateWall: (id: string, updates: Partial<Wall>) => void;
  
  addOpening: (opening: WallOpening) => void;
  removeOpening: (id: string) => void;
  updateOpening: (id: string, updates: Partial<WallOpening>) => void;

  addFurniture: (item: Furniture) => void;
  removeFurniture: (id: string) => void;
  updateFurniture: (id: string, updates: Partial<Furniture>) => void;

  setSelection: (selection: { id: string, type: 'wall' | 'furniture' | 'opening' } | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  setActiveTool: (tool: Tool) => void;
  setCatalogOpen: (open: boolean) => void;
  setActiveCategory: (cat: CatalogCategory) => void;
  setActiveFinish: (finish: string | null) => void;
  setSelectedCatalogItem: (id: string | null) => void;
  setMaterialDrawerOpen: (open: boolean) => void;
  setMaterialDrawerCategory: (category: string) => void;
  clearAll: () => void;
}

const createProject = (): ProjectMeta => {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    projectName: 'Namaste Design Studios',
    clientName: 'Anup & Rishu',
    clientDetails: '',
    projectId: `PN-${Math.floor(10000 + Math.random() * 90000)}`,
    projectType: 'Residential',
    building: 'Building 1',
    floor: 'Ground Floor',
    room: 'Kitchen',
    status: 'Design Phase',
    updatedAt: now,
  };
};

export const useStore = create<AppState>()(
  temporal(
    subscribeWithSelector((set, get) => ({
      workspaceMode: 'DASHBOARD',
      project: createProject(),
      savedProjects: [],
      walls: [],
      openings: [],
      furniture: [],
      selection: null,
      viewMode: '2D',
      cameraPreset: 'FREE',
      activeTool: 'SELECT',
      catalogOpen: true,
      activeCategory: 'ARCHITECTURE',
      activeFinish: null,
      selectedCatalogItem: null,
      materialDrawerOpen: false,
      materialDrawerCategory: 'Solid Paints',

      setWorkspaceMode: (mode) => set({ workspaceMode: mode }),

      updateProject: (updates) => set((state) => ({
        project: { ...state.project, ...updates, updatedAt: new Date().toISOString() }
      })),

      setSavedProjects: (projects) => set({ savedProjects: projects }),

      loadSnapshot: (snapshot) => set({
        workspaceMode: 'DESIGN',
        project: { ...snapshot.project, updatedAt: new Date().toISOString() },
        walls: snapshot.walls,
        openings: snapshot.openings,
        furniture: snapshot.furniture,
        viewMode: snapshot.viewMode,
        cameraPreset: snapshot.cameraPreset,
        selection: null,
        activeTool: 'SELECT',
      }),

      getSnapshot: () => {
        const state = get();
        return {
          schemaVersion: 2,
          project: { ...state.project, updatedAt: new Date().toISOString() },
          walls: state.walls,
          openings: state.openings,
          furniture: state.furniture,
          viewMode: state.viewMode,
          cameraPreset: state.cameraPreset,
        };
      },

      addWall: (wall) => set((state) => ({ 
        walls: [...state.walls, wall],
        project: { ...state.project, updatedAt: new Date().toISOString() }
      })),

      removeWall: (id) => set((state) => ({ 
        walls: state.walls.filter((w) => w.id !== id),
        openings: state.openings.filter((o) => o.wallId !== id),
        selection: state.selection?.id === id ? null : state.selection,
        project: { ...state.project, updatedAt: new Date().toISOString() }
      })),

      updateWall: (id, updates) => set((state) => ({
        walls: state.walls.map((w) => w.id === id ? { ...w, ...updates } : w),
        project: { ...state.project, updatedAt: new Date().toISOString() }
      })),

      addOpening: (opening) => set((state) => ({
        openings: [...state.openings, opening],
        project: { ...state.project, updatedAt: new Date().toISOString() }
      })),

      removeOpening: (id) => set((state) => ({
        openings: state.openings.filter((o) => o.id !== id),
        selection: state.selection?.id === id ? null : state.selection,
        project: { ...state.project, updatedAt: new Date().toISOString() }
      })),

      updateOpening: (id, updates) => set((state) => ({
        openings: state.openings.map((o) => o.id === id ? { ...o, ...updates } : o),
        project: { ...state.project, updatedAt: new Date().toISOString() }
      })),

      addFurniture: (item) => set((state) => ({
        furniture: [...state.furniture, item],
        project: { ...state.project, updatedAt: new Date().toISOString() }
      })),

      removeFurniture: (id) => set((state) => ({
        furniture: state.furniture.filter((f) => f.id !== id),
        selection: state.selection?.id === id ? null : state.selection,
        project: { ...state.project, updatedAt: new Date().toISOString() }
      })),

      updateFurniture: (id, updates) => set((state) => ({
        furniture: state.furniture.map((f) => f.id === id ? { ...f, ...updates } : f),
        project: { ...state.project, updatedAt: new Date().toISOString() }
      })),

      setSelection: (selection) => set({ selection }),

      setViewMode: (mode) => set({ viewMode: mode }),

      setCameraPreset: (preset) => set({ cameraPreset: preset }),

      setActiveTool: (tool) => set({ activeTool: tool }),

      setCatalogOpen: (open) => set({ catalogOpen: open }),

      setActiveCategory: (cat) => set({ activeCategory: cat }),

      setActiveFinish: (finish) => set({ activeFinish: finish }),
      setSelectedCatalogItem: (id) => set({ selectedCatalogItem: id }),
      setMaterialDrawerOpen: (open) => set({ materialDrawerOpen: open }),
      setMaterialDrawerCategory: (category) => set({ materialDrawerCategory: category }),
      clearAll: () => set({
        walls: [],
        furniture: [],
        openings: [],
        selection: null,
        project: { ...get().project, updatedAt: new Date().toISOString() }
      }),
    })),
    {
      limit: 50,
    }
  )
);
