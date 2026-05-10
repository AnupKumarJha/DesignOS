import * as THREE from 'three';
import { Furniture, Point, RenderCameraPreset, RenderRoomType, Room, Wall } from '../store/useStore';
import { getDistance } from './math';

export interface RoomBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
  centerZ: number;
  width: number;
  depth: number;
  size: number;
  wallHeight: number;
}

export function getRoomBounds(walls: Wall[], furniture: Furniture[]): RoomBounds {
  const xs: number[] = [];
  const ys: number[] = [];
  walls.forEach((wall) => {
    xs.push(wall.start.x, wall.end.x);
    ys.push(wall.start.y, wall.end.y);
  });
  furniture.forEach((item) => {
    xs.push(item.position.x - item.width / 2, item.position.x + item.width / 2);
    ys.push(item.position.y - item.depth / 2, item.position.y + item.depth / 2);
  });

  if (xs.length === 0) {
    return {
      minX: -2500,
      maxX: 2500,
      minY: -2000,
      maxY: 2000,
      centerX: 0,
      centerY: 0,
      centerZ: 0,
      width: 5000,
      depth: 4000,
      size: 5000,
      wallHeight: 2700,
    };
  }

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = Math.max(maxX - minX, 2400);
  const depth = Math.max(maxY - minY, 2400);
  return {
    minX,
    maxX,
    minY,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    centerZ: -(minY + maxY) / 2,
    width,
    depth,
    size: Math.max(width, depth, 2600),
    wallHeight: Math.max(...walls.map((wall) => wall.height), 2700),
  };
}

export function inferRenderRoomType(room: Room | undefined, fallback: RenderRoomType): RenderRoomType {
  if (fallback !== 'Auto') return fallback;
  const text = `${room?.name ?? ''} ${room?.type ?? ''}`.toLowerCase();
  if (text.includes('kitchen')) return 'Kitchen';
  if (text.includes('master') || text.includes('mbr')) return 'Master Bedroom';
  if (text.includes('bed')) return 'Bedroom';
  if (text.includes('hall') || text.includes('living')) return 'Hall';
  if (text.includes('dining')) return 'Dining';
  if (text.includes('bath') || text.includes('toilet')) return 'Bathroom';
  if (text.includes('office') || text.includes('study')) return 'Office';
  if (text.includes('foyer') || text.includes('entry')) return 'Foyer';
  if (text.includes('balcony') || text.includes('outdoor')) return 'Balcony';
  return 'Hall';
}

export function getRenderCameraPosition(
  preset: RenderCameraPreset,
  bounds: RoomBounds,
): [number, number, number] {
  const dist = bounds.size;
  switch (preset) {
    case 'Eye Level':
      return [bounds.centerX + dist * 0.15, 1550, bounds.centerZ + dist * 0.9];
    case 'Corner View':
      return [bounds.minX + bounds.width * 0.12, 1650, -bounds.maxY + bounds.depth * 0.12];
    case 'Ceiling View':
      return [bounds.centerX + dist * 0.25, bounds.wallHeight + 900, bounds.centerZ + dist * 0.2];
    case 'Furniture Focus':
      return [bounds.centerX + dist * 0.35, 1300, bounds.centerZ + dist * 0.55];
    case 'Wide Interior':
    default:
      return [bounds.centerX + dist * 0.65, 1850, bounds.centerZ + dist * 0.85];
  }
}

export function getRenderTarget(preset: RenderCameraPreset, bounds: RoomBounds): [number, number, number] {
  if (preset === 'Ceiling View') return [bounds.centerX, bounds.wallHeight - 260, bounds.centerZ];
  if (preset === 'Furniture Focus') return [bounds.centerX, 900, bounds.centerZ];
  return [bounds.centerX, 1250, bounds.centerZ];
}

export function pointsToShape(walls: Wall[], bounds: RoomBounds, inset = 0): THREE.Shape {
  const shape = new THREE.Shape();
  if (walls.length >= 3 && getDistance(walls[0].start, walls[walls.length - 1].end) < 80) {
    const points = walls.map((wall) => wall.start);
    points.forEach((point, index) => {
      const x = point.x;
      const y = -point.y;
      if (index === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
    shape.closePath();
    return shape;
  }

  const pad = 250 - inset;
  const rect: Point[] = [
    { x: bounds.minX - pad, y: bounds.minY - pad },
    { x: bounds.maxX + pad, y: bounds.minY - pad },
    { x: bounds.maxX + pad, y: bounds.maxY + pad },
    { x: bounds.minX - pad, y: bounds.maxY + pad },
  ];
  rect.forEach((point, index) => {
    if (index === 0) shape.moveTo(point.x, -point.y);
    else shape.lineTo(point.x, -point.y);
  });
  shape.closePath();
  return shape;
}

export function downloadCanvasPng(canvas: HTMLCanvasElement | null, filename: string) {
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
