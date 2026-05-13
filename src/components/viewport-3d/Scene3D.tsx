import React, { useMemo, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Grid, GizmoHelper, GizmoViewport, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Bloom, EffectComposer, SSAO, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { CameraPreset, Wall, useStore } from '../../store/useStore';
import { Wall3D } from './Wall3D';
import { Furniture3D } from './Furniture3D';
import { cn } from '../../lib/utils';
import { getMaterial } from '../../data/catalog';
import { getFinishProps, getMaterialPbrMaps, getMaterialTexture } from '../../lib/materialTexture';
import {
  downloadCanvasPng,
  getRenderCameraPosition,
  getRenderTarget,
  getRoomBounds,
  inferRenderRoomType,
  pointsToShape,
  RoomBounds,
} from '../../lib/rendering';
import { RenderRoomKit } from './RenderRoomKit';
import { RenderToolbar } from './RenderToolbar';
import { createFurnitureFromCatalog, FURNITURE_DRAG_MIME } from '../../lib/furnitureFactory';

interface Scene3DProps {
  cameraPreset?: CameraPreset;
}

const cameraLabels: Record<CameraPreset, string> = {
  FREE: 'Free View',
  TOP: 'Top / 2D',
  FRONT: 'Front Elevation',
  SIDE: 'Side Elevation',
  ISLAND_FRONT: 'Island Front Render',
};

type FloorDropProjector = (clientX: number, clientY: number) => { x: number; y: number } | null;

export const Scene3D: React.FC<Scene3DProps> = ({ cameraPreset = 'FREE' }) => {
  const {
    walls: allWalls,
    furniture: allFurniture,
    openings: allOpenings,
    currentRoomId,
    selection,
    setSelection,
    activeTool,
    activeFinish,
    updateWall,
    updateFurniture,
    addFurniture,
    customCatalogItems,
    removeWall,
    removeFurniture,
    setCameraPreset,
    presentationMode,
    renderQuality,
    renderCameraPreset,
    activeRenderRoomType,
    showCeiling,
    showDecor,
    showLights,
    rooms,
    settings,
    updateRoomFloorMaterial,
  } = useStore();
  const walls = allWalls.filter((w) => w.roomId === currentRoomId);
  const furniture = allFurniture.filter((f) => f.roomId === currentRoomId);
  const openings = allOpenings.filter((o) => o.roomId === currentRoomId);
  const currentRoom = rooms.find((room) => room.id === currentRoomId);
  const floorMaterialId = currentRoom?.floorMaterialId || settings.defaultFloorMaterialId;
  const floorMaterial = getMaterial(floorMaterialId);
  const renderRoomType = inferRenderRoomType(currentRoom, activeRenderRoomType);
  const renderBounds = useMemo(() => getRoomBounds(walls, furniture), [walls, furniture]);

  // Bounds of the entire scene so the camera always frames the room.
  // 2D plan uses (x, y); 3D uses (x, _, -y) — see Wall3D positioning.
  const sceneBounds = useMemo(() => {
    const xs: number[] = [];
    const ys: number[] = [];
    walls.forEach((w) => {
      xs.push(w.start.x, w.end.x);
      ys.push(w.start.y, w.end.y);
    });
    furniture.forEach((f) => {
      xs.push(f.position.x);
      ys.push(f.position.y);
    });
    if (xs.length === 0) {
      return { centerX: 0, centerZ: 0, size: 5000 };
    }
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return {
      centerX: (minX + maxX) / 2,
      centerZ: -(minY + maxY) / 2, // 2D Y maps to -Z in 3D
      size: Math.max(maxX - minX, maxY - minY, 2000),
    };
  }, [walls, furniture]);

  const cameraPosition = useMemo<[number, number, number]>(() => {
    if (presentationMode) {
      return getRenderCameraPosition(renderCameraPreset, renderBounds);
    }
    const dist = sceneBounds.size * 1.4;
    const { centerX, centerZ } = sceneBounds;
    switch (cameraPreset) {
      case 'TOP':
        return [centerX, dist * 2, centerZ + 1];
      case 'FRONT':
        return [centerX, 2500, centerZ + dist * 1.5];
      case 'SIDE':
        return [centerX + dist * 1.5, 2500, centerZ];
      case 'ISLAND_FRONT':
        return [centerX + dist * 0.7, 2300, centerZ + dist * 1.6];
      case 'FREE':
      default:
        return [centerX + dist, dist, centerZ + dist];
    }
  }, [cameraPreset, sceneBounds, presentationMode, renderBounds, renderCameraPreset]);

  const targetVec: [number, number, number] = presentationMode
    ? getRenderTarget(renderCameraPreset, renderBounds)
    : [sceneBounds.centerX, 0, sceneBounds.centerZ];
  const orbitRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const floorDropProjectorRef = useRef<FloorDropProjector | null>(null);

  // Re-target controls whenever the scene bounds change so the orbit pivot
  // stays at the room's centroid even after editing.
  useEffect(() => {
    if (orbitRef.current) {
      orbitRef.current.target.set(targetVec[0], targetVec[1], targetVec[2]);
      orbitRef.current.update();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneBounds.centerX, sceneBounds.centerZ, cameraPreset, presentationMode, renderCameraPreset, renderBounds.centerX, renderBounds.centerZ]);

  const setPrimaryDragAction = (action: THREE.MOUSE) => {
    if (!orbitRef.current) return;
    orbitRef.current.mouseButtons.LEFT = action;
  };
  const handlePointerDownCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    setPrimaryDragAction(event.shiftKey || event.altKey || event.metaKey || event.ctrlKey ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE);
  };
  const resetPrimaryDragAction = () => setPrimaryDragAction(THREE.MOUSE.ROTATE);

  const captureRender = () => {
    const canvas = containerRef.current?.querySelector('canvas') ?? null;
    const name = `${currentRoom?.name ?? 'room'}-${renderRoomType}-render.png`
      .replace(/[^a-z0-9-_.]+/gi, '-')
      .toLowerCase();
    downloadCanvasPng(canvas, name);
  };
  const handleCatalogDrop = (event: React.DragEvent<HTMLDivElement>) => {
    const catalogItemId = event.dataTransfer.getData(FURNITURE_DRAG_MIME) || event.dataTransfer.getData('text/plain');
    if (!catalogItemId || !containerRef.current) return;
    event.preventDefault();
    const raycastPosition = floorDropProjectorRef.current?.(event.clientX, event.clientY);
    const rect = containerRef.current.getBoundingClientRect();
    const relX = (event.clientX - rect.left) / rect.width - 0.5;
    const relY = (event.clientY - rect.top) / rect.height - 0.5;
    const pos = raycastPosition ?? {
      x: renderBounds.centerX + relX * renderBounds.size * 1.75,
      y: -renderBounds.centerZ + relY * renderBounds.size * 1.35,
    };
    const next = createFurnitureFromCatalog({
      catalogItemId,
      roomId: currentRoomId,
      position: pos,
      walls,
      customCatalogItems,
    });
    if (!next) return;
    addFurniture(next);
    setSelection({ id: next.id, type: 'furniture' });
  };

  return (
    <div
      ref={containerRef}
      data-testid={presentationMode ? 'scene-3d-real' : 'scene-3d'}
      className={cn("w-full h-full relative", presentationMode ? "bg-[#f5efe6]" : "bg-slate-50")}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes(FURNITURE_DRAG_MIME)) event.preventDefault();
      }}
      onDrop={handleCatalogDrop}
      onPointerDownCapture={handlePointerDownCapture}
      onPointerUpCapture={resetPrimaryDragAction}
      onPointerCancel={resetPrimaryDragAction}
      onPointerLeave={resetPrimaryDragAction}
    >
      <Canvas
        shadows
        gl={{
          antialias: true,
          logarithmicDepthBuffer: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: true,
        }}
        dpr={presentationMode && renderQuality === 'High' ? [1, 2] : [1, 1.5]}
        camera={{ fov: presentationMode ? 42 : 50 }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = presentationMode ? 1.08 : 0.95;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <FloorDropProjectorBridge projectorRef={floorDropProjectorRef} />

        <PerspectiveCamera key={presentationMode ? renderCameraPreset : cameraPreset} makeDefault position={cameraPosition} far={200000} fov={presentationMode ? 42 : 50} />
        <OrbitControls
          ref={orbitRef}
          makeDefault
          target={targetVec}
          minDistance={presentationMode ? 600 : 1000}
          maxDistance={100000}
          enableRotate
          enablePan
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.PAN,
          }}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
          maxPolarAngle={presentationMode ? Math.PI * 0.62 : Math.PI}
        />
        
        {/* Lighting */}
        {!presentationMode && (
          <>
            <Environment preset="studio" background={false} blur={0.25} />
            <ambientLight intensity={0.6} />
            <spotLight 
              position={[10000, 15000, 10000]} 
              angle={0.15} 
              penumbra={1} 
              intensity={2} 
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-bias={-0.00025}
              shadow-normalBias={0.05}
            />
            <directionalLight position={[-5000, 10000, 5000]} intensity={0.5} />
            <ContactShadows
              position={[sceneBounds.centerX, 2, sceneBounds.centerZ]}
              opacity={0.26}
              scale={sceneBounds.size * 1.45}
              blur={2.4}
              far={2800}
            />
          </>
        )}
        {presentationMode && (
          <>
            <Environment preset="apartment" background={false} blur={0.45} />
            <RenderRoomKit
              bounds={renderBounds}
              walls={walls}
              furniture={furniture}
              roomType={renderRoomType}
              showCeiling={showCeiling}
              showDecor={showDecor}
              showLights={showLights}
              floorMaterialId={floorMaterialId}
            />
            <ContactShadows
              position={[renderBounds.centerX, 8, renderBounds.centerZ]}
              opacity={0.36}
              scale={renderBounds.size * 1.4}
              blur={2.2}
              far={2600}
            />
          </>
        )}

        {/* Environment */}
        {!presentationMode && <Grid 
          infiniteGrid 
          fadeDistance={50000} 
          sectionSize={1000} 
          sectionThickness={1.5} 
          cellSize={100} 
          cellThickness={0.5} 
          sectionColor="#cbd5e1"
          cellColor="#e2e8f0"
        />}

        {/* Floor Level */}
        {!presentationMode && (
          <FloorSurface
            bounds={renderBounds}
            walls={walls}
            materialId={floorMaterialId}
            infinite
          />
        )}

        {/* Walls */}
        <group>
          {walls.map((wall, wallIndex) => (
            <Wall3D 
              key={wall.id} 
              wall={wall}
              depthBiasIndex={wallIndex}
              openings={openings.filter(o => o.wallId === wall.id)}
              isSelected={!presentationMode && selection?.id === wall.id}
              onClick={() => {
                if (activeTool === 'DELETE') {
                  removeWall(wall.id);
                  return;
                }
                if (activeTool === 'APPLY_FINISH' && activeFinish) {
                  const material = getMaterial(activeFinish);
                  updateWall(wall.id, { color: material?.color, materialId: material?.id });
                } else {
                  setSelection({ id: wall.id, type: 'wall' });
                }
              }}
            />
          ))}
        </group>

        {/* Furniture */}
        <group>
          {furniture.map((item) => (
            <Furniture3D
              key={item.id}
              item={item}
              isSelected={!presentationMode && selection?.id === item.id}
              renderMode={presentationMode}
              onPartClick={(partId) => {
                if (presentationMode) return;
                setSelection({ id: item.id, type: 'furniture' });
                updateFurniture(item.id, { selectedPartId: partId });
              }}
              onClick={() => {
                if (activeTool === 'DELETE') {
                  removeFurniture(item.id);
                  return;
                }
                if (activeTool === 'APPLY_FINISH' && activeFinish) {
                  const material = getMaterial(activeFinish);
                  updateFurniture(item.id, { color: material?.color, materialId: material?.id });
                } else {
                  setSelection({ id: item.id, type: 'furniture' });
                  if (isOpenableFurniture(item)) {
                    const nextOpen = item.openState === 'open' ? 'closed' : 'open';
                    updateFurniture(item.id, { openState: nextOpen, openAmount: nextOpen === 'open' ? 1 : 0 });
                  }
                }
              }}
            />
          ))}
        </group>

        {/* Helpers */}
        {!presentationMode && <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisColors={['#f87171', '#4ade80', '#60a5fa']} labelColor="black" />
        </GizmoHelper>}

        {presentationMode && renderQuality === 'High' && (
          <EffectComposer multisampling={4} enableNormalPass>
            <SSAO samples={18} radius={0.18} intensity={18} luminanceInfluence={0.72} color={new THREE.Color('black')} />
            {showLights && <Bloom intensity={0.65} luminanceThreshold={0.55} luminanceSmoothing={0.24} mipmapBlur />}
            <Vignette eskil={false} offset={0.18} darkness={0.42} />
          </EffectComposer>
        )}
      </Canvas>

      {presentationMode && <RenderToolbar onCapture={captureRender} />}

      {!presentationMode && (
        <div className="absolute right-5 top-5 z-30 flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 shadow-lg backdrop-blur">
          <div
            className="h-8 w-8 rounded-lg border border-slate-200 shadow-inner"
            style={{ backgroundColor: floorMaterial?.color || '#ffffff' }}
          />
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Floor</div>
            <div className="max-w-[150px] truncate text-[11px] font-black text-slate-800">
              {floorMaterial?.name || 'Clear White Floor'}
            </div>
          </div>
          <button
            onClick={() => updateRoomFloorMaterial(currentRoomId, 'floor_clear_white')}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-black text-slate-600 shadow-sm hover:border-blue-200 hover:text-blue-700"
            title="Set current room floor to clear white"
          >
            White
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('design-os:open-floor-tiling'))}
            className="rounded-lg border border-blue-600 bg-blue-600 px-2.5 py-1.5 text-[10px] font-black text-white shadow-sm hover:bg-blue-700"
            title="Choose a floor material"
          >
            Change
          </button>
        </div>
      )}

      {!presentationMode && <div className="absolute right-5 bottom-16 z-20 w-16 h-16 rounded-full bg-slate-700/80 text-white shadow-xl border border-white/40 flex items-center justify-center text-[11px] font-black">
        {cameraPreset === 'SIDE' ? 'RIGHT' : cameraPreset === 'FRONT' ? 'FRONT' : cameraPreset === 'TOP' ? 'TOP' : '3D'}
      </div>}

      {!presentationMode && <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-1 px-3 py-2 bg-white/80 backdrop-blur border-t border-slate-200">
        {(Object.keys(cameraLabels) as CameraPreset[]).map((id) => (
          <button
            key={id}
            onClick={() => setCameraPreset(id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border",
              cameraPreset === id
                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-500 hover:text-blue-600"
            )}
          >
            {cameraLabels[id]}
          </button>
        ))}
        <button
          onClick={() => {
            // Trigger a re-target by toggling preset to itself; the useEffect re-fits.
            setCameraPreset(cameraPreset);
            if (orbitRef.current) {
              orbitRef.current.target.set(targetVec[0], targetVec[1], targetVec[2]);
              orbitRef.current.update();
            }
          }}
          className="ml-auto px-3 py-1.5 rounded-lg text-[10px] font-black bg-slate-900 text-white border border-slate-900 hover:bg-slate-700"
          title="Re-center camera on room"
        >
          Fit View
        </button>
      </div>}
    </div>
  );
};

const isOpenableFurniture = (item: { type: string; catalogItemId?: string; drawerCount?: number; shutterCount?: number }) =>
  ['CABINET_BASE', 'CABINET_WALL', 'CABINET_TALL', 'SINK_UNIT', 'WARDROBE', 'DRESSER', 'VANITY', 'TV_UNIT', 'SHOE_RACK'].includes(item.type) ||
  ['drawer_unit', 'open_unit', 'pullout_unit', 'sink_unit', 'cabinet_base', 'cabinet_wall', 'cabinet_tall'].includes(item.catalogItemId ?? '') ||
  (item.drawerCount ?? 0) > 0 ||
  (item.shutterCount ?? 0) > 0;

const FloorDropProjectorBridge: React.FC<{
  projectorRef: React.MutableRefObject<FloorDropProjector | null>;
}> = ({ projectorRef }) => {
  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);
  const floorPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const hit = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    projectorRef.current = (clientX, clientY) => {
      const rect = gl.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const intersection = raycaster.ray.intersectPlane(floorPlane, hit);
      if (!intersection) return null;
      return { x: intersection.x, y: -intersection.z };
    };
    return () => {
      projectorRef.current = null;
    };
  }, [camera, floorPlane, gl.domElement, hit, pointer, projectorRef, raycaster]);

  return null;
};

const FloorSurface: React.FC<{
  bounds: RoomBounds;
  walls: Wall[];
  materialId: string;
  infinite?: boolean;
}> = ({ bounds, walls, materialId, infinite = false }) => {
  const material = getMaterial(materialId);
  const finish = getFinishProps(material?.finishType);
  const texture = useMemo(() => {
    const source = getMaterialTexture(material);
    if (!source) return null;
    const cloned = source.clone();
    cloned.wrapS = THREE.RepeatWrapping;
    cloned.wrapT = THREE.RepeatWrapping;
    const repeatScale = material?.textureRepeatScale ?? 650;
    cloned.repeat.set(Math.max(1, bounds.width / repeatScale), Math.max(1, bounds.depth / repeatScale));
    cloned.needsUpdate = true;
    return cloned;
  }, [material?.id, material?.textureRepeatScale, bounds.width, bounds.depth]);
  const pbrMaps = useMemo(() => getMaterialPbrMaps(material), [material?.id]);
  const geometry = useMemo(() => {
    if (infinite) return null;
    return new THREE.ShapeGeometry(pointsToShape(walls, bounds));
  }, [bounds, walls, infinite]);

  if (infinite) {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[bounds.centerX, -2, bounds.centerZ]} receiveShadow>
        <planeGeometry args={[Math.max(bounds.size * 2.4, 10000), Math.max(bounds.size * 2.4, 10000)]} />
        <meshPhysicalMaterial
          color={material?.color || '#ffffff'}
          map={texture}
          {...pbrMaps}
          roughness={finish.roughness}
          metalness={finish.metalness}
          clearcoat={finish.clearcoat ?? 0.12}
          clearcoatRoughness={finish.clearcoatRoughness ?? 0.28}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
    );
  }

  return (
    <mesh geometry={geometry ?? undefined} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <meshPhysicalMaterial
        color={material?.color || '#ffffff'}
        map={texture}
        {...pbrMaps}
        roughness={finish.roughness}
        metalness={finish.metalness}
        clearcoat={finish.clearcoat ?? 0.2}
        clearcoatRoughness={finish.clearcoatRoughness ?? 0.22}
      />
    </mesh>
  );
};
