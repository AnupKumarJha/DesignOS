import React, { useEffect, useRef } from 'react';
import { useStore as useZustandStore } from 'zustand';
import { useStore } from './store/useStore';
import { FloorPlan } from './components/viewport-2d/FloorPlan';
import { Scene3D } from './components/viewport-3d/Scene3D';
import { TopBar } from './components/ui/TopBar';
import { CatalogSidebar } from './components/ui/CatalogSidebar';
import { PropertiesSidebar } from './components/ui/PropertiesSidebar';
import { ProjectHub } from './components/ui/ProjectHub';
import { BottomMaterialDrawer } from './components/ui/BottomMaterialDrawer';
import { InfurniaRibbon } from './components/ui/InfurniaRibbon';
import { ViewportNavigation } from './components/ui/ViewportNavigation';
import { OutputsCenter } from './components/ui/OutputsCenter';
import { CatalogAdminModal } from './components/ui/CatalogAdminModal';
import { useKeyboard } from './hooks/useKeyboard';
import { cn } from './lib/utils';
import {
  bootstrapProjects,
  autoSaveSnapshot,
  setLastOpenedProject,
  getLastOpenedProject,
} from './lib/persistence';
import { getCustomCatalogItems } from './lib/db';

export default function App() {
  const { viewMode, selection, workspaceMode, cameraPreset, presentationMode } = useStore();
  const { undo, redo } = useZustandStore(useStore.temporal, (state: any) => state);
  const [outputsOpen, setOutputsOpen] = React.useState(false);
  const [catalogAdminOpen, setCatalogAdminOpen] = React.useState(false);
  const [viewportNavCollapsed, setViewportNavCollapsed] = React.useState(false);

  // Register keyboard shortcuts
  useKeyboard();

  useEffect(() => {
    const onUndo = () => undo();
    const onRedo = () => redo();
    window.addEventListener('design-os:undo', onUndo);
    window.addEventListener('design-os:redo', onRedo);
    return () => {
      window.removeEventListener('design-os:undo', onUndo);
      window.removeEventListener('design-os:redo', onRedo);
    };
  }, [undo, redo]);

  // Bootstrap: load IndexedDB into Zustand cache, restore last project
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const projects = await bootstrapProjects();
      const customCatalog = await getCustomCatalogItems();
      if (cancelled) return;
      const store = useStore.getState();
      store.setSavedProjects(projects);
      store.setCustomCatalogItems(customCatalog);

      const lastId = await getLastOpenedProject();
      if (cancelled || !lastId) return;
      const last = projects.find((p) => p.project.id === lastId && !p.deletedAt);
      if (last) store.loadSnapshot(last);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-save: subscribe to design-state changes and persist after 800ms of
  // inactivity. Skips while on the Project Hub (nothing meaningful in flight).
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const unsub = useStore.subscribe((state, prev) => {
      // Only persist when meaningful design state actually changed.
      const designChanged =
        state.walls !== prev.walls ||
        state.openings !== prev.openings ||
        state.furniture !== prev.furniture ||
        state.rooms !== prev.rooms ||
        state.currentRoomId !== prev.currentRoomId ||
        state.project !== prev.project;
      if (!designChanged) return;
      if (state.workspaceMode !== 'DESIGN') return;

      state.setSaveStatus('saving');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          const snapshot = useStore.getState().getSnapshot();
          await autoSaveSnapshot(snapshot);
          await setLastOpenedProject(snapshot.project.id);
          // Re-read snapshot list back into Zustand so Project Hub stays in sync.
          const fresh = useStore.getState().savedProjects;
          const replaced = [
            snapshot,
            ...fresh.filter((p) => p.project.id !== snapshot.project.id),
          ];
          useStore.getState().setSavedProjects(replaced);
          useStore.getState().setSaveStatus('saved');
          setTimeout(() => {
            if (useStore.getState().saveStatus === 'saved') {
              useStore.getState().setSaveStatus('idle');
            }
          }, 1500);
        } catch (err) {
          console.error('Auto-save failed:', err);
          useStore.getState().setSaveStatus('idle');
        }
      }, 800);
    });
    return () => {
      unsub();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-screen bg-slate-100 flex flex-col font-sans overflow-hidden select-none">
      {workspaceMode === 'DASHBOARD' && <ProjectHub />}
      {!presentationMode && <TopBar />}
      {workspaceMode === 'DESIGN' && !presentationMode && (
        <InfurniaRibbon
          onOpenOutputs={() => setOutputsOpen(true)}
          onOpenCatalogAdmin={() => setCatalogAdminOpen(true)}
        />
      )}
      <OutputsCenter open={outputsOpen} onClose={() => setOutputsOpen(false)} />
      <CatalogAdminModal open={catalogAdminOpen} onClose={() => setCatalogAdminOpen(false)} />

      <main className="flex-1 flex overflow-hidden relative">
        {!presentationMode && <CatalogSidebar />}
        
        <div className={cn(
          "flex-1 relative bg-white overflow-hidden",
          viewMode === 'SPLIT' && "grid grid-cols-2 gap-px bg-slate-200"
        )}>
          {viewMode === 'SPLIT' ? (
            <>
              <div className="relative bg-white overflow-hidden">
                <FloorPlan />
              </div>
              <div className="relative bg-white overflow-hidden">
                <Scene3D cameraPreset={cameraPreset} />
              </div>
            </>
          ) : (
            <>
              <div className={cn(
                "absolute inset-0 transition-opacity duration-300",
                viewMode === '2D' ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              )}>
                <FloorPlan />
              </div>
              
              <div className={cn(
                "absolute inset-0 transition-opacity duration-300",
                viewMode === '3D' ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              )}>
                <Scene3D cameraPreset={cameraPreset} />
              </div>
            </>
          )}

          {workspaceMode === 'DESIGN' && (
            <ViewportNavigation
              collapsed={viewportNavCollapsed}
              onCollapsedChange={setViewportNavCollapsed}
            />
          )}

          {/* Canvas Overlay Labels */}
          {!presentationMode && <div
            className="absolute top-4 z-20 pointer-events-none flex flex-col gap-1 transition-[left] duration-200 ease-out"
            style={{ left: viewportNavCollapsed ? 64 : 276 }}
          >
             <div className="flex items-center gap-2 bg-white/60 backdrop-blur px-2 py-0.5 rounded border border-white/40 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Viewport</span>
                <span className="text-[10px] font-bold text-slate-800 uppercase">{viewMode} Mode</span>
             </div>
             <div className="text-[9px] text-slate-400 font-medium px-2">Project Units: 1mm · Camera: {cameraPreset}</div>
          </div>}
        </div>

        {!presentationMode && <PropertiesSidebar />}
      </main>

      {!presentationMode && <BottomMaterialDrawer />}

      {/* Floating Status Bar */}
      {!presentationMode && <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-[60] pointer-events-none flex items-center gap-2">
        <div className="bg-slate-900/90 text-white backdrop-blur-md px-4 py-2 rounded-full border border-slate-700 shadow-2xl flex items-center gap-6">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Live Client Connected</span>
           </div>
           <div className="w-px h-3 bg-slate-700" />
           <div className="text-[10px] text-slate-400 font-medium tracking-tight">
             {selection ? `Selected: ${selection.type.toUpperCase()}` : 'Select a component to edit'}
           </div>
        </div>
      </div>}
    </div>
  );
}
