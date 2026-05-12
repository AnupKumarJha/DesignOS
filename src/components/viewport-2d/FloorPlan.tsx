import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Stage, Layer, Group, Line, Text, Circle } from 'react-konva';
import { useStore, Wall, Point, Furniture } from '../../store/useStore';
import { Grid } from './Grid';
import { Wall2D } from './Wall2D';
import { Furniture2D } from './Furniture2D';
import { Opening2D } from './Opening2D';
import { BackgroundPlanLayer } from './BackgroundPlanLayer';
import { FloorPlanImportPanel } from '../ui/FloorPlanImportPanel';
import { snapToGrid, snapToAngle, findClosestPoint, getClosestPointOnSegment, getDistance } from '../../lib/math';
import { DEFAULT_WALL_HEIGHT, DEFAULT_WALL_THICKNESS } from '../../lib/constants';
import { getCatalogItem, getMaterial, getVariant } from '../../data/catalog';

export const FloorPlan: React.FC = () => {
  const {
    walls: allWalls,
    openings: allOpenings,
    furniture: allFurniture,
    rooms,
    currentRoomId,
    updateRoomBackground,
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
    removeOpening,
    customCatalogItems,
  } = useStore();
  const currentRoom = rooms.find((r) => r.id === currentRoomId);
  const backgroundPlan = currentRoom?.backgroundPlan ?? null;
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [referencePlanOpen, setReferencePlanOpen] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState<Point[]>([]);

  // Filter to current room — other rooms exist in the snapshot but are not
  // visible in this viewport. New entities are auto-tagged with currentRoomId.
  const walls = allWalls.filter((w) => w.roomId === currentRoomId);
  const openings = allOpenings.filter((o) => o.roomId === currentRoomId);
  const furniture = allFurniture.filter((f) => f.roomId === currentRoomId);
  const mergedFurnitureCatalog = useMemo(
    () => [
      ...customCatalogItems.filter((item) => (item.importStatus ?? 'published') === 'published'),
    ],
    [customCatalogItems],
  );
  
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [scale, setScale] = useState(0.2);
  const [offset, setOffset] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [draftStart, setDraftStart] = useState<Point | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState<Point | null>(null);
  const [snapTarget, setSnapTarget] = useState<{ point: Point; isEndpoint: boolean } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<any>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const resizeObserver = new ResizeObserver(([entry]) => {
      setDimensions({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const openReferencePlan = () => setReferencePlanOpen(true);
    window.addEventListener('design-os:open-reference-plan', openReferencePlan);
    return () => window.removeEventListener('design-os:open-reference-plan', openReferencePlan);
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

  useEffect(() => {
    const fitBounds = (points: Point[]) => {
      if (points.length === 0 || !containerRef.current) return;
      const minX = Math.min(...points.map((p) => p.x));
      const maxX = Math.max(...points.map((p) => p.x));
      const minY = Math.min(...points.map((p) => p.y));
      const maxY = Math.max(...points.map((p) => p.y));
      const width = Math.max(maxX - minX, 1000);
      const height = Math.max(maxY - minY, 1000);
      const nextScale = Math.min(dimensions.width / (width + 800), dimensions.height / (height + 800), 0.9);
      setScale(Math.max(0.08, nextScale));
      setOffset({
        x: dimensions.width / 2 - ((minX + maxX) / 2) * Math.max(0.08, nextScale),
        y: dimensions.height / 2 - ((minY + maxY) / 2) * Math.max(0.08, nextScale),
      });
    };

    const allPoints = () => [
      ...walls.flatMap((w) => [w.start, w.end]),
      ...furniture.flatMap((f) => [
        { x: f.position.x - f.width / 2, y: f.position.y - f.depth / 2 },
        { x: f.position.x + f.width / 2, y: f.position.y + f.depth / 2 },
      ]),
    ];

    const onFitAll = () => fitBounds(allPoints());
    const onFitSelection = () => {
      if (!selection) return onFitAll();
      if (selection.type === 'wall') {
        const wall = walls.find((w) => w.id === selection.id);
        if (wall) fitBounds([wall.start, wall.end]);
      } else if (selection.type === 'furniture') {
        const item = furniture.find((f) => f.id === selection.id);
        if (item) {
          fitBounds([
            { x: item.position.x - item.width / 2, y: item.position.y - item.depth / 2 },
            { x: item.position.x + item.width / 2, y: item.position.y + item.depth / 2 },
          ]);
        }
      } else {
        onFitAll();
      }
    };

    window.addEventListener('design-os:fit-all', onFitAll);
    window.addEventListener('design-os:fit-selection', onFitSelection);
    return () => {
      window.removeEventListener('design-os:fit-all', onFitAll);
      window.removeEventListener('design-os:fit-selection', onFitSelection);
    };
  }, [dimensions.height, dimensions.width, furniture, selection, walls]);

  const getFurnitureDraft = (position: Point): Furniture => {
    const catalogItem =
      getCatalogItem(selectedCatalogItem) ||
      mergedFurnitureCatalog.find((item) => item.id === selectedCatalogItem) ||
      getCatalogItem('cabinet_base')!;
    const variant =
      getVariant(catalogItem.id, catalogItem.defaultVariantId) ||
      catalogItem.variants.find((entry) => entry.id === catalogItem.defaultVariantId) ||
      catalogItem.variants[0];
    let snappedPos = snapToGrid(position, 50);
    let rotation = 0;
    
    let minSnapDist = 100;
    for (const wall of walls) {
      const { point } = getClosestPointOnSegment(position, wall.start, wall.end);
      const dist = getDistance(position, point);
      
      if (dist < minSnapDist) {
        minSnapDist = dist;
        snappedPos = point;
        rotation = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x) * (180 / Math.PI) + 90;
      }
    }

    return {
      id: crypto.randomUUID(),
      roomId: currentRoomId,
      type: catalogItem.type,
      position: snappedPos,
      rotation,
      width: variant.width,
      depth: variant.depth,
      height: variant.height,
      color: '#ffffff',
      catalogItemId: catalogItem.id,
      variantId: variant.id,
      shutterCount: variant.shutterCount,
      drawerCount: variant.drawerCount,
      hasHandle: catalogItem.hasHandle,
      skirtingHeight: catalogItem.skirtingHeight,
      catalogName: catalogItem.name,
      catalogBrand: catalogItem.brand,
      catalogSku: catalogItem.sku,
      catalogVariantLabel: variant.label,
      modelAssetId: catalogItem.modelAssetId,
      thumbnailAssetId: catalogItem.thumbnailAssetId,
      assetFormat: catalogItem.assetFormat,
      sourceUrl: catalogItem.sourceUrl,
      licenseNote: catalogItem.licenseNote,
    };
  };

  const roomPolygon = (() => {
    if (walls.length < 3) return null;
    const points = walls.map((wall) => wall.start);
    const closes = getDistance(walls[0].start, walls[walls.length - 1].end) < 30;
    if (!closes) return null;
    const area = Math.abs(points.reduce((sum, point, index) => {
      const next = points[(index + 1) % points.length];
      return sum + point.x * next.y - next.x * point.y;
    }, 0)) / 2;
    const center = points.reduce((acc, point) => ({ x: acc.x + point.x / points.length, y: acc.y + point.y / points.length }), { x: 0, y: 0 });
    return { center, areaSqM: area / 1_000_000 };
  })();

  const getRelativePointerPosition = (stage: any) => {
    const pointer = stage.getPointerPosition();
    return {
      x: (pointer.x - offset.x) / scale,
      y: (pointer.y - offset.y) / scale,
    };
  };

  const getSnappedWallPoint = (point: Point) => {
    const allPoints = walls.flatMap(w => [w.start, w.end]);
    return findClosestPoint(point, allPoints) || snapToGrid(point);
  };

  // Same as above but also reports whether we snapped to an existing endpoint.
  // Used to render a visual snap indicator while the user is drawing.
  const getSnapInfo = (point: Point): { point: Point; isEndpoint: boolean } => {
    const allPoints = walls.flatMap((w) => [w.start, w.end]);
    const endpoint = findClosestPoint(point, allPoints);
    if (endpoint) return { point: endpoint, isEndpoint: true };
    return { point: snapToGrid(point), isEndpoint: false };
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

    // Calibration mode intercepts clicks: capture up to 2 points, then wait
    // for distance entry from the panel.
    if (calibrationMode && backgroundPlan) {
      if (calibrationPoints.length < 2) {
        setCalibrationPoints([...calibrationPoints, pos]);
      }
      return;
    }

    // De-selection
    if (e.target === stage) {
      setSelection(null);
    }

    if (activeTool === 'WALL') {
      const snapped = getSnappedWallPoint(pos);
      setDraftStart(snapped);
      setCurrentMousePos(snapped);
      return;
    } else if (activeTool === 'FURNITURE') {
      const stage = e.target.getStage();
      const pos = getRelativePointerPosition(stage);
      const newFurniture = getFurnitureDraft(pos);
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
          roomId: currentRoomId,
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

  const handleMouseUp = (e: any) => {
    if (activeTool !== 'WALL' || !draftStart) return;

    const stage = e.target.getStage();
    const pos = getRelativePointerPosition(stage);
    const snapped = getSnappedWallPoint(pos);
    const wallEnd = snapToAngle(draftStart, snapped);

    if (getDistance(draftStart, wallEnd) < 50) {
      setDraftStart(null);
      setCurrentMousePos(null);
      return;
    }

    const newWall: Wall = {
      id: crypto.randomUUID(),
      roomId: currentRoomId,
      start: draftStart,
      end: wallEnd,
      thickness: DEFAULT_WALL_THICKNESS,
      height: DEFAULT_WALL_HEIGHT,
    };

    addWall(newWall);
    setSelection({ id: newWall.id, type: 'wall' });
    setDraftStart(null);
    setCurrentMousePos(null);
    setSnapTarget(null);
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const pos = getRelativePointerPosition(stage);

    if (activeTool === 'WALL') {
      const info = getSnapInfo(pos);
      setSnapTarget(info);
    } else {
      setSnapTarget(null);
    }

    if (draftStart) {
      const snapped = snapToAngle(draftStart, getSnappedWallPoint(pos));
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

  const startCalibration = () => {
    setReferencePlanOpen(true);
    setCalibrationMode(true);
    setCalibrationPoints([]);
  };

  const cancelCalibration = () => {
    setCalibrationMode(false);
    setCalibrationPoints([]);
  };

  const commitCalibration = (mm: number) => {
    if (!backgroundPlan || calibrationPoints.length !== 2 || mm <= 0) return;
    const [p1, p2] = calibrationPoints;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const currentDist = Math.sqrt(dx * dx + dy * dy);
    if (currentDist === 0) return;
    const factor = mm / currentDist;
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    updateRoomBackground(currentRoomId, {
      ...backgroundPlan,
      mmPerPixel: backgroundPlan.mmPerPixel * factor,
      originX: midX + (backgroundPlan.originX - midX) * factor,
      originY: midY + (backgroundPlan.originY - midY) * factor,
    });
    setCalibrationMode(false);
    setCalibrationPoints([]);
  };

  const handleWallClick = (wall: Wall) => {
    if (activeTool === 'APPLY_FINISH' && activeFinish) {
      const material = getMaterial(activeFinish);
      updateWall(wall.id, { color: material?.color, materialId: material?.id });
    } else {
      setSelection({ id: wall.id, type: 'wall' });
    }
  };

  const handleFurnitureClick = (item: Furniture) => {
    if (activeTool === 'APPLY_FINISH' && activeFinish) {
      const material = getMaterial(activeFinish);
      updateFurniture(item.id, { color: material?.color, materialId: material?.id });
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
    <div ref={containerRef} className="w-full h-full bg-white overflow-hidden">
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
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        onContextMenu={(e) => e.evt.preventDefault()}
        ref={stageRef}
      >
        <Layer>
          <Grid width={dimensions.width} height={dimensions.height} scale={scale} offset={offset} />

          {/* Reference floor plan (architect import) — beneath walls so designers can trace it */}
          <BackgroundPlanLayer plan={backgroundPlan} calibrationPoints={calibrationMode ? calibrationPoints : undefined} />

          <Group>
            {walls.map((wall) => (
              <Wall2D
                key={wall.id}
                wall={wall}
                isSelected={selection?.id === wall.id}
                onClick={() => handleWallClick(wall)}
                onEndpointDrag={(endpoint, point) => updateWall(wall.id, { [endpoint]: snapToGrid(point, 50) })}
              />
            ))}
          </Group>

          {roomPolygon && (
            <Group x={roomPolygon.center.x} y={roomPolygon.center.y}>
              <Circle radius={42} fill="white" opacity={0.85} stroke="#cbd5e1" />
              <Text
                text={`${roomPolygon.areaSqM.toFixed(2)} sqm`}
                fontSize={12}
                fontStyle="bold"
                fill="#334155"
                width={84}
                align="center"
                offsetX={42}
                offsetY={7}
              />
            </Group>
          )}

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
                  draggable={selection?.id === opening.id}
                  onDragOffset={(offset) => updateOpening(opening.id, { offset })}
                />
              );
            })}
          </Group>

          {/* Placement Previews */}
          {activeTool === 'FURNITURE' && currentMousePos && (
             (() => {
               const preview = getFurnitureDraft(currentMousePos);

               return (
                <Furniture2D
                  isSelected={false}
                  onClick={() => {}}
                  draggable={false}
                  item={{ ...preview, id: 'preview' }}
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
                       roomId: currentRoomId,
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
            <>
              <Line
                points={[draftStart.x, draftStart.y, currentMousePos.x, currentMousePos.y]}
                stroke="#94a3b8"
                strokeWidth={DEFAULT_WALL_THICKNESS}
                opacity={0.5}
                dash={[10, 10]}
              />
              <Text
                x={(draftStart.x + currentMousePos.x) / 2}
                y={(draftStart.y + currentMousePos.y) / 2 - 80}
                text={`${Math.round(getDistance(draftStart, currentMousePos))} mm`}
                fontSize={120}
                fontStyle="bold"
                fill="#1e293b"
                offsetX={140}
              />
            </>
          )}

          {/* Snap indicator: cyan ring when about to snap to an existing endpoint */}
          {activeTool === 'WALL' && snapTarget && snapTarget.isEndpoint && (
            <Group x={snapTarget.point.x} y={snapTarget.point.y}>
              <Circle radius={120} stroke="#06b6d4" strokeWidth={8} opacity={0.9} />
              <Circle radius={40} fill="#06b6d4" opacity={0.85} />
            </Group>
          )}
        </Layer>
      </Stage>
      
      <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur px-3 py-2 rounded-md text-xs text-slate-500 border border-slate-200">
        Wall tool: click-drag-release to sketch • <span className="text-cyan-600 font-bold">Cyan ring</span> = will snap to existing endpoint • ESC to cancel • Scroll to zoom • Drag to pan
      </div>

      <FloorPlanImportPanel
        open={referencePlanOpen}
        onClose={() => setReferencePlanOpen(false)}
        calibrationMode={calibrationMode}
        calibrationPointsCount={calibrationPoints.length}
        onStartCalibration={startCalibration}
        onCancelCalibration={cancelCalibration}
        onCommitCalibration={commitCalibration}
      />
    </div>
  );
};
