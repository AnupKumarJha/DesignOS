import React, { Suspense, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { RoundedBox, useGLTF } from '@react-three/drei';
import { Furniture } from '../../store/useStore';
import { COLORS } from '../../lib/constants';
import { getCatalogItem, getMaterial } from '../../data/catalog';
import { getMaterialTexture, getFinishProps } from '../../lib/materialTexture';
import { getCatalogAsset } from '../../lib/db';

interface Furniture3DProps {
  item: Furniture;
  isSelected: boolean;
  renderMode?: boolean;
  onClick?: () => void;
}

export const Furniture3D: React.FC<Furniture3DProps> = ({ item, isSelected, onClick }) => {
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
    cloned.repeat.set(Math.max(1, item.width / 600), Math.max(1, item.height / 600));
    return cloned;
  }, [material?.id, item.width, item.height]);

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
      {modelUrl ? (
        <Suspense fallback={<ProceduralFurniture item={item} materialProps={materialProps} />}>
          <ModelAsset item={item} modelUrl={modelUrl} />
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
  const openAmount = item.openState === 'open' ? (item.openAmount ?? 1) : 0;
  const isOpenUnit = (item.shutterCount ?? 1) === 0 || item.catalogItemId === 'open_unit';
  const isPullout = item.catalogItemId === 'pullout_unit';
  const isSink = item.type === 'SINK_UNIT' || item.catalogItemId === 'sink_unit';
  const hingeCount = Math.max(1, item.hingeCount ?? (item.height > 1200 ? 3 : 2));
  const openAngle = ((item.openAngle ?? 100) * Math.PI) / 180;
  const internalMaterial = getMaterial(item.internalMaterialId) || getMaterial('laminate_ash_grey');
  const internalFinish = getFinishProps(internalMaterial?.finishType);
  const internalTexture = useMemo(() => {
    const source = getMaterialTexture(internalMaterial);
    if (!source) return null;
    const cloned = source.clone();
    cloned.wrapS = THREE.RepeatWrapping;
    cloned.wrapT = THREE.RepeatWrapping;
    cloned.repeat.set(Math.max(1, item.width / 700), Math.max(1, item.height / 700));
    cloned.needsUpdate = true;
    return cloned;
  }, [internalMaterial?.id, item.width, item.height]);
  const panelMaterial = () => (
    <PhysicalMaterial
      {...materialProps}
      color={materialProps.color}
    />
  );
  const internalMaterialNode = () => (
    <meshPhysicalMaterial
      color={internalMaterial?.color || '#d8dee8'}
      map={internalTexture}
      roughness={internalFinish.roughness}
      metalness={internalFinish.metalness}
      clearcoat={internalFinish.clearcoat ?? 0.1}
      clearcoatRoughness={internalFinish.clearcoatRoughness ?? 0.28}
    />
  );

  return (
    <group>
      {/* Cabinet carcass: separate panels so open units reveal real internal volume. */}
      <RoundedBox position={[0, 0, -item.depth / 2 + 16]} args={[item.width, item.height, 32]} radius={10} smoothness={4} castShadow receiveShadow>
        {internalMaterialNode()}
      </RoundedBox>
      {[-1, 1].map((side) => (
        <RoundedBox key={side} position={[side * (item.width / 2 - 12), 0, 0]} args={[24, item.height, item.depth]} radius={8} smoothness={4} castShadow receiveShadow>
          {panelMaterial()}
        </RoundedBox>
      ))}
      <RoundedBox position={[0, item.height / 2 - 12, 0]} args={[item.width, 24, item.depth]} radius={8} smoothness={4} castShadow receiveShadow>
        {panelMaterial()}
      </RoundedBox>
      <RoundedBox position={[0, -item.height / 2 + 12, 0]} args={[item.width, 24, item.depth]} radius={8} smoothness={4} castShadow receiveShadow>
        {panelMaterial()}
      </RoundedBox>
      {countertop && (
        <RoundedBox position={[0, item.height / 2 + 28, 0]} args={[item.width + 60, 56, item.depth + 70]} radius={12} smoothness={5} castShadow receiveShadow>
          <meshPhysicalMaterial color="#111827" roughness={0.18} clearcoat={0.75} clearcoatRoughness={0.08} />
        </RoundedBox>
      )}
      {isSink && (
        <>
          <RoundedBox position={[0, item.height / 2 + 64, item.depth * 0.08]} args={[Math.min(520, item.width * 0.62), 90, item.depth * 0.48]} radius={42} smoothness={8} castShadow>
            <meshPhysicalMaterial color="#cbd5e1" metalness={0.18} roughness={0.22} clearcoat={0.65} />
          </RoundedBox>
          <mesh position={[0, item.height / 2 + 112, item.depth * 0.08]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[Math.min(190, item.width * 0.24), 12, 12, 72]} />
            <meshPhysicalMaterial color="#94a3b8" metalness={0.35} roughness={0.18} />
          </mesh>
        </>
      )}
      {(isOpenUnit || openAmount > 0) && (
        <>
          {[-0.18, 0.18].map((yFactor) => (
            <RoundedBox key={yFactor} position={[0, item.height * yFactor, 0]} args={[item.width - 70, 24, item.depth - 60]} radius={6} smoothness={3} castShadow receiveShadow>
              {internalMaterialNode()}
            </RoundedBox>
          ))}
          <RoundedBox position={[0, 0, item.depth / 2 - 34]} args={[item.width - 84, item.height - 100, 14]} radius={6} smoothness={3}>
            <meshBasicMaterial color="#0f172a" transparent opacity={0.08} />
          </RoundedBox>
        </>
      )}
      {isPullout && openAmount > 0 && (
        <group position={[0, 0, item.depth / 2 + openAmount * item.depth * 0.48]}>
          <RoundedBox args={[item.width - 72, item.height - 120, 42]} radius={12} smoothness={5} castShadow>
            <meshPhysicalMaterial color="#d4af7a" metalness={0.45} roughness={0.22} />
          </RoundedBox>
          {[-0.3, 0, 0.3].map((x) => (
            <mesh key={x} position={[item.width * x, -80, 40]}>
              <cylinderGeometry args={[34, 34, 190, 24]} />
              <meshPhysicalMaterial color="#1f7a4d" roughness={0.3} clearcoat={0.4} />
            </mesh>
          ))}
        </group>
      )}
      {!isOpenUnit && Array.from({ length: drawerCount || shutterCount }).map((_, idx) => {
        const count = drawerCount || shutterCount;
        const w = drawerCount ? item.width - 36 : (item.width - 42) / count;
        const h = drawerCount ? (item.height - 44) / count : item.height - 54;
        const x = drawerCount ? 0 : -item.width / 2 + 21 + w / 2 + idx * w;
        const y = drawerCount ? item.height / 2 - 26 - h / 2 - idx * h : 0;
        const zOpen = drawerCount || isPullout ? openAmount * item.depth * 0.45 : 0;
        const autoLeft = idx < count / 2;
        const hingeSide = item.hingeSide === 'left' ? 'left' : item.hingeSide === 'right' ? 'right' : autoLeft ? 'left' : 'right';
        const hingeSign = hingeSide === 'left' ? -1 : 1;
        const doorSwing = !drawerCount && openAmount > 0 ? hingeSign * openAngle * openAmount : 0;
        const pivotX = drawerCount ? x : x + hingeSign * (w / 2 - 5);
        const panelX = drawerCount ? 0 : -hingeSign * (w / 2 - 5);
        const handleX = drawerCount ? 0 : panelX + hingeSign * -1 * Math.max(38, w * 0.16);
        return (
          <group key={idx} position={[drawerCount ? x : pivotX, y, item.depth / 2 + 12 + zOpen]} rotation={[0, doorSwing, 0]}>
            <RoundedBox position={[panelX, 0, 0]} args={[w - 10, h - 10, 22]} radius={10} smoothness={4} castShadow>
              <PhysicalMaterial {...materialProps} color={materialProps.color} />
            </RoundedBox>
            {drawerCount > 0 && openAmount > 0 && (
              <RoundedBox position={[0, 0, -item.depth * 0.24]} args={[w - 46, h - 38, item.depth * 0.46]} radius={8} smoothness={3} castShadow receiveShadow>
                {internalMaterialNode()}
              </RoundedBox>
            )}
            {!drawerCount && Array.from({ length: hingeCount }).map((_, hingeIdx) => {
              const top = item.hingeOffsetTop ?? 110;
              const bottom = item.hingeOffsetBottom ?? 110;
              const span = Math.max(1, h - top - bottom);
              const hingeY = h / 2 - top - (hingeCount === 1 ? span / 2 : (span / (hingeCount - 1)) * hingeIdx);
              const bore = item.hingeBoreDistance ?? 22;
              const hardwareColor = item.hingeType === 'Piano' ? '#71717a' : '#c0a16b';
              return (
                <group key={hingeIdx} position={[0, hingeY, 20]}>
                  <RoundedBox args={[18, item.hingeType === 'Piano' ? h - 50 : 72, 18]} radius={5} smoothness={3} castShadow>
                    <meshPhysicalMaterial color={hardwareColor} metalness={0.72} roughness={0.2} />
                  </RoundedBox>
                  {item.hingeType !== 'Piano' && (
                    <mesh position={[panelX + hingeSign * bore, 0, 4]} rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[18, 18, 8, 24]} />
                      <meshPhysicalMaterial color={hardwareColor} metalness={0.68} roughness={0.18} />
                    </mesh>
                  )}
                </group>
              );
            })}
            {item.hasHandle && (
              <RoundedBox position={[handleX, 0, 18]} args={[drawerCount ? Math.min(220, item.width * 0.38) : 12, drawerCount ? 12 : 190, 12]} radius={5} smoothness={3} castShadow>
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
