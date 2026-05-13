import type { Furniture, FurnitureLayoutPreset, FurniturePart, FurniturePartType } from '../store/useStore';

const PANEL = 18;
const BACK = 9;
const SHUTTER = 22;
const GAP = 6;

const CASE_TYPES = new Set<Furniture['type']>([
  'CABINET_BASE',
  'CABINET_WALL',
  'CABINET_TALL',
  'WARDROBE',
  'SINK_UNIT',
  'BOOKSHELF',
  'TV_UNIT',
  'NIGHTSTAND',
  'DRESSER',
  'VANITY',
  'SHOE_RACK',
  'STUDY_UNIT',
]);

export const FURNITURE_LAYOUT_PRESETS: { id: FurnitureLayoutPreset; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'shelves', label: 'Shelves' },
  { id: 'drawer_stack', label: 'Drawer Stack' },
  { id: 'drawer_shutter', label: 'Drawer + Shutter' },
  { id: 'hanging_shelves', label: 'Hanging + Shelves' },
  { id: 'open_niche', label: 'Open Niche' },
];

export function isCaseFurniture(item: Furniture) {
  return CASE_TYPES.has(item.type);
}

export function generateFurnitureParts(item: Furniture): FurniturePart[] {
  const generated = isCaseFurniture(item) ? generateCaseParts(item) : generateLooseFurnitureParts(item);
  const existing = new Map((item.parts ?? []).map((part) => [part.id, part]));
  return generated.map((part) => {
    const previous = existing.get(part.id);
    if (!previous) return part;
    return {
      ...part,
      materialId: previous.materialId ?? part.materialId,
      color: previous.color ?? part.color,
      visible: previous.visible ?? part.visible,
      thickness: previous.thickness ?? part.thickness,
      position: previous.position ?? part.position,
      localPosition: previous.localPosition ?? part.localPosition,
      size: previous.size ?? part.size,
      materialRole: previous.materialRole ?? part.materialRole,
      handleType: previous.handleType ?? part.handleType,
      parentPartId: previous.parentPartId ?? part.parentPartId,
      mechanism: previous.mechanism ?? part.mechanism,
      hingeSide: previous.hingeSide ?? part.hingeSide,
      metalness: previous.metalness ?? part.metalness,
      roughness: previous.roughness ?? part.roughness,
    };
  });
}

export function tagFurnitureWithParts(item: Furniture): Furniture {
  const withDefaults = {
    ...item,
    internalLayoutPreset: item.internalLayoutPreset ?? inferLayoutPreset(item),
    shelfCount: item.shelfCount ?? defaultShelfCount(item),
    partitionCount: item.partitionCount ?? defaultPartitionCount(item),
    hasHangingRod: item.hasHangingRod ?? ['WARDROBE', 'CABINET_TALL'].includes(item.type),
    hasBasket: item.hasBasket ?? item.catalogItemId === 'pullout_unit',
    hasPullout: item.hasPullout ?? item.catalogItemId === 'pullout_unit',
    exteriorColor: item.exteriorColor,
    interiorColor: item.interiorColor,
    hardwareColor: item.hardwareColor,
  };
  return { ...withDefaults, parts: generateFurnitureParts(withDefaults) };
}

export function partTypeLabel(type: FurniturePartType) {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function generateCaseParts(item: Furniture): FurniturePart[] {
  const parts: FurniturePart[] = [];
  const w = Math.max(item.width, 120);
  const h = Math.max(item.height, 120);
  const d = Math.max(item.depth, 120);
  const innerW = Math.max(60, w - PANEL * 2);
  const innerH = Math.max(60, h - PANEL * 2);
  const innerD = Math.max(60, d - BACK - PANEL);
  const internalMaterialId = item.internalMaterialId ?? 'laminate_ash_grey';
  const exteriorMaterialId = item.materialId;
  const hasFront = !isOpenUnit(item);
  const drawerCount = Math.max(0, item.drawerCount ?? 0);
  const shutterCount = hasFront ? Math.max(1, item.shutterCount ?? (drawerCount > 0 ? 0 : 1)) : 0;

  const add = (
    type: FurniturePartType,
    name: string,
    position: FurniturePart['position'],
    size: FurniturePart['size'],
    options: Partial<FurniturePart> & { id?: string } = {},
  ) => {
    const typeIndex = parts.filter((part) => part.type === type).length + 1;
    parts.push({
      id: options.id ?? `${item.id}:${type}:${typeIndex}`,
      type,
      name,
      position,
      size,
      thickness: options.thickness ?? panelThickness(type),
      materialId: options.materialId ?? defaultMaterialId(type, options.materialRole ?? defaultMaterialRole(type), internalMaterialId),
      color: options.color,
      visible: options.visible ?? true,
      mechanism: options.mechanism ?? 'none',
      parentPartId: options.parentPartId,
      localPosition: options.localPosition,
      materialRole: options.materialRole ?? defaultMaterialRole(type),
      handleType: options.handleType,
      hingeSide: options.hingeSide,
      metalness: options.metalness,
      roughness: options.roughness,
    });
  };

  add('left_panel', 'Left Side Panel', { x: -w / 2 + PANEL / 2, y: 0, z: 0 }, { width: PANEL, height: h, depth: d }, { materialId: exteriorMaterialId, materialRole: 'exterior' });
  add('right_panel', 'Right Side Panel', { x: w / 2 - PANEL / 2, y: 0, z: 0 }, { width: PANEL, height: h, depth: d }, { materialId: exteriorMaterialId, materialRole: 'exterior' });
  add('top_panel', 'Top Panel', { x: 0, y: h / 2 - PANEL / 2, z: 0 }, { width: w, height: PANEL, depth: d }, { materialId: exteriorMaterialId, materialRole: 'exterior' });
  add('bottom_panel', 'Bottom Panel', { x: 0, y: -h / 2 + PANEL / 2, z: 0 }, { width: w, height: PANEL, depth: d }, { materialId: exteriorMaterialId, materialRole: 'exterior' });
  add('back_panel', 'Inset Back Panel', { x: 0, y: 0, z: -d / 2 + BACK / 2 }, { width: innerW, height: innerH, depth: BACK }, { materialId: internalMaterialId, thickness: BACK, materialRole: 'interior' });

  const partitionCount = Math.max(0, item.partitionCount ?? defaultPartitionCount(item));
  for (let index = 0; index < partitionCount; index += 1) {
    const x = -innerW / 2 + (innerW / (partitionCount + 1)) * (index + 1);
    add('vertical_partition', `Vertical Partition ${index + 1}`, { x, y: 0, z: -PANEL / 2 }, { width: PANEL, height: innerH, depth: innerD }, { materialId: internalMaterialId, materialRole: 'interior' });
  }

  const shelfCount = Math.max(0, item.shelfCount ?? defaultShelfCount(item));
  for (let index = 0; index < shelfCount; index += 1) {
    const y = -innerH / 2 + (innerH / (shelfCount + 1)) * (index + 1);
    add('shelf', `Adjustable Shelf ${index + 1}`, { x: 0, y, z: -PANEL / 2 }, { width: innerW, height: PANEL, depth: innerD }, { materialId: internalMaterialId, materialRole: 'interior' });
  }

  if ((item.hasHangingRod ?? ['WARDROBE', 'CABINET_TALL'].includes(item.type)) && h > 1300) {
    add('hanging_rod', 'Hanging Rod', { x: 0, y: h * 0.22, z: d * 0.04 }, { width: Math.max(120, innerW - 120), height: 24, depth: 24 }, { materialId: undefined, materialRole: 'hardware', metalness: 0.75, roughness: 0.16 });
  }

  if (item.hasBasket || item.catalogItemId === 'pullout_unit') {
    add('basket', 'Wire Basket Pullout', { x: 0, y: -h * 0.12, z: d * 0.08 }, { width: innerW - 80, height: Math.min(220, h * 0.32), depth: innerD - 70 }, { materialId: undefined, materialRole: 'hardware', mechanism: 'pullout', metalness: 0.55, roughness: 0.2 });
  }

  if (drawerCount > 0) {
    const frontH = (h - GAP * (drawerCount + 1)) / drawerCount;
    for (let index = 0; index < drawerCount; index += 1) {
      const y = h / 2 - GAP - frontH / 2 - index * (frontH + GAP);
      const frontId = `${item.id}:drawer:${index + 1}:front`;
      const frontPosition = { x: 0, y, z: d / 2 + SHUTTER / 2 };
      add('drawer_front', `Drawer Front ${index + 1}`, frontPosition, { width: w - GAP * 2, height: frontH, depth: SHUTTER }, { id: frontId, materialId: exteriorMaterialId, materialRole: 'exterior', mechanism: 'slide' });
      add('drawer_box', `Drawer Box ${index + 1}`, { x: 0, y, z: d * 0.08 }, { width: innerW - 50, height: Math.max(70, frontH - 48), depth: innerD * 0.74 }, { id: `${item.id}:drawer:${index + 1}:box`, parentPartId: frontId, localPosition: { x: 0, y: 0, z: d * 0.08 - frontPosition.z }, materialId: internalMaterialId, materialRole: 'interior' });
      add('runner', `Runner Pair ${index + 1}`, { x: 0, y: y - frontH * 0.25, z: d * 0.1 }, { width: innerW - 34, height: 18, depth: innerD * 0.82 }, { id: `${item.id}:drawer:${index + 1}:runner`, parentPartId: frontId, localPosition: { x: 0, y: -frontH * 0.25, z: d * 0.1 - frontPosition.z }, materialId: undefined, materialRole: 'hardware', metalness: 0.7, roughness: 0.2 });
      if (item.hasHandle !== false) {
        add('handle', `Drawer Handle ${index + 1}`, { x: 0, y, z: d / 2 + 44 }, { width: Math.min(260, w * 0.42), height: 18, depth: 18 }, { id: `${item.id}:drawer:${index + 1}:handle`, parentPartId: frontId, localPosition: { x: 0, y: 0, z: d / 2 + 44 - frontPosition.z }, materialId: undefined, materialRole: 'hardware', handleType: 'bar', metalness: 0.72, roughness: 0.16 });
      }
    }
  } else if (shutterCount > 0) {
    const shutterW = (w - GAP * (shutterCount + 1)) / shutterCount;
    for (let index = 0; index < shutterCount; index += 1) {
      const x = -w / 2 + GAP + shutterW / 2 + index * (shutterW + GAP);
      const autoLeft = index < shutterCount / 2;
      const hingeSide = item.hingeSide === 'left' ? 'left' : item.hingeSide === 'right' ? 'right' : autoLeft ? 'left' : 'right';
      const shutterId = `${item.id}:shutter:${index + 1}`;
      const shutterPosition = { x, y: 0, z: d / 2 + SHUTTER / 2 };
      add('shutter', `Shutter ${index + 1}`, shutterPosition, { width: shutterW, height: h - GAP * 2, depth: SHUTTER }, { id: shutterId, materialId: exteriorMaterialId, materialRole: 'exterior', mechanism: 'swing', hingeSide });
      const hingeCount = Math.max(1, item.hingeCount ?? (h > 1200 ? 3 : 2));
      for (let hingeIndex = 0; hingeIndex < hingeCount; hingeIndex += 1) {
        const top = item.hingeOffsetTop ?? 110;
        const bottom = item.hingeOffsetBottom ?? 110;
        const span = Math.max(1, h - top - bottom);
        const hingeY = h / 2 - top - (hingeCount === 1 ? span / 2 : (span / (hingeCount - 1)) * hingeIndex);
        const hingeLocalX = hingeSide === 'left' ? -shutterW / 2 + 18 : shutterW / 2 - 18;
        add('hinge', `Hinge ${index + 1}.${hingeIndex + 1}`, { x: x + hingeLocalX, y: hingeY, z: d / 2 + 38 }, { width: 34, height: 76, depth: 18 }, { id: `${item.id}:shutter:${index + 1}:hinge:${hingeIndex + 1}`, parentPartId: shutterId, localPosition: { x: hingeLocalX, y: hingeY, z: d / 2 + 38 - shutterPosition.z }, materialId: undefined, materialRole: 'hardware', hingeSide, metalness: 0.75, roughness: 0.18 });
      }
      if (item.hasHandle !== false) {
        const handleLocalX = hingeSide === 'left' ? shutterW * 0.32 : -shutterW * 0.32;
        add('handle', `Shutter Handle ${index + 1}`, { x: x + handleLocalX, y: 0, z: d / 2 + 44 }, { width: 18, height: Math.min(220, h * 0.34), depth: 18 }, { id: `${item.id}:shutter:${index + 1}:handle`, parentPartId: shutterId, localPosition: { x: handleLocalX, y: 0, z: d / 2 + 44 - shutterPosition.z }, materialId: undefined, materialRole: 'hardware', handleType: 'bar', hingeSide, metalness: 0.72, roughness: 0.16 });
      }
    }
  }

  if ((item.skirtingHeight ?? 0) > 0) {
    add('skirting', 'Recessed Skirting', { x: 0, y: -h / 2 - (item.skirtingHeight ?? 0) / 2, z: 0 }, { width: Math.max(80, w - 80), height: item.skirtingHeight ?? 80, depth: Math.max(80, d - 80) }, { materialId: undefined, materialRole: 'custom' });
  }
  if (['CABINET_BASE', 'SINK_UNIT', 'VANITY'].includes(item.type)) {
    add('countertop', item.type === 'VANITY' ? 'Vanity Countertop' : 'Countertop', { x: 0, y: h / 2 + 28, z: 0 }, { width: w + 60, height: 56, depth: d + 70 }, { materialId: 'stone_granite_black', materialRole: 'countertop' });
  }
  if (item.type === 'SINK_UNIT' || item.catalogItemId === 'sink_unit') {
    add('sink', 'Sink Bowl', { x: 0, y: h / 2 + 66, z: d * 0.08 }, { width: Math.min(520, w * 0.62), height: 90, depth: d * 0.48 }, { materialId: undefined, materialRole: 'custom', metalness: 0.22, roughness: 0.2 });
  }

  return parts;
}

function generateLooseFurnitureParts(item: Furniture): FurniturePart[] {
  const baseId = item.id;
  const materialId = item.materialId;
  if (item.type === 'BED') {
    return [
      part(baseId, 'frame', 1, 'Bed Frame', { x: 0, y: -item.height * 0.28, z: 0 }, { width: item.width, height: item.height * 0.42, depth: item.depth }, materialId),
      part(baseId, 'seat', 1, 'Mattress', { x: 0, y: item.height * 0.02, z: 0 }, { width: item.width * 0.94, height: item.height * 0.32, depth: item.depth * 0.9 }),
      part(baseId, 'backrest', 1, 'Headboard', { x: 0, y: item.height * 0.3, z: -item.depth / 2 + 80 }, { width: item.width * 1.04, height: item.height * 1.15, depth: 160 }, materialId),
    ];
  }
  if (item.type === 'SOFA') {
    return [
      part(baseId, 'seat', 1, 'Seat Cushion', { x: 0, y: -item.height * 0.2, z: 0 }, { width: item.width, height: item.height * 0.36, depth: item.depth }, materialId),
      part(baseId, 'backrest', 1, 'Back Cushion', { x: 0, y: item.height * 0.18, z: -item.depth / 2 + 85 }, { width: item.width, height: item.height * 0.62, depth: 170 }, materialId),
    ];
  }
  if (['TABLE', 'DINING_TABLE', 'COFFEE_TABLE'].includes(item.type)) {
    return [
      part(baseId, 'countertop', 1, 'Table Top', { x: 0, y: item.height / 2 - 45, z: 0 }, { width: item.width, height: 90, depth: item.depth }, materialId),
      ...[-1, 1].flatMap((x) => [-1, 1].map((z, index) => part(baseId, 'leg', index + (x > 0 ? 3 : 1), 'Table Leg', { x: x * (item.width / 2 - 90), y: -item.height * 0.05, z: z * (item.depth / 2 - 80) }, { width: 70, height: item.height * 0.9, depth: 70 }))),
    ];
  }
  if (['CHAIR', 'OFFICE_CHAIR'].includes(item.type)) {
    return [
      part(baseId, 'seat', 1, 'Seat', { x: 0, y: -item.height * 0.12, z: 0 }, { width: item.width, height: item.height * 0.18, depth: item.depth }, materialId),
      part(baseId, 'backrest', 1, 'Backrest', { x: 0, y: item.height * 0.22, z: -item.depth / 2 + 50 }, { width: item.width, height: item.height * 0.58, depth: 85 }, materialId),
    ];
  }
  if (item.type === 'MIRROR') {
    return [part(baseId, 'mirror_glass', 1, 'Mirror Glass', { x: 0, y: 0, z: 0 }, { width: item.width, height: item.height, depth: 28 })];
  }
  return [part(baseId, 'frame', 1, partTypeLabel('frame'), { x: 0, y: 0, z: 0 }, { width: item.width, height: item.height, depth: item.depth }, materialId)];
}

function part(baseId: string, type: FurniturePartType, index: number, name: string, position: FurniturePart['position'], size: FurniturePart['size'], materialId?: string): FurniturePart {
  return {
    id: `${baseId}:${type}:${index}`,
    type,
    name,
    position,
    size,
    materialId,
    visible: true,
    thickness: panelThickness(type),
    materialRole: defaultMaterialRole(type),
    mechanism: 'none',
  };
}

function inferLayoutPreset(item: Furniture): FurnitureLayoutPreset {
  if (item.drawerCount && item.drawerCount > 0) return 'drawer_stack';
  if (['WARDROBE', 'CABINET_TALL'].includes(item.type)) return 'hanging_shelves';
  if (isOpenUnit(item)) return 'open_niche';
  return 'auto';
}

function defaultShelfCount(item: Furniture) {
  if (item.shelfCount !== undefined) return item.shelfCount;
  if (item.type === 'BOOKSHELF') return Math.max(3, Math.round(item.height / 520));
  if (['WARDROBE', 'CABINET_TALL'].includes(item.type)) return 3;
  if (item.type === 'TV_UNIT') return 1;
  if ((item.drawerCount ?? 0) > 0) return 0;
  if (item.type === 'SINK_UNIT') return 0;
  return item.height > 1000 ? 2 : 1;
}

function defaultPartitionCount(item: Furniture) {
  if (item.partitionCount !== undefined) return item.partitionCount;
  if (item.type === 'WARDROBE' && item.width >= 1200) return 1;
  if (item.type === 'BOOKSHELF' && item.width >= 1200) return 1;
  if (item.type === 'TV_UNIT' && item.width >= 1800) return 2;
  return 0;
}

function isOpenUnit(item: Furniture) {
  return (item.shutterCount ?? 1) === 0 || item.catalogItemId === 'open_unit' || item.internalLayoutPreset === 'open_niche';
}

function panelThickness(type: FurniturePartType) {
  if (type === 'back_panel') return BACK;
  if (['shutter', 'drawer_front'].includes(type)) return SHUTTER;
  if (['handle', 'hinge', 'runner', 'hanging_rod', 'basket'].includes(type)) return 12;
  return PANEL;
}

function defaultMaterialRole(type: FurniturePartType): FurniturePart['materialRole'] {
  if (['handle', 'hinge', 'runner', 'hanging_rod', 'basket'].includes(type)) return 'hardware';
  if (['back_panel', 'shelf', 'vertical_partition', 'drawer_box'].includes(type)) return 'interior';
  if (type === 'countertop') return 'countertop';
  if (['sink', 'skirting', 'leg', 'seat', 'backrest', 'frame', 'mirror_glass'].includes(type)) return 'custom';
  return 'exterior';
}

function defaultMaterialId(type: FurniturePartType, role: FurniturePart['materialRole'], internalMaterialId: string) {
  if (role === 'interior') return internalMaterialId;
  if (role === 'hardware' || role === 'custom') return undefined;
  if (type === 'countertop') return 'stone_granite_black';
  return undefined;
}
