// Generates the pixel-art SVG sprites in /public/sprites from ASCII grids.
// Run: npm run sprites
//
// Each sprite is a list of layers. A layer is a grid of characters placed at (x, y);
// every character maps to a colour in PALETTE ('.' = transparent).
// `mirror()` builds a symmetric 32px-wide grid from 16-char left halves.
// To swap in hand-drawn PNGs later, drop them in /public/sprites and update the
// paths in src/lib/game/items.ts and src/components/pet/PetSprite.tsx.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sprites");

const PALETTE = {
  K: "#2b1a10", // outline
  B: "#d9a066", // fur
  L: "#f6dcb3", // light fur (muzzle / belly)
  D: "#8f5a2e", // ears
  E: "#141414", // eye
  W: "#ffffff",
  N: "#141414", // nose
  P: "#f28cb1", // pink (blush / tongue / bow)
  p: "#c2577f",
  T: "#5fcde4", // tear
  G: "#9bd47a", // sick cheeks
  R: "#d83a3a", // red
  r: "#9c2323",
  h: "#ff8a8a",
  F: "#8a5a2b", // kibble
  f: "#b07a3c",
  Y: "#f7c548", // gold / bolt
  y: "#c98f1e",
  J: "#e0245e", // jewel
  U: "#3b6fd1", // blue shirt
  u: "#26478c",
  V: "#4caf50", // green bandana
  v: "#2e7d32",
  C: "#3fa9f5", // water drop
};

const mirror = (halves) => halves.map((h) => h + [...h].reverse().join(""));
const at = (x, y, rows) => ({ x, y, rows });

// ---------- Dog base (32x32, front-facing, sitting) ----------
// Every dog state keeps the same silhouette so wearables line up in all states.
const DOG_BASE = mirror([
  "................",
  "................",
  "................",
  "..........KKKKKK",
  "........KKBBBBBB",
  "....KKKKBBBBBBBB",
  "...KDDDKBBBBBBBB",
  "...KDDDKBBBBBBBB",
  "...KDDDKBBBWEBBB",
  "...KDDDKBBBEEBBB",
  "...KDDDKBBBBBBLL",
  "...KDDDKBBBBBLLN",
  "....KDDKBBBBBLLL",
  ".....KKKBBBBBLLK",
  "........KBBBBBLL",
  ".........KKBBBBB",
  "...........KKKKK",
  "..........KBBBBB",
  ".........KBBBBLL",
  "........KBBBBLLL",
  "........KBBBBLLL",
  ".......KBBBBBLLL",
  ".......KBBBBBLLL",
  ".......KBBBBBLLL",
  "......KBBBBBBBLL",
  "......KBBKBBBBBB",
  "......KBBKBBBBBB",
  ".....KBBBKBBBKBB",
  ".....KLLLKKLLLKK",
  ".....KKKKK.KKKK.",
  "................",
  "................",
]);

const DOG = {
  idle: [
    at(0, 0, DOG_BASE),
    at(9, 12, ["PP"]),
    at(21, 12, ["PP"]),
    at(15, 14, ["PP"]),
  ],
  eating: [
    at(0, 0, DOG_BASE),
    // happy ^ ^ eyes
    at(10, 8, ["BKKB", "KBBK"]),
    at(18, 8, ["BKKB", "KBBK"]),
    at(9, 12, ["PP"]),
    at(21, 12, ["PP"]),
    at(15, 14, ["PP"]),
    // food bowl
    at(8, 25, [
      "....KKKKKKKK....",
      "..KKFFFfFFFFKK..",
      ".KFFfFFFFFfFFFK.",
      "KRRRRRRRRRRRRRRK",
      "KRhRRRRRRRRRRRRK",
      ".KRRRRRRRRRRRRK.",
      "..KKKKKKKKKKKK..",
    ]),
  ],
  sleeping: [
    at(0, 0, DOG_BASE),
    // closed eyes
    at(10, 8, ["BBBB", "KKKK"]),
    at(18, 8, ["BBBB", "KKKK"]),
  ],
  sick: [
    at(0, 0, DOG_BASE),
    // droopy eyes + tear
    at(11, 8, ["BB", "KK", ".T", ".T"]),
    at(19, 8, ["BB", "KK"]),
    at(9, 12, ["GG"]),
    at(21, 12, ["GG"]),
    // thermometer
    at(17, 13, ["KKKKKK", "KWWWRK", "KKKKKK"]),
  ],
};

// ---------- Partner (moves in at LV 6) ----------
// Same silhouette, recoloured as a slate-and-white tuxedo pup with her own bow on the left ear.
const PARTNER_PALETTE = { ...PALETTE, K: "#16181d", B: "#5a5f6e", L: "#eef0f4", D: "#3a3e49" };
const PARTNER_BOW = at(5, 1, [
  "KKK...KKK",
  "KPPKKKPPK",
  "KPPpPpPPK",
  "KPPKKKPPK",
  "KKK...KKK",
]);
const BLUSH = [at(9, 12, ["PP"]), at(21, 12, ["PP"]), at(15, 14, ["PP"])];
const PARTNER = {
  idle: [at(0, 0, DOG_BASE), ...BLUSH, PARTNER_BOW],
  happy: [at(0, 0, DOG_BASE), at(10, 8, ["BKKB", "KBBK"]), at(18, 8, ["BKKB", "KBBK"]), ...BLUSH, PARTNER_BOW],
  sleeping: [at(0, 0, DOG_BASE), at(10, 8, ["BBBB", "KKKK"]), at(18, 8, ["BBBB", "KKKK"]), PARTNER_BOW],
};

// ---------- Wearables (same 32x32 canvas so they line up with the dog) ----------
const ITEMS = {
  cap_red_pixel: [
    at(0, 0, mirror([
      "............KKKK",
      "..........KKRRRR",
      ".........KRRhRRR",
      "........KRRRRRRR",
      "........Krrrrrrr",
    ])),
    at(23, 4, ["RRRRRK"]),
    at(22, 5, ["KKKKKKK"]),
  ],
  crown_gold_pixel: [
    at(0, 0, mirror([
      "..........K...KK",
      ".........KYK.KYY",
      ".........KYYKYYY",
      ".........KYJYYYJ",
      ".........Kyyyyyy",
      "..........KKKKKK",
    ])),
  ],
  bow_pink_pixel: [
    at(18, 1, [
      "KKK...KKK",
      "KPPKKKPPK",
      "KPPpPpPPK",
      "KPPKKKPPK",
      "KKK...KKK",
    ]),
  ],
  shirt_blue_pixel: [
    at(0, 17, mirror([
      "..........KKKKKK",
      ".........KUUUUUU",
      "........KUUUUUUU",
      "........KWWWWWWW",
      ".......KUUUUUUUU",
      ".......KUUUUUUUU",
      ".......Kuuuuuuuu",
      ".......KKKKKKKKK",
    ])),
  ],
  bandana_green_pixel: [
    at(0, 16, mirror([
      ".........KKKKKKK",
      ".........KVVVVVV",
      "..........KVWVVV",
      "...........KVVVV",
      "............KVVv",
      ".............KVV",
      "..............KK",
    ])),
  ],
};

// ---------- 10x10 UI icons ----------
const ICONS = {
  hunger: [at(0, 0, [
    "..........",
    "..........",
    ".KK....KK.",
    "KWWKKKKWWK",
    ".KWWWWWWK.",
    ".KWWWWWWK.",
    "KWWKKKKWWK",
    ".KK....KK.",
    "..........",
    "..........",
  ])],
  hygiene: [at(0, 0, [
    "....KK....",
    "...KCCK...",
    "...KCCK...",
    "..KCCCCK..",
    "..KCWCCK..",
    ".KCWCCCCK.",
    ".KCWCCCCK.",
    ".KCCCCCCK.",
    "..KCCCCK..",
    "...KKKK...",
  ])],
  energy: [at(0, 0, [
    ".....KKKK.",
    "....KYYK..",
    "...KYYK...",
    "..KYYKKKK.",
    ".KYYYYYYK.",
    ".KKKKYYK..",
    "....KYYK..",
    "...KYYK...",
    "..KYK.....",
    "..KK......",
  ])],
  happiness: [at(0, 0, [
    "..........",
    ".KKK..KKK.",
    "KhWRKKRRRK",
    "KWRRRRRRRK",
    "KRRRRRRRRK",
    ".KRRRRRRK.",
    "..KRRRRK..",
    "...KRRK...",
    "....KK....",
    "..........",
  ])],
  // Action / toolbar icons
  sleep: [at(0, 0, [
    "..KKKK....",
    ".KYYK.....",
    "KYYK......",
    "KYYK......",
    "KYYK......",
    "KYYK......",
    "KYYYK...KK",
    ".KYYYKKKYK",
    "..KYYYYYK.",
    "...KKKKK..",
  ])],
  wake: [at(0, 0, [
    "....yy....",
    ".y..yy..y.",
    "..yKKKKy..",
    "..KYYYYK..",
    "yyKYYYYKyy",
    "yyKYYYYKyy",
    "..KYYYYK..",
    "..yKKKKy..",
    ".y..yy..y.",
    "....yy....",
  ])],
  walk: [at(0, 0, [
    "..DD..DD..",
    "..DD..DD..",
    "DD......DD",
    "DD.DDDD.DD",
    "..DDDDDD..",
    ".DDDDDDDD.",
    ".DDDDDDDD.",
    ".DDDDDDDD.",
    "..DDDDDD..",
    "..........",
  ])],
  toy: [at(0, 0, [
    "...KKKK...",
    ".KKRRRRKK.",
    ".KRhRRRRK.",
    "KRhRRRRRRK",
    "KWWWWWWWWK",
    "KRRRRRRRRK",
    "KRRRRRRRrK",
    ".KRRRRRrK.",
    ".KKrrrrKK.",
    "...KKKK...",
  ])],
  dress: [at(0, 0, [
    ".KKK..KKK.",
    "KUUUKKUUUK",
    "KUUUUUUUUK",
    "KKKUUUUKKK",
    "..KUUUUK..",
    "..KUWUUK..",
    "..KUUUUK..",
    "..KuuuuK..",
    "..KKKKKK..",
    "..........",
  ])],
  sound_on: [at(0, 0, [
    "....K.....",
    "...KK...K.",
    "..KWK.K..K",
    "KKWWK..K.K",
    "KWWWK..K.K",
    "KWWWK..K.K",
    "KKWWK..K.K",
    "..KWK.K..K",
    "...KK...K.",
    "....K.....",
  ])],
  sound_off: [at(0, 0, [
    "....K.....",
    "...KK.....",
    "..KWK.R..R",
    "KKWWK..RR.",
    "KWWWK..RR.",
    "KWWWK.R..R",
    "KKWWK.....",
    "..KWK.....",
    "...KK.....",
    "....K.....",
  ])],
  lock: [at(0, 0, [
    "...KKKK...",
    "..K....K..",
    "..K....K..",
    ".KKKKKKKK.",
    ".KYYYYYYK.",
    ".KYYKKYYK.",
    ".KYYKKYYK.",
    ".KYYYYYYK.",
    ".KKKKKKKK.",
    "..........",
  ])],
};

function render(layers, size, palette = PALETTE) {
  const grid = Array.from({ length: size.h }, () => Array(size.w).fill("."));
  for (const { x, y, rows } of layers) {
    const width = rows[0].length;
    rows.forEach((row, dy) => {
      if (row.length !== width) throw new Error(`Ragged row "${row}" (want ${width})`);
      [...row].forEach((ch, dx) => {
        if (ch === ".") return;
        if (!palette[ch]) throw new Error(`Unknown colour "${ch}"`);
        grid[y + dy][x + dx] = ch;
      });
    });
  }
  // Merge horizontal runs of the same colour into one <rect> to keep files small.
  const rects = [];
  grid.forEach((row, y) => {
    let x = 0;
    while (x < size.w) {
      const ch = row[x];
      let run = 1;
      while (x + run < size.w && row[x + run] === ch) run++;
      if (ch !== ".") rects.push(`<rect x="${x}" y="${y}" width="${run}" height="1" fill="${palette[ch]}"/>`);
      x += run;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size.w} ${size.h}" width="${size.w}" height="${size.h}" shape-rendering="crispEdges">${rects.join("")}</svg>\n`;
}

function write(rel, svg) {
  const file = join(OUT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, svg);
  console.log("wrote", rel);
}

for (const [name, layers] of Object.entries(DOG)) write(`dog/${name}.svg`, render(layers, { w: 32, h: 32 }));
for (const [name, layers] of Object.entries(PARTNER)) {
  write(`partner/${name}.svg`, render(layers, { w: 32, h: 32 }, PARTNER_PALETTE));
}
for (const [name, layers] of Object.entries(ITEMS)) write(`items/${name}.svg`, render(layers, { w: 32, h: 32 }));
for (const [name, layers] of Object.entries(ICONS)) write(`icons/${name}.svg`, render(layers, { w: 10, h: 10 }));
