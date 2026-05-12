# Design OS — Asset Library Plan

> **For:** Namaste Design Studios — Anup Jha
> **Date:** 2026-05-12
> **Companion to:** `DESIGN_OS_SPEED_FIRST_PLAN.md` (§7 catalog), `DESIGN_OS_ASSET_LOG.xlsx`
> **Goal:** Build a 200 → 500-item furniture & decor library that renders hyperreal in the existing Three.js / R3F canvas.

---

## 0. One-line answer

**Don't make `sketchup.cgtips.org` the primary source — it's SKP-only, and your render pipeline is GLB-only.** Make Sketchfab the primary, Poly Haven the hero tier, and keep 3D Warehouse / cgtips as a metadata-only fallback. The catalog admin flow you've already built (`CatalogAdminModal.tsx` + `putCatalogAsset` in IndexedDB) handles the rest with zero schema changes.

---

## 1. What I found in your codebase

| Layer | File | What it tells us |
|---|---|---|
| Render | `src/components/viewport-3d/Furniture3D.tsx:189` | Uses `useGLTF` from `@react-three/drei` → **GLB/GLTF only**. Falls back to procedural geometry when `modelUrl` is missing. |
| Schema | `src/data/catalog.ts:38–55` | `FurnitureCatalogItem` already has `modelUrl`, `thumbnailUrl`, `modelAssetId`, `sourceProvider`, `licenseNote`, `importStatus`, `assetFormat: 'glb' \| 'gltf'`. **No migration needed.** |
| Storage | `src/lib/db.ts:174` | `putCatalogAsset()` writes the GLB blob into IndexedDB store `catalogAssets`. Permanent and offline-ready. |
| Admin UI | `src/components/ui/CatalogAdminModal.tsx` | Already handles: Import Scrape JSON → list of pending items → Upload GLB per item → Publish. **No new UI work required.** |
| Existing scraper | `scripts/catalog-scrape-3dw.mjs` | Playwright-based 3D Warehouse metadata scraper. Produces `catalog-import.json` consumed by the admin modal above. |
| Current catalog | `src/data/catalog.ts` | **43 items** across 26 groups, covering all 8 room types. Procedural-only — no real GLBs attached yet. |

**You're 90% of the way there.** The infrastructure for ingesting GLBs is built. What's missing is (a) more source channels and (b) the actual GLB files.

---

## 2. Why not just scrape cgtips.org

| Claim | Reality |
|---|---|
| "4,178 free furniture models" | ✅ True |
| "Free for personal + commercial use" | ⚠️ Resells 3D Warehouse content. License clarity per-item is poor. |
| "Compatible with our app" | ❌ **All `.skp`**. Your renderer needs GLB. Each conversion needs SketchUp Pro (paid) or reaConverter CLI (paid, Windows-only). 4,178 conversions = weeks of work, not minutes. |
| "Programmatically downloadable" | ❌ Pages are JS-rendered, downloads are gated by ads + countdown. Brittle to scrape, ToS-iffy to bulk-grab. |

**Verdict:** Use cgtips as a *reference catalog* — i.e. "ok, what kinds of TV cabinets exist?" — and as a fallback for niche Indian-style items not on Sketchfab. Don't make it the pipeline.

---

## 3. Recommended source stack

| Rank | Source | Format | Auto-download? | Use for |
|---|---|---|---|---|
| 1 | **Sketchfab** Data API | GLB | API search ✅, GLB download requires free user sign-in | **80% of the library.** 500K+ models, real GLBs, CC-BY / CC0 filter, react-three-fiber's native format. |
| 2 | **Poly Haven** | GLB | Direct HTTPS URL ✅ | **Hero pieces.** Only ~150 furniture items but they're truly photoreal CC0. Use for the showcase sofas, beds, dining tables. |
| 3 | **OpenSource3D / Meshy CC0** | GLB | Direct download ✅ | Generic decor objects (plants, vases, books). |
| 4 | **3D Warehouse** | SKP (some GLB) | Metadata via your existing scraper | Indian-style / regional / oddball items not on Sketchfab. |
| 5 | **sketchup.cgtips.org** | SKP | Manual | Reference / inspiration only. |
| 6 | **BlenderKit** free tier | BLEND + GLB | API w/ key | Optional later, ~$10/mo for premium pieces. |

Full ranking with notes is in `DESIGN_OS_ASSET_LOG.xlsx → Sources` sheet.

---

## 4. The 80% requirements list (200–500 items)

Detailed breakdown is in `DESIGN_OS_ASSET_LOG.xlsx → Categories` sheet. Summary:

| Room | Target items | Existing in catalog | Gap |
|---|---|---|---|
| Kitchen | 45 | 11 | 34 |
| Bedroom | 35 | 7 | 28 |
| Living | 40 | 9 | 31 |
| Dining | 20 | 5 | 15 |
| Bathroom | 20 | 3 | 17 |
| Office | 15 | 4 | 11 |
| Kids | 10 | 1 | 9 |
| Outdoor | 10 | 0 | 10 |
| Lighting (cross-room) | 30 | 0 | 30 |
| Decor / accents (cross-room) | 25 | 0 | 25 |
| **Total** | **250** | **40** | **210** |

The Master sheet of the XLSX lists 246 pre-named items ready to source — start at row 2 and work down.

### Indian-style notes baked in
- **Loft cabinets** above wardrobes (uniquely Indian)
- **Hydraulic storage beds** (apartment-driven space saving)
- **Pooja niche / unit** (call out — sometimes integrates with TV wall)
- **Cane / rattan** furniture (the Scandinavian-Indian crossover)
- **Ceiling fan with light** (essential, separate item)
- **Health faucet / jet spray** in bathroom
- **Crockery / showcase unit** (display is culturally important)
- **Jhula (balcony swing)** for outdoor
- **Brass artefacts** for decor

These are flagged in the Categories sheet so you can prioritise them once you onboard your first Indian customer.

---

## 5. The pipeline — one designer can run this solo

```
┌─ Pick batch ──────┐   ┌─ Scrape ───────┐   ┌─ Convert (only ─┐   ┌─ Import ───────┐   ┌─ Attach + tune ┐   ┌─ Publish ──────┐
│ Categories.xlsx   │ → │ npm run         │ → │ if SKP — usually │ → │ Catalog Admin   │ → │ Upload GLB,     │ → │ Item appears   │
│ pick next 10-20   │   │ catalog:scrape  │   │ skip this step) │   │ → Import JSON   │   │ tune scale +    │   │ in sidebar     │
│ items             │   │ -sf             │   │ via SketchUp    │   │ (already built) │   │ rotation        │   │ for designers  │
└───────────────────┘   └─────────────────┘   └─────────────────┘   └─────────────────┘   └─────────────────┘   └────────────────┘
        5 min                10 min                3 min / SKP            30 sec               1 min / item            10 sec
```

For 10 items: **~25 min if all GLB direct, ~60 min if mixed with SKP conversions.**
For 200 items: realistically **a 1–2 week sprint** at a steady pace, faster if you batch by category.

Full step-by-step is in `DESIGN_OS_ASSET_LOG.xlsx → Pipeline` sheet.

---

## 6. What I built for you in this session

| Deliverable | Path | What it does |
|---|---|---|
| **Asset tracking log** | `DESIGN_OS_ASSET_LOG.xlsx` | 246 pre-named items, dropdown statuses, room-by-room dashboard, source ranking, 80% category list, step-by-step pipeline. The single source of truth for the project. |
| **Sketchfab scraper** | `scripts/catalog-scrape-sketchfab.mjs` | Mirrors the shape of `catalog-scrape-3dw.mjs` but hits the Sketchfab Data API with CC license filter + downloadable=true. Outputs the same `catalog-import.json` your admin modal already reads. |
| **Sample query list** | `scripts/catalog-sources-sketchfab.example.json` | 45 pre-written queries covering kitchen, bedroom, living, dining, bath, office, kids, outdoor, lighting, decor. Edit and run. |
| **npm script** | `package.json` — `catalog:scrape-sf` | One command: `npm run catalog:scrape-sf -- --input ./scripts/catalog-sources-sketchfab.example.json --out ./catalog-import.json --per-query 6 --limit 200`. |

No code in `src/` was modified — your existing admin modal and IndexedDB pipeline ingest the new output as-is.

---

## 7. How to verify it works (15-minute smoke test)

1. `cd` to the project, run `npm install` if you haven't recently
2. `npm run catalog:scrape-sf -- --input ./scripts/catalog-sources-sketchfab.example.json --out ./catalog-import.json --per-query 4 --limit 30`
3. Open `catalog-import.json` — confirm ~30 items with `status: "scraped"`, thumbnails, and Sketchfab URLs
4. `npm run dev`, open the app, click **Ribbon → Catalog Admin** → **Import Scrape JSON** → select the file
5. 30 pending items appear in the modal. Pick any one — click its source URL, sign into Sketchfab (free), download the .glb, come back, **Upload Model** → **Publish**
6. Close modal → open **Catalog Sidebar** → that item is now in the catalog → drop it onto the canvas → switch to 3D → the real GLB renders

If this works, scale up the `--limit` and burn through the Master sheet.

---

## 8. Hyperreal rendering — what to wire next

You asked for "hyperrealistic". The library is the input — the renderer needs to do its job too. From your existing code, these are the four wins after the GLBs land:

| What | Why | File |
|---|---|---|
| **HDRI environment map** | Free + transformative lift in realism | `Scene3D.tsx` — drei `<Environment files="..hdr">`. Use Poly Haven HDRIs (CC0). |
| **PBR materials with map / normal / roughness** | Most GLBs already ship with these, you just need to not strip them | Already supported via `meshPhysicalMaterial` in `Furniture3D.tsx:174` |
| **AO + Bloom + DoF in render mode** | You have postprocessing + SSAO; turn on render-only effects | `RenderRoomKit.tsx` — wire `@react-three/postprocessing` |
| **Decompress in browser** | Use draco / meshopt compression on your GLBs to keep load under 200ms | Add `useGLTF.preload(url)` and use `gltf-pipeline` to draco-encode |

These are all in your existing stack. None requires a new dependency.

---

## 9. Open questions (worth answering soon)

1. **Storage strategy at scale.** IndexedDB is fine for 200 items × ~2MB = 400MB. For 500 items, you'll cross 1GB. Consider moving heroes to a CDN (Cloudflare R2 / S3) and treating IndexedDB as offline-cache only.
2. **Sketchfab credit display.** CC-BY requires attribution. Add a "Credits" tab in the project export (you already export PDFs in `outputs.ts`) that lists each used asset's author and source URL.
3. **One-time SKP→GLB pipeline.** If you do find 30–40 "must-have" Indian items on cgtips/3DW that don't exist on Sketchfab, batch-convert them once via SketchUp Pro's File → Export → glTF Binary. ₹ 3,000/month for one designer with SketchUp Pro is cheaper than your time.
4. **AI-staging fallback.** When a designer searches the catalog and the right item isn't there, the W7 spec already hints at "AI-generate variant". For v1, surface "Closest matches" + "Request item" → adds the missing item to backlog row in `DESIGN_OS_ASSET_LOG.xlsx`.

---

## 10. Sequencing

**Today (after this doc lands):**
- Open the XLSX, verify the categories list matches your taste
- Run the 15-minute smoke test in §7

**Week 1 — first 50 items:**
- Run the Sketchfab scraper with all 45 queries → ~200 candidates
- Curate down to 50 best in the admin modal, attach GLBs, publish
- Take one rendered screenshot per item for the catalog tile

**Week 2 — second 50 + Poly Haven heroes:**
- Hit Poly Haven for the 6–8 hero pieces (best sofa, bed, dining table, lounge chair)
- Fill in the 80% list with another 50 Sketchfab items
- Wire HDRI environment + draco compression

**Week 3 — Indian + niche items:**
- Use the existing 3DW scraper for Indian-style items (cane chairs, jhula, brass accents)
- Batch-convert any SKP-only must-haves
- Reach 200 published — pause and ship to designers for feedback

**Week 4 — push to 350-500:**
- Decor / accent objects (plants, vases, soft furnishings)
- Lighting fixtures (this is where Sketchfab is strongest)
- Multiple style variants of top items (so "sofa" gives 6 visual choices)

---

## Appendix — quick reference

- **Catalog schema (do not change):** `src/data/catalog.ts → FurnitureCatalogItem`
- **Add an item manually:** Catalog Admin modal → "New Manual Item" (already there)
- **Where assets live:** IndexedDB store `catalogAssets`, keyed by `modelAssetId`
- **How the renderer picks GLB vs procedural:** `Furniture3D.tsx:55` — if `renderMode || item.modelAssetId` use GLB
- **Where to put new sources:** copy `catalog-sources-sketchfab.example.json` to your own `catalog-sources-bedroom.json`, edit, run scraper

That's the plan. The XLSX is your daily driver from here.
