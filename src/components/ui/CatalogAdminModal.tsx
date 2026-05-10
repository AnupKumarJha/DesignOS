import React, { useMemo, useState } from 'react';
import { Box, Download, Filter, Grid2X2, List, PackagePlus, Search, Settings, X } from 'lucide-react';
import { furnitureCatalog, FurnitureCatalogItem } from '../../data/catalog';
import { cn } from '../../lib/utils';
import { downloadCatalogAdminCsv } from '../../lib/outputs';

interface CatalogAdminModalProps {
  open: boolean;
  onClose: () => void;
}

export const CatalogAdminModal: React.FC<CatalogAdminModalProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Furniture');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selected, setSelected] = useState<FurnitureCatalogItem | null>(null);

  const groups = useMemo(() => ['Furniture', 'Accessories', 'Hardware', 'Building', 'Finishes', 'Templates'], []);
  const subcategories = useMemo(
    () => Array.from(new Set(furnitureCatalog.map((item) => item.group))),
    [],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return furnitureCatalog.filter((item) => {
      if (!needle) return true;
      return [item.name, item.group, item.brand, item.sku, ...item.tags]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[260] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-8">
      <div className="w-full max-w-7xl h-[86vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex">
        <aside className="w-72 bg-slate-950 text-white p-5 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Box size={18} />
            </div>
            <div>
              <div className="text-sm font-black">Catalogue</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400">Admin Library</div>
            </div>
          </div>
          {groups.map((group) => (
            <button
              key={group}
              onClick={() => setCategory(group)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-bold mb-1 transition-all',
                category === group ? 'bg-white/12 text-white' : 'text-slate-400 hover:bg-white/6 hover:text-white',
              )}
            >
              {group}
              <span className="text-slate-500">›</span>
            </button>
          ))}
          <button
            onClick={downloadCatalogAdminCsv}
            className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white px-3 py-3 text-xs font-black"
          >
            <Download size={14} />
            Export Catalog CSV
          </button>
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-20 px-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Subcategories of · <span className="text-blue-600">Base Unit</span></h2>
              <p className="text-xs text-slate-500 mt-1">{filtered.length} catalog groups · local studio library</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50">Bulk Actions</button>
              <button className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 flex items-center gap-2"><PackagePlus size={14} /> Add From Warehouse</button>
              <button className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 flex items-center gap-2"><Filter size={14} /> Filter</button>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"><X size={18} /></button>
            </div>
          </header>

          <div className="px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-4 overflow-x-auto no-scrollbar">
              {subcategories.map((sub) => (
                <button
                  key={sub}
                  className={cn(
                    'px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap',
                    sub === 'Base Units' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50',
                  )}
                >
                  {sub}
                </button>
              ))}
              <button className="ml-auto text-xs font-black text-blue-600 whitespace-nowrap">+ Add Sub-Category</button>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by Group Name or SKU Name / Model No / Serial No / ERP Code"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-3 text-sm outline-none focus:bg-white focus:border-blue-400"
                />
              </div>
              <button className="text-xs font-black text-blue-600">+ Add Group</button>
              <button onClick={() => setView('list')} className={cn('p-2 rounded-lg', view === 'list' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-100')}><List size={17} /></button>
              <button onClick={() => setView('grid')} className={cn('p-2 rounded-lg', view === 'grid' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-100')}><Grid2X2 size={17} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            <div className={cn(view === 'grid' ? 'grid grid-cols-2 xl:grid-cols-4 gap-5' : 'space-y-2')}>
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={cn(
                    'bg-white border border-slate-200 shadow-sm text-left hover:border-blue-300 hover:shadow-md transition-all',
                    view === 'grid' ? 'rounded-xl p-4' : 'rounded-lg p-3 flex items-center gap-4',
                  )}
                >
                  <div className={cn('bg-slate-100 rounded-lg flex items-center justify-center', view === 'grid' ? 'h-36 mb-3' : 'w-16 h-16 shrink-0')}>
                    <Box size={view === 'grid' ? 42 : 24} className="text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black text-slate-800 truncate">{item.name}</div>
                    <div className="text-[11px] text-slate-400 mt-1">{item.variants.length}/{Math.max(item.variants.length + 4, 7)} sku · {item.brand ?? 'Studio'}</div>
                    <div className="mt-3 flex items-center gap-2">
                      <select className="min-w-0 flex-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-600">
                        {item.variants.map((variant) => (
                          <option key={variant.id}>{variant.label}</option>
                        ))}
                      </select>
                      <span className="p-1 rounded-md bg-slate-100 text-slate-500"><Settings size={14} /></span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>

      <SkuModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

const SkuModal: React.FC<{ item: FurnitureCatalogItem | null; onClose: () => void }> = ({ item, onClose }) => {
  const [tab, setTab] = useState<'Properties' | 'Tags' | 'Pricing(Sales Channel)' | 'Linked Rules'>('Properties');
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-[280] bg-slate-950/40 flex items-center justify-center p-10">
      <div className="w-full max-w-5xl h-[70vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">SKU Properties of {item.name}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 border-b border-slate-100 flex gap-5">
          {(['Properties', 'Tags', 'Pricing(Sales Channel)', 'Linked Rules'] as const).map((id) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn('px-3 py-2 rounded-lg text-sm font-bold', tab === id ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50')}
            >
              {id}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {tab === 'Pricing(Sales Channel)' ? (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
              <div className="flex items-center gap-3">
                <span className="font-black text-slate-700">Manage Default Pricing</span>
                <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option>Link price to source sku</option><option>Price as complete unit</option></select>
              </div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600"><input type="checkbox" /> Override margin and tax of constituents</label>
              <table className="w-full text-sm">
                <thead className="text-left text-slate-400"><tr><th>Sales Channels</th><th>Price Field</th><th>Pricing Mode</th><th>Addn Prop</th><th>Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {['Default Sales Channel', 'Punjab', 'Raipur', 'Indore'].map((channel) => (
                    <tr key={channel}><td className="py-3 font-bold text-slate-700">{channel}</td><td>Default</td><td><select className="rounded border border-slate-200 px-2 py-1"><option>Default</option></select></td><td>Visible</td><td className="text-blue-600">Edit</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Info label="Name" value={item.name} />
              <Info label="Group" value={item.group} />
              <Info label="Brand" value={item.brand ?? 'Studio'} />
              <Info label="SKU" value={item.sku ?? '-'} />
              <Info label="Tags" value={item.tags.join(', ')} />
              <Info label="Variants" value={String(item.variants.length)} />
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-black">Close</button>
        </div>
      </div>
    </div>
  );
};

const Info: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4">
    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
    <div className="mt-1 text-sm font-bold text-slate-800">{value}</div>
  </div>
);
