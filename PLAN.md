# Namaste Design Studios — Custom Canvas POC Plan

## 1. Executive Summary
This project evaluates the feasibility of building a proprietary 2D/3D interior design canvas ("Namaste Studio OS") to replace expensive SaaS alternatives like Infurnia. The core objective is to validate a "Unified State, Dual Viewport" architecture where a single TypeScript data model (Zustand) drives both a 2D Konva-based floor plan editor and a 3D Three.js scene. The POC focuses strictly on the fundamental geometry lifecycle: drawing walls in 2D with snapping, automatic extrusion into 3D, and simultaneous multi-viewport switching. By the end of this POC, Namaste Studios will have a documented "go/no-go" signal on building a full-scale interior design engine.

## 2. Reference Projects Analysis

| Project | Stack | Strengths | Weaknesses |
| :--- | :--- | :--- | :--- |
| **pascalorg/editor** | R3F, WebGPU, Zustand | Cutting-edge performance, handles complex CSG operations via `three-bvh-csg`. | Highly technical/low-level, lacks a dedicated 2D floor plan layout engine. |
| **aalavandhaann/blueprint-js** | Three.js, ES6 | Modernized fork of Blueprint3D, clean separation of 2D and 3D logic. | No built-in React integration; maintenance is sporadic. |
| **furnishup/blueprint3d** | Legacy Three.js | The industry pioneer; excellent room detection and wall extrusion logic. | Extremely outdated codebase (jQuery-era style), hard to extend for modern SaaS. |
| **CodeHole7/3d-room-designer** | React, Three.js | Great implementation of furniture placement and basic wall logic. | Less focus on the "architectural" precision (snap-to-angle, dimensions). |
| **OpenPlan3D** | Three.js, React | Production-grade furniture handling; good export/import system. | Closed-source core for some features; high complexity. |
| **Infurnia / Snaptrude** | WebGL (Custom) | Highly specialized for BIM; handles parametric cabinetry and photorealistic lighting. | High cost; proprietary formats lock data into their ecosystem. |

## 3. Recommended Stack (The "Namaste Stack")

| Layer | Recommended Choice | Justification |
| :--- | :--- | :--- |
| **2D Drawing** | **Konva.js (react-konva)** | Best-in-class for 2D object manipulation, snapping, and label rendering. Handles complex hit-detection easily. |
| **3D Rendering** | **R3F (React Three Fiber) + Drei** | Standardizes Three.js for React. **Drei's "View" component** is essential for creating multiple views (Top/Front/3D) within a single canvas context efficiently. |
| **State Management** | **Zustand** | Minimal boilerplate, high performance. Essential for keeping 2D and 3D views perfectly synced in real-time. |
| **Undo/Redo** | **Zundo** | Middleware for Zustand that provides historical state tracking out of the box. |
| **Geometry Ops** | **three-bvh-csg** | Fastest library for "drilling" holes (doors/windows) into walls dynamically without lag. |
| **Desktop Wrapper** | **Tauri 2.0** | Smaller binaries and better security than Electron. Uses system WebViews, keeping the app lightweight. |
| **Units / Math** | **gl-matrix / custom mm** | High-precision floating point math using mm as the base unit to match Indian studio standards. |

## 4. POC Scope (The "Smallest Useful Canvas")

### In-Scope (Phase 1 Validation)
- [ ] **Grid & Snapping**: 2D canvas with millimeter-based grid; snap-to-grid and snap-to-90-degree constraints.
- [ ] **Wall Drafting**: Multi-segment line tool. Each segment is a "Wall" entity with a start and end point.
- [ ] **Live Dimensions**: Real-time length labels (overlaying lines) while drawing and on select.
- [ ] **Store-Driven Extrusion**: 3D scene that automatically reads the `walls` array and renders 3D boxes (meshes).
- [ ] **The "God View"**: Split-screen mode showing 2D (Left) and 3D (Right) synchronously.
- [ ] **Camera Presets**: Single-click buttons to switch 3D view between Orbit (Perspective), Top, and Front.

### Out-of-Scope (Next Version)
- ❌ Doors/Windows (the "hole" logic).
- ❌ Furniture catalog or library.
- ❌ Texture mapping / Material selection.
- ❌ Room labels or floor area calculation.
- ❌ Multi-story support.

## 5. Architecture & Data Schema

### Shared Data Model (Zustand Store)
```typescript
interface Point { x: number; y: number; }
interface Wall {
  id: string;
  start: Point;
  end: Point;
  thickness: number; // default 150mm
  height: number;    // default 2700mm
}
interface Store {
  walls: Wall[];
  selection: string | null;
  mode: '2D' | '3D' | 'SPLIT';
  addWall: (w: Wall) => void;
  // ... undo/redo provided by Zundo
}
```

### Data Flow Diagram
1. **User Action**: Clicks on 2D Konva Canvas to place a point.
2. **2D Editor Logic**: Calculates snapping -> Updates `draftWall` state.
3. **Commit**: On second click, `addWall` is called.
4. **Zustand Store**: Broadcasts new `walls` array to all subscribers.
5. **3D Generator**: React lifecycle triggers in `3DScene.tsx`. Maps over `walls` to create `<Box />` components.
6. **Multi-Viewport**: Three.js cameras (Perspective vs Orthographic) adjust based on the current active preset.

## 6. Proposed File Structure

```text
/src
├── /components
│   ├── /viewport-2d           # Konva-based 2D editor
│   │   ├── FloorPlan.tsx      # Main 2D Container
│   │   ├── Wall2D.tsx         # Individual wall segment
│   │   └── Grid.tsx           # Background snap-grid
│   ├── /viewport-3d           # R3F-based 3D scene
│   │   ├── Scene3D.tsx        # Main 3D Container
│   │   ├── Wall3D.tsx         # Extruded wall mesh
│   │   └── Cameras.tsx        # Presets (Top, Front, Perspective)
│   ├── /ui                    # Global UI
│   │   ├── Toolbar.tsx        # Tool selection (Wall, Select, Delete)
│   │   ├── ViewModeToggle.tsx # 2D/3D/Split switcher
│   │   └── Dimensions.tsx     # Overlay labels
├── /store                     # State Management
│   ├── useStore.ts            # Main Zustand store
│   └── sliceWalls.ts          # Wall-specific actions
├── /lib                       # Utilities
│   ├── math.ts                # Snapping and projection math
│   └── constants.ts           # Units, default dimensions (mm)
├── /hooks                     # Custom React Hooks
│   └── useKeyboard.ts         # Shortcuts (Undo/Redo/Delete)
├── App.tsx                    # Layout orchestrator
├── main.tsx                   # Entry point
└── index.css                  # Tailwind styles
```

## 7. Build Phases & Estimates
| Phase | Title | Goal | New Files | Effort |
| :--- | :--- | :--- | :--- | :--- |
| **0** | **Scaffolding** | Vite + TS + Konva + Three setup. | `main.tsx`, `App.tsx` | 2h |
| **1** | **2D Canvas** | Basic floor plan with pan/zoom. | `FloorPlan.tsx`, `Grid.tsx` | 8h |
| **2** | **Wall Tools** | Click-to-draw walls with 90-deg snapping. | `math.ts`, `Wall2D.tsx` | 10h |
| **3** | **Shared Store** | Sync walls between memory and UI. | `useStore.ts` | 4h |
| **4** | **3D Extrusion** | Instant 3D walls from 2D lines. | `Scene3D.tsx`, `Wall3D.tsx` | 8h |
| **5** | **Multi-View** | Cameras, top/front/side presets. | `Cameras.tsx`, `ViewModeToggle.tsx` | 6h |
| **6** | **Polish** | Undo/Redo, JSON Save/Load. | `useKeyboard.ts` | 6h |
| **Total** | | | | **~44h** |

## 7. Risks & Mitigation

| Risk | Description | Mitigation |
| :--- | :--- | :--- |
| **Coordinate Sync** | Konva (0,0 is top-left) vs Three.js (0,0 is center). | Define a unified "World Coordinate" system (centered) and use transform functions in the UI layer. |
| **Wall Junctions** | 3D boxes will overlap at corners, creating visual artifacts (z-fighting). | For the POC, allow overlap. For production, geometry needs Miter-Join calculation. |
| **Performance** | React re-renders of the 3D scene on every mouse move in 2D. | Use "Draft State" for local Konva drawing; only push to global Zustand store on mouse-up. |
| **Tauri WebGL** | Webkit (Mac) can be picky about WebGL contexts in iFrames. | Ensure canvas sizing uses `ResizeObserver` and explicit pixel ratios. |

## 8. Open Questions for Namaste Studio
1. **Wall Thickness**: Should it be globally fixed (e.g., all walls 150mm) for the POC, or per-wall?
2. **Coordinate Origin**: Should the "center" of the building be (0,0), or the first point drawn?
3. **Snap Sensitivity**: What is the preferred "gravity" for snapping (e.g., 20mm)?
4. **Desktop Wrapper**: Do we need to test Tauri *now*, or can we stay in the browser for the first two weeks?

---
*End of Plan. Prepared for Namaste Design Studios.*
