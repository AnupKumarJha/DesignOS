import React from 'react';
import { Line } from 'react-konva';
import { GRID_SIZE, COLORS } from '../../lib/constants';

interface GridProps {
  width: number;
  height: number;
  scale: number;
  offset: { x: number; y: number };
}

export const Grid: React.FC<GridProps> = ({ width, height, scale, offset }) => {
  const lines = [];
  const spacing = GRID_SIZE;
  
  // Calculate viewport boundaries
  const startX = Math.floor((-offset.x / scale) / spacing) * spacing;
  const endX = Math.ceil((width / scale - offset.x / scale) / spacing) * spacing;
  
  const startY = Math.floor((-offset.y / scale) / spacing) * spacing;
  const endY = Math.ceil((height / scale - offset.y / scale) / spacing) * spacing;

  // Vertical lines
  for (let x = startX; x <= endX; x += spacing) {
    const isMajor = x % (spacing * 10) === 0;
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, startY, x, endY]}
        stroke={isMajor ? COLORS.GRID_MAJOR : COLORS.GRID_MINOR}
        strokeWidth={1 / scale}
        listening={false}
      />
    );
  }

  // Horizontal lines
  for (let y = startY; y <= endY; y += spacing) {
    const isMajor = y % (spacing * 10) === 0;
    lines.push(
      <Line
        key={`h-${y}`}
        points={[startX, y, endX, y]}
        stroke={isMajor ? COLORS.GRID_MAJOR : COLORS.GRID_MINOR}
        strokeWidth={1 / scale}
        listening={false}
      />
    );
  }

  return <>{lines}</>;
};
