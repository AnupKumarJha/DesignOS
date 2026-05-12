import React, { useMemo, useState } from 'react';
import { AlertCircle, Box, CheckCircle2, Download, ExternalLink, Filter, Grid2X2, List, PackagePlus, Search, Settings, Upload, X } from 'lucide-react';
import { furnitureCatalog, FurnitureCatalogItem, RoomType } from '../../data/catalog';
import { cn } from '../../lib/utils';
import { downloadCatalogAdminCsv } from '../../lib/outputs';
import { putCatalogAsset, putCustomCatalogItem, putCustomCatalogItems } from '../../lib/db';
import { useStore, Furniture } from '../../store/useStore';

interface CatalogAdminModalProps {
  open: boolean;
  onClose: () => void;
}

export const CatalogAdminModal: React.FC<CatalogAdminModalProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Furniture');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selected, setSelected] = useState<FurnitureCatalogItem | null>(null);
  const { customCatalogItems, setCustomCatalogItems } = useStore();

  const pendingCount = customCatalogItems.filter((item) => item.importStatus === 'pending').length;
  const groups = useMemo(() => ['Furniture', 'Pending Sources', 'Accessories', 'Hardware', 'Building', 'Finishes', 'Templates'], []);
  const subcategories = useMemo(
    () => Array.from(new Set([...furnitureCatalog, ...customCatalogItems].map((item) => item.group))),
    [customCatalogItems],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const source =
      category === 'Pending Sources'
        ? customCatalogItems.filter((item) => item.importStatus === 'pending')
        : [...furnitureCatalog, ...customCatalogItems.filter((item) => item.importStatus !== 'rejected')];
    return source.filter((item) => {
      if (!needle) return true;
      return [item.name, item.group, item.brand, item.sku, item.sourceTitle, item.sourceAuthor, item.sourceUrl, ...item.tags]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [category, customCatalogItems, query]);

  const refreshCustomCatalog = async (items: FurnitureCatalogItem[]) => {
    await putCustomCatalogItems(items);
    setCustomCatalogItems(items);
  };

  const handleImportScrapeJson = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    const parsed = JSON.parse(text);
    const rows = Array.isArray(parsed) ? parsed : parsed.items;
    if (!Array.isArray(rows)) throw new Error('Import JSON must be an array or contain an items array.');
    const now = new Date().toISOString();
    const imports = rows
      .filter((row: any) => row?.status !== 'failed' && row?.status !== 'no_results')
      .map((row: any, index: number) => scrapedRowToCatalogItem(row, index, now));
    const existingIds = new Set(customCatalogItems.map((item) => item.id));
    const merged = [
      ...customCatalogItems.filter((item) => !imports.some((entry) => entry.id === item.id)),
      ...imports.map((item) => existingIds.has(item.id) ? { ...item, id: `${item.id}-${Date.now()}` } : item),
    ];
    await refreshCustomCatalog(merged);
    setCategory('Pending Sources');
  };

  const persistItem = async (item: FurnitureCatalogItem) => {
    await putCustomCatalogItem(item);
    setCustomCatalogItems([
      ...customCatalogItems.filter((entry) => entry.id !== item.id),
      item,
    ]);
    setSelected(item);
  };

  const handleUploadModel = async (item: FurnitureCatalogItem, file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'glb' && ext !== 'gltf') throw new Error('Only GLB/GLTF files are supported for v1.');
    const assetId = `asset_${crypto.randomUUID()}`;
    await putCatalogAsset({
      id: assetId,
      blob: file,
      fileName: file.name,
      mimeType: file.type || (ext === 'glb' ? 'model/gltf-binary' : 'model/gltf+json'),
      createdAt: new Date().toISOString(),
    });
    await persistItem({
      ...item,
      modelAssetId: assetId,
      assetFormat: ext,
      importStatus: item.importStatus === 'pending' ? 'pending' : 'published',
    });
  };

  const handlePublish = async (item: FurnitureCatalogItem) => persistItem({ ...item, importStatus: 'published' });
  const handleReject = async (item: FurnitureCatalogItem) => persistItem({ ...item, importStatus: 'rejected' });
  const handleAddManualItem = async () => {
    const item: FurnitureCatalogItem = {
      id: `manual-${crypto.randomUUID()}`,
      name: 'Manual Catalog Item',
      group: 'Imported',
      type: 'TABLE',
      category: 'FURNITURE',
      tags: ['manual'],
      roomTypes: ['Living'],
      brand: 'Studio',
      sku: `MAN-${Date.now().toString().slice(-6)}`,
      defaultVariantId: DEFAULT_VARIANT.id,
      variants: [DEFAULT_VARIANT],
      sourceProvider: 'manual',
      licenseNote: 'Manual local catalog entry.',
      importStatus: 'pending',
    };
    await persistItem(item);
    setCategory('Pending Sources');
  };

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
              {group === 'Pending Sources' && pendingCount > 0 && (
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] text-slate-950">{pendingCount}</span>
              )}
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
              <label className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                <Upload size={14} />
                Import Scrape JSON
                <input
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(event) => {
                    handleImportScrapeJson(event.target.files?.[0] ?? null).catch((err) => alert(err instanceof Error ? err.message : 'Import failed'));
                    event.currentTarget.value = '';
                  }}
                />
              </label>
              <button onClick={handleAddManualItem} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 flex items-center gap-2"><PackagePlus size={14} /> Add Manual Item</button>
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
                    <div className={cn('bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden', view === 'grid' ? 'h-36 mb-3' : 'w-16 h-16 shrink-0')}>
                    {item.thumbnailUrl || item.sourceThumbnailUrl ? (
                      <img src={item.thumbnailUrl || item.sourceThumbnailUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Box size={view === 'grid' ? 42 : 24} className="text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {item.importStatus === 'pending' && <AlertCircle size={13} className="text-amber-500 shrink-0" />}
                      {item.importStatus === 'published' && item.sourceProvider && <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />}
                      <div className="text-sm font-black text-slate-800 truncate">{item.name}</div>
                    </div>
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

      <SkuModal
        item={selected}
        onClose={() => setSelected(null)}
        onPublish={handlePublish}
        onReject={handleReject}
        onSave={persistItem}
        onUploadModel={handleUploadModel}
      />
    </div>
  );
};

const SkuModal: React.FC<{
  item: FurnitureCatalogItem | null;
  onClose: () => void;
  onPublish: (item: FurnitureCatalogItem) => Promise<void>;
  onReject: (item: FurnitureCatalogItem) => Promise<void>;
  onSave: (item: FurnitureCatalogItem) => Promise<void>;
  onUploadModel: (item: FurnitureCatalogItem, file: File) => Promise<void>;
}> = ({ item, onClose, onPublish, onReject, onSave, onUploadModel }) => {
  const [tab, setTab] = useState<'Properties' | 'Tags' | 'Pricing(Sales Channel)' | 'Linked Rules'>('Properties');
  const [draft, setDraft] = useState<FurnitureCatalogItem | null>(item);
  React.useEffect(() => setDraft(item), [item]);
  if (!item || !draft) return null;
  const custom = !!item.sourceProvider || !!item.importStatus;
  return (
    <div className="fixed inset-0 z-[280] bg-slate-950/40 flex items-center justify-center p-10">
      <div className="w-full max-w-5xl h-[70vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">SKU Properties of {draft.name}</h3>
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
              {custom ? (
                <>
                  <Edit label="Name" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
                  <Edit label="Group" value={draft.group} onChange={(value) => setDraft({ ...draft, group: value })} />
                  <Edit label="Brand" value={draft.brand ?? ''} onChange={(value) => setDraft({ ...draft, brand: value })} />
                  <Edit label="SKU" value={draft.sku ?? ''} onChange={(value) => setDraft({ ...draft, sku: value })} />
                  <Select
                    label="Type"
                    value={draft.type}
                    options={FURNITURE_TYPES}
                    onChange={(value) => setDraft({ ...draft, type: value as Furniture['type'] })}
                  />
                  <Select
                    label="Room"
                    value={draft.roomTypes?.[0] ?? 'Living'}
                    options={ROOM_TYPES}
                    onChange={(value) => setDraft({ ...draft, roomTypes: [value as RoomType] })}
                  />
                  <Edit label="Tags" value={draft.tags.join(', ')} onChange={(value) => setDraft({ ...draft, tags: value.split(',').map((tag) => tag.trim()).filter(Boolean) })} />
                  <Edit label="License / Source Note" value={draft.licenseNote ?? ''} onChange={(value) => setDraft({ ...draft, licenseNote: value })} />
                  <Edit
                    label="Default Price"
                    value={String(draft.variants[0]?.price ?? 0)}
                    onChange={(value) => setDraft({
                      ...draft,
                      variants: [{ ...(draft.variants[0] ?? DEFAULT_VARIANT), price: Number(value) || 0 }],
                      defaultVariantId: draft.variants[0]?.id ?? DEFAULT_VARIANT.id,
                    })}
                  />
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">3D Model</div>
                    <label className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white cursor-pointer">
                      <Upload size={14} />
                      Upload GLB/GLTF
                      <input
                        type="file"
                        accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) onUploadModel(draft, file).catch((err) => alert(err instanceof Error ? err.message : 'Upload failed'));
                          event.currentTarget.value = '';
                        }}
                      />
                    </label>
                    <div className="mt-2 text-[11px] font-bold text-slate-500">
                      {draft.modelAssetId ? `${draft.assetFormat?.toUpperCase()} attached` : 'No model attached yet'}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Info label="Name" value={item.name} />
                  <Info label="Group" value={item.group} />
                  <Info label="Brand" value={item.brand ?? 'Studio'} />
                  <Info label="SKU" value={item.sku ?? '-'} />
                  <Info label="Tags" value={item.tags.join(', ')} />
                  <Info label="Variants" value={String(item.variants.length)} />
                </>
              )}
              {item.sourceUrl && (
                <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-2 text-sm font-black text-blue-600">
                  <ExternalLink size={15} />
                  Open source
                </a>
              )}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
          {custom && (
            <>
              <button onClick={() => onSave(draft)} className="px-5 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-black">Save</button>
              {draft.importStatus === 'pending' && <button onClick={() => onPublish(draft)} className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-black">Publish</button>}
              {draft.importStatus !== 'rejected' && <button onClick={() => onReject(draft)} className="px-5 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-black">Reject</button>}
            </>
          )}
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

const Edit: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({ label, value, onChange }) => (
  <label className="bg-white rounded-xl border border-slate-200 p-4">
    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
    <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-400" />
  </label>
);

const Select: React.FC<{ label: string; value: string; options: string[]; onChange: (value: string) => void }> = ({ label, value, options, onChange }) => (
  <label className="bg-white rounded-xl border border-slate-200 p-4">
    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-400">
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  </label>
);

const ROOM_TYPES: RoomType[] = ['Kitchen', 'Bedroom', 'Living', 'Dining', 'Bathroom', 'Office', 'Kids', 'Outdoor'];
const FURNITURE_TYPES: Furniture['type'][] = [
  'CABINET_BASE',
  'CABINET_WALL',
  'CABINET_TALL',
  'TABLE',
  'CHAIR',
  'WARDROBE',
  'SINK_UNIT',
  'BED',
  'SOFA',
  'DESK',
  'BOOKSHELF',
  'TV_UNIT',
  'NIGHTSTAND',
  'DRESSER',
  'VANITY',
  'COFFEE_TABLE',
  'DINING_TABLE',
  'SHOE_RACK',
  'STUDY_UNIT',
  'OFFICE_CHAIR',
  'MIRROR',
];
const DEFAULT_VARIANT = { id: 'default', label: '600W x 600D x 600H', width: 600, depth: 600, height: 600, price: 0, unit: 'unit' as const };

function scrapedRowToCatalogItem(row: any, index: number, now: string): FurnitureCatalogItem {
  const title = String(row.title || row.name || row.sourceTitle || `Imported Item ${index + 1}`).trim();
  const sourceUrl = String(row.url || row.sourceUrl || '').trim();
  const text = `${title} ${(row.tags || []).join?.(' ') ?? ''}`.toLowerCase();
  const type = inferFurnitureType(text);
  const room = inferRoomType(text);
  const idBase = `${title}-${sourceUrl || now}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
  return {
    id: `3dw-${idBase || crypto.randomUUID()}`,
    name: title,
    group: inferGroup(type),
    type,
    category: 'FURNITURE',
    tags: Array.isArray(row.tags) ? row.tags.map(String) : ['3dwarehouse'],
    roomTypes: [room],
    brand: row.brand || '3D Warehouse',
    sku: row.sku || `3DW-${String(index + 1).padStart(3, '0')}`,
    defaultVariantId: DEFAULT_VARIANT.id,
    variants: [DEFAULT_VARIANT],
    sourceProvider: '3dwarehouse',
    sourceUrl,
    sourceTitle: title,
    sourceAuthor: row.author || row.sourceAuthor || '',
    sourceThumbnailUrl: row.thumbnail || row.thumbnailUrl || row.sourceThumbnailUrl || '',
    licenseNote: row.licenseNote || 'Imported metadata for local prototype review. Verify rights before production use.',
    importStatus: 'pending',
  };
}

function inferFurnitureType(text: string): Furniture['type'] {
  if (text.includes('bed')) return 'BED';
  if (text.includes('sofa') || text.includes('couch')) return 'SOFA';
  if (text.includes('wardrobe') || text.includes('closet')) return 'WARDROBE';
  if (text.includes('chair')) return 'CHAIR';
  if (text.includes('desk')) return 'DESK';
  if (text.includes('dining')) return 'DINING_TABLE';
  if (text.includes('coffee')) return 'COFFEE_TABLE';
  if (text.includes('tv')) return 'TV_UNIT';
  if (text.includes('mirror')) return 'MIRROR';
  if (text.includes('vanity')) return 'VANITY';
  if (text.includes('sink')) return 'SINK_UNIT';
  if (text.includes('cabinet')) return 'CABINET_BASE';
  return 'TABLE';
}

function inferRoomType(text: string): RoomType {
  if (text.includes('kitchen') || text.includes('cabinet') || text.includes('sink')) return 'Kitchen';
  if (text.includes('bed') || text.includes('wardrobe')) return 'Bedroom';
  if (text.includes('dining')) return 'Dining';
  if (text.includes('bath') || text.includes('vanity')) return 'Bathroom';
  if (text.includes('desk') || text.includes('office')) return 'Office';
  return 'Living';
}

function inferGroup(type: Furniture['type']) {
  if (type === 'BED') return 'Beds';
  if (type === 'SOFA') return 'Sofas';
  if (type === 'WARDROBE') return 'Wardrobes';
  if (type === 'CHAIR' || type === 'OFFICE_CHAIR') return 'Chairs';
  if (type.includes('TABLE')) return 'Tables';
  if (type.includes('CABINET') || type === 'SINK_UNIT') return 'Cabinets';
  return 'Imported';
}
