import React from 'react';
import { Rect, Group, Text, Line, Circle } from 'react-konva';
import { Furniture } from '../../store/useStore';
import { COLORS } from '../../lib/constants';

interface Furniture2DProps {
  item: Furniture;
  isSelected: boolean;
  onClick: () => void;
  onDragEnd?: (pos: { x: number; y: number }) => void;
  onResize?: (updates: Partial<Pick<Furniture, 'width' | 'depth' | 'height'>>) => void;
  draggable?: boolean;
}

export const Furniture2D: React.FC<Furniture2DProps> = ({ item, isSelected, onClick, onDragEnd, onResize, draggable = true }) => {
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
        <>
          <Rect
            width={item.width + 10}
            height={item.depth + 10}
            offsetX={(item.width + 10) / 2}
            offsetY={(item.depth + 10) / 2}
            stroke={COLORS.SELECTION}
            strokeWidth={2}
            dash={[10, 7]}
            listening={false}
          />
          {[
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ].map(([x, y]) => (
            <Circle
              key={`${x}-${y}`}
              x={(item.width / 2) * x}
              y={(item.depth / 2) * y}
              radius={34}
              fill="#ffffff"
              stroke={COLORS.SELECTION}
              strokeWidth={5}
              draggable
              onClick={(event) => { event.cancelBubble = true; }}
              onDragMove={(event) => {
                event.cancelBubble = true;
                const nextX = Math.max(75, Math.abs(event.target.x()));
                const nextY = Math.max(75, Math.abs(event.target.y()));
                onResize?.({ width: nextX * 2, depth: nextY * 2 });
              }}
              onDragEnd={(event) => {
                event.target.position({ x: (item.width / 2) * x, y: (item.depth / 2) * y });
              }}
            />
          ))}
          <Circle
            x={0}
            y={-item.depth / 2 - 130}
            radius={30}
            fill="#111827"
            stroke="#ffffff"
            strokeWidth={5}
            draggable
            onClick={(event) => { event.cancelBubble = true; }}
            onDragMove={(event) => {
              event.cancelBubble = true;
              onResize?.({ height: Math.max(150, Math.round(item.height + (-event.target.y() - item.depth / 2 - 130) * 3)) });
            }}
            onDragEnd={(event) => {
              event.target.position({ x: 0, y: -item.depth / 2 - 130 });
            }}
          />
          <Text
            text="H"
            x={-18}
            y={-item.depth / 2 - 146}
            fontSize={34}
            fill="#ffffff"
            fontStyle="bold"
            listening={false}
          />
        </>
      )}
    </Group>
  );
};
