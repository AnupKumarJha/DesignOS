import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html, RoundedBox } from '@react-three/drei';
import { Furniture, RenderRoomType, Wall } from '../../store/useStore';
import { RoomBounds, pointsToShape } from '../../lib/rendering';
import { getMaterial } from '../../data/catalog';
import { getFinishProps, getMaterialPbrMaps, getMaterialTexture } from '../../lib/materialTexture';

interface RenderRoomKitProps {
  bounds: RoomBounds;
  walls: Wall[];
  furniture: Furniture[];
  roomType: RenderRoomType;
  showCeiling: boolean;
  showDecor: boolean;
  showLights: boolean;
  floorMaterialId: string;
}

export const RenderRoomKit: React.FC<RenderRoomKitProps> = ({
  bounds,
  walls,
  furniture,
  roomType,
  showCeiling,
  showDecor,
  showLights,
  floorMaterialId,
}) => {
  const floorGeometry = useMemo(() => new THREE.ShapeGeometry(pointsToShape(walls, bounds)), [walls, bounds]);
  const ceilingGeometry = useMemo(() => new THREE.ShapeGeometry(pointsToShape(walls, bounds, 120)), [walls, bounds]);
  const floorMaterial = getMaterial(floorMaterialId);
  const floorFinish = getFinishProps(floorMaterial?.finishType);
  const floorTexture = useMemo(() => {
    const texture = getMaterialTexture(floorMaterial);
    if (!texture) return null;
    const cloned = texture.clone();
    cloned.wrapS = THREE.RepeatWrapping;
    cloned.wrapT = THREE.RepeatWrapping;
    const repeatScale = floorMaterial?.textureRepeatScale ?? 650;
    cloned.repeat.set(Math.max(1, bounds.width / repeatScale), Math.max(1, bounds.depth / repeatScale));
    cloned.needsUpdate = true;
    return cloned;
  }, [floorMaterial?.id, floorMaterial?.textureRepeatScale, bounds.width, bounds.depth]);
  const floorPbrMaps = useMemo(() => getMaterialPbrMaps(floorMaterial), [floorMaterial?.id]);
  const ceilingY = bounds.wallHeight;

  return (
    <group>
      <mesh geometry={floorGeometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <meshPhysicalMaterial
          color={floorMaterial?.color || '#ffffff'}
          map={floorTexture}
          {...floorPbrMaps}
          roughness={floorFinish.roughness}
          metalness={floorFinish.metalness}
          clearcoat={floorFinish.clearcoat ?? (roomType === 'Bathroom' || roomType === 'Kitchen' ? 0.55 : 0.24)}
          clearcoatRoughness={floorFinish.clearcoatRoughness ?? 0.12}
        />
      </mesh>

      {floorMaterial?.pattern === 'tile' && (
        <group position={[bounds.centerX, 3, bounds.centerZ]}>
          {Array.from({ length: Math.ceil(bounds.width / 600) + 1 }).map((_, idx) => (
            <mesh key={`floor-x-${idx}`} position={[-bounds.width / 2 + idx * 600, 0, 0]} rotation={[0, 0, 0]}>
              <boxGeometry args={[3, 3, bounds.depth]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
            </mesh>
          ))}
          {Array.from({ length: Math.ceil(bounds.depth / 600) + 1 }).map((_, idx) => (
            <mesh key={`floor-z-${idx}`} position={[0, 0, -bounds.depth / 2 + idx * 600]} rotation={[0, 0, 0]}>
              <boxGeometry args={[bounds.width, 3, 3]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.16} />
            </mesh>
          ))}
        </group>
      )}

      {showCeiling && (
        <group>
          <mesh geometry={ceilingGeometry} rotation={[Math.PI / 2, 0, 0]} position={[0, ceilingY, 0]} receiveShadow>
            <meshPhysicalMaterial color="#f7f3ec" roughness={0.42} clearcoat={0.18} />
          </mesh>
          <FalseCeiling bounds={bounds} roomType={roomType} showLights={showLights} />
        </group>
      )}

      {showLights && <LightingRig bounds={bounds} roomType={roomType} />}
      {showDecor && <DecorHints bounds={bounds} roomType={roomType} furniture={furniture} />}
    </group>
  );
};

const FalseCeiling: React.FC<{ bounds: RoomBounds; roomType: RenderRoomType; showLights: boolean }> = ({
  bounds,
  roomType,
  showLights,
}) => {
  const y = bounds.wallHeight - 70;
  const innerW = bounds.width * (roomType === 'Kitchen' ? 0.72 : 0.66);
  const innerD = bounds.depth * (roomType === 'Kitchen' ? 0.52 : 0.62);
  return (
    <group position={[bounds.centerX, y, bounds.centerZ]}>
      <RoundedBox args={[innerW, 60, innerD]} radius={55} smoothness={8} castShadow receiveShadow>
        <meshPhysicalMaterial color="#f4efe5" roughness={0.36} clearcoat={0.28} />
      </RoundedBox>
      <mesh position={[0, -36, 0]}>
        <boxGeometry args={[innerW * 0.82, 14, innerD * 0.82]} />
        <meshBasicMaterial color="#ffd89a" transparent opacity={showLights ? 0.72 : 0.18} />
      </mesh>
      {showLights && (
        <>
          <pointLight position={[0, -70, 0]} color="#ffcf8a" intensity={1.2} distance={Math.max(bounds.width, bounds.depth)} />
          {[
            [-innerW * 0.36, -innerD * 0.36],
            [innerW * 0.36, -innerD * 0.36],
            [-innerW * 0.36, innerD * 0.36],
            [innerW * 0.36, innerD * 0.36],
          ].map(([x, z], idx) => (
            <group key={idx} position={[x, -44, z]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[42, 42, 10, 32]} />
                <meshStandardMaterial color="#f9fafb" emissive="#ffd39a" emissiveIntensity={0.65} />
              </mesh>
              <pointLight color="#ffd9a6" intensity={0.65} distance={2200} />
            </group>
          ))}
        </>
      )}
    </group>
  );
};

const LightingRig: React.FC<{ bounds: RoomBounds; roomType: RenderRoomType }> = ({ bounds, roomType }) => {
  const warm = roomType === 'Bathroom' ? '#fff1db' : '#ffd6a3';
  return (
    <>
      <ambientLight intensity={0.42} color="#fff7ee" />
      <hemisphereLight args={['#fff7ed', '#9ca3af', 0.8]} />
      <directionalLight
        position={[bounds.minX - bounds.width * 0.3, bounds.wallHeight + 1800, -bounds.minY + bounds.depth * 0.8]}
        intensity={1.1}
        color="#fff4e6"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-bounds.size}
        shadow-camera-right={bounds.size}
        shadow-camera-top={bounds.size}
        shadow-camera-bottom={-bounds.size}
      />
      <pointLight position={[bounds.centerX, bounds.wallHeight - 300, bounds.centerZ]} color={warm} intensity={1.6} distance={bounds.size * 1.6} />
      <pointLight position={[bounds.maxX, 1600, -bounds.minY]} color="#ffffff" intensity={0.45} distance={bounds.size} />
    </>
  );
};

const DecorHints: React.FC<{ bounds: RoomBounds; roomType: RenderRoomType; furniture: Furniture[] }> = ({
  bounds,
  roomType,
  furniture,
}) => {
  const showRug = ['Hall', 'Master Bedroom', 'Bedroom', 'Dining', 'Office'].includes(roomType);
  const hasTable = furniture.some((item) => ['COFFEE_TABLE', 'DINING_TABLE', 'TABLE'].includes(item.type));
  return (
    <group>
      {showRug && (
        <mesh position={[bounds.centerX, 9, bounds.centerZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[Math.min(bounds.width * 0.48, 2600), Math.min(bounds.depth * 0.38, 1800)]} />
          <meshStandardMaterial color={roomType === 'Hall' ? '#b9a88f' : '#d8c9b5'} roughness={0.9} />
        </mesh>
      )}
      {roomType !== 'Kitchen' && (
        <group position={[bounds.centerX, 1450, -bounds.minY - 8]}>
          <RoundedBox args={[Math.min(bounds.width * 0.34, 1500), 760, 36]} radius={36} smoothness={6}>
            <meshStandardMaterial color={roomType === 'Bathroom' ? '#d9e2e8' : '#f2eee7'} roughness={0.55} />
          </RoundedBox>
          <mesh position={[0, 0, -24]}>
            <boxGeometry args={[Math.min(bounds.width * 0.26, 1120), 520, 12]} />
            <meshStandardMaterial color="#b8c7ba" roughness={0.7} />
          </mesh>
        </group>
      )}
      {hasTable && (
        <Html position={[bounds.centerX, 60, bounds.centerZ]} center distanceFactor={14} className="pointer-events-none">
          <div className="rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold text-slate-600 shadow-sm">Render decor layer</div>
        </Html>
      )}
    </group>
  );
};
