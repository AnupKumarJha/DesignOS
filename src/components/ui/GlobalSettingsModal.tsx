import React from 'react';
import { X, Settings, Ruler, Layers } from 'lucide-react';
import { materialCatalog } from '../../data/catalog';
import { UnitSystem, useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

interface GlobalSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const unitOptions: Array<{ id: UnitSystem; label: string; hint: string }> = [
  { id: 'mm', label: 'Millimeters', hint: 'Best for modular furniture precision' },
  { id: 'feet', label: 'Feet', hint: 'Useful for client walkthroughs' },
  { id: 'inches', label: 'Inches', hint: 'Useful for hardware/detail checks' },
];

export const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({ open, onClose }) => {
  const { settings, updateProjectSettings } = useStore();
  const floorMaterials = materialCatalog.filter((material) => material.group === 'Flooring');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[220] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-white overflow-hidden">
        <div className="h-14 px-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Settings size={17} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 leading-none">Global Settings</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Project-wise visual defaults</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5 bg-slate-50">
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <Ruler size={15} className="text-blue-600" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-700">Display Units</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 p-4">
              {unitOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => updateProjectSettings({ unitSystem: option.id })}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-all',
                    settings.unitSystem === option.id
                      ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200',
                  )}
                >
                  <div className="text-xs font-black">{option.label}</div>
                  <div className="text-[10px] mt-1 font-medium text-slate-400 leading-snug">{option.hint}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <Layers size={15} className="text-blue-600" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-700">Default Construction</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 p-4">
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Wall Height (mm)</span>
                <input
                  type="number"
                  value={settings.defaultWallHeight}
                  onChange={(event) => updateProjectSettings({ defaultWallHeight: parseInt(event.target.value) || 2700 })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Wall Thickness (mm)</span>
                <input
                  type="number"
                  value={settings.defaultWallThickness}
                  onChange={(event) => updateProjectSettings({ defaultWallThickness: parseInt(event.target.value) || 150 })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white"
                />
              </label>
              <label className="space-y-1.5 col-span-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Default Floor Finish</span>
                <select
                  value={settings.defaultFloorMaterialId}
                  onChange={(event) => updateProjectSettings({ defaultFloorMaterialId: event.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white"
                >
                  {floorMaterials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name} · {material.brand}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

