import React, { useEffect, useMemo, useState } from 'react';
import { Filter, Search, Sparkles, X } from 'lucide-react';
import { useStore, Wall, Furniture } from '../../store/useStore';
import { materialCatalog, MaterialItem, FinishType } from '../../data/catalog';
import { getPatternStyle } from '../../lib/materialPattern';
import { cn } from '../../lib/utils';

const ALL_FINISH_TYPES: FinishType[] = [
  'Matte',
  'Glossy',
  'Textured',
  'Natural',
  'Polished',
  'Reflective',
];

export const BottomMaterialDrawer: React.FC = () => {
  const {
    materialDrawerOpen,
    materialDrawerCategory,
    setMaterialDrawerOpen,
    setMaterialDrawerCategory,
    selection,
    walls,
    furniture,
    updateWall,
    updateFurniture,
  } = useStore();

  const [query, setQuery] = useState('');
  const [activeBrand, setActiveBrand] = useState<string>('All');
  const [activeFinish, setActiveFinish] = useState<FinishType | 'All'>('All');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);

  const allCategories = useMemo(
    () => Array.from(new Set(materialCatalog.map((m) => m.group))),
    [],
  );

  const itemsInCategory = useMemo(
    () => materialCatalog.filter((m) => m.group === materialDrawerCategory),
    [materialDrawerCategory],
  );

  const brandsInCategory = useMemo(() => {
    const brands = Array.from(
      new Set(itemsInCategory.map((m) => m.brand).filter(Boolean) as string[]),
    );
    return ['All', ...brands];
  }, [itemsInCategory]);

  useEffect(() => {
    setActiveBrand('All');
    setActiveFinish('All');
    setQuery('');
  }, [materialDrawerCategory]);

  useEffect(() => {
    if (!materialDrawerOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMaterialDrawerOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [materialDrawerOpen, setMaterialDrawerOpen]);

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return itemsInCategory.filter((m) => {
      if (activeBrand !== 'All' && m.brand !== activeBrand) return false;
      if (activeFinish !== 'All' && m.finishType !== activeFinish) return false;
      if (m.rate < priceRange[0] || m.rate > priceRange[1]) return false;
      if (!needle) return true;
      const haystack = [m.name, m.brand, m.sku, ...(m.tags ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [itemsInCategory, query, activeBrand, activeFinish, priceRange]);

  const selectedItem = useMemo(() => {
    if (!selection) return null;
    if (selection.type === 'wall') return walls.find((w) => w.id === selection.id) ?? null;
    if (selection.type === 'furniture')
      return furniture.find((f) => f.id === selection.id) ?? null;
    return null;
  }, [selection, walls, furniture]);

  const currentMaterialId =
    selectedItem && 'materialId' in selectedItem ? (selectedItem as Wall | Furniture).materialId : undefined;

  const applyMaterial = (material: MaterialItem) => {
    if (!selection || !selectedItem) return;
    const updates = { color: material.color, materialId: material.id };
    if (selection.type === 'wall') updateWall(selection.id, updates);
    else if (selection.type === 'furniture') updateFurniture(selection.id, updates);
  };

  if (!materialDrawerOpen) return null;

  const targetLabel =
    !selection
      ? 'Browse Materials'
      : selection.type === 'wall'
      ? 'Apply to Wall'
      : 'Apply to Furniture';

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] pointer-events-none">
      <div
        className="pointer-events-auto bg-white border-t border-slate-200 shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.15)] rounded-t-3xl flex flex-col"
        style={{ height: 'min(48vh, 520px)' }}
      >
        {/* Header */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Sparkles size={14} />
            </div>
            <div>
              <h3 className="text-[13px] font-black text-slate-900 leading-tight">
                Material Library
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {targetLabel} · {filteredItems.length} of {itemsInCategory.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, brand, SKU, tag…"
                className="w-72 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[12px] outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button
              onClick={() => setFilterPanelOpen((v) => !v)}
              className={cn(
                'p-2 rounded-xl border transition-all',
                filterPanelOpen
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50',
              )}
              title="Filters"
            >
              <Filter size={14} />
            </button>
            <button
              onClick={() => setMaterialDrawerOpen(false)}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Filter panel (collapsible) */}
        {filterPanelOpen && (
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 shrink-0 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Finish
              </span>
              {(['All', ...ALL_FINISH_TYPES] as const).map((finish) => (
                <button
                  key={finish}
                  onClick={() => setActiveFinish(finish)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all',
                    activeFinish === finish
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300',
                  )}
                >
                  {finish}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Price (₹/{itemsInCategory[0]?.unit ?? 'sqft'})
              </span>
              <input
                type="number"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
                className="w-16 bg-white border border-slate-200 rounded-md px-2 py-1 text-[11px] outline-none focus:border-blue-400"
              />
              <span className="text-[10px] text-slate-400">to</span>
              <input
                type="number"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 0])}
                className="w-16 bg-white border border-slate-200 rounded-md px-2 py-1 text-[11px] outline-none focus:border-blue-400"
              />
            </div>
            <button
              onClick={() => {
                setActiveFinish('All');
                setActiveBrand('All');
                setPriceRange([0, 1000]);
                setQuery('');
              }}
              className="ml-auto text-[10px] font-black text-blue-600 hover:underline"
            >
              RESET FILTERS
            </button>
          </div>
        )}

        {/* Tier 1: Categories */}
        <div className="px-6 pt-3 pb-1 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex gap-2">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setMaterialDrawerCategory(cat)}
                className={cn(
                  'whitespace-nowrap px-3.5 py-1.5 rounded-full text-[11px] font-black transition-all',
                  cat === materialDrawerCategory
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tier 2: Brands */}
        {brandsInCategory.length > 1 && (
          <div className="px-6 py-2 shrink-0 overflow-x-auto no-scrollbar border-b border-slate-100">
            <div className="flex gap-2">
              {brandsInCategory.map((brand) => (
                <button
                  key={brand}
                  onClick={() => setActiveBrand(brand)}
                  className={cn(
                    'whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all',
                    brand === activeBrand
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300',
                  )}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
              <Search size={28} className="mb-2 opacity-50" />
              <p className="text-xs font-bold">No materials match your filters.</p>
              <p className="text-[10px] mt-1">Try clearing the search or finish filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {filteredItems.map((m) => (
                <SwatchTile
                  key={m.id}
                  material={m}
                  selected={currentMaterialId === m.id}
                  disabled={!selection}
                  onClick={() => applyMaterial(m)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface SwatchTileProps {
  material: MaterialItem;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}

const SwatchTile: React.FC<SwatchTileProps> = ({ material, selected, disabled, onClick }) => {
  const style = getPatternStyle(material);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={
        disabled
          ? 'Select a wall or furniture first'
          : `${material.name} · ${material.brand ?? ''} · ₹${material.rate}/${material.unit}`
      }
      className={cn(
        'group flex flex-col rounded-xl overflow-hidden border-2 transition-all bg-white text-left',
        selected
          ? 'border-blue-600 shadow-lg ring-2 ring-blue-100'
          : 'border-slate-100 hover:border-slate-300 hover:shadow-md',
        disabled && 'opacity-60 cursor-not-allowed hover:border-slate-100 hover:shadow-none',
      )}
    >
      <div className="aspect-square w-full" style={style} />
      <div className="px-2 py-1.5 bg-white">
        <div className="text-[10px] font-black text-slate-700 truncate leading-tight">
          {material.name}
        </div>
        <div className="text-[9px] text-slate-400 font-bold truncate mt-0.5">
          {material.brand ?? material.group}
        </div>
        <div className="text-[9px] text-blue-600 font-black mt-0.5">
          ₹{material.rate}/{material.unit}
        </div>
      </div>
    </button>
  );
};
