import React from 'react';
import { Group, Rect, Line } from 'react-konva';
import { Wall, WallOpening } from '../../store/useStore';
import { getDistance } from '../../lib/math';

interface Opening2DProps {
  wall: Wall;
  opening: WallOpening;
  isSelected?: boolean;
  onClick?: () => void;
  onDragOffset?: (offset: number) => void;
  draggable?: boolean;
}

export const Opening2D: React.FC<Opening2DProps> = ({ wall, opening, isSelected, onClick, onDragOffset, draggable = false }) => {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const length = getDistance(wall.start, wall.end);
  
  const pos = {
    x: wall.start.x + dx * opening.offset,
    y: wall.start.y + dy * opening.offset
  };

  return (
    <Group 
      x={pos.x} 
      y={pos.y} 
      rotation={angle} 
      onClick={onClick}
      onTap={onClick}
      draggable={draggable}
      dragBoundFunc={(nextPos) => {
        const wallAngle = Math.atan2(dy, dx);
        const vx = nextPos.x - wall.start.x;
        const vy = nextPos.y - wall.start.y;
        const projected = Math.max(0, Math.min(length, vx * Math.cos(wallAngle) + vy * Math.sin(wallAngle)));
        return {
          x: wall.start.x + Math.cos(wallAngle) * projected,
          y: wall.start.y + Math.sin(wallAngle) * projected,
        };
      }}
      onDragEnd={(event) => {
        const wallAngle = Math.atan2(dy, dx);
        const vx = event.target.x() - wall.start.x;
        const vy = event.target.y() - wall.start.y;
        const projected = Math.max(0, Math.min(length, vx * Math.cos(wallAngle) + vy * Math.sin(wallAngle)));
        onDragOffset?.(projected / length);
      }}
    >
      {/* Background to mask wall */}
      <Rect
        x={-opening.width / 2}
        y={-wall.thickness / 2}
        width={opening.width}
        height={wall.thickness}
        fill="white"
        stroke={isSelected ? '#3b82f6' : '#64748b'}
        strokeWidth={1}
      />
      
      {/* Visual indicator for Door */}
      {opening.type === 'DOOR' && (
        <Group scaleY={opening.flip ? -1 : 1}>
           <Line
            points={[opening.width / 2, -wall.thickness / 2, opening.width / 2, -opening.width]}
            stroke="#94a3b8"
            strokeWidth={2}
          />
          <Line
            points={[opening.width / 2, -opening.width, -opening.width / 2, -opening.width]}
            stroke="#94a3b8"
            strokeWidth={1}
            dash={[5, 2]}
            tension={0.5}
          />
        </Group>
      )}

      {/* Visual indicator for Window */}
      {opening.type === 'WINDOW' && (
        <Line
          points={[-opening.width / 2, 0, opening.width / 2, 0]}
          stroke="#94a3b8"
          strokeWidth={1}
        />
      )}
    </Group>
  );
};
