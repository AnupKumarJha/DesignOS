import React from 'react';
import { Circle, Group, Line, Text } from 'react-konva';
import { Point, UnitSystem, Wall } from '../../store/useStore';
import { COLORS } from '../../lib/constants';
import { getDistance } from '../../lib/math';
import { formatLength } from '../../lib/units';

interface Wall2DProps {
  wall: Wall;
  isSelected: boolean;
  unitSystem: UnitSystem;
  onClick: () => void;
  onEndpointDrag?: (endpoint: 'start' | 'end', point: Point) => void;
}

export const Wall2D: React.FC<Wall2DProps> = ({ wall, isSelected, unitSystem, onClick, onEndpointDrag }) => {
  const length = getDistance(wall.start, wall.end);
  const midPoint = {
    x: (wall.start.x + wall.end.x) / 2,
    y: (wall.start.y + wall.end.y) / 2,
  };

  const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);

  return (
    <Group onClick={onClick}>
      {/* Wall Body */}
      <Line
        points={[wall.start.x, wall.start.y, wall.end.x, wall.end.y]}
        stroke={isSelected ? COLORS.SELECTION : COLORS.WALL_2D}
        strokeWidth={wall.thickness}
        lineCap="square"
        lineJoin="round"
      />
      
      {/* Selection Highlight */}
      {isSelected && (
        <>
          <Line
            points={[wall.start.x, wall.start.y, wall.end.x, wall.end.y]}
            stroke={COLORS.SELECTION}
            strokeWidth={wall.thickness + 4}
            opacity={0.3}
            lineCap="square"
          />
          {(['start', 'end'] as const).map((endpoint) => {
            const point = wall[endpoint];
            return (
              <Circle
                key={endpoint}
                x={point.x}
                y={point.y}
                radius={28}
                fill="#ffffff"
                stroke={COLORS.SELECTION}
                strokeWidth={3}
                draggable
                onDragMove={(event) => {
                  onEndpointDrag?.(endpoint, { x: event.target.x(), y: event.target.y() });
                }}
                onClick={(event) => event.cancelBubble = true}
              />
            );
          })}
        </>
      )}

      {/* Length Label */}
      <Group 
        x={midPoint.x} 
        y={midPoint.y} 
        rotation={angle * (180 / Math.PI)}
      >
        <Text
          text={formatLength(length, unitSystem)}
          fontSize={28}
          fontStyle="bold"
          fill="#0f172a"
          align="center"
          verticalAlign="middle"
          offsetY={wall.thickness / 2 + 32}
          offsetX={46}
        />
      </Group>
    </Group>
  );
};
