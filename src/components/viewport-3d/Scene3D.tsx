import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { useStore } from '../../store/useStore';
import { Wall3D } from './Wall3D';
import { Furniture3D } from './Furniture3D';

export const Scene3D: React.FC = () => {
  const { walls, furniture, openings, selection, setSelection, activeTool, activeFinish, updateWall, updateFurniture } = useStore();

  return (
    <div className="w-full h-full bg-slate-50">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[5000, 5000, 5000]} far={100000} />
        <OrbitControls makeDefault minDistance={1000} maxDistance={50000} />
        
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
                  // Map finish ID to color/texture
                  const finishMap: Record<string, string> = {
                    'finish_white': '#ffffff',
                    'finish_wood': '#d4a373',
                    'finish_marble': '#e5e7eb',
                  };
                  updateWall(wall.id, { color: finishMap[activeFinish] });
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
                  const finishMap: Record<string, string> = {
                    'finish_white': '#ffffff',
                    'finish_wood': '#d4a373',
                    'finish_marble': '#e5e7eb',
                  };
                  updateFurniture(item.id, { color: finishMap[activeFinish] });
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
    </div>
  );
};
