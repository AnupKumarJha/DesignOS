import React from 'react';
import { Rect, Group, Text } from 'react-konva';
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
        fill={item.color || '#cbd5e1'}
        stroke={isSelected ? COLORS.SELECTION : '#94a3b8'}
        strokeWidth={2}
        cornerRadius={4}
      />
      
      {/* Label */}
      <Text
        text={item.type.split('_').pop()}
        fontSize={10}
        fill="#64748b"
        align="center"
        width={item.width}
        offsetX={item.width / 2}
        offsetY={5}
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
