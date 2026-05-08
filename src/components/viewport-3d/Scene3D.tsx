import React, { useMemo, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, OrthographicCamera, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { CameraPreset, useStore } from '../../store/useStore';
import { Wall3D } from './Wall3D';
import { Furniture3D } from './Furniture3D';
import { cn } from '../../lib/utils';
import { getMaterial } from '../../data/catalog';

interface Scene3DProps {
  cameraPreset?: CameraPreset;
}

const cameraLabels: Record<CameraPreset, string> = {
  FREE: 'Free View',
  TOP: 'Top / Floorplan',
  FRONT: 'Front Elevation',
  SIDE: 'Side Elevation',
  ISLAND_FRONT: 'Island Front Render',
};

const isOrthographic: Record<CameraPreset, boolean> = {
  FREE: false,
  TOP: true,
  FRONT: true,
  SIDE: true,
  ISLAND_FRONT: false,
};

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
    setCameraPreset,
  } = useStore();
  const walls = allWalls.filter((w) => w.roomId === currentRoomId);
  const furniture = allFurniture.filter((f) => f.roomId === currentRoomId);
  const openings = allOpenings.filter((o) => o.roomId === currentRoomId);

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
  }, [cameraPreset, sceneBounds]);

  const targetVec: [number, number, number] = [sceneBounds.centerX, 0, sceneBounds.centerZ];
  const orbitRef = useRef<any>(null);

  // Re-target controls whenever the scene bounds change so the orbit pivot
  // stays at the room's centroid even after editing.
  useEffect(() => {
    if (orbitRef.current) {
      orbitRef.current.target.set(targetVec[0], targetVec[1], targetVec[2]);
      orbitRef.current.update();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneBounds.centerX, sceneBounds.centerZ, cameraPreset]);

  const orthographic = isOrthographic[cameraPreset];

  return (
    <div className="w-full h-full bg-slate-50 relative">
      <Canvas
        shadows
        gl={{
          antialias: true,
          logarithmicDepthBuffer: true,
          powerPreference: 'high-performance',
        }}
      >
        {orthographic ? (
          <OrthographicCamera key={cameraPreset} makeDefault position={cameraPosition} zoom={0.08} near={1} far={100000} />
        ) : (
          <PerspectiveCamera key={cameraPreset} makeDefault position={cameraPosition} far={200000} />
        )}
        <OrbitControls
          ref={orbitRef}
          makeDefault
          target={targetVec}
          minDistance={1000}
          maxDistance={100000}
          enableRotate={cameraPreset !== 'TOP'}
        />
        
        {/* Lighting */}
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

        {/* Environment */}
        <Grid 
          infiniteGrid 
          fadeDistance={50000} 
          sectionSize={1000} 
          sectionThickness={1.5} 
          cellSize={100} 
          cellThickness={0.5} 
          sectionColor="#cbd5e1"
          cellColor="#e2e8f0"
        />

        {/* Floor Level */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
          <planeGeometry args={[100000, 100000]} />
          <meshStandardMaterial
            color="#f1f5f9"
            roughness={1}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>

        {/* Walls */}
        <group>
          {walls.map((wall, wallIndex) => (
            <Wall3D 
              key={wall.id} 
              wall={wall}
              depthBiasIndex={wallIndex}
              openings={openings.filter(o => o.wallId === wall.id)}
              isSelected={selection?.id === wall.id}
              onClick={() => {
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
              isSelected={selection?.id === item.id}
              onClick={() => {
                if (activeTool === 'APPLY_FINISH' && activeFinish) {
                  const material = getMaterial(activeFinish);
                  updateFurniture(item.id, { color: material?.color, materialId: material?.id });
                } else {
                  setSelection({ id: item.id, type: 'furniture' });
                }
              }}
            />
          ))}
        </group>

        {/* Helpers */}
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisColors={['#f87171', '#4ade80', '#60a5fa']} labelColor="black" />
        </GizmoHelper>
      </Canvas>

      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-1 px-3 py-2 bg-white/80 backdrop-blur border-t border-slate-200">
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
      </div>
    </div>
  );
};
