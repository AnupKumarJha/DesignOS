import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Group, Line } from 'react-konva';
import { useStore, Wall, Point, Furniture } from '../../store/useStore';
import { Grid } from './Grid';
import { Wall2D } from './Wall2D';
import { Furniture2D } from './Furniture2D';
import { Opening2D } from './Opening2D';
import { snapToGrid, snapToAngle, findClosestPoint, getClosestPointOnSegment, getDistance } from '../../lib/math';
import { DEFAULT_WALL_HEIGHT, DEFAULT_WALL_THICKNESS } from '../../lib/constants';

export const FloorPlan: React.FC = () => {
  const { 
    walls, 
    openings,
    furniture, 
    activeTool, 
    setActiveTool,
    selection, 
    activeFinish,
    selectedCatalogItem,
    addWall, 
    updateWall,
    addFurniture, 
    updateFurniture,
    addOpening,
    updateOpening,
    setSelection, 
    removeWall, 
    removeFurniture,
    removeOpening 
  } = useStore();
  
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [scale, setScale] = useState(0.2);
  const [offset, setOffset] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [draftStart, setDraftStart] = useState<Point | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState<Point | null>(null);

  const stageRef = useRef<any>(null);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'Escape') {
        setDraftStart(null);
        setCurrentMousePos(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const getRelativePointerPosition = (stage: any) => {
    const pointer = stage.getPointerPosition();
    return {
      x: (pointer.x - offset.x) / scale,
      y: (pointer.y - offset.y) / scale,
    };
  };

  const handleMouseDown = (e: any) => {
    // Cancel drawing on right click
    if (e.evt.button === 2) {
      if (draftStart) {
        setDraftStart(null);
        setActiveTool('SELECT');
      }
      return;
    }

    const stage = e.target.getStage();
    const pos = getRelativePointerPosition(stage);
    
    // De-selection
    if (e.target === stage) {
      setSelection(null);
    }

    if (activeTool === 'WALL') {
      const allPoints = walls.flatMap(w => [w.start, w.end]);
      const snapped = findClosestPoint(pos, allPoints) || snapToGrid(pos);
      
      if (!draftStart) {
        setDraftStart(snapped);
      } else {
        const wallEnd = snapToAngle(draftStart, snapped);
        const newWall: Wall = {
          id: crypto.randomUUID(),
          start: draftStart,
          end: wallEnd,
          thickness: DEFAULT_WALL_THICKNESS,
          height: DEFAULT_WALL_HEIGHT,
        };
        addWall(newWall);
        setDraftStart(null);
        setActiveTool('SELECT');
      }
    } else if (activeTool === 'FURNITURE') {
      const stage = e.target.getStage();
      const pos = getRelativePointerPosition(stage);
      
      const furnitureConfig: Record<string, Partial<Furniture>> = {
        'cabinet_base': { type: 'CABINET_BASE', width: 600, depth: 560, height: 720, shutterCount: 1, hasHandle: true, skirtingHeight: 100 },
        'cabinet_wall': { type: 'CABINET_WALL', width: 600, depth: 320, height: 720, shutterCount: 1, hasHandle: true },
        'cabinet_tall': { type: 'CABINET_TALL', width: 600, depth: 560, height: 2040, shutterCount: 1, hasHandle: true, skirtingHeight: 100 },
        'sink_unit': { type: 'SINK_UNIT', width: 800, depth: 560, height: 720, shutterCount: 2, hasHandle: true, skirtingHeight: 100 },
        'wardrobe': { type: 'WARDROBE', width: 1000, depth: 600, height: 2100, shutterCount: 2, hasHandle: true, skirtingHeight: 100 },
      };

      const config = (selectedCatalogItem && furnitureConfig[selectedCatalogItem]) || furnitureConfig['cabinet_base'];
      
      // Basic wall snapping for cabinets
      let snappedPos = snapToGrid(pos, 50);
      let rotation = 0;
      
      let minSnapDist = 100;
      for (const wall of walls) {
        const { point } = getClosestPointOnSegment(pos, wall.start, wall.end);
        const dist = getDistance(pos, point);
        
        if (dist < minSnapDist) {
          minSnapDist = dist;
          snappedPos = point;
          // Calculate rotation to face away from wall
          rotation = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x) * (180 / Math.PI) + 90;
        }
      }

      const newFurniture: Furniture = {
        id: crypto.randomUUID(),
        type: config.type as any,
        position: snappedPos,
        rotation,
        width: config.width || 600,
        depth: config.depth || 600,
        height: config.height || 900,
        color: '#ffffff',
        ...config
      };
      addFurniture(newFurniture);
      setSelection({ id: newFurniture.id, type: 'furniture' });
      setActiveTool('SELECT');
    } else if (activeTool === 'WINDOW' || activeTool === 'DOOR') {
      // Find closest wall
      let closestWall = null;
      let minDistance = 50; // threshold
      let bestPoint = null;
      let bestOffset = 0;

      for (const wall of walls) {
        const { point, offset } = getClosestPointOnSegment(pos, wall.start, wall.end);
        const dist = getDistance(pos, point);
        if (dist < minDistance) {
          minDistance = dist;
          closestWall = wall;
          bestPoint = point;
          bestOffset = offset;
        }
      }

      if (closestWall && bestPoint) {
        const type = activeTool === 'WINDOW' ? 'WINDOW' : 'DOOR';
        addOpening({
          id: crypto.randomUUID(),
          wallId: closestWall.id,
          type,
          offset: bestOffset,
          width: type === 'WINDOW' ? 1200 : 900,
          height: type === 'WINDOW' ? 1200 : 2100,
          bottomHeight: type === 'WINDOW' ? 900 : 0
        });
        setActiveTool('SELECT');
      }
    }
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const pos = getRelativePointerPosition(stage);
    
    if (draftStart) {
      const snapped = snapToAngle(draftStart, pos);
      setCurrentMousePos(snapped);
    } else {
      setCurrentMousePos(pos);
    }
  };

  const handleStageDrag = (e: any) => {
    if (activeTool !== 'SELECT') {
      e.target.stopDrag();
      return;
    }
    setOffset({ x: e.target.x(), y: e.target.y() });
  };

  const handleWallClick = (wall: Wall) => {
    if (activeTool === 'APPLY_FINISH' && activeFinish) {
      const finishMap: Record<string, string> = {
        'finish_white': '#ffffff',
        'finish_wood': '#d4a373',
        'finish_marble': '#e5e7eb',
      };
      updateWall(wall.id, { color: finishMap[activeFinish] });
    } else {
      setSelection({ id: wall.id, type: 'wall' });
    }
  };

  const handleFurnitureClick = (item: Furniture) => {
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
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    setScale(newScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setOffset(newPos);
  };

  return (
    <div className="w-full h-full bg-white overflow-hidden">
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        scaleX={scale}
        scaleY={scale}
        x={offset.x}
        y={offset.y}
        draggable={activeTool === 'SELECT'}
        onDragEnd={handleStageDrag}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        onContextMenu={(e) => e.evt.preventDefault()}
        ref={stageRef}
      >
        <Layer>
          <Grid width={dimensions.width} height={dimensions.height} scale={scale} offset={offset} />
          
          <Group>
            {walls.map((wall) => (
              <Wall2D
                key={wall.id}
                wall={wall}
                isSelected={selection?.id === wall.id}
                onClick={() => handleWallClick(wall)}
              />
            ))}
          </Group>

          <Group>
            {furniture.map((item) => (
              <Furniture2D
                key={item.id}
                item={item}
                isSelected={selection?.id === item.id}
                onClick={() => handleFurnitureClick(item)}
                onDragEnd={(pos) => updateFurniture(item.id, { position: pos })}
              />
            ))}
          </Group>

          <Group>
            {openings.map((opening) => {
              const wall = walls.find(w => w.id === opening.wallId);
              if (!wall) return null;
              return (
                <Opening2D
                  key={opening.id}
                  wall={wall}
                  opening={opening}
                  isSelected={selection?.id === opening.id}
                  onClick={() => setSelection({ id: opening.id, type: 'opening' })}
                />
              );
            })}
          </Group>

          {/* Placement Previews */}
          {activeTool === 'FURNITURE' && currentMousePos && (
             (() => {
               const furnitureConfig: Record<string, Partial<Furniture>> = {
                 'cabinet_base': { type: 'CABINET_BASE', width: 600, depth: 560, height: 720 },
                 'cabinet_wall': { type: 'CABINET_WALL', width: 600, depth: 320, height: 720 },
                 'cabinet_tall': { type: 'CABINET_TALL', width: 600, depth: 560, height: 2040 },
                 'sink_unit': { type: 'SINK_UNIT', width: 800, depth: 560, height: 720 },
                 'wardrobe': { type: 'WARDROBE', width: 1000, depth: 600, height: 2100 },
               };
               const config = (selectedCatalogItem && furnitureConfig[selectedCatalogItem]) || furnitureConfig['cabinet_base'];
               
               let snappedPos = snapToGrid(currentMousePos, 50);
               let rotation = 0;
               let minSnapDist = 100;
               for (const wall of walls) {
                 const { point } = getClosestPointOnSegment(currentMousePos, wall.start, wall.end);
                 const dist = getDistance(currentMousePos, point);
                 if (dist < minSnapDist) {
                   minSnapDist = dist;
                   snappedPos = point;
                   rotation = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x) * (180 / Math.PI) + 90;
                 }
               }

               return (
                <Furniture2D
                  isSelected={false}
                  onClick={() => {}}
                  draggable={false}
                  item={{
                    id: 'preview',
                    type: config.type as any,
                    position: snappedPos,
                    rotation: rotation,
                    width: config.width || 600,
                    depth: config.depth || 600,
                    height: config.height || 900,
                    color: '#ffffff'
                  }}
                />
               );
             })()
          )}

          {(activeTool === 'WINDOW' || activeTool === 'DOOR') && currentMousePos && (
             (() => {
               let closestWall = null;
               let minDistance = 50;
               let bestPoint = null;
               for (const wall of walls) {
                 const { point } = getClosestPointOnSegment(currentMousePos, wall.start, wall.end);
                 const dist = getDistance(currentMousePos, point);
                 if (dist < minDistance) {
                   minDistance = dist;
                   closestWall = wall;
                   bestPoint = point;
                 }
               }
               if (closestWall && bestPoint) {
                 const type = activeTool === 'WINDOW' ? 'WINDOW' : 'DOOR';
                 return (
                   <Opening2D
                     wall={closestWall}
                     opening={{
                       id: 'preview',
                       wallId: closestWall.id,
                       type,
                       offset: getClosestPointOnSegment(currentMousePos, closestWall.start, closestWall.end).offset,
                       width: type === 'WINDOW' ? 1200 : 900,
                       height: type === 'WINDOW' ? 1200 : 2100,
                       bottomHeight: type === 'WINDOW' ? 900 : 0
                     }}
                   />
                 );
               }
               return null;
             })()
          )}

          {draftStart && currentMousePos && (
            <Line
              points={[draftStart.x, draftStart.y, currentMousePos.x, currentMousePos.y]}
              stroke="#94a3b8"
              strokeWidth={DEFAULT_WALL_THICKNESS}
              opacity={0.5}
              dash={[10, 10]}
            />
          )}
        </Layer>
      </Stage>
      
      <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur px-3 py-2 rounded-md text-xs text-slate-500 border border-slate-200">
        ESC to cancel • Scroll to zoom • Drag to pan (Select) • Space to rotate furniture (TBD)
      </div>
    </div>
  );
};
