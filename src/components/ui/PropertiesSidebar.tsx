import React from 'react';
import { useStore, Wall, Furniture } from '../../store/useStore';
import { X, Settings2, Trash2, ChevronDown, Layers, Ruler, Palette, Sparkles, ChevronRight, Move, RotateCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { furnitureCatalog, getCatalogItem, getMaterial } from '../../data/catalog';
import { getDistance } from '../../lib/math';
import { getPatternStyle } from '../../lib/materialPattern';

export const PropertiesSidebar: React.FC = () => {
  const {
    selection,
    walls,
    furniture,
    openings,
    updateWall,
    updateFurniture,
    updateOpening,
    removeWall,
    removeFurniture,
    removeOpening,
    setSelection,
    setMaterialDrawerOpen,
    setMaterialDrawerCategory,
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
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-0 bg-slate-50/50">
        
        {/* Accordion: Dimensions */}
        <Section title="Dimensions & Construction" icon={Ruler}>
          {isWall && (
            <div className="space-y-1.5 mb-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Length (mm)</label>
              <Input
                type="number"
                value={Math.round(wallLength)}
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
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Height (mm)</label>
              <Input 
                type="number" 
                value={item.height}
                onChange={(v) => {
                  if (isWall) updateWall(item.id, { height: v });
                  else if (isFurniture) updateFurniture(item.id, { height: v });
                  else if (isOpening) updateOpening(item.id, { height: v });
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {isWall ? 'Thickness' : isFurniture ? 'Rotation (°)' : 'Width (mm)'}
              </label>
              <Input 
                type="number" 
                value={isWall ? (item as any).thickness : isFurniture ? (item as any).rotation : (item as any).width}
                onChange={(v) => {
                  if (isWall) updateWall(item.id, { thickness: v });
                  else if (isFurniture) updateFurniture(item.id, { rotation: v });
                  else if (isOpening) updateOpening(item.id, { width: v });
                }}
              />
            </div>
          </div>
          
          {isFurniture && (
            <>
             <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Depth (mm)</label>
                  <Input 
                    type="number" 
                    value={(item as any).depth}
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
                    label="X (mm)"
                    value={Math.round((item as Wall).start.x)}
                    onChange={(v) => updateWall(item.id, { start: { ...(item as Wall).start, x: v } })}
                  />
                  <LabeledInput
                    label="Y (mm)"
                    value={Math.round((item as Wall).start.y)}
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
                    label="X (mm)"
                    value={Math.round((item as Wall).end.x)}
                    onChange={(v) => updateWall(item.id, { end: { ...(item as Wall).end, x: v } })}
                  />
                  <LabeledInput
                    label="Y (mm)"
                    value={Math.round((item as Wall).end.y)}
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
                    label={`Distance from wall start (mm) · max ${Math.round(parentWallLength)}`}
                    value={Math.round((item as any).offset * parentWallLength)}
                    onChange={(v) =>
                      updateOpening(item.id, {
                        offset: parentWallLength
                          ? Math.max(0, Math.min(1, v / parentWallLength))
                          : 0,
                      })
                    }
                  />
                  <LabeledInput
                    label="Bottom Height from Floor (mm)"
                    value={Math.round((item as any).bottomHeight ?? 0)}
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
                    label="X (mm)"
                    value={Math.round((item as Furniture).position.x)}
                    onChange={(v) =>
                      updateFurniture(item.id, {
                        position: { ...(item as Furniture).position, x: v },
                      })
                    }
                  />
                  <LabeledInput
                    label="Y (mm)"
                    value={Math.round((item as Furniture).position.y)}
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
                  <LabeledInput
                    label="Angle (°)"
                    value={Math.round((item as Furniture).rotation)}
                    onChange={(v) => updateFurniture(item.id, { rotation: v })}
                  />
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
                      checked={(item as any).hasHandle || false}
                      onChange={(e) => updateFurniture(item.id, { hasHandle: e.target.checked })}
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

        {/* Danger Zone */}
        <div className="p-6">
          <button
            onClick={() => {
              if (isWall) removeWall(item.id);
              else if (isFurniture) removeFurniture(item.id);
              else if (isOpening) removeOpening(item.id);
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all border border-red-100"
          >
            <Trash2 size={16} />
            <span>DELETE COMPONENT</span>
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

const LabeledInput: React.FC<{ label: string; value: number; onChange: (v: number) => void }> = ({
  label,
  value,
  onChange,
}) => (
  <div className="space-y-1">
    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
      {label}
    </label>
    <Input value={value} onChange={onChange} />
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
