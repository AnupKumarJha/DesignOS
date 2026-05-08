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
  texture?: string;
  shutterCount?: number;
  drawerCount?: number;
  hasHandle?: boolean;
  skirtingHeight?: number;
}

export type ViewMode = '2D' | '3D' | 'SPLIT';
export type Tool = 'SELECT' | 'WALL' | 'FURNITURE' | 'WINDOW' | 'DOOR' | 'DELETE' | 'APPLY_FINISH';
export type CatalogCategory = 'ARCHITECTURE' | 'FURNITURE' | 'FINISHES';

interface AppState {
  // Data
  walls: Wall[];
  openings: WallOpening[];
  furniture: Furniture[];
  selection: { id: string, type: 'wall' | 'furniture' | 'opening' } | null;
  
  // UI State
  viewMode: ViewMode;
  activeTool: Tool;
  catalogOpen: boolean;
  activeCategory: CatalogCategory;
  activeFinish: string | null;
  selectedCatalogItem: string | null;
  
  // Actions
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
  setActiveTool: (tool: Tool) => void;
  setCatalogOpen: (open: boolean) => void;
  setActiveCategory: (cat: CatalogCategory) => void;
  setActiveFinish: (finish: string | null) => void;
  setSelectedCatalogItem: (id: string | null) => void;
  clearAll: () => void;
}

export const useStore = create<AppState>()(
  temporal(
    subscribeWithSelector((set) => ({
      walls: [],
      openings: [],
      furniture: [],
      selection: null,
      viewMode: '2D',
      activeTool: 'SELECT',
      catalogOpen: true,
      activeCategory: 'ARCHITECTURE',
      activeFinish: null,
      selectedCatalogItem: null,

      // ... existing actions
      addWall: (wall) => set((state) => ({ 
        walls: [...state.walls, wall] 
      })),

      removeWall: (id) => set((state) => ({ 
        walls: state.walls.filter((w) => w.id !== id),
        openings: state.openings.filter((o) => o.wallId !== id),
        selection: state.selection?.id === id ? null : state.selection
      })),

      updateWall: (id, updates) => set((state) => ({
        walls: state.walls.map((w) => w.id === id ? { ...w, ...updates } : w)
      })),

      addOpening: (opening) => set((state) => ({
        openings: [...state.openings, opening]
      })),

      removeOpening: (id) => set((state) => ({
        openings: state.openings.filter((o) => o.id !== id),
        selection: state.selection?.id === id ? null : state.selection
      })),

      updateOpening: (id, updates) => set((state) => ({
        openings: state.openings.map((o) => o.id === id ? { ...o, ...updates } : o)
      })),

      addFurniture: (item) => set((state) => ({
        furniture: [...state.furniture, item]
      })),

      removeFurniture: (id) => set((state) => ({
        furniture: state.furniture.filter((f) => f.id !== id),
        selection: state.selection?.id === id ? null : state.selection
      })),

      updateFurniture: (id, updates) => set((state) => ({
        furniture: state.furniture.map((f) => f.id === id ? { ...f, ...updates } : f)
      })),

      setSelection: (selection) => set({ selection }),

      setViewMode: (mode) => set({ viewMode: mode }),

      setActiveTool: (tool) => set({ activeTool: tool }),

      setCatalogOpen: (open) => set({ catalogOpen: open }),

      setActiveCategory: (cat) => set({ activeCategory: cat }),

      setActiveFinish: (finish) => set({ activeFinish: finish }),
      setSelectedCatalogItem: (id) => set({ selectedCatalogItem: id }),
      clearAll: () => set({ walls: [], furniture: [], openings: [], selection: null }),
    })),
    {
      limit: 50,
    }
  )
);
