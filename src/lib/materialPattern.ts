import type { CSSProperties } from 'react';
import { MaterialItem } from '../data/catalog';

/**
 * Generates a CSS background style for a material swatch, based on its
 * pattern type. Stylized (not photo-real) — meant to visually distinguish
 * categories until real photo textures land in M1b.
 */
export function getPatternStyle(material: MaterialItem | undefined): CSSProperties {
  if (!material) return {};
  if (material.imageUrl) {
    return {
      backgroundImage: `url(${material.imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  const c = material.color;
  const dark = darken(c, 0.18);
  const light = lighten(c, 0.12);

  switch (material.pattern) {
    case 'wood':
      return {
        backgroundColor: c,
        backgroundImage: `repeating-linear-gradient(
          90deg,
          ${dark} 0px,
          ${c} 2px,
          ${light} 4px,
          ${c} 7px,
          ${dark} 10px,
          ${c} 14px
        )`,
      };
    case 'marble':
      return {
        backgroundColor: c,
        backgroundImage: `
          radial-gradient(ellipse at 20% 30%, ${light} 0%, transparent 50%),
          radial-gradient(ellipse at 70% 60%, ${dark} 0%, transparent 50%),
          radial-gradient(ellipse at 40% 80%, ${light} 0%, transparent 40%)
        `,
      };
    case 'fabric':
      return {
        backgroundColor: c,
        backgroundImage: `
          linear-gradient(45deg, ${dark} 25%, transparent 25%, transparent 75%, ${dark} 75%),
          linear-gradient(45deg, ${dark} 25%, transparent 25%, transparent 75%, ${dark} 75%)
        `,
        backgroundSize: '4px 4px',
        backgroundPosition: '0 0, 2px 2px',
      };
    case 'brick':
      return {
        backgroundColor: c,
        backgroundImage: `
          linear-gradient(335deg, ${dark} 23px, transparent 23px),
          linear-gradient(155deg, ${dark} 23px, transparent 23px),
          linear-gradient(335deg, ${dark} 23px, transparent 23px),
          linear-gradient(155deg, ${dark} 23px, transparent 23px)
        `,
        backgroundSize: '24px 80px',
        backgroundPosition: '0px 0px, 12px 0px, 12px 40px, 24px 40px',
      };
    case 'tile':
      return {
        backgroundColor: c,
        backgroundImage: `
          linear-gradient(${dark} 1px, transparent 1px),
          linear-gradient(90deg, ${dark} 1px, ${c} 1px)
        `,
        backgroundSize: '20px 20px',
      };
    case 'concrete':
      return {
        backgroundColor: c,
        backgroundImage: `
          radial-gradient(circle at 30% 20%, ${dark} 1px, transparent 2px),
          radial-gradient(circle at 70% 60%, ${dark} 1px, transparent 2px),
          radial-gradient(circle at 50% 80%, ${light} 1px, transparent 2px),
          radial-gradient(circle at 20% 70%, ${light} 1px, transparent 2px)
        `,
        backgroundSize: '8px 8px, 12px 12px, 6px 6px, 10px 10px',
      };
    case 'metal':
      return {
        backgroundColor: c,
        backgroundImage: `linear-gradient(135deg, ${light} 0%, ${c} 30%, ${dark} 60%, ${c} 100%)`,
      };
    case 'glass':
      return {
        backgroundColor: c,
        backgroundImage: `linear-gradient(135deg, ${light} 0%, ${c} 50%, ${light} 100%)`,
        opacity: 0.85,
      };
    case 'solid':
    default:
      return { backgroundColor: c };
  }
}

function clamp(n: number) {
  return Math.max(0, Math.min(255, n));
}

function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    clamp(r + (255 - r) * amount),
    clamp(g + (255 - g) * amount),
    clamp(b + (255 - b) * amount),
  );
}

function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(clamp(r * (1 - amount)), clamp(g * (1 - amount)), clamp(b * (1 - amount)));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace('#', '');
  const full =
    cleaned.length === 3
      ? cleaned.split('').map((c) => c + c).join('')
      : cleaned;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((n) => Math.round(n).toString(16).padStart(2, '0'))
      .join('')
  );
}
