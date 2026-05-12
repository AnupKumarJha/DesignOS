import { Wall, Furniture, WallOpening, Room } from '../store/useStore';
import { getCatalogItem, getMaterial, getVariant } from '../data/catalog';

export interface BOQLine {
  id: string;
  name: string;
  detail?: string;          // dimensions / variant info
  brand?: string;
  sku?: string;
  category: 'Civil' | 'Furniture' | 'Finishes' | 'Openings';
  quantity: number;
  unit: string;
  rate: number;
  total: number;
}

export interface BOQRoomBlock {
  roomId: string;
  roomName: string;
  roomType: string;
  building: string;
  floor: string;
  lines: BOQLine[];
  subtotal: number;
}

export interface BOQReport {
  rooms: BOQRoomBlock[];
  subtotal: number;
}

const SQMM_PER_SQFT = 92_903;
const WALL_LABOR_RATE = 1500;       // ₹ per running meter

function wallLengthMM(wall: Wall): number {
  return Math.sqrt(
    (wall.end.x - wall.start.x) ** 2 + (wall.end.y - wall.start.y) ** 2,
  );
}

/**
 * Builds the bill of quantities grouped by room. Within each room, lines
 * are categorised (Civil / Finishes / Openings / Furniture).
 */
export function generateBOQByRoom(
  rooms: Room[],
  walls: Wall[],
  furniture: Furniture[],
  openings: WallOpening[],
): BOQReport {
  const blocks: BOQRoomBlock[] = rooms.map((room) => {
    const lines: BOQLine[] = [];

    const roomWalls = walls.filter((w) => w.roomId === room.id);
    const roomFurniture = furniture.filter((f) => f.roomId === room.id);
    const roomOpenings = openings.filter((o) => o.roomId === room.id);

    // ──────────────────────────────────────────────────────────────
    // CIVIL — wall construction labor (per running meter)
    // ──────────────────────────────────────────────────────────────
    const totalWallM = roomWalls.reduce((acc, w) => acc + wallLengthMM(w), 0) / 1000;
    if (totalWallM > 0) {
      lines.push({
        id: `${room.id}-wall-labor`,
        name: 'Wall Construction Labor',
        detail: `${roomWalls.length} wall(s)`,
        category: 'Civil',
        quantity: Math.round(totalWallM * 10) / 10,
        unit: 'rm',
        rate: WALL_LABOR_RATE,
        total: Math.round(totalWallM * WALL_LABOR_RATE),
      });
    }

    // ──────────────────────────────────────────────────────────────
    // FINISHES — wall paint / texture / wallpaper based on materialId
    // Walls without a material still get a default paint allowance.
    // ──────────────────────────────────────────────────────────────
    const finishGroups = new Map<string, { sqft: number; walls: number; rate: number; name: string; brand?: string; sku?: string }>();
    let unfinishedSqft = 0;

    roomWalls.forEach((w) => {
      const lengthMM = wallLengthMM(w);
      const sqft = (lengthMM * w.height) / SQMM_PER_SQFT;
      const material = getMaterial(w.materialId);
      if (material) {
        const key = material.id;
        const existing = finishGroups.get(key);
        if (existing) {
          existing.sqft += sqft;
          existing.walls += 1;
        } else {
          finishGroups.set(key, {
            sqft,
            walls: 1,
            rate: material.rate,
            name: `${material.group} · ${material.name}`,
            brand: material.brand,
            sku: material.sku,
          });
        }
      } else {
        unfinishedSqft += sqft;
      }
    });

    finishGroups.forEach((info, key) => {
      const qty = Math.round(info.sqft);
      if (qty <= 0) return;
      lines.push({
        id: `${room.id}-finish-${key}`,
        name: info.name,
        detail: `${info.walls} wall(s)`,
        brand: info.brand,
        sku: info.sku,
        category: 'Finishes',
        quantity: qty,
        unit: 'sqft',
        rate: info.rate,
        total: Math.round(info.sqft * info.rate),
      });
    });

    if (unfinishedSqft > 0) {
      lines.push({
        id: `${room.id}-paint-allowance`,
        name: 'Wall Finish (Paint Allowance)',
        detail: 'Walls with no finish selected',
        category: 'Finishes',
        quantity: Math.round(unfinishedSqft),
        unit: 'sqft',
        rate: 45,
        total: Math.round(unfinishedSqft * 45),
      });
    }

    // ──────────────────────────────────────────────────────────────
    // OPENINGS — door / window frames
    // ──────────────────────────────────────────────────────────────
    const doorCount = roomOpenings.filter((o) => o.type === 'DOOR').length;
    const windowCount = roomOpenings.filter((o) => o.type === 'WINDOW').length;
    if (doorCount > 0) {
      lines.push({
        id: `${room.id}-doors`,
        name: 'Door + Frame',
        category: 'Openings',
        quantity: doorCount,
        unit: 'unit',
        rate: 8000,
        total: doorCount * 8000,
      });
    }
    if (windowCount > 0) {
      lines.push({
        id: `${room.id}-windows`,
        name: 'Window + Frame',
        category: 'Openings',
        quantity: windowCount,
        unit: 'unit',
        rate: 5000,
        total: windowCount * 5000,
      });
    }

    // ──────────────────────────────────────────────────────────────
    // FURNITURE — each piece priced from its catalog variant + material
    // ──────────────────────────────────────────────────────────────
    roomFurniture.forEach((item) => {
      const catalogItem = getCatalogItem(item.catalogItemId);
      const variant = getVariant(item.catalogItemId, item.variantId);
      const material = getMaterial(item.materialId);

      let baseRate = variant?.price ?? 12000;
      if (!variant) {
        if (item.type === 'CABINET_WALL') baseRate = 8000;
        else if (item.type === 'CABINET_TALL') baseRate = 25000;
        else if (item.type === 'WARDROBE') baseRate = 35000;
        else if (item.type === 'SINK_UNIT') baseRate = 15000;
        else if (item.type === 'SOFA') baseRate = 45000;
        else if (item.type === 'BED') baseRate = 28000;
      }

      const materialAreaSqft =
        ((item.width * item.height * 2) + (item.depth * item.height * 2)) / SQMM_PER_SQFT;
      const materialCost = material ? Math.round(materialAreaSqft * material.rate) : 0;

      lines.push({
        id: item.id,
        name: item.catalogName ?? catalogItem?.name ?? item.type.replace('_', ' '),
        detail: `${item.width}W × ${item.depth}D × ${item.height}H${item.catalogVariantLabel ? ` · ${item.catalogVariantLabel}` : variant ? ` · ${variant.label.split(' · ').slice(-1)[0] === variant.label ? '' : variant.label.split(' · ').slice(-1)[0]}` : ''}${material ? ` · finish: ${material.name}` : ''}`,
        brand: item.catalogBrand ?? catalogItem?.brand,
        sku: item.catalogSku ?? catalogItem?.sku,
        category: 'Furniture',
        quantity: 1,
        unit: 'unit',
        rate: baseRate + materialCost,
        total: baseRate + materialCost,
      });
    });

    const subtotal = lines.reduce((sum, l) => sum + l.total, 0);

    return {
      roomId: room.id,
      roomName: room.name,
      roomType: room.type,
      building: room.building,
      floor: room.floor,
      lines,
      subtotal,
    };
  });

  return {
    rooms: blocks,
    subtotal: blocks.reduce((sum, b) => sum + b.subtotal, 0),
  };
}

/**
 * Legacy flat BOQ — preserved for callers that don't yet group by room.
 */
export interface BOQItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
}

export function generateBOQ(
  walls: Wall[],
  furniture: Furniture[],
  openings: WallOpening[],
): BOQItem[] {
  // Build a single fake room so generateBOQByRoom can do the work, then
  // flatten the lines.
  const fakeRoom: Room = {
    id: 'all',
    name: 'All Items',
    type: '',
    building: '',
    floor: '',
    createdAt: '',
  };
  const tagged = (e: any) => ({ ...e, roomId: 'all' });
  const report = generateBOQByRoom(
    [fakeRoom],
    walls.map(tagged),
    furniture.map(tagged),
    openings.map(tagged),
  );
  return report.rooms[0].lines.map((l) => ({
    id: l.id,
    name: l.name,
    quantity: l.quantity,
    unit: l.unit,
    rate: l.rate,
    total: l.total,
  }));
}
