import React from 'react';
import { Box, DoorOpen, Grid2X2, Square } from 'lucide-react';
import { FurnitureCatalogItem, MaterialItem } from '../../data/catalog';
import { CatalogCategory, Tool } from '../../store/useStore';
import { getPatternStyle } from '../../lib/materialPattern';
import { cn } from '../../lib/utils';

interface CatalogVisualTileProps {
  id: string;
  name: string;
  category: CatalogCategory;
  selected: boolean;
  tool?: Tool;
  furniture?: FurnitureCatalogItem;
  material?: MaterialItem;
  draggable?: boolean;
  onClick: () => void;
}

export const CatalogVisualTile: React.FC<CatalogVisualTileProps> = ({
  id,
  name,
  category,
  selected,
  tool,
  furniture,
  material,
  draggable = false,
  onClick,
}) => {
  return (
    <button
      draggable={draggable}
      onDragStart={(event) => {
        if (!draggable || !furniture) return;
        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData('application/design-os-catalog-item', furniture.id);
        event.dataTransfer.setData('text/plain', furniture.id);
      }}
      onClick={onClick}
      className={cn(
        'flex flex-col rounded-xl bg-white border-2 border-transparent shadow-sm hover:shadow-md transition-all group overflow-hidden text-left',
        selected && 'border-blue-500 ring-2 ring-blue-100',
      )}
    >
      <div className="relative aspect-[1.12] w-full overflow-hidden bg-slate-100">
        {category === 'ARCHITECTURE' && <ArchitecturePreview tool={tool} />}
        {category === 'FURNITURE' && <FurniturePreview item={furniture} />}
        {category === 'FINISHES' && material && <div className="absolute inset-0" style={getPatternStyle(material)} />}
        <div className="absolute left-2 top-2 rounded-full bg-white/88 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-slate-600 shadow-sm">
          {category === 'ARCHITECTURE' ? 'ARC' : category === 'FURNITURE' ? 'FURN' : material?.group ?? 'FIN'}
        </div>
      </div>
      <div className="min-h-14 px-2.5 py-2 bg-white">
        <div className="text-[11px] font-black text-slate-800 truncate">{name}</div>
        <div className="text-[9px] font-bold text-slate-400 truncate mt-0.5">
          {furniture?.brand ?? material?.brand ?? material?.group ?? readableTool(id)}
        </div>
        {material && (
          <div className="text-[9px] font-black text-blue-600 mt-0.5">
            ₹{material.rate}/{material.unit}
          </div>
        )}
      </div>
    </button>
  );
};

const readableTool = (id: string) => id.replaceAll('_', ' ');

const ArchitecturePreview: React.FC<{ tool?: Tool }> = ({ tool }) => {
  if (tool === 'DOOR') {
    return (
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8fafc,#dbeafe)]">
        <div className="absolute inset-x-5 bottom-2 top-5 rounded-t-xl bg-[#8b5a2b] shadow-xl border-4 border-[#5b371a]" />
        <div className="absolute left-8 right-8 bottom-2 top-10 rounded-t-lg bg-[linear-gradient(90deg,#a86d36,#d09b62,#8b572a)]" />
        <div className="absolute right-9 top-1/2 h-2 w-2 rounded-full bg-amber-200 shadow" />
        <DoorOpen className="absolute bottom-3 left-3 text-white/80" size={18} />
      </div>
    );
  }
  if (tool === 'WINDOW') {
    return (
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#ecfeff,#dbeafe)]">
        <div className="absolute inset-5 rounded-xl bg-white shadow-lg border-4 border-slate-600" />
        <div className="absolute left-1/2 top-5 bottom-5 w-1 bg-slate-600" />
        <div className="absolute left-5 right-5 top-1/2 h-1 bg-slate-600" />
        <div className="absolute inset-8 rounded bg-sky-200/80" />
        <Grid2X2 className="absolute bottom-3 left-3 text-slate-700" size={18} />
      </div>
    );
  }
  return (
    <div className="absolute inset-0 bg-[linear-gradient(135deg,#fff7ed,#e2e8f0)]">
      <div className="absolute inset-x-3 top-7 h-12 rounded-lg bg-[linear-gradient(90deg,#cbd5e1,#f8fafc,#94a3b8)] shadow-xl border border-slate-300" />
      <div className="absolute inset-x-3 bottom-7 h-7 rounded bg-[linear-gradient(90deg,#e5e7eb,#fff,#d1d5db)] shadow" />
      <div className="absolute left-7 right-7 top-10 h-1 bg-white/80" />
      <Square className="absolute bottom-3 left-3 text-slate-700" size={18} />
    </div>
  );
};

const FurniturePreview: React.FC<{ item?: FurnitureCatalogItem }> = ({ item }) => {
  if (item?.thumbnailUrl || item?.sourceThumbnailUrl) {
    return <img src={item.thumbnailUrl || item.sourceThumbnailUrl} alt="" className="h-full w-full object-cover" />;
  }
  const isDrawer = item?.id.includes('drawer');
  const isPullout = item?.id.includes('pullout');
  const isSink = item?.id.includes('sink');
  const isOpen = item?.id.includes('open');
  const isTall = item?.type === 'CABINET_TALL' || item?.type === 'WARDROBE';
  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#ffffff,transparent_34%),linear-gradient(135deg,#eef2ff,#e0f2fe)]">
      <div className={cn('absolute left-1/2 -translate-x-1/2 bottom-4 w-16 rounded-lg border border-slate-300 bg-white shadow-xl', isTall ? 'h-24' : 'h-16')}>
        <div className="absolute inset-x-1 top-1 h-2 rounded bg-slate-800" />
        <div className="absolute inset-x-2 bottom-1 h-2 rounded bg-slate-800" />
        {isDrawer && [0, 1, 2].map((row) => (
          <div key={row} className="absolute left-2 right-2 h-3 rounded bg-slate-200 border border-slate-300" style={{ top: 16 + row * 15 }} />
        ))}
        {isOpen && [0, 1].map((row) => (
          <div key={row} className="absolute left-2 right-2 h-1 bg-teal-700" style={{ top: 26 + row * 18 }} />
        ))}
        {isPullout && <div className="absolute inset-y-5 left-1/2 w-8 -translate-x-1/2 rounded border-2 border-teal-700" />}
        {isSink && <div className="absolute left-4 right-4 top-2 h-4 rounded-full bg-slate-300 border border-slate-400" />}
        {!isDrawer && !isOpen && !isPullout && (
          <div className="absolute bottom-4 top-5 left-2 right-2 rounded bg-slate-100 border border-slate-300" />
        )}
      </div>
      <Box className="absolute bottom-3 left-3 text-slate-700" size={18} />
    </div>
  );
};

