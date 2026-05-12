# Design OS — Speed-First Plan

> **Prepared for:** Namaste Design Studios — Anup Jha
> **Date:** 2026-05-12
> **Companion to:** `INFURNIA_KNOWLEDGE_DUMP.md`
> **Thesis:** Stop competing with Infurnia on admin breadth. Win on **speed of design** + **canvas quality** + **render quality**. Treat SKUs and pricing as a thin, minimal-viable layer for now.

---

## 0. The one sentence

**Make Design OS the tool where a designer can sit with a client, sketch a 3 BHK floor plan in 8 minutes, walk through it in 3D, and hand over a quotation by the end of the meeting — and have all of that feel like one continuous canvas, not three separate apps.**

Every priority below is in service of that sentence.

---

## 1. Priority stack (re-stated)

| Rank | Pillar | Status today | What "done" looks like |
|---|---|---|---|
| **P1** | **Speed of design** | Decent (click-drag walls, drop furniture) but a lot of micro-friction | 10× faster than Infurnia on the *common path*: drafting a room + dropping a kitchen + applying finishes. Measured: empty canvas → quotable kitchen in **≤ 8 min**. |
| **P2** | **2D canvas** | Konva-based, 619-LOC `FloorPlan.tsx`. Walls work; dimensions/snaps/multi-select/array tools missing | Drafts feel like Figma — fluid, predictable, snappy. Real-time dimensions everywhere. |
| **P2** | **3D canvas + viewport switching** | R3F-based, 335-LOC `Scene3D.tsx`. Working but viewport toggle is a fade, no shared cursor, no in-3D editing | Switch 2D↔3D in <50ms with **camera position preserved**. Edit any object in 3D (translate/rotate gizmo). |
| **P3** | **Render** | Working presentation mode with SSAO/Bloom/Vignette, room-type decor kit | World-class still images + 6-second client-share video, AI-staging, time-of-day slider, 1080p/4K export. |
| **P4** | **SKU/pricing** | Catalog with brand/variant/sku + per-room BOQ generator | Minimal viable: every SKU has a *unit price* (1:1:1 — base × multiplier × area). Sales-channel pricing, parametric cabinets, manufacturing rules = deferred to v3+. |

---

## 2. What makes the current Design OS slow (grounded in code)

This section is a code audit of the existing Design OS — what was found while reading `FloorPlan.tsx`, `Scene3D.tsx`, `math.ts`, and `App.tsx`. Every bullet maps to a fix in §3–§7.

### 2.1 Drafting walls is one-at-a-time
- `FloorPlan.tsx:264-339`: clicking the Wall tool, then click-drag-release places **one** wall and exits the draft state. The next wall requires a fresh click.
- **What's slow:** drafting a 4-wall room = 4 separate mouse-down/move/up cycles + 4 hand-pickups. Infurnia chains: each wall's *end* is the next wall's *start* until you press Escape.

### 2.2 No typed-length entry
- `math.ts:15-35`: `snapToAngle` constrains to 0/90/180/-90°, but the length comes from cursor distance only.
- **What's slow:** to draw a 3000mm wall, you eyeball the dimension overlay (`FloorPlan.tsx:582-590` shows live distance) and adjust. You can't type `3000` and commit.

### 2.3 Furniture drops one-by-one
- `FloorPlan.tsx:269-275`: dropping a base cabinet immediately flips `activeTool` back to `SELECT`. So placing 8 kitchen cabinets in a row = 8 tool selections + 8 clicks.
- **What's slow:** modular kitchens are 70% repeated cabinets. The 8 → 1 ratio (one tool selection, click 8 places) is a 4× speed-up.

### 2.4 No array/duplicate/distribute
- No "Array" or "Distribute" tool in `InfurniaRibbon.tsx` (and most of the Draw tab is `disabled: true`).
- **What's slow:** drawing 5 evenly-spaced cabinets along a wall = pure manual placement and eye-balling spacing.

### 2.5 Only one snap mode
- `math.ts:findClosestPoint` snaps to existing wall **endpoints** only.
- **What's missing:** midpoint snap (M), perpendicular snap (P), parallel-to-existing-wall snap, intersection snap, nearest-on-wall snap (already exists for openings, not for walls).
- **What's slow:** designers spend time nudging by 5mm because the snap missed the midpoint of an adjacent wall.

### 2.6 No "chain" or "continuous" drawing
- The wall tool is single-segment. Polyline isn't wired (`InfurniaRibbon.tsx:96` has `Poly..` marked `disabled: true`).
- **What's slow:** drafting an L-shaped kitchen wall = 2 walls drawn manually. Should be 1 chain that bends.

### 2.7 No multi-select, no group operations
- `FloorPlan.tsx`: `selection` is a single `{id, type}` object. No `selections: []`.
- **What's slow:** changing material on 6 cabinets = 6 click-and-apply operations instead of select-all → apply-once.

### 2.8 2D↔3D toggle has a 300ms fade
- `App.tsx:147,154`: opacity transition is `duration-300`.
- **What's slow:** for a designer who toggles 20×/minute during a client review, that's 6 seconds of waiting per minute of work. Should be instant (or < 50ms).

### 2.9 No camera sync between 2D and 3D
- Pan/zoom state lives separately: `FloorPlan.tsx:scale/offset` vs `Scene3D.tsx:sceneBounds/cameraPosition`.
- **What's slow:** you zoom into the kitchen corner in 2D, switch to 3D, and you're staring at the whole house. You then orbit/zoom back to the corner — extra work.

### 2.10 No in-3D editing
- `Scene3D.tsx`: objects are clickable for selection but there's no translate/rotate gizmo. To move a cabinet you must switch back to 2D.
- **What's slow:** every spatial edit needs a viewport round-trip.

### 2.11 No live dimensions on placed walls
- Live dimension shows only on the *draft* wall (`FloorPlan.tsx:582-590`). Placed walls have no permanent dimension labels.
- **What's slow:** when reviewing the plan you can't see "is this wall 3.2m or 3.4m?" without selecting it and looking at the property panel.

### 2.12 No keyboard shortcuts for tools
- `useKeyboard.ts` (69 LOC) and ribbon buttons. Hotkeys for Wall/Door/Window/Select are not wired.
- **What's slow:** every tool switch is a mouse trip up to the ribbon. Sketchup / Figma / AutoCAD all use 1-letter shortcuts (W / D / V).

### 2.13 No drag from catalog to canvas
- `CatalogSidebar.tsx`: click an item → switches into the FURNITURE tool → click canvas to place. Two clicks per item.
- **What's slow:** trained CAD users expect drag-and-drop.

### 2.14 Room area shows only when walls close
- `FloorPlan.tsx:202-213`: `roomPolygon` is computed only if the first wall's start ≈ last wall's end (within 30mm).
- **What's slow:** during drafting you don't see the area until the last wall closes. You can't say "the kitchen will be 12 sqm" until you finish drawing.

### 2.15 Properties Sidebar is a heavy 630-LOC blob
- `PropertiesSidebar.tsx` reads many store fields; every selection change re-renders it.
- **What's slow:** selecting a different object has a perceptible flicker on slower laptops.

### 2.16 Reference plan import is a 3-step modal flow
- `FloorPlanImportPanel.tsx` (242 LOC) requires: open panel → upload image → click 2 calibration points → enter mm distance → commit.
- **What's slow:** an experienced designer wants drag-and-drop from desktop + auto-OCR of dimension text or auto-scale-detection.

### 2.17 Doors/windows don't cut 3D walls yet
- `three-bvh-csg` is in `package.json` but `Wall3D.tsx` (171 LOC) doesn't drill the holes.
- **What's slow / wrong:** clients see a 3D wall with the door overlay floating on the surface — looks broken in screenshots.

### 2.18 No rotate handle in 2D
- `Furniture2D.tsx` (62 LOC): selecting furniture lets you drag (`onDragEnd`) but there's no rotate handle.
- **What's slow:** rotating a cabinet requires typing degrees in PropertiesSidebar.

### 2.19 No room auto-detection
- The only "room geometry" computed is the closed-polygon check above. Infurnia recognises *any* enclosed area as a room with name/area/usage.
- **What's slow:** for an apartment with 5 rooms you currently create 5 rooms in the store *and* hope your walls match. Auto-detection eliminates that.

### 2.20 Material drawer needs 3 clicks to apply
- `BottomMaterialDrawer.tsx` (332 LOC): pick category → pick material → click target. With the FINISH tool active.
- **What's slow:** Sketchup-style "paint bucket": select objects in 2D, then click a swatch — done in 2 clicks.

### 2.21 Dimensions on draft wall are at hard-coded font size 120
- `FloorPlan.tsx:587`: `fontSize={120}` — visible at small zoom but illegible / blocking at high zoom.
- **What's slow:** designers fight the dimension label.

### 2.22 No undo/redo visible UI feedback
- `useKeyboard.ts` is wired but there's no toast / status indication on undo.
- **What's slow:** a frustrated "did that undo happen?" mental check.

### 2.23 No project-wide search
- `Search` button in the ribbon is `disabled: true`.
- **What's slow:** to find a particular cabinet you scroll.

### 2.24 Inactive viewport keeps re-rendering
- `App.tsx:144-159`: in non-SPLIT mode, **both** `<FloorPlan />` and `<Scene3D />` are mounted; only opacity changes.
- **What's slow:** every store change triggers Konva *and* R3F renders, even when one viewport is invisible. Free perf is on the table.

### 2.25 Single-cabinet flow doesn't expose hardware/SKU
- `Furniture2D.tsx` paints a generic rectangle; `Furniture3D.tsx` paints a basic mesh. The cabinet's brand/sku/variant lives in the store but no inline label.
- **What's slow:** during a review the designer says "what cabinet is this?" — has to click and look in the panel.

---

## 3. The 12 speed wedges (ranked by ROI)

ROI is measured as *time saved per common-task workflow* ÷ *implementation effort*. Each wedge maps to a specific code change.

| # | Wedge | Effort | Time saved per kitchen | Files |
|---|---|---|---|---|
| **W1** | **Chained wall drafting** — after `addWall`, set `draftStart = wallEnd`. Esc / right-click breaks the chain. | ½ day | 30s → 5s per room | `FloorPlan.tsx` |
| **W2** | **Typed length entry** while drafting — show a numeric input next to the dimension overlay; Enter commits, Tab cycles to angle | 1 day | 15s per wall, ~60s per room | `FloorPlan.tsx`, new `DimensionInput.tsx` |
| **W3** | **Furniture sticky mode** — after `addFurniture`, **don't** flip back to SELECT. Esc exits the tool. | 30 min | drop 8 cabinets in 10s vs 60s | `FloorPlan.tsx:275` |
| **W4** | **Array tool** — select an item, hit `A`, drag to define spacing+count, commit | 1 day | 30s for a 6-cabinet row | new `arrayTool.ts` + `FloorPlan.tsx` |
| **W5** | **Keyboard tool shortcuts** — `V`=Select, `W`=Wall, `D`=Door, `N`=Window, `F`=Furniture, `M`=Material, `R`=Rotate, `Esc`=cancel | ½ day | 1-2s per tool switch ≈ 30s/min | `useKeyboard.ts` |
| **W6** | **Drag-from-catalog-to-canvas** — HTML5 drag handle on each catalog tile, drop position → furniture | 1 day | one fewer click per object | `CatalogSidebar.tsx`, `FloorPlan.tsx` |
| **W7** | **Multi-select + group ops** — `Shift+click` adds to selection, marquee box, group rotate/move/material | 1.5 days | finishing 6 cabinets in 1 op | `useStore.ts`, `FloorPlan.tsx`, `PropertiesSidebar.tsx` |
| **W8** | **Better snaps** — midpoint, perpendicular, parallel-to-wall, nearest-on-wall during wall drafting, intersection of two segment lines | 1.5 days | reduce nudge-by-5mm friction | `math.ts`, `FloorPlan.tsx` |
| **W9** | **Live dimensions on all walls** — auto-label every placed wall with its length; toggle from View ribbon | ½ day | no need to select to read | `Wall2D.tsx` |
| **W10** | **3D translate/rotate gizmo** — drei `<TransformControls>` on selection, modes T/R | 1 day | no more 2D↔3D round trips for spatial edits | `Scene3D.tsx`, `Wall3D.tsx`, `Furniture3D.tsx` |
| **W11** | **Instant 2D↔3D toggle with camera sync** — share a `cameraPose` in store; on toggle, project 2D viewbox → 3D TOP camera and vice versa; remove the 300ms fade | 1 day | 6s of fade-watching per min of work | `App.tsx`, `useStore.ts`, `FloorPlan.tsx`, `Scene3D.tsx` |
| **W12** | **Door/window CSG cutouts in 3D** — wire `three-bvh-csg` so openings are real holes | 1 day | not strictly "speed" but kills client-review questions | `Wall3D.tsx` |

**Total effort:** ~12 days for one engineer. **Expected speed gain on the common path (drafting → furnishing → quoting a kitchen):** 60-90 min → **6-12 min** (5-10× speed-up).

After these 12, every additional move is diminishing returns until the data-model upgrade (panels per cabinet) kicks in.

---

## 4. 2D canvas — concrete improvements

### 4.1 Wall tool, rewritten

Today's wall tool (paraphrased pseudo-code from `FloorPlan.tsx:264-339`):

```
mouseDown(WALL):  draftStart = snap(cursor)
mouseMove(WALL):  draftEnd   = snap(cursor) with angle-constraint
mouseUp(WALL):    if dist > 50: addWall(draftStart→draftEnd); exit drag
```

What it should be:

```
on tool=WALL & not drafting:
  next click sets draftStart = bestSnap(cursor)
  going forward: live segment ghost from draftStart to bestSnap(cursor)
on each subsequent click:
  commit a wall from draftStart to bestSnap(cursor)
  set draftStart = wallEnd       ← CHAIN
on Escape / right-click:
  break the chain, stay in WALL mode
on T or typed numeric:
  open DimensionInput with cursor distance prefilled,
  Enter commits to that length at the constrained angle
on Tab:
  toggle angle constraint: free / 90° / 45° / 5°
on Shift:
  hard 90° lock for current segment only
```

This is **W1 + W2 + part of W8** combined. ~1 day's work in `FloorPlan.tsx` and a new `WallDraftHud.tsx` component for the dimension/angle HUD.

### 4.2 Snap engine, rewritten

Today: `findClosestPoint` over wall endpoints only.

Proposed `math.ts` upgrade — a unified `snap(target, ctx)` that returns the best snap from a stack of candidates:

```ts
type SnapKind = 'endpoint' | 'midpoint' | 'perp' | 'parallel' | 'intersection' | 'on-wall' | 'grid' | 'free';
type SnapHit = { point: Point; kind: SnapKind; weight: number; sourceId?: string };

function snap(target: Point, walls: Wall[], opts: SnapOptions): SnapHit
```

Order of preference (lowest distance → highest weight):
1. Endpoint (existing) — within 200 mm screen → 100 mm world
2. Midpoint of any segment within 80 mm
3. Intersection of any two segments within 80 mm
4. Perpendicular drop from `target` onto any segment within 60 mm
5. Parallel-to-an-existing-wall, when drafting and the angle is within 3° of an existing wall
6. On-wall (`getClosestPointOnSegment`) when within 50 mm
7. Grid (50 mm)
8. Free (no snap)

The cyan-ring indicator (`FloorPlan.tsx:595-599`) already exists for endpoints — extend it with **colour-coded** indicators per kind (cyan = endpoint, green = midpoint, orange = perpendicular, etc.). Sketchup uses this pattern and designers learn it in minutes.

### 4.3 Dimensions everywhere

`Wall2D.tsx` (84 LOC) needs an optional `showDimension` prop. When the global `showDimensions` flag is on (already in store: `showDimensions: false` at `useStore.ts:183`), render a small `<Text>` along each wall at its midpoint, offset perpendicular by 200 mm, with the length in mm.

Auto-suppress at very high zoom (text > 40% of segment length).

### 4.4 Furniture drag from catalog

`CatalogSidebar.tsx` already has tile-per-item. Wrap each tile in a draggable that sets `dataTransfer.setData('application/x-design-os-catalog', item.id)`. In `FloorPlan.tsx`, on the Stage's underlying div, listen for `dragover` and `drop`:

```
onDrop(e):
  const catalogId = e.dataTransfer.getData('application/x-design-os-catalog')
  const worldPos = stageToWorld(stage, e.clientX, e.clientY)
  store.setSelectedCatalogItem(catalogId)
  store.addFurniture(getFurnitureDraft(worldPos))
```

Free win, ~1 day.

### 4.5 Rotation handle in 2D

`Furniture2D.tsx` currently shows a selection outline; add a small rotation handle (lollipop circle above the bounding box, like Figma):

```
on handle drag:
  angle = atan2(cursor.y - center.y, cursor.x - center.x)
  if Shift: snap to 15°
  if Ctrl/Cmd: snap to 5°
  updateFurniture(id, { rotation: degrees(angle) })
```

### 4.6 Multi-select

Add to store:
```ts
selections: Array<{id: string, type: ...}>     // empty array = nothing selected
addSelection / toggleSelection / clearSelection / setSelections
```

Keep the singular `selection` as a derived computed property for backwards compat with the 630-LOC PropertiesSidebar.

Marquee box: when `activeTool === 'SELECT'` and mouseDown on empty space, start a rubber band. On mouseUp, intersect with all entities and `setSelections(hits)`.

PropertiesSidebar gets a *"common properties"* mode when `selections.length > 1` (only show fields shared by all selected types).

### 4.7 Room area shown while drafting

`FloorPlan.tsx:roomPolygon` already computes area but only when closed. Compute *open-polygon* area too — show as faint label inside the partial polygon while drafting ("≈ 8.4 sqm so far"). Updates with every mouseMove on the draft wall.

### 4.8 Draft dimension label — size-relative

Replace `fontSize={120}` with a function of `scale`:

```ts
const labelFontSize = Math.max(60, Math.min(200, 120 / scale * 0.5));
```

So at high zoom the label shrinks; at low zoom it stays readable.

---

## 5. 3D canvas + viewport switching

### 5.1 Single shared world, two cameras

Today `FloorPlan` and `Scene3D` are completely independent React subtrees. `App.tsx` mounts both at once. They share data via the store but not view state.

Proposal: introduce **`viewState`** in the store:
```ts
viewState: {
  worldCenter: { x: 0, y: 0, z: 0 };   // shared
  zoom: 1;                              // shared
  active: '2D' | '3D' | 'SPLIT';        // current viewport
  perspective: {                        // 3D-specific
    azimuth: 45, elevation: 30, distance: 12000
  };
  ortho: {                              // 2D-specific
    rotation: 0                          // for rotated floorplan views
  };
}
```

On 2D pan/zoom → write to `viewState.worldCenter` and `viewState.zoom`. Scene3D reads these on viewport change and re-positions its camera so the same physical point is centred.

### 5.2 Toggle is instant (no fade)

`App.tsx:144-159`: replace opacity-300 fade with `display: none`. Both viewports stay mounted but only the active one is in the layout.

For inactive viewports, gate their render hot-paths:
- `FloorPlan.tsx`: wrap with `useFrame(() => stage.batchDraw())` — only when `viewState.active !== '3D'`.
- `Scene3D.tsx`: pass `frameloop="demand"` to `<Canvas>` when inactive, and `frameloop="always"` when active. R3F supports this.

### 5.3 In-3D editing — gizmo

`Scene3D.tsx`: add `<TransformControls>` from drei attached to the selected mesh:

```tsx
{selection && !presentationMode && (
  <TransformControls
    object={selectedRef.current}
    mode={gizmoMode}                // 'translate' | 'rotate' | 'scale'
    space="world"
    translationSnap={50}              // 5cm snap
    rotationSnap={Math.PI / 12}       // 15°
    onObjectChange={(e) => {
      if (selection.type === 'furniture') {
        const obj = selectedRef.current
        updateFurniture(selection.id, {
          position: { x: obj.position.x, y: -obj.position.z },
          rotation: THREE.MathUtils.radToDeg(obj.rotation.y),
        })
      }
    }}
  />
)}
```

Bind keyboard: `G` = grab (translate), `R` = rotate, `S` = scale. Blender / Sketchup-style.

### 5.4 Tab to toggle 2D↔3D

`useKeyboard.ts`: add `Tab` (with preventDefault) to cycle `2D → 3D → SPLIT → 2D`. Optional: `Q` to quick-flash to the other viewport while held.

### 5.5 TOP camera = use the 2D Konva canvas

`Scene3D.tsx` has a TOP camera preset with `OrthographicCamera`. This is *almost* the 2D view — but it's still WebGL rendering of THREE meshes, slower than Konva at 2D.

Proposal: when user picks TOP camera, transparently swap to the 2D Konva canvas under the hood. The user sees no difference; we save Three's geometry pipeline. (Tracked as a P2 micro-optimisation — not required for v1.)

### 5.6 Sub-canvas reuse

For SPLIT mode the same Konva stage and R3F canvas are rendered as before. No change needed; perf is fine because each viewport gets half the canvas area.

### 5.7 Camera presets get **named slots**

Today: 5 presets (FREE / TOP / FRONT / SIDE / ISLAND_FRONT) hard-coded.

Proposal: a `savedViews: SavedView[]` array in the store. Designers can "Save current view" → adds to the bottom strip. On click, the camera animates (Three.js Tween) to that pose in 400ms. Matches Infurnia's bottom-strip pattern.

```ts
interface SavedView {
  id: string;
  name: string;
  thumbnailDataUrl?: string;
  camera: { position: [n,n,n]; target: [n,n,n]; fov: number; ortho?: boolean };
  createdAt: string;
}
```

---

## 6. Render — world-class

The current presentation mode (`Scene3D.tsx:196-216` + `RenderRoomKit.tsx` + `RenderToolbar.tsx`) is already credible: Environment preset, ContactShadows, SSAO, Bloom, Vignette, decor kit per room type. What's missing is the *finishing kit* that turns "OK" into "share-this-to-Instagram".

### 6.1 Time-of-day slider

Add an `Ex. Light` (Exterior Light) panel matching Infurnia's `View > Ex. Light`:

```ts
sunPosition: {
  azimuth: 0..360,
  elevation: 0..90,
  intensity: 0..2,
  warmth: 0..1
}
```

Convert to a `<directionalLight>` position + colour. Use a calibrated colour temperature curve:
- Morning (low elevation, low azimuth east) → warm `#ffd9a8`
- Noon → neutral `#ffffff`
- Evening → warm `#ffb487`
- Night → cool `#a3bcff`

Drei has a `<Sky>` component — drop it in when in presentation mode for the outdoor scene.

### 6.2 HDRI presets

Drei's `<Environment preset>` already supports `apartment / city / dawn / lobby / night / park / studio / sunset / warehouse / forest`. Expose this as a chip selector in the RenderToolbar:

```
[Apartment] [City] [Dawn] [Studio] [Sunset] [Custom HDRI…]
```

### 6.3 Resolution presets

`RenderToolbar.tsx`: add resolution chips:

```
1080p · 1440p · 2K · 4K · Custom
```

`captureRender` in `Scene3D.tsx:135` already grabs the canvas. To capture at a target resolution:

```ts
async function captureRender(resolution: 'preview' | '1080p' | '4K') {
  const { gl, scene, camera } = useThree.getState()
  const size = { '1080p': [1920, 1080], '4K': [3840, 2160], preview: [width, height] }[resolution]
  const rt = new THREE.WebGLRenderTarget(size[0], size[1], { samples: 4 })
  gl.setRenderTarget(rt)
  gl.render(scene, camera)
  // read pixels, build PNG via OffscreenCanvas
  ...
}
```

4K renders may take 2-5 seconds on a decent laptop. Acceptable.

### 6.4 6-second client-share video

Rather than promising photoreal-quality video, make a *6-second orbit reel* that's irresistible to share on WhatsApp:

```
useEffect:
  const tween = new Tween(camera.position)
  .to(targetPos, 6000)
  .onUpdate(() => gl.render(scene, camera))
  // capture every frame to a MediaRecorder
```

Output: `room-name-flythrough.mp4`. Designer hits "Make Flythrough" → 6 seconds of render → MP4 in Downloads. Massive client-share value.

### 6.5 AI staging (Gemini / Claude vision)

`@google/genai` is already a dependency. Drop a "Stage like…" button. User pastes an inspiration image (Pinterest, mood board). Pipeline:

1. Run `gemini-2.0-flash` with the image + a "describe the style" prompt → get a JSON: `{ palette: ['#…'], wood: 'oak', counter: 'marble', mood: 'minimal' }`.
2. Match palette to existing materials in `data/catalog.ts`.
3. Generate a `proposedDiff` of `updateFurniture` / `updateWall` calls that change finishes accordingly.
4. Show a side-by-side: before / after, with Accept / Reject buttons.

This is **AI staging in the canvas**, not a separate workflow. ~3 days of work.

### 6.6 Render gallery

`OutputsCenter.tsx` already has the skeleton (129 LOC). Add a `renders: Array<RenderOutput>` to the store, persist to IndexedDB. Each render row: thumbnail, timestamp, room, view, resolution, "Send to client" (copies to clipboard / opens share sheet).

### 6.7 Photoreal-when-ready cloud render

Optional add-on: send the scene to a backend (Blender Cycles / V-Ray / Cycles-WebGL) for an actual photoreal render. Returns in ~30s. Mark in UI as "Cloud Render — 1 credit". Defer to v2; the on-canvas WebGL render is already enough for client review.

---

## 7. Admin / SKU / pricing — *minimal viable*

You asked for "very simple SKUs as of now (1 1 1, everything)". Here's what that means concretely.

### 7.1 Today's catalog shape (from `data/catalog.ts`)

Each item has: id, name, group, type, brand, sku, variants[] (each with W × D × H + price + unit), hasHandle, skirting, roomTypes, etc. ~20 furniture types, 5+ variants each.

### 7.2 Proposed minimum-viable admin

Don't build an admin app. Instead:

1. **One JSON file** (`data/catalog.ts` already exists) plus a `data/materials.ts` (already exists as part of catalog).
2. **One in-app admin modal** — `CatalogAdminModal.tsx` (515 LOC, already there) — let users **add** custom items but ship with 50 hand-curated SKUs covering: base cabinet, wall cabinet, tall cabinet, drawer unit, sink unit, bed (3 sizes), wardrobe (3 sizes), sofa (2 sizes), dining table (2 sizes), desk, office chair, TV unit, bookshelf, dresser, nightstand, vanity.
3. **Pricing model = "1:1:1"**:
   - Every catalog item has *one* unit price.
   - BOQ multiplies `unit price × quantity × (optional finish multiplier)`.
   - No sales channels. No margin tiers. No per-region pricing.
   - For walls: `running_meter × labour_rate` where `labour_rate` is a single global value editable in Settings.
   - For finishes: `area_sqft × material.rate`.

This is what `lib/pricing.ts:generateBOQByRoom` already does. **You're 90% there.** The remaining work is:

- **Sensible default rates** seeded with real Mumbai/Pune numbers (one consultation call with a senior designer).
- **GST / tax line** at the bottom of the BOQ (18% standard, configurable).
- **Discount line** (₹ or %).
- **Final printable PDF** with studio letterhead.

### 7.3 The data schema you should commit to *now* (even if features come later)

Don't paint yourself into a corner. Set up the *shape* so v2 can layer in sales channels and panels without a migration:

```ts
// In data/catalog.ts — extend, don't rewrite
interface CatalogItem {
  id, name, group, type, brand, sku, roomTypes, ...   // existing

  // v1 fields (use these now)
  variants: Variant[]                                  // existing
  defaultVariantId: string                             // existing

  // v2 forward-compat — leave empty / undefined for now
  panels?: PanelDef[]                                  // ← reserved for cabinet→panel split (§9 of dump)
  pricingMode?: 'unit' | 'panel-sum' | 'custom'       // ← default 'unit'
  salesChannelOverrides?: Record<string, number>      // ← reserved
  rules?: { manufacturing?: string[], hardware?: string[] }  // ← reserved
}
```

Reserving these now means **the first time we add panels, we don't have to migrate snapshots in `useStore.ts:migrateSnapshot`**. We extend.

### 7.4 What to *not* build now

- Sales channels (defer to when ≥ 1 multi-region customer asks)
- Manufacturing rules (defer)
- Hardware rules (defer)
- Design intelligence engine (defer)
- Org/BU/role system (defer; until then it's single-user local-storage)
- Production design app (defer)
- MES (don't ever build — partner with a CNC vendor when needed)

Total deferred work that we're explicitly *not* doing in v2: probably 18 months of engineering. That's the point — staying small and fast on the design surface wins.

---

## 8. Sprint plan — 4 weeks, one engineer

Following the 12 wedges + 2D + 3D + render improvements above. Each row is roughly a day.

### Week 1 — Speed wedges, part I (drafting + furniture flow)

| Day | Deliverable | Verifies |
|---|---|---|
| 1 | **W1** chained wall drafting + Escape exits chain | Draw an L-shape with 3 walls in one chain |
| 2 | **W2** typed length entry HUD + Tab cycles angle constraints (free / 90° / 45°) | Type `3000` to make a 3-m wall |
| 3 | **W3** sticky furniture mode + Esc exits | Drop 8 base cabinets in one tool session |
| 4 | **W5** keyboard shortcuts (V/W/D/N/F/M/R/Esc) + on-screen hint overlay | Every tool reachable without a mouse trip |
| 5 | **W9** live dimensions on all walls + toggle | Toggle dimensions on/off from View ribbon |

### Week 2 — Speed wedges, part II (snaps + selection)

| Day | Deliverable | Verifies |
|---|---|---|
| 6 | **W8** unified snap engine — midpoint, perp, parallel, intersection | Place a wall that snaps to the midpoint of another |
| 7 | **W7a** multi-select store changes (`selections: []`) + marquee box | Lasso 5 cabinets at once |
| 8 | **W7b** group operations in PropertiesSidebar (common props edit) | Change finish on 5 cabinets in one action |
| 9 | **W6** drag-from-catalog-to-canvas | Drag a base cabinet from sidebar to floor, ghost preview follows cursor |
| 10 | **W4** array tool (`A` + drag count/spacing) | Place a row of 6 cabinets in 5 seconds |

### Week 3 — 3D + viewport switching

| Day | Deliverable | Verifies |
|---|---|---|
| 11 | **W11** instant 2D↔3D toggle (no fade) + Tab to toggle | Switching feels like Cmd-Tab |
| 12 | **W11b** camera sync — pan in 2D, see same point in 3D and vice versa | Zoom into kitchen corner in 2D, hit Tab → 3D camera centres there |
| 13 | **W10** translate/rotate gizmo in 3D + G/R hotkeys | Move a cabinet in 3D without going back to 2D |
| 14 | **W12** door/window CSG cutouts wired in 3D | Client review shows real holes, not floating overlays |
| 15 | **In-3D** rotate handle in 2D + 5°/15°/45° snap | Rotate a cabinet by 15° with one drag |

### Week 4 — Render polish + room auto-detect + admin smoothing

| Day | Deliverable | Verifies |
|---|---|---|
| 16 | Render time-of-day slider + HDRI chip selector | Compare morning / sunset render in 2 clicks |
| 17 | Render resolution presets (1080p / 4K) + save to gallery | Export 4K still |
| 18 | 6-second flythrough video export | Send a 6s MP4 to WhatsApp |
| 19 | Room auto-detect from wall topology — name + area overlaid | Drafted apartment shows 5 named rooms with areas |
| 20 | BOQ → PDF with studio letterhead + GST + discount lines | Hand a client a printable quote |

**End of week 4 state:** the common path (empty canvas → 3-room apartment → kitchen filled → finishes applied → render → quotation PDF) takes **8-12 minutes** instead of the current 45-60 minutes.

---

## 9. What "design 10× faster" actually means — measurable targets

Pick 5 KPIs. Measure them now (baseline). Re-measure after each sprint week.

| KPI | Today | After Week 1 | After Week 2 | After Week 4 |
|---|---|---|---|---|
| Time to draft a 4-wall, 3×4m room | ~60 s | ~25 s | ~15 s | ~10 s |
| Time to drop a 6-cabinet kitchen row | ~75 s | ~30 s | ~12 s | ~8 s |
| Time to switch 2D↔3D and orient camera on same object | ~5 s | ~5 s | ~5 s | <500 ms |
| Time to generate a client-ready render | ~30 s + manual download | ~30 s | ~30 s | ~30 s + auto-saved gallery |
| Time from empty canvas → printable BOQ for a kitchen | ~45 min | ~30 min | ~18 min | **~10 min** |

A weekly Tuesday demo where Anup *himself* drafts a room is the cheapest measurement.

---

## 10. What's "manual today" that you mentioned — explicit list

Based on a read of the code, these are the top "must be manual today" items in Design OS:

| # | Manual today | Should be | Fix |
|---|---|---|---|
| 1 | Tool selection — every switch is a mouse trip to the ribbon | Keyboard shortcut | **W5** |
| 2 | Wall drafting — one wall per click-drag-release | Chained drafting | **W1** |
| 3 | Wall length — eyeballed from a faint dimension overlay | Type and Enter | **W2** |
| 4 | Furniture placement — one drop, then tool resets | Sticky mode | **W3** |
| 5 | Adding 6 cabinets — click 6 times | Array tool | **W4** |
| 6 | Adding furniture — pick from sidebar then click canvas | Drag-and-drop | **W6** |
| 7 | Multi-object material change — apply 6 times | Multi-select + bulk apply | **W7** |
| 8 | Rotating furniture — type degrees in property panel | Lollipop handle in 2D, gizmo in 3D | §4.5, **W10** |
| 9 | Moving an object in 3D — switch to 2D, drag, switch back | TransformControls gizmo in 3D | **W10** |
| 10 | Reading wall dimensions — select wall first | Always-on dimension labels | **W9** |
| 11 | Toggling 2D↔3D — click button + wait 300ms | Tab key, instant | **W11** |
| 12 | Calibrating a reference plan — open modal, click 2 points, type mm | Drag-and-drop image + auto-detect dimension text via OCR | §11 below |
| 13 | Adding a new room to a project — open modal, fill fields | Click `+ Add Room` chip near breadcrumb | UI tweak |
| 14 | Closing a room — must end last wall on first wall's endpoint within 30mm | Auto-close prompt: "Close this room?" if last point is within 200mm | **Room auto-detect** |
| 15 | Changing default wall thickness — edit each wall | Global default + per-wall override | `Settings` tab + property panel |
| 16 | Switching project units — buried | Top-bar pill that toggles mm/in/ft-in | Tiny UI add |
| 17 | Save status — auto-saves silently | Tiny "Saved 2s ago" pill in top bar | UI tweak |
| 18 | Undo/redo — keyboard works, no toast | Brief toast on undo | UI tweak |

---

## 11. Parking lot — things to look at later but not now

- **OCR-based reference plan calibration** — image text recognition (Gemini Vision) on uploaded floor plan PDFs to auto-detect "3000mm" labels and scale the image accordingly. Removes the 2-point calibration step entirely. Probably ½ day with `@google/genai`. After Week 4.
- **Vector-based reference plan import** — let users drop a DWG/DXF and parse the lines into walls automatically. Big undertaking, partner with a DXF library.
- **Section / elevation views** — orthographic camera with a slicing plane, exported as a 2D drawing. ~3 days.
- **Snap to imported reference plan lines** — when a background plan is calibrated, snap wall draft to its underlying pixel-edge-detected lines. ML-flavoured but doable with OpenCV.js. 1-2 weeks.
- **Auto-furnish** — given a room's footprint + room type, AI proposes a furniture layout. Build on the AI staging primitive in §6.5.
- **AI assistant chat panel** — "Make this kitchen feel more minimal" / "What's the BOQ total in Hindi?" — uses Gemini, lives in a panel. ~1 week including UX.
- **Mobile read-only view** — public URL per project, opens on phone, taps to orbit. ~1 week.
- **AR Quick Look** (.usdz / SceneViewer) — single export step from R3F. ~2 days.
- **Tauri desktop bundle** — already in the LAUNCH.md roadmap.
- **Cloud render queue** — defer until on-canvas WebGL render isn't enough.
- **Multi-user real-time collaboration (Yjs)** — defer until the second designer joins the studio.

---

## 12. Risks and decisions to make now

| # | Question | Suggested call |
|---|---|---|
| 1 | Are we OK breaking the visual fade in viewport toggle for instant feel? | Yes — power users want fast over pretty |
| 2 | Tab to toggle viewport conflicts with form-input Tab navigation. OK? | Yes, with a fallback: only triggers when canvas has focus |
| 3 | If we add panels to the data model (v2), the existing 50-step undo history breaks once. OK? | Yes — show a one-time "v1 → v2 migration applied" toast |
| 4 | Do we keep `InfurniaRibbon.tsx` as a filename? | Rename to `DesignRibbon.tsx` before any external demo |
| 5 | Do we let multi-select cross room boundaries? | No — selection always scoped to current room |
| 6 | Should the array tool support diagonal arrays (not just along an axis)? | Not in v1 |
| 7 | Render gallery — local-only or sync to cloud? | Local IndexedDB for now |
| 8 | 4K render takes 2-5 seconds — block UI or background? | Background with a small progress chip in the top bar |
| 9 | Should we ship a desktop (Tauri) build first, or browser? | Browser first (zero-install for demos). Tauri after Week 4 success. |
| 10 | One catalog or multiple per-room catalogs? | One global catalog, filtered by `roomTypes` (already supported in data shape) |

---

## 13. The one screen we should ship that wins on its own

If we had to pick *one* feature that would convince every Indian studio designer to switch, it would be this:

> **"Type-to-design"** — point your cursor at the canvas, start typing: *"4×3 kitchen with sink under window"*. Hit Enter. The walls appear. The sink unit drops. The window is placed. Press Tab to enter 3D.

It uses every wedge above:
- Chain drafting (W1) — walls appear as a chain
- Typed length (W2) — "4×3" becomes 4000 × 3000
- Sticky furniture (W3) — sink unit drops without a tool selection
- Drag-from-catalog (W6) — handled by the AI
- AI staging (§6.5) — but for layout, not finishes
- Instant viewport toggle (W11) — Tab to 3D
- Camera sync (§5.1) — 3D opens centred on the kitchen

That's the demo Anup gives to the next 10 prospective studios. **Build the wedges first, ship the AI prompt-bar last** — week 4 or 5 — and that one demo carries the whole sales pitch.

---

*End of speed-first plan. Read alongside `INFURNIA_KNOWLEDGE_DUMP.md` for the comparative context. The numbered wedges (W1–W12) can each be cut as a single PR; the file paths in §3 are the exact entry points.*