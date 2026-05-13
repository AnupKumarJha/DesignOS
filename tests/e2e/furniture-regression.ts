import { chromium, type Page } from 'playwright';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { furnitureCatalog, getMaterial } from '../../src/data/catalog';
import type { DesignQaHarness } from '../../src/lib/qaHarness';

const PORT = Number(process.env.E2E_PORT ?? 4173);
const BASE_URL = `http://127.0.0.1:${PORT}/?qa=furniture`;
const ARTIFACT_DIR = 'tests/e2e/artifacts';

declare global {
  interface Window {
    __DESIGN_OS_QA__?: DesignQaHarness;
  }
}

async function main() {
  await mkdir(ARTIFACT_DIR, { recursive: true });
  const server = await startVite();
  const browser = await chromium.launch({ headless: process.env.E2E_HEADED !== '1' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = collectPageErrors(page);

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForFunction(() => Boolean(window.__DESIGN_OS_QA__), undefined, { timeout: 30_000 });

    await runCatalogSmoke(page, errors);
    await runFocusedRegressions(page, errors);

    console.log('Furniture e2e regression suite passed.');
  } finally {
    await browser.close();
    stopVite(server);
  }
}

async function runCatalogSmoke(page: Page, errors: string[]) {
  for (const item of furnitureCatalog) {
    const caseName = `catalog-${item.id}`;
    await runCase(page, errors, caseName, async () => {
      await resetAndPlace(page, item.id);
      await setViewMode(page, '3D');
      await expectVisible(page, '[data-testid="scene-3d"]', `${item.id} 3D scene`);
      await expectVisible(page, '[data-testid="properties-sidebar"]', `${item.id} properties sidebar`);
      await expectVisible(page, '[data-testid="generated-parts-list"]', `${item.id} generated parts`);
      await expectVisible(page, '[data-testid="furniture-exterior-finish"]', `${item.id} exterior finish`);

      if (isOpenable(item)) {
        await page.evaluate(() => window.__DESIGN_OS_QA__!.openSelectedFurniture());
        await page.waitForTimeout(250);
        const openState = await selectedFurnitureField(page, 'openState');
        assert(openState === 'open', `${item.id} should open through the QA harness`);
      }

      await expectNoPageErrors(errors, caseName);
    });
  }
}

async function runFocusedRegressions(page: Page, errors: string[]) {
  await runCase(page, errors, 'base-cabinet-material-precedence', async () => {
    await resetAndPlace(page, 'cabinet_base');
    await setViewMode(page, '3D');
    await page.evaluate(() => window.__DESIGN_OS_QA__!.openSelectedFurniture());
    await page.getByTestId('furniture-exterior-finish').selectOption({ label: 'Opal Green · Solid Paints' });
    await page.waitForTimeout(250);
    const expected = getMaterial('paint_opal_green')?.color;
    assert(expected, 'paint_opal_green must exist in material catalog');
    await expectInputValue(page, '[data-testid="furniture-exterior-color-value"]', expected!, 'Opal Green exterior color');
    await expectNoPageErrors(errors, 'base-cabinet-material-precedence');
  });

  await runCase(page, errors, 'base-cabinet-selected-part-override-reset', async () => {
    await resetAndPlace(page, 'cabinet_base');
    await setViewMode(page, '3D');
    await page.locator('[data-testid="furniture-part-row"][data-part-type="shutter"]').first().click();
    await expectVisible(page, '[data-testid="selected-part-editor"]', 'selected part editor');
    await page.getByTestId('selected-part-color-value').fill('#ff0000');
    await expectInputValue(page, '[data-testid="selected-part-color-value"]', '#ff0000', 'selected part override');
    await page.getByTestId('selected-part-reset-overrides').click();
    await page.waitForTimeout(250);
    const value = await page.getByTestId('selected-part-color-value').inputValue();
    assert(value !== '#ff0000', 'selected part reset should remove the explicit red override');
    await expectNoPageErrors(errors, 'base-cabinet-selected-part-override-reset');
  });

  await runCase(page, errors, 'drawer-unit-open-group', async () => {
    await resetAndPlace(page, 'drawer_unit');
    await setViewMode(page, '3D');
    await page.evaluate(() => window.__DESIGN_OS_QA__!.openSelectedFurniture());
    assert(await selectedFurnitureField(page, 'openState') === 'open', 'drawer unit opens');
    await expectText(page, 'Drawer Box 1', 'drawer box generated');
    await expectText(page, 'Runner Pair 1', 'runner generated');
    await expectText(page, 'Drawer Handle 1', 'drawer handle generated');
    await expectNoPageErrors(errors, 'drawer-unit-open-group');
  });

  await runCase(page, errors, 'real-mode-renders-selected-furniture', async () => {
    await resetAndPlace(page, 'cabinet_base');
    await page.evaluate(() => window.__DESIGN_OS_QA__!.setRealMode(true));
    await expectVisible(page, '[data-testid="scene-3d-real"]', 'real mode 3D scene');
    await expectNoPageErrors(errors, 'real-mode-renders-selected-furniture');
  });

  await runCase(page, errors, 'split-view-keeps-3d-and-properties', async () => {
    await resetAndPlace(page, 'cabinet_base');
    await setViewMode(page, 'SPLIT');
    await expectVisible(page, '[data-testid="floor-plan"]', 'split floor plan');
    await expectVisible(page, '[data-testid="scene-3d"]', 'split 3D scene');
    await expectVisible(page, '[data-testid="properties-sidebar"]', 'split properties sidebar');
    await expectNoPageErrors(errors, 'split-view-keeps-3d-and-properties');
  });
}

async function resetAndPlace(page: Page, catalogItemId: string) {
  const placedId = await page.evaluate((id) => {
    window.__DESIGN_OS_QA__!.resetProject('Kitchen');
    return window.__DESIGN_OS_QA__!.placeFurniture(id);
  }, catalogItemId);
  assert(placedId, `Could not place catalog furniture ${catalogItemId}`);
  await expectVisible(page, '[data-testid="properties-sidebar"]', `${catalogItemId} selected`);
}

async function setViewMode(page: Page, mode: '2D' | '3D' | 'SPLIT') {
  await page.evaluate((nextMode) => window.__DESIGN_OS_QA__!.setViewMode(nextMode), mode);
  await page.waitForTimeout(200);
}

async function selectedFurnitureField(page: Page, field: string) {
  return page.evaluate((fieldName) => {
    const item = window.__DESIGN_OS_QA__!.getSelectedFurniture() as unknown as Record<string, unknown> | null;
    return item?.[fieldName] ?? null;
  }, field);
}

async function runCase(page: Page, errors: string[], caseName: string, run: () => Promise<void>) {
  const startErrorCount = errors.length;
  try {
    await run();
    console.log(`✓ ${caseName}`);
  } catch (error) {
    const safeName = caseName.replace(/[^a-z0-9_-]+/gi, '-').toLowerCase();
    await page.screenshot({ path: join(ARTIFACT_DIR, `${safeName}.png`), fullPage: true });
    const recentErrors = errors.slice(startErrorCount);
    throw new Error(`${caseName} failed: ${String(error)}${recentErrors.length ? `\nConsole errors:\n${recentErrors.join('\n')}` : ''}`);
  }
}

async function expectVisible(page: Page, selector: string, label: string) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: 'visible', timeout: 10_000 });
  assert(await locator.isVisible(), `${label} should be visible`);
}

async function expectText(page: Page, text: string, label: string) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout: 10_000 });
  assert(await page.getByText(text, { exact: false }).first().isVisible(), `${label}: expected "${text}"`);
}

async function expectInputValue(page: Page, selector: string, expected: string, label: string) {
  const actual = await page.locator(selector).inputValue({ timeout: 10_000 });
  assert(actual.toLowerCase() === expected.toLowerCase(), `${label}: expected ${expected}, got ${actual}`);
}

async function expectNoPageErrors(errors: string[], label: string) {
  assert(errors.length === 0, `${label}: expected no browser console/page errors, got ${errors.join('\n')}`);
}

function isOpenable(item: (typeof furnitureCatalog)[number]) {
  const defaultVariant =
    item.variants.find((variant) => variant.id === item.defaultVariantId) ??
    item.variants[0];
  return (
    ['CABINET_BASE', 'CABINET_WALL', 'CABINET_TALL', 'SINK_UNIT', 'WARDROBE', 'DRESSER', 'VANITY', 'TV_UNIT', 'SHOE_RACK'].includes(item.type) ||
    ['drawer_unit', 'open_unit', 'pullout_unit', 'sink_unit', 'cabinet_base', 'cabinet_wall', 'cabinet_tall'].includes(item.id) ||
    (defaultVariant?.drawerCount ?? 0) > 0 ||
    (defaultVariant?.shutterCount ?? 0) > 0
  );
}

function collectPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function startVite() {
  const server = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: process.cwd(),
    stdio: 'pipe',
    env: { ...process.env, BROWSER: 'none' },
  });
  server.stderr.on('data', (chunk) => process.stderr.write(chunk));
  await waitForServer(server);
  return server;
}

async function waitForServer(server: ChildProcessWithoutNullStreams) {
  const deadline = Date.now() + 60_000;
  let lastError: unknown = null;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Vite exited early with code ${server.exitCode}`);
    try {
      const response = await fetch(BASE_URL);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for Vite. Last error: ${String(lastError)}`);
}

function stopVite(server: ChildProcessWithoutNullStreams) {
  if (server.exitCode === null) server.kill('SIGTERM');
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
