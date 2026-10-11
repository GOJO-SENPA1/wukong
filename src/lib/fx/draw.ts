// Canvas drawing for the pixel icons: each sprite is baked once into an 18x18
// canvas (a front face and a darker copy), then drawn scaled up with a stack of
// darker copies behind it for a chunky 3D extrusion, like the promo.
import { spritePixels, type SpriteName } from "./sprites";

interface Baked {
  front: HTMLCanvasElement;
  side: HTMLCanvasElement;
}

const cache = new Map<SpriteName, Baked>();

function bake(name: SpriteName, darken: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = 18;
  const g = c.getContext("2d")!;
  const img = g.createImageData(18, 18);
  img.data.set(spritePixels(name, darken));
  g.putImageData(img, 0, 0);
  return c;
}

export function baked(name: SpriteName): Baked {
  let b = cache.get(name);
  if (!b) {
    b = { front: bake(name, 0), side: bake(name, -0.5) };
    cache.set(name, b);
  }
  return b;
}

export interface IconOpts {
  /** horizontal squash for a coin-flip spin, -1..1 */
  sx?: number;
  scale?: number;
  rot?: number;
  alpha?: number;
  depth?: number;
  shadow?: boolean;
}

/** Draw a sprite centred at (x, y) with each source pixel `px` canvas pixels wide. */
export function drawIcon(g: CanvasRenderingContext2D, name: SpriteName, x: number, y: number, px: number, o: IconOpts = {}) {
  const sp = baked(name);
  const sz = 18 * px;
  const a = o.alpha ?? 1;
  const s = o.scale ?? 1;
  if (a <= 0.003 || s <= 0.003) return;
  const sx = o.sx ?? 1;
  const depth = o.depth ?? Math.max(2, px * 0.9);
  g.save();
  g.globalAlpha = a;
  g.translate(x, y);
  g.rotate(o.rot ?? 0);
  g.scale(s * (Math.abs(sx) < 0.06 ? 0.06 * Math.sign(sx || 1) : sx), s);
  g.imageSmoothingEnabled = false;
  if (o.shadow !== false) {
    g.save();
    g.globalAlpha = a * 0.18;
    g.drawImage(sp.side, -sz / 2 + depth + px * 1.5, -sz / 2 + depth + px * 3, sz, sz);
    g.restore();
  }
  const steps = Math.ceil(depth * Math.min(1, Math.abs(sx) + 0.15));
  for (let d = steps; d >= 1; d--) g.drawImage(sp.side, -sz / 2 + d, -sz / 2 + d, sz, sz);
  g.drawImage(sp.front, -sz / 2, -sz / 2, sz, sz);
  g.restore();
}

/** Size a canvas for crisp drawing on high-DPI screens; returns the context scaled to CSS pixels. */
export function fitCanvas(c: HTMLCanvasElement, w: number, h: number, maxDpr = 2): CanvasRenderingContext2D {
  const dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
  c.width = Math.round(w * dpr);
  c.height = Math.round(h * dpr);
  const g = c.getContext("2d")!;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.imageSmoothingEnabled = false;
  return g;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}
