import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Clock,
  Copy,
  FolderOpen,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Trash,
  CheckCircle2,
  Hammer,
} from 'lucide-react';
import {
  useStore,
  DesignSnapshot,
  ProjectMeta,
  ProjectStatus,
} from '../../store/useStore';
import {
  deleteProject,
  loadProjects,
  permanentlyDeleteProject,
  restoreProject,
  updateProjectStatus,
  upsertProject,
} from '../../lib/persistence';
import { cn } from '../../lib/utils';
import { NewProjectDialog } from './NewProjectDialog';

type View = 'recent' | 'all' | 'deleted' | 'production';

const SIDEBAR_TABS: { id: View; label: string }[] = [
  { id: 'recent', label: 'Recently Accessed' },
  { id: 'all', label: 'All Projects' },
  { id: 'deleted', label: 'Deleted Items' },
  { id: 'production', label: 'Production Designs' },
];

const STATUS_OPTIONS: ProjectStatus[] = [
  'Design Phase',
  'In Review',
  'In Production',
  'Completed',
];

const EMPTY_STATE: Record<View, { title: string; subtitle: string }> = {
  recent: {
    title: 'No saved projects yet',
    subtitle: 'Click "+ New Project" to create your first design.',
  },
  all: {
    title: 'No saved projects yet',
    subtitle: 'Click "+ New Project" to create your first design.',
  },
  deleted: {
    title: 'No deleted items',
    subtitle: 'Soft-deleted projects appear here and can be restored.',
  },
  production: {
    title: 'No projects in production yet',
    subtitle: 'Mark a project as "In Production" from its status pill.',
  },
};

export const ProjectHub: React.FC = () => {
  const { savedProjects, setSavedProjects, loadSnapshot, getSnapshot } = useStore();
  const [query, setQuery] = useState('');
  const [view, setView] = useState<View>('recent');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setSavedProjects(loadProjects());
  }, [setSavedProjects]);

  const filtered = useMemo(() => {
    let list: DesignSnapshot[];
    if (view === 'deleted') {
      list = savedProjects.filter((s) => !!s.deletedAt);
    } else if (view === 'production') {
      list = savedProjects.filter(
        (s) => !s.deletedAt && s.project.status === 'In Production',
      );
    } else if (view === 'recent') {
      list = savedProjects
        .filter((s) => !s.deletedAt)
        .slice()
        .sort((a, b) => b.project.updatedAt.localeCompare(a.project.updatedAt))
        .slice(0, 10);
    } else {
      list = savedProjects.filter((s) => !s.deletedAt);
    }

    const needle = query.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((snapshot) => {
      const project = snapshot.project;
      return [
        project.projectName,
        project.clientName,
        project.projectId,
        project.room,
        project.building,
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [query, savedProjects, view]);

  const handleCreate = (meta: Partial<ProjectMeta>) => {
    const base = getSnapshot();
    const projectMeta = {
      ...base.project,
      ...meta,
      id: crypto.randomUUID(),
      projectId: `PN-${Math.floor(10000 + Math.random() * 90000)}`,
      clientDetails: meta.clientDetails ?? '',
      status: 'Design Phase' as const,
      updatedAt: new Date().toISOString(),
    };
    // Seed the new project with a single starter room so the user can
    // immediately start drawing and the multi-room hierarchy is consistent.
    const starterRoom = {
      id: crypto.randomUUID(),
      name: projectMeta.room || 'Kitchen',
      type: projectMeta.room || 'Kitchen',
      building: projectMeta.building || 'Building 1',
      floor: projectMeta.floor || 'Ground Floor',
      createdAt: new Date().toISOString(),
    };
    const snapshot: DesignSnapshot = {
      ...base,
      schemaVersion: 3,
      project: projectMeta,
      rooms: [starterRoom],
      currentRoomId: starterRoom.id,
      walls: buildTemplateWalls(starterRoom.id, projectMeta.room),
      openings: [],
      furniture: buildTemplateFurniture(starterRoom.id, projectMeta.room),
      deletedAt: null,
    };
    const next = upsertProject(snapshot);
    setSavedProjects(next);
    setDialogOpen(false);
    loadSnapshot(snapshot);
  };

  const duplicateProject = (snapshot: DesignSnapshot) => {
    const duplicated: DesignSnapshot = {
      ...snapshot,
      project: {
        ...snapshot.project,
        id: crypto.randomUUID(),
        projectName: `${snapshot.project.projectName} Copy`,
        updatedAt: new Date().toISOString(),
      },
      deletedAt: null,
    };
    const next = upsertProject(duplicated);
    setSavedProjects(next);
  };

  const handleSoftDelete = (id: string) => {
    setSavedProjects(deleteProject(id));
  };

  const handleRestore = (id: string) => {
    setSavedProjects(restoreProject(id));
  };

  const handlePermanentDelete = (snapshot: DesignSnapshot) => {
    const ok = window.confirm(
      `Permanently delete "${snapshot.project.projectName}"? This cannot be undone.`,
    );
    if (!ok) return;
    setSavedProjects(permanentlyDeleteProject(snapshot.project.id));
  };

  const handleStatusChange = (id: string, status: ProjectStatus) => {
    setSavedProjects(updateProjectStatus(id, status));
  };

  const empty = EMPTY_STATE[view];

  return (
    <div className="fixed inset-0 z-[300] bg-slate-100 text-slate-900 flex overflow-hidden">
      <aside className="w-72 bg-slate-950 text-white p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Box size={20} />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight">Namaste Design</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400">Internal Studio OS</div>
          </div>
        </div>

        {SIDEBAR_TABS.map((tab) => {
          const count =
            tab.id === 'deleted'
              ? savedProjects.filter((s) => !!s.deletedAt).length
              : tab.id === 'production'
              ? savedProjects.filter(
                  (s) => !s.deletedAt && s.project.status === 'In Production',
                ).length
              : tab.id === 'all'
              ? savedProjects.filter((s) => !s.deletedAt).length
              : 0;
          return (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-xs font-bold mb-1 transition-all flex items-center justify-between',
                view === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white',
              )}
            >
              <span>{tab.label}</span>
              {count > 0 && (
                <span className="text-[10px] bg-white/10 rounded-full px-2 py-0.5">{count}</span>
              )}
            </button>
          );
        })}

        <div className="mt-auto text-[10px] text-slate-500 leading-relaxed">
          Local MVP storage is active. Backend auth, billing, and collaboration can be added after the design schema stabilizes.
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Project Hub</h1>
            <p className="text-sm text-slate-500 mt-1">
              Create, reopen, duplicate, and manage local design projects.
            </p>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white text-xs font-black shadow-lg shadow-blue-100 hover:bg-blue-700"
          >
            <Plus size={16} />
            New Project
          </button>
        </div>

        <div className="relative max-w-xl mb-8">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by project, client, room, or ID"
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-16 text-center">
            <FolderOpen size={44} className="mx-auto text-slate-300 mb-4" />
            <h2 className="font-black text-slate-700">{empty.title}</h2>
            <p className="text-sm text-slate-500 mt-2">{empty.subtitle}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((snapshot) => (
              <ProjectCard
                key={snapshot.project.id}
                snapshot={snapshot}
                view={view}
                onOpen={() => loadSnapshot(snapshot)}
                onDuplicate={() => duplicateProject(snapshot)}
                onSoftDelete={() => handleSoftDelete(snapshot.project.id)}
                onRestore={() => handleRestore(snapshot.project.id)}
                onPermanentDelete={() => handlePermanentDelete(snapshot)}
                onStatusChange={(status) => handleStatusChange(snapshot.project.id, status)}
              />
            ))}
          </div>
        )}
      </main>

      <NewProjectDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
};

const buildTemplateWalls = (roomId: string, room: string) => {
  if (room === 'Other') return [];
  const width = room.includes('Living') ? 5200 : room.includes('Bedroom') ? 4200 : 3600;
  const depth = room.includes('Living') ? 4200 : room.includes('Bedroom') ? 3600 : 3000;
  return [
    { id: crypto.randomUUID(), roomId, start: { x: 0, y: 0 }, end: { x: width, y: 0 }, thickness: 150, height: 2700 },
    { id: crypto.randomUUID(), roomId, start: { x: width, y: 0 }, end: { x: width, y: depth }, thickness: 150, height: 2700 },
    { id: crypto.randomUUID(), roomId, start: { x: width, y: depth }, end: { x: 0, y: depth }, thickness: 150, height: 2700 },
    { id: crypto.randomUUID(), roomId, start: { x: 0, y: depth }, end: { x: 0, y: 0 }, thickness: 150, height: 2700 },
  ];
};

const buildTemplateFurniture = (roomId: string, room: string) => {
  if (room.includes('Kitchen')) {
    return [
      { id: crypto.randomUUID(), roomId, type: 'CABINET_BASE' as const, position: { x: 900, y: 250 }, rotation: 0, width: 900, depth: 560, height: 720, catalogItemId: 'cabinet_base', variantId: 'base_900', shutterCount: 2, hasHandle: true, skirtingHeight: 100 },
      { id: crypto.randomUUID(), roomId, type: 'SINK_UNIT' as const, position: { x: 1900, y: 250 }, rotation: 0, width: 900, depth: 560, height: 720, catalogItemId: 'sink_unit', variantId: 'sink_900', shutterCount: 2, hasHandle: true, skirtingHeight: 100 },
      { id: crypto.randomUUID(), roomId, type: 'CABINET_WALL' as const, position: { x: 1400, y: 250 }, rotation: 0, width: 900, depth: 320, height: 720, catalogItemId: 'cabinet_wall', variantId: 'wall_900', shutterCount: 2, hasHandle: true },
    ];
  }
  if (room.includes('Bedroom')) {
    return [
      { id: crypto.randomUUID(), roomId, type: 'BED' as const, position: { x: 2100, y: 2100 }, rotation: 0, width: 1500, depth: 2000, height: 400, catalogItemId: 'bed_queen', variantId: 'bed_queen_1500' },
      { id: crypto.randomUUID(), roomId, type: 'WARDROBE' as const, position: { x: 700, y: 250 }, rotation: 0, width: 1200, depth: 600, height: 2100, catalogItemId: 'wardrobe', variantId: 'wardrobe_1200', shutterCount: 2, hasHandle: true, skirtingHeight: 100 },
    ];
  }
  if (room.includes('Living')) {
    return [
      { id: crypto.randomUUID(), roomId, type: 'SOFA' as const, position: { x: 2200, y: 3100 }, rotation: 0, width: 2200, depth: 900, height: 850, catalogItemId: 'sofa_3seater', variantId: 'sofa_3_2200' },
      { id: crypto.randomUUID(), roomId, type: 'TV_UNIT' as const, position: { x: 2200, y: 300 }, rotation: 0, width: 1800, depth: 450, height: 500, catalogItemId: 'tv_unit_low', variantId: 'tv_1800' },
    ];
  }
  return [];
};

interface ProjectCardProps {
  snapshot: DesignSnapshot;
  view: View;
  onOpen: () => void;
  onDuplicate: () => void;
  onSoftDelete: () => void;
  onRestore: () => void;
  onPermanentDelete: () => void;
  onStatusChange: (status: ProjectStatus) => void;
}

const STATUS_STYLES: Record<ProjectStatus, string> = {
  'Design Phase': 'bg-blue-50 text-blue-700 border-blue-200',
  'In Review': 'bg-amber-50 text-amber-700 border-amber-200',
  'In Production': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Completed': 'bg-slate-100 text-slate-600 border-slate-200',
};

const ProjectCard: React.FC<ProjectCardProps> = ({
  snapshot,
  view,
  onOpen,
  onDuplicate,
  onSoftDelete,
  onRestore,
  onPermanentDelete,
  onStatusChange,
}) => {
  const isDeletedView = view === 'deleted';
  const status = snapshot.project.status;

  return (
    <article
      className={cn(
        'bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col',
        isDeletedView ? 'border-red-100' : 'border-slate-200',
      )}
    >
      <button
        onClick={onOpen}
        disabled={isDeletedView}
        className={cn(
          'w-full h-36 bg-slate-200 relative text-left overflow-hidden',
          isDeletedView && 'opacity-60 cursor-not-allowed',
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-300" />
        <div className="absolute inset-x-5 bottom-5">
          <div className="text-xs font-black text-slate-500 uppercase tracking-widest">
            {snapshot.project.room}
          </div>
          <div className="text-lg font-black text-slate-900 truncate">
            {snapshot.project.projectName}
          </div>
        </div>
        {isDeletedView && (
          <div className="absolute top-3 right-3 text-[10px] font-black text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
            DELETED
          </div>
        )}
      </button>

      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <div className="text-sm font-bold text-slate-700">
            {snapshot.project.clientName || 'No client assigned'}
          </div>
          <div className="text-[11px] text-slate-400 font-bold mt-1">
            {snapshot.project.projectId} · {snapshot.project.projectType || 'Residential'} ·{' '}
            {snapshot.project.building}
          </div>
        </div>

        {!isDeletedView && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Status
            </span>
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value as ProjectStatus)}
              className={cn(
                'text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border outline-none cursor-pointer',
                STATUS_STYLES[status] ?? STATUS_STYLES['Design Phase'],
              )}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Clock size={12} />
          {new Date(snapshot.project.updatedAt).toLocaleString()}
          {isDeletedView && snapshot.deletedAt && (
            <span className="ml-2 text-red-500">
              · deleted {new Date(snapshot.deletedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="flex gap-2 mt-auto">
          {isDeletedView ? (
            <>
              <button
                onClick={onRestore}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-black hover:bg-emerald-100"
              >
                <RotateCcw size={13} />
                Restore
              </button>
              <button
                onClick={onPermanentDelete}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-black hover:bg-red-700"
                title="Permanently delete"
              >
                <Trash size={13} />
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onDuplicate}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-black hover:bg-slate-200"
              >
                <Copy size={13} />
                Duplicate
              </button>
              <button
                onClick={onSoftDelete}
                className="px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100"
                title="Move to Deleted Items"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>

        {status === 'In Production' && !isDeletedView && (
          <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 -mt-1">
            <Hammer size={11} />
            Sent to factory
          </div>
        )}
        {status === 'Completed' && !isDeletedView && (
          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 -mt-1">
            <CheckCircle2 size={11} />
            Completed
          </div>
        )}
      </div>
    </article>
  );
};
