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

export type RoomType =
  | 'Kitchen'
  | 'Bedroom'
  | 'Living'
  | 'Dining'
  | 'Bathroom'
  | 'Office'
  | 'Kids'
  | 'Outdoor';

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
  brand?: string;        // e.g. 'Hettich', 'Hafele', 'Godrej', 'Sleek'
  sku?: string;          // brand SKU code
  roomTypes?: RoomType[]; // which rooms this item belongs to (for filtering)
  mountHeight?: number;  // default Y elevation in mm (0 = floor, 1500 = wall-mounted, etc.)
  modelUrl?: string;     // Optional optimized GLB/GLTF asset path for render mode
  thumbnailUrl?: string; // Optional catalog/render thumbnail
  renderScale?: number;
  renderRotation?: [number, number, number];
  renderOffset?: [number, number, number];
  assetSource?: string;
  licenseNote?: string;
  sourceProvider?: '3dwarehouse' | 'manual' | 'public-library' | 'seed';
  sourceUrl?: string;
  sourceTitle?: string;
  sourceAuthor?: string;
  sourceThumbnailUrl?: string;
  modelAssetId?: string;
  thumbnailAssetId?: string;
  assetFormat?: 'glb' | 'gltf';
  importStatus?: 'pending' | 'published' | 'rejected';
}

export type FinishType = 'Matte' | 'Glossy' | 'Textured' | 'Natural' | 'Polished' | 'Reflective';

export interface MaterialItem {
  id: string;
  name: string;
  group: string;
  color: string;
  rate: number;
  unit: 'sqft' | 'sqm' | 'unit';
  brand?: string;
  sku?: string;
  finishType?: FinishType;
  imageUrl?: string;
  tags?: string[];
  pattern?: 'solid' | 'wood' | 'marble' | 'fabric' | 'brick' | 'tile' | 'concrete' | 'metal' | 'glass';
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
  // ──────────────────────────────────────────────────────────────────
  // KITCHEN — base, wall, tall, sink, corner, pullout
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'cabinet_base',
    name: 'Base Cabinet',
    group: 'Base Units',
    type: 'CABINET_BASE',
    category: 'FURNITURE',
    tags: ['kitchen', 'shutter'],
    roomTypes: ['Kitchen'],
    brand: 'Sleek',
    sku: 'SK-BC-600',
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
    roomTypes: ['Kitchen'],
    brand: 'Hettich',
    sku: 'HT-DRW-600',
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
    roomTypes: ['Kitchen'],
    brand: 'Sleek',
    sku: 'SK-OP-600',
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
    roomTypes: ['Kitchen'],
    brand: 'Hettich',
    sku: 'HT-PO-300',
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
    roomTypes: ['Kitchen'],
    brand: 'Franke',
    sku: 'FR-SINK-800',
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
    roomTypes: ['Kitchen'],
    brand: 'Hafele',
    sku: 'HF-MAGIC-900',
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
    roomTypes: ['Kitchen'],
    brand: 'Sleek',
    sku: 'SK-WC-600',
    defaultVariantId: 'wall_600',
    variants: cabinetVariants('wall', 320, 720, 8000),
    hasHandle: true,
    mountHeight: 1500,
  },
  {
    id: 'cabinet_tall',
    name: 'Tall Storage Unit',
    group: 'Tall Units',
    type: 'CABINET_TALL',
    category: 'FURNITURE',
    tags: ['kitchen', 'storage', 'tall'],
    roomTypes: ['Kitchen', 'Bathroom'],
    brand: 'Hafele',
    sku: 'HF-TALL-600',
    defaultVariantId: 'tall_600',
    variants: cabinetVariants('tall', 560, 2040, 25000),
    hasHandle: true,
    skirtingHeight: 100,
  },
  {
    id: 'chimney_unit',
    name: 'Chimney Hood',
    group: 'Appliances',
    type: 'CABINET_WALL',
    category: 'FURNITURE',
    tags: ['kitchen', 'appliance', 'ventilation'],
    roomTypes: ['Kitchen'],
    brand: 'Faber',
    sku: 'FB-CH-900',
    mountHeight: 1700,
    defaultVariantId: 'chimney_900',
    variants: [
      { id: 'chimney_600', label: '600W x 500D x 600H', width: 600, depth: 500, height: 600, price: 22000, unit: 'unit', shutterCount: 0 },
      { id: 'chimney_900', label: '900W x 500D x 600H', width: 900, depth: 500, height: 600, price: 28000, unit: 'unit', shutterCount: 0 },
    ],
  },
  {
    id: 'hob_unit',
    name: 'Cooktop / Hob',
    group: 'Appliances',
    type: 'CABINET_BASE',
    category: 'FURNITURE',
    tags: ['kitchen', 'appliance', 'cooking'],
    roomTypes: ['Kitchen'],
    brand: 'Bosch',
    sku: 'BS-HOB-700',
    defaultVariantId: 'hob_700',
    variants: [
      { id: 'hob_700', label: '700W x 560D x 50H', width: 700, depth: 560, height: 50, price: 18000, unit: 'unit', shutterCount: 0 },
      { id: 'hob_900', label: '900W x 560D x 50H', width: 900, depth: 560, height: 50, price: 24000, unit: 'unit', shutterCount: 0 },
    ],
  },
  {
    id: 'fridge_unit',
    name: 'Fridge',
    group: 'Appliances',
    type: 'CABINET_TALL',
    category: 'FURNITURE',
    tags: ['kitchen', 'appliance'],
    roomTypes: ['Kitchen'],
    brand: 'Samsung',
    sku: 'SM-FRG-700',
    defaultVariantId: 'fridge_700',
    variants: [
      { id: 'fridge_600', label: '600W x 650D x 1700H', width: 600, depth: 650, height: 1700, price: 38000, unit: 'unit', shutterCount: 1 },
      { id: 'fridge_700', label: '700W x 700D x 1800H', width: 700, depth: 700, height: 1800, price: 52000, unit: 'unit', shutterCount: 2 },
    ],
    hasHandle: true,
    skirtingHeight: 0,
  },

  // ──────────────────────────────────────────────────────────────────
  // BEDROOM — beds, wardrobes, nightstands, dressers
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'wardrobe',
    name: 'Wardrobe',
    group: 'Wardrobes',
    type: 'WARDROBE',
    category: 'FURNITURE',
    tags: ['bedroom', 'storage'],
    roomTypes: ['Bedroom'],
    brand: 'Godrej Interio',
    sku: 'GI-WD-1200',
    defaultVariantId: 'wardrobe_1200',
    variants: [
      { id: 'wardrobe_900', label: '900W x 600D x 2100H · 2 Shutter', width: 900, depth: 600, height: 2100, price: 32000, unit: 'unit', shutterCount: 2 },
      { id: 'wardrobe_1200', label: '1200W x 600D x 2100H · 3 Shutter', width: 1200, depth: 600, height: 2100, price: 42000, unit: 'unit', shutterCount: 3 },
      { id: 'wardrobe_1800', label: '1800W x 600D x 2100H · 4 Shutter', width: 1800, depth: 600, height: 2100, price: 62000, unit: 'unit', shutterCount: 4 },
      { id: 'wardrobe_2400', label: '2400W x 600D x 2100H · 6 Shutter', width: 2400, depth: 600, height: 2100, price: 84000, unit: 'unit', shutterCount: 6 },
    ],
    hasHandle: true,
    skirtingHeight: 100,
  },
  {
    id: 'sliding_wardrobe',
    name: 'Sliding Wardrobe',
    group: 'Wardrobes',
    type: 'WARDROBE',
    category: 'FURNITURE',
    tags: ['bedroom', 'storage', 'sliding'],
    roomTypes: ['Bedroom'],
    brand: 'Hettich',
    sku: 'HT-SLD-2000',
    defaultVariantId: 'sliding_2000',
    variants: [
      { id: 'sliding_2000', label: '2000W x 650D x 2300H · Sliding', width: 2000, depth: 650, height: 2300, price: 78000, unit: 'unit', shutterCount: 2 },
      { id: 'sliding_2500', label: '2500W x 650D x 2400H · Sliding', width: 2500, depth: 650, height: 2400, price: 95000, unit: 'unit', shutterCount: 3 },
    ],
    hasHandle: false,
    skirtingHeight: 100,
  },
  {
    id: 'bed_single',
    name: 'Single Bed',
    group: 'Beds',
    type: 'BED',
    category: 'FURNITURE',
    tags: ['bedroom', 'bed'],
    roomTypes: ['Bedroom', 'Kids'],
    brand: 'Urban Ladder',
    sku: 'UL-BED-S',
    defaultVariantId: 'bed_single_900',
    variants: [
      { id: 'bed_single_900', label: '900W x 1900D x 350H', width: 900, depth: 1900, height: 350, price: 22000, unit: 'unit', shutterCount: 0 },
    ],
  },
  {
    id: 'bed_queen',
    name: 'Queen Bed (Storage)',
    group: 'Beds',
    type: 'BED',
    category: 'FURNITURE',
    tags: ['bedroom', 'bed', 'storage'],
    roomTypes: ['Bedroom'],
    brand: 'Wakefit',
    sku: 'WK-BED-Q',
    defaultVariantId: 'bed_queen_1500',
    variants: [
      { id: 'bed_queen_1500', label: '1500W x 2000D x 400H', width: 1500, depth: 2000, height: 400, price: 38000, unit: 'unit', shutterCount: 0 },
    ],
  },
  {
    id: 'bed_king',
    name: 'King Bed (Storage)',
    group: 'Beds',
    type: 'BED',
    category: 'FURNITURE',
    tags: ['bedroom', 'bed', 'storage'],
    roomTypes: ['Bedroom'],
    brand: 'Urban Ladder',
    sku: 'UL-BED-K',
    defaultVariantId: 'bed_king_1800',
    variants: [
      { id: 'bed_king_1800', label: '1800W x 2000D x 400H', width: 1800, depth: 2000, height: 400, price: 48000, unit: 'unit', shutterCount: 0 },
    ],
  },
  {
    id: 'nightstand',
    name: 'Bedside Table',
    group: 'Bedside',
    type: 'NIGHTSTAND',
    category: 'FURNITURE',
    tags: ['bedroom', 'storage'],
    roomTypes: ['Bedroom'],
    brand: 'Pepperfry',
    sku: 'PF-NS-450',
    defaultVariantId: 'nightstand_450',
    variants: [
      { id: 'nightstand_450', label: '450W x 400D x 550H', width: 450, depth: 400, height: 550, price: 6500, unit: 'unit', drawerCount: 2 },
    ],
    hasHandle: true,
  },
  {
    id: 'dresser',
    name: 'Chest of Drawers',
    group: 'Dressers',
    type: 'DRESSER',
    category: 'FURNITURE',
    tags: ['bedroom', 'drawer', 'storage'],
    roomTypes: ['Bedroom'],
    brand: 'Godrej Interio',
    sku: 'GI-DR-1000',
    defaultVariantId: 'dresser_1000',
    variants: [
      { id: 'dresser_900', label: '900W x 500D x 950H · 5 Drawer', width: 900, depth: 500, height: 950, price: 24000, unit: 'unit', drawerCount: 5 },
      { id: 'dresser_1000', label: '1000W x 500D x 1050H · 6 Drawer', width: 1000, depth: 500, height: 1050, price: 28000, unit: 'unit', drawerCount: 6 },
    ],
    hasHandle: true,
  },
  {
    id: 'dressing_table',
    name: 'Dressing Table',
    group: 'Dressers',
    type: 'DRESSER',
    category: 'FURNITURE',
    tags: ['bedroom', 'mirror', 'vanity'],
    roomTypes: ['Bedroom'],
    brand: 'HomeTown',
    sku: 'HT-DT-1100',
    defaultVariantId: 'dt_1100',
    variants: [
      { id: 'dt_1100', label: '1100W x 450D x 1700H', width: 1100, depth: 450, height: 1700, price: 22000, unit: 'unit', drawerCount: 3 },
    ],
    hasHandle: true,
  },

  // ──────────────────────────────────────────────────────────────────
  // LIVING ROOM
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'sofa_2seater',
    name: '2-Seater Sofa',
    group: 'Sofas',
    type: 'SOFA',
    category: 'FURNITURE',
    tags: ['living', 'seating'],
    roomTypes: ['Living'],
    brand: 'Urban Ladder',
    sku: 'UL-SF-2',
    defaultVariantId: 'sofa_2_1500',
    variants: [
      { id: 'sofa_2_1500', label: '1500W x 850D x 850H', width: 1500, depth: 850, height: 850, price: 35000, unit: 'unit', shutterCount: 0 },
    ],
  },
  {
    id: 'sofa_3seater',
    name: '3-Seater Sofa',
    group: 'Sofas',
    type: 'SOFA',
    category: 'FURNITURE',
    tags: ['living', 'seating'],
    roomTypes: ['Living'],
    brand: 'Urban Ladder',
    sku: 'UL-SF-3',
    defaultVariantId: 'sofa_3_2200',
    variants: [
      { id: 'sofa_3_2200', label: '2200W x 900D x 850H', width: 2200, depth: 900, height: 850, price: 55000, unit: 'unit', shutterCount: 0 },
    ],
  },
  {
    id: 'sofa_lshape',
    name: 'L-Shape Sectional',
    group: 'Sofas',
    type: 'SOFA',
    category: 'FURNITURE',
    tags: ['living', 'seating', 'sectional'],
    roomTypes: ['Living'],
    brand: 'Urban Ladder',
    sku: 'UL-SF-L',
    defaultVariantId: 'sofa_l_2800',
    variants: [
      { id: 'sofa_l_2800', label: '2800W x 1700D x 850H', width: 2800, depth: 1700, height: 850, price: 95000, unit: 'unit', shutterCount: 0 },
    ],
  },
  {
    id: 'armchair',
    name: 'Accent Armchair',
    group: 'Seating',
    type: 'CHAIR',
    category: 'FURNITURE',
    tags: ['living', 'seating', 'accent'],
    roomTypes: ['Living', 'Bedroom'],
    brand: 'Pepperfry',
    sku: 'PF-AC-1',
    defaultVariantId: 'arm_750',
    variants: [
      { id: 'arm_750', label: '750W x 800D x 850H', width: 750, depth: 800, height: 850, price: 18000, unit: 'unit', shutterCount: 0 },
    ],
  },
  {
    id: 'coffee_table',
    name: 'Coffee Table',
    group: 'Tables',
    type: 'COFFEE_TABLE',
    category: 'FURNITURE',
    tags: ['living', 'table', 'low'],
    roomTypes: ['Living'],
    brand: 'Pepperfry',
    sku: 'PF-CT-1200',
    defaultVariantId: 'coffee_1200',
    variants: [
      { id: 'coffee_900', label: '900W x 600D x 400H', width: 900, depth: 600, height: 400, price: 12000, unit: 'unit', shutterCount: 0 },
      { id: 'coffee_1200', label: '1200W x 700D x 400H', width: 1200, depth: 700, height: 400, price: 16500, unit: 'unit', shutterCount: 0 },
    ],
  },
  {
    id: 'side_table',
    name: 'Side Table',
    group: 'Tables',
    type: 'TABLE',
    category: 'FURNITURE',
    tags: ['living', 'table'],
    roomTypes: ['Living', 'Bedroom'],
    brand: 'Pepperfry',
    sku: 'PF-ST-450',
    defaultVariantId: 'side_450',
    variants: [
      { id: 'side_450', label: '450W x 450D x 550H', width: 450, depth: 450, height: 550, price: 6500, unit: 'unit', shutterCount: 0 },
    ],
  },
  {
    id: 'tv_unit_low',
    name: 'TV Unit (Low)',
    group: 'TV Units',
    type: 'TV_UNIT',
    category: 'FURNITURE',
    tags: ['living', 'media', 'tv'],
    roomTypes: ['Living', 'Bedroom'],
    brand: 'Godrej Interio',
    sku: 'GI-TV-1800',
    defaultVariantId: 'tv_1800',
    variants: [
      { id: 'tv_1500', label: '1500W x 450D x 500H', width: 1500, depth: 450, height: 500, price: 22000, unit: 'unit', drawerCount: 2 },
      { id: 'tv_1800', label: '1800W x 450D x 500H', width: 1800, depth: 450, height: 500, price: 28000, unit: 'unit', drawerCount: 2, shutterCount: 2 },
      { id: 'tv_2400', label: '2400W x 500D x 550H', width: 2400, depth: 500, height: 550, price: 38000, unit: 'unit', drawerCount: 2, shutterCount: 4 },
    ],
    hasHandle: true,
    skirtingHeight: 0,
  },
  {
    id: 'bookshelf',
    name: 'Bookshelf',
    group: 'Shelving',
    type: 'BOOKSHELF',
    category: 'FURNITURE',
    tags: ['living', 'storage', 'books'],
    roomTypes: ['Living', 'Office'],
    brand: 'Pepperfry',
    sku: 'PF-BK-900',
    defaultVariantId: 'book_900',
    variants: [
      { id: 'book_900', label: '900W x 350D x 1800H', width: 900, depth: 350, height: 1800, price: 18000, unit: 'unit', shutterCount: 0 },
      { id: 'book_1200', label: '1200W x 350D x 2100H', width: 1200, depth: 350, height: 2100, price: 26000, unit: 'unit', shutterCount: 0 },
    ],
  },
  {
    id: 'console_unit',
    name: 'Console Table',
    group: 'Tables',
    type: 'CONSOLE' as any,
    category: 'FURNITURE',
    tags: ['living', 'foyer', 'narrow'],
    roomTypes: ['Living'],
    brand: 'HomeTown',
    sku: 'HT-CN-1200',
    defaultVariantId: 'console_1200',
    variants: [
      { id: 'console_1200', label: '1200W x 350D x 800H', width: 1200, depth: 350, height: 800, price: 14500, unit: 'unit', drawerCount: 2 },
    ],
    hasHandle: true,
  },

  // ──────────────────────────────────────────────────────────────────
  // DINING ROOM
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'dining_4',
    name: 'Dining Table (4-Seater)',
    group: 'Dining Tables',
    type: 'DINING_TABLE',
    category: 'FURNITURE',
    tags: ['dining', 'table'],
    roomTypes: ['Dining'],
    brand: 'Urban Ladder',
    sku: 'UL-DT-4',
    defaultVariantId: 'dining_4_1200',
    variants: [
      { id: 'dining_4_1200', label: '1200W x 800D x 750H', width: 1200, depth: 800, height: 750, price: 28000, unit: 'unit', shutterCount: 0 },
    ],
  },
  {
    id: 'dining_6',
    name: 'Dining Table (6-Seater)',
    group: 'Dining Tables',
    type: 'DINING_TABLE',
    category: 'FURNITURE',
    tags: ['dining', 'table'],
    roomTypes: ['Dining'],
    brand: 'Urban Ladder',
    sku: 'UL-DT-6',
    defaultVariantId: 'dining_6_1800',
    variants: [
      { id: 'dining_6_1800', label: '1800W x 900D x 750H', width: 1800, depth: 900, height: 750, price: 42000, unit: 'unit', shutterCount: 0 },
    ],
  },
  {
    id: 'dining_chair',
    name: 'Dining Chair',
    group: 'Chairs',
    type: 'CHAIR',
    category: 'FURNITURE',
    tags: ['dining', 'seating'],
    roomTypes: ['Dining'],
    brand: 'Pepperfry',
    sku: 'PF-DC-1',
    defaultVariantId: 'dchair_450',
    variants: [
      { id: 'dchair_450', label: '450W x 500D x 900H', width: 450, depth: 500, height: 900, price: 5500, unit: 'unit', shutterCount: 0 },
    ],
  },
  {
    id: 'crockery_unit',
    name: 'Crockery Unit',
    group: 'Storage',
    type: 'CABINET_TALL',
    category: 'FURNITURE',
    tags: ['dining', 'crockery', 'glass'],
    roomTypes: ['Dining'],
    brand: 'Godrej Interio',
    sku: 'GI-CR-1200',
    defaultVariantId: 'crockery_1200',
    variants: [
      { id: 'crockery_1200', label: '1200W x 450D x 2000H', width: 1200, depth: 450, height: 2000, price: 38000, unit: 'unit', shutterCount: 4 },
    ],
    hasHandle: true,
    skirtingHeight: 100,
  },

  // ──────────────────────────────────────────────────────────────────
  // BATHROOM
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'vanity_single',
    name: 'Vanity (Single Sink)',
    group: 'Vanity',
    type: 'VANITY',
    category: 'FURNITURE',
    tags: ['bathroom', 'sink', 'vanity'],
    roomTypes: ['Bathroom'],
    brand: 'Hindware',
    sku: 'HW-VN-900',
    defaultVariantId: 'vanity_900',
    variants: [
      { id: 'vanity_900', label: '900W x 500D x 850H', width: 900, depth: 500, height: 850, price: 22000, unit: 'unit', drawerCount: 2 },
      { id: 'vanity_1200', label: '1200W x 500D x 850H', width: 1200, depth: 500, height: 850, price: 28000, unit: 'unit', drawerCount: 3 },
    ],
    hasHandle: true,
    skirtingHeight: 0,
  },
  {
    id: 'vanity_double',
    name: 'Vanity (Double Sink)',
    group: 'Vanity',
    type: 'VANITY',
    category: 'FURNITURE',
    tags: ['bathroom', 'sink', 'vanity'],
    roomTypes: ['Bathroom'],
    brand: 'Cera',
    sku: 'CR-VN-1500',
    defaultVariantId: 'vanity_dbl_1500',
    variants: [
      { id: 'vanity_dbl_1500', label: '1500W x 500D x 850H', width: 1500, depth: 500, height: 850, price: 38000, unit: 'unit', drawerCount: 4 },
    ],
    hasHandle: true,
    skirtingHeight: 0,
  },
  {
    id: 'mirror_cabinet',
    name: 'Mirror Cabinet',
    group: 'Mirrors',
    type: 'MIRROR',
    category: 'FURNITURE',
    tags: ['bathroom', 'mirror', 'storage'],
    roomTypes: ['Bathroom'],
    brand: 'Hindware',
    sku: 'HW-MC-700',
    mountHeight: 1100,
    defaultVariantId: 'mirror_700',
    variants: [
      { id: 'mirror_700', label: '700W x 150D x 800H', width: 700, depth: 150, height: 800, price: 9500, unit: 'unit', shutterCount: 1 },
    ],
    hasHandle: true,
  },

  // ──────────────────────────────────────────────────────────────────
  // OFFICE / STUDY
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'desk',
    name: 'Office Desk',
    group: 'Desks',
    type: 'DESK',
    category: 'FURNITURE',
    tags: ['office', 'work', 'desk'],
    roomTypes: ['Office', 'Bedroom'],
    brand: 'Featherlite',
    sku: 'FT-DSK-1200',
    defaultVariantId: 'desk_1200',
    variants: [
      { id: 'desk_1200', label: '1200W x 600D x 750H', width: 1200, depth: 600, height: 750, price: 16500, unit: 'unit', drawerCount: 2 },
      { id: 'desk_1500', label: '1500W x 600D x 750H', width: 1500, depth: 600, height: 750, price: 22000, unit: 'unit', drawerCount: 2 },
    ],
    hasHandle: true,
  },
  {
    id: 'desk_l_shape',
    name: 'L-Shape Desk',
    group: 'Desks',
    type: 'DESK',
    category: 'FURNITURE',
    tags: ['office', 'desk', 'corner'],
    roomTypes: ['Office'],
    brand: 'Godrej Interio',
    sku: 'GI-LDK-1800',
    defaultVariantId: 'lshape_1800',
    variants: [
      { id: 'lshape_1800', label: '1800W x 1500D x 750H', width: 1800, depth: 1500, height: 750, price: 38000, unit: 'unit', drawerCount: 3 },
    ],
    hasHandle: true,
  },
  {
    id: 'office_chair',
    name: 'Ergonomic Office Chair',
    group: 'Chairs',
    type: 'OFFICE_CHAIR',
    category: 'FURNITURE',
    tags: ['office', 'seating', 'ergonomic'],
    roomTypes: ['Office'],
    brand: 'Featherlite',
    sku: 'FT-OC-1',
    defaultVariantId: 'oc_650',
    variants: [
      { id: 'oc_650', label: '650W x 650D x 1100H', width: 650, depth: 650, height: 1100, price: 14500, unit: 'unit', shutterCount: 0 },
    ],
  },
  {
    id: 'filing_cabinet',
    name: 'Filing Cabinet',
    group: 'Office Storage',
    type: 'CABINET_TALL',
    category: 'FURNITURE',
    tags: ['office', 'filing', 'storage'],
    roomTypes: ['Office'],
    brand: 'Godrej Interio',
    sku: 'GI-FC-450',
    defaultVariantId: 'fc_450',
    variants: [
      { id: 'fc_450', label: '450W x 500D x 1300H · 4 Drawer', width: 450, depth: 500, height: 1300, price: 18000, unit: 'unit', drawerCount: 4 },
    ],
    hasHandle: true,
    skirtingHeight: 100,
  },

  // ──────────────────────────────────────────────────────────────────
  // KIDS
  // ──────────────────────────────────────────────────────────────────
  {
    id: 'study_unit',
    name: 'Kids Study Unit',
    group: 'Study',
    type: 'STUDY_UNIT',
    category: 'FURNITURE',
    tags: ['kids', 'study', 'desk'],
    roomTypes: ['Kids'],
    brand: 'HomeTown',
    sku: 'HT-KS-1000',
    defaultVariantId: 'kstudy_1000',
    variants: [
      { id: 'kstudy_1000', label: '1000W x 550D x 1500H', width: 1000, depth: 550, height: 1500, price: 14500, unit: 'unit', drawerCount: 2 },
    ],
    hasHandle: true,
  },
  {
    id: 'shoe_rack',
    name: 'Shoe Rack',
    group: 'Storage',
    type: 'SHOE_RACK',
    category: 'FURNITURE',
    tags: ['foyer', 'storage', 'shoes'],
    roomTypes: ['Living'],
    brand: 'HomeTown',
    sku: 'HT-SR-900',
    defaultVariantId: 'sr_900',
    variants: [
      { id: 'sr_900', label: '900W x 350D x 1100H', width: 900, depth: 350, height: 1100, price: 9500, unit: 'unit', shutterCount: 2 },
    ],
    hasHandle: true,
    skirtingHeight: 50,
  },
];

export const materialCatalog: MaterialItem[] = [
  // ──────────────────────────────────────────────────────────────────
  // SOLID PAINTS — Asian Paints, Berger, Dulux
  // ──────────────────────────────────────────────────────────────────
  { id: 'paint_ivory_white', name: 'Ivory White', group: 'Solid Paints', color: '#f7f3e8', rate: 35, unit: 'sqft', brand: 'Asian Paints', sku: 'AP-7853', finishType: 'Matte', pattern: 'solid', tags: ['neutral', 'warm', 'ceiling'] },
  { id: 'paint_pure_white', name: 'Pure White', group: 'Solid Paints', color: '#fafaf7', rate: 35, unit: 'sqft', brand: 'Asian Paints', sku: 'AP-7901', finishType: 'Matte', pattern: 'solid', tags: ['neutral', 'cool'] },
  { id: 'paint_silk_grey', name: 'Silk Grey', group: 'Solid Paints', color: '#cbd5e1', rate: 45, unit: 'sqft', brand: 'Berger', sku: 'BG-2210', finishType: 'Matte', pattern: 'solid', tags: ['neutral', 'modern'] },
  { id: 'paint_beige_cream', name: 'Beige Cream', group: 'Solid Paints', color: '#e8dcc4', rate: 40, unit: 'sqft', brand: 'Asian Paints', sku: 'AP-8104', finishType: 'Matte', pattern: 'solid', tags: ['warm', 'neutral'] },
  { id: 'paint_sage_green', name: 'Sage Green', group: 'Solid Paints', color: '#9caf88', rate: 50, unit: 'sqft', brand: 'Dulux', sku: 'DX-3402', finishType: 'Matte', pattern: 'solid', tags: ['green', 'calming'] },
  { id: 'paint_opal_green', name: 'Opal Green', group: 'Solid Paints', color: '#134e4a', rate: 50, unit: 'sqft', brand: 'Asian Paints', sku: 'AP-9211', finishType: 'Matte', pattern: 'solid', tags: ['green', 'dark'] },
  { id: 'paint_dusty_rose', name: 'Dusty Rose', group: 'Solid Paints', color: '#c98b8b', rate: 50, unit: 'sqft', brand: 'Berger', sku: 'BG-4501', finishType: 'Matte', pattern: 'solid', tags: ['pink', 'warm'] },
  { id: 'paint_terracotta', name: 'Terracotta', group: 'Solid Paints', color: '#b85c38', rate: 55, unit: 'sqft', brand: 'Asian Paints', sku: 'AP-6622', finishType: 'Matte', pattern: 'solid', tags: ['earthy', 'warm'] },
  { id: 'paint_orange_brown', name: 'Orange Brown', group: 'Solid Paints', color: '#9a3412', rate: 55, unit: 'sqft', brand: 'Nerolac', sku: 'NL-3103', finishType: 'Matte', pattern: 'solid', tags: ['warm', 'bold'] },
  { id: 'paint_mustard_ochre', name: 'Mustard Ochre', group: 'Solid Paints', color: '#c89b3c', rate: 55, unit: 'sqft', brand: 'Dulux', sku: 'DX-5501', finishType: 'Matte', pattern: 'solid', tags: ['yellow', 'warm'] },
  { id: 'paint_navy_indigo', name: 'Navy Indigo', group: 'Solid Paints', color: '#1e3a5f', rate: 60, unit: 'sqft', brand: 'Asian Paints', sku: 'AP-1140', finishType: 'Matte', pattern: 'solid', tags: ['blue', 'dark'] },
  { id: 'paint_matte_black', name: 'Matte Black', group: 'Solid Paints', color: '#1e293b', rate: 65, unit: 'sqft', brand: 'Berger', sku: 'BG-0001', finishType: 'Matte', pattern: 'solid', tags: ['dark', 'modern'] },

  // ──────────────────────────────────────────────────────────────────
  // TEXTURE PAINT — Royale Play, Berger Textura
  // ──────────────────────────────────────────────────────────────────
  { id: 'texture_royale_sand', name: 'Royale Sand', group: 'Texture Paint', color: '#d4c5a8', rate: 110, unit: 'sqft', brand: 'Asian Paints Royale Play', sku: 'RP-S101', finishType: 'Textured', pattern: 'concrete', tags: ['warm', 'rough'] },
  { id: 'texture_royale_silk', name: 'Royale Silk', group: 'Texture Paint', color: '#e6dcc8', rate: 130, unit: 'sqft', brand: 'Asian Paints Royale Play', sku: 'RP-K202', finishType: 'Glossy', pattern: 'solid', tags: ['warm', 'sheen'] },
  { id: 'texture_textura_stucco', name: 'Stucco Beige', group: 'Texture Paint', color: '#c8b89a', rate: 145, unit: 'sqft', brand: 'Berger Textura', sku: 'TX-S301', finishType: 'Textured', pattern: 'concrete', tags: ['earthy'] },
  { id: 'texture_textura_grit', name: 'Grit Stone', group: 'Texture Paint', color: '#9ca3af', rate: 145, unit: 'sqft', brand: 'Berger Textura', sku: 'TX-G402', finishType: 'Textured', pattern: 'concrete', tags: ['neutral', 'rough'] },
  { id: 'texture_lime_white', name: 'Lime Wash White', group: 'Texture Paint', color: '#f1ece0', rate: 95, unit: 'sqft', brand: 'Pidilite', sku: 'PD-LW01', finishType: 'Textured', pattern: 'concrete', tags: ['white', 'rustic'] },
  { id: 'texture_metallica', name: 'Metallica Bronze', group: 'Texture Paint', color: '#8b6f47', rate: 195, unit: 'sqft', brand: 'Asian Paints Royale Play', sku: 'RP-M501', finishType: 'Reflective', pattern: 'metal', tags: ['metallic', 'bold'] },

  // ──────────────────────────────────────────────────────────────────
  // LAMINATE — Greenlam, Merino, Century, AICA
  // ──────────────────────────────────────────────────────────────────
  { id: 'laminate_white_gloss', name: 'White Gloss', group: 'Laminate', color: '#f8fafc', rate: 85, unit: 'sqft', brand: 'Greenlam', sku: 'GL-1100', finishType: 'Glossy', pattern: 'solid', tags: ['white', 'clean'] },
  { id: 'laminate_ash_grey', name: 'Ash Grey', group: 'Laminate', color: '#9ca3af', rate: 90, unit: 'sqft', brand: 'Greenlam', sku: 'GL-2204', finishType: 'Matte', pattern: 'solid', tags: ['grey', 'neutral'] },
  { id: 'laminate_concrete', name: 'Concrete Stone', group: 'Laminate', color: '#a8a29e', rate: 95, unit: 'sqft', brand: 'Merino', sku: 'MR-CS01', finishType: 'Textured', pattern: 'concrete', tags: ['industrial'] },
  { id: 'laminate_oak', name: 'Natural Oak', group: 'Laminate', color: '#d4a373', rate: 95, unit: 'sqft', brand: 'Greenlam', sku: 'GL-W3301', finishType: 'Natural', pattern: 'wood', tags: ['wood', 'light'] },
  { id: 'laminate_maple', name: 'Maple Wood', group: 'Laminate', color: '#e8c598', rate: 105, unit: 'sqft', brand: 'Century', sku: 'CL-M412', finishType: 'Natural', pattern: 'wood', tags: ['wood', 'light'] },
  { id: 'laminate_teak', name: 'Burma Teak', group: 'Laminate', color: '#a0673a', rate: 120, unit: 'sqft', brand: 'Greenlam', sku: 'GL-W7702', finishType: 'Natural', pattern: 'wood', tags: ['wood', 'warm'] },
  { id: 'laminate_walnut', name: 'American Walnut', group: 'Laminate', color: '#6b4423', rate: 130, unit: 'sqft', brand: 'Merino', sku: 'MR-W5503', finishType: 'Natural', pattern: 'wood', tags: ['wood', 'dark'] },
  { id: 'laminate_rosewood', name: 'Indian Rosewood', group: 'Laminate', color: '#4a2418', rate: 145, unit: 'sqft', brand: 'AICA', sku: 'AC-R8801', finishType: 'Natural', pattern: 'wood', tags: ['wood', 'premium'] },
  { id: 'laminate_matte_black', name: 'Matte Black', group: 'Laminate', color: '#0f172a', rate: 140, unit: 'sqft', brand: 'Greenlam', sku: 'GL-9999', finishType: 'Matte', pattern: 'solid', tags: ['black', 'modern'] },
  { id: 'laminate_marble_white', name: 'Carrara Marble', group: 'Laminate', color: '#eaeaea', rate: 165, unit: 'sqft', brand: 'Merino', sku: 'MR-CM01', finishType: 'Polished', pattern: 'marble', tags: ['marble', 'luxe'] },

  // ──────────────────────────────────────────────────────────────────
  // VENEER — premium natural wood
  // ──────────────────────────────────────────────────────────────────
  { id: 'veneer_oak', name: 'Natural Oak Veneer', group: 'Veneer', color: '#c8a878', rate: 160, unit: 'sqft', brand: 'Greenlam Decowood', sku: 'GD-OAK', finishType: 'Natural', pattern: 'wood', tags: ['wood', 'light'] },
  { id: 'veneer_teak', name: 'Burma Teak Veneer', group: 'Veneer', color: '#9c6a3d', rate: 195, unit: 'sqft', brand: 'Century Sainik', sku: 'CS-TK01', finishType: 'Natural', pattern: 'wood', tags: ['wood', 'classic'] },
  { id: 'veneer_walnut', name: 'Walnut Veneer', group: 'Veneer', color: '#7c4a2d', rate: 220, unit: 'sqft', brand: 'Archidply', sku: 'AD-WL02', finishType: 'Natural', pattern: 'wood', tags: ['wood', 'rich'] },
  { id: 'veneer_mahogany', name: 'Mahogany Veneer', group: 'Veneer', color: '#5d2e1f', rate: 240, unit: 'sqft', brand: 'Marino', sku: 'MO-MH01', finishType: 'Natural', pattern: 'wood', tags: ['wood', 'red'] },
  { id: 'veneer_rosewood', name: 'Rosewood Veneer', group: 'Veneer', color: '#4a2418', rate: 280, unit: 'sqft', brand: 'Greenlam Decowood', sku: 'GD-RW', finishType: 'Natural', pattern: 'wood', tags: ['wood', 'dark'] },
  { id: 'veneer_ebony', name: 'Smoked Ebony', group: 'Veneer', color: '#2a1810', rate: 320, unit: 'sqft', brand: 'Archidply', sku: 'AD-EB01', finishType: 'Natural', pattern: 'wood', tags: ['wood', 'premium'] },
  { id: 'veneer_zebrano', name: 'Zebrano Striped', group: 'Veneer', color: '#8c6a3a', rate: 295, unit: 'sqft', brand: 'Greenlam Decowood', sku: 'GD-ZB', finishType: 'Natural', pattern: 'wood', tags: ['wood', 'striped'] },

  // ──────────────────────────────────────────────────────────────────
  // WALLPAPER — Excel, Marshalls, Asian Paints
  // ──────────────────────────────────────────────────────────────────
  { id: 'wallpaper_linen', name: 'Linen Texture', group: 'Wallpaper', color: '#ebe6d7', rate: 100, unit: 'sqft', brand: 'Excel', sku: 'EX-LT01', finishType: 'Textured', pattern: 'fabric', tags: ['neutral', 'subtle'] },
  { id: 'wallpaper_concrete', name: 'Concrete Texture', group: 'Wallpaper', color: '#a8a29e', rate: 110, unit: 'sqft', brand: 'Marshalls', sku: 'MS-CT02', finishType: 'Textured', pattern: 'concrete', tags: ['industrial'] },
  { id: 'wallpaper_brick', name: 'Exposed Brick', group: 'Wallpaper', color: '#9b4f3a', rate: 130, unit: 'sqft', brand: 'Excel', sku: 'EX-BR03', finishType: 'Textured', pattern: 'brick', tags: ['rustic', 'red'] },
  { id: 'wallpaper_geometric', name: 'Geometric Pattern', group: 'Wallpaper', color: '#475569', rate: 160, unit: 'sqft', brand: 'Asian Paints Wallpaper', sku: 'APW-GP04', finishType: 'Matte', pattern: 'fabric', tags: ['modern', 'pattern'] },
  { id: 'wallpaper_floral', name: 'Floral Bloom', group: 'Wallpaper', color: '#d4a5a5', rate: 180, unit: 'sqft', brand: 'Marshalls', sku: 'MS-FL05', finishType: 'Matte', pattern: 'fabric', tags: ['romantic', 'pattern'] },
  { id: 'wallpaper_damask', name: 'Damask Heritage', group: 'Wallpaper', color: '#3f3f46', rate: 220, unit: 'sqft', brand: 'Excel', sku: 'EX-DM06', finishType: 'Matte', pattern: 'fabric', tags: ['classic', 'dark'] },
  { id: 'wallpaper_stripe', name: 'Vertical Stripe', group: 'Wallpaper', color: '#a3b18a', rate: 150, unit: 'sqft', brand: 'Asian Paints Wallpaper', sku: 'APW-ST07', finishType: 'Matte', pattern: 'fabric', tags: ['classic', 'pattern'] },
  { id: 'wallpaper_jute', name: 'Jute Weave', group: 'Wallpaper', color: '#c8a978', rate: 170, unit: 'sqft', brand: 'Marshalls', sku: 'MS-JT08', finishType: 'Textured', pattern: 'fabric', tags: ['natural', 'rustic'] },

  // ──────────────────────────────────────────────────────────────────
  // GLASS — Saint-Gobain, AIS, Modiguard
  // ──────────────────────────────────────────────────────────────────
  { id: 'glass_clear', name: 'Clear Glass 5mm', group: 'Glass', color: '#dbeafe', rate: 280, unit: 'sqft', brand: 'Saint-Gobain', sku: 'SG-CL05', finishType: 'Glossy', pattern: 'glass', tags: ['transparent'] },
  { id: 'glass_frosted', name: 'Frosted Glass', group: 'Glass', color: '#e2e8f0', rate: 320, unit: 'sqft', brand: 'AIS', sku: 'AIS-FR01', finishType: 'Matte', pattern: 'glass', tags: ['privacy'] },
  { id: 'glass_smoke', name: 'Smoke Grey Glass', group: 'Glass', color: '#475569', rate: 380, unit: 'sqft', brand: 'Modiguard', sku: 'MG-SM02', finishType: 'Glossy', pattern: 'glass', tags: ['dark'] },
  { id: 'glass_bronze', name: 'Bronze Tinted', group: 'Glass', color: '#78350f', rate: 420, unit: 'sqft', brand: 'Saint-Gobain', sku: 'SG-BR03', finishType: 'Glossy', pattern: 'glass', tags: ['warm'] },
  { id: 'glass_mirror', name: 'Reflective Mirror', group: 'Glass', color: '#cbd5e1', rate: 480, unit: 'sqft', brand: 'AIS', sku: 'AIS-MR04', finishType: 'Reflective', pattern: 'glass', tags: ['mirror'] },
  { id: 'glass_lacquered_white', name: 'Lacquered White', group: 'Glass', color: '#f5f5f4', rate: 520, unit: 'sqft', brand: 'Saint-Gobain Planilaque', sku: 'SG-LW05', finishType: 'Glossy', pattern: 'glass', tags: ['white', 'premium'] },

  // ──────────────────────────────────────────────────────────────────
  // WALL TILES — Kajaria, Somany, Nitco, Orient Bell
  // ──────────────────────────────────────────────────────────────────
  { id: 'walltile_kajaria_white', name: 'Glossy White Subway', group: 'Wall Tiles', color: '#f1f5f9', rate: 95, unit: 'sqft', brand: 'Kajaria', sku: 'KJ-WT001', finishType: 'Glossy', pattern: 'tile', tags: ['white', 'subway'] },
  { id: 'walltile_kajaria_marble', name: 'Statuario Marble Tile', group: 'Wall Tiles', color: '#fafafa', rate: 165, unit: 'sqft', brand: 'Kajaria', sku: 'KJ-MB002', finishType: 'Polished', pattern: 'marble', tags: ['marble', 'luxe'] },
  { id: 'walltile_somany_grey', name: 'Travertine Grey', group: 'Wall Tiles', color: '#9ca3af', rate: 125, unit: 'sqft', brand: 'Somany', sku: 'SM-TG003', finishType: 'Textured', pattern: 'marble', tags: ['stone'] },
  { id: 'walltile_nitco_mosaic', name: 'Mosaic Penny', group: 'Wall Tiles', color: '#c8a978', rate: 195, unit: 'sqft', brand: 'Nitco', sku: 'NT-MS004', finishType: 'Matte', pattern: 'tile', tags: ['mosaic', 'pattern'] },
  { id: 'walltile_orient_terracotta', name: 'Terracotta Square', group: 'Wall Tiles', color: '#b85c38', rate: 110, unit: 'sqft', brand: 'Orient Bell', sku: 'OB-TC005', finishType: 'Matte', pattern: 'tile', tags: ['warm', 'rustic'] },
  { id: 'walltile_kajaria_3d', name: '3D Chevron Black', group: 'Wall Tiles', color: '#1e293b', rate: 245, unit: 'sqft', brand: 'Kajaria Eternity', sku: 'KJ-3D006', finishType: 'Textured', pattern: 'tile', tags: ['black', 'pattern', '3d'] },

  // ──────────────────────────────────────────────────────────────────
  // WALL TEXTURE — decorative finishes
  // ──────────────────────────────────────────────────────────────────
  { id: 'walltex_lime_plaster', name: 'Lime Plaster', group: 'Wall Texture', color: '#e8e0cc', rate: 120, unit: 'sqft', brand: 'Pidilite', sku: 'PD-LP01', finishType: 'Textured', pattern: 'concrete', tags: ['rustic', 'natural'] },
  { id: 'walltex_microcement', name: 'Microcement Grey', group: 'Wall Texture', color: '#a8a29e', rate: 195, unit: 'sqft', brand: 'Topcret', sku: 'TC-MC02', finishType: 'Textured', pattern: 'concrete', tags: ['industrial', 'modern'] },
  { id: 'walltex_venetian', name: 'Venetian Plaster', group: 'Wall Texture', color: '#d6c5a8', rate: 245, unit: 'sqft', brand: 'San Marco', sku: 'SM-VP03', finishType: 'Polished', pattern: 'marble', tags: ['luxe', 'classic'] },
  { id: 'walltex_tadelakt', name: 'Tadelakt Earth', group: 'Wall Texture', color: '#9a7b4f', rate: 280, unit: 'sqft', brand: 'San Marco', sku: 'SM-TD04', finishType: 'Polished', pattern: 'concrete', tags: ['earthy', 'artisan'] },
  { id: 'walltex_stone_cladding', name: 'Stone Cladding', group: 'Wall Texture', color: '#71717a', rate: 195, unit: 'sqft', brand: 'Stonex', sku: 'SX-SC05', finishType: 'Natural', pattern: 'concrete', tags: ['stone', 'rustic'] },

  // ──────────────────────────────────────────────────────────────────
  // METAL FINISHES — Hettich, Hafele
  // ──────────────────────────────────────────────────────────────────
  { id: 'metal_brushed_steel', name: 'Brushed Steel', group: 'Metal', color: '#a3a3a3', rate: 180, unit: 'sqft', brand: 'Hettich', sku: 'HT-BS01', finishType: 'Reflective', pattern: 'metal', tags: ['silver', 'modern'] },
  { id: 'metal_brushed_brass', name: 'Brushed Brass', group: 'Metal', color: '#b08d57', rate: 220, unit: 'sqft', brand: 'Hafele', sku: 'HF-BB02', finishType: 'Reflective', pattern: 'metal', tags: ['gold', 'warm'] },
  { id: 'metal_copper', name: 'Antique Copper', group: 'Metal', color: '#a35f3a', rate: 240, unit: 'sqft', brand: 'Hafele', sku: 'HF-AC03', finishType: 'Reflective', pattern: 'metal', tags: ['copper', 'vintage'] },
  { id: 'metal_black_oxide', name: 'Black Oxide', group: 'Metal', color: '#1c1917', rate: 165, unit: 'sqft', brand: 'Hettich', sku: 'HT-BO04', finishType: 'Matte', pattern: 'metal', tags: ['black', 'industrial'] },
  { id: 'metal_chrome', name: 'Polished Chrome', group: 'Metal', color: '#d4d4d8', rate: 195, unit: 'sqft', brand: 'Hettich', sku: 'HT-PC05', finishType: 'Reflective', pattern: 'metal', tags: ['silver', 'shiny'] },

  // ──────────────────────────────────────────────────────────────────
  // PU FINISHES — high-end paint finish
  // ──────────────────────────────────────────────────────────────────
  { id: 'pu_glossy_white', name: 'PU Gloss White', group: 'PU Finishes', color: '#fafafa', rate: 220, unit: 'sqft', brand: 'Sirca', sku: 'SC-PG01', finishType: 'Glossy', pattern: 'solid', tags: ['white', 'premium'] },
  { id: 'pu_matte_black', name: 'PU Matte Black', group: 'PU Finishes', color: '#0f172a', rate: 240, unit: 'sqft', brand: 'Sirca', sku: 'SC-PM02', finishType: 'Matte', pattern: 'solid', tags: ['black', 'premium'] },
  { id: 'pu_pearl_grey', name: 'PU Pearl Grey', group: 'PU Finishes', color: '#cbd5e1', rate: 230, unit: 'sqft', brand: 'Asian Paints PU', sku: 'AP-PG03', finishType: 'Glossy', pattern: 'solid', tags: ['grey', 'sheen'] },
  { id: 'pu_champagne', name: 'PU Champagne Gold', group: 'PU Finishes', color: '#c4a878', rate: 280, unit: 'sqft', brand: 'Sirca', sku: 'SC-CG04', finishType: 'Reflective', pattern: 'metal', tags: ['gold', 'luxe'] },

  // ──────────────────────────────────────────────────────────────────
  // ACRYLIC — Greenlam, Merino acrylic shutters
  // ──────────────────────────────────────────────────────────────────
  { id: 'acrylic_high_gloss_white', name: 'High Gloss White', group: 'Acrylic', color: '#fefefe', rate: 295, unit: 'sqft', brand: 'Greenlam Acrylic', sku: 'GA-HG01', finishType: 'Glossy', pattern: 'solid', tags: ['white', 'shiny'] },
  { id: 'acrylic_high_gloss_red', name: 'High Gloss Red', group: 'Acrylic', color: '#dc2626', rate: 320, unit: 'sqft', brand: 'Greenlam Acrylic', sku: 'GA-HR02', finishType: 'Glossy', pattern: 'solid', tags: ['red', 'bold'] },
  { id: 'acrylic_metallic_silver', name: 'Metallic Silver', group: 'Acrylic', color: '#a3a3a3', rate: 340, unit: 'sqft', brand: 'Merino Acrylic', sku: 'MA-MS03', finishType: 'Reflective', pattern: 'metal', tags: ['silver', 'modern'] },
  { id: 'acrylic_high_gloss_black', name: 'High Gloss Black', group: 'Acrylic', color: '#0f172a', rate: 320, unit: 'sqft', brand: 'Greenlam Acrylic', sku: 'GA-HB04', finishType: 'Glossy', pattern: 'solid', tags: ['black', 'modern'] },
  { id: 'acrylic_high_gloss_blue', name: 'High Gloss Cobalt', group: 'Acrylic', color: '#1e40af', rate: 320, unit: 'sqft', brand: 'Merino Acrylic', sku: 'MA-HB05', finishType: 'Glossy', pattern: 'solid', tags: ['blue', 'bold'] },

  // ──────────────────────────────────────────────────────────────────
  // COUNTERTOP — granite, marble, quartz, Caesarstone
  // ──────────────────────────────────────────────────────────────────
  { id: 'counter_granite_black', name: 'Black Galaxy Granite', group: 'Countertop', color: '#1c1917', rate: 280, unit: 'sqft', brand: 'Granite India', sku: 'GI-BG01', finishType: 'Polished', pattern: 'marble', tags: ['black', 'durable'] },
  { id: 'counter_granite_kashmir', name: 'Kashmir White Granite', group: 'Countertop', color: '#e7e5e4', rate: 320, unit: 'sqft', brand: 'Granite India', sku: 'GI-KW02', finishType: 'Polished', pattern: 'marble', tags: ['white', 'classic'] },
  { id: 'counter_quartz_grey', name: 'Quartz Stone Grey', group: 'Countertop', color: '#9ca3af', rate: 380, unit: 'sqft', brand: 'Quartzforms', sku: 'QF-QG03', finishType: 'Polished', pattern: 'marble', tags: ['grey', 'modern'] },
  { id: 'counter_quartz_white', name: 'Carrara Quartz', group: 'Countertop', color: '#f1f5f9', rate: 420, unit: 'sqft', brand: 'Caesarstone', sku: 'CS-CQ04', finishType: 'Polished', pattern: 'marble', tags: ['white', 'premium'] },
  { id: 'counter_marble', name: 'Indian White Marble', group: 'Countertop', color: '#e5e7eb', rate: 450, unit: 'sqft', brand: 'Rajasthan Marbles', sku: 'RM-IW05', finishType: 'Polished', pattern: 'marble', tags: ['white', 'natural'] },
  { id: 'counter_statuario', name: 'Statuario Marble', group: 'Countertop', color: '#fafafa', rate: 650, unit: 'sqft', brand: 'Italian Imports', sku: 'II-ST06', finishType: 'Polished', pattern: 'marble', tags: ['white', 'luxe'] },
  { id: 'counter_calacatta', name: 'Calacatta Gold', group: 'Countertop', color: '#f5f0e1', rate: 720, unit: 'sqft', brand: 'Caesarstone', sku: 'CS-CG07', finishType: 'Polished', pattern: 'marble', tags: ['gold', 'luxe'] },

  // ──────────────────────────────────────────────────────────────────
  // FLOORING — tiles, wood, vinyl, laminate
  // ──────────────────────────────────────────────────────────────────
  { id: 'floor_warm_beige', name: 'Warm Beige Tile', group: 'Flooring', color: '#e6c99d', rate: 120, unit: 'sqft', brand: 'Kajaria', sku: 'KJ-FL001', finishType: 'Matte', pattern: 'tile', tags: ['warm', 'neutral'] },
  { id: 'floor_vitrified', name: 'Vitrified Glossy', group: 'Flooring', color: '#f1f5f9', rate: 140, unit: 'sqft', brand: 'Somany', sku: 'SM-VG002', finishType: 'Glossy', pattern: 'tile', tags: ['white', 'shiny'] },
  { id: 'floor_grey_stone', name: 'Grey Stone Tile', group: 'Flooring', color: '#71717a', rate: 165, unit: 'sqft', brand: 'Nitco', sku: 'NT-GS003', finishType: 'Matte', pattern: 'tile', tags: ['stone', 'neutral'] },
  { id: 'floor_terrazzo', name: 'Terrazzo Speckled', group: 'Flooring', color: '#d6d3d1', rate: 195, unit: 'sqft', brand: 'Bharat Floorings', sku: 'BF-TZ004', finishType: 'Polished', pattern: 'tile', tags: ['classic', 'speckled'] },
  { id: 'floor_wooden_laminate', name: 'Wooden Laminate Plank', group: 'Flooring', color: '#a47148', rate: 220, unit: 'sqft', brand: 'Pergo', sku: 'PG-WL005', finishType: 'Natural', pattern: 'wood', tags: ['wood', 'warm'] },
  { id: 'floor_engineered_oak', name: 'Engineered Oak', group: 'Flooring', color: '#c8a878', rate: 380, unit: 'sqft', brand: 'Action Tesa', sku: 'AT-EO006', finishType: 'Natural', pattern: 'wood', tags: ['wood', 'premium'] },
  { id: 'floor_italian_marble', name: 'Italian Marble', group: 'Flooring', color: '#f5f5f4', rate: 320, unit: 'sqft', brand: 'Italian Imports', sku: 'II-IM007', finishType: 'Polished', pattern: 'marble', tags: ['marble', 'luxe'] },
  { id: 'floor_travertine', name: 'Travertine Stone', group: 'Flooring', color: '#c8b18b', rate: 380, unit: 'sqft', brand: 'Stonex', sku: 'SX-TV008', finishType: 'Natural', pattern: 'marble', tags: ['stone', 'rustic'] },
  { id: 'floor_vinyl_grey', name: 'Vinyl Plank Grey', group: 'Flooring', color: '#a8a29e', rate: 95, unit: 'sqft', brand: 'Welspun', sku: 'WS-VP009', finishType: 'Matte', pattern: 'wood', tags: ['budget', 'water-resistant'] },

  // ──────────────────────────────────────────────────────────────────
  // FABRIC — upholstery / drapes (D'Decor, Damro)
  // ──────────────────────────────────────────────────────────────────
  { id: 'fabric_velvet_emerald', name: 'Emerald Velvet', group: 'Fabric', color: '#065f46', rate: 380, unit: 'sqft', brand: "D'Decor", sku: 'DD-VE01', finishType: 'Textured', pattern: 'fabric', tags: ['green', 'luxe'] },
  { id: 'fabric_linen_natural', name: 'Natural Linen', group: 'Fabric', color: '#d6c4a4', rate: 220, unit: 'sqft', brand: "D'Decor", sku: 'DD-LN02', finishType: 'Textured', pattern: 'fabric', tags: ['neutral', 'breathable'] },
  { id: 'fabric_cotton_charcoal', name: 'Charcoal Cotton', group: 'Fabric', color: '#374151', rate: 195, unit: 'sqft', brand: 'Damro', sku: 'DM-CC03', finishType: 'Matte', pattern: 'fabric', tags: ['dark', 'casual'] },
  { id: 'fabric_velvet_blush', name: 'Blush Velvet', group: 'Fabric', color: '#e8b4b8', rate: 380, unit: 'sqft', brand: "D'Decor", sku: 'DD-VB04', finishType: 'Textured', pattern: 'fabric', tags: ['pink', 'romantic'] },
  { id: 'fabric_jute_natural', name: 'Jute Weave', group: 'Fabric', color: '#c8a978', rate: 165, unit: 'sqft', brand: 'Damro', sku: 'DM-JT05', finishType: 'Textured', pattern: 'fabric', tags: ['rustic', 'natural'] },

  // ──────────────────────────────────────────────────────────────────
  // LEATHER — upholstery
  // ──────────────────────────────────────────────────────────────────
  { id: 'leather_tan', name: 'Tan Genuine Leather', group: 'Leather', color: '#a0673a', rate: 580, unit: 'sqft', brand: 'Stanley', sku: 'ST-TL01', finishType: 'Natural', pattern: 'fabric', tags: ['warm', 'classic'] },
  { id: 'leather_black', name: 'Black Genuine Leather', group: 'Leather', color: '#1c1917', rate: 620, unit: 'sqft', brand: 'Stanley', sku: 'ST-BL02', finishType: 'Natural', pattern: 'fabric', tags: ['black', 'classic'] },
  { id: 'leather_cognac', name: 'Cognac Italian Leather', group: 'Leather', color: '#8b4513', rate: 850, unit: 'sqft', brand: 'Durian', sku: 'DR-CL03', finishType: 'Polished', pattern: 'fabric', tags: ['warm', 'luxe'] },
  { id: 'leather_white', name: 'White Bonded Leather', group: 'Leather', color: '#f5f5f4', rate: 380, unit: 'sqft', brand: 'Damro', sku: 'DM-WL04', finishType: 'Glossy', pattern: 'fabric', tags: ['white', 'modern'] },

  // ──────────────────────────────────────────────────────────────────
  // CARPET
  // ──────────────────────────────────────────────────────────────────
  { id: 'carpet_beige', name: 'Plush Beige Carpet', group: 'Carpet', color: '#d6c4a4', rate: 165, unit: 'sqft', brand: 'Welspun', sku: 'WS-PB01', finishType: 'Textured', pattern: 'fabric', tags: ['warm', 'cozy'] },
  { id: 'carpet_charcoal', name: 'Charcoal Loop Pile', group: 'Carpet', color: '#374151', rate: 195, unit: 'sqft', brand: 'Welspun', sku: 'WS-CL02', finishType: 'Textured', pattern: 'fabric', tags: ['dark', 'modern'] },
  { id: 'carpet_persian', name: 'Persian Pattern', group: 'Carpet', color: '#7c2d12', rate: 480, unit: 'sqft', brand: 'Obeetee', sku: 'OB-PP03', finishType: 'Textured', pattern: 'fabric', tags: ['classic', 'pattern'] },
  { id: 'carpet_jute_woven', name: 'Jute Hand-Woven', group: 'Carpet', color: '#c8a978', rate: 220, unit: 'sqft', brand: 'Obeetee', sku: 'OB-JW04', finishType: 'Textured', pattern: 'fabric', tags: ['natural', 'artisan'] },
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
