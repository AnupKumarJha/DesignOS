import React from 'react';
import { Furniture } from '../../store/useStore';
import { COLORS } from '../../lib/constants';

interface Furniture3DProps {
  item: Furniture;
  isSelected: boolean;
  onClick?: () => void;
}

export const Furniture3D: React.FC<Furniture3DProps> = ({ item, isSelected, onClick }) => {
  const isWallCabinet = item.type === 'CABINET_WALL';
  const hasSkirting = (item.skirtingHeight || 0) > 0;
  
  // Base height offset
  const yBase = isWallCabinet ? 1500 : 0;
  const yPos = yBase + (item.height / 2) + (item.skirtingHeight || 0);

  const shutters = [];
  if (item.shutterCount && item.shutterCount > 0) {
    const gap = 2;
    const sWidth = (item.width - (item.shutterCount - 1) * gap) / item.shutterCount;
    for (let i = 0; i < item.shutterCount; i++) {
      shutters.push({
        x: -item.width / 2 + sWidth / 2 + i * (sWidth + gap),
        width: sWidth
      });
    }
  }

  return (
    <group 
      position={[item.position.x, yPos, -item.position.y]} 
      rotation={[0, -item.rotation * (Math.PI / 180), 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {/* Carcass */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[item.width, item.height, item.depth]} />
        <meshStandardMaterial 
          color={item.color || '#ffffff'} 
          metalness={0.05}
          roughness={0.7}
        />
      </mesh>

      {/* Skirting */}
      {hasSkirting && (
        <mesh position={[0, -(item.height / 2) - (item.skirtingHeight! / 2), 20]}>
          <boxGeometry args={[item.width - 2, item.skirtingHeight!, item.depth - 40]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      )}

      {/* Shutters */}
      {shutters.map((s, idx) => (
        <group key={idx} position={[s.x, 0, item.depth / 2 + 2]}>
          <mesh>
            <boxGeometry args={[s.width, item.height - 4, 18]} />
            <meshStandardMaterial color={item.color || '#f1f5f9'} roughness={0.4} />
          </mesh>
          {/* Handle Placeholder */}
          {item.hasHandle && (
            <mesh position={[s.width / 2 - 30, 0, 10]}>
              <boxGeometry args={[10, 150, 10]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
            </mesh>
          )}
        </group>
      ))}

      {isSelected && (
        <mesh>
          <boxGeometry args={[item.width + 10, item.height + 10, item.depth + 10]} />
          <meshStandardMaterial color={COLORS.SELECTION} transparent opacity={0.1} />
        </mesh>
      )}
    </group>
  );
};
