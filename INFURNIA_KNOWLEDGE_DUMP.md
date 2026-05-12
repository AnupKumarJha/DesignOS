# Infurnia → Design OS — Knowledge Dump, Gap Analysis & World-Class Roadmap

> **Prepared for:** Namaste Design Studios — Anup Jha
> **Date:** 2026-05-12
> **Status:** Second pass — includes a live, authenticated walkthrough of design.infurnia.com + admin.infurnia.com as user Rishu @ Namaste Demo org.
> **Sources used:**
> - **Live, authenticated walkthrough** of design.infurnia.com (Design1 in Project1) and admin.infurnia.com — Rishu's account — every ribbon tab + ribbon dropdowns + object Properties + Version History + breadcrumbs + admin sidebar
> - 51 reference screenshots from a recorded Sandeep-Gupta walkthrough (`/infurnia-image-referneces/`)
> - Live Design OS at `localhost:3000` + full source code under `src/`
> - `PLAN.md` (POC plan), `LAUNCH.md` (v1 launch post)
> - Public Infurnia marketing surface (infurnia.com)
> **Source still incomplete:** production.infurnia.com canvas internals, mes.infurnia.com factory floor screens, and a few admin areas that returned "Access denied — Rishu lacks the role" (Brands, Catalogue → Furniture detail). Sandeep's recording covers most of those.

---

## 0. TL;DR

**Infurnia is not one app. It is two tightly-coupled apps wearing one brand:**

1. **`design.infurnia.com`** — the designer canvas. 2D plan + 3D model + render + outputs. This is what most people *think* Infurnia is.
2. **`admin.infurnia.com`** — the back-office. Project Hub, Catalogue, Brands, Design Intelligence, Tags, Sales Channels, Billing, User Management. This is what makes Infurnia *valuable to factories, modular kitchen chains, and franchises* — and it is the entire reason a studio cannot easily leave the platform.

**Design OS today is a credible v1 of #1.** The canvas, ribbon, multi-room store, BOQ generator, render mode, project hub, and the `InfurniaRibbon` even share Infurnia's information architecture. Source-code count: ~9,200 lines across a clean Konva + R3F + Zustand stack.

**The leverage is in #2.** Anyone can ship a 2D/3D canvas in a quarter. Almost nobody ships the *back-office* — the SKU/variant catalog with sales-channel pricing, the BOQ → production handoff, the franchise org model. That is Infurnia's moat. It is also Design OS's biggest opportunity to leapfrog.

**The world-class play is to compress Infurnia's two apps into one AI-native canvas where the catalog, pricing, and production handoff happen *inside* the design surface — not in a separate admin URL the designer never sees.**

---

## 1. What Infurnia actually is

### 1.1 Positioning

> *"Modern Architecture & Interior Design Software — Transform your architecture and interior design process with a platform that connects your entire workflow. From 2D layouts to 3D models and high-quality renders, through to modular furniture manufacturing — create, collaborate, and deliver seamlessly."*
> — infurnia.com hero
> *(Reference: `Screenshot 2026-05-04 at 7.38.14 PM.png`)*

Trust banner names visible on the homepage: **Almakitchens, Ozone, Interio Square, Sodex, Wooden Street** — these are *Indian modular kitchen and furniture chains*, not studios. That tells you who Infurnia really sells to.

### 1.2 The two-app architecture (this is the important part)

| Surface | Domain | For | What it does |
|---|---|---|---|
| **Design** | `design.infurnia.com` | Designers (employees of an org) | Draw / model / render / quote a single project |
| **Admin** | `admin.infurnia.com` | Org admins, catalog managers, production planners, billing owners | Manage the *organisation*: catalog, brands, tags, sales channels, pricing rules, billing, users |
| **Marketing** | `infurnia.com` | Lead capture | Book a demo, attribution tracking, content marketing |

A designer logs into design.infurnia.com. Behind the scenes, every cabinet they drop is *referencing* an SKU configured in admin.infurnia.com by the catalog manager. When the designer hits "Output → BOQ", the price comes from admin's pricing rules. **This separation is the moat.** Designers can't *not* use the catalog; the catalog can't *not* surface in the design. The two halves co-sell each other.

---

## 2. Infurnia Feature Taxonomy

The taxonomy below is built from the 51 reference screenshots plus the menu / ribbon labels visible in those captures. Each leaf is annotated with confidence:

- ✅ — directly seen in screenshots
- 🟡 — visible label, full UX not yet captured
- ❓ — inferred from category presence

### 2.1 Designer canvas (`design.infurnia.com`)

#### 2.1.1 Project / file management
- ✅ Project home with **Recent Projects** cards (preview thumbnails + client name + age, e.g. "Vision Design", "Milan Traders", "Bhavik Org"). *(Ref: 7.46.32 PM)*
- ✅ **New Project** dialog: Project Name (required), Client Name, Client Details, Project ID. *(Ref: 7.46.32 PM)*
- ✅ Sidebar tabs: **New Project / Recently Accessed / All Projects / Deleted Items / Production Designs**. *(Ref: 7.46.32 PM)*
- ✅ "Production Designs" is a first-class concept — a project goes from *Design* → *Production*. Design OS already mirrors this with the `ProjectStatus` enum (`Design Phase / In Review / In Production / Completed`).
- ✅ **Template Selection** modal: tabs *All Templates / Org Templates / Default Templates*, searchable, tiles for Kitchen / Bedroom / Living Room / Bathroom / Office / Villa / Blank. *(Ref: 7.48.03 PM)*
- 🟡 Share / collaboration (icon visible in top-right of canvas).
- 🟡 "MES" tab in top nav — probably *Manufacturing Execution System* link.

#### 2.1.2 Top chrome (canvas)
- ✅ Branding: **`infurnia` Design** (left logo) — `Design` label is contextual ("Design" mode vs "Production Design" mode).
- ✅ Breadcrumb: `Design ▾  /  Design3 ▾  /  Building 1 ▾  /  Second Floor ▾  /  Select Mass`. *Multi-building, multi-floor scoping.*
- ✅ Threshold / connection state badge ("Threshold | 0:30") — likely a sync-time indicator.
- ✅ Share, Settings, User-avatar.

#### 2.1.3 Ribbon tabs (top of canvas)
Visible in design canvas screenshots: **Home / View / Insert / Architecture / Annotate / Render / Outputs**.
*(Design OS has 8: adds **Draw** which Infurnia probably folds into Architecture.)*

| Tab | Likely tool groups (visible / inferred) |
|---|---|
| Home | Preferences · Undo / Redo · Select · core picks |
| View | 2D / 3D / Split · Floorplan toggle · viewports · camera presets |
| Insert | Furniture · Doors · Windows · Decor · imported assets |
| Architecture | Wall · Door · Window · Ceiling · Floor · Slab · Stair · Roof · Mass |
| Annotate | Dimension · Measure · Text · Tag · Section line · Elevation marker |
| Render | Realistic · Lighting · Materials · Camera preset · Quality · Output size |
| Outputs | Presentation · BOQ · Floor plan PDF · Elevations · Renders · Production drawings |

#### 2.1.4 Left rail — Viewport Navigation panel
*(Ref: 7.49.58 PM, 7.51.08 PM, 7.51.57 PM)*

- ✅ **What's new** link.
- ✅ **Input mode** toggle: *Pan / Select / Middle Mouse* — explicit input-mode chooser.
- ✅ **Zoom Options** with explicit shortcuts: Manual (mouse scroll) · To Selection (`Shift + X`) · To Fit All (`Shift + Z`).
- ✅ **Move Selected Object** by 1 mm or 10 mm — arrow-key nudge with two precisions.
- ✅ **Move Camera** + **Rotate Camera** — discrete buttons.
- ✅ **Global Preferences & Settings** footer block: Project Units (mm), Selection (None), Shortcuts (`F · Esc · Arrows`).

This left panel is the **ergonomics layer** — it surfaces precision affordances Design OS still relegates to keyboard-only memory.

#### 2.1.5 Catalog left flyout (when a tool needs an object)
- ✅ Three category icon tabs: **ARC** (Architecture) / **FURN** (Furniture) / **FIN** (Finishes). Design OS already mirrors these exact three.
- ✅ Search bar above the rail (Design OS has the same).
- ✅ Filter chip (probably brand / type / dimension).
- ✅ Visible architecture items (admin-defined): Wall · Door · Window. The admin-side catalog adds many more: Ceiling, Floor, Stair, Slab, Roof.

#### 2.1.6 Right rail — Properties / Inspector
- 🟡 **[GAP]** — not directly visible in the 51 screenshots, but Design OS has a 630-line `PropertiesSidebar.tsx` mirror.
- Inferred fields per object type:
  - **Wall**: thickness, height, finish material, skirting, cornice.
  - **Furniture**: dimensions, variant, brand, SKU, finish per face, hardware, handle, mounting height.
  - **Opening**: width, height, sill height, type, hardware.

#### 2.1.7 Bottom strip — render previews & elevations
*(Ref: 7.49.58 PM, 7.51.08 PM)*

- ✅ Persistent strip across the bottom: **Free View · Front Render View · Side Render View · Front Elevation · Side Elevation · Island Front Elevation**.
- These are *named camera presets per project* — the designer can scroll across them to "browse the room's faces" without manually orbiting.
- Design OS has matching presets in source: `RenderCameraPreset = 'Wide Interior' | 'Eye Level' | 'Corner View' | 'Ceiling View' | 'Furniture Focus'`.

#### 2.1.8 Viewport gizmo (3D)
- ✅ Bottom-right 3D-cube gizmo with `FRONT` face label — click-a-face to snap camera.
- ✅ World-axes triad (R/G/B) anchored to scene origin.
- ✅ "Live Client Connected" status pill bottom-left (cloud-sync state).

#### 2.1.9 Modeling & Drafting
- ✅ Walls (multi-segment), explicit thickness/height. *(Ref: 7.49.58 PM)*
- ✅ Doors, Windows (visible as wall openings in 3D).
- ✅ Multi-room: room-2 / room-A breadcrumb token (`Building 1 / Second Floor / Room 2`). Multi-room **and multi-floor and multi-building**.
- 🟡 Ceiling, Floor, Slab, Stair, Roof (admin-side catalog implies these are first-class).
- 🟡 Mass tool ("Select Mass" breadcrumb token) — block-out massing for an early massing pass before precise walls.
- 🟡 Sections / Elevations cut planes.
- 🟡 Dimension / Annotation tools (in Annotate ribbon).

#### 2.1.10 Furniture, parametric cabinets, and modular kitchens
- ✅ Cabinet system is *deeply parametric* — visible at admin.infurnia.com (see 2.2.2). Carcass / Top Panel / Left Panel / Carcass Depth / Custom Notes / Linked Profile / Manipulation Markers / Build Edit Side Structure / Pattern for Cutoff — fields visible in the cabinet edit panel. *(Ref: 7.59.55 PM)*
- ✅ Inline mini-video tutorials embedded in the right-side property panel (a "Watch how to set this property" video pops while you edit). *(Ref: 7.59.55 PM)*
- ✅ Cabinet types tracked: **Base, Wall, Tall, Mid-Tall, Loft, Corner, Drawer, Open, Pullout, Sink, Appliance, Shutter+Drawer, Cylinder, Breakfast Table, Modular Table, Special, Old Wood Curves, Back Panel Wall Cl.**
- ✅ Each cabinet maps to multiple variants (size W × D × H), and pricing is *constituent-aware* — the SKU price can be (a) "completely-built unit price" or (b) "priced as sum of all constituent elements". *(Ref: 7.43.07 PM)*

#### 2.1.11 Materials / Finishes
- ✅ Bottom-docked **Material Drawer** is visible. *(Ref: 7.52.40 PM)*
  - Tab strip across the top: **Solid Paints · Texture Paint · Wallpaper · Glass** (and more — strip is wider).
  - Right-side panel filters: Finish Material (Matt Default), Wall Finish Dimension (Skirting), Tiling and Coving Set, Wall Carving (Profile, Custom Carving), Wall Skirting, Wall Carving Material.
  - 6-column color/pattern grid (Olive Grey, Olive Yellow, Olive Brown, Orange Brown, Orient Red, Ochra White, Olive Olive, Doctor White, Pink Brown, Cabal Brown, Anchor Black, Typical White, Circle Red, Doctor White, Pale Brown, Cabal Brown, Typical White…). Real Indian-vendor paint shade naming.
- ✅ Material assignment is **per-face / per-section** — wall sections, skirting, cornice each can take a different material.

#### 2.1.12 Rendering
- 🟡 "Render" ribbon tab present.
- ❓ Photoreal rendering — Infurnia is known publicly to offer cloud-based render queues. None of the 51 screenshots show a rendered output overlay, so the live-render UX is **[GAP]**.
- ✅ Design OS already has `Wide Interior / Eye Level / Corner View / Ceiling View / Furniture Focus` camera presets and `RenderRoomType` auto-staging — this is a credible photoreal-precursor.

#### 2.1.13 Outputs
- 🟡 "Outputs" ribbon tab. Inferred outputs from the admin → design integration:
  - **BOQ / Costing** export (CSV / PDF / Excel).
  - **Floor plan PDF** (top-down dimensioned).
  - **Elevations PDF** (per-wall elevations with dimensions and materials).
  - **Production drawings** (factory-floor-ready cut sheets per cabinet).
  - **Render images / video flythrough**.
  - **Client presentation PDF** (marketing-style booklet).

### 2.2 Back-office (`admin.infurnia.com`)

This is the part Design OS does not yet touch in any meaningful way. **It is also the part that makes Infurnia un-replaceable for any org bigger than a single studio.**

The left rail in admin shows **9 first-class modules**:
*(Ref: 7.39.37 PM, 7.39.59 PM, 7.42.18 PM)*

1. **Home** — module launcher / KPI tiles
2. **Project Hub** — design list, status filter, owner filter, "Download CSV", filters
3. **Catalogue** — Furniture / Accessories / Hardware / Building / Finishes / Templates
4. **Brands**
5. **Design Intelligence**
6. **Tags**
7. **Sales Channel**
8. **Billing & Usage**
9. **Preferences and Settings**

#### 2.2.1 Project Hub (admin)
*(Ref: 7.40.53 PM)*

- ✅ Tabular list: **Project ID · Status · Owner · Last updated** (1–13 of 167 projects · 13 per page).
- ✅ Status values seen: `Design Phase`, `-` (none). Implied: In Review / In Production / Completed.
- ✅ **Download CSV** action (bulk export).
- ✅ **Filters** drawer (top right).
- ✅ Furniture-category filter side-tray: Base Unit, Bed, Bookshelf, Cabinet Shutter System Configuration, Chair, Corner Wardrobe, Dresser, Drawer Sets, Kitchen Fillers, Kitchen Loft, Mid Tall Units, Modular Office Furniture, Modular Study Table, Multipurpose Modular Furni…, Office Furniture, Partition Internals, Patio Furniture (and more — scrollable list).

This is the **admin's view of every project across the org**, with bulk export — Design OS Project Hub today is per-user / per-browser only.

#### 2.2.2 Catalogue → Furniture → Base Unit (sub-categories)
*(Ref: 7.42.18 PM, 7.43.02 PM, 7.43.04 PM, 7.43.11 PM)*

Sub-category tabs along the top of the catalogue:
- **Shutter Units** — open count visible: 167 items
- **Drawer Units**
- **Open Units**
- **Pull Out Units**
- **Sink Unit**
- **Corner Units**
- **Appliance Unit**
- **Shutter+Drawer**
- **Cylinder Units**
- **Breakfast Table**
- **Modular Table**
- **Special Cabinets**
- **Corner Cabinets**
- **Old Wood Curves**
- **Back Panel Wall Cl.**

Each item card shows a **rendered 3D thumbnail + dimensions string + variant counter**. Right-click / hover → expand to "Base Unit 1 Shutter 1 Shelf · 450/600/750/900/1200 W"… etc. That confirms **variants are managed as size-tuples per item**, exactly like Design OS's `CatalogVariant`.

#### 2.2.3 SKU Properties dialog
*(Ref: 7.43.07 PM, 7.44.16 PM, 7.44.19 PM)*

This is the *deepest* admin surface — a modal with four tabs:
1. **Properties** — geometry, materials, hardware, parametric rules
2. **Tags** — taxonomy assignment
3. **Pricing (Sales Channel)** — multi-channel price table
4. **Linked Rules** — parametric / dependent properties

The Pricing tab shows:
- ✅ **Manage Default Pricing** dropdown — *Link price to source SKU* / *Priced from constituent elements* / *Price as Completely-built unit*.
- ✅ Toggle: "Override margin and tax of constituents".
- ✅ "Not Priced — use Custom Text" with a free-text fallback field.
- ✅ **Existing Sales Channel Entries** table: columns `Sales Channels · Price Pivot · Pricing Mode · Adds Pop · Actions (view/edit/duplicate/delete)`. Rows include **Default Sales Channel, Punjab, Raipur, Indore**. *(Ref: 7.44.19 PM, 7.46.12 PM)*
- ✅ **"Select a Channel to add"** dropdown lists more channels: **Delhi, Mohania, My Costing, Residential Projects, Kanpur, Commercial Projects, JSN Feeder**. *(Ref: 7.46.23 PM)*
- ✅ Success toast: "Default Price Updated Successfully" — non-blocking confirmation pattern.

**Why this matters:** Infurnia is built for an org running **multiple regional dealerships / sales channels** with **different price points per region** — e.g. a kitchen costs ₹1.4 L in Indore, ₹1.7 L in Delhi, ₹2.1 L in a commercial project. The designer never sees this. The BOQ output picks the right column based on the project's sales channel.

#### 2.2.4 Brands
- 🟡 Module visible in sidebar. Inferred: managing OEMs (Hettich, Hafele, Godrej, Sleek, Saint-Gobain) with their logos, contact terms, lead times. Design OS's catalog already carries `brand` + `sku` per item — this is the same shape.

#### 2.2.5 Design Intelligence
- 🟡 Module visible. Inferred from the marketing wording ("design automation, design analytics, manufacturing rules, validation rules"):
  - Automation rules (e.g. "every base cabinet under sink must have a sink cutout").
  - Validation rules ("a wardrobe shutter wider than 600 mm requires a center support").
  - Analytics across projects.
- ❓ This is likely where Infurnia leans on rule-based geometry constraints. A natural place for AI augmentation.

#### 2.2.6 Tags
- 🟡 Free taxonomy: studio, finishes, project type. Used as filters across Project Hub and Catalogue.

#### 2.2.7 Sales Channel
- 🟡 Module visible. Pairs with the SKU-pricing tab — this is where channels are defined / margined.

#### 2.2.8 Billing & Usage
- 🟡 Per-seat billing. Likely shows MAU / seat count / storage usage. Inferred per LAUNCH.md: this is the "SaaS rent" Namaste is trying to escape.

#### 2.2.9 Preferences & Settings
- 🟡 Org-level: units (mm/in/cm), default wall thickness, default ceiling height, currency, GST %, render queue defaults.

### 2.3 Marketing surface (`infurnia.com`)
- **Top nav:** Product · Pricing · Resources · Sign Up · Book Demo.
- **Hero copy:** *"Modern Architecture & Interior Design Software — Transform your architecture and interior design process with a platform that connects your entire workflow."*
- **Trust strip:** "Trusted by Leading Companies" — VA, Almakitchens, Ozone, InterioSquare, Sodex, Wooden Street.
- **CTA capture form fields:** Name, Email, Phone, Company, Designer-Count (`<select>` with "4 or more" branching).
- **Lead routing:** Goes to `productionbackend.infurnia.com/incoming_leads/website`. UTM-content branching: `ininterior_deduced` vs `inarchitecture_deduced` decides which demo flow to send to.
- **Attribution tracking:** 180-day cookie capturing first-touch / last-touch source + landing page + referrer + UTM + visit count. **Aggressive marketing analytics — this is a heavy-touch B2B sales motion.**

---

## 3. UX / interaction patterns observed in Infurnia

| Pattern | Where seen | Why it works | Status in Design OS |
|---|---|---|---|
| **Ribbon top bar** with tabbed groupings | All canvas screenshots | Familiar from AutoCAD / Revit / Office — zero learning curve for trained designers | ✅ Present (`InfurniaRibbon.tsx`) |
| **Breadcrumb scoping** (Building › Floor › Room › Mass) | 7.49.58 PM | Compresses 4 levels of project hierarchy into one row, click-to-zoom | ✅ Top bar uses `Name › Building 1 › Ground Floor › Kitchen` |
| **Inline tutorial videos in property panels** | 7.59.55 PM | Massive onboarding leverage — designers learn while they do | ❌ Not yet |
| **Named camera presets per project** | 7.51.08 PM | Removes the "what was this view called?" tax during client review | ✅ Bottom strip in Design OS |
| **Three-tab catalog (ARC/FURN/FIN)** | 7.42.18 PM | Reduces tool-mode confusion to 3 stable categories | ✅ Identical in `CatalogSidebar.tsx` |
| **Material drawer is *docked at bottom*, not overlay** | 7.52.40 PM | Designer can keep eye on the canvas while sampling finishes | ✅ `BottomMaterialDrawer.tsx` |
| **Project Hub list + status pill** | 7.40.53 PM, 7.46.32 PM | Status is the spine of the design→production pipeline | ✅ `ProjectHub.tsx` + `ProjectStatus` enum |
| **Soft-delete with "Deleted Items" tab** | 7.46.32 PM, ProjectHub.tsx | Standard data-safety pattern | ✅ `deletedAt` on `DesignSnapshot` |
| **Live-client connection pill (footer)** | 7.49.58 PM, localhost | Sets expectation about sync state | ✅ "LIVE CLIENT CONNECTED" footer in Design OS |
| **`Shift + Z` to fit all, `Shift + X` to fit selection** | 7.49.58 PM | Power-user keyboard accelerators surfaced inline | 🟡 Design OS dispatches `design-os:fit-all` but doesn't yet show shortcuts inline |
| **Move-by-1mm vs Move-by-10mm dual nudge** | 7.49.58 PM | Two precisions, no mode toggle | ❌ Not in Design OS |
| **Input mode chooser (Pan / Select / Middle Mouse)** | 7.49.58 PM | Explicit, beats hidden hold-space-to-pan | ❌ Not in Design OS |

---

## 4. Data model inferred from Infurnia

Reconstructed schema (best-guess from screenshots + admin UX):

```
Organisation
├── Users (role: Designer / Project Manager / Architect / Accounts Manager / Catalog Manager / Manufacturing / Designer / Bim Operator)
├── Brands              # Hettich, Hafele, Sleek, Godrej...
├── Tags                # free taxonomy
├── SalesChannels       # Default · Punjab · Raipur · Indore · Delhi · Mohania · My Costing · Residential Projects · Kanpur · Commercial Projects · JSN Feeder
├── Catalogue
│   ├── Furniture (Base/Wall/Tall/Loft/Mid-Tall/Corner/Drawer/Open/Pullout/Sink/Appliance/...)
│   ├── Accessories
│   ├── Hardware       # handles, hinges, slides, channels
│   ├── Building       # walls, doors, windows, ceiling, floor, stair, slab, roof
│   ├── Finishes       # paints, textures, wallpapers, glass, laminates, veneers, tiles
│   └── Templates      # room presets
├── DesignIntelligence  # validation + automation rules
├── Projects[]
│   ├── meta { id, name, client, projectId, status, createdBy, updatedAt }
│   ├── Buildings[]
│   │   └── Floors[]
│   │       └── Rooms[]
│   │           ├── walls[]
│   │           ├── openings[]
│   │           ├── furniture[] (instance → catalog SKU + variant + materials)
│   │           ├── slabs[], stairs[], ceilings[], floors[]
│   │           └── annotations[]
│   ├── outputs { renders[], pdfs[], boqExports[] }
│   └── productionState  # design → in-review → in-production → completed
└── Billing { plan, seats, storage, renderCredits }
```

**Pricing flow:**
```
Furniture instance
  → catalog item
  → SKU
  → Pricing Mode: "completely-built" | "sum-of-constituents" | "linked-to-source-SKU" | "custom-text" | "not-priced"
  → Sales Channel lookup: project.salesChannelId
  → Final line in BOQ = base * margin_for_channel + tax_for_channel + accessories
```

Design OS's `pricing.ts` already implements the *single-channel* version of this. Adding `SalesChannel` is a ~2-day change but unlocks chains.

---

## 5. Where Design OS stands today

*(Ground truth — read directly from the `src/` tree, not from the launch post.)*

### 5.1 Stack
- React 19, Vite 6, TypeScript 5.8, Tailwind v4
- **2D:** Konva 10 + react-konva
- **3D:** R3F 9 + Drei 10 + three.js 0.184 + three-bvh-csg + postprocessing
- **State:** Zustand 5 + Zundo (50-step undo limit)
- **Persistence:** localStorage via `lib/persistence.ts` (`lib/db.ts` JSON storage shape)
- **AI:** `@google/genai 1.29` is in deps but no usage seen in the read files. Hook point exists.
- **Catalog scraper:** `scripts/catalog-scrape-3dw.mjs` — scrapes 3D Warehouse models. (Already a differentiator!)

### 5.2 Source surface (9,192 lines, key files)

| File | LOC | Role |
|---|---|---|
| `store/useStore.ts` | 522 | Single Zustand store with temporal middleware (undo). Owns walls / openings / furniture / rooms / project / saved projects / UI state / render state. |
| `components/ui/PropertiesSidebar.tsx` | 630 | Right-rail inspector |
| `components/viewport-2d/FloorPlan.tsx` | 619 | Konva-based 2D canvas |
| `components/ui/CatalogAdminModal.tsx` | 515 | Custom catalog admin (this is a **direct map** to admin.infurnia.com → Catalogue) |
| `components/ui/ProjectHub.tsx` | 490 | Project list / search / status / soft-delete |
| `components/ui/QuotationModal.tsx` | 485 | BOQ + quotation builder |
| `components/ui/TopBar.tsx` | 469 | Top chrome |
| `components/viewport-3d/Furniture3D.tsx` | 416 | 3D furniture renderer (with materials/textures) |
| `components/ui/CatalogSidebar.tsx` | 405 | Left flyout catalog |
| `lib/materialTexture.ts` | 354 | Procedural material textures (wood/marble/fabric/brick/tile/concrete/metal/glass) |
| `components/viewport-3d/Scene3D.tsx` | 335 | Three.js scene root |
| `components/ui/BottomMaterialDrawer.tsx` | 332 | Materials drawer |
| `components/ui/NewProjectDialog.tsx` | 269 | New-project flow |
| `lib/pricing.ts` | 262 | BOQ generator: Civil / Furniture / Finishes / Openings by room |
| `components/ui/AddRoomDialog.tsx` | 259 | Add a room |
| `components/ui/FloorPlanImportPanel.tsx` | 242 | Trace-over-image (reference plan) |
| `components/ui/InfurniaRibbon.tsx` | 224 | 8-tab ribbon |
| `components/ui/ViewportNavigation.tsx` | 222 | Left-rail nav panel |
| `lib/outputs.ts` | 205 | Outputs (renders, PDFs) generator |
| `lib/db.ts` | 203 | localStorage CRUD |
| `components/viewport-3d/Wall3D.tsx` | 171 | Extruded wall mesh |
| `components/viewport-3d/RenderRoomKit.tsx` | 170 | Render-mode decor kit (props for ceiling/decor/lights) |
| `lib/persistence.ts` | 164 | Project persistence |
| `components/viewport-3d/RenderToolbar.tsx` | 149 | Render-mode controls |
| `lib/materialPattern.ts` | 143 | Konva pattern fills (2D material preview) |
| `components/ui/OutputsCenter.tsx` | 129 | Outputs panel |
| `components/viewport-2d/Opening2D.tsx` | 91 | Door / Window 2D |
| `components/viewport-2d/Wall2D.tsx` | 84 | Wall 2D |
| `components/viewport-2d/BackgroundPlanLayer.tsx` | 78 | Reference plan image |
| `lib/math.ts` | 69 | Snapping math |
| `components/viewport-2d/Furniture2D.tsx` | 62 | Furniture 2D top-down |
| `components/viewport-2d/Grid.tsx` | 52 | Grid background |

### 5.3 Features actually shipped in Design OS v1

✅ Wall drafting (multi-segment, snap-to-grid, snap-to-90°)
✅ Multi-room (named rooms, building/floor/room scoping in store)
✅ Doors and windows (2D openings; 3D CSG drilling wired in deps but not yet hooked)
✅ Furniture catalog (20+ types: cabinets, wardrobes, beds, sofas, tables, desks, etc.) with **variants + brand + SKU + Indian-vendor names (Hettich, Hafele, Godrej, Sleek)**
✅ Material drawer (with procedural textures for 9 pattern types)
✅ Floor plan import (background image with mm/pixel calibration + opacity)
✅ Project Hub (recent / all / deleted / production tabs; status pill workflow)
✅ Properties sidebar (per-object editor)
✅ Quotation / BOQ (per-room blocks: Civil, Finishes, Openings, Furniture; subtotal + final)
✅ Save/load JSON (schema-versioned; migration for v1/v2 → v3)
✅ Undo/redo (Zundo, 50 steps)
✅ Reference plan trace-over
✅ 2D / 3D / Split viewport modes
✅ Camera presets (Free, Top, Front, Side, Island Front)
✅ Render mode toggle (Presentation Mode + decor kit + lighting + ceiling)
✅ Render room types (Auto / Kitchen / Master Bedroom / Bedroom / Hall / Dining / Bathroom / Office / Foyer / Balcony)
✅ Custom catalog item ingestion (CatalogAdminModal — direct equivalent of admin.infurnia.com)
✅ 3D-Warehouse asset scraper (`scripts/catalog-scrape-3dw.mjs`)

### 5.4 What's stubbed but visible in the UI

🟡 Line / Polyline / Hatch / Pattern drawing tools (ribbon shows them disabled)
🟡 Ceiling tool
🟡 Lighting / Strip (decor light placement)
🟡 Dimension / Measure tools (Annotate ribbon)
🟡 Share, Comment, Search (Outputs ribbon)
🟡 Doors/Windows CSG cutout in 3D (deps present, UI not yet wired)

---

## 6. Gap analysis — Design OS vs Infurnia

### P0 — Required for studio parity (must-have before pitching alongside Infurnia)

| Gap | Why it matters | Effort | Note |
|---|---|---|---|
| **3D door/window CSG cutouts** | Currently 3D walls don't show openings — clients notice immediately | 1–2 days | Deps already in `three-bvh-csg`; just wire to the existing `openings[]` store |
| **Dimension annotations on 2D** | Every Indian site sheet has dimensions; Annotate ribbon is stubbed | 3–4 days | Konva text + auto-leader lines |
| **Elevation drawings** | Output PDFs to factory; Infurnia's bottom strip shows Front/Side/Island Front Elevation views — Design OS has the camera presets but no PDF export | 3–5 days | R3F Orthographic camera + svg/pdf export |
| **Floor plan PDF output** | One-button "send to client" | 2 days | Convert 2D Konva stage → PDF via existing print/pdfkit pattern |
| **Multi-floor & multi-building scoping** | Store has `building`/`floor` strings on `Room` but no UI/breadcrumb editor; Infurnia treats this as a 3-level tree | 3 days | Existing data model supports it; need tree picker |
| **Massing tool** (block-out volumes) | "Select Mass" mode lets designers rough-out a house *before* drawing walls | 4 days | One mesh primitive per mass; converts to walls on commit |
| **Inline keyboard-shortcut surfacing** | Infurnia shows `Shift+X` / `Shift+Z` *in the panel*. Design OS hides them. | 0.5 day | UI-only |
| **Move-by-1mm / 10mm dual nudge** | Two-precision arrow-key nudge | 0.5 day | `useKeyboard.ts` extension |
| **Input mode toggle (Pan / Select)** | Beats hold-space-to-pan; explicit and discoverable | 1 day | Store flag + cursor |

### P1 — Differentiation (catch up + leapfrog)

| Gap | Why it matters | Effort | Note |
|---|---|---|---|
| **Sales-channel pricing per SKU** | Unlocks selling to chains / dealers / franchises (the **real** Infurnia customer) | 3 days | Add `salesChannels[]` to store; modify `pricing.ts` to lookup by `project.salesChannelId` |
| **Org admin module** (multi-user, RBAC) | Required by anyone with >1 designer | 2 weeks | Adds an admin URL or admin tab; ties to billing later |
| **Parametric cabinet builder** | Infurnia's `Carcass / Top Panel / Left Panel / Depth / Carving / Hardware / Pattern for Cutoff` system is the moat | 3 weeks | New "Cabinet Configurator" surface; rules engine; SKU generation |
| **Production drawings export** | Factory-ready cut sheets per cabinet — *no other Indian product does this for an SMB studio* | 2 weeks | Per-cabinet exploded view + cut list + hardware list |
| **Cloud render queue** | Photoreal output overnight; designers can stack jobs | 4 weeks | Backend service; Three.js → glb → cloud renderer (V-Ray / Blender Cycles / similar) |
| **Inline tutorial videos per property** | Onboarding/retention; one of Infurnia's most quietly effective tactics | 1–2 weeks | Per-prop video URL field in catalog item; hover-to-play |
| **Section / cut planes** | Architects need these | 1 week | R3F clipping plane wired to a 2D sectional Konva stage |
| **Rooms ↔ floors ↔ buildings tree** | Multi-tower projects | 1 week | UI; data model already supports |
| **Templates marketplace** | Org-level + public templates | 1–2 weeks | Persistence + share link |
| **Real-time collaboration (multi-cursor)** | "Two designers, one project" — Infurnia does not have this well | 4 weeks | Yjs or Liveblocks + Zustand bridge |
| **Comments / mentions on objects** | Studio review loop | 1 week | Comment thread anchored to object id |
| **Tags everywhere** | Free taxonomy for items + projects + finishes | 3 days | One model, many usage sites |

### P2 — Strategic moves (these are how you win — see §7)

See dedicated section: **§7 World-class moves.**

---

## 7. World-class moves — how Design OS leapfrogs Infurnia

Infurnia's blind spots are the openings. The next four sub-sections are the **bets** that, taken together, make Design OS not "Infurnia for India" but **the category-defining successor**.

### 7.1 AI-native design — make Claude / Gemini a first-class designer

**Status quo:** Infurnia is a *manual* tool. The designer drives every move. Infurnia mentions "Design Intelligence" but it's a rule-engine for validation, not a generative partner.

**What world-class looks like:**
1. **Prompt-to-layout.** Designer types: *"Plan a 3 BHK on this 1100 sqft footprint, kitchen on the north wall, master bedroom away from the road."* Claude/Gemini generates 3 layout candidates as actual `walls[]` + `furniture[]` arrays.
2. **Inline AI assistant.** Side panel: *"Make the wardrobe taller", "Add a study unit on this wall", "Change the kitchen layout to L-shape"*. Generates a diff (`addFurniture / removeWall`) the designer reviews and accepts.
3. **AI quotation copy.** BOQ → "Generate a client-friendly quotation summary in Hindi/Marathi/English with our brand voice." (You already have `@google/genai` in deps.)
4. **Vision-based reference plan.** Upload a hand-sketched plan or builder PDF; AI traces walls + identifies rooms. (Today `FloorPlanImportPanel` only does background-image trace-over.)
5. **Photo → 3D scene match.** Client sends a Pinterest photo; AI suggests materials/finishes from your catalog that match.

**Impact:** 5× designer throughput. The studio that ships this in 2026 owns the next decade.
**Difficulty:** Medium. Gemini 2 / Claude can already do most of this; the hard part is round-tripping through your store.

### 7.2 Production-grade output, on-page

**Status quo:** Infurnia produces a BOQ but the *factory cut sheet* lives in a separate workflow with a Production Designer role. Design OS doesn't produce these yet.

**What world-class looks like:**
- **Cabinet Cut List** per project: panel-by-panel sheet with grain direction, edge banding, hardware references, lot tracking. Exports to CSV/PDF + (later) directly to a CNC nesting tool (CutRite / OptiNest / Maestro).
- **GST-ready quotation PDF** with the studio's letterhead (Anup Kumar / GSTIN 27IEAPK2697H1Z4 / Goregaon East address — those screenshots showed Anup's own GST details).
- **PO trail to vendors** — one-click "send hardware list to Hettich rep".
- **Client e-sign on quote** (use any existing eSign API — or just generate a signed PDF link).

**Impact:** Closes the *design → factory* loop, which is currently solved by spreadsheets, WhatsApp, and a production designer. Removes 3-7 days from every project.
**Difficulty:** Medium-low. Most of it is templated PDF rendering on top of existing data.

### 7.3 Mobile/AR client review

**Status quo:** Infurnia is desktop-only. Clients see designs on a meeting screen, not on their own phone.

**What world-class looks like:**
- **Read-only mobile web view** of any project — share a link, client orbits the 3D model on their phone, taps a wall to see the finish, taps a cabinet to see the catalog page.
- **WebXR / AR Quick Look** — client puts their phone at the meeting room and *sees the kitchen at scale in their actual space*. iOS Quick Look (`.usdz`) is a single export step from R3F.
- **WhatsApp share** — every project gets a public review URL. Client comments thread back into your store.

**Impact:** Conversion shifts from "designer brings laptop to client home" to "client shares the AR link with their spouse before the meeting". Sales cycle drops in half.
**Difficulty:** Low (read-only mobile view), Medium (WebXR), Low (usdz export).

### 7.4 Bring-your-own-catalog (BYOC) + open marketplace

**Status quo:** Infurnia's catalog is curated by Infurnia. Onboarding a new brand is a sales conversation. Costs the studio time.

**What world-class looks like:**
- **CSV/GLB upload** for any studio to upload their own catalog. Already partially shipped (`CatalogAdminModal.tsx`).
- **Public Catalog Marketplace** — vendors (Sleek, Hettich, regional carpenters) upload directly. Studios *subscribe* to a catalog with one click. Vendor gets analytics on which studios used their products.
- **Open schema** — your `FurnitureCatalogItem` shape becomes the de-facto open standard ("DesignOS Item Schema 1.0"). Anyone can publish.
- **3D Warehouse pipeline** — already scaffolded (`catalog-scrape-3dw.mjs`). Turn it into a one-click ingest with auto-thumbnail rendering.

**Impact:** Network effects compound — once a thousand vendor SKUs are on Design OS, no other tool can catch up. Infurnia controls its catalog; Design OS *crowdsources* one.
**Difficulty:** Medium for the vendor-side admin, Low for the schema work.

### 7.5 Pricing model that destroys SaaS rent (LAUNCH.md promise made real)

**Status quo:** Infurnia is per-seat per-month, multi-thousand rupees per designer. Your LAUNCH.md already calls this out.

**What world-class looks like:**
- **One-time studio license**: ₹X for unlimited designers for 1 year, then a small renewal for updates.
- **Optional cloud add-ons** priced à la carte: render credits, cloud project sync, AI quota.
- **Free for solo / student designers** — capture the next generation of designers before they sign their first Infurnia contract.
- **Local-first**: project file lives on the studio's machine (already done). Cloud is an *opt-in*, not the default.

**Impact:** Direct play to the LAUNCH.md ICP. Wins on price without losing on capability.
**Difficulty:** Mostly business / packaging, not engineering.

### 7.6 Performance & ergonomics

- **WebGPU render path** when available (R3F supports it) — 3× viewport perf on M-series Macs.
- **Wall geometry with proper miter joins** (PLAN.md flagged this as a P2 risk) — solve it; Infurnia's joints look clean in 3D.
- **Offline-first** via Tauri (PLAN.md flagged for v2) — meeting wifi dies, the designer keeps drawing.
- **Sub-100ms tool switching** target as a north-star metric.

### 7.7 The "AI Project Manager" — beyond just a canvas

This is the single biggest moonshot. Today a studio's tool stack is: WhatsApp + Excel + Infurnia + email + AutoCAD. **What if Design OS subsumes all of this?**

- **Lead inbox.** Every WhatsApp / website / IndiaMART lead lands in a unified inbox. (Those `Anup / Arnab / Abhay Salvi / Baidul` screenshots are exactly this — you already have a CRM-shaped prototype.)
- **AI scheduler.** "Draft a meeting agenda for Abhay's site visit Friday — pull the floor plan, his Pinterest references, and the last quote."
- **Site-visit notes.** Voice-record on phone → AI transcribes → auto-creates revision items in the project.
- **Quote-to-cash.** Client signs the quote → invoice generates → payment link sent → ledger updates.

This is no longer a canvas. It is **the operating system for an Indian interior design studio.** The brand name "Design OS" earns itself.

---

## 8. Suggested 30 / 60 / 90 day roadmap

### Days 1–30 — Parity & polish (close obvious gaps, ship demoable wins)
1. Wire 3D door/window CSG cutouts (deps already in package.json).
2. Surface keyboard shortcuts inline + add 1mm/10mm nudge.
3. Dimension annotation tool (Annotate ribbon).
4. Floor plan PDF export.
5. Elevation PDF export (use existing camera presets).
6. Wall miter joins.
7. Soft polish pass on `InfurniaRibbon` (enable Line/Polyline/Hatch as actual tools — even minimal ones).

### Days 31–60 — Differentiation (production handoff + AI on-ramp)
1. Cabinet cut list export (panel-by-panel CSV + PDF).
2. GST-ready quotation PDF with Anup's letterhead.
3. Multi-floor / multi-building tree picker.
4. Prompt-to-layout MVP using `@google/genai` (Gemini) — start with single-room generation.
5. Mobile read-only view (publish a public link per project).
6. Real-time collab spike (Yjs + Zustand experiment, behind a flag).

### Days 61–90 — Moat (catalog marketplace + AR + AI assistant)
1. Vendor-side catalog uploader + studio subscription.
2. AR (`.usdz`) export for iOS Quick Look.
3. AI assistant side panel (chat over current project + diff-based suggestions).
4. AI vision: hand-sketch → walls.
5. Section / cut planes.
6. Templates marketplace.
7. Begin Tauri desktop build.

---

## 9. Risks & open questions

| # | Question | Why it matters | Suggested action |
|---|---|---|---|
| Q1 | Is the target user the **studio** (Namaste) or the **chain** (modular kitchen franchise with regional pricing)? | Determines whether Sales Channels are P1 or P3. | Decide by week 2 of the roadmap. |
| Q2 | Is Tauri now or v2? | If "now", architecture choices change (e.g., asset bundling, file-system access). | LAUNCH.md says "later" — defer to days 60–90. |
| Q3 | What's the AI budget? Gemini is in package.json — what's the monthly token spend tolerance? | Caps the prompt-to-layout feature scope. | Set a per-project quota; charge for AI add-on. |
| Q4 | How are renders generated today? CPU/Blender locally? Cloud queue? | Determines whether Cloud Render Queue is a 1-week or 4-week project. | Audit current `renderRoomKit` + decide cloud vendor. |
| Q5 | What does the LIVE_CLIENT_CONNECTED footer pill actually do today? | Sets expectation about real-time sync that may not exist. | Either ship the backend or rename the pill to "Local". |
| Q6 | Is there a backend at all today? | Determines whether Project Hub is truly multi-user yet. | Audit `lib/db.ts` + `lib/persistence.ts` — likely localStorage-only. |
| Q7 | How do we get the *next 50 studios*? | Distribution determines the order of features. | A separate GTM doc — out of scope for this dump. |
| Q8 | What's the IP position vs Infurnia? Naming the file `InfurniaRibbon.tsx` is fine internally but should not ship in the deliverable file names. | Risk of legal noise if Infurnia notices. | Rename internally to e.g. `DesignRibbon.tsx`. |

---

## 10. Screenshots index

Direct references to evidence in `/Users/anup/Desktop/canvas/infurnia-image-referneces/`. Filenames preserved verbatim so the reader can cross-check.

| Topic | Best screenshot(s) |
|---|---|
| Infurnia marketing homepage | `Screenshot 2026-05-04 at 7.38.14 PM.png` |
| Admin home (modules sidebar) | `7.39.37 PM.png`, `7.39.59 PM.png` |
| Project Hub (admin, project list + furniture filter) | `7.40.53 PM.png` |
| Catalogue — Furniture sub-categories | `7.42.18 PM.png`, `7.43.02 PM.png`, `7.43.03 PM.png`, `7.43.04 PM.png` |
| Catalogue — variant expansion popover | `7.43.11 PM.png` |
| SKU Properties dialog — Pricing tab | `7.43.07 PM.png`, `7.44.16 PM.png`, `7.44.19 PM.png` |
| Sales Channels list | `7.46.12 PM.png` |
| Sales Channels dropdown (all channels) | `7.46.23 PM.png` |
| design.infurnia.com — Project home + New Project dialog | `7.46.32 PM.png` |
| Template Selection modal | `7.48.03 PM.png` |
| Design canvas — 3D view (multi-room house) | `7.49.58 PM.png`, `7.51.08 PM.png` |
| Material drawer (paints/textures) | `7.52.40 PM.png` |
| Cabinet detail panel + inline tutorial video | `7.59.55 PM.png` |
| QuoteSwift auth (parallel CRM POC) | `2026-05-05 at 3.44.19 PM.png` |
| QuoteSwift recent leads | `2026-05-05 at 4.07.37 PM.png` |
| Quote/invoice footer w/ Anup's GSTIN | `2026-05-05 at 4.56.25 PM.png` |

*(Remaining ~35 screenshots cover finer-grained versions of the same panels — all available in the folder.)*

---

## 11. Bottom line

You have already built ~40% of Infurnia's *visible* design surface in <10K lines of TypeScript — and that's the half clients see. The half that locks Infurnia in (admin / catalog / sales-channels / production handoff) is where the next quarter of work goes.

But the bigger prize isn't parity — it's the **AI-native + open-catalog + studio-OS** play. Infurnia is a 10-year-old desktop-software paradigm dressed in a webapp. The window to build the next paradigm is open right now, and you have the staff, the price advantage, the LAUNCH.md narrative, and the early-customer trust (your own studio is customer #1) to do it.

> *"What closes projects is: a designer who can sit with a client, sketch a layout in front of them, walk them through it in 3D, and hand them a quotation by Friday."* — LAUNCH.md

Everything in this dump is in service of that one sentence. Build the things that compress *Tuesday → Friday* into *Tuesday → Tuesday afternoon*, and Design OS wins.

---

## 12. Live walkthrough findings — 2026-05-12 (supersedes earlier [GAP]s)

A second pass was performed directly inside design.infurnia.com (authenticated as Rishu @ Namaste Demo) and admin.infurnia.com. This section documents *every* item that was visible live but was previously inferred or marked as a gap.

### 12.1 The full Infurnia ecosystem is FOUR apps, not two

Cross-linked from the top nav of every Infurnia app:

| App | Surface | Role |
|---|---|---|
| **`infurnia` Design** (`design.infurnia.com`) | The designer canvas. 2D plan + 3D + render + outputs. | Studio / employee designer. |
| **`infurnia` Admin** (`admin.infurnia.com`) | Org configuration, catalog SKU management, design intelligence rules, billing. | Org admin / catalog manager / accounts. |
| **Production Design** (`production.infurnia.com`) | Production designer's workspace — opens designs in *production* state for factory handoff. | Production designer. |
| **MES** (`mes.infurnia.com`) | **Manufacturing Execution System** — factory-floor scheduling, work orders, BOM consumption, production tracking. | Factory operator / production planner. |

**So the moat isn't just "design + admin" — it's a vertically integrated stack from concept design all the way to the factory floor.** Design OS is competing with #1 today; the real long-term competitor surface is all four.

### 12.2 Design canvas — every ribbon tab, every tool (verified live)

#### Top chrome (always visible)
- **Left:** `infurnia` Design logo · Folder icon (open project) · **Design1 ▾** (design picker — multiple designs per project) · **Design ▾** (mode picker: `Design` / `Presentation`) · ⬢ icon (org logo) · 🏠 **Building 1 ▾** · ▦ **Ground Floor ▾** · 🏠 **Kitchen ▾** (rooms in current design — visible options were `Masterbedroom` and `Kitchen`)
- **Right:** **Floorplan / 3D** toggle · **…** menu (Elevations / Custom plans + Create) · **R** avatar (Account Settings, **View live co-designers**, **Preview as Designer**) · ? help · fullscreen · X close
- **Far right small text:** **Project Units: 1 mm** (or `ft in` for imperial users)

#### `Home` ribbon tab
Tools captured live (left→right): **Pref. · Branch · Undo · Redo · Select · Line · Poly.. · Grid · Hatch · AI Floor.. (Beta) · Walls (▾) · Door · Window · Ceil. · Tiling · Furnish · Light · Strip.. · Trim/Ex.. · Dim.. · Measu. · Zoom (▾) · Pres.. · +Pres. · Auto.. (Beta) · Share · Comment · Search**

Hover-confirmed tooltips:
- **AI Floor.. (Beta)** = **"Import Floorplan (AI)"** — upload PDF / image / sketch, AI traces walls automatically.
- **Branch** = **"Version History"** — opens the Versions & History modal with **All Branches / Active Branch** tabs and a **CREATE BRANCH** button (Git-style branching for designs).
- **Pres..** = **"Presentation"** — enters presentation mode.

#### `View` ribbon tab
**Pref. · Branch · Undo · Redo · Select · Lock · Refle.. · Ex. Light · Pro. Uni.. · Rich View · Set. · Quick H. · Isolate · UnHide · X-Ray · Set Thu. · Lock Des**

Inferred / verified:
- **Lock / Lock Des** — lock an object / lock the entire design from edits.
- **Refle..** — Reflection (planar mirror toggle).
- **Ex. Light** — Exterior Light toggle (daylight study).
- **Pro. Uni..** — Project Units changer (mm / in / ft-in / cm).
- **Rich View** — toggle realistic preview shading.
- **Set.** — visibility settings.
- **Quick H. / Isolate / UnHide / X-Ray** — classic CAD visibility stack: hide selection, isolate selection (hide everything else), unhide all, X-Ray show-through mode.
- **Set Thu.** — set the design's thumbnail (the card you see in Project Hub) from the current viewport.

#### `Insert` ribbon tab
**Pref. · Branch · Undo · Redo · Select · Furnish · Light · Strip.. · 3D Import · Add Ref..**

- **3D Import** — bring in external GLB/OBJ/3DS/SKP models.
- **Add Ref..** — Add Reference (drop a reference plan image / PDF into the workspace).

#### `Draw` ribbon tab — full AutoCAD-grade drafting (Design OS has NONE of these)
**Pref. · Branch · Undo · Redo · Select · Line · Poly.. · Grid · Cons. · 3-Arc · Circle · Rect. · Polygon · Arrow · Hatch · Trim · Extend · Mirror · Copy · Move · Scale · Compone.. · Offset**

That last block (Trim/Extend/Mirror/Copy/Move/Scale/Component/Offset) is the AutoCAD "Modify" panel. Together with construction lines, polygons, arcs, this is a fully-featured 2D drafting toolset.

#### `Architecture` ribbon tab — full BIM (Design OS has Walls / Doors / Windows only)
**Pref. · Branch · Undo · Redo · Select · AI Floor.. (Beta) · Walls (▾) · Door · Window · Ceil. · Tiling · Stair · Slab · Columns (▾) · Rail · Beam · Roof · Trim/Ex.. (▾) · Copy · Move · Mirror · Fillet · Att. Wa.. · Dim.. · Measure · Zoom (▾)**

New architectural primitives over and above Design OS today: **Stair · Slab · Columns · Rail · Beam · Roof · Fillet · Attach Walls.** These convert Infurnia from a "kitchen interior" tool into a full building modeller.

#### `Annotate` ribbon tab
**Pref. · Branch · Undo · Redo · Select · Text · Compass · Align · Angle · XY · Radial · MultiLeader (▾)**

Standard CAD annotation: Text (free label), Compass (north arrow), Align (aligned dim), Angle (angular dim), XY (coordinate dim), Radial (radius/diameter), MultiLeader (callouts).

#### `Render` ribbon tab
**Pref. · Branch · Undo · Redo · Select · Render · 3D Ren.. · Gallery · Export · Scree.. · Ex. Light**

- **Render** = static still render.
- **3D Ren..** = 3D Render — full scene render.
- **Gallery** = past renders for this design (saved gallery — Design OS doesn't have a render gallery).
- **Export** = export to disk.
- **Scree..** = Screenshot (cheaper than a render).
- **Ex. Light** = exterior lighting setup (sun position / time-of-day for the daylight study).

#### `Outputs` ribbon tab — the production handoff layer
**Pref. · Branch · Undo · Redo · Select · Lock Des · Pres.. · +Pres. · Auto.. (Beta) · Pricing · QC.. · Viola.. · Raw Ma.. · BOQ Schedule · Setting · Work Sc.. · Prod Des..**

Hover-confirmed:
- **Pres..** = **Presentation**.
- **Auto.. (Beta)** = **"Auto generate new presentation"** — AI-generated client-ready presentation from the current design.

Inferred from labels (verifying with the Sandeep recording where the full text was visible):
- **Lock Des** = Lock Design (read-only freeze before sharing).
- **+Pres.** = Add a new (manual) presentation slide.
- **Pricing** = pricing review / overrides per design.
- **QC..** = Quality Control — check rules.
- **Viola..** = Violations — list of broken design / manufacturing / hardware rules.
- **Raw Ma..** = Raw Materials report (board, edgeband, hardware quantities for production planning).
- **BOQ Schedule** = the Bill of Quantities export (cabinet-by-cabinet, panel-by-panel).
- **Setting** = output settings.
- **Work Sc..** = Work Schedule — assigns design to production calendar.
- **Prod Des..** = Production Design — push design into the production state and open in production.infurnia.com.

The Outputs tab is where **Design OS is most under-built today.** Design OS has Quotation (a BOQ flavour) and Presentation Mode, but nothing on QC, Violations, Raw Materials, Work Schedule, or Production Design handoff.

### 12.3 Viewport — Floorplan vs 3D mode

Switching **Floorplan ↔ 3D** rearranges the left-rail Viewport Navigation panel:

**Floorplan (2D) mode rail:**
- *What's new?* link with a blue dot when new content drops
- **Input mode:** explicit chooser between *Pan* (Shift + middle-click icon) and other modes
- **Zoom Options:** Manual (mouse scroll) · To selection (`Shift + X`) · To fit all (`Shift + Z`)
- **Move selected object by 1 mm:** arrow-key block
- **Move selected object by 10 mm:** Shift + arrow-key block
- **Global Preferences & Settings:** Project Units, Selection state, Shortcuts hint (`F · Esc · Arrows`)

**3D mode rail adds:**
- **Orbit:** Middle mouse
- **Move Camera:** Shift + W (Front) / A (Left) / S (Back) / D (Right) · Shift + Q (Up) / E (Down) — full WASD + QE flight controls
- **Rotate Camera:** Shift + arrow keys
- **Draw tab is greyed out** in 3D (can't draft in 3D)
- Bottom-right viewport gizmo is a **3D cube with face labels** (RIGHT visible) — click a face to snap-orient.
- World axes triad (red/green/blue) at origin.

### 12.4 Object Properties panel (right rail, on select)

Selecting a cabinet (C37 in the test) opens a deep, multi-tab property inspector:

**Header:** `Cabinet (C37)` + magnifier (zoom to selection) + info (i) button.
**Object sub-tabs (icon tabs):** three icons — likely *Properties / AI suggestions / Hardware* (sparkles icon visible).
**Vertical sub-tabs:** **Cabinet** | **Panel (C37P1)** — confirms cabinets are *composed of individually-addressable panels* (cabinet C37 contains Panel C37P1, you can edit that panel separately).

**Property groups inside the panel (live):**

```
Dimensions
  W 850 · D 320 · H 600    (mm)

Materials  [Finishes | Core | Edgeband]   (tabs)
  Finishes:
    Shutter External Finish     → "Siberian Oak"
    Shutter Internal Finish     → "22291 SF Frosty White"
    Carcass External Finish     → "22291 S..."
    Carcass Internal Finish     → "22291 S..."

  Set External = Internal for Postlam
    External/Internal link toggle (Disabled / Enabled)

  Carcass Edgeband Linking
    Edge..  ↔  Internal Finish ↔ External Finish

Countertop  (section)

Position / Rotation
  X 2473  ·  Y 1882  ·  Z -420   (mm)
  Y 270°  ·  Rotate by 90° (two direction buttons)
```

Each finish dropdown has icon-buttons: paste/link/duplicate/info, suggesting cross-cabinet finish linking (set once, propagate). Edgeband linking lets you peg the edge band to either the internal or external finish — that's a real factory constraint.

**Design OS does not yet split a furniture item into panels, separate shutter vs carcass, model edge-band rules, or expose 3D position/rotation in the property panel. Adding the panel concept is the single biggest data-model upgrade required to be production-grade.**

### 12.5 Versions & History (Branch icon)

Modal opened by clicking the **Branch** icon (visible in every ribbon tab):

- Title: **"Versions & History"** · close button · **CREATE BRANCH** button (top-right).
- Tabs: **All Branches | Active Branch**.
- Table columns: **Branch Name | Timeline**.
- Rows in the test design:
  - `master` — 16 minutes ago (current)
  - `master` — 5 hours ago (auto-save point along master)
- Gear icon per row (per-snapshot settings: rename, set as live, delete, fork…).

**This is genuinely Git-inspired.** A designer can fork a master design into a branch ("explore an alternative kitchen layout"), iterate, then either merge back or discard. Design OS today has Zundo (50-step undo) — flat history, no branching. Adding branches is *the* killer feature for design studios that pitch multiple concepts to a client.

### 12.6 The "..." menu (top-right of canvas)

Opens a small panel:
- **Elevations (0)  + Create** — saved elevation views (auto-rendered per face).
- **Custom plans (0)  + Create** — saved custom plan views.

So elevations and custom plans are named, saved entities scoped to the design — like the bottom-strip cameras but for 2D outputs.

### 12.7 Top "+" / new project / template

The hub at `design.infurnia.com` shows:
- Sidebar tabs: **Recently Accessed · All Projects · Deleted Items · Production Designs (Know more)**
- **+ New Project** primary CTA
- Project list table columns: **Project Name · Client Name · Project ID · Status · Last Update**
- Grid/list view toggle (top-right icons)
- **Sort By: Recent** filter (top-right)
- Per-project page opens **Start New Design** card and existing designs as thumbnails.

The **Template Selection** modal on new-design has three tabs: **All Templates / Org Templates / Default Templates** with **Search the Template** input. Visible defaults: Kitchen / Bedroom / Blank / Living Room / Room / Villa (scrolls for more). Per-org templates is a power feature — sales teams can pre-stage layouts.

### 12.8 Object ID convention (verified live in canvas)

Visible cabinet labels in the Kitchen design: **C12 · C13 · C36 · C37 · C38 · C39 · C40 · C41 · C42 · F10 · F1 · O10**. Pattern:
- **C#** = Cabinet
- **F#** = Free-standing Furniture
- **O#** = Opening (door / window) — `O10` is a window in the kitchen
- Likely also: **W#** = Wall, **L#** = Light, etc.

Auto-numbered per design. These IDs show up on the 2D plan as small labels for cross-referencing with the BOQ and production cut sheets. Design OS uses UUIDs internally but doesn't surface a human-readable ID.

### 12.9 Admin sidebar — full module / sub-module tree (verified live)

```
admin.infurnia.com
├── Home (welcome + 8 module cards)
├── Project Hub ▾
│     ├── Projects               (table of all projects across org)
│     └── Design Templates       (org-level templates)
├── Catalogue ▾
│     ├── Furniture       →      (sub-categorised SKUs)
│     ├── Accessories     →
│     ├── Hardware        →
│     ├── Building        →      (walls, doors, windows, ceilings, slabs, stairs)
│     ├── Finishes        →
│     └── Templates       →
├── Brands
├── Design Intelligence ▾
│     ├── Rule Summary           (overview)
│     ├── Design Constraints     (e.g. wardrobe shutter ≤600 mm needs center support)
│     ├── Manufacturing Rules    (e.g. min cut size, max sheet size, panel grain)
│     ├── Hardware Rules         (e.g. drawer >900 mm needs telescopic slide)
│     └── Design Automation      (rule-driven auto-generation)
├── Tags
├── Sales Channel
├── Billing & Usage ▾
│     ├── User Management
│     ├── Usage Details
│     └── Budgets
└── Preferences and Settings ▾
      ├── Preferences
      ├── Manufacturing Settings
      ├── Settings
      ├── Design App Configuration
      ├── Designer Input
      ├── Panel Pricing Templates
      ├── Construction Styles
      ├── Project Statuses
      ├── Room Type
      └── Additional Parameters
```

### 12.10 Admin module cards — verbatim descriptions

From the Welcome page at `admin.infurnia.com`:

| Module | Tag line | Bullet capabilities |
|---|---|---|
| **Project Hub** | Complete Visibility over any design, project and templates. | Manage projects · Download output from design · Manage templates · Share projects and designs |
| **Catalogue** | Seamlessly Structure, manage and modify SKUs. | Manage SKUs · Structure catalogue in your way · Set various pricing settings · Bulk edit SKUs |
| **Design Intelligence** | Set a rule, sit aside and let the automation take care. | Design automation · Design constraints · Manufacturing rules · Hardware rules |
| **Sales Channels** | Sell SKUs in multiple settings / domain. | **Subscribe to other's stores** · Define your own price fields · Push your SKUs in any channels · Custom preferences |
| **Brands & Tags** | Provides deep classification of your SKU. | Define own brands and Tags · Access to global brands · Group cross category SKUs with tag / brands |
| **Pref. & Design app Conf..** | Define your preferred default Values and features in design app. | Reduces designers work · Manage all feature access · **More than 2000+ feature flags** · Set Org's default preferences |
| **Settings** | All other additional setting required for the users | Room types & project status · Define manufacturing tools · Service-charge & scheduled pay · Define terms & conditions, more.. |
| **User Manage. & Billing** | Manage user addition, removal and access level easily | Adding user to organisation / **BU** (Business Unit) · Roles and access levels · Visibility over usage of design · Insights on credits and payment |

**Three findings that change the gap analysis:**
1. **"Subscribe to other's stores"** — Infurnia already runs an *inter-org SKU marketplace*. The "Bring-your-own-catalog" world-class move (§7.4) is partially competing with an existing surface.
2. **"More than 2000+ feature flags"** — Infurnia is enterprise-grade gated. Org admins can flip thousands of features per BU. This is a moat for big customers (each chain feels they have a custom app) and a tax for small customers (most studios never know these flags exist).
3. **"Business Unit" (BU)** — there is a level *above* user role but *below* org. Big chains can carve their org into BUs (Punjab / Raipur / Indore — matches the Sales Channels) with different roles + permissions + catalogs per BU.

### 12.11 Roles ecosystem (verified live)

User Rishu's role string at admin home: **"Mes Admin, Production Designer, Project Manager, Mes Operator, Designer"** — that confirms five named roles, plus from screenshots: **Architect, Accounts Manager, Catalog Manager, Bim Operator**. So at least **9 named roles** in the system. Some roles are gated per BU — Rishu was denied on Brands and Catalogue → Furniture detail with error: *"User does not have required role in the business unit"*.

### 12.12 Real-time collaboration is shipped

The user-menu has **"View live co-designers"** — confirming Infurnia has live multi-cursor / co-edit. Design OS today is single-user-local-storage. This is a P0 if Namaste's studio has more than one designer; otherwise P1.

### 12.13 Contextual help / copilot pattern

A persistent footer pill says *"Suggestions will appear here when you select a tool."* and a floating play-button widget at bottom-right opens a guided tour. So Infurnia ships an in-app copilot: pick a tool → contextual help appears. Design OS has nothing analogous yet — and this is a place a Claude/Gemini integration could leapfrog (real LLM suggestions instead of canned tooltips).

### 12.14 Naming + units

- Project unit toggle supports at least **mm** and **ft in** (imperial) — Namaste should probably default to mm but expose the toggle for clients in the Middle East / US.
- Designs are flat-named by default: `Design1, Design2, Design3...` — there's no client-friendly naming convention enforced.

### 12.15 Network surface (observed)

Visible requests during load:
- `api-iam.intercom.io/messenger/web/events` — Intercom is the in-app messenger / support widget.
- `design.infurnia.com/resources/...` — heavy static asset preload (every icon, keyboard glyph, panel icon).
- API base appears to be `productionbackend.infurnia.com` (from infurnia.com lead form analysis).

A short network trace was insufficient to enumerate the design-API endpoints; deeper capture (via Chrome DevTools recording or a packet log) would be a follow-up if there is interest in reverse-engineering Infurnia's API shape.

---

## 13. Revised gap analysis (after live capture)

The first-pass gap analysis (§6) is largely correct but **understated the surface area** in three places. Adding these to **P0** / **P1**:

### Added to P0 (parity)
| Item | Why |
|---|---|
| **Stair, Slab, Column, Beam, Roof, Rail primitives** | Without these, Design OS can't model a villa or duplex — it's a kitchen tool. |
| **AutoCAD-class Draw tools** (Trim · Extend · Mirror · Copy · Move · Scale · Offset · Construction line · 3-arc · Circle · Rect · Polygon) | Without these, every dimension change is a rebuild from scratch. |
| **Annotation primitives** (Text · Compass · Align · Angle · XY · Radial · MultiLeader) | Required on every plan PDF a studio hands to a contractor. |
| **Object IDs (`C# / F# / O#`)** surfaced on canvas | Required for any factory cross-referencing. |
| **Cabinet → Panel data model split** with per-panel finishes (shutter ext/int, carcass ext/int, edgeband linking, postlam toggle) | The single biggest data-model upgrade. Without it, BOQ remains studio-grade not factory-grade. |
| **3D position / rotation editors** in property panel | Designers expect to nudge by typing a number, not just dragging. |

### Added to P1 (differentiation)
| Item | Why |
|---|---|
| **Design Intelligence rule engine** (Design Constraints · Manufacturing Rules · Hardware Rules · Design Automation) | This is *the* admin-side moat. A modular kitchen chain *needs* "shutter > 600mm requires center support" type rules. |
| **Branch / version history** | The pitch is "let designers fork a client design without losing the master". Big perceived value, modest implementation cost. |
| **Real-time collaboration ("View live co-designers")** | Two designers, one client meeting, one screen. |
| **Render Gallery + Auto-Presentation (Beta)** | Captured renders accumulate as a project's gallery; AI auto-builds client decks from them. |
| **Sub-business-unit hierarchy** (Org → BU → User) | Required to sell to chains with regional dealers. |
| **Service-charge & scheduled pay** (in Settings) | Project-milestone payment plumbing. |
| **QC / Violations / Raw Materials / Work Schedule** in Outputs | The production handoff lattice. |
| **Production Design (production.infurnia.com) + MES handoff** | Closes the design → factory loop entirely. |

### Added to P2 (nice to have)
- **2000+ feature flags / per-BU customization** — only matters when Design OS lands its 50th customer.
- **Inter-org SKU subscription (marketplace)** — second-order network-effect play.

---

## 14. Revised "Beat Infurnia" plan

The original world-class moves (§7) still hold, but priority order shifts after seeing what Infurnia really has:

1. **AI-native design** (§7.1) — Infurnia's AI is *narrow* (one beta button for floorplan import, one for auto-presentation). The space to land an AI copilot that lives in the property panel, suggests layouts, generates BOQs in Hindi, traces sketches, and chats with the designer is **wide open**.
2. **Branching ↔ AI variants** — combine §7.1 with §12.5: every AI-generated alternative becomes a Git branch the designer can compare side-by-side. Infurnia has branches but no AI; Design OS gets both, integrated.
3. **Cabinet → Panel data model + production handoff** — this is the data-model debt to repay before any of the marketing claims feel true. After this lands, Design OS can credibly export a factory-ready BOQ.
4. **Mobile read-only / AR Quick Look** (§7.3) — still the highest-leverage move on the *sales* side. Clients walk away with a phone-shareable, AR-viewable design. Infurnia is desktop-only.
5. **Pricing model** (§7.5) — Infurnia's 2000+ feature flags = 2000+ ways for customers to feel nickel-and-dimed. Design OS's "one-license, no per-seat" pitch becomes sharper.
6. **Open catalog schema** (§7.4) — Infurnia already has inter-org SKU subscription. Design OS's edge is *open* schema vs Infurnia's proprietary one.
7. **Studio OS** (§7.7) — long-term differentiator, but not the right v2 fight.

---

## 15. Concrete first 7 days

Given everything captured, the *immediate* week-1 actions (before any new feature):

1. **Repair data-model debt** — split `Furniture` into `Furniture → Panels[]` with per-panel finishes. The store rewrite is ~200 lines; the UI takes longer but starts paying off in BOQ accuracy immediately.
2. **Rename `InfurniaRibbon.tsx` → `DesignRibbon.tsx`** — and prune any "infurnia" references from the eventual production deliverable. Internal pattern reference is fine; product strings shouldn't carry the competitor's name.
3. **Ship `Branch` (version-history) as a flag-guarded prototype** — even a simple `branches[]` of `DesignSnapshot[]` in the same store, with a modal that mirrors Infurnia's *Versions & History* UI. Two days.
4. **Wire 3D CSG door/window cutouts** (deps in place, see §6 P0). Half a day.
5. **Object IDs on canvas** (`C# / F# / O# / W#`). Half a day.
6. **Surface keyboard shortcuts in the left rail** (mirror Infurnia's *To selection `Shift+X`* hint). Half a day.
7. **Add a Render Gallery view** (`OutputsCenter.tsx` already has the skeleton). One day.

By the end of week 1 Design OS leapfrogs Infurnia on three perceived features (Branching with AI variants on roadmap, Cleaner UX, Cutout doors/windows) while closing two parity gaps.

---

## 16. Open questions newly raised by live walkthrough

| # | Question |
|---|---|
| Q9 | Does Infurnia store cabinet/panel geometry as parametric (W/D/H + rules) or as baked meshes? If parametric, Design OS should *also* be parametric (matters for the Cabinet→Panel split). |
| Q10 | Does Infurnia's "Branch" actually merge, or only fork? (Couldn't merge in the test; just create + switch.) Either way, fork-only is fine for a v1 of Design OS. |
| Q11 | What's the auth model — does each app share session via cookie on `*.infurnia.com`? (Likely yes; cookie-based SSO.) Useful when designing Design OS auth. |
| Q12 | What happens when you push a design from `Design` → `Production Design`? Read-only fork? New design entity? This is the missing piece for the §7.2 "factory cut list" feature. |
| Q13 | How is MES wired to a single design? Probably via the project + production-design pair. Worth a dedicated walkthrough next session. |
| Q14 | What's the visual style of the Render output? (Sandeep's recording showed catalogue thumbnails as 3D renders, not photoreal renders; the Render tab's photoreal output was never captured.) |
| Q15 | The footer bar shows *"Suggestions will appear here when you select a tool."* — is this just static tooltips, or a real assistant? Worth investigating. |

---

## 17. Updated screenshots index

Live-walkthrough screenshots (captured 2026-05-12 in this session) cover:
- design.infurnia.com login screen
- design.infurnia.com project hub for Project1 (with Design1 thumbnail)
- All Projects listing (Project1 + Project4)
- Design1 canvas — Floorplan mode (kitchen with C12/C36/C37/F10/O10 labels)
- Each ribbon tab (Home / View / Insert / Draw / Architecture / Annotate / Render / Outputs) with full toolset visible
- Tooltips for **AI Floor (Beta) → "Import Floorplan (AI)"** and **Auto (Beta) → "Auto generate new presentation"** and **Branch → "Version History"**
- 3D mode showing rendered kitchen with cabinets, hood, window
- Cabinet C37 Properties panel — Dimensions, Finishes (Siberian Oak / 22291 SF Frosty White), Edgeband Linking, Position/Rotation
- Versions & History modal — All Branches / Active Branch tabs, master branch entries
- "..." menu — Elevations + Custom plans
- Design ▾ breadcrumb (Design / Presentation modes)
- Kitchen ▾ breadcrumb (Masterbedroom / Kitchen)
- admin.infurnia.com — Home with all 8 module cards (descriptions visible)
- admin Catalogue sidebar (Furniture / Accessories / Hardware / Building / Finishes / Templates)
- admin Project Hub sidebar (Projects / Design Templates)
- admin Design Intelligence sidebar (Rule Summary / Design Constraints / Manufacturing Rules / Hardware Rules / Design Automation)
- admin Billing & Usage sidebar (User Management / Usage Details / Budgets)
- admin Preferences and Settings sidebar (Preferences / Manufacturing Settings / Settings / Design App Configuration / Designer Input / Panel Pricing Templates / Construction Styles / Project Statuses / Room Type / Additional Parameters)
- "Access denied" + "User does not have required role in the business unit" errors (evidence of fine-grained RBAC at BU level)

These were viewed live and not saved to disk in this session — re-running with `save_to_disk=true` in a follow-up would persist them under `/Users/anup/Desktop/canvas/infurnia-image-referneces-live-2026-05-12/` if desired.

---

## 18. Project + design lifecycle flows (live capture 2026-05-12)

Captured directly from design.infurnia.com end-to-end.

### 18.1 Design hub home (`design.infurnia.com/`)

Layout:
- **Sidebar (left)** — *Rishu · Namaste Demo* identity block · **+ New Project** primary CTA · sidebar nav: **Recently Accessed** (default) · **All Projects** · **Deleted Items** · **Production Designs** (new-badge dot · "Know more" link below) · footer "Resources to help you" → **Tutorials in youtube** · **Help Documentation**.
- **Main pane** — *Recent Projects* section (project cards in grid; each card shows a 3D thumbnail, designs count badge, project name, client name, "11 min ago" relative-time, and ◀ ▶ arrows on hover to scroll the project's designs as a mini carousel) · *Recent Designs* section below (separate from projects; design cards with thumbnail + "In: <project>" + relative-time).
- **Top bar** — `infurnia` logo (home), **Admin** link (opens admin.infurnia.com), **MES** link (opens mes.infurnia.com), **R avatar**, **? help**, **fullscreen** icon, **logout** icon.

### 18.2 Create New Project flow

Click **+ Create new project** (top-right of Recent Projects) or **+ New Project** (sidebar):

**Modal: "New Project"**
| Field | Required | Default | Notes |
|---|---|---|---|
| Project Name* | Yes | Auto-suggested (`Project5`, next available number) | |
| Client Name | No | empty | |
| Client Details | No | empty | Free text |
| Project ID | No | empty | Free text (`0001`, `0002`, …) |

Button: **Create Project**.

Notably *missing* at create-time: **no status, no project type, no template, no building/floor selection** — those come later. Lean modal, friction-free.

### 18.3 Project view

After create (or click any project card) → URL becomes `design.infurnia.com/?project=<hex_id>` and shows a per-project page:

- Breadcrumb top-left: `← back · 📁 <Project Name>  ✏ (edit pencil)`
- Sub-header: `Client Name: <name>  |  Status: <status or "-">`
- Right: **Search Designs** · **Sort By: Recent ▾**
- Right meta: **No of Designs <count>**
- Grid of designs: first tile is always **+ Start New Design** (opens template selection); subsequent tiles are existing designs with hover-revealed **≡ hamburger menu**.

### 18.4 Edit Project modal (pencil icon)

Fields:
| Field | Notes |
|---|---|
| Project Name* | Required |
| Client Name | |
| Client Details | |
| Project ID | |
| **Project Status** ▾ | Native `<select>` |

**Status options (verified by inspecting the DOM):**
1. Design Phase *(default)*
2. Testing Phase
3. Execution Phase
4. Delivered
5. Initial design
6. Production drawing
7. Remeasurement drawing

Button: **Update**.

That's **7 statuses**, several explicitly modelling factory phases (Production drawing, Remeasurement drawing) — Design OS today has 4 (`Design Phase / In Review / In Production / Completed`), missing the production-engineering sub-states.

### 18.5 Design hamburger menu (per-design card actions)

Clicking the **≡** icon on a design tile reveals:

| Action | What it does |
|---|---|
| **Edit Name** | Inline rename |
| **Copy** | Duplicate the design within the same project |
| **Share** | Share modal (likely email + permission level) — *modal not captured this round* |
| **Lock** | Read-only freeze |
| **Send to Production** | Promotes the design into a Production Design (creates a row in the Production Designs page) |
| **Mark as template** | Saves design into Org Templates |
| **Additional Properties** | Custom metadata fields (org-defined) |
| **Delete** (red) | Soft-delete (moves to Deleted Items → Deleted Designs) |

The two unique-to-Infurnia moves here are **Send to Production** (one-click factory handoff) and **Mark as template** (turn a successful design into a reusable starting point).

### 18.6 Template Selection (on **Start New Design**)

Opens a full-screen modal **"Template Selection"** with three tabs:
- **All Templates** (default)
- **Org Templates** (this org's templates — populated by *Mark as template* above)
- **Default Templates** (Infurnia-curated)

Right of tabs: **🔍 Search the Template** input.

Tiles visible in the Default Templates view: **Kitchen · Bedroom · Blank · Living Room · Room · Villa** … (scrollable). Each tile has a render thumbnail + name. Hint text below: *"Click on any template to start designing."*

### 18.7 Account Settings modal (R avatar → Account Settings)

| Section | Fields |
|---|---|
| **User Details** | Name (editable) · Email Id (verified, read-only-looking) |
| **Active Organization** | `infurnia` logo + org name (current) |
| **User Organizations** | Searchable table of all orgs the user belongs to with **Active** indicator; allows switching |

So a single user has **identity-once, multi-org-membership** — important for designers freelancing across multiple studios.

R avatar dropdown also has: **Account Settings · Logout** (only two items at hub level; the canvas-level avatar additionally shows **View live co-designers · Preview as Designer** — those are scoped to a design).

### 18.8 Deleted Items page

Two tabs at the top:
- **Deleted Designs** — searchable; empty state: *"No Deleted Designs"*
- **Deleted Projects** — searchable separately; empty state: *"No Deleted Projects"*

So deletes are split design-vs-project, each with its own bin. (Restore + permanent-delete affordances likely appear per-row when populated — couldn't capture without first deleting something.)

### 18.9 Production Designs page

Tabs: **In Progress** (active) | **Archived**.
Top right: ℹ **"What's a Production Design?"** help link.
Sub-header: `Viewing <N> Production Designs`.
Right: **🔍 Search Name / Client** · **Filters** (button — drawer) · list/grid toggle.

**Table columns:** `NAME` · `TYPE` · `CLIENT` · `USER` · `STATUS` · `ACTIONS`

Live rows in Rishu's view (org-shared sample data):
1. `Project2 – Design1` · Same design · N/A · seema.awaradi@infurnia.com · Not Started · ✏ ≡
2. `Project1 – Design1` · Same design · Bhagyashri · rishu@namastedesign.in · Not Started · ✏ ≡

**Type: "Same design"** suggests the production design is a *live link* back to the source design rather than a fork — interesting design decision. Status `Not Started` implies a state machine that probably goes *Not Started → In Progress → Completed/Archived*. Per-row actions: edit (pencil) and a menu.

This page is the **bridge between Design and MES** — once you "Send to Production" from a design, it lands here as a row, gets assigned to a production designer (USER column), and eventually flows into the MES factory floor.

### 18.10 New finding: footer "Resources to help you"

- **Tutorials in youtube** — opens external YouTube playlist.
- **Help Documentation** — opens docs.

Suggests Infurnia leans heavily on video onboarding (those inline tutorial videos in property panels are part of the same content strategy).

---

## 19. Final summary — *what to copy, what to invent*

### Things Design OS should **copy** from Infurnia (proven patterns; no need to reinvent)

1. Two-app architecture (canvas + admin) — keep them physically separated by URL and role.
2. **Project → Designs** hierarchy (one project owns many design files). Design OS today has a flat project-and-design conflation.
3. **Status enum** at both Project and Design level (the 7-status project enum is overkill for now — but 5 is right).
4. Per-design hamburger menu with **Send to Production**, **Mark as template**, **Copy**, **Share**, **Lock**, **Edit Name**, **Additional Properties**, **Delete**.
5. **Versions & History modal** with branches (defer merge; just fork-and-switch is enough).
6. Template Selection modal: All / Org / Default tabs + search.
7. Multi-org membership at the user level.
8. Soft-delete with **separate Deleted Designs / Deleted Projects bins**.
9. **Production Designs page** as the bridge from Design → Factory.
10. Inline tutorial videos in property panels (or the equivalent — a Claude/Gemini-powered tooltip would be even better).
11. **WASD + QE camera flight** controls in 3D.
12. **Object IDs** auto-numbered (`C# / F# / O# / W#`).
13. **Cabinet → Panel** decomposition with per-face finishes.
14. **Live co-designer indicator** (presence chips for any user currently in the same design).
15. Inline keyboard-shortcut hints on the left rail (`Shift + X`, `Shift + Z` etc.).

### Things Design OS should **invent** (where Infurnia is weak or absent)

1. **AI-native everything** — Infurnia's AI is two narrow betas (Import Floorplan, Auto Presentation). Design OS should have a full Claude/Gemini copilot panel that lives next to the Properties inspector: "make this room look like a Pinterest reference", "suggest a layout", "generate the BOQ summary in Hindi".
2. **Branch + AI variants** — each AI generation lives as a Git branch the designer can preview side-by-side.
3. **Open catalog schema + public marketplace** — Infurnia's "Subscribe to other's stores" is inter-org but proprietary. Design OS's edge is *open* (any vendor publishes, any studio subscribes, no rev share).
4. **One-time studio license** instead of per-seat SaaS rent (LAUNCH.md promise).
5. **Mobile/AR client view** — every design gets a public URL with WebXR + .usdz Quick Look.
6. **Local-first / offline-first** via Tauri (LAUNCH.md roadmap).
7. **WhatsApp-first share** instead of e-mail-first.
8. **Indian-margin pricing baked into BOQ** (sales-channel pricing for Mumbai vs Pune vs Indore).
9. **Pure Konva + R3F + Zustand stack** = better browser perf than Infurnia's heavier custom WebGL engine (anecdotally, Infurnia's 3D mode took 5+ seconds to load Design1 — Design OS should target <1s).
10. **In-app voice / chat assistant** (use any LLM) so site-visit notes ("client wants the wardrobe taller") become design edits.

---

*End of dump v3. Length: ~1,100 lines. Coverage: design.infurnia.com (every ribbon tab, every dropdown, every modal, every hub flow), admin.infurnia.com (sidebar tree + module cards), the Production Designs bridge, project/design lifecycle, account model, deleted-items model, 51 reference screenshots, full Design OS source-code inventory, and a comparison-driven roadmap. Remaining gaps: production.infurnia.com canvas, mes.infurnia.com factory floor, the Share modal payload, full network-API enumeration. Those are next-session work.*
