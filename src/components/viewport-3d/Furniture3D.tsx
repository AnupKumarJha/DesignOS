import React, { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox, useGLTF } from '@react-three/drei';
import { Furniture } from '../../store/useStore';
import { COLORS } from '../../lib/constants';
import { getCatalogItem, getMaterial } from '../../data/catalog';
import { getMaterialTexture, getFinishProps } from '../../lib/materialTexture';

interface Furniture3DProps {
  item: Furniture;
  isSelected: boolean;
  renderMode?: boolean;
  onClick?: () => void;
}

export const Furniture3D: React.FC<Furniture3DProps> = ({ item, isSelected, renderMode = false, onClick }) => {
  const isWallCabinet = item.type === 'CABINET_WALL';
  const hasSkirting = (item.skirtingHeight || 0) > 0;

  // Mount height: prefer catalog mountHeight (e.g. TV unit at 600, mirror at 1100,
  // chimney at 1700, wall cabinet at 1500), fall back to type-based default.
  const catalogItem = getCatalogItem(item.catalogItemId);
  const mountHeight =
    catalogItem?.mountHeight ?? (isWallCabinet ? 1500 : 0);
  const yPos = mountHeight + (item.height / 2) + (item.skirtingHeight || 0);

  // Material → texture map + PBR finish
  const material = getMaterial(item.materialId);
  const finish = getFinishProps(material?.finishType);
  const texture = useMemo(() => {
    const t = getMaterialTexture(material);
    if (!t) return null;
    const cloned = t.clone();
    cloned.wrapS = THREE.RepeatWrapping;
    cloned.wrapT = THREE.RepeatWrapping;
    cloned.needsUpdate = true;
    // Tile every ~600mm so cabinet shutters show pattern detail
    cloned.repeat.set(Math.max(1, item.width / 600), Math.max(1, item.height / 600));
    return cloned;
  }, [material?.id, item.width, item.height]);

  const shutters = [];
  if (item.shutterCount && item.shutterCount > 0 && !item.drawerCount) {
    const gap = 2;
    const sWidth = (item.width - (item.shutterCount - 1) * gap) / item.shutterCount;
    for (let i = 0; i < item.shutterCount; i++) {
      shutters.push({
        x: -item.width / 2 + sWidth / 2 + i * (sWidth + gap),
        width: sWidth
      });
    }
  }

  if (renderMode) {
    return (
      <RenderFurniture
        item={item}
        yPos={yPos}
        texture={texture}
        finish={finish}
        color={item.color || material?.color || '#ffffff'}
        isSelected={isSelected}
        onClick={onClick}
      />
    );
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
          map={texture}
          metalness={finish.metalness}
          roughness={finish.roughness}
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
            <meshStandardMaterial
              color={item.color || '#f1f5f9'}
              map={texture}
              metalness={finish.metalness}
              roughness={finish.roughness}
            />
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

      {/* Drawer fronts */}
      {item.drawerCount && item.drawerCount > 0 && Array.from({ length: item.drawerCount }).map((_, idx) => {
        const drawerHeight = (item.height - 8) / item.drawerCount;
        return (
          <group key={`drawer-${idx}`} position={[0, item.height / 2 - drawerHeight / 2 - idx * drawerHeight, item.depth / 2 + 2]}>
            <mesh>
              <boxGeometry args={[item.width - 4, drawerHeight - 4, 18]} />
              <meshStandardMaterial
                color={item.color || '#f1f5f9'}
                map={texture}
                metalness={finish.metalness}
                roughness={finish.roughness}
              />
            </mesh>
            {item.hasHandle && (
              <mesh position={[0, 0, 10]}>
                <boxGeometry args={[180, 10, 10]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
              </mesh>
            )}
          </group>
        );
      })}

      {item.shutterCount === 0 && (
        <>
          <mesh position={[0, item.height * 0.15, item.depth / 2 + 2]}>
            <boxGeometry args={[item.width - 8, 12, 18]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          <mesh position={[0, -item.height * 0.15, item.depth / 2 + 2]}>
            <boxGeometry args={[item.width - 8, 12, 18]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
        </>
      )}

      {isSelected && (
        <mesh>
          <boxGeometry args={[item.width + 10, item.height + 10, item.depth + 10]} />
          <meshStandardMaterial color={COLORS.SELECTION} transparent opacity={0.1} />
        </mesh>
      )}
    </group>
  );
};

interface RenderFurnitureProps {
  item: Furniture;
  yPos: number;
  texture: THREE.Texture | null;
  finish: ReturnType<typeof getFinishProps>;
  color: string;
  isSelected: boolean;
  onClick?: () => void;
}

const RenderFurniture: React.FC<RenderFurnitureProps> = ({
  item,
  yPos,
  texture,
  finish,
  color,
  isSelected,
  onClick,
}) => {
  const catalogItem = getCatalogItem(item.catalogItemId);
  const materialProps = {
    color,
    map: texture,
    roughness: finish.roughness,
    metalness: finish.metalness,
    clearcoat: finish.clearcoat ?? 0,
    clearcoatRoughness: finish.clearcoatRoughness ?? 0.2,
  };

  return (
    <group
      position={[item.position.x, yPos, -item.position.y]}
      rotation={[0, -item.rotation * (Math.PI / 180), 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {catalogItem?.modelUrl ? (
        <Suspense fallback={<ProceduralFurniture item={item} materialProps={materialProps} />}>
          <ModelAsset item={item} modelUrl={catalogItem.modelUrl} />
        </Suspense>
      ) : (
        <ProceduralFurniture item={item} materialProps={materialProps} />
      )}

      {isSelected && (
        <mesh>
          <boxGeometry args={[item.width + 30, item.height + 30, item.depth + 30]} />
          <meshBasicMaterial color={COLORS.SELECTION} transparent opacity={0.08} />
        </mesh>
      )}
    </group>
  );
};

const ModelAsset: React.FC<{ item: Furniture; modelUrl: string }> = ({ item, modelUrl }) => {
  const gltf = useGLTF(modelUrl);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  return (
    <primitive
      object={scene}
      scale={[item.width / 1000, item.height / 1000, item.depth / 1000]}
      position={[0, -item.height / 2, 0]}
    />
  );
};

const ProceduralFurniture: React.FC<{
  item: Furniture;
  materialProps: any;
}> = ({ item, materialProps }) => {
  if (item.type === 'BED') return <RenderBed item={item} materialProps={materialProps} />;
  if (item.type === 'SOFA') return <RenderSofa item={item} materialProps={materialProps} />;
  if (item.type === 'WARDROBE' || item.type === 'CABINET_TALL') return <RenderWardrobe item={item} materialProps={materialProps} />;
  if (item.type === 'DINING_TABLE' || item.type === 'COFFEE_TABLE' || item.type === 'TABLE') return <RenderTable item={item} materialProps={materialProps} />;
  if (item.type === 'CHAIR' || item.type === 'OFFICE_CHAIR') return <RenderChair item={item} materialProps={materialProps} />;
  if (item.type === 'MIRROR') return <RenderMirror item={item} />;
  if (item.type === 'TV_UNIT' || item.type === 'BOOKSHELF' || item.type === 'DRESSER' || item.type === 'VANITY' || item.type === 'STUDY_UNIT' || item.type === 'SHOE_RACK') {
    return <RenderCabinet item={item} materialProps={materialProps} countertop={item.type === 'VANITY'} />;
  }
  return <RenderCabinet item={item} materialProps={materialProps} countertop={['CABINET_BASE', 'SINK_UNIT'].includes(item.type)} />;
};

const PhysicalMaterial: React.FC<any> = (props) => <meshPhysicalMaterial {...props} />;

const RenderCabinet: React.FC<{ item: Furniture; materialProps: any; countertop?: boolean }> = ({
  item,
  materialProps,
  countertop = false,
}) => {
  const shutterCount = Math.max(1, item.shutterCount ?? 1);
  const drawerCount = item.drawerCount ?? 0;
  return (
    <group>
      <RoundedBox args={[item.width, item.height, item.depth]} radius={18} smoothness={6} castShadow receiveShadow>
        <PhysicalMaterial {...materialProps} />
      </RoundedBox>
      {countertop && (
        <RoundedBox position={[0, item.height / 2 + 28, 0]} args={[item.width + 60, 56, item.depth + 70]} radius={12} smoothness={5} castShadow receiveShadow>
          <meshPhysicalMaterial color="#111827" roughness={0.18} clearcoat={0.75} clearcoatRoughness={0.08} />
        </RoundedBox>
      )}
      {Array.from({ length: drawerCount || shutterCount }).map((_, idx) => {
        const count = drawerCount || shutterCount;
        const w = drawerCount ? item.width - 36 : (item.width - 42) / count;
        const h = drawerCount ? (item.height - 44) / count : item.height - 54;
        const x = drawerCount ? 0 : -item.width / 2 + 21 + w / 2 + idx * w;
        const y = drawerCount ? item.height / 2 - 26 - h / 2 - idx * h : 0;
        return (
          <group key={idx} position={[x, y, item.depth / 2 + 12]}>
            <RoundedBox args={[w - 10, h - 10, 22]} radius={10} smoothness={4} castShadow>
              <PhysicalMaterial {...materialProps} color={materialProps.color} />
            </RoundedBox>
            {item.hasHandle && (
              <RoundedBox position={[drawerCount ? 0 : w / 2 - 46, 0, 18]} args={[drawerCount ? Math.min(220, item.width * 0.38) : 12, drawerCount ? 12 : 190, 12]} radius={5} smoothness={3} castShadow>
                <meshPhysicalMaterial color="#d4af7a" metalness={0.65} roughness={0.18} />
              </RoundedBox>
            )}
          </group>
        );
      })}
      {(item.skirtingHeight ?? 0) > 0 && (
        <RoundedBox position={[0, -item.height / 2 - (item.skirtingHeight ?? 0) / 2, 0]} args={[item.width - 80, item.skirtingHeight ?? 80, item.depth - 80]} radius={8} smoothness={4} receiveShadow>
          <meshStandardMaterial color="#222831" roughness={0.45} />
        </RoundedBox>
      )}
    </group>
  );
};

const RenderWardrobe: React.FC<{ item: Furniture; materialProps: any }> = ({ item, materialProps }) => (
  <group>
    <RenderCabinet item={{ ...item, hasHandle: item.hasHandle ?? true, shutterCount: item.shutterCount ?? 3 }} materialProps={materialProps} />
    <RoundedBox position={[0, item.height / 2 + 22, 0]} args={[item.width + 20, 44, item.depth + 20]} radius={10} smoothness={4}>
      <meshPhysicalMaterial color="#f7f1e8" roughness={0.34} />
    </RoundedBox>
  </group>
);

const RenderBed: React.FC<{ item: Furniture; materialProps: any }> = ({ item, materialProps }) => (
  <group>
    <RoundedBox position={[0, -item.height * 0.28, 0]} args={[item.width, item.height * 0.42, item.depth]} radius={35} smoothness={8} castShadow receiveShadow>
      <PhysicalMaterial {...materialProps} color="#9b7653" roughness={0.58} />
    </RoundedBox>
    <RoundedBox position={[0, item.height * 0.02, 0]} args={[item.width * 0.94, item.height * 0.32, item.depth * 0.9]} radius={50} smoothness={10} castShadow receiveShadow>
      <meshPhysicalMaterial color="#eee7dd" roughness={0.72} />
    </RoundedBox>
    <RoundedBox position={[0, item.height * 0.3, -item.depth / 2 + 80]} args={[item.width * 1.04, item.height * 1.15, 160]} radius={42} smoothness={8} castShadow>
      <PhysicalMaterial {...materialProps} color="#b6977d" roughness={0.64} />
    </RoundedBox>
    {[-0.24, 0.24].map((x) => (
      <RoundedBox key={x} position={[item.width * x, item.height * 0.28, -item.depth / 2 + 210]} args={[item.width * 0.34, item.height * 0.22, 280]} radius={38} smoothness={8} castShadow>
        <meshPhysicalMaterial color="#faf7f0" roughness={0.82} />
      </RoundedBox>
    ))}
    <RoundedBox position={[0, item.height * 0.23, item.depth * 0.1]} args={[item.width * 0.84, item.height * 0.08, item.depth * 0.42]} radius={26} smoothness={8} castShadow>
      <meshPhysicalMaterial color="#b78b70" roughness={0.76} />
    </RoundedBox>
  </group>
);

const RenderSofa: React.FC<{ item: Furniture; materialProps: any }> = ({ item, materialProps }) => (
  <group>
    <RoundedBox position={[0, -item.height * 0.2, 0]} args={[item.width, item.height * 0.36, item.depth]} radius={75} smoothness={10} castShadow receiveShadow>
      <PhysicalMaterial {...materialProps} color={materialProps.color || '#c5ad95'} roughness={0.82} />
    </RoundedBox>
    <RoundedBox position={[0, item.height * 0.18, -item.depth / 2 + 85]} args={[item.width, item.height * 0.62, 170]} radius={75} smoothness={10} castShadow>
      <PhysicalMaterial {...materialProps} color={materialProps.color || '#bba38d'} roughness={0.86} />
    </RoundedBox>
    {[-0.5, 0, 0.5].map((x, idx) => (
      <RoundedBox key={idx} position={[item.width * x * 0.48, item.height * 0.02, item.depth * 0.04]} args={[item.width * 0.3, item.height * 0.18, item.depth * 0.62]} radius={55} smoothness={8} castShadow>
        <PhysicalMaterial {...materialProps} color={materialProps.color || '#d0b8a0'} roughness={0.88} />
      </RoundedBox>
    ))}
    {[-1, 1].map((side) => (
      <RoundedBox key={side} position={[side * (item.width / 2 - 55), 0, 0]} args={[110, item.height * 0.6, item.depth * 0.92]} radius={50} smoothness={8} castShadow>
        <PhysicalMaterial {...materialProps} color={materialProps.color || '#bea68f'} roughness={0.84} />
      </RoundedBox>
    ))}
  </group>
);

const RenderTable: React.FC<{ item: Furniture; materialProps: any }> = ({ item, materialProps }) => (
  <group>
    <RoundedBox position={[0, item.height / 2 - 45, 0]} args={[item.width, 90, item.depth]} radius={28} smoothness={8} castShadow receiveShadow>
      <PhysicalMaterial {...materialProps} color={materialProps.color || '#9b6f48'} roughness={0.46} clearcoat={0.28} />
    </RoundedBox>
    {[-1, 1].flatMap((x) => [-1, 1].map((z) => (
      <RoundedBox key={`${x}-${z}`} position={[x * (item.width / 2 - 90), -item.height * 0.05, z * (item.depth / 2 - 80)]} args={[70, item.height * 0.9, 70]} radius={18} smoothness={5} castShadow>
        <meshPhysicalMaterial color="#5f4634" roughness={0.48} />
      </RoundedBox>
    )))}
  </group>
);

const RenderChair: React.FC<{ item: Furniture; materialProps: any }> = ({ item, materialProps }) => (
  <group>
    <RoundedBox position={[0, -item.height * 0.12, 0]} args={[item.width, item.height * 0.18, item.depth]} radius={34} smoothness={8} castShadow>
      <PhysicalMaterial {...materialProps} color={materialProps.color || '#c9b7a2'} roughness={0.78} />
    </RoundedBox>
    <RoundedBox position={[0, item.height * 0.22, -item.depth / 2 + 50]} args={[item.width, item.height * 0.58, 85]} radius={34} smoothness={8} castShadow>
      <PhysicalMaterial {...materialProps} color={materialProps.color || '#bba894'} roughness={0.8} />
    </RoundedBox>
    {[-1, 1].flatMap((x) => [-1, 1].map((z) => (
      <RoundedBox key={`${x}-${z}`} position={[x * (item.width / 2 - 45), -item.height * 0.42, z * (item.depth / 2 - 45)]} args={[34, item.height * 0.7, 34]} radius={10} smoothness={4} castShadow>
        <meshPhysicalMaterial color="#4b3a2f" roughness={0.5} />
      </RoundedBox>
    )))}
  </group>
);

const RenderMirror: React.FC<{ item: Furniture }> = ({ item }) => (
  <group>
    <RoundedBox args={[item.width, item.height, 28]} radius={Math.min(90, item.width * 0.18)} smoothness={12} castShadow>
      <meshPhysicalMaterial color="#dbeafe" metalness={0.05} roughness={0.04} transmission={0.2} transparent opacity={0.72} clearcoat={1} />
    </RoundedBox>
    <RoundedBox position={[0, 0, -20]} args={[item.width + 60, item.height + 60, 26]} radius={Math.min(110, item.width * 0.22)} smoothness={12}>
      <meshPhysicalMaterial color="#d4af7a" metalness={0.78} roughness={0.18} />
    </RoundedBox>
  </group>
);
