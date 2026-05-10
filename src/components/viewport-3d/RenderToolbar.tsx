import React from 'react';
import { Camera, Download, Eye, EyeOff, Gauge, Home, X, type LucideIcon } from 'lucide-react';
import {
  RenderCameraPreset,
  RenderQuality,
  RenderRoomType,
  useStore,
} from '../../store/useStore';
import { cn } from '../../lib/utils';

interface RenderToolbarProps {
  onCapture: () => void;
}

const cameraPresets: RenderCameraPreset[] = ['Wide Interior', 'Eye Level', 'Corner View', 'Ceiling View', 'Furniture Focus'];
const roomTypes: RenderRoomType[] = ['Auto', 'Kitchen', 'Master Bedroom', 'Bedroom', 'Hall', 'Dining', 'Bathroom', 'Office', 'Foyer', 'Balcony'];
const qualities: RenderQuality[] = ['Preview', 'High'];

export const RenderToolbar: React.FC<RenderToolbarProps> = ({ onCapture }) => {
  const {
    setPresentationMode,
    renderCameraPreset,
    setRenderCameraPreset,
    activeRenderRoomType,
    setActiveRenderRoomType,
    renderQuality,
    setRenderQuality,
    showCeiling,
    showDecor,
    showLights,
    setShowCeiling,
    setShowDecor,
    setShowLights,
  } = useStore();

  return (
    <div className="absolute inset-x-5 top-5 z-40 pointer-events-none">
      <div className="pointer-events-auto rounded-2xl bg-slate-950/78 text-white shadow-2xl border border-white/10 backdrop-blur-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-200 flex items-center justify-center">
            <Camera size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black tracking-tight">Render View</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-300">Whole-home visualization · realtime + still export</div>
          </div>
          <button
            onClick={() => setPresentationMode(false)}
            className="ml-auto p-2 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"
            title="Exit render view"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <Segment label="Room" icon={Home}>
            {roomTypes.map((room) => (
              <button
                key={room}
                onClick={() => setActiveRenderRoomType(room)}
                className={pill(activeRenderRoomType === room)}
              >
                {room}
              </button>
            ))}
          </Segment>

          <Segment label="Camera" icon={Camera}>
            {cameraPresets.map((preset) => (
              <button
                key={preset}
                onClick={() => setRenderCameraPreset(preset)}
                className={pill(renderCameraPreset === preset)}
              >
                {preset}
              </button>
            ))}
          </Segment>

          <Segment label="Quality" icon={Gauge}>
            {qualities.map((quality) => (
              <button
                key={quality}
                onClick={() => setRenderQuality(quality)}
                className={pill(renderQuality === quality)}
              >
                {quality}
              </button>
            ))}
          </Segment>

          <div className="ml-auto flex items-center gap-2">
            <Toggle label="Ceiling" enabled={showCeiling} onClick={() => setShowCeiling(!showCeiling)} />
            <Toggle label="Lights" enabled={showLights} onClick={() => setShowLights(!showLights)} />
            <Toggle label="Decor" enabled={showDecor} onClick={() => setShowDecor(!showDecor)} />
            <button
              onClick={onCapture}
              className="h-9 px-3 rounded-lg bg-amber-400 text-slate-950 text-[11px] font-black flex items-center gap-2 hover:bg-amber-300"
            >
              <Download size={14} />
              PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Segment: React.FC<{ label: string; icon: LucideIcon; children: React.ReactNode }> = ({
  label,
  icon: Icon,
  children,
}) => (
  <div className="flex items-center gap-1.5">
    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-300 mr-1">
      <Icon size={12} />
      {label}
    </span>
    <div className="flex items-center gap-1 rounded-lg bg-white/8 p-1">{children}</div>
  </div>
);

const Toggle: React.FC<{ label: string; enabled: boolean; onClick: () => void }> = ({
  label,
  enabled,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={cn(
      'h-9 px-3 rounded-lg text-[11px] font-black flex items-center gap-1.5 border',
      enabled
        ? 'bg-white/12 border-white/20 text-white'
        : 'bg-transparent border-white/10 text-slate-400',
    )}
  >
    {enabled ? <Eye size={13} /> : <EyeOff size={13} />}
    {label}
  </button>
);

function pill(active: boolean) {
  return cn(
    'px-2.5 py-1.5 rounded-md text-[10px] font-black whitespace-nowrap transition-all',
    active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white',
  );
}
