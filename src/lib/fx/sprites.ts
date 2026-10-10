// Pixel-art icons (the promo set from video/sprites.js): 16x16 colour grids.
// "." is empty; other characters map to a palette colour. The renderer adds a
// 1px outline and light/shade edges; characters in `flat` skip the shading.

export interface Sprite {
  outline: string;
  flat: string;
  pal: Record<string, string>;
  rows: string[];
}

const staff: string[] = [];
for (let y = 0; y < 16; y++) {
  const row = Array(16).fill(".");
  if (y >= 1 && y <= 14) {
    const cx = 15 - y;
    for (const x of [cx - 1, cx]) if (x >= 0 && x < 16) row[x] = y <= 3 || y >= 12 ? "R" : y === 4 || y === 11 ? "g" : "G";
  }
  staff.push(row.join(""));
}

export const SPRITES = {
  coin: {
    outline: "#0E1440", flat: "w",
    pal: { B: "#3445FF", b: "#2231C4", w: "#FFFFFF" },
    rows: [
      "................",
      ".....bbbbbb.....",
      "...bbBBBBBBbb...",
      "..bBBBBBBBBBBb..",
      "..bBBwBBBBwBBb..",
      ".bBBBwBBBBwBBBb.",
      ".bBBBwBwwBwBBBb.",
      ".bBBBwBwwBwBBBb.",
      ".bBBBwwwwwwBBBb.",
      ".bBBBBwBBwBBBBb.",
      ".bBBBBBBBBBBBBb.",
      "..bBBBBBBBBBBb..",
      "..bBBBBBBBBBBb..",
      "...bbBBBBBBbb...",
      ".....bbbbbb.....",
      "................",
    ],
  },
  monkey: {
    outline: "#2A160C", flat: "ewmRn",
    pal: { f: "#8A5230", t: "#F2C89A", T: "#D9A574", G: "#F5B83D", R: "#E4261C", e: "#1A0E08", w: "#FFFFFF", m: "#7A2E1A", n: "#5A2E1A" },
    rows: [
      "................",
      "......ffff......",
      "....ffffffff....",
      "...GGGGGGGGGG...",
      "...GGGGRRGGGG...",
      "...ffffffffff...",
      ".ffttttttttttff.",
      "fTtttwettwetttTf",
      "fTttteetteetttTf",
      ".ffttttttttttff.",
      "...ttttnntttt...",
      "...tttmmmmttt...",
      "....tttttttt....",
      ".....TTTTTT.....",
      "................",
      "................",
    ],
  },
  staff: { outline: "#2A1A05", flat: "", pal: { G: "#F5B83D", g: "#C88A12", R: "#E4261C" }, rows: staff },
  cloud: {
    outline: "#3A3F6E", flat: "s",
    pal: { c: "#F4F1FF", s: "#AEB7FF" },
    rows: [
      "................",
      "................",
      "................",
      ".....ccc........",
      "....ccccc..ccc..",
      "..ccccccccccccc.",
      ".ccccsssccccccc.",
      "cccccccsccccccc.",
      ".cccccsscccssccc",
      "..ccccccccccccc.",
      "...cc...cccc....",
      "................",
      "................",
      "................",
      "................",
      "................",
    ],
  },
  peach: {
    outline: "#5A1F18", flat: "",
    pal: { P: "#FF8A7A", p: "#F06A5A", l: "#2E9E4F", L: "#5ACB6E" },
    rows: [
      "..........ll....",
      ".........lLl....",
      "........lLl.....",
      "....pppp.pppp...",
      "...pPPPPpPPPPp..",
      "..pPPPPPPPPPPPp.",
      "..pPPPPPPPPPPPp.",
      "..pPPPPPPPPPPPp.",
      "..pPPPPPPPPPPPp.",
      "...pPPPPPPPPPp..",
      "....pPPPPPPPp...",
      ".....ppPPPpp....",
      ".......ppp......",
      "................",
      "................",
      "................",
    ],
  },
  lock: {
    outline: "#2A1A05", flat: "k",
    pal: { S: "#B8BED0", G: "#F5B83D", k: "#2A1A05" },
    rows: [
      "................",
      ".....SSSSSS.....",
      "....SS....SS....",
      "....S......S....",
      "....S......S....",
      "...GGGGGGGGGG...",
      "..GGGGGGGGGGGG..",
      "..GGGGGkkGGGGG..",
      "..GGGGGkkGGGGG..",
      "..GGGGGGkGGGGG..",
      "..GGGGGGGGGGGG..",
      "..GGGGGGGGGGGG..",
      "...GGGGGGGGGG...",
      "................",
      "................",
      "................",
    ],
  },
  shield: {
    outline: "#0E1440", flat: "w",
    pal: { B: "#3D5BFF", w: "#FFFFFF" },
    rows: [
      "................",
      "..BBBBBBBBBBBB..",
      "..BBBBBBBBBBBB..",
      "..BBBBBBBBBBwB..",
      "..BBBBBBBBBwwB..",
      "..BBBBBBBBwwBB..",
      "..BwBBBBBwwBBB..",
      "..BwwBBBwwBBBB..",
      "..BBwwBwwBBBBB..",
      "...BBwwwBBBBB...",
      "...BBBwBBBBBB...",
      "....BBBBBBBB....",
      ".....BBBBBB.....",
      "......BBBB......",
      ".......BB.......",
      "................",
    ],
  },
  bolt: {
    outline: "#3A2A05", flat: "",
    pal: { Y: "#FFD43B" },
    rows: [
      "................",
      "..........YY....",
      ".........YYY....",
      "........YYY.....",
      ".......YYY......",
      "......YYY.......",
      ".....YYYYYYYY...",
      "....YYYYYYYY....",
      ".........YYY....",
      "........YYY.....",
      ".......YYY......",
      "......YY........",
      ".....YY.........",
      "....Y...........",
      "................",
      "................",
    ],
  },
  trophy: {
    outline: "#3A2405", flat: "",
    pal: { G: "#F5B83D", B: "#4A3424" },
    rows: [
      "................",
      "...GGGGGGGGGG...",
      ".G.GGGGGGGGGG.G.",
      "G..GGGGGGGGGG..G",
      "G..GGGGGGGGGG..G",
      ".G.GGGGGGGGGG.G.",
      "...GGGGGGGGGG...",
      "....GGGGGGGG....",
      ".....GGGGGG.....",
      "......GGGG......",
      ".......GG.......",
      ".......GG.......",
      ".....GGGGGG.....",
      "....BBBBBBBB....",
      "....BBBBBBBB....",
      "................",
    ],
  },
  scroll: {
    outline: "#3A2A14", flat: "l",
    pal: { P: "#FFF8EA", l: "#9AA3B8", r: "#C9A36B", R: "#E2C28E" },
    rows: [
      "................",
      "..rrrrrrrrrrrr..",
      "..rRRRRRRRRRRr..",
      "...PPPPPPPPPP...",
      "...PllllllllP...",
      "...PPPPPPPPPP...",
      "...PlllllPPPP...",
      "...PPPPPPPPPP...",
      "...PllllllllP...",
      "...PPPPPPPPPP...",
      "...PllllPPPPP...",
      "...PPPPPPPPPP...",
      "..rRRRRRRRRRRr..",
      "..rrrrrrrrrrrr..",
      "................",
      "................",
    ],
  },
  robot: {
    outline: "#1A1F2E", flat: "emRw",
    pal: { H: "#D6DBE6", e: "#2B3CFF", m: "#3A4458", a: "#8C93A8", R: "#E4261C", B: "#3A4458", w: "#9FE3FF" },
    rows: [
      ".......RR.......",
      ".......aa.......",
      "....HHHHHHHH....",
      "...HHHHHHHHHH...",
      ".aHHeeHHHHeeHHa.",
      ".aHHeeHHHHeeHHa.",
      "..HHHHHHHHHHHH..",
      "..HHHmmmmmmHHH..",
      "...HHHHHHHHHH...",
      "....HHHHHHHH....",
      "......aaaa......",
      "....BBBBBBBB....",
      "...BBBBwwBBBB...",
      "...BBBBBBBBBB...",
      "................",
      "................",
    ],
  },
  cash: {
    outline: "#0E3A22", flat: "w",
    pal: { G: "#2DBE6C", g: "#1E8E4E", t: "#E9D9A6", w: "#CFF5DE" },
    rows: [
      "................",
      "................",
      "................",
      "................",
      "..GGGGGttGGGGG..",
      "..GwGGGttGGGwG..",
      "..GGGGGttGGGGG..",
      "..GGGGGttGGGGG..",
      "..GwGGGttGGGwG..",
      "..GGGGGttGGGGG..",
      "..gggggttggggg..",
      "..GGGGGttGGGGG..",
      "..gggggggggggg..",
      "................",
      "................",
      "................",
    ],
  },
  gem: {
    outline: "#0E3A5A", flat: "",
    pal: { c: "#9FEBFF", C: "#7FD8FF", d: "#3BB8F5", D: "#5FCBFF" },
    rows: [
      "................",
      "................",
      "................",
      "....cccccccc....",
      "...cCCcCCcCCc...",
      "..cCCCCCCCCCCc..",
      "..dDDDDDDDDDDd..",
      "...dDDDDDDDDd...",
      "....dDDDDDDd....",
      ".....dDDDDd.....",
      "......dDDd......",
      ".......dd.......",
      "................",
      "................",
      "................",
      "................",
    ],
  },
  fire: {
    outline: "#5A1A05", flat: "w",
    pal: { O: "#FF6A1A", Y: "#FFC83A", w: "#FFF4C2" },
    rows: [
      "................",
      ".......O........",
      "......OO........",
      "......OOO.......",
      ".....OOOO..O....",
      ".....OOOOO.OO...",
      "....OOOOOOOOO...",
      "...OOOYOOOOOOO..",
      "...OOYYYOOOOOO..",
      "..OOOYYYYOYOOO..",
      "..OOYYYYYYYYOO..",
      "..OOYYYwwYYYOO..",
      "...OYYwwwwYYO...",
      "....OOYYYYOO....",
      "................",
      "................",
    ],
  },
} satisfies Record<string, Sprite>;

export type SpriteName = keyof typeof SPRITES;
export const SPRITE_NAMES = Object.keys(SPRITES) as SpriteName[];

const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (c: number[], k: number) => c.map((v) => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))));

/** RGBA pixels of a sprite on an 18x18 grid (outline included); darken < 0 shades it for the 3D extrusion. */
export function spritePixels(name: SpriteName, darken = 0): Uint8ClampedArray {
  const s: Sprite = SPRITES[name];
  const N = 16, P = 1, W = N + 2 * P;
  const data = new Uint8ClampedArray(W * W * 4);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= N || y >= N ? "." : s.rows[y][x]);
  const put = (x: number, y: number, rgb: number[]) => {
    const i = ((y + P) * W + (x + P)) * 4;
    const d = darken ? mix(rgb, darken) : rgb;
    data[i] = d[0]; data[i + 1] = d[1]; data[i + 2] = d[2]; data[i + 3] = 255;
  };
  const outline = hex(s.outline);
  for (let y = -1; y <= N; y++)
    for (let x = -1; x <= N; x++) {
      const ch = at(x, y);
      if (ch === ".") {
        if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => at(x + dx, y + dy) !== ".")) put(x, y, outline);
        continue;
      }
      let rgb = hex(s.pal[ch]);
      if (!s.flat.includes(ch)) {
        const lit = at(x, y - 1) === "." || at(x - 1, y) === ".";
        const dim = at(x, y + 1) === "." || at(x + 1, y) === ".";
        if (lit && !dim) rgb = mix(rgb, 0.28);
        else if (dim && !lit) rgb = mix(rgb, -0.22);
      }
      put(x, y, rgb);
    }
  return data;
}

/** The pixel icon for each work category id (see lib/categories). */
export const CATEGORY_ICON: Record<number, SpriteName> = { 0: "scroll", 1: "cloud", 2: "bolt", 3: "gem", 4: "staff" };
export const categoryIcon = (id: number): SpriteName => CATEGORY_ICON[id] ?? "scroll";
