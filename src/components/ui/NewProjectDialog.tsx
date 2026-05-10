import React, { useEffect, useRef, useState } from 'react';
import { X, FolderPlus, BedDouble, CookingPot, Home, Image, Sofa } from 'lucide-react';
import { ProjectMeta, ProjectType } from '../../store/useStore';
import { cn } from '../../lib/utils';

const FLOORS = [
  'Basement',
  'Ground Floor',
  '1st Floor',
  '2nd Floor',
  '3rd Floor',
  '4th Floor',
  '5th Floor',
  'Terrace',
];

const ROOM_TYPES = [
  'Kitchen',
  'Living Room',
  'Bedroom',
  'Master Bedroom',
  'Bathroom',
  'Dining Room',
  'Home Office',
  'Balcony',
  'Foyer',
  'Other',
];

interface NewProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (meta: Partial<ProjectMeta>) => void;
}

export const NewProjectDialog: React.FC<NewProjectDialogProps> = ({ open, onClose, onCreate }) => {
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('Residential');
  const [building, setBuilding] = useState('Building 1');
  const [floor, setFloor] = useState('Ground Floor');
  const [room, setRoom] = useState('Kitchen');
  const [template, setTemplate] = useState('Kitchen Starter');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setProjectName('');
      setClientName('');
      setProjectType('Residential');
      setBuilding('Building 1');
      setFloor('Ground Floor');
      setRoom('Kitchen');
      setTemplate('Kitchen Starter');
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const canSubmit = projectName.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onCreate({
      projectName: projectName.trim(),
      clientName: clientName.trim(),
      projectType,
      building: building.trim() || 'Building 1',
      floor,
      room,
      clientDetails: template,
    });
  };

  const templates = [
    { id: 'Kitchen Starter', label: 'Kitchen', icon: CookingPot, room: 'Kitchen' },
    { id: 'Bedroom Starter', label: 'Bedroom', icon: BedDouble, room: 'Bedroom' },
    { id: 'Living Starter', label: 'Living', icon: Sofa, room: 'Living Room' },
    { id: 'Empty Room', label: 'Empty Room', icon: Home, room: 'Other' },
    { id: 'Imported Plan', label: 'Imported Plan', icon: Image, room: 'Other' },
  ];

  return (
    <div
      className="fixed inset-0 z-[400] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <FolderPlus size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">New Project</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Set up the project details to get started.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-all"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="Template Selection">
            <div className="grid grid-cols-5 gap-2">
              {templates.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTemplate(item.id);
                    setRoom(item.room);
                  }}
                  className={cn(
                    'h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-1 text-[10px] font-black transition-all',
                    template === item.id
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                  )}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Project Name" required>
            <input
              ref={nameInputRef}
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Sharma Residence"
              className={inputClass}
            />
          </Field>

          <Field label="Client Name">
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Mr. Sharma"
              className={inputClass}
            />
          </Field>

          <Field label="Project Type">
            <div className="grid grid-cols-2 gap-2">
              {(['Residential', 'Commercial'] as ProjectType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setProjectType(type)}
                  className={cn(
                    'px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all',
                    projectType === type
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Building Name">
            <input
              type="text"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              placeholder="Building 1"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Floor">
              <select
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className={inputClass}
              >
                {FLOORS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Room Type">
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className={inputClass}
              >
                {ROOM_TYPES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                'px-5 py-2.5 rounded-xl text-xs font-black text-white transition-all',
                canSubmit
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200'
                  : 'bg-slate-300 cursor-not-allowed',
              )}
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const inputClass =
  'w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all';

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({
  label,
  required,
  children,
}) => (
  <label className="block">
    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5 inline-block">
      {label} {required && <span className="text-blue-600">*</span>}
    </span>
    {children}
  </label>
);
