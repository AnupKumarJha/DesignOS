import type { UnitSystem } from '../store/useStore';

const MM_PER_INCH = 25.4;
const MM_PER_FOOT = 304.8;

export const unitLabel = (unit: UnitSystem) => {
  if (unit === 'feet') return 'ft';
  if (unit === 'inches') return 'in';
  return 'mm';
};

export const toDisplayLength = (mm: number, unit: UnitSystem) => {
  if (unit === 'feet') return mm / MM_PER_FOOT;
  if (unit === 'inches') return mm / MM_PER_INCH;
  return mm;
};

export const fromDisplayLength = (value: number, unit: UnitSystem) => {
  if (unit === 'feet') return value * MM_PER_FOOT;
  if (unit === 'inches') return value * MM_PER_INCH;
  return value;
};

export const formatLength = (mm: number, unit: UnitSystem, compact = true) => {
  const value = toDisplayLength(mm, unit);
  if (unit === 'mm') return `${Math.round(value)} mm`;
  const decimals = compact ? 2 : 3;
  return `${value.toFixed(decimals).replace(/\.?0+$/, '')} ${unitLabel(unit)}`;
};

