import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Trash2, Crosshair, Check, X as XIcon } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

interface FloorPlanImportPanelProps {
  /** Calibration mode is owned by FloorPlan (it captures clicks). This panel
   * just toggles it and shows guidance. */
  calibrationMode: boolean;
  onStartCalibration: () => void;
  onCancelCalibration: () => void;
  onCommitCalibration: (mm: number) => void;
  calibrationPointsCount: number;
}

/**
 * Floating bottom-right panel in the 2D floor plan that lets the user
 * import a reference image (architect's plan), adjust opacity, calibrate
 * scale, and remove the plan.
 */
export const FloorPlanImportPanel: React.FC<FloorPlanImportPanelProps> = ({
  calibrationMode,
  onStartCalibration,
  onCancelCalibration,
  onCommitCalibration,
  calibrationPointsCount,
}) => {
  const { rooms, currentRoomId, updateRoomBackground } = useStore();
  const room = rooms.find((r) => r.id === currentRoomId);
  const plan = room?.backgroundPlan ?? null;
  const fileRef = useRef<HTMLInputElement>(null);
  const [calibInput, setCalibInput] = useState('');

  if (!room) return null;

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const probe = new Image();
      probe.onload = () => {
        // Default scale: 1mm per pixel until calibrated. Position image
        // centered around world origin so it's visible.
        const w = probe.naturalWidth;
        const h = probe.naturalHeight;
        updateRoomBackground(currentRoomId, {
          imageUrl: dataUrl,
          opacity: 0.45,
          mmPerPixel: 5,
          originX: -(w * 5) / 2,
          originY: -(h * 5) / 2,
          naturalWidth: w,
          naturalHeight: h,
        });
      };
      probe.src = dataUrl;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const removePlan = () => {
    if (window.confirm('Remove the reference floor plan from this room?')) {
      updateRoomBackground(currentRoomId, null);
    }
  };

  const updateOpacity = (opacity: number) => {
    if (!plan) return;
    updateRoomBackground(currentRoomId, { ...plan, opacity });
  };

  const calibrationStep =
    !calibrationMode
      ? 'idle'
      : calibrationPointsCount === 0
      ? 'click1'
      : calibrationPointsCount === 1
      ? 'click2'
      : 'enter';

  return (
    <div className="absolute bottom-20 right-4 z-30 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
        <ImageIcon size={14} className="text-blue-600" />
        <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
          Reference Plan
        </h3>
      </div>

      {!plan ? (
        <div className="p-4 space-y-3">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Import the architect's floor plan as a tracing layer. Then calibrate the scale
            so your walls match the real dimensions.
          </p>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full px-3 py-2.5 rounded-xl bg-blue-600 text-white text-[11px] font-black hover:bg-blue-700"
          >
            Upload PNG / JPG
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      ) : calibrationMode ? (
        <div className="p-4 space-y-3 bg-cyan-50/30">
          <div className="text-[10px] font-black text-cyan-700 uppercase tracking-widest">
            Calibration · Step {calibrationPointsCount + 1} of 3
          </div>
          {calibrationStep === 'click1' && (
            <p className="text-[11px] text-slate-700 leading-relaxed">
              <strong className="text-cyan-700">Step 1:</strong> Click the first end of a known dimension on the plan
              (e.g. one edge of a labeled wall).
            </p>
          )}
          {calibrationStep === 'click2' && (
            <p className="text-[11px] text-slate-700 leading-relaxed">
              <strong className="text-cyan-700">Step 2:</strong> Click the other end of the same dimension.
            </p>
          )}
          {calibrationStep === 'enter' && (
            <>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                <strong className="text-cyan-700">Step 3:</strong> Enter the real-world distance between the two clicked points.
              </p>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">
                  Distance (mm)
                </span>
                <input
                  autoFocus
                  type="number"
                  value={calibInput}
                  onChange={(e) => setCalibInput(e.target.value)}
                  placeholder="e.g. 4000"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400"
                />
              </label>
            </>
          )}
          <div className="flex gap-2">
            <button
              onClick={onCancelCalibration}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black hover:bg-slate-200 flex items-center justify-center gap-1"
            >
              <XIcon size={12} />
              Cancel
            </button>
            {calibrationStep === 'enter' && (
              <button
                onClick={() => {
                  const mm = Number(calibInput);
                  if (mm > 0) {
                    onCommitCalibration(mm);
                    setCalibInput('');
                  }
                }}
                disabled={!calibInput || Number(calibInput) <= 0}
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg text-white text-[10px] font-black flex items-center justify-center gap-1',
                  calibInput && Number(calibInput) > 0
                    ? 'bg-cyan-600 hover:bg-cyan-700'
                    : 'bg-slate-300 cursor-not-allowed',
                )}
              >
                <Check size={12} />
                Apply
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Opacity
              </span>
              <span className="text-[10px] font-black text-slate-700">
                {Math.round(plan.opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={plan.opacity}
              onChange={(e) => updateOpacity(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold uppercase tracking-widest text-slate-400">Scale</span>
            <span className="font-black text-slate-700">
              {plan.mmPerPixel.toFixed(2)} mm/px
            </span>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={onStartCalibration}
              className="flex-1 px-3 py-2 rounded-lg bg-cyan-600 text-white text-[10px] font-black hover:bg-cyan-700 flex items-center justify-center gap-1.5"
            >
              <Crosshair size={12} />
              Calibrate
            </button>
            <button
              onClick={removePlan}
              className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
              title="Remove plan"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
