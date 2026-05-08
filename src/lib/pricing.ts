import { Wall, Furniture, WallOpening } from '../store/useStore';

export interface BOQItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
}

export function generateBOQ(walls: Wall[], furniture: Furniture[], openings: WallOpening[]): BOQItem[] {
  const items: BOQItem[] = [];

  // Walls
  const totalWallLength = walls.reduce((acc, wall) => {
    const length = Math.sqrt(Math.pow(wall.end.x - wall.start.x, 2) + Math.pow(wall.end.y - wall.start.y, 2));
    return acc + length;
  }, 0) / 1000; // to meters

  if (totalWallLength > 0) {
    items.push({
      id: 'wall_labor',
      name: 'Wall Construction Labor',
      quantity: Math.round(totalWallLength * 10) / 10,
      unit: 'm',
      rate: 1500,
      total: Math.round(totalWallLength * 1500)
    });
  }

  // Furniture
  furniture.forEach(item => {
    let rate = 12000;
    if (item.type === 'CABINET_WALL') rate = 8000;
    if (item.type === 'CABINET_TALL') rate = 25000;
    if (item.type === 'WARDROBE') rate = 35000;
    if (item.type === 'SINK_UNIT') rate = 15000;

    items.push({
      id: item.id,
      name: `${item.type.replace('_', ' ')} (${item.width}x${item.height}x${item.depth})`,
      quantity: 1,
      unit: 'unit',
      rate: rate,
      total: rate
    });
  });

  // Openings
  openings.forEach(op => {
     items.push({
        id: op.id,
        name: `${op.type === 'WINDOW' ? 'Window' : 'Door'} Frame`,
        quantity: 1,
        unit: 'unit',
        rate: op.type === 'WINDOW' ? 5000 : 8000,
        total: op.type === 'WINDOW' ? 5000 : 8000
     });
  });

  return items;
}
