import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { temporal } from 'zundo';
import type { FurnitureCatalogItem } from '../data/catalog';

export interface Point {
  x: number;
  y: number;
}

export interface Wall {
  id: string;
  roomId: string;
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
  roomId: string;
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
  roomId: string;
  type:
    | 'CABINET_BASE'
    | 'CABINET_WALL'
    | 'CABINET_TALL'
    | 'TABLE'
    | 'CHAIR'
    | 'WARDROBE'
    | 'SINK_UNIT'
    | 'BED'
    | 'SOFA'
    | 'DESK'
    | 'BOOKSHELF'
    | 'TV_UNIT'
    | 'NIGHTSTAND'
    | 'DRESSER'
    | 'VANITY'
    | 'COFFEE_TABLE'
    | 'DINING_TABLE'
    | 'SHOE_RACK'
    | 'STUDY_UNIT'
    | 'OFFICE_CHAIR'
    | 'MIRROR';
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
  catalogName?: string;
  catalogBrand?: string;
  catalogSku?: string;
  catalogVariantLabel?: string;
  modelAssetId?: string;
  thumbnailAssetId?: string;
  assetFormat?: 'glb' | 'gltf';
  sourceUrl?: string;
  licenseNote?: string;
}

export interface BackgroundPlan {
  imageUrl: string;        // data URI of the imported image
  opacity: number;         // 0..1
  mmPerPixel: number;      // calibrated scale (mm per image pixel)
  originX: number;         // world-X of image's top-left corner
  originY: number;         // world-Y of image's top-left corner
  naturalWidth: number;    // image native width in pixels
  naturalHeight: number;   // image native height in pixels
}

export interface Room {
  id: string;
  name: string;        // Display name, e.g. 'Master Kitchen'
  type: string;        // Functional type, e.g. 'Kitchen' / 'Bedroom'
  building: string;    // 'Building 1', 'Tower A', etc.
  floor: string;       // 'Ground Floor', '1st Floor'
  createdAt: string;
  backgroundPlan?: BackgroundPlan | null;
}

export type ViewMode = '2D' | '3D' | 'SPLIT';
export type CameraPreset = 'FREE' | 'TOP' | 'FRONT' | 'SIDE' | 'ISLAND_FRONT';
export type WorkspaceMode = 'DASHBOARD' | 'DESIGN';
export type Tool = 'SELECT' | 'WALL' | 'FURNITURE' | 'WINDOW' | 'DOOR' | 'DELETE' | 'APPLY_FINISH';
export type CatalogCategory = 'ARCHITECTURE' | 'FURNITURE' | 'FINISHES';
export type RibbonTab = 'Home' | 'View' | 'Insert' | 'Draw' | 'Architecture' | 'Annotate' | 'Render' | 'Outputs';
export type RenderQuality = 'Preview' | 'High';
export type RenderCameraPreset = 'Wide Interior' | 'Eye Level' | 'Corner View' | 'Ceiling View' | 'Furniture Focus';
export type RenderRoomType = 'Auto' | 'Kitchen' | 'Master Bedroom' | 'Bedroom' | 'Hall' | 'Dining' | 'Bathroom' | 'Office' | 'Foyer' | 'Balcony';

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
  schemaVersion: 3;
  project: ProjectMeta;
  rooms: Room[];
  currentRoomId: string;
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
  customCatalogItems: FurnitureCatalogItem[];

  // Multi-room hierarchy
  rooms: Room[];
  currentRoomId: string;

  // Data (all rooms — viewports filter by currentRoomId)
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
  saveStatus: 'idle' | 'saving' | 'saved';
  catalogWidth: number;
  ribbonTab: RibbonTab;
  presentationMode: boolean;
  renderQuality: RenderQuality;
  renderCameraPreset: RenderCameraPreset;
  activeRenderRoomType: RenderRoomType;
  showCeiling: boolean;
  showDecor: boolean;
  showLights: boolean;
  showDimensions: boolean;

  // Actions
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  updateProject: (updates: Partial<ProjectMeta>) => void;
  setSavedProjects: (projects: DesignSnapshot[]) => void;
  setCustomCatalogItems: (items: FurnitureCatalogItem[]) => void;
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
  setSaveStatus: (status: 'idle' | 'saving' | 'saved') => void;
  setCatalogWidth: (w: number) => void;
  setRibbonTab: (tab: RibbonTab) => void;
  setPresentationMode: (enabled: boolean) => void;
  setRenderQuality: (quality: RenderQuality) => void;
  setRenderCameraPreset: (preset: RenderCameraPreset) => void;
  setActiveRenderRoomType: (roomType: RenderRoomType) => void;
  setShowCeiling: (show: boolean) => void;
  setShowDecor: (show: boolean) => void;
  setShowLights: (show: boolean) => void;
  setShowDimensions: (show: boolean) => void;

  // Room actions
  addRoom: (room: Omit<Room, 'id' | 'createdAt'>) => string;
  setCurrentRoom: (roomId: string) => void;
  renameRoom: (roomId: string, name: string) => void;
  removeRoom: (roomId: string) => void;
  updateRoomBackground: (roomId: string, plan: BackgroundPlan | null) => void;

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

const createDefaultRoom = (project: ProjectMeta): Room => ({
  id: crypto.randomUUID(),
  name: project.room || 'Kitchen',
  type: project.room || 'Kitchen',
  building: project.building || 'Building 1',
  floor: project.floor || 'Ground Floor',
  createdAt: new Date().toISOString(),
});

/**
 * Migrates a snapshot from earlier schema (v1/v2) to v3, ensuring
 * `rooms`, `currentRoomId`, and `roomId` on every entity are present.
 */
const migrateSnapshot = (snapshot: DesignSnapshot): DesignSnapshot => {
  const hasRooms = Array.isArray((snapshot as any).rooms) && (snapshot as any).rooms.length > 0;
  if (hasRooms && snapshot.currentRoomId) {
    return snapshot;
  }
  const legacyRoom = createDefaultRoom(snapshot.project);
  const tag = (e: any) => ({ ...e, roomId: e.roomId ?? legacyRoom.id });
  return {
    ...snapshot,
    schemaVersion: 3,
    rooms: [legacyRoom],
    currentRoomId: legacyRoom.id,
    walls: snapshot.walls.map(tag),
    openings: snapshot.openings.map(tag),
    furniture: snapshot.furniture.map(tag),
  };
};

export const useStore = create<AppState>()(
  temporal(
    subscribeWithSelector((set, get) => {
      const initialProject = createProject();
      const initialRoom = createDefaultRoom(initialProject);
      return {
      workspaceMode: 'DASHBOARD',
      project: initialProject,
      savedProjects: [],
      customCatalogItems: [],
      rooms: [initialRoom],
      currentRoomId: initialRoom.id,
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
      saveStatus: 'idle' as const,
      catalogWidth: 300,
      ribbonTab: 'Home',
      presentationMode: false,
      renderQuality: 'High',
      renderCameraPreset: 'Wide Interior',
      activeRenderRoomType: 'Auto',
      showCeiling: true,
      showDecor: true,
      showLights: true,
      showDimensions: false,

      setWorkspaceMode: (mode) => set({ workspaceMode: mode }),

      updateProject: (updates) => set((state) => ({
        project: { ...state.project, ...updates, updatedAt: new Date().toISOString() }
      })),

      setSavedProjects: (projects) => set({ savedProjects: projects }),
      setCustomCatalogItems: (items) => set({ customCatalogItems: items }),

      loadSnapshot: (snapshot) => {
        const migrated = migrateSnapshot(snapshot);
        set({
          workspaceMode: 'DESIGN',
          project: { ...migrated.project, updatedAt: new Date().toISOString() },
          rooms: migrated.rooms,
          currentRoomId: migrated.currentRoomId,
          walls: migrated.walls,
          openings: migrated.openings,
          furniture: migrated.furniture,
          viewMode: migrated.viewMode,
          cameraPreset: migrated.cameraPreset,
          selection: null,
          activeTool: 'SELECT',
        });
      },

      getSnapshot: () => {
        const state = get();
        return {
          schemaVersion: 3,
          project: { ...state.project, updatedAt: new Date().toISOString() },
          rooms: state.rooms,
          currentRoomId: state.currentRoomId,
          walls: state.walls,
          openings: state.openings,
          furniture: state.furniture,
          viewMode: state.viewMode,
          cameraPreset: state.cameraPreset,
        };
      },

      addWall: (wall) => set((state) => ({
        walls: [...state.walls, { ...wall, roomId: wall.roomId || state.currentRoomId }],
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
        openings: [...state.openings, { ...opening, roomId: opening.roomId || state.currentRoomId }],
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
        furniture: [...state.furniture, { ...item, roomId: item.roomId || state.currentRoomId }],
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
      setSaveStatus: (status) => set({ saveStatus: status }),
      setCatalogWidth: (w) => set({ catalogWidth: Math.max(220, Math.min(600, w)) }),
      setRibbonTab: (tab) => set({ ribbonTab: tab }),
      setPresentationMode: (enabled) => set({ presentationMode: enabled }),
      setRenderQuality: (quality) => set({ renderQuality: quality }),
      setRenderCameraPreset: (preset) => set({ renderCameraPreset: preset }),
      setActiveRenderRoomType: (roomType) => set({ activeRenderRoomType: roomType }),
      setShowCeiling: (show) => set({ showCeiling: show }),
      setShowDecor: (show) => set({ showDecor: show }),
      setShowLights: (show) => set({ showLights: show }),
      setShowDimensions: (show) => set({ showDimensions: show }),

      // ── Multi-room actions ──────────────────────────────────────────
      addRoom: (room) => {
        const newRoom: Room = {
          ...room,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          rooms: [...state.rooms, newRoom],
          currentRoomId: newRoom.id,
          selection: null,
          project: {
            ...state.project,
            building: newRoom.building,
            floor: newRoom.floor,
            room: newRoom.name,
            updatedAt: new Date().toISOString(),
          },
        }));
        return newRoom.id;
      },

      setCurrentRoom: (roomId) => set((state) => {
        const room = state.rooms.find((r) => r.id === roomId);
        if (!room) return {};
        return {
          currentRoomId: roomId,
          selection: null,
          project: {
            ...state.project,
            building: room.building,
            floor: room.floor,
            room: room.name,
            updatedAt: new Date().toISOString(),
          },
        };
      }),

      renameRoom: (roomId, name) => set((state) => ({
        rooms: state.rooms.map((r) => (r.id === roomId ? { ...r, name } : r)),
        project:
          state.currentRoomId === roomId
            ? { ...state.project, room: name, updatedAt: new Date().toISOString() }
            : state.project,
      })),

      updateRoomBackground: (roomId, plan) => set((state) => ({
        rooms: state.rooms.map((r) =>
          r.id === roomId ? { ...r, backgroundPlan: plan } : r,
        ),
        project: { ...state.project, updatedAt: new Date().toISOString() },
      })),

      removeRoom: (roomId) => set((state) => {
        // Don't allow removing the last room
        if (state.rooms.length <= 1) return {};
        const remaining = state.rooms.filter((r) => r.id !== roomId);
        const nextCurrent =
          state.currentRoomId === roomId ? remaining[0].id : state.currentRoomId;
        return {
          rooms: remaining,
          currentRoomId: nextCurrent,
          walls: state.walls.filter((w) => w.roomId !== roomId),
          furniture: state.furniture.filter((f) => f.roomId !== roomId),
          openings: state.openings.filter((o) => o.roomId !== roomId),
          selection: null,
          project: { ...state.project, updatedAt: new Date().toISOString() },
        };
      }),

      clearAll: () => set((state) => ({
        walls: state.walls.filter((w) => w.roomId !== state.currentRoomId),
        furniture: state.furniture.filter((f) => f.roomId !== state.currentRoomId),
        openings: state.openings.filter((o) => o.roomId !== state.currentRoomId),
        selection: null,
        project: { ...state.project, updatedAt: new Date().toISOString() },
      })),
      };
    }),
    {
      limit: 50,
    }
  )
);
