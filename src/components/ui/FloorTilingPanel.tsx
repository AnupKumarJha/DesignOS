import React from 'react';
import { X, Grid2X2 } from 'lucide-react';
import { materialCatalog } from '../../data/catalog';
import { getPatternStyle } from '../../lib/materialPattern';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

interface FloorTilingPanelProps {
  open: boolean;
  onClose: () => void;
}

export const FloorTilingPanel: React.FC<FloorTilingPanelProps> = ({ open, onClose }) => {
  const { rooms, currentRoomId, settings, updateRoomFloorMaterial } = useStore();
  const currentRoom = rooms.find((room) => room.id === currentRoomId);
  const flooring = materialCatalog.filter((material) => material.group === 'Flooring');
  const activeId = currentRoom?.floorMaterialId || settings.defaultFloorMaterialId;

  if (!open) return null;

  return (
    <div className="fixed right-[340px] top-36 z-[210] w-[420px] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
      <div className="h-12 px-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <Grid2X2 size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 leading-none">Floor / Tiling</h3>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">Current room finish</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close floor tiling">
          <X size={17} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3 p-4 max-h-[430px] overflow-y-auto bg-slate-50">
        {flooring.map((material) => (
          <button
            key={material.id}
            onClick={() => updateRoomFloorMaterial(currentRoomId, material.id)}
            className={cn(
              'rounded-xl overflow-hidden border-2 bg-white text-left shadow-sm hover:shadow-md transition-all',
              activeId === material.id ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-100 hover:border-slate-300',
            )}
          >
            <div className="aspect-square" style={getPatternStyle(material)} />
            <div className="px-2 py-2">
              <div className="text-[10px] font-black text-slate-800 truncate">{material.name}</div>
              <div className="text-[9px] font-bold text-slate-400 truncate">{material.brand}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

