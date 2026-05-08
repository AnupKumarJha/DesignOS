import React from 'react';
import { useStore, CatalogCategory, Tool } from '../../store/useStore';
import { 
  Pencil, 
  Layers, 
  DoorOpen, 
  Square, 
  Grid2X2, 
  Box,
  Palette,
  LayoutTemplate,
  Search,
  Filter
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface CatalogItem {
  id: string;
  name: string;
  icon: any;
  tool?: Tool;
  category: CatalogCategory;
}

export const CatalogSidebar: React.FC = () => {
  const { 
    catalogOpen, 
    activeCategory, 
    setActiveCategory, 
    activeTool, 
    setActiveTool, 
    setActiveFinish,
    setSelectedCatalogItem
  } = useStore();

  const categories: { id: CatalogCategory; icon: any; label: string }[] = [
    { id: 'ARCHITECTURE', icon: LayoutTemplate, label: 'Arc' },
    { id: 'FURNITURE', icon: Box, label: 'Furn' },
    { id: 'FINISHES', icon: Palette, label: 'Fin' },
  ];

  const items: CatalogItem[] = [
    { id: 'wall', name: 'Wall', icon: Square, tool: 'WALL', category: 'ARCHITECTURE' },
    { id: 'door', name: 'Door', icon: DoorOpen, tool: 'DOOR', category: 'ARCHITECTURE' },
    { id: 'window', name: 'Window', icon: Grid2X2, tool: 'WINDOW', category: 'ARCHITECTURE' },
    { id: 'cabinet_base', name: 'Base Cabinet', icon: Box, tool: 'FURNITURE', category: 'FURNITURE' },
    { id: 'cabinet_wall', name: 'Wall Cabinet', icon: Box, tool: 'FURNITURE', category: 'FURNITURE' },
    { id: 'cabinet_tall', name: 'Tall Cabinet', icon: Box, tool: 'FURNITURE', category: 'FURNITURE' },
    { id: 'sink_unit', name: 'Sink Unit', icon: Box, tool: 'FURNITURE', category: 'FURNITURE' },
    { id: 'wardrobe', name: 'Wardrobe', icon: Box, tool: 'FURNITURE', category: 'FURNITURE' },
    { id: 'finish_white', name: 'White Paint', icon: Palette, tool: 'APPLY_FINISH', category: 'FINISHES' },
    { id: 'finish_wood', name: 'Oak Wood', icon: Palette, tool: 'APPLY_FINISH', category: 'FINISHES' },
    { id: 'finish_marble', name: 'Marble', icon: Palette, tool: 'APPLY_FINISH', category: 'FINISHES' },
  ];

  if (!catalogOpen) return null;

  return (
    <div className="w-[300px] h-full bg-[#f8fafc] border-r border-slate-200 flex flex-col z-40 transition-all shadow-xl">
      {/* Search Header */}
      <div className="p-4 bg-white border-b border-slate-200 shadow-sm">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="text" 
            placeholder="Search catalog..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex-1 flex flex-col items-center py-2 rounded-lg transition-all border",
                activeCategory === cat.id 
                  ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm" 
                  : "border-transparent text-slate-500 hover:bg-slate-100 hover:border-slate-200"
              )}
            >
              <cat.icon size={18} />
              <span className="text-[10px] font-bold uppercase mt-1">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeCategory} Items</h2>
          <button className="p-1 hover:bg-slate-200 rounded text-slate-400 trasition-all">
            <Filter size={12} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {items
            .filter(i => i.category === activeCategory)
            .map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.tool) setActiveTool(item.tool);
                  setSelectedCatalogItem(item.id);
                  if (item.category === 'FINISHES') {
                    setActiveFinish(item.id);
                  }
                }}
                className={cn(
                  "flex flex-col items-center justify-center aspect-square rounded-xl bg-white border-2 border-transparent shadow-sm hover:shadow-md transition-all group",
                  activeTool === item.tool && "border-blue-500 ring-2 ring-blue-100"
                )}
              >
                <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
                  <item.icon size={24} className="text-slate-600" />
                </div>
                <span className="text-[11px] font-medium text-slate-700">{item.name}</span>
              </button>
            ))}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">Global Prefs & Settings</span>
        <div className="flex gap-1.5 grayscale opacity-50">
           <GripHorizontal size={14} className="text-slate-400" />
        </div>
      </div>
    </div>
  );
};

const GripHorizontal = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="9" r="1" />
    <circle cx="19" cy="9" r="1" />
    <circle cx="5" cy="9" r="1" />
    <circle cx="12" cy="15" r="1" />
    <circle cx="19" cy="15" r="1" />
    <circle cx="5" cy="15" r="1" />
  </svg>
);
