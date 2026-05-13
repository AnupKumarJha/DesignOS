import React, { Suspense, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { RoundedBox, useGLTF } from '@react-three/drei';
import { Furniture, FurniturePart } from '../../store/useStore';
import { COLORS } from '../../lib/constants';
import { getCatalogItem, getMaterial } from '../../data/catalog';
import { getMaterialTexture, getFinishProps, getMaterialPbrMaps } from '../../lib/materialTexture';
import { getCatalogAsset } from '../../lib/db';
import { generateFurnitureParts } from '../../lib/furnitureParts';

interface Furniture3DProps {
  item: Furniture;
  isSelected: boolean;
  renderMode?: boolean;
  onClick?: () => void;
  onPartClick?: (partId: string) => void;
}

export const Furniture3D: React.FC<Furniture3DProps> = ({ item, isSelected, renderMode = false, onClick, onPartClick }) => {
  const isWallCabinet = item.type === 'CABINET_WALL';

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
    const repeatScale = material?.textureRepeatScale ?? 600;
    cloned.repeat.set(Math.max(1, item.width / repeatScale), Math.max(1, item.height / repeatScale));
    return cloned;
  }, [material?.id, material?.textureRepeatScale, item.width, item.height]);
  const pbrMaps = useMemo(() => getMaterialPbrMaps(material), [material?.id]);

  return (
    <RenderFurniture
      item={item}
      yPos={yPos}
      texture={texture}
      pbrMaps={pbrMaps}
      finish={finish}
      color={item.color || material?.color || '#ffffff'}
      isSelected={isSelected}
      renderMode={renderMode}
      onClick={onClick}
      onPartClick={onPartClick}
    />
  );
};

interface RenderFurnitureProps {
  item: Furniture;
  yPos: number;
  texture: THREE.Texture | null;
  pbrMaps: ReturnType<typeof getMaterialPbrMaps>;
  finish: ReturnType<typeof getFinishProps>;
  color: string;
  isSelected: boolean;
  renderMode: boolean;
  onClick?: () => void;
  onPartClick?: (partId: string) => void;
}

const RenderFurniture: React.FC<RenderFurnitureProps> = ({
  item,
  yPos,
  texture,
  pbrMaps,
  finish,
  color,
  isSelected,
  renderMode,
  onClick,
  onPartClick,
}) => {
  const catalogItem = getCatalogItem(item.catalogItemId);
  const [uploadedModelUrl, setUploadedModelUrl] = useState<string | null>(null);
  const modelAssetId = item.modelAssetId || catalogItem?.modelAssetId;
  useEffect(() => {
    let revokedUrl: string | null = null;
    let cancelled = false;
    if (!modelAssetId) {
      setUploadedModelUrl(null);
      return undefined;
    }
    getCatalogAsset(modelAssetId)
      .then((asset) => {
        if (cancelled) return;
        if (!asset) {
          setUploadedModelUrl(null);
          return;
        }
        revokedUrl = URL.createObjectURL(asset.blob);
        setUploadedModelUrl(revokedUrl);
      })
      .catch(() => {
        if (!cancelled) setUploadedModelUrl(null);
      });
    return () => {
      cancelled = true;
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [modelAssetId]);

  const modelUrl = uploadedModelUrl || catalogItem?.modelUrl;
  const materialProps = {
    color,
    map: texture,
    ...pbrMaps,
    roughness: finish.roughness,
    metalness: finish.metalness,
    clearcoat: finish.clearcoat ?? (renderMode ? 0.18 : 0),
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
      {modelUrl ? (
        <Suspense fallback={<ProceduralFurniture item={item} materialProps={materialProps} renderMode={renderMode} onPartClick={onPartClick} />}>
          <ModelAsset item={item} modelUrl={modelUrl} />
        </Suspense>
      ) : (
        <ProceduralFurniture item={item} materialProps={materialProps} renderMode={renderMode} onPartClick={onPartClick} />
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
  renderMode: boolean;
  onPartClick?: (partId: string) => void;
}> = ({ item, materialProps, renderMode, onPartClick }) => {
  if (item.type === 'BED') return <RenderBed item={item} materialProps={materialProps} />;
  if (item.type === 'SOFA') return <RenderSofa item={item} materialProps={materialProps} />;
  if (item.type === 'DINING_TABLE' || item.type === 'COFFEE_TABLE' || item.type === 'TABLE') return <RenderTable item={item} materialProps={materialProps} />;
  if (item.type === 'CHAIR' || item.type === 'OFFICE_CHAIR') return <RenderChair item={item} materialProps={materialProps} />;
  if (item.type === 'MIRROR') return <RenderMirror item={item} />;
  return <RenderCabinet item={item} materialProps={materialProps} renderMode={renderMode} onPartClick={onPartClick} />;
};

const PhysicalMaterial: React.FC<any> = (props) => <meshPhysicalMaterial {...props} />;

const RenderCabinet: React.FC<{
  item: Furniture;
  materialProps: any;
  renderMode: boolean;
  onPartClick?: (partId: string) => void;
}> = ({ item, materialProps, renderMode, onPartClick }) => {
  const parts = useMemo(() => generateFurnitureParts(item), [item]);
  const openAmount = item.openState === 'open' ? (item.openAmount ?? 1) : 0;
  const selectedPartId = item.selectedPartId;
  return (
    <group>
      {parts.map((part) => (
        <FurniturePartMesh
          key={part.id}
          item={item}
          part={part}
          openAmount={openAmount}
          materialProps={materialProps}
          selected={selectedPartId === part.id}
          renderMode={renderMode}
          onPartClick={onPartClick}
        />
      ))}
      {renderMode && (
        <mesh position={[0, -item.height / 2 - 1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[item.width * 1.08, item.depth * 1.08]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.08} />
        </mesh>
      )}
    </group>
  );
};

const FurniturePartMesh: React.FC<{
  item: Furniture;
  part: FurniturePart;
  openAmount: number;
  materialProps: any;
  selected: boolean;
  renderMode: boolean;
  onPartClick?: (partId: string) => void;
}> = ({ item, part, openAmount, materialProps, selected, renderMode, onPartClick }) => {
  if (part.visible === false) return null;
  const isRound = ['hanging_rod', 'handle'].includes(part.type) && part.size.height === part.size.depth;
  const transform = getPartTransform(item, part, openAmount);
  const radius = partRadius(part, renderMode);
  return (
    <group
      position={transform.position}
      rotation={transform.rotation}
      onClick={(event) => {
        event.stopPropagation();
        onPartClick?.(part.id);
      }}
    >
      {isRound ? (
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[part.size.height / 2, part.size.height / 2, part.size.width, 28]} />
          <PartMaterial part={part} materialProps={materialProps} renderMode={renderMode} />
        </mesh>
      ) : (
        <RoundedBox args={[part.size.width, part.size.height, part.size.depth]} radius={radius} smoothness={renderMode ? 6 : 4} castShadow receiveShadow>
          <PartMaterial part={part} materialProps={materialProps} renderMode={renderMode} />
        </RoundedBox>
      )}
      {selected && (
        <RoundedBox args={[part.size.width + 14, part.size.height + 14, part.size.depth + 14]} radius={Math.max(radius, 6)} smoothness={3}>
          <meshBasicMaterial color={COLORS.SELECTION} transparent opacity={0.18} />
        </RoundedBox>
      )}
    </group>
  );
};

const PartMaterial: React.FC<{ part: FurniturePart; materialProps: any; renderMode: boolean }> = ({ part, materialProps, renderMode }) => {
  const material = getMaterial(part.materialId);
  const finish = getFinishProps(material?.finishType);
  const texture = useMemo(() => {
    const source = getMaterialTexture(material);
    if (!source) return null;
    const cloned = source.clone();
    const repeatScale = material?.textureRepeatScale ?? (renderMode ? 420 : 650);
    cloned.wrapS = THREE.RepeatWrapping;
    cloned.wrapT = THREE.RepeatWrapping;
    cloned.repeat.set(Math.max(1, part.size.width / repeatScale), Math.max(1, part.size.height / repeatScale));
    cloned.needsUpdate = true;
    return cloned;
  }, [material?.id, material?.textureRepeatScale, part.size.width, part.size.height, renderMode]);
  const maps = useMemo(() => getMaterialPbrMaps(material), [material?.id]);
  if (['handle', 'hinge', 'runner', 'hanging_rod', 'basket'].includes(part.type)) {
    return <meshPhysicalMaterial color={material?.color || '#d4af7a'} metalness={part.metalness ?? 0.72} roughness={part.roughness ?? 0.18} clearcoat={0.45} clearcoatRoughness={0.14} />;
  }
  if (part.type === 'sink') {
    return <meshPhysicalMaterial color="#cbd5e1" metalness={0.22} roughness={0.2} clearcoat={0.65} clearcoatRoughness={0.12} />;
  }
  if (part.type === 'skirting') {
    return <meshStandardMaterial color="#1f2937" roughness={0.45} />;
  }
  if (part.type === 'countertop') {
    return <meshPhysicalMaterial color={material?.color || '#111827'} map={texture} {...maps} roughness={0.14} metalness={0.02} clearcoat={0.9} clearcoatRoughness={0.08} />;
  }
  return (
    <meshPhysicalMaterial
      {...materialProps}
      color={material?.color || materialProps.color}
      map={texture || materialProps.map}
      normalMap={maps.normalMap || materialProps.normalMap}
      roughnessMap={maps.roughnessMap || materialProps.roughnessMap}
      aoMap={maps.aoMap || materialProps.aoMap}
      roughness={finish.roughness ?? materialProps.roughness}
      metalness={finish.metalness ?? materialProps.metalness}
      clearcoat={finish.clearcoat ?? (renderMode ? 0.28 : 0.12)}
      clearcoatRoughness={finish.clearcoatRoughness ?? 0.22}
    />
  );
};

function getPartTransform(item: Furniture, part: FurniturePart, openAmount: number): { position: [number, number, number]; rotation: [number, number, number] } {
  const position: [number, number, number] = [part.position.x, part.position.y, part.position.z];
  const rotation: [number, number, number] = [0, 0, 0];
  if (part.mechanism === 'slide') {
    position[2] += openAmount * item.depth * 0.48;
  }
  if (part.mechanism === 'pullout') {
    position[2] += openAmount * item.depth * 0.55;
  }
  if (part.mechanism === 'swing') {
    const hingeSign = part.hingeSide === 'left' ? -1 : 1;
    const pivotX = part.position.x + hingeSign * (part.size.width / 2 - 6);
    position[0] = pivotX;
    rotation[1] = hingeSign * ((item.openAngle ?? 100) * Math.PI / 180) * openAmount;
    position[0] += -hingeSign * (part.size.width / 2 - 6) * Math.cos(rotation[1]);
    position[2] += hingeSign * (part.size.width / 2 - 6) * Math.sin(rotation[1]);
  }
  return { position, rotation };
}

function partRadius(part: FurniturePart, renderMode: boolean) {
  if (['shutter', 'drawer_front'].includes(part.type)) return renderMode ? 12 : 9;
  if (['left_panel', 'right_panel', 'top_panel', 'bottom_panel', 'shelf', 'vertical_partition'].includes(part.type)) return renderMode ? 7 : 4;
  if (part.type === 'countertop') return 14;
  if (part.type === 'sink') return 38;
  return renderMode ? 8 : 5;
}

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
