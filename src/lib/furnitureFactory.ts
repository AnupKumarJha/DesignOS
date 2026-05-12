import { Furniture } from '../store/useStore';
import { FurnitureCatalogItem, getCatalogItem, getVariant } from '../data/catalog';
import { Point, Wall } from '../store/useStore';
import { getClosestPointOnSegment, getDistance, snapToGrid } from './math';

export const FURNITURE_DRAG_MIME = 'application/design-os-catalog-item';

export function createFurnitureFromCatalog(options: {
  catalogItemId: string;
  roomId: string;
  position: Point;
  walls?: Wall[];
  customCatalogItems?: FurnitureCatalogItem[];
}): Furniture | null {
  const catalogItem =
    getCatalogItem(options.catalogItemId) ||
    options.customCatalogItems?.find((item) => item.id === options.catalogItemId);
  if (!catalogItem) return null;

  const variant =
    getVariant(catalogItem.id, catalogItem.defaultVariantId) ||
    catalogItem.variants.find((entry) => entry.id === catalogItem.defaultVariantId) ||
    catalogItem.variants[0];
  if (!variant) return null;

  let snappedPos = snapToGrid(options.position, 50);
  let rotation = 0;
  let minSnapDist = 140;
  for (const wall of options.walls ?? []) {
    const { point } = getClosestPointOnSegment(options.position, wall.start, wall.end);
    const dist = getDistance(options.position, point);
    if (dist < minSnapDist) {
      minSnapDist = dist;
      snappedPos = point;
      rotation = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x) * (180 / Math.PI) + 90;
    }
  }

  return {
    id: crypto.randomUUID(),
    roomId: options.roomId,
    type: catalogItem.type,
    position: snappedPos,
    rotation,
    width: variant.width,
    depth: variant.depth,
    height: variant.height,
    color: '#ffffff',
    catalogItemId: catalogItem.id,
    variantId: variant.id,
    shutterCount: variant.shutterCount,
    drawerCount: variant.drawerCount,
    hasHandle: catalogItem.hasHandle,
    skirtingHeight: catalogItem.skirtingHeight,
    catalogName: catalogItem.name,
    catalogBrand: catalogItem.brand,
    catalogSku: catalogItem.sku,
    catalogVariantLabel: variant.label,
    modelAssetId: catalogItem.modelAssetId,
    thumbnailAssetId: catalogItem.thumbnailAssetId,
    assetFormat: catalogItem.assetFormat,
    sourceUrl: catalogItem.sourceUrl,
    licenseNote: catalogItem.licenseNote,
    openState: 'closed',
    openAmount: 0,
    hingeType: 'Auto',
    hingeSide: 'auto',
    hingeCount: Math.max(2, variant.height > 1200 ? 3 : 2),
    hingeOffsetTop: 110,
    hingeOffsetBottom: 110,
    hingeBoreDistance: 22,
    openAngle: 100,
    isCustomSize: false,
  };
}

export const clampFurnitureSize = (value: number) => Math.max(150, Math.min(5000, Math.round(value)));

