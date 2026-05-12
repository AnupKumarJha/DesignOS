#!/usr/bin/env node
/**
 * Sketchfab catalog scraper — discovers CC-licensed furniture models matching
 * search queries and emits a `catalog-import.json` in the SAME shape that
 * `CatalogAdminModal.tsx → handleImportScrapeJson()` already understands.
 *
 * Pipeline:
 *   1. Read queries from --input JSON (see catalog-sources-sketchfab.example.json)
 *   2. For each query, hit the public Sketchfab Data API v3 (no auth required for search)
 *   3. Filter by license (cc0 / by / by-sa) and `downloadable=true`
 *   4. Write structured metadata to catalog-import.json
 *   5. Open the app → Catalog Admin → Import Scrape JSON → for each pending
 *      item, click the source URL, sign into Sketchfab (free), download .glb,
 *      then "Upload Model" in the modal to attach it.
 *
 * Why this design:
 *   - Sketchfab's *download* endpoints require OAuth per user; the search
 *     endpoint does not. Doing search programmatically + download manually is
 *     the fastest legal path for now.
 *   - Mirrors the shape of `catalog-scrape-3dw.mjs` so importStatus/admin flow
 *     stays identical regardless of source.
 *
 * Usage:
 *   npm run catalog:scrape-sf -- --input ./catalog-sources-sketchfab.json \
 *     --out ./catalog-import.json --limit 60
 */

import fs from 'node:fs/promises';

const args = parseArgs(process.argv.slice(2));
const inputPath = args.input;
const outPath = args.out || './catalog-import.json';
const perQuery = Number(args['per-query'] || 8);
const overallLimit = Number(args.limit || 200);
const license = (args.license || 'by,by-sa,cc0').toLowerCase();
const apiBase = 'https://api.sketchfab.com/v3/search';

if (!inputPath) {
  console.error('Usage: npm run catalog:scrape-sf -- --input ./catalog-sources-sketchfab.json --out ./catalog-import.json');
  console.error('Optional: --per-query 8 --limit 200 --license by,by-sa,cc0');
  process.exit(1);
}

const sources = normalizeSources(JSON.parse(await fs.readFile(inputPath, 'utf8')));
const items = [];

for (const source of sources) {
  if (items.length >= overallLimit) break;
  const q = source.query;
  if (!q) continue;

  const params = new URLSearchParams({
    type: 'models',
    q,
    downloadable: 'true',
    license,
    sort_by: '-likeCount',
    count: String(Math.min(perQuery, 24)),
  });
  if (source.tags) params.set('tags', source.tags);
  const url = `${apiBase}?${params.toString()}`;

  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      items.push({
        status: 'failed',
        sourceProvider: 'sketchfab',
        query: q,
        error: `HTTP ${res.status} ${res.statusText}`,
        sourceUrl: url,
      });
      continue;
    }
    const data = await res.json();
    const results = (data.results || []).slice(0, perQuery);
    if (results.length === 0) {
      items.push({
        status: 'no_results',
        sourceProvider: 'sketchfab',
        query: q,
        sourceUrl: url,
        licenseNote: 'No CC-downloadable models matched. Try broader keywords or fall back to 3D Warehouse.',
      });
    }
    for (const m of results) {
      const lic = m.license?.label || m.license?.slug || 'unknown';
      items.push({
        status: 'scraped',
        sourceProvider: 'sketchfab',
        title: m.name || `Sketchfab Item`,
        name: m.name || `Sketchfab Item`,
        query: q,
        sourceUrl: m.viewerUrl || `https://sketchfab.com/3d-models/${m.uid}`,
        thumbnail: pickThumb(m),
        thumbnailUrl: pickThumb(m),
        sourceThumbnailUrl: pickThumb(m),
        author: m.user?.displayName || m.user?.username || '',
        tags: (m.tags || []).map((t) => t.name || t).slice(0, 12),
        license: lic,
        licenseNote: `License: ${lic}. Verify attribution requirements before publishing.`,
        sketchfabUid: m.uid,
        downloadable: !!m.isDownloadable,
        polyCount: m.faceCount || null,
        // Catalog-side defaults — the admin modal will let us adjust before publish.
        assetFormat: 'glb',
        importStatus: 'pending',
      });
      if (items.length >= overallLimit) break;
    }
  } catch (err) {
    items.push({
      status: 'failed',
      sourceProvider: 'sketchfab',
      query: q,
      error: err instanceof Error ? err.message : String(err),
      sourceUrl: url,
    });
  }

  // Be polite — public API doesn't document a hard limit, but we're not in a hurry.
  await delay(Number(args.delay || 900));
}

const output = {
  generatedAt: new Date().toISOString(),
  sourceProvider: 'sketchfab',
  mode: 'metadata-links-only',
  notes: [
    'Sketchfab Data API v3 search results filtered to CC-downloadable models.',
    'Actual GLB files must be downloaded by a signed-in human (free Sketchfab account).',
    'After importing this JSON via CatalogAdminModal, attach each .glb via the Upload Model button.',
  ],
  items: dedupe(items.filter(Boolean)),
};

await fs.writeFile(outPath, JSON.stringify(output, null, 2));
console.log(`Wrote ${output.items.length} item(s) to ${outPath}`);
console.log(`  scraped: ${output.items.filter((i) => i.status === 'scraped').length}`);
console.log(`  empty:   ${output.items.filter((i) => i.status === 'no_results').length}`);
console.log(`  failed:  ${output.items.filter((i) => i.status === 'failed').length}`);

// ──────────────────────────────────────────────────────────────────────
// helpers
// ──────────────────────────────────────────────────────────────────────

function pickThumb(m) {
  const list = m.thumbnails?.images || [];
  // Prefer ~512px so the catalog tile looks crisp without being huge.
  const pick = list.find((img) => img.width && img.width >= 480 && img.width <= 720) || list[0];
  return pick?.url || '';
}

function normalizeSources(input) {
  const rows = Array.isArray(input) ? input : input.sources || input.queries || input.items || [];
  return rows.map((entry) => (typeof entry === 'string' ? { query: entry } : entry))
    .filter((entry) => entry?.query);
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    parsed[key] = argv[i + 1]?.startsWith('--') ? 'true' : argv[++i];
  }
  return parsed;
}

function dedupe(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = row.sketchfabUid || row.sourceUrl || row.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
