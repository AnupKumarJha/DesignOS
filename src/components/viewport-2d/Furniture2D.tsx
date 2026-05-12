import React from 'react';
import { Rect, Group, Text, Line } from 'react-konva';
import { Furniture } from '../../store/useStore';
import { COLORS } from '../../lib/constants';

interface Furniture2DProps {
  item: Furniture;
  isSelected: boolean;
  onClick: () => void;
  onDragEnd?: (pos: { x: number; y: number }) => void;
  draggable?: boolean;
}

export const Furniture2D: React.FC<Furniture2DProps> = ({ item, isSelected, onClick, onDragEnd, draggable = true }) => {
  const label = item.catalogName || item.type.replaceAll('_', ' ');
  const drawerCount = item.drawerCount ?? 0;
  const shutterCount = item.shutterCount ?? 0;
  const isOpenUnit = shutterCount === 0 || item.catalogItemId === 'open_unit';

  return (
    <Group
      x={item.position.x}
      y={item.position.y}
      rotation={item.rotation}
      onClick={onClick}
      onTap={onClick}
      draggable={draggable}
      onDragEnd={(e) => {
        onDragEnd?.({ x: e.target.x(), y: e.target.y() });
      }}
    >
      <Rect
        width={item.width}
        height={item.depth}
        offsetX={item.width / 2}
        offsetY={item.depth / 2}
        fill={item.color || '#e2e8f0'}
        stroke={isSelected ? COLORS.SELECTION : '#475569'}
        strokeWidth={isSelected ? 5 : 3}
        cornerRadius={10}
      />

      <Rect
        width={item.width - 18}
        height={item.depth - 18}
        offsetX={(item.width - 18) / 2}
        offsetY={(item.depth - 18) / 2}
        stroke={isOpenUnit ? '#0f766e' : '#94a3b8'}
        strokeWidth={2}
        dash={isOpenUnit ? [16, 10] : undefined}
        cornerRadius={8}
        listening={false}
      />

      {drawerCount > 0 && Array.from({ length: drawerCount }).map((_, index) => {
        const y = -item.depth / 2 + ((index + 1) * item.depth) / drawerCount;
        return (
          <Line
            key={index}
            points={[-item.width / 2 + 18, y, item.width / 2 - 18, y]}
            stroke="#64748b"
            strokeWidth={2}
            listening={false}
          />
        );
      })}

      {item.catalogItemId === 'pullout_unit' && (
        <Group listening={false}>
          <Line points={[-item.width / 4, -item.depth / 2 + 30, -item.width / 4, item.depth / 2 - 30]} stroke="#0f766e" strokeWidth={4} />
          <Line points={[item.width / 4, -item.depth / 2 + 30, item.width / 4, item.depth / 2 - 30]} stroke="#0f766e" strokeWidth={4} />
          <Line points={[-item.width / 2 + 30, 0, item.width / 2 - 30, 0]} stroke="#0f766e" strokeWidth={3} dash={[12, 8]} />
        </Group>
      )}
      
      <Text
        text={label}
        fontSize={Math.max(34, Math.min(72, item.width / 8))}
        fontStyle="bold"
        fill="#0f172a"
        align="center"
        width={item.width}
        offsetX={item.width / 2}
        offsetY={Math.max(18, Math.min(38, item.depth / 5))}
        wrap="none"
        ellipsis
      />

      {isSelected && (
        <Rect
          width={item.width + 10}
          height={item.depth + 10}
          offsetX={(item.width + 10) / 2}
          offsetY={(item.depth + 10) / 2}
          stroke={COLORS.SELECTION}
          strokeWidth={1}
          dash={[5, 5]}
        />
      )}
    </Group>
  );
};
