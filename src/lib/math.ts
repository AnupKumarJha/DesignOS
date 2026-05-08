import { Point } from '../store/useStore';
import { GRID_SIZE, SNAP_SENSITIVITY } from './constants';

export function snapToGrid(point: Point, size: number = GRID_SIZE): Point {
  return {
    x: Math.round(point.x / size) * size,
    y: Math.round(point.y / size) * size,
  };
}

export function getDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function snapToAngle(start: Point, end: Point, threshold: number = 15): Point {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  // Snap to 0, 90, 180, -90/270 degrees
  let snappedAngle = angle;
  if (Math.abs(angle) < threshold) snappedAngle = 0;
  else if (Math.abs(angle - 90) < threshold) snappedAngle = 90;
  else if (Math.abs(angle + 90) < threshold) snappedAngle = -90;
  else if (Math.abs(angle - 180) < threshold || Math.abs(angle + 180) < threshold) snappedAngle = 180;
  else return end;

  const length = getDistance(start, end);
  const rad = snappedAngle * (Math.PI / 180);
  
  return {
    x: start.x + length * Math.cos(rad),
    y: start.y + length * Math.sin(rad),
  };
}

/**
 * Finds the closest point on existing geometry for endpoint snapping
 */
export function findClosestPoint(target: Point, points: Point[], threshold: number = SNAP_SENSITIVITY): Point | null {
  let closest: Point | null = null;
  let minDistance = threshold;

  for (const p of points) {
    const dist = getDistance(target, p);
    if (dist < minDistance) {
      minDistance = dist;
      closest = p;
    }
  }

  return closest;
}

export function getClosestPointOnSegment(p: Point, s1: Point, s2: Point): { point: Point, offset: number } {
  const dx = s2.x - s1.x;
  const dy = s2.y - s1.y;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return { point: s1, offset: 0 };
  let t = ((p.x - s1.x) * dx + (p.y - s1.y) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return {
    point: {
      x: s1.x + t * dx,
      y: s1.y + t * dy
    },
    offset: t
  };
}
