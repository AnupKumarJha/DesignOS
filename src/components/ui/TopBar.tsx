import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore as useZustandStore } from 'zustand';
import { useStore } from '../../store/useStore';
import {
  Home,
  ChevronRight,
  Share2,
  Maximize2,
  Minimize2,
  Settings,
  Box,
  Layout,
  Columns2,
  Undo2,
  Redo2,
  FileText,
  X,
  Download,
  Save,
  Upload,
  FolderOpen,
  Trash2,
  Plus,
  Check,
  Cloud,
  CloudOff,
  Loader2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { downloadJson, readJsonFile, upsertProject } from '../../lib/persistence';
import { AddRoomDialog } from './AddRoomDialog';
import { QuotationModal } from './QuotationModal';
import { GlobalSettingsModal } from './GlobalSettingsModal';

export const TopBar: React.FC = () => {
  const {
    viewMode,
    setViewMode,
    cameraPreset,
    setCameraPreset,
    workspaceMode,
    setWorkspaceMode,
    project,
    updateProject,
    setSavedProjects,
    getSnapshot,
    loadSnapshot,
    clearAll,
    rooms,
    currentRoomId,
    setCurrentRoom,
    addRoom,
    removeRoom,
    saveStatus,
  } = useStore();
  const { undo, redo, pastStates, futureStates } = useZustandStore(useStore.temporal, (state: any) => state);
  const [showQuotation, setShowQuotation] = useState(false);
  const [showProjectEditor, setShowProjectEditor] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [roomMenuOpen, setRoomMenuOpen] = useState(false);
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const roomMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const currentRoom = rooms.find((r) => r.id === currentRoomId) ?? rooms[0];

  const existingBuildings = useMemo(
    () => Array.from(new Set(rooms.map((r) => r.building))),
    [rooms],
  );
  const existingFloors = useMemo(
    () => Array.from(new Set(rooms.map((r) => r.floor))),
    [rooms],
  );

  // Group rooms by building > floor for the picker menu.
  const groupedRooms = useMemo(() => {
    const map: Record<string, Record<string, typeof rooms>> = {};
    rooms.forEach((r) => {
      if (!map[r.building]) map[r.building] = {};
      if (!map[r.building][r.floor]) map[r.building][r.floor] = [];
      map[r.building][r.floor].push(r);
    });
    return map;
  }, [rooms]);

  useEffect(() => {
    if (!roomMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (roomMenuRef.current && !roomMenuRef.current.contains(e.target as Node)) {
        setRoomMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [roomMenuOpen]);

  const menuItems = [
    'Home', 'View', 'Insert', 'Draw', 'Architecture', 'Annotate', 'Render', 'Outputs'
  ];

  const saveCurrentProject = () => {
    const next = upsertProject(getSnapshot());
    setSavedProjects(next);
  };

  const importProject = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const snapshot = await readJsonFile(file);
    loadSnapshot(snapshot);
    event.target.value = '';
  };

  return (
    <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between gap-2 px-3 z-[100] select-none whitespace-nowrap min-w-0">
      <QuotationModal open={showQuotation} onClose={() => setShowQuotation(false)} />
      <GlobalSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {showProjectEditor && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-8">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800">Project Details</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Workspace metadata</p>
              </div>
              <button onClick={() => setShowProjectEditor(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                ['projectName', 'Project Name'],
                ['clientName', 'Client Name'],
                ['projectId', 'Project ID'],
                ['building', 'Building'],
                ['floor', 'Floor'],
                ['room', 'Room'],
                ['status', 'Status'],
                ['clientDetails', 'Client Details'],
              ].map(([key, label]) => (
                <label key={key} className={cn('space-y-1.5', key === 'clientDetails' && 'col-span-2')}>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-black">{label}</span>
                  <input
                    value={(project as any)[key] || ''}
                    onChange={(event) => updateProject({ [key]: event.target.value } as any)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold outline-none focus:border-blue-400 focus:bg-white"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Left: Brand & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0 shrink">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <Layout size={14} className="text-white" />
          </div>
          <span className="font-bold text-slate-800 text-sm tracking-tight italic">
            Design <span className="font-normal text-slate-400 not-italic">OS</span>
          </span>
        </div>

        <div className="h-4 w-[1px] bg-slate-200" />

        <div className="flex items-center gap-2">
           <button 
             onClick={undo}
             disabled={pastStates.length === 0}
             className="p-1.5 text-slate-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-500 transition-all"
           >
             <Undo2 size={16} />
           </button>
           <button 
             onClick={redo}
             disabled={futureStates.length === 0}
             className="p-1.5 text-slate-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-500 transition-all"
           >
             <Redo2 size={16} />
           </button>
        </div>

        <div className="h-4 w-[1px] bg-slate-200" />

        <div className="hidden md:flex items-center gap-1 text-xs text-slate-500 font-medium relative min-w-0" ref={roomMenuRef}>
          <Home size={14} className="shrink-0" />
          <ChevronRight size={12} className="text-slate-300 shrink-0" />
          <button onClick={() => setWorkspaceMode('DASHBOARD')} className="hover:text-blue-600 cursor-pointer transition-colors px-1 truncate max-w-[120px]" title={project.projectName}>
            {workspaceMode === 'DASHBOARD' ? 'Project Hub' : project.projectName}
          </button>
          <ChevronRight size={12} className="text-slate-300 shrink-0 hidden xl:inline-block" />
          <span className="hidden xl:inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded truncate max-w-[100px]" title={currentRoom?.building ?? project.building}>{currentRoom?.building ?? project.building}</span>
          <ChevronRight size={12} className="text-slate-300 shrink-0 hidden xl:inline-block" />
          <span className="hidden xl:inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded truncate max-w-[100px]" title={currentRoom?.floor ?? project.floor}>{currentRoom?.floor ?? project.floor}</span>
          <ChevronRight size={12} className="text-slate-300 shrink-0" />
          <button
            onClick={() => setRoomMenuOpen((v) => !v)}
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded transition-all shrink-0',
              roomMenuOpen
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
            )}
            title="Switch room"
          >
            <span className="font-bold truncate max-w-[100px]">{currentRoom?.name ?? project.room}</span>
            <ChevronRight size={10} className={cn('rotate-90 transition-transform shrink-0', roomMenuOpen && '-rotate-90')} />
          </button>

          {roomMenuOpen && (
            <div
              className="absolute top-full mt-2 left-0 z-[150] w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rooms</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{rooms.length} room{rooms.length !== 1 ? 's' : ''} in this project</div>
              </div>
              <div className="max-h-72 overflow-y-auto py-2">
                {Object.entries(groupedRooms).map(([building, floors]) => (
                  <div key={building} className="mb-2">
                    <div className="px-4 pt-2 pb-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {building}
                    </div>
                    {Object.entries(floors).map(([floor, floorRooms]) => (
                      <div key={floor}>
                        <div className="px-4 pb-1 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                          {floor}
                        </div>
                        {floorRooms.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => {
                              setCurrentRoom(r.id);
                              setRoomMenuOpen(false);
                            }}
                            className={cn(
                              'w-full px-4 py-2 flex items-center justify-between text-left hover:bg-slate-50 transition-colors',
                              r.id === currentRoomId && 'bg-blue-50',
                            )}
                          >
                            <div className="flex flex-col">
                              <span className={cn(
                                'text-[12px] font-bold',
                                r.id === currentRoomId ? 'text-blue-700' : 'text-slate-700',
                              )}>{r.name}</span>
                              <span className="text-[10px] text-slate-400">{r.type}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {r.id === currentRoomId && <Check size={14} className="text-blue-600" />}
                              {rooms.length > 1 && r.id !== currentRoomId && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Delete "${r.name}" and all its walls/furniture?`)) {
                                      removeRoom(r.id);
                                    }
                                  }}
                                  className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded"
                                  title="Delete room"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setRoomMenuOpen(false);
                  setAddRoomOpen(true);
                }}
                className="w-full px-4 py-3 border-t border-slate-100 bg-slate-50/50 hover:bg-slate-100 flex items-center justify-center gap-2 text-[11px] font-black text-blue-600"
              >
                <Plus size={14} />
                Add Room
              </button>
            </div>
          )}
        </div>
      </div>

      <AddRoomDialog
        open={addRoomOpen}
        onClose={() => setAddRoomOpen(false)}
        onCreate={(room) => {
          addRoom(room);
          setAddRoomOpen(false);
        }}
        existingBuildings={existingBuildings}
        existingFloors={existingFloors}
        defaultBuilding={currentRoom?.building}
        defaultFloor={currentRoom?.floor}
      />

      {/* Center: Menu Items */}
      <nav className="hidden 2xl:flex items-center gap-1 shrink-0">
        {menuItems.map((item) => (
          <button 
            key={item}
            onClick={() => {
              if (item === 'Outputs') setShowQuotation(true);
            }}
            className={cn(
              "px-3 py-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 transition-all rounded",
              item === 'Outputs' && "text-blue-600 font-bold bg-blue-50"
            )}
          >
            {item}
          </button>
        ))}
      </nav>

      {/* Right: Mode Toggles & Global Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center p-0.5 bg-slate-100/80 rounded-lg border border-slate-200 shadow-sm">
          <button
            onClick={() => setViewMode('2D')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all",
              viewMode === '2D' 
                ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                : "text-slate-500 hover:bg-white"
            )}
          >
            <Layout size={12} />
            <span>2D</span>
          </button>
          <button
            onClick={() => setViewMode('3D')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all",
              viewMode === '3D' 
                ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                : "text-slate-500 hover:bg-white"
            )}
          >
            <Box size={12} />
            <span>3D</span>
          </button>
          <button
            onClick={() => setViewMode('SPLIT')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all",
              viewMode === 'SPLIT' 
                ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                : "text-slate-500 hover:bg-white"
            )}
          >
            <Columns2 size={12} />
            <span>Split</span>
          </button>
        </div>

        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Full Screen (F or Esc)' : 'Enter Full Screen (press F)'}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all shadow-sm shrink-0',
            isFullscreen
              ? 'bg-blue-600 border-blue-600 text-white shadow-blue-200'
              : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600',
          )}
        >
          {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          <span className="hidden xl:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
        </button>

        <div className="hidden 2xl:flex items-center p-0.5 bg-slate-100/80 rounded-lg border border-slate-200 shadow-sm shrink-0">
          {[
            ['FREE', 'Free'],
            ['TOP', 'Top'],
            ['FRONT', 'Front'],
            ['SIDE', 'Side'],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setCameraPreset(id as any)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-black transition-all",
                cameraPreset === id ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:bg-white"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="h-4 w-[1px] bg-slate-200" />

        {/* Auto-save indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-bold text-slate-400 px-2 py-1 rounded bg-slate-50 border border-slate-200 shrink-0 whitespace-nowrap" title="Local storage status">
          {saveStatus === 'saving' ? (
            <>
              <Loader2 size={11} className="animate-spin text-blue-500" />
              <span className="text-blue-600">Saving…</span>
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <Cloud size={11} className="text-emerald-500" />
              <span className="text-emerald-600">Saved</span>
            </>
          ) : (
            <>
              <CloudOff size={11} />
              <span>Auto-save</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={saveCurrentProject} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition-all" title="Save now">
            <Save size={16} />
          </button>
          <button onClick={() => downloadJson(getSnapshot())} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition-all" title="Export JSON">
            <Download size={16} />
          </button>
          <label className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition-all cursor-pointer" title="Import JSON">
            <Upload size={16} />
            <input type="file" accept="application/json" className="hidden" onChange={importProject} />
          </label>
          <button onClick={() => setWorkspaceMode('DASHBOARD')} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition-all" title="Open Project Hub">
            <FolderOpen size={16} />
          </button>
          <button onClick={clearAll} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all" title="Clear Project">
            <Trash2 size={16} />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition-all" title="Share">
            <Share2 size={16} />
          </button>
          <button
            onClick={() => setShowQuotation(true)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-all" title="Quotation"
          >
            <FileText size={16} />
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition-all"
            title="Global Settings"
          >
            <Settings size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
           <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700 shadow-inner">
             AG
           </div>
        </div>
      </div>
    </div>
  );
};
