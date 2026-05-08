import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Home } from 'lucide-react';
import { Room } from '../../store/useStore';
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
  'Pooja Room',
  'Utility',
  'Other',
];

interface AddRoomDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (room: Omit<Room, 'id' | 'createdAt'>) => void;
  existingBuildings: string[];
  existingFloors: string[];
  defaultBuilding?: string;
  defaultFloor?: string;
}

export const AddRoomDialog: React.FC<AddRoomDialogProps> = ({
  open,
  onClose,
  onCreate,
  existingBuildings,
  existingFloors,
  defaultBuilding,
  defaultFloor,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('Bedroom');
  const [building, setBuilding] = useState(defaultBuilding || existingBuildings[0] || 'Building 1');
  const [floor, setFloor] = useState(defaultFloor || existingFloors[0] || 'Ground Floor');
  const [newBuilding, setNewBuilding] = useState(false);
  const [newFloor, setNewFloor] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // Suggested name follows the type unless the user has typed their own.
  const [touchedName, setTouchedName] = useState(false);
  useEffect(() => {
    if (!touchedName) setName(type);
  }, [type, touchedName]);

  useEffect(() => {
    if (open) {
      setName(type);
      setTouchedName(false);
      setBuilding(defaultBuilding || existingBuildings[0] || 'Building 1');
      setFloor(defaultFloor || existingFloors[0] || 'Ground Floor');
      setNewBuilding(false);
      setNewFloor(false);
      setTimeout(() => nameRef.current?.focus(), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const buildingOptions = useMemo(() => {
    const set = new Set(existingBuildings);
    set.add('Building 1');
    return Array.from(set);
  }, [existingBuildings]);

  const floorOptions = useMemo(() => {
    const set = new Set([...existingFloors, ...FLOORS]);
    return Array.from(set);
  }, [existingFloors]);

  if (!open) return null;

  const canSubmit = name.trim().length > 0 && building.trim().length > 0 && floor.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onCreate({
      name: name.trim(),
      type,
      building: building.trim(),
      floor: floor.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-[400] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white">
              <Home size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">Add Room</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Add a new room to this project.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="Room Type">
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
              {ROOM_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>

          <Field label="Room Name" required>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setTouchedName(true);
              }}
              placeholder="e.g. Master Bedroom"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Building">
              {newBuilding ? (
                <input
                  type="text"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="Building name"
                  className={inputClass}
                  autoFocus
                />
              ) : (
                <select value={building} onChange={(e) => {
                  if (e.target.value === '__new') {
                    setNewBuilding(true);
                    setBuilding('');
                  } else {
                    setBuilding(e.target.value);
                  }
                }} className={inputClass}>
                  {buildingOptions.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                  <option value="__new">+ New building…</option>
                </select>
              )}
            </Field>

            <Field label="Floor">
              {newFloor ? (
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="Floor name"
                  className={inputClass}
                  autoFocus
                />
              ) : (
                <select value={floor} onChange={(e) => {
                  if (e.target.value === '__new') {
                    setNewFloor(true);
                    setFloor('');
                  } else {
                    setFloor(e.target.value);
                  }
                }} className={inputClass}>
                  {floorOptions.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                  <option value="__new">+ Custom floor…</option>
                </select>
              )}
            </Field>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                'px-5 py-2.5 rounded-xl text-xs font-black text-white',
                canSubmit ? 'bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-100' : 'bg-slate-300 cursor-not-allowed',
              )}
            >
              Add Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const inputClass =
  'w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-400';

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({
  label,
  required,
  children,
}) => (
  <label className="block">
    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5 inline-block">
      {label} {required && <span className="text-teal-600">*</span>}
    </span>
    {children}
  </label>
);
