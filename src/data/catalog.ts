import { CatalogCategory, Furniture } from '../store/useStore';

export interface CatalogVariant {
  id: string;
  label: string;
  width: number;
  depth: number;
  height: number;
  price: number;
  unit: 'unit' | 'rft' | 'sqft' | 'sqm';
  shutterCount?: number;
  drawerCount?: number;
}

export interface FurnitureCatalogItem {
  id: string;
  name: string;
  group: string;
  type: Furniture['type'];
  category: CatalogCategory;
  tags: string[];
  defaultVariantId: string;
  variants: CatalogVariant[];
  hasHandle?: boolean;
  skirtingHeight?: number;
}

export interface MaterialItem {
  id: string;
  name: string;
  group: string;
  color: string;
  rate: number;
  unit: 'sqft' | 'sqm' | 'unit';
}

const cabinetVariants = (prefix: string, depth: number, height: number, price: number): CatalogVariant[] =>
  [450, 600, 750, 900, 1200].map((width) => ({
    id: `${prefix}_${width}`,
    label: `${width}W x ${depth}D x ${height}H`,
    width,
    depth,
    height,
    price: Math.round(price * (width / 600)),
    unit: 'unit',
    shutterCount: width >= 900 ? 2 : 1,
  }));

export const furnitureCatalog: FurnitureCatalogItem[] = [
  {
    id: 'cabinet_base',
    name: 'Base Cabinet',
    group: 'Base Units',
    type: 'CABINET_BASE',
    category: 'FURNITURE',
    tags: ['kitchen', 'shutter'],
    defaultVariantId: 'base_600',
    variants: cabinetVariants('base', 560, 720, 12000),
    hasHandle: true,
    skirtingHeight: 100,
  },
  {
    id: 'drawer_unit',
    name: 'Drawer Unit',
    group: 'Drawer Units',
    type: 'CABINET_BASE',
    category: 'FURNITURE',
    tags: ['kitchen', 'drawer'],
    defaultVariantId: 'drawer_600',
    variants: cabinetVariants('drawer', 560, 720, 15500).map((variant) => ({ ...variant, drawerCount: 3 })),
    hasHandle: true,
    skirtingHeight: 100,
  },
  {
    id: 'open_unit',
    name: 'Open Unit',
    group: 'Open Units',
    type: 'CABINET_BASE',
    category: 'FURNITURE',
    tags: ['kitchen', 'open'],
    defaultVariantId: 'open_600',
    variants: cabinetVariants('open', 560, 720, 9000).map((variant) => ({ ...variant, shutterCount: 0 })),
    skirtingHeight: 100,
  },
  {
    id: 'pullout_unit',
    name: 'Bottle Pullout',
    group: 'Pull Out Units',
    type: 'CABINET_BASE',
    category: 'FURNITURE',
    tags: ['kitchen', 'pullout'],
    defaultVariantId: 'pullout_300',
    variants: [
      { id: 'pullout_300', label: '300W x 560D x 720H', width: 300, depth: 560, height: 720, price: 9500, unit: 'unit', shutterCount: 1 },
      { id: 'pullout_450', label: '450W x 560D x 720H', width: 450, depth: 560, height: 720, price: 12000, unit: 'unit', shutterCount: 1 },
    ],
    hasHandle: true,
    skirtingHeight: 100,
  },
  {
    id: 'sink_unit',
    name: 'Sink Unit',
    group: 'Sink Unit',
    type: 'SINK_UNIT',
    category: 'FURNITURE',
    tags: ['kitchen', 'plumbing'],
    defaultVariantId: 'sink_800',
    variants: [
      { id: 'sink_800', label: '800W x 560D x 720H', width: 800, depth: 560, height: 720, price: 15000, unit: 'unit', shutterCount: 2 },
      { id: 'sink_900', label: '900W x 560D x 720H', width: 900, depth: 560, height: 720, price: 17000, unit: 'unit', shutterCount: 2 },
    ],
    hasHandle: true,
    skirtingHeight: 100,
  },
  {
    id: 'corner_unit',
    name: 'L-Corner Base Cabinet',
    group: 'Corner Units',
    type: 'CABINET_BASE',
    category: 'FURNITURE',
    tags: ['kitchen', 'corner'],
    defaultVariantId: 'corner_900',
    variants: [
      { id: 'corner_900', label: '900W x 900D x 720H', width: 900, depth: 900, height: 720, price: 24000, unit: 'unit', shutterCount: 2 },
    ],
    hasHandle: true,
    skirtingHeight: 100,
  },
  {
    id: 'cabinet_wall',
    name: 'Wall Cabinet',
    group: 'Wall Units',
    type: 'CABINET_WALL',
    category: 'FURNITURE',
    tags: ['kitchen', 'wall mounted'],
    defaultVariantId: 'wall_600',
    variants: cabinetVariants('wall', 320, 720, 8000),
    hasHandle: true,
  },
  {
    id: 'cabinet_tall',
    name: 'Tall Unit',
    group: 'Tall Units',
    type: 'CABINET_TALL',
    category: 'FURNITURE',
    tags: ['kitchen', 'storage'],
    defaultVariantId: 'tall_600',
    variants: cabinetVariants('tall', 560, 2040, 25000),
    hasHandle: true,
    skirtingHeight: 100,
  },
  {
    id: 'wardrobe',
    name: 'Wardrobe',
    group: 'Wardrobes',
    type: 'WARDROBE',
    category: 'FURNITURE',
    tags: ['bedroom', 'storage'],
    defaultVariantId: 'wardrobe_1200',
    variants: [
      { id: 'wardrobe_900', label: '900W x 600D x 2100H', width: 900, depth: 600, height: 2100, price: 32000, unit: 'unit', shutterCount: 2 },
      { id: 'wardrobe_1200', label: '1200W x 600D x 2100H', width: 1200, depth: 600, height: 2100, price: 42000, unit: 'unit', shutterCount: 3 },
      { id: 'wardrobe_1800', label: '1800W x 600D x 2100H', width: 1800, depth: 600, height: 2100, price: 62000, unit: 'unit', shutterCount: 4 },
    ],
    hasHandle: true,
    skirtingHeight: 100,
  },
];

export const materialCatalog: MaterialItem[] = [
  { id: 'paint_opal_green', name: 'Opal Green', group: 'Solid Paints', color: '#134e4a', rate: 45, unit: 'sqft' },
  { id: 'paint_orange_brown', name: 'Orange Brown', group: 'Solid Paints', color: '#9a3412', rate: 45, unit: 'sqft' },
  { id: 'paint_silk_grey', name: 'Silk Grey', group: 'Solid Paints', color: '#cbd5e1', rate: 45, unit: 'sqft' },
  { id: 'paint_matte_black', name: 'Matte Black', group: 'Solid Paints', color: '#1e293b', rate: 55, unit: 'sqft' },
  { id: 'laminate_oak', name: 'Oak Laminate', group: 'Laminate', color: '#d4a373', rate: 95, unit: 'sqft' },
  { id: 'veneer_walnut', name: 'Walnut Veneer', group: 'Veneer', color: '#7c4a2d', rate: 180, unit: 'sqft' },
  { id: 'counter_marble', name: 'White Marble', group: 'Countertop', color: '#e5e7eb', rate: 450, unit: 'sqft' },
  { id: 'glass_clear', name: 'Clear Glass', group: 'Glass', color: '#dbeafe', rate: 350, unit: 'sqft' },
  { id: 'tile_warm', name: 'Warm Floor Tile', group: 'Flooring', color: '#e6c99d', rate: 160, unit: 'sqft' },
  { id: 'wallpaper_linen', name: 'Linen Wallpaper', group: 'Wallpaper', color: '#ebe6d7', rate: 120, unit: 'sqft' },
];

export function getCatalogItem(id: string | null | undefined): FurnitureCatalogItem | undefined {
  return furnitureCatalog.find((item) => item.id === id);
}

export function getVariant(itemId: string | null | undefined, variantId?: string): CatalogVariant | undefined {
  const item = getCatalogItem(itemId);
  if (!item) return undefined;
  return item.variants.find((variant) => variant.id === variantId || variant.id === item.defaultVariantId);
}

export function getMaterial(id: string | null | undefined): MaterialItem | undefined {
  return materialCatalog.find((material) => material.id === id);
}
