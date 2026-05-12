import * as THREE from 'three';
import { MaterialItem, FinishType } from '../data/catalog';

const TEXTURE_SIZE = 512;
const cache = new Map<string, THREE.CanvasTexture>();

/**
 * Returns a cached, procedural CanvasTexture for the given material.
 * Patterns are stylized (wood/marble/etc.) — meant to look distinctly different
 * per category. Real photo textures can replace these later by setting
 * material.imageUrl, which short-circuits this generator.
 */
export function getMaterialTexture(material: MaterialItem | undefined): THREE.Texture | null {
  if (!material) return null;
  if (material.tags?.includes('plain-floor')) return null;
  if (material.imageUrl) {
    // Photo-texture path (future M1c). Loader caches by URL.
    return loadImageTexture(material.imageUrl);
  }

  const cacheKey = `${material.id}|${material.color}|${material.pattern ?? 'solid'}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (!canvas) return null;
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  drawPattern(ctx, TEXTURE_SIZE, TEXTURE_SIZE, material);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  texture.colorSpace = THREE.SRGBColorSpace;
  cache.set(cacheKey, texture);
  return texture;
}

const imageCache = new Map<string, THREE.Texture>();
function loadImageTexture(url: string): THREE.Texture {
  if (imageCache.has(url)) return imageCache.get(url)!;
  const loader = new THREE.TextureLoader();
  const texture = loader.load(url);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  texture.colorSpace = THREE.SRGBColorSpace;
  imageCache.set(url, texture);
  return texture;
}

/**
 * Maps a finishType to physical surface properties for meshStandardMaterial.
 */
export function getFinishProps(
  finishType: FinishType | undefined,
): { roughness: number; metalness: number; clearcoat?: number; clearcoatRoughness?: number; transmission?: number; opacity?: number } {
  switch (finishType) {
    case 'Glossy':     return { roughness: 0.16, metalness: 0.03, clearcoat: 0.65, clearcoatRoughness: 0.16 };
    case 'Polished':   return { roughness: 0.1, metalness: 0.02, clearcoat: 0.8, clearcoatRoughness: 0.08 };
    case 'Reflective': return { roughness: 0.18, metalness: 0.55, clearcoat: 0.45, clearcoatRoughness: 0.12 };
    case 'Matte':      return { roughness: 0.86, metalness: 0 };
    case 'Textured':   return { roughness: 0.78, metalness: 0 };
    case 'Natural':    return { roughness: 0.52, metalness: 0, clearcoat: 0.18, clearcoatRoughness: 0.35 };
    default:           return { roughness: 0.65, metalness: 0 };
  }
}

// ──────────────────────────────────────────────────────────────────
// Procedural pattern drawing
// ──────────────────────────────────────────────────────────────────

function drawPattern(ctx: CanvasRenderingContext2D, w: number, h: number, m: MaterialItem) {
  const c = m.color;
  const dark = shade(c, -0.18);
  const darker = shade(c, -0.32);
  const light = shade(c, 0.12);
  const lighter = shade(c, 0.22);

  // Background
  ctx.fillStyle = c;
  ctx.fillRect(0, 0, w, h);

  switch (m.pattern) {
    case 'wood': {
      // Vertical-ish wood grain: many thin colored strokes, some long arcs for knots
      for (let i = 0; i < 60; i++) {
        const x = Math.random() * w;
        ctx.strokeStyle = mixHex(c, Math.random() < 0.5 ? dark : light, 0.4 + Math.random() * 0.4);
        ctx.lineWidth = 1 + Math.random() * 2.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(
          x + (Math.random() - 0.5) * 30, h * 0.33,
          x + (Math.random() - 0.5) * 30, h * 0.66,
          x + (Math.random() - 0.5) * 30, h,
        );
        ctx.stroke();
      }
      // A few darker streaks for depth
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < 10; i++) {
        ctx.strokeStyle = darker;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const x = Math.random() * w;
        ctx.moveTo(x, 0);
        ctx.lineTo(x + (Math.random() - 0.5) * 60, h);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'marble': {
      // Cloudy gradient base
      for (let i = 0; i < 6; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 80 + Math.random() * 200;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const tint = i % 2 === 0 ? lighter : dark;
        g.addColorStop(0, hexToRgba(tint, 0.5));
        g.addColorStop(1, hexToRgba(tint, 0));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
      // Veins
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = darker;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        let x = Math.random() * w;
        let y = Math.random() * h;
        ctx.moveTo(x, y);
        for (let j = 0; j < 12; j++) {
          x += (Math.random() - 0.5) * 80;
          y += (Math.random() - 0.5) * 80;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'fabric': {
      // Crosshatch weave
      ctx.strokeStyle = dark;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.35;
      for (let i = 0; i < w; i += 4) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
        ctx.stroke();
      }
      ctx.strokeStyle = light;
      for (let i = 0; i < h; i += 4) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(w, i);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'brick': {
      const brickW = 96;
      const brickH = 36;
      const mortar = 4;
      for (let row = 0; row * brickH < h; row++) {
        const offsetX = (row % 2) * (brickW / 2);
        for (let col = -1; col * brickW < w; col++) {
          const x = col * brickW + offsetX;
          const y = row * brickH;
          // Slight color variation per brick
          ctx.fillStyle = shade(c, (Math.random() - 0.5) * 0.18);
          ctx.fillRect(x + mortar / 2, y + mortar / 2, brickW - mortar, brickH - mortar);
        }
      }
      // Mortar lines (already implicit via gaps)
      break;
    }
    case 'tile': {
      const tileSize = 128;
      ctx.strokeStyle = darker;
      ctx.lineWidth = 2;
      for (let i = 0; i <= w; i += tileSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
        ctx.stroke();
      }
      for (let i = 0; i <= h; i += tileSize) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(w, i);
        ctx.stroke();
      }
      // Slight per-tile variation
      ctx.globalAlpha = 0.15;
      for (let r = 0; r < h / tileSize; r++) {
        for (let col = 0; col < w / tileSize; col++) {
          ctx.fillStyle = shade(c, (Math.random() - 0.5) * 0.12);
          ctx.fillRect(col * tileSize, r * tileSize, tileSize, tileSize);
        }
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'concrete': {
      // Pixel-level fine noise (subtle)
      const img = ctx.getImageData(0, 0, w, h);
      const data = img.data;
      for (let i = 0; i < data.length; i += 4) {
        const n = (Math.random() - 0.5) * 40;
        data[i] = clamp(data[i] + n);
        data[i + 1] = clamp(data[i + 1] + n);
        data[i + 2] = clamp(data[i + 2] + n);
      }
      ctx.putImageData(img, 0, 0);
      // Visible specks — both lighter and darker dots so the wall reads as textured
      ctx.globalAlpha = 0.45;
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = Math.random() < 0.5 ? darker : lighter;
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 0.5 + Math.random() * 1.8;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      // Larger sparse blotches for stucco/sand paint look
      ctx.globalAlpha = 0.18;
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = Math.random() < 0.5 ? dark : light;
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 6 + Math.random() * 14;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'metal': {
      // Brushed metal: vertical streaks
      for (let i = 0; i < w; i += 1) {
        const v = (Math.random() - 0.5) * 0.18;
        ctx.fillStyle = shade(c, v);
        ctx.fillRect(i, 0, 1, h);
      }
      // Soft horizontal sheen
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, hexToRgba(lighter, 0.25));
      grad.addColorStop(0.5, 'rgba(0,0,0,0)');
      grad.addColorStop(1, hexToRgba(darker, 0.2));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case 'glass': {
      // Soft diagonal sheen
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, hexToRgba(lighter, 0.3));
      grad.addColorStop(0.5, hexToRgba(c, 0.0));
      grad.addColorStop(1, hexToRgba(lighter, 0.3));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case 'solid':
    default: {
      // Soft cloudy tonal variation — visible enough that paint looks
      // like real wall surface (roller / brush sheen), not flat CGI fill.
      ctx.globalAlpha = 0.18;
      for (let i = 0; i < 70; i++) {
        ctx.fillStyle = Math.random() < 0.5 ? light : dark;
        const x = Math.random() * w;
        const y = Math.random() * h;
        ctx.beginPath();
        ctx.arc(x, y, 60 + Math.random() * 180, 0, Math.PI * 2);
        ctx.fill();
      }
      // Very fine pixel noise for paint roller texture
      ctx.globalAlpha = 1;
      const img = ctx.getImageData(0, 0, w, h);
      const data = img.data;
      for (let i = 0; i < data.length; i += 4) {
        const n = (Math.random() - 0.5) * 18;
        data[i] = clamp(data[i] + n);
        data[i + 1] = clamp(data[i + 1] + n);
        data[i + 2] = clamp(data[i + 2] + n);
      }
      ctx.putImageData(img, 0, 0);
      break;
    }
  }
}

// ──────────────────────────────────────────────────────────────────
// Color helpers
// ──────────────────────────────────────────────────────────────────

function clamp(v: number) {
  return Math.max(0, Math.min(255, v));
}

function shade(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  if (amount >= 0) {
    return rgbToHex(
      r + (255 - r) * amount,
      g + (255 - g) * amount,
      b + (255 - b) * amount,
    );
  }
  const k = 1 + amount;
  return rgbToHex(r * k, g * k, b * k);
}

function mixHex(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
}

function hexToRgb(hex: string) {
  const cleaned = hex.replace('#', '');
  const full =
    cleaned.length === 3 ? cleaned.split('').map((c) => c + c).join('') : cleaned;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return (
    '#' +
    [r, g, b]
      .map((n) => Math.round(clamp(n)).toString(16).padStart(2, '0'))
      .join('')
  );
}

function hexToRgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha})`;
}
