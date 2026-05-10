import { DesignSnapshot, Furniture, Room, Wall, WallOpening } from '../store/useStore';
import { furnitureCatalog, getCatalogItem, getMaterial, getVariant, materialCatalog } from '../data/catalog';
import { getDistance } from './math';
import { generateBOQByRoom } from './pricing';

export interface ScheduleRow {
  [key: string]: string | number;
}

const safeFileName = (name: string) =>
  (name || 'design-project').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();

const downloadBlob = (content: string, type: string, filename: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const toCsv = (rows: ScheduleRow[]) => {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const esc = (value: string | number) => {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => esc(row[header])).join(',')),
  ].join('\n');
};

const roomName = (rooms: Room[], roomId: string) =>
  rooms.find((room) => room.id === roomId)?.name ?? 'Unassigned';

export const buildRoomSchedule = (snapshot: DesignSnapshot): ScheduleRow[] =>
  snapshot.rooms.map((room) => {
    const walls = snapshot.walls.filter((wall) => wall.roomId === room.id);
    const areaSqm =
      walls.length >= 3
        ? Math.abs(
            walls
              .map((wall) => wall.start)
              .reduce((sum, point, index, points) => {
                const next = points[(index + 1) % points.length];
                return sum + point.x * next.y - next.x * point.y;
              }, 0),
          ) /
          2 /
          1_000_000
        : 0;
    return {
      Room: room.name,
      Type: room.type,
      Building: room.building,
      Floor: room.floor,
      Walls: walls.length,
      Openings: snapshot.openings.filter((opening) => opening.roomId === room.id).length,
      Furniture: snapshot.furniture.filter((item) => item.roomId === room.id).length,
      'Area sqm': areaSqm ? areaSqm.toFixed(2) : '',
    };
  });

export const buildWallSchedule = (snapshot: DesignSnapshot): ScheduleRow[] =>
  snapshot.walls.map((wall, index) => {
    const material = getMaterial(wall.materialId);
    return {
      Mark: `W-${index + 1}`,
      Room: roomName(snapshot.rooms, wall.roomId),
      'Length mm': Math.round(getDistance(wall.start, wall.end)),
      'Height mm': wall.height,
      'Thickness mm': wall.thickness,
      Finish: material?.name ?? 'Default',
      Brand: material?.brand ?? '',
      Skirting: wall.skirtingHeight ?? 0,
      Cornice: wall.hasCornice ? 'Yes' : 'No',
    };
  });

export const buildOpeningSchedule = (snapshot: DesignSnapshot): ScheduleRow[] =>
  snapshot.openings.map((opening, index) => ({
    Mark: `${opening.type === 'DOOR' ? 'D' : 'V'}-${index + 1}`,
    Room: roomName(snapshot.rooms, opening.roomId),
    Type: opening.type,
    'Width mm': opening.width,
    'Height mm': opening.height,
    'Sill/Bottom mm': opening.bottomHeight,
    'Wall offset %': Math.round(opening.offset * 100),
  }));

export const buildFurnitureSchedule = (snapshot: DesignSnapshot): ScheduleRow[] =>
  snapshot.furniture.map((item, index) => {
    const catalogItem = getCatalogItem(item.catalogItemId);
    const variant = getVariant(item.catalogItemId, item.variantId);
    const material = getMaterial(item.materialId);
    return {
      Mark: `F-${index + 1}`,
      Room: roomName(snapshot.rooms, item.roomId),
      Name: catalogItem?.name ?? item.type,
      Type: item.type,
      Brand: catalogItem?.brand ?? '',
      SKU: catalogItem?.sku ?? '',
      Variant: variant?.label ?? item.variantId ?? '',
      'Width mm': item.width,
      'Depth mm': item.depth,
      'Height mm': item.height,
      'X mm': Math.round(item.position.x),
      'Y mm': Math.round(item.position.y),
      Rotation: Math.round(item.rotation),
      Finish: material?.name ?? '',
    };
  });

export const buildMaterialSchedule = (snapshot: DesignSnapshot): ScheduleRow[] => {
  const used = new Map<string, { materialId: string; count: number; targets: string[] }>();
  const add = (materialId: string | undefined, target: string) => {
    if (!materialId) return;
    const existing = used.get(materialId);
    if (existing) {
      existing.count += 1;
      existing.targets.push(target);
    } else {
      used.set(materialId, { materialId, count: 1, targets: [target] });
    }
  };
  snapshot.walls.forEach((wall) => add(wall.materialId, `Wall in ${roomName(snapshot.rooms, wall.roomId)}`));
  snapshot.furniture.forEach((item) => add(item.materialId, `Furniture in ${roomName(snapshot.rooms, item.roomId)}`));
  return Array.from(used.values()).map((entry) => {
    const material = getMaterial(entry.materialId);
    return {
      Material: material?.name ?? entry.materialId,
      Group: material?.group ?? '',
      Brand: material?.brand ?? '',
      SKU: material?.sku ?? '',
      Finish: material?.finishType ?? '',
      Pattern: material?.pattern ?? '',
      'Rate INR': material?.rate ?? '',
      Unit: material?.unit ?? '',
      Uses: entry.count,
      Targets: entry.targets.join('; '),
    };
  });
};

export const buildHandoffPackage = (snapshot: DesignSnapshot) => ({
  generatedAt: new Date().toISOString(),
  project: snapshot.project,
  rooms: buildRoomSchedule(snapshot),
  walls: buildWallSchedule(snapshot),
  openings: buildOpeningSchedule(snapshot),
  furniture: buildFurnitureSchedule(snapshot),
  materials: buildMaterialSchedule(snapshot),
  boq: generateBOQByRoom(snapshot.rooms, snapshot.walls, snapshot.furniture, snapshot.openings),
  sourceSnapshot: snapshot,
});

export const downloadScheduleCsv = (
  snapshot: DesignSnapshot,
  name: 'rooms' | 'walls' | 'openings' | 'furniture' | 'materials',
) => {
  const rows = {
    rooms: buildRoomSchedule(snapshot),
    walls: buildWallSchedule(snapshot),
    openings: buildOpeningSchedule(snapshot),
    furniture: buildFurnitureSchedule(snapshot),
    materials: buildMaterialSchedule(snapshot),
  }[name];
  downloadBlob(toCsv(rows), 'text/csv;charset=utf-8', `${safeFileName(snapshot.project.projectName)}-${name}.csv`);
};

export const downloadHandoffJson = (snapshot: DesignSnapshot) => {
  downloadBlob(
    JSON.stringify(buildHandoffPackage(snapshot), null, 2),
    'application/json',
    `${safeFileName(snapshot.project.projectName)}-handoff-package.json`,
  );
};

export const downloadCatalogAdminCsv = () => {
  const rows: ScheduleRow[] = furnitureCatalog.map((item) => ({
    Name: item.name,
    Group: item.group,
    Type: item.type,
    Brand: item.brand ?? '',
    SKU: item.sku ?? '',
    Rooms: item.roomTypes?.join('; ') ?? '',
    Variants: item.variants.length,
    'Default Variant': item.defaultVariantId,
    Tags: item.tags.join('; '),
  }));
  downloadBlob(toCsv(rows), 'text/csv;charset=utf-8', 'design-os-catalog.csv');
};

export const materialGroupsForInfurniaTabs = () => [
  'Solid Paints',
  'Texture Paint',
  'Wallpaper',
  'Glass',
  'Wood Veneer',
  'Tiles',
  ...materialCatalog.map((material) => material.group),
].filter((group, index, all) => all.indexOf(group) === index);
