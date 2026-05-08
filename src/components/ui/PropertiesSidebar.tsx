import React from 'react';
import { useStore, Wall, Furniture } from '../../store/useStore';
import { X, Settings2, Trash2, ChevronDown, Search, Filter, Layers, Ruler, Palette } from 'lucide-react';
import { cn } from '../../lib/utils';

export const PropertiesSidebar: React.FC = () => {
  const { selection, walls, furniture, openings, updateWall, updateFurniture, updateOpening, removeWall, removeFurniture, removeOpening, setSelection } = useStore();

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

  const materialCategories = ['Solid Paints', 'Texture Paint', 'Wallpaper', 'Glass'];
  const colors = [
    { name: 'Opal Green', value: '#134e4a' },
    { name: 'Orange Brown', value: '#9a3412' },
    { name: 'Silk Grey', value: '#cbd5e1' },
    { name: 'Matte Black', value: '#1e293b' },
    { name: 'Slate Blue', value: '#475569' },
    { name: 'Cloud White', value: '#f8fafc' },
    { name: 'Brick Red', value: '#7f1d1d' },
    { name: 'Forest Green', value: '#064e3b' },
  ];

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

        {/* Accordion: Finish & Material (Matches Screenshot) */}
        {!isOpening && (
          <div className="mt-2 bg-white border-y border-slate-200">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette size={14} className="text-blue-600" />
                <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Finish Material</h3>
              </div>
              <button
                onClick={() => {
                  if (isWall) updateWall(item.id, { color: undefined });
                  else if (isFurniture) updateFurniture(item.id, { color: undefined });
                }}
                className="text-[10px] font-bold text-blue-600 hover:underline"
              >
                RESET
              </button>
            </div>

            <div className="p-4 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input placeholder="Search wall texture..." className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-[11px] outline-none" />
                </div>
                <button className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400">
                  <Filter size={14} />
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar">
                {materialCategories.map(cat => (
                  <button key={cat} className={cn(
                    "whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all",
                    cat === 'Solid Paints' ? "bg-blue-600 border-blue-600 text-white shadow-sm" : "bg-white border-slate-200 text-slate-500"
                  )}>
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {colors.map((c) => {
                  const currentColor = (isWall || isFurniture) ? (item as Wall | Furniture).color : undefined;
                  return (
                    <button
                      key={c.value}
                      onClick={() => {
                        if (isWall) updateWall(item.id, { color: c.value });
                        else if (isFurniture) updateFurniture(item.id, { color: c.value });
                      }}
                      className={cn(
                        "flex flex-col p-2 bg-white rounded-xl border-2 transition-all group shadow-sm hover:shadow-md",
                        currentColor === c.value ? "border-blue-600 bg-blue-50/30" : "border-slate-100"
                      )}
                    >
                      <div
                        className="w-full aspect-video rounded-lg shadow-inner mb-2"
                        style={{ backgroundColor: c.value }}
                      />
                      <span className="text-[10px] font-bold text-slate-600 text-left line-clamp-1 truncate w-full">{c.name}</span>
                      <span className="text-[9px] text-slate-400 font-medium">Color Code: {c.value.toUpperCase()}</span>
                    </button>
                  );
                })}
              </div>
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
;
