import React from 'react';
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

const cameraConfig: Record<CameraPreset, { position: [number, number, number]; orthographic: boolean; label: string }> = {
  FREE: { position: [5000, 5000, 5000], orthographic: false, label: 'Free View' },
  TOP: { position: [0, 12000, 1], orthographic: true, label: 'Top / Floorplan' },
  FRONT: { position: [0, 2500, 12000], orthographic: true, label: 'Front Elevation' },
  SIDE: { position: [12000, 2500, 0], orthographic: true, label: 'Side Elevation' },
  ISLAND_FRONT: { position: [3500, 2300, 9000], orthographic: false, label: 'Island Front Render' },
};

export const Scene3D: React.FC<Scene3DProps> = ({ cameraPreset = 'FREE' }) => {
  const { walls, furniture, openings, selection, setSelection, activeTool, activeFinish, updateWall, updateFurniture, setCameraPreset } = useStore();
  const config = cameraConfig[cameraPreset];

  return (
    <div className="w-full h-full bg-slate-50 relative">
      <Canvas shadows>
        {config.orthographic ? (
          <OrthographicCamera key={cameraPreset} makeDefault position={config.position} zoom={0.08} near={1} far={100000} />
        ) : (
          <PerspectiveCamera key={cameraPreset} makeDefault position={config.position} far={100000} />
        )}
        <OrbitControls makeDefault minDistance={1000} maxDistance={50000} enableRotate={cameraPreset !== 'TOP'} />
        
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <spotLight 
          position={[10000, 15000, 10000]} 
          angle={0.15} 
          penumbra={1} 
          intensity={2} 
          castShadow 
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
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
          <planeGeometry args={[100000, 100000]} />
          <meshStandardMaterial color="#f1f5f9" roughness={1} />
        </mesh>

        {/* Walls */}
        <group>
          {walls.map((wall) => (
            <Wall3D 
              key={wall.id} 
              wall={wall} 
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
        {Object.entries(cameraConfig).map(([id, item]) => (
          <button
            key={id}
            onClick={() => setCameraPreset(id as CameraPreset)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border",
              cameraPreset === id
                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-500 hover:text-blue-600"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
