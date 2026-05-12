import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useStore, CatalogCategory, Tool } from '../../store/useStore';
import {
  DoorOpen,
  Square,
  Grid2X2,
  Box,
  Palette,
  LayoutTemplate,
  Search,
  Filter,
  X,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { furnitureCatalog, materialCatalog, RoomType } from '../../data/catalog';

interface CatalogItem {
  id: string;
  name: string;
  icon: any;
  tool?: Tool;
  category: CatalogCategory;
}

const ROOM_FILTERS: { id: 'All' | RoomType; label: string }[] = [
  { id: 'All', label: 'All' },
  { id: 'Kitchen', label: 'Kitchen' },
  { id: 'Bedroom', label: 'Bedroom' },
  { id: 'Living', label: 'Living' },
  { id: 'Dining', label: 'Dining' },
  { id: 'Bathroom', label: 'Bathroom' },
  { id: 'Office', label: 'Office' },
  { id: 'Kids', label: 'Kids' },
];

export const CatalogSidebar: React.FC = () => {
  const {
    catalogOpen,
    activeCategory,
    setActiveCategory,
    activeTool,
    setActiveTool,
    activeFinish,
    setActiveFinish,
    selectedCatalogItem,
    setSelectedCatalogItem,
    catalogWidth,
    setCatalogWidth,
    customCatalogItems,
  } = useStore();

  const [search, setSearch] = useState('');
  const [roomFilter, setRoomFilter] = useState<'All' | RoomType>('All');
  const [resizing, setResizing] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const resizingRef = useRef(false);

  const toggleGroup = (group: string) =>
    setCollapsedGroups((prev) => ({ ...prev, [group]: !prev[group] }));

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      setCatalogWidth(e.clientX);
    };
    const onUp = () => {
      resizingRef.current = false;
      setResizing(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [resizing, setCatalogWidth]);

  const categories: { id: CatalogCategory; icon: any; label: string }[] = [
    { id: 'ARCHITECTURE', icon: LayoutTemplate, label: 'Arc' },
    { id: 'FURNITURE', icon: Box, label: 'Furn' },
    { id: 'FINISHES', icon: Palette, label: 'Fin' },
  ];

  const architectureItems: CatalogItem[] = [
    { id: 'wall', name: 'Wall', icon: Square, tool: 'WALL', category: 'ARCHITECTURE' },
    { id: 'door', name: 'Door', icon: DoorOpen, tool: 'DOOR', category: 'ARCHITECTURE' },
    { id: 'window', name: 'Window', icon: Grid2X2, tool: 'WINDOW', category: 'ARCHITECTURE' },
  ];

  const publishedCustomCatalog = useMemo(
    () => customCatalogItems.filter((item) => (item.importStatus ?? 'published') === 'published'),
    [customCatalogItems],
  );
  const mergedFurnitureCatalog = useMemo(
    () => [...furnitureCatalog, ...publishedCustomCatalog],
    [publishedCustomCatalog],
  );

  const items: CatalogItem[] = useMemo(
    () => [
      ...architectureItems,
      ...mergedFurnitureCatalog.map((item) => ({
        id: item.id,
        name: item.name,
        icon: Box,
        tool: 'FURNITURE' as Tool,
        category: 'FURNITURE' as CatalogCategory,
      })),
      ...materialCatalog.map((item) => ({
        id: item.id,
        name: item.name,
        icon: Palette,
        tool: 'APPLY_FINISH' as Tool,
        category: 'FINISHES' as CatalogCategory,
      })),
    ],
    [mergedFurnitureCatalog],
  );

  const filteredAndGrouped = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const inCategory = items.filter((item) => item.category === activeCategory);

    const matches = inCategory.filter((item) => {
      // Search filter — searches name + brand + sku for furniture; name + brand for materials
      if (needle) {
        let haystack = item.name.toLowerCase();
        if (item.category === 'FURNITURE') {
          const f = mergedFurnitureCatalog.find((c) => c.id === item.id);
          if (f) {
            haystack += ` ${f.brand ?? ''} ${f.sku ?? ''} ${(f.tags ?? []).join(' ')} ${f.group}`.toLowerCase();
          }
        } else if (item.category === 'FINISHES') {
          const m = materialCatalog.find((c) => c.id === item.id);
          if (m) {
            haystack += ` ${m.brand ?? ''} ${m.sku ?? ''} ${(m.tags ?? []).join(' ')} ${m.group}`.toLowerCase();
          }
        }
        if (!haystack.includes(needle)) return false;
      }

      // Room filter (furniture only)
      if (item.category === 'FURNITURE' && roomFilter !== 'All') {
        const f = mergedFurnitureCatalog.find((c) => c.id === item.id);
        const rooms = f?.roomTypes;
        if (rooms && !rooms.includes(roomFilter)) return false;
      }

      return true;
    });

    const grouped = matches.reduce<Record<string, CatalogItem[]>>((acc, item) => {
      const group =
        activeCategory === 'FURNITURE'
          ? mergedFurnitureCatalog.find((c) => c.id === item.id)?.group || 'Furniture'
          : activeCategory === 'FINISHES'
          ? materialCatalog.find((m) => m.id === item.id)?.group || 'Finishes'
          : 'Architecture';
      acc[group] = [...(acc[group] || []), item];
      return acc;
    }, {});
    return grouped;
  }, [items, activeCategory, search, roomFilter, mergedFurnitureCatalog]);

  const totalMatches = Object.values(filteredAndGrouped).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );

  if (!catalogOpen) return null;

  return (
    <div
      className="relative h-full bg-[#f8fafc] border-r border-slate-200 flex flex-col z-40 shadow-xl shrink-0"
      style={{ width: catalogWidth }}
    >
      {/* Search Header */}
      <div className="p-4 bg-white border-b border-slate-200 shadow-sm">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search catalog (name, brand, SKU, tag…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-200 text-slate-400"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'flex-1 flex flex-col items-center py-2 rounded-lg transition-all border',
                activeCategory === cat.id
                  ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm'
                  : 'border-transparent text-slate-500 hover:bg-slate-100 hover:border-slate-200',
              )}
            >
              <cat.icon size={18} />
              <span className="text-[10px] font-bold uppercase mt-1">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Room filter pills (furniture only) */}
      {activeCategory === 'FURNITURE' && (
        <div className="px-3 py-2 bg-white border-b border-slate-100 overflow-x-auto no-scrollbar">
          <div className="flex gap-1.5">
            {ROOM_FILTERS.map((room) => (
              <button
                key={room.id}
                onClick={() => setRoomFilter(room.id)}
                className={cn(
                  'whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all',
                  roomFilter === room.id
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300',
                )}
              >
                {room.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {activeCategory} Items · {totalMatches}
          </h2>
          <button className="p-1 hover:bg-slate-200 rounded text-slate-400 transition-all">
            <Filter size={12} />
          </button>
        </div>

        {totalMatches === 0 ? (
          <div className="py-12 text-center">
            <Search size={28} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-500">No matches.</p>
            <p className="text-[10px] text-slate-400 mt-1">Try clearing search or room filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(filteredAndGrouped).map(([group, groupItems]) => {
              const collapsed = !!collapsedGroups[group];
              return (
                <div key={group}>
                  <button
                    onClick={() => toggleGroup(group)}
                    className="w-full flex items-center justify-between mb-2 px-1 group/header hover:opacity-80 transition-opacity"
                  >
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <ChevronDown
                        size={11}
                        className={cn(
                          'transition-transform text-slate-400',
                          collapsed && '-rotate-90',
                        )}
                      />
                      {group}
                      <span className="text-slate-300 font-bold">· {groupItems.length}</span>
                    </h3>
                  </button>
                  {!collapsed && (
                    <div
                      className="grid gap-3"
                      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}
                    >
                      {groupItems.map((item) => {
                        const f =
                          item.category === 'FURNITURE'
                            ? mergedFurnitureCatalog.find((c) => c.id === item.id)
                            : undefined;
                        const isSelected =
                          item.category === 'ARCHITECTURE'
                            ? activeTool === item.tool
                            : item.category === 'FINISHES'
                            ? activeFinish === item.id
                            : selectedCatalogItem === item.id && activeTool === 'FURNITURE';
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              if (isSelected) {
                                // Toggle off
                                setActiveTool('SELECT');
                                setSelectedCatalogItem(null);
                                if (item.category === 'FINISHES') setActiveFinish(null);
                                return;
                              }
                              if (item.tool) setActiveTool(item.tool);
                              setSelectedCatalogItem(item.id);
                              if (item.category === 'FINISHES') {
                                setActiveFinish(item.id);
                              }
                            }}
                            className={cn(
                              'flex flex-col items-center justify-center aspect-square rounded-xl bg-white border-2 border-transparent shadow-sm hover:shadow-md transition-all group p-2',
                              isSelected && 'border-blue-500 ring-2 ring-blue-100',
                            )}
                          >
                            <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform mb-2 overflow-hidden">
                              {f?.thumbnailUrl || f?.sourceThumbnailUrl ? (
                                <img
                                  src={f.thumbnailUrl || f.sourceThumbnailUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <item.icon size={24} className="text-slate-600" />
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 line-clamp-1 w-full text-center">
                              {item.name}
                            </span>
                            {f?.brand && (
                              <span className="text-[8px] font-bold text-slate-400 mt-0.5 line-clamp-1">
                                {f.brand}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">
          Global Prefs & Settings
        </span>
        <div className="flex gap-1.5 grayscale opacity-50">
          <GripHorizontal size={14} className="text-slate-400" />
        </div>
      </div>

      {/* Drag handle for resizing */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          resizingRef.current = true;
          setResizing(true);
        }}
        onDoubleClick={() => setCatalogWidth(300)}
        title="Drag to resize · double-click to reset"
        className={cn(
          'absolute top-0 right-0 h-full w-1.5 -mr-0.5 cursor-col-resize z-50 group',
          resizing ? 'bg-blue-400' : 'hover:bg-blue-300/60',
        )}
      >
        <div className={cn(
          'absolute top-1/2 -translate-y-1/2 -right-1 w-1 h-12 rounded-full transition-opacity',
          resizing ? 'bg-blue-500 opacity-100' : 'bg-slate-300 opacity-0 group-hover:opacity-100',
        )} />
      </div>
    </div>
  );
};

const GripHorizontal = ({ size, className }: { size: number; className: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="9" r="1" />
    <circle cx="19" cy="9" r="1" />
    <circle cx="5" cy="9" r="1" />
    <circle cx="12" cy="15" r="1" />
    <circle cx="19" cy="15" r="1" />
    <circle cx="5" cy="15" r="1" />
  </svg>
);
