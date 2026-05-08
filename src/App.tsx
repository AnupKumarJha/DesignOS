import React from 'react';
import { useStore } from './store/useStore';
import { FloorPlan } from './components/viewport-2d/FloorPlan';
import { Scene3D } from './components/viewport-3d/Scene3D';
import { TopBar } from './components/ui/TopBar';
import { CatalogSidebar } from './components/ui/CatalogSidebar';
import { PropertiesSidebar } from './components/ui/PropertiesSidebar';
import { useKeyboard } from './hooks/useKeyboard';
import { cn } from './lib/utils';

export default function App() {
  const { viewMode, selection } = useStore();
  
  // Register keyboard shortcuts
  useKeyboard();

  return (
    <div className="fixed inset-0 w-full h-screen bg-slate-100 flex flex-col font-sans overflow-hidden select-none">
      <TopBar />

      <main className="flex-1 flex overflow-hidden relative">
        <CatalogSidebar />
        
        <div className="flex-1 relative bg-white overflow-hidden">
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
            <Scene3D />
          </div>

          {/* Canvas Overlay Labels */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none flex flex-col gap-1">
             <div className="flex items-center gap-2 bg-white/60 backdrop-blur px-2 py-0.5 rounded border border-white/40 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Viewport</span>
                <span className="text-[10px] font-bold text-slate-800 uppercase">{viewMode} Mode</span>
             </div>
             <div className="text-[9px] text-slate-400 font-medium px-2">Project Units: 1mm</div>
          </div>
        </div>

        <PropertiesSidebar />
      </main>

      {/* Floating Status Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] pointer-events-none flex items-center gap-2">
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
      </div>
    </div>
  );
}
