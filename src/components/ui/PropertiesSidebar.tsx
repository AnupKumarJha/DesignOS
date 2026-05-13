import React from 'react';
import { HingeType, useStore, Wall, Furniture, UnitSystem, FurnitureLayoutPreset, FurniturePart } from '../../store/useStore';
import { X, Settings2, Trash2, ChevronDown, Layers, Ruler, Palette, Sparkles, ChevronRight, Move, RotateCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { furnitureCatalog, getCatalogItem, getMaterial, materialCatalog } from '../../data/catalog';
import { getDistance } from '../../lib/math';
import { getPatternStyle } from '../../lib/materialPattern';
import { fromDisplayLength, toDisplayLength, unitLabel } from '../../lib/units';
import { FURNITURE_LAYOUT_PRESETS, generateFurnitureParts, partTypeLabel } from '../../lib/furnitureParts';

const HINGE_TYPES: HingeType[] = ['Auto', 'Concealed 110', 'Soft Close', 'Blum Clip Top', 'Piano', 'Lift Up'];
const FINISH_GROUPS = ['Laminate', 'Veneer', 'Solid Paints', 'Stone', 'Metal', 'Glass'];
const BOARD_FINISH_GROUPS = ['Laminate', 'Veneer', 'Solid Paints'];
const HARDWARE_GROUPS = ['Metal', 'Hardware'];

export const PropertiesSidebar: React.FC = () => {
  const {
    selection,
    walls,
    furniture,
    openings,
    updateWall,
    updateFurniture,
    updateOpening,
    setSelection,
    setMaterialDrawerOpen,
    setMaterialDrawerCategory,
    deleteSelection,
    settings,
  } = useStore();

  if (!selection) return null;

  const isWall = selection.type === 'wall';
  const isFurniture = selection.type === 'furniture';
  const isOpening = selection.type === 'opening';

  const item = isWall 
    ? walls.find(w => w.id === selection.id) 
    : isFurniture 
      ? furniture.find(f => f.id === selection.id)
      : openings.find(o => o.id === selection.id);

  if (!item) return null;

  const wallLength = isWall ? getDistance((item as Wall).start, (item as Wall).end) : 0;
  const currentMaterialId =
    (isWall || isFurniture) ? (item as Wall | Furniture).materialId : undefined;
  const currentMaterial = getMaterial(currentMaterialId);
  const selectedTypeLabel = isWall ? 'Wall' : isFurniture ? 'Furniture' : (item as any).type;
  const furnitureParts = isFurniture ? generateFurnitureParts(item as Furniture) : [];
  const selectedFurniturePart = isFurniture
    ? furnitureParts.find((part) => part.id === (item as Furniture).selectedPartId) ?? furnitureParts[0]
    : undefined;

  const deleteSelectedItem = () => {
    deleteSelection();
  };

  const updateSelectedPart = (updates: Partial<FurniturePart>) => {
    if (!isFurniture || !selectedFurniturePart) return;
    const furnitureItem = item as Furniture;
    const nextParts = furnitureParts.map((part) =>
      part.id === selectedFurniturePart.id ? { ...part, ...updates } : part,
    );
    updateFurniture(furnitureItem.id, {
      parts: nextParts,
      selectedPartId: selectedFurniturePart.id,
    });
  };

  const updatePartsByType = (predicate: (part: FurniturePart) => boolean, updates: Partial<FurniturePart>) => {
    if (!isFurniture) return;
    const nextParts = furnitureParts.map((part) => (predicate(part) ? { ...part, ...updates } : part));
    updateFurniture((item as Furniture).id, { parts: nextParts });
  };

  const resetSelectedPartOverrides = () => {
    if (!isFurniture || !selectedFurniturePart) return;
    const furnitureItem = item as Furniture;
    const freshPart = generateFurnitureParts({ ...furnitureItem, parts: [] }).find((part) => part.id === selectedFurniturePart.id);
    updateSelectedPart({
      materialId: undefined,
      color: undefined,
      visible: freshPart?.visible ?? true,
      thickness: freshPart?.thickness ?? selectedFurniturePart.thickness,
      position: freshPart?.position ?? selectedFurniturePart.position,
      localPosition: freshPart?.localPosition,
      size: freshPart?.size ?? selectedFurniturePart.size,
      handleType: freshPart?.handleType,
    });
  };

  // Parent wall lookup for openings (door/window) — needed for offset-in-mm
  const parentWall =
    isOpening ? walls.find((w) => w.id === (item as any).wallId) : undefined;
  const parentWallLength = parentWall
    ? getDistance(parentWall.start, parentWall.end)
    : 0;

  return (
    <div className="w-[320px] h-full bg-white border-l border-slate-200 flex flex-col z-40 transition-all shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 h-12 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "p-1.5 rounded-lg text-white shadow-sm",
            isWall ? "bg-blue-600" : isFurniture ? "bg-teal-600" : "bg-purple-600"
          )}>
            <Settings2 size={16} />
          </div>
          <div>
            <h2 className="text-[12px] font-bold text-slate-800 tracking-tight leading-none">
              {isWall ? 'Wall Section' : isFurniture ? 'Furniture Item' : (item as any).type}
            </h2>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold italic">Properties</p>
          </div>
        </div>
        <button 
          onClick={() => setSelection(null)}
          className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 transition-all"
          title="Close properties"
          aria-label="Close properties"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-5 py-3 bg-white border-b border-slate-200 shrink-0">
        <button
          onClick={deleteSelectedItem}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 text-red-600 rounded-xl text-[11px] font-black hover:bg-red-100 transition-all border border-red-100"
        >
          <Trash2 size={15} />
          <span>DELETE {String(selectedTypeLabel).toUpperCase()}</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-0 bg-slate-50/50">
        
        {/* Accordion: Dimensions */}
        <Section title="Dimensions & Construction" icon={Ruler}>
          {isWall && (
            <div className="space-y-1.5 mb-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Length ({unitLabel(settings.unitSystem)})</label>
              <UnitInput
                unitSystem={settings.unitSystem}
                valueMm={wallLength}
                onChange={(v) => {
                  const wall = item as Wall;
                  const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
                  updateWall(wall.id, {
                    end: {
                      x: wall.start.x + Math.cos(angle) * v,
                      y: wall.start.y + Math.sin(angle) * v,
                    }
                  });
                }}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Height ({unitLabel(settings.unitSystem)})</label>
              <UnitInput
                unitSystem={settings.unitSystem}
                valueMm={item.height}
                onChange={(v) => {
                  if (isWall) updateWall(item.id, { height: v });
                  else if (isFurniture) updateFurniture(item.id, { height: v });
                  else if (isOpening) updateOpening(item.id, { height: v });
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {isWall ? `Thickness (${unitLabel(settings.unitSystem)})` : isFurniture ? 'Rotation (°)' : `Width (${unitLabel(settings.unitSystem)})`}
              </label>
              {isFurniture ? (
                <Input
                  type="number"
                  value={(item as any).rotation}
                  onChange={(v) => updateFurniture(item.id, { rotation: v })}
                />
              ) : (
              <UnitInput
                unitSystem={settings.unitSystem}
                valueMm={isWall ? (item as any).thickness : (item as any).width}
                onChange={(v) => {
                  if (isWall) updateWall(item.id, { thickness: v });
                  else if (isOpening) updateOpening(item.id, { width: v });
                }}
              />
              )}
            </div>
          </div>
          
          {isFurniture && (
            <>
             <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Depth ({unitLabel(settings.unitSystem)})</label>
                  <UnitInput
                    unitSystem={settings.unitSystem}
                    valueMm={(item as any).depth}
                    onChange={(v) => updateFurniture(item.id, { depth: v })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Shutters</label>
                  <Input 
                    type="number" 
                    value={(item as any).shutterCount || 0}
                    onChange={(v) => updateFurniture(item.id, { shutterCount: v })}
                  />
                </div>
             </div>
             {(item as Furniture).catalogItemId && (
              <div className="space-y-1.5 mt-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Catalog Variant</label>
                <select
                  value={(item as Furniture).variantId || ''}
                  onChange={(event) => {
                    const catalogItem = getCatalogItem((item as Furniture).catalogItemId);
                    const variant = catalogItem?.variants.find((option) => option.id === event.target.value);
                    if (variant) {
                      updateFurniture(item.id, {
                        variantId: variant.id,
                        width: variant.width,
                        depth: variant.depth,
                        height: variant.height,
                        shutterCount: variant.shutterCount,
                        drawerCount: variant.drawerCount,
                        isCustomSize: false,
                      });
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                >
                  {furnitureCatalog
                    .find((catalogItem) => catalogItem.id === (item as Furniture).catalogItemId)
                    ?.variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>{variant.label}</option>
                    ))}
                </select>
              </div>
             )}
             {(item as Furniture).isCustomSize && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-bold text-amber-800">
                Custom size from canvas resize. Pick a catalog variant to reset to standard sizing.
              </div>
             )}
            </>
          )}

          {isOpening && (
            <label className="flex items-center justify-between mt-4 text-[11px] text-slate-600 font-medium">
              Flip Swing
              <input
                type="checkbox"
                checked={(item as any).flip || false}
                onChange={(e) => updateOpening(item.id, { flip: e.target.checked })}
                className="accent-blue-600 h-3.5 w-3.5"
              />
            </label>
          )}
        </Section>

        {/* Accordion: Position & Placement */}
        <Section title="Position & Placement" icon={Move}>
          {isWall && (
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Start Point
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <LabeledInput
                    label={`X (${unitLabel(settings.unitSystem)})`}
                    unitSystem={settings.unitSystem}
                    valueMm={(item as Wall).start.x}
                    onChange={(v) => updateWall(item.id, { start: { ...(item as Wall).start, x: v } })}
                  />
                  <LabeledInput
                    label={`Y (${unitLabel(settings.unitSystem)})`}
                    unitSystem={settings.unitSystem}
                    valueMm={(item as Wall).start.y}
                    onChange={(v) => updateWall(item.id, { start: { ...(item as Wall).start, y: v } })}
                  />
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  End Point
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <LabeledInput
                    label={`X (${unitLabel(settings.unitSystem)})`}
                    unitSystem={settings.unitSystem}
                    valueMm={(item as Wall).end.x}
                    onChange={(v) => updateWall(item.id, { end: { ...(item as Wall).end, x: v } })}
                  />
                  <LabeledInput
                    label={`Y (${unitLabel(settings.unitSystem)})`}
                    unitSystem={settings.unitSystem}
                    valueMm={(item as Wall).end.y}
                    onChange={(v) => updateWall(item.id, { end: { ...(item as Wall).end, y: v } })}
                  />
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Translate Wall
                </div>
                <NudgePad
                  onNudge={(dx, dy) => {
                    const wall = item as Wall;
                    updateWall(wall.id, {
                      start: { x: wall.start.x + dx, y: wall.start.y + dy },
                      end: { x: wall.end.x + dx, y: wall.end.y + dy },
                    });
                  }}
                />
              </div>
            </div>
          )}

          {isOpening && (
            <div className="space-y-3">
              {parentWall && (
                <>
                  <LabeledInput
                    label={`Distance from wall start (${unitLabel(settings.unitSystem)})`}
                    unitSystem={settings.unitSystem}
                    valueMm={(item as any).offset * parentWallLength}
                    onChange={(v) =>
                      updateOpening(item.id, {
                        offset: parentWallLength
                          ? Math.max(0, Math.min(1, v / parentWallLength))
                          : 0,
                      })
                    }
                  />
                  <LabeledInput
                    label={`Bottom Height (${unitLabel(settings.unitSystem)})`}
                    unitSystem={settings.unitSystem}
                    valueMm={(item as any).bottomHeight ?? 0}
                    onChange={(v) => updateOpening(item.id, { bottomHeight: Math.max(0, v) })}
                  />
                  <div className="text-[10px] text-slate-400 font-medium">
                    Anchored to wall · {Math.round((item as any).offset * 100)}% along its length
                  </div>
                </>
              )}
              {!parentWall && (
                <div className="text-[11px] text-slate-400">
                  Parent wall not found — opening may be orphaned.
                </div>
              )}
            </div>
          )}

          {isFurniture && (
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Position
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <LabeledInput
                    label={`X (${unitLabel(settings.unitSystem)})`}
                    unitSystem={settings.unitSystem}
                    valueMm={(item as Furniture).position.x}
                    onChange={(v) =>
                      updateFurniture(item.id, {
                        position: { ...(item as Furniture).position, x: v },
                      })
                    }
                  />
                  <LabeledInput
                    label={`Y (${unitLabel(settings.unitSystem)})`}
                    unitSystem={settings.unitSystem}
                    valueMm={(item as Furniture).position.y}
                    onChange={(v) =>
                      updateFurniture(item.id, {
                        position: { ...(item as Furniture).position, y: v },
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <RotateCw size={10} />
                  Rotation
                </div>
                <div className="flex items-center gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Angle (°)</label>
                    <Input
                      value={Math.round((item as Furniture).rotation)}
                      onChange={(v) => updateFurniture(item.id, { rotation: v })}
                    />
                  </div>
                  <div className="flex gap-1">
                    {[0, 90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        onClick={() => updateFurniture(item.id, { rotation: deg })}
                        className={cn(
                          'px-2 py-1.5 rounded-md text-[10px] font-bold border',
                          Math.round((item as Furniture).rotation) === deg
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300',
                        )}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Nudge
                </div>
                <NudgePad
                  onNudge={(dx, dy) => {
                    const f = item as Furniture;
                    updateFurniture(f.id, {
                      position: { x: f.position.x + dx, y: f.position.y + dy },
                    });
                  }}
                />
              </div>
            </div>
          )}
        </Section>

        {/* Accordion: Tiling & Decoration */}
        <Section title="Decoration" icon={Layers}>
           <div className="space-y-3">
              {isWall && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-600 font-medium">Wall Skirting (mm)</span>
                    <input 
                      type="number" 
                      value={(item as any).skirtingHeight || 0} 
                      onChange={(e) => updateWall(item.id, { skirtingHeight: parseInt(e.target.value) || 0 })}
                      className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] font-bold outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-600 font-medium">Wall Cornice</span>
                    <input 
                      type="checkbox" 
                      checked={(item as any).hasCornice || false}
                      onChange={(e) => updateWall(item.id, { hasCornice: e.target.checked })}
                      className="accent-blue-600 h-3.5 w-3.5" 
                    />
                  </div>
                </>
              )}
              {isFurniture && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-600 font-medium">Unit Skirting (mm)</span>
                    <input 
                      type="number" 
                      value={(item as any).skirtingHeight || 0} 
                      onChange={(e) => updateFurniture(item.id, { skirtingHeight: parseInt(e.target.value) || 0 })}
                      className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] font-bold outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-600 font-medium">Handles</span>
                    <input 
                      type="checkbox" 
                      checked={(item as Furniture).hasHandle !== false}
                      onChange={(e) => {
                        const visible = e.target.checked;
                        updateFurniture(item.id, { hasHandle: visible });
                        updatePartsByType((part) => part.type === 'handle', { visible });
                      }}
                      className="accent-blue-600 h-3.5 w-3.5" 
                    />
                  </div>
                </>
              )}
           </div>
        </Section>

        {/* Finish & Material — preview + open drawer */}
        {!isOpening && (
          <div className="mt-2 bg-white border-y border-slate-200">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette size={14} className="text-blue-600" />
                <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  Finish Material
                </h3>
              </div>
              {currentMaterial && (
                <button
                  onClick={() => {
                    if (isWall) updateWall(item.id, { color: undefined, materialId: undefined });
                    else if (isFurniture)
                      updateFurniture(item.id, { color: undefined, materialId: undefined });
                  }}
                  className="text-[10px] font-bold text-slate-500 hover:text-blue-600 hover:underline"
                >
                  RESET
                </button>
              )}
            </div>

            <div className="p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 p-3">
                <div
                  className="w-14 h-14 rounded-xl border border-slate-200 shrink-0"
                  style={
                    currentMaterial
                      ? getPatternStyle(currentMaterial)
                      : { backgroundColor: '#f1f5f9' }
                  }
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-black text-slate-800 truncate">
                    {currentMaterial?.name ?? 'No material applied'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold truncate mt-0.5">
                    {currentMaterial
                      ? `${currentMaterial.brand ?? currentMaterial.group} · ${currentMaterial.finishType ?? '—'}`
                      : 'Pick from the material library'}
                  </div>
                  {currentMaterial && (
                    <div className="text-[10px] text-blue-600 font-black mt-0.5">
                      ₹{currentMaterial.rate}/{currentMaterial.unit}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  if (currentMaterial) setMaterialDrawerCategory(currentMaterial.group);
                  setMaterialDrawerOpen(true);
                }}
                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-[11px] font-black hover:bg-blue-700 shadow-md shadow-blue-100 transition-all"
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={13} />
                  Browse Material Library
                </span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {isWall && (
          <Section title="Wall Section" icon={Layers}>
            <div className="space-y-3 text-[11px] text-slate-600">
              <PanelRow label="Wall Profile" value="Default Profile" />
              <PanelRow label="Tiling & Cutting Tool" value="Ready" />
              <PanelRow label="Wall Texture" value={currentMaterial?.group ?? 'Wall Default'} />
              <button
                onClick={() => {
                  setMaterialDrawerCategory(currentMaterial?.group ?? 'Solid Paints');
                  setMaterialDrawerOpen(true);
                }}
                className="w-full rounded-xl bg-slate-900 text-white py-2.5 text-[11px] font-black"
              >
                Open Wall Texture Tray
              </button>
            </div>
          </Section>
        )}

        {isFurniture && (
          <Section title="Cabinet Structure" icon={Sparkles}>
            <div className="space-y-3 mb-4">
              <button
                onClick={() => {
                  const furnitureItem = item as Furniture;
                  const nextOpen = furnitureItem.openState === 'open' ? 'closed' : 'open';
                  updateFurniture(furnitureItem.id, { openState: nextOpen, openAmount: nextOpen === 'open' ? 1 : 0 });
                }}
                className="w-full rounded-xl bg-slate-900 text-white py-2.5 text-[11px] font-black hover:bg-slate-700"
              >
                {(item as Furniture).openState === 'open' ? 'Close Unit' : 'Open Unit / Inspect Internals'}
              </button>
              <label className="block space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Open Amount</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={(item as Furniture).openAmount ?? 0}
                  onChange={(event) => {
                    const amount = Number(event.target.value);
                    updateFurniture(item.id, { openAmount: amount, openState: amount > 0 ? 'open' : 'closed' });
                  }}
                  className="w-full accent-blue-600"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Exterior Finish</span>
                <select
                  value={(item as Furniture).materialId || ''}
                  onChange={(event) => updateFurniture(item.id, { materialId: event.target.value || undefined })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="">Use catalog default</option>
                  {materialCatalog
                    .filter((material) => FINISH_GROUPS.includes(material.group))
                    .map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name} · {material.group}
                      </option>
                  ))}
                </select>
              </label>
              <ColorInput
                label="Exterior Color"
                value={(item as Furniture).exteriorColor || getMaterial((item as Furniture).materialId)?.color || (item as Furniture).color || '#cbd5e1'}
                onChange={(value) => updateFurniture(item.id, { exteriorColor: value })}
                onReset={() => updateFurniture(item.id, { exteriorColor: undefined })}
              />
              <label className="block space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interior Finish</span>
                <select
                  value={(item as Furniture).internalMaterialId || 'laminate_ash_grey'}
                  onChange={(event) => updateFurniture(item.id, { internalMaterialId: event.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                >
                  {materialCatalog
                    .filter((material) => BOARD_FINISH_GROUPS.includes(material.group))
                    .map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name} · {material.group}
                      </option>
                  ))}
                </select>
              </label>
              <ColorInput
                label="Interior Color"
                value={(item as Furniture).interiorColor || getMaterial((item as Furniture).internalMaterialId || 'laminate_ash_grey')?.color || '#e2e8f0'}
                onChange={(value) => updateFurniture(item.id, { interiorColor: value })}
                onReset={() => updateFurniture(item.id, { interiorColor: undefined })}
              />
              <label className="block space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hardware Finish</span>
                <select
                  value={(item as Furniture).hardwareMaterialId || ''}
                  onChange={(event) => updateFurniture(item.id, { hardwareMaterialId: event.target.value || undefined })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="">Default brushed metal</option>
                  {materialCatalog
                    .filter((material) => HARDWARE_GROUPS.includes(material.group))
                    .map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name} · {material.group}
                      </option>
                  ))}
                </select>
              </label>
              <ColorInput
                label="Hardware Color"
                value={(item as Furniture).hardwareColor || getMaterial((item as Furniture).hardwareMaterialId)?.color || '#d4af7a'}
                onChange={(value) => updateFurniture(item.id, { hardwareColor: value })}
                onReset={() => updateFurniture(item.id, { hardwareColor: undefined })}
              />
              <label className="block space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Internal Layout</span>
                <select
                  value={(item as Furniture).internalLayoutPreset || 'auto'}
                  onChange={(event) => updateFurniture(item.id, { internalLayoutPreset: event.target.value as FurnitureLayoutPreset })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                >
                  {FURNITURE_LAYOUT_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>{preset.label}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shelves</span>
                  <Input value={(item as Furniture).shelfCount ?? 0} onChange={(v) => updateFurniture(item.id, { shelfCount: Math.max(0, v) })} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Partitions</span>
                  <Input value={(item as Furniture).partitionCount ?? 0} onChange={(v) => updateFurniture(item.id, { partitionCount: Math.max(0, v) })} />
                </label>
              </div>
              <label className="block space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Handle Position</span>
                <select
                  defaultValue="default"
                  onChange={(event) => {
                    const position = event.target.value as HandlePositionPreset;
                    const partById = new Map(furnitureParts.map((part) => [part.id, part]));
                    const nextParts = furnitureParts.map((part) =>
                      part.type === 'handle' ? { ...part, localPosition: getHandleLocalPosition(part, partById.get(part.parentPartId || ''), position) } : part,
                    );
                    updateFurniture((item as Furniture).id, { parts: nextParts });
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="default">Default reveal side</option>
                  <option value="center">Centered</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left side</option>
                  <option value="right">Right side</option>
                </select>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ['Rod', 'hasHangingRod'],
                  ['Basket', 'hasBasket'],
                  ['Pullout', 'hasPullout'],
                ].map(([label, key]) => (
                  <label key={key} className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-2 text-[10px] font-black text-slate-600">
                    <input
                      type="checkbox"
                      checked={Boolean((item as any)[key])}
                      onChange={(event) => updateFurniture(item.id, { [key]: event.target.checked } as Partial<Furniture>)}
                      className="accent-blue-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Handle Type</span>
                  <select
                    value={furnitureParts.find((part) => part.type === 'handle')?.handleType || 'bar'}
                    onChange={(event) => updatePartsByType((part) => part.type === 'handle', { handleType: event.target.value as FurniturePart['handleType'] })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                  >
                    <option value="bar">Bar</option>
                    <option value="knob">Knob</option>
                    <option value="edge_pull">Edge Pull</option>
                    <option value="none">None</option>
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Handle Visibility</span>
                  <select
                    value={(item as Furniture).hasHandle === false ? 'hidden' : 'visible'}
                    onChange={(event) => {
                      const visible = event.target.value === 'visible';
                      updateFurniture(item.id, { hasHandle: visible });
                      updatePartsByType((part) => part.type === 'handle', { visible });
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                  >
                    <option value="visible">Visible</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Generated Parts</span>
                <span className="text-[10px] font-black text-blue-600">{furnitureParts.length}</span>
              </div>
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                {furnitureParts.map((part) => (
                  <button
                    key={part.id}
                    onClick={() => updateFurniture(item.id, { selectedPartId: part.id })}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-slate-50',
                      (item as Furniture).selectedPartId === part.id && 'bg-blue-50',
                    )}
                  >
                    <span className="text-[11px] font-bold text-slate-700 truncate">{part.name}</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{partTypeLabel(part.type)}</span>
                  </button>
                ))}
              </div>
            </div>
            {selectedFurniturePart && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-black text-slate-800">{selectedFurniturePart.name}</div>
                    <div className="text-[10px] font-bold text-slate-400">{partTypeLabel(selectedFurniturePart.type)}</div>
                  </div>
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500">
                    <input
                      type="checkbox"
                      checked={selectedFurniturePart.visible}
                      onChange={(event) => updateSelectedPart({ visible: event.target.checked })}
                      className="accent-blue-600"
                    />
                    Visible
                  </label>
                </div>
                <label className="block space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Part Material</span>
                  <select
                    value={selectedFurniturePart.materialId || ''}
                    onChange={(event) => updateSelectedPart({ materialId: event.target.value || undefined })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                  >
                    <option value="">Use role default</option>
                    {materialCatalog
                      .filter((material) => FINISH_GROUPS.includes(material.group))
                      .map((material) => (
                        <option key={material.id} value={material.id}>
                          {material.name} · {material.group}
                        </option>
                      ))}
                  </select>
                </label>
                <ColorInput
                  label="Selected Part Color"
                  value={selectedFurniturePart.color || getPartFallbackColor(item as Furniture, selectedFurniturePart)}
                  onChange={(value) => updateSelectedPart({ color: value })}
                  onReset={() => updateSelectedPart({ color: undefined })}
                />
                <div className="grid grid-cols-3 gap-2">
                  <LabeledInput label="W" unitSystem="mm" valueMm={selectedFurniturePart.size.width} onChange={(v) => updateSelectedPart({ size: { ...selectedFurniturePart.size, width: v } })} />
                  <LabeledInput label="H" unitSystem="mm" valueMm={selectedFurniturePart.size.height} onChange={(v) => updateSelectedPart({ size: { ...selectedFurniturePart.size, height: v } })} />
                  <LabeledInput label="D" unitSystem="mm" valueMm={selectedFurniturePart.size.depth} onChange={(v) => updateSelectedPart({ size: { ...selectedFurniturePart.size, depth: v } })} />
                </div>
                <LabeledInput label="Thickness (mm)" unitSystem="mm" valueMm={selectedFurniturePart.thickness} onChange={(v) => updateSelectedPart({ thickness: v })} />
                <button
                  onClick={resetSelectedPartOverrides}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600 hover:bg-white hover:text-blue-600"
                >
                  Reset Part Overrides
                </button>
              </div>
            )}
            <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
              {[
                ['Carcass', `${(item as Furniture).width}W × ${(item as Furniture).depth}D`],
                ['Shutters / Drawers', `${(item as Furniture).shutterCount ?? 0} shutters · ${(item as Furniture).drawerCount ?? 0} drawers`],
                ['Open State', (item as Furniture).openState === 'open' ? 'Open for inspection' : 'Closed'],
                ['Production Data', `${furnitureParts.length} generated parts ready`],
              ].map(([label, value]) => (
                <div key={label} className="w-full flex items-center justify-between px-3 py-2.5 text-left">
                  <span className="text-[11px] font-bold text-slate-700">{label}</span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[130px]">{value}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {isFurniture && (
          <Section title="Hinges & Hardware" icon={Settings2}>
            <div className="space-y-3">
              <label className="block space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hinge Type</span>
                <select
                  value={(item as Furniture).hingeType || 'Auto'}
                  onChange={(event) => updateFurniture(item.id, { hingeType: event.target.value as HingeType })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                >
                  {HINGE_TYPES.map((hinge) => <option key={hinge} value={hinge}>{hinge}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Side</span>
                  <select
                    value={(item as Furniture).hingeSide || 'auto'}
                    onChange={(event) => updateFurniture(item.id, { hingeSide: event.target.value as Furniture['hingeSide'] })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                  >
                    <option value="auto">Auto</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Count</span>
                  <Input value={(item as Furniture).hingeCount ?? 2} onChange={(v) => updateFurniture(item.id, { hingeCount: Math.max(1, v) })} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <LabeledInput label="Top Offset (mm)" unitSystem="mm" valueMm={(item as Furniture).hingeOffsetTop ?? 110} onChange={(v) => updateFurniture(item.id, { hingeOffsetTop: v })} />
                <LabeledInput label="Bottom Offset (mm)" unitSystem="mm" valueMm={(item as Furniture).hingeOffsetBottom ?? 110} onChange={(v) => updateFurniture(item.id, { hingeOffsetBottom: v })} />
                <LabeledInput label="Bore Distance (mm)" unitSystem="mm" valueMm={(item as Furniture).hingeBoreDistance ?? 22} onChange={(v) => updateFurniture(item.id, { hingeBoreDistance: v })} />
                <label className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Open Angle (°)</span>
                  <Input value={(item as Furniture).openAngle ?? 100} onChange={(v) => updateFurniture(item.id, { openAngle: Math.max(30, Math.min(170, v)) })} />
                </label>
              </div>
            </div>
          </Section>
        )}

        {/* Danger Zone */}
        <div className="p-6">
          <button
            onClick={deleteSelectedItem}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all border border-red-100"
          >
            <Trash2 size={16} />
            <span>DELETE {String(selectedTypeLabel).toUpperCase()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode; icon: any }> = ({ title, children, icon: Icon }) => (
  <div className="mt-2 bg-white border-y border-slate-200">
    <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
       <div className="flex items-center gap-2">
         <Icon size={14} className="text-slate-400" />
         <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">{title}</h3>
       </div>
       <ChevronDown size={14} className="text-slate-400" />
    </div>
    <div className="p-5">
      {children}
    </div>
  </div>
);

const Input: React.FC<{ value: number; onChange: (v: number) => void; type?: string }> = ({ value, onChange, type = "number" }) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(parseInt(e.target.value) || 0)}
    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all shadow-inner"
  />
);

const UnitInput: React.FC<{ valueMm: number; unitSystem: UnitSystem; onChange: (v: number) => void }> = ({
  valueMm,
  unitSystem,
  onChange,
}) => (
  <input
    type="number"
    value={Number(toDisplayLength(valueMm, unitSystem).toFixed(unitSystem === 'mm' ? 0 : 2))}
    onChange={(e) => onChange(fromDisplayLength(parseFloat(e.target.value) || 0, unitSystem))}
    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all shadow-inner"
  />
);

const LabeledInput: React.FC<{
  label: string;
  valueMm: number;
  unitSystem: UnitSystem;
  onChange: (v: number) => void;
}> = ({
  label,
  valueMm,
  unitSystem,
  onChange,
}) => (
  <div className="space-y-1">
    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
      {label}
    </label>
    <UnitInput valueMm={valueMm} unitSystem={unitSystem} onChange={onChange} />
  </div>
);

const ColorInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  onReset?: () => void;
}> = ({ label, value, onChange, onReset }) => (
  <label className="block space-y-1.5">
    <span className="flex items-center justify-between">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="text-[9px] font-black uppercase tracking-wider text-slate-400 hover:text-blue-600"
        >
          Reset
        </button>
      )}
    </span>
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={normaliseColor(value)}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
      />
      <input
        value={value || '#ffffff'}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
      />
    </div>
  </label>
);

const PanelRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
    <span className="font-bold text-slate-600">{label}</span>
    <span className="text-slate-400 font-semibold truncate max-w-[130px]">{value}</span>
  </div>
);

const NudgePad: React.FC<{ onNudge: (dx: number, dy: number) => void }> = ({ onNudge }) => {
  const [step, setStep] = React.useState(10);
  const btn =
    'flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-[11px] font-bold transition-all';
  return (
    <div className="flex items-center gap-3">
      <div className="grid grid-cols-3 gap-1.5 w-fit">
        <span />
        <button onClick={() => onNudge(0, -step)} className={btn} title={`Up ${step}mm`}>↑</button>
        <span />
        <button onClick={() => onNudge(-step, 0)} className={btn} title={`Left ${step}mm`}>←</button>
        <span className="flex items-center justify-center text-[9px] text-slate-400 font-black">
          {step}mm
        </span>
        <button onClick={() => onNudge(step, 0)} className={btn} title={`Right ${step}mm`}>→</button>
        <span />
        <button onClick={() => onNudge(0, step)} className={btn} title={`Down ${step}mm`}>↓</button>
        <span />
      </div>
      <div className="flex flex-col gap-1">
        {[10, 50, 100].map((s) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={cn(
              'px-2 py-1 rounded-md text-[9px] font-bold border',
              step === s
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300',
            )}
          >
            {s}mm
          </button>
        ))}
      </div>
    </div>
  );
};

type HandlePositionPreset = 'default' | 'center' | 'top' | 'bottom' | 'left' | 'right';

function getPartFallbackColor(item: Furniture, part: FurniturePart) {
  const role = part.materialRole ?? 'exterior';
  const materialId =
    part.materialId ??
    (role === 'interior'
      ? item.internalMaterialId
      : role === 'hardware'
        ? item.hardwareMaterialId
        : item.materialId);
  const material = getMaterial(materialId);
  if (role === 'hardware') return item.hardwareColor || material?.color || '#d4af7a';
  if (role === 'interior') return item.interiorColor || material?.color || '#e2e8f0';
  return item.exteriorColor || material?.color || item.color || '#cbd5e1';
}

function getHandleLocalPosition(
  handle: FurniturePart,
  parent: FurniturePart | undefined,
  preset: HandlePositionPreset,
): FurniturePart['localPosition'] {
  const current = handle.localPosition ?? { x: 0, y: 0, z: handle.size.depth * 1.5 };
  if (!parent || preset === 'default') return current;
  const frontZ = current.z || parent.size.depth / 2 + handle.size.depth;
  const xInset = parent.size.width * 0.32;
  const yInset = parent.size.height * 0.36;
  if (preset === 'center') return { x: 0, y: 0, z: frontZ };
  if (preset === 'top') return { x: current.x, y: yInset, z: frontZ };
  if (preset === 'bottom') return { x: current.x, y: -yInset, z: frontZ };
  if (preset === 'left') return { x: -xInset, y: current.y, z: frontZ };
  return { x: xInset, y: current.y, z: frontZ };
}

function normaliseColor(color: string) {
  return /^#[0-9a-f]{6}$/i.test(color) ? color : '#ffffff';
}
