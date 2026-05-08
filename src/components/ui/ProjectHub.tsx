import React, { useEffect, useMemo, useState } from 'react';
import { Box, Clock, Copy, FolderOpen, Plus, Search, Trash2 } from 'lucide-react';
import { useStore, DesignSnapshot } from '../../store/useStore';
import { deleteProject, loadProjects, saveProjects } from '../../lib/persistence';
import { cn } from '../../lib/utils';

const blankSnapshot = (base: DesignSnapshot): DesignSnapshot => ({
  ...base,
  project: {
    ...base.project,
    id: crypto.randomUUID(),
    projectName: 'Untitled Project',
    clientName: '',
    clientDetails: '',
    projectId: `PN-${Math.floor(10000 + Math.random() * 90000)}`,
    room: 'Kitchen',
    status: 'Design Phase',
    updatedAt: new Date().toISOString(),
  },
  walls: [],
  openings: [],
  furniture: [],
});

export const ProjectHub: React.FC = () => {
  const { savedProjects, setSavedProjects, loadSnapshot, getSnapshot } = useStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    setSavedProjects(loadProjects());
  }, [setSavedProjects]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return savedProjects;
    return savedProjects.filter((snapshot) => {
      const project = snapshot.project;
      return [project.projectName, project.clientName, project.projectId, project.room]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [query, savedProjects]);

  const startBlank = () => {
    const snapshot = blankSnapshot(getSnapshot());
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
    };
    const next = [duplicated, ...savedProjects];
    saveProjects(next);
    setSavedProjects(next);
  };

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

        {['Recently Accessed', 'All Projects', 'Deleted Items', 'Production Designs'].map((item, index) => (
          <button
            key={item}
            className={cn(
              'w-full text-left px-3 py-2 rounded-lg text-xs font-bold mb-1 transition-all',
              index === 0 ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            )}
          >
            {item}
          </button>
        ))}

        <div className="mt-auto text-[10px] text-slate-500 leading-relaxed">
          Local MVP storage is active. Backend auth, billing, and collaboration can be added after the design schema stabilizes.
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Project Hub</h1>
            <p className="text-sm text-slate-500 mt-1">Create, reopen, duplicate, and manage local design projects.</p>
          </div>
          <button
            onClick={startBlank}
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
            <h2 className="font-black text-slate-700">No saved projects yet</h2>
            <p className="text-sm text-slate-500 mt-2">Start a blank project, save it from the top bar, and it will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((snapshot) => (
              <article key={snapshot.project.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => loadSnapshot(snapshot)}
                  className="w-full h-36 bg-slate-200 relative text-left overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-300" />
                  <div className="absolute inset-x-5 bottom-5">
                    <div className="text-xs font-black text-slate-500 uppercase tracking-widest">{snapshot.project.room}</div>
                    <div className="text-lg font-black text-slate-900 truncate">{snapshot.project.projectName}</div>
                  </div>
                </button>
                <div className="p-5">
                  <div className="text-sm font-bold text-slate-700">{snapshot.project.clientName || 'No client assigned'}</div>
                  <div className="text-[11px] text-slate-400 font-bold mt-1">{snapshot.project.projectId} · {snapshot.project.status}</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-4">
                    <Clock size={12} />
                    {new Date(snapshot.project.updatedAt).toLocaleString()}
                  </div>
                  <div className="flex gap-2 mt-5">
                    <button
                      onClick={() => duplicateProject(snapshot)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-black hover:bg-slate-200"
                    >
                      <Copy size={13} />
                      Duplicate
                    </button>
                    <button
                      onClick={() => setSavedProjects(deleteProject(snapshot.project.id))}
                      className="px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100"
                      title="Delete project"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
