import React from 'react';
import { Group, Rect, Line } from 'react-konva';
import { Wall, WallOpening, Point } from '../../store/useStore';
import { getDistance } from '../../lib/math';

interface Opening2DProps {
  wall: Wall;
  opening: WallOpening;
  isSelected?: boolean;
  onClick?: () => void;
}

export const Opening2D: React.FC<Opening2DProps> = ({ wall, opening, isSelected, onClick }) => {
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
        <Group>
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
