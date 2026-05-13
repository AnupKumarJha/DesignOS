import { furnitureCatalog } from '../data/catalog';
import { createFurnitureFromCatalog } from './furnitureFactory';
import { DesignSnapshot, Furniture, ProjectMeta, ProjectSettings, Room, Wall, useStore } from '../store/useStore';

type QaRoomType = 'Kitchen' | 'Bedroom' | 'Living Room' | 'Other';

export interface DesignQaHarness {
  resetProject: (room?: QaRoomType) => void;
  placeFurniture: (catalogItemId: string, position?: { x: number; y: number }) => string | null;
  openSelectedFurniture: () => void;
  setViewMode: (mode: '2D' | '3D' | 'SPLIT') => void;
  setRealMode: (enabled: boolean) => void;
  getFurnitureCatalogIds: () => string[];
  getSelectedFurniture: () => Furniture | null;
  getStateSummary: () => {
    furnitureCount: number;
    selectedFurnitureId: string | null;
    viewMode: string;
    presentationMode: boolean;
  };
}

declare global {
  interface Window {
    __DESIGN_OS_QA__?: DesignQaHarness;
  }
}

export function installDesignQaHarness() {
  const harness: DesignQaHarness = {
    resetProject: (room = 'Kitchen') => {
      const snapshot = createQaSnapshot(room);
      useStore.getState().loadSnapshot(snapshot);
      useStore.setState({
        activeCategory: 'FURNITURE',
        activeTool: 'SELECT',
        selectedCatalogItem: null,
        activeFinish: null,
        presentationMode: false,
        materialDrawerOpen: false,
      });
    },
    placeFurniture: (catalogItemId, position) => {
      const state = useStore.getState();
      const room = state.rooms.find((entry) => entry.id === state.currentRoomId);
      const next = createFurnitureFromCatalog({
        catalogItemId,
        roomId: state.currentRoomId,
        position: position ?? nextQaPosition(state.furniture.length, room?.type),
        walls: state.walls.filter((wall) => wall.roomId === state.currentRoomId),
        customCatalogItems: state.customCatalogItems,
      });
      if (!next) return null;
      state.addFurniture(next);
      useStore.setState({
        selection: { id: next.id, type: 'furniture' },
        activeCategory: 'FURNITURE',
        activeTool: 'SELECT',
        materialDrawerOpen: false,
        workspaceMode: 'DESIGN',
      });
      return next.id;
    },
    openSelectedFurniture: () => {
      const state = useStore.getState();
      if (state.selection?.type !== 'furniture') return;
      const item = state.furniture.find((entry) => entry.id === state.selection?.id);
      if (!item) return;
      state.updateFurniture(item.id, { openState: 'open', openAmount: 1 });
    },
    setViewMode: (mode) => useStore.getState().setViewMode(mode),
    setRealMode: (enabled) => {
      const state = useStore.getState();
      state.setViewMode('3D');
      state.setPresentationMode(enabled);
    },
    getFurnitureCatalogIds: () => furnitureCatalog.map((item) => item.id),
    getSelectedFurniture: () => {
      const state = useStore.getState();
      if (state.selection?.type !== 'furniture') return null;
      return state.furniture.find((item) => item.id === state.selection?.id) ?? null;
    },
    getStateSummary: () => {
      const state = useStore.getState();
      return {
        furnitureCount: state.furniture.length,
        selectedFurnitureId: state.selection?.type === 'furniture' ? state.selection.id : null,
        viewMode: state.viewMode,
        presentationMode: state.presentationMode,
      };
    },
  };

  window.__DESIGN_OS_QA__ = harness;
  return () => {
    if (window.__DESIGN_OS_QA__ === harness) delete window.__DESIGN_OS_QA__;
  };
}

function createQaSnapshot(roomType: QaRoomType): DesignSnapshot {
  const now = new Date().toISOString();
  const project: ProjectMeta = {
    id: `qa-${crypto.randomUUID()}`,
    projectName: 'Furniture QA Project',
    clientName: 'QA',
    clientDetails: 'Automated furniture regression harness',
    projectId: `QA-${Date.now()}`,
    projectType: 'Residential',
    building: 'Building 1',
    floor: 'Ground Floor',
    room: roomType,
    status: 'Design Phase',
    updatedAt: now,
  };
  const settings: ProjectSettings = {
    unitSystem: 'mm',
    defaultFloorMaterialId: 'floor_clear_white',
    defaultWallHeight: 2700,
    defaultWallThickness: 150,
  };
  const room: Room = {
    id: `qa-room-${crypto.randomUUID()}`,
    name: roomType,
    type: roomType,
    building: project.building,
    floor: project.floor,
    createdAt: now,
  };
  return {
    schemaVersion: 4,
    project,
    settings,
    rooms: [room],
    currentRoomId: room.id,
    walls: createQaWalls(room.id, roomType),
    openings: [],
    furniture: [],
    viewMode: '2D',
    cameraPreset: 'FREE',
  };
}

function createQaWalls(roomId: string, roomType: QaRoomType): Wall[] {
  const width = roomType === 'Living Room' ? 5600 : roomType === 'Bedroom' ? 4600 : 4200;
  const depth = roomType === 'Living Room' ? 4400 : roomType === 'Bedroom' ? 3800 : 3400;
  return [
    { id: `qa-wall-${crypto.randomUUID()}`, roomId, start: { x: 0, y: 0 }, end: { x: width, y: 0 }, thickness: 150, height: 2700 },
    { id: `qa-wall-${crypto.randomUUID()}`, roomId, start: { x: width, y: 0 }, end: { x: width, y: depth }, thickness: 150, height: 2700 },
    { id: `qa-wall-${crypto.randomUUID()}`, roomId, start: { x: width, y: depth }, end: { x: 0, y: depth }, thickness: 150, height: 2700 },
    { id: `qa-wall-${crypto.randomUUID()}`, roomId, start: { x: 0, y: depth }, end: { x: 0, y: 0 }, thickness: 150, height: 2700 },
  ];
}

function nextQaPosition(index: number, roomType?: string) {
  const columns = roomType === 'Living Room' ? 4 : 3;
  return {
    x: 700 + (index % columns) * 1000,
    y: 700 + Math.floor(index / columns) * 850,
  };
}
