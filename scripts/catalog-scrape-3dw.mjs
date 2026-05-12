#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const args = parseArgs(process.argv.slice(2));
const inputPath = args.input;
const outPath = args.out || './catalog-import.json';
const cacheDir = args.cache || './.cache/catalog-scrape-3dw';
const limit = Number(args.limit || 24);

if (!inputPath) {
  console.error('Usage: npm run catalog:scrape-3dw -- --input ./catalog-sources.json --out ./catalog-import.json');
  process.exit(1);
}

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('Missing dependency: playwright. Install with `npm install -D playwright` and run `npx playwright install chromium` once.');
  process.exit(1);
}

await fs.mkdir(cacheDir, { recursive: true });
const sources = normalizeSources(JSON.parse(await fs.readFile(inputPath, 'utf8'))).slice(0, limit);
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  userAgent: 'NamasteDesignOSCatalogPrototype/0.1 metadata-review',
});

const items = [];
for (const [index, source] of sources.entries()) {
  const cacheKey = crypto.createHash('sha1').update(JSON.stringify(source)).digest('hex');
  const cachePath = path.join(cacheDir, `${cacheKey}.json`);
  const cached = await readJson(cachePath);
  if (cached) {
    items.push(...cached.items);
    continue;
  }

  const page = await context.newPage();
  try {
    const scraped = source.url
      ? [await scrapeModelPage(page, source.url, index)]
      : await scrapeSearchPage(page, source.query, source.maxResults || 6);
    await fs.writeFile(cachePath, JSON.stringify({ source, items: scraped }, null, 2));
    items.push(...scraped);
  } catch (error) {
    items.push({
      status: 'failed',
      sourceProvider: '3dwarehouse',
      sourceUrl: source.url || '',
      query: source.query || '',
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    await page.close();
  }

  await delay(Number(args.delay || 1250));
}

await browser.close();

const output = {
  generatedAt: new Date().toISOString(),
  sourceProvider: '3dwarehouse',
  mode: 'metadata-links-only',
  items: dedupe(items.filter(Boolean)),
};

await fs.writeFile(outPath, JSON.stringify(output, null, 2));
console.log(`Wrote ${output.items.length} item(s) to ${outPath}`);

async function scrapeSearchPage(page, query, maxResults) {
  if (!query) return [];
  const url = `https://3dwarehouse.sketchup.com/search/?q=${encodeURIComponent(query)}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3500);
  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="/model/"]'))
      .map((a) => a.href)
      .filter(Boolean),
  );
  const unique = Array.from(new Set(links)).slice(0, maxResults);
  if (unique.length === 0) {
    return [{
      status: 'no_results',
      sourceProvider: '3dwarehouse',
      title: `Search: ${query}`,
      name: `Search: ${query}`,
      query,
      sourceUrl: url,
      tags: [query],
      licenseNote: 'No model links were found from the JS-rendered search page. Use curated model URLs for reliable prototype ingestion.',
    }];
  }
  const results = [];
  for (const link of unique) {
    results.push(await scrapeModelPage(page, link, results.length));
    await delay(700);
  }
  return results;
}

async function scrapeModelPage(page, url, index) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3000);
  return page.evaluate(({ index }) => {
    const meta = (name) =>
      document.querySelector(`meta[property="${name}"]`)?.getAttribute('content') ||
      document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ||
      '';
    const title =
      meta('og:title') ||
      document.querySelector('h1')?.textContent?.trim() ||
      document.title.replace(/\s*\|\s*3D Warehouse.*$/i, '').trim() ||
      `3D Warehouse Item ${index + 1}`;
    const thumbnail =
      meta('og:image') ||
      document.querySelector('img[src*="3dwarehouse"], img[src*="sketchup"]')?.getAttribute('src') ||
      '';
    const bodyText = document.body?.innerText || '';
    const authorMatch = bodyText.match(/(?:By|Author|Created by)\s+([^\n]+)/i);
    const tags = Array.from(new Set(
      bodyText
        .split(/\n|,|·/)
        .map((part) => part.trim())
        .filter((part) => part.length > 2 && part.length < 32)
        .filter((part) => /sofa|bed|chair|table|cabinet|kitchen|wardrobe|sink|desk|tv|vanity|decor|light/i.test(part))
        .slice(0, 12),
    ));
    return {
      status: 'scraped',
      sourceProvider: '3dwarehouse',
      title,
      name: title,
      url: location.href,
      sourceUrl: location.href,
      thumbnail,
      thumbnailUrl: thumbnail,
      sourceThumbnailUrl: thumbnail,
      author: authorMatch?.[1]?.trim() || '',
      tags,
      licenseNote: '3D Warehouse metadata prototype import. Verify rights and manually attach approved GLB/GLTF before production use.',
    };
  }, { index });
}

function normalizeSources(input) {
  const rows = Array.isArray(input) ? input : input.sources || input.items || [];
  return rows.map((entry) => {
    if (typeof entry === 'string') {
      return entry.startsWith('http') ? { url: entry } : { query: entry };
    }
    return entry;
  }).filter((entry) => entry?.url || entry?.query);
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

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

function dedupe(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = row.sourceUrl || row.url || row.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
