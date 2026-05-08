import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Wall, WallOpening } from '../../store/useStore';
import { COLORS } from '../../lib/constants';
import { getDistance } from '../../lib/math';

interface Wall3DProps {
  wall: Wall;
  openings: WallOpening[];
  isSelected: boolean;
  /** Staggered depth bias so intersecting wall volumes do not z-fight (corner flicker). */
  depthBiasIndex?: number;
  onClick?: () => void;
}

export const Wall3D: React.FC<Wall3DProps> = ({ wall, openings, isSelected, depthBiasIndex = 0, onClick }) => {
  const polyFactor = 1.5 + (depthBiasIndex % 14) * 0.45;
  const polyUnits = 1 + (depthBiasIndex % 14) * 0.35;
  const length = getDistance(wall.start, wall.end);
  const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);

  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    // Wall outline
    shape.moveTo(0, 0);
    shape.lineTo(length, 0);
    shape.lineTo(length, wall.height);
    shape.lineTo(0, wall.height);
    shape.closePath();

    // Adding openings as holes
    openings.forEach(opening => {
      const hole = new THREE.Path();
      const x = length * opening.offset - opening.width / 2;
      const y = opening.bottomHeight;
      
      hole.moveTo(x, y);
      hole.lineTo(x + opening.width, y);
      hole.lineTo(x + opening.width, y + opening.height);
      hole.lineTo(x, y + opening.height);
      hole.closePath();
      shape.holes.push(hole);
    });

    const extrudeSettings = {
      steps: 1,
      depth: wall.thickness,
      bevelEnabled: false,
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [length, wall.height, wall.thickness, openings]);

  return (
    <group position={[wall.start.x, 0, -wall.start.y]} rotation={[0, -angle, 0]}>
      <mesh 
        geometry={geometry}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        <meshStandardMaterial 
          color={isSelected ? COLORS.SELECTION : wall.color || COLORS.WALL_3D}
          roughness={0.7}
          polygonOffset
          polygonOffsetFactor={polyFactor}
          polygonOffsetUnits={polyUnits}
        />
      </mesh>

      {/* Skirting */}
      {wall.skirtingHeight && wall.skirtingHeight > 0 && (
        <mesh position={[length / 2, wall.skirtingHeight / 2, wall.thickness + 0.5]}>
          <boxGeometry args={[length, wall.skirtingHeight, 2]} />
          <meshStandardMaterial
            color="#475569"
            polygonOffset
            polygonOffsetFactor={polyFactor + 0.5}
            polygonOffsetUnits={polyUnits + 0.25}
          />
        </mesh>
      )}

      {/* Cornice */}
      {wall.hasCornice && (
        <mesh position={[length / 2, wall.height - 50, wall.thickness + 0.5]}>
          <boxGeometry args={[length, 100, 10]} />
          <meshStandardMaterial
            color="#cbd5e1"
            polygonOffset
            polygonOffsetFactor={polyFactor + 0.25}
            polygonOffsetUnits={polyUnits + 0.2}
          />
        </mesh>
      )}

      {openings.map((opening, frameIdx) => {
        const x = length * opening.offset;
        const y = opening.bottomHeight + opening.height / 2;
        const frameColor = opening.type === 'WINDOW' ? '#475569' : '#7c4a2d';
        const frameBias = polyFactor + 0.75 + (frameIdx % 3) * 0.12;
        const frameUnits = polyUnits + 0.35 + (frameIdx % 3) * 0.1;
        return (
          <group key={opening.id} position={[x, y, wall.thickness + 4]}>
            <mesh position={[0, opening.height / 2, 0]}>
              <boxGeometry args={[opening.width + 80, 45, 35]} />
              <meshStandardMaterial
                color={frameColor}
                polygonOffset
                polygonOffsetFactor={frameBias}
                polygonOffsetUnits={frameUnits}
              />
            </mesh>
            <mesh position={[-opening.width / 2, 0, 0]}>
              <boxGeometry args={[45, opening.height, 35]} />
              <meshStandardMaterial
                color={frameColor}
                polygonOffset
                polygonOffsetFactor={frameBias + 0.05}
                polygonOffsetUnits={frameUnits}
              />
            </mesh>
            <mesh position={[opening.width / 2, 0, 0]}>
              <boxGeometry args={[45, opening.height, 35]} />
              <meshStandardMaterial
                color={frameColor}
                polygonOffset
                polygonOffsetFactor={frameBias + 0.1}
                polygonOffsetUnits={frameUnits}
              />
            </mesh>
            {opening.type === 'WINDOW' && (
              <mesh>
                <boxGeometry args={[opening.width, 30, 28]} />
                <meshStandardMaterial
                  color="#94a3b8"
                  polygonOffset
                  polygonOffsetFactor={frameBias + 0.15}
                  polygonOffsetUnits={frameUnits}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};
