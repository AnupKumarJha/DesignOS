import React from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Box,
  ChevronRight,
  Keyboard,
  MousePointer2,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  ZoomIn,
  type LucideIcon,
} from 'lucide-react';
import { useStore, CameraPreset } from '../../store/useStore';
import { cn } from '../../lib/utils';

const views: { id: CameraPreset; label: string; viewMode: '2D' | '3D' }[] = [
  { id: 'FREE', label: 'Free View', viewMode: '3D' },
  { id: 'FRONT', label: 'Front Render View', viewMode: '3D' },
  { id: 'SIDE', label: 'Side Render View', viewMode: '3D' },
  { id: 'FRONT', label: 'Front Elevation', viewMode: '3D' },
  { id: 'SIDE', label: 'Side Elevation', viewMode: '3D' },
  { id: 'ISLAND_FRONT', label: 'Island Front Elevation', viewMode: '3D' },
];

interface ViewportNavigationProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export const ViewportNavigation: React.FC<ViewportNavigationProps> = ({
  collapsed,
  onCollapsedChange,
}) => {
  const {
    activeTool,
    selection,
    furniture,
    walls,
    updateFurniture,
    updateWall,
    cameraPreset,
    setCameraPreset,
    setViewMode,
    presentationMode,
  } = useStore();

  if (presentationMode) return null;

  const nudge = (dx: number, dy: number) => {
    if (!selection) return;
    if (selection.type === 'furniture') {
      const item = furniture.find((f) => f.id === selection.id);
      if (item) updateFurniture(item.id, { position: { x: item.position.x + dx, y: item.position.y + dy } });
    } else if (selection.type === 'wall') {
      const wall = walls.find((w) => w.id === selection.id);
      if (wall) {
        updateWall(wall.id, {
          start: { x: wall.start.x + dx, y: wall.start.y + dy },
          end: { x: wall.end.x + dx, y: wall.end.y + dy },
        });
      }
    }
  };

  const inputMode = activeTool === 'SELECT' ? 'Pan / Select' : activeTool.replace('_', ' ');

  return (
    <>
      <aside
        className={cn(
          'absolute left-0 top-0 bottom-0 z-30 bg-white/92 backdrop-blur border-r border-slate-200 shadow-lg pointer-events-auto flex flex-col transition-[width] duration-200 ease-out',
          collapsed ? 'w-12' : 'w-[260px]',
        )}
        aria-label="Viewport navigation"
      >
        <div
          className={cn(
            'bg-slate-600 text-white font-black text-sm flex items-center',
            collapsed ? 'h-full flex-col px-0 py-3 gap-3' : 'px-4 py-3 justify-between gap-3',
          )}
        >
          {collapsed ? (
            <>
              <button
                onClick={() => onCollapsedChange(false)}
                className="h-8 w-8 rounded-md text-white/90 hover:bg-white/10 hover:text-white flex items-center justify-center"
                title="Expand viewport navigation"
                aria-label="Expand viewport navigation"
              >
                <PanelLeftOpen size={16} />
              </button>
              <div className="h-px w-7 bg-white/20" />
              <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] tracking-widest uppercase whitespace-nowrap">
                Viewport
              </span>
              <ChevronRight size={14} className="mt-auto mb-1 text-white/65" />
            </>
          ) : (
            <>
              <span>Viewport Navigation</span>
              <button
                onClick={() => onCollapsedChange(true)}
                className="h-7 w-7 rounded-md text-white/80 hover:bg-white/10 hover:text-white flex items-center justify-center shrink-0"
                title="Collapse viewport navigation"
                aria-label="Collapse viewport navigation"
              >
                <PanelLeftClose size={15} />
              </button>
            </>
          )}
        </div>

        {!collapsed && (
          <div className="p-4 space-y-5 overflow-y-auto text-slate-700">
            <div>
              <button className="text-[11px] font-bold text-blue-600 underline underline-offset-2">What&apos;s new?</button>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[12px] font-black italic text-slate-500">Input mode:</span>
                <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black uppercase">{inputMode}</span>
              </div>
            </div>

            <Panel title="Zoom Options" icon={ZoomIn}>
              <ActionRow label="Manual" keys="Mouse Scroll" />
              <button onClick={() => window.dispatchEvent(new CustomEvent('design-os:fit-selection'))} className="nav-action">
                <span>To selection</span><kbd>Shift</kbd><span>+</span><kbd>X</kbd>
              </button>
              <button onClick={() => window.dispatchEvent(new CustomEvent('design-os:fit-all'))} className="nav-action">
                <span>To fit all</span><kbd>Shift</kbd><span>+</span><kbd>Z</kbd>
              </button>
            </Panel>

            <NudgeBlock label="Move selected object by 1mm" step={1} onNudge={nudge} disabled={!selection} />
            <NudgeBlock label="Move selected object by 10mm" step={10} onNudge={nudge} disabled={!selection} />

            <Panel title="Global Preferences & Settings" icon={Settings2}>
              <ActionRow label="Project Units" keys="1 mm" />
              <ActionRow label="Selection" keys={selection ? selection.type : 'None'} />
              <ActionRow label="Shortcuts" keys="F, Esc, Arrows" />
            </Panel>
          </div>
        )}
      </aside>

      <div
        className={cn(
          'absolute right-0 bottom-0 z-30 bg-white/92 backdrop-blur border-t border-slate-200 shadow-lg pointer-events-auto flex items-center h-11 overflow-x-auto no-scrollbar transition-[left] duration-200 ease-out',
          collapsed ? 'left-12' : 'left-[260px]',
        )}
      >
        {views.map((view) => (
          <button
            key={`${view.label}-${view.id}`}
            onClick={() => {
              setViewMode(view.viewMode);
              setCameraPreset(view.id);
            }}
            className={cn(
              'h-full px-4 border-r border-slate-200 text-[12px] font-bold flex items-center gap-2 whitespace-nowrap',
              cameraPreset === view.id && view.viewMode === '3D'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-50',
            )}
          >
            <Box size={14} />
            {view.label}
          </button>
        ))}
        <button className="ml-auto h-full px-4 text-slate-500 hover:text-blue-700 hover:bg-blue-50" title="Navigation map">
          <MousePointer2 size={16} />
        </button>
      </div>
    </>
  );
};

const Panel: React.FC<{ title: string; icon: LucideIcon; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <section className="border-t border-slate-200 pt-4">
    <h3 className="text-[12px] font-black text-slate-500 mb-3 flex items-center gap-2">
      <Icon size={14} />
      {title}
    </h3>
    <div className="space-y-2">{children}</div>
  </section>
);

const ActionRow: React.FC<{ label: string; keys: string }> = ({ label, keys }) => (
  <div className="flex items-center justify-between text-[12px] text-slate-500">
    <span>{label}</span>
    <span className="font-bold text-slate-600">{keys}</span>
  </div>
);

const NudgeBlock: React.FC<{
  label: string;
  step: number;
  disabled: boolean;
  onNudge: (dx: number, dy: number) => void;
}> = ({ label, step, disabled, onNudge }) => (
  <Panel title={label} icon={Keyboard}>
    <div className={cn('grid grid-cols-4 gap-2', disabled && 'opacity-40 pointer-events-none')}>
      <NudgeButton icon={ArrowUp} label="Up" onClick={() => onNudge(0, -step)} />
      <NudgeButton icon={ArrowDown} label="Down" onClick={() => onNudge(0, step)} />
      <NudgeButton icon={ArrowLeft} label="Left" onClick={() => onNudge(-step, 0)} />
      <NudgeButton icon={ArrowRight} label="Right" onClick={() => onNudge(step, 0)} />
    </div>
  </Panel>
);

const NudgeButton: React.FC<{ icon: LucideIcon; label: string; onClick: () => void }> = ({
  icon: Icon,
  label,
  onClick,
}) => (
  <button onClick={onClick} className="h-10 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-center" title={label}>
    <Icon size={14} />
  </button>
);
