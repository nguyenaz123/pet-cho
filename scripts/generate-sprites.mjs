// Generates the pixel-art SVG sprites in /public/sprites from ASCII grids.
// Run: npm run sprites
//
// Each sprite is a list of layers. A layer is a grid of characters placed at (x, y);
// every character maps to a colour in PALETTE ('.' = transparent).
// `mirror()` builds a symmetric 32px-wide grid from 16-char left halves.
// To swap in hand-drawn PNGs later, drop them in /public/sprites and update the
// paths in src/lib/game/items.ts and src/lib/game/breeds.ts.

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
  H: "#1f1f1f", // breed markings (spots / mask), recoloured per breed
  g: "#3a3d4a", // charcoal (tuxedo)
  n: "#5d6273",
  b: "#8e5bd6", // purple (robe)
  d: "#5b3a96",
  c: "#ff9f43", // orange
};

const mirror = (halves) => halves.map((h) => h + [...h].reverse().join(""));
const at = (x, y, rows) => ({ x, y, rows });
const recolor = (rows, map) => rows.map((r) => [...r].map((ch) => map[ch] ?? ch).join(""));

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

/** Pose overlays, drawn over the base dog and its breed markings. */
const POSES = {
  idle: [
    at(9, 12, ["PP"]),
    at(21, 12, ["PP"]),
    at(15, 14, ["PP"]),
  ],
  eating: [
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
    // closed eyes
    at(10, 8, ["BBBB", "KKKK"]),
    at(18, 8, ["BBBB", "KKKK"]),
  ],
  sick: [
    // droopy eyes + tear
    at(11, 8, ["BB", "KK", ".T", ".T"]),
    at(19, 8, ["BB", "KK"]),
    at(9, 12, ["GG"]),
    at(21, 12, ["GG"]),
    // thermometer
    at(17, 13, ["KKKKKK", "KWWWRK", "KKKKKK"]),
  ],
};

/**
 * Breeds share the base silhouette (so every wearable fits every breed); each one is a
 * palette swap plus optional marking layers drawn under the pose overlays.
 */
const BREEDS = {
  shiba: { palette: {}, marks: [] },
  husky: {
    palette: { B: "#7d8597", L: "#f4f6fa", D: "#4b5263", E: "#2f7fd0" },
    marks: [at(15, 4, ["LL", "LL", "LL", "LL", "LL", "LL"]), at(11, 6, ["LL"]), at(19, 6, ["LL"])],
  },
  choco: { palette: { B: "#7a4a2a", L: "#b07c54", D: "#4f2d17" }, marks: [] },
  dalmatian: {
    palette: { B: "#fbfbfb", L: "#ececec", D: "#262626", H: "#1f1f1f" },
    marks: [
      at(9, 6, ["HH", ".H"]),
      at(20, 5, ["HH"]),
      at(22, 10, ["H", "H"]),
      at(10, 19, ["HH", ".H"]),
      at(20, 21, ["HH", "HH"]),
      at(9, 24, ["HH"]),
      at(15, 26, ["HH"]),
      at(23, 25, ["H", "H"]),
    ],
  },
  pug: {
    palette: { B: "#e7c690", L: "#f3ddb4", D: "#2e2622", H: "#3b2d26" },
    marks: [at(13, 10, [".HHHH.", "HHNNHH", "HHHHHH", "HHKKHH", ".HHHH."]), at(13, 6, ["D..D"])],
  },
  poodle: {
    palette: { B: "#f3e9dc", L: "#fffaf3", D: "#dccab3" },
    marks: [at(11, 0, ["..KKKKKK..", ".KBBLBBBBK", "KBBBBBBBBK"])],
  },
  golden: { palette: { B: "#efbd52", L: "#fbe6a9", D: "#c4861f" }, marks: [] },
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
/**
 * Paints the dog's body from row y0 to y1: the outline stays, every other pixel becomes
 * paint(x, y). With `hem`, the row below is closed off with an outline.
 */
const bodyPaint = (y0, y1, paint, hem = true) =>
  at(
    0,
    y0,
    DOG_BASE.slice(y0, y1 + 1 + (hem ? 1 : 0)).map((row, dy) =>
      [...row].map((ch, x) => (ch === "." ? "." : ch === "K" || dy > y1 - y0 ? "K" : paint(x, y0 + dy))).join(""),
    ),
  );
/** Distance from the dog's centre line (0.5 for the middle two columns). */
const fromCentre = (x) => Math.abs(x - 15.5);

const FLOWER = [".KKK.", "KPPPK", "KPYPK", "KPPPK", ".KKK."];
const CAPE = mirror([
  ".......KRRRRRRYY",
  ".......KRR......",
  "......KRR.......",
  ".....KRR........",
  ".....KRR........",
  "....KRR.........",
  "....KRR.........",
  "....KRR.........",
  "...KRR..........",
  "...KRR..........",
  "...KRR..........",
  "..KRR...........",
  "..Krr...........",
  "..KKK...........",
]);

const ITEMS = {
  // ----- Hats (anything on the head or face) -----
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
  beanie_yellow_pixel: [
    at(0, 0, mirror([
      "..............KK",
      ".............KWW",
      "..........KKKKKK",
      ".........KYYYYYY",
      "........KYyYYyYY",
      ".......Kyyyyyyyy",
      ".......KKKKKKKKK",
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
  flower_crown_pixel: [
    at(9, 3, ["KVVVVVVVVVVVVK"]),
    at(8, 4, ["KVvVVvVVVVvVVvVK"]),
    at(8, 0, FLOWER),
    at(19, 0, FLOWER),
    at(14, 0, [".KK.", "KWWK", "KYYK", "KWWK", ".KK."]),
  ],
  party_hat_pixel: [
    at(0, 0, mirror([
      "..............KY",
      "..............KP",
      ".............KPY",
      ".............KYP",
      "............KPPP",
      "...........KKKKK",
    ])),
  ],
  shades_pixel: [
    at(0, 8, mirror([
      "........KKEEEEKK",
      "..........EWEE..",
      "..........KEEK..",
    ])),
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
  headphones_pixel: [
    at(0, 2, mirror([
      "........KKKKKKKK",
      "......KKuuuuuuuu",
      ".....KuuKKKKKKKK",
      "....KuuK........",
      "..KKKKKK........",
      ".KRRRRRK........",
      ".KRhRRRK........",
      ".KRRRRRK........",
      ".KrRRRRK........",
      "..KKKKK.........",
    ])),
  ],
  top_hat_pixel: [
    at(0, 0, mirror([
      "...........KKKKK",
      "...........KuEEE",
      "...........KuEEE",
      "...........KRRRR",
      ".......KEEEEEEEE",
      ".......KKKKKKKKK",
    ])),
  ],
  halo_pixel: [
    at(0, 0, mirror([
      "............YYYY",
      "...........Yy...",
      "............YYYY",
    ])),
  ],

  // ----- Clothes (neck and body) -----
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
  bowtie_red_pixel: [at(12, 15, ["KK....KK", "KRKKKKRK", "KRRrrRRK", "KRKKKKRK", "KK....KK"])],
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
  scarf_striped_pixel: [
    at(9, 15, ["KKKKKKKKKKKKKK", "KRRWWRRWWRRWWK", "KRWWRRWWRRWWRK", "KKKKKKKKKKKKKK"]),
    at(17, 19, ["KRRK", "KWWK", "KRRK", "KWWK", "KrrK", "KKKK"]),
  ],
  sweater_pink_pixel: [
    bodyPaint(17, 24, (x, y) => (y === 17 ? "p" : Math.floor((y - 18) / 2) % 2 ? "W" : "P")),
  ],
  raincoat_yellow_pixel: [
    bodyPaint(17, 24, (x, y) => (y === 24 || fromCentre(x) < 1 ? "y" : "Y")),
    at(14, 17, ["KyyK"]),
    at(15, 20, ["KK"]),
    at(15, 23, ["KK"]),
  ],
  cape_hero_pixel: [at(0, 16, CAPE)],
  tuxedo_pixel: [
    bodyPaint(17, 24, (x, y) => {
      const d = fromCentre(x);
      const shirt = y <= 18 ? 2 : y <= 20 ? 1 : 0;
      if (d < shirt) return "W";
      if (d < shirt + 1) return y === 22 ? "K" : "n";
      return "g";
    }),
    at(13, 16, ["KK..KK", "KRKKRK", "KK..KK"]),
  ],
  royal_robe_pixel: [
    at(0, 16, recolor(CAPE, { R: "b", r: "d" })),
    bodyPaint(17, 26, (x, y) => (fromCentre(x) < 2 ? (fromCentre(x) < 1 && y % 3 === 0 ? "E" : "W") : x % 4 === 0 ? "d" : "b")),
    at(9, 16, ["KWWEWWWWWWEWWK"]),
    at(14, 16, ["YJJY"]),
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
  friends: [at(0, 0, [
    "..........",
    ".KKK......",
    "KUUUK.KKK.",
    "KUUUKKPPPK",
    "KUUUKKPPPK",
    ".KKK.KPPPK",
    "KUUUK.KKK.",
    "KUUUUKPPPK",
    "KUUUUKPPPK",
    "KKKKKKKKKK",
  ])],
  back: [at(0, 0, [
    "..........",
    "...KK.....",
    "..KWK.....",
    ".KWWKKKKK.",
    "KWWWWWWWWK",
    "KWWWWWWWWK",
    ".KWWKKKKK.",
    "..KWK.....",
    "...KK.....",
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

// ---------- Room decor (one set per life stage, any size) ----------
const ROOM_PALETTE = {
  ...PALETTE,
  O: "#c97b4a", // wood
  o: "#8a4f2a", // dark wood
  S: "#a9d8f5", // sky
  s: "#6fb3dd",
  A: "#f2e3c6", // cream
  a: "#d8c49c",
  M: "#7fc8a9", // mint
  m: "#4f9c7f",
  Q: "#e9785b", // coral
  q: "#b5523a",
  I: "#5aa04e", // leaf
  i: "#3a7a33",
  X: "#fff3b0", // lamp light
  Z: "#6b6f80", // slate
  z: "#444857",
};

/** Wraps inner rows in a 1px outline plus a 1px border of `border`. */
const framed = (inner, border) => {
  const w = inner[0].length + 4;
  const edge = "K".repeat(w);
  const rim = "K" + border.repeat(w - 2) + "K";
  return [edge, rim, ...inner.map((r) => "K" + border + r + border + "K"), rim, edge];
};

const CUSHION = [
  "...KKKKKKKKKKK...",
  ".KKQQQQQQQQQQQKK.",
  "KQQAAAAAAAAAAAQQK",
  "KQQaaaaaaaaaaaQQK",
  "KqQQQQQQQQQQQQQqK",
  ".KqqqqqqqqqqqqqK.",
  "..KKKKKKKKKKKKK..",
];

const ROOM = {
  // Puppy: nursery
  puppy_bed: [at(0, 0, [
    "....KKKKKKKKKKKKKK....",
    "..KKSSSSSSSSSSSSSSKK..",
    ".KSSAAAAAAAAAAAAAASSK.",
    "KSSAAAAAAAAAAAAAAAASSK",
    "KSSSaaaaaaaaaaaaaaSSSK",
    "KsSSSSSSSSSSSSSSSSSSsK",
    ".KssssssssssssssssssK.",
    "..KKKKKKKKKKKKKKKKKK..",
  ])],
  puppy_basket: [at(0, 0, [
    "....KKKK......",
    "...KRRhRK.....",
    "..KRRRRRRK....",
    "KKKKKKKKKKKKKK",
    "KOoOoOoOoOoOoK",
    "KoOoOoOoOoOoOK",
    "KOoOoOoOoOoOoK",
    "KoOoOoOoOoOoOK",
    ".KOoOoOoOoOoK.",
    "..KKKKKKKKKK..",
  ])],
  puppy_bunting: [at(0, 0, [
    "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
    "KPPPPKKSSSSKKYYYYKKMMMMKKQQQQK",
    ".KPPK..KSSK..KYYK..KMMK..KQQK.",
    "..KK....KK....KK....KK....KK..",
  ])],

  // Teen: brighter room, a cushion each for the pup and Mochi
  teen_bed: [at(0, 0, CUSHION), at(17, 0, recolor(CUSHION, { Q: "M", q: "m" }))],
  teen_poster: [at(0, 0, framed(recolor([
    "............",
    "...qq..qq...",
    "...qq..qq...",
    ".qq......qq.",
    ".qq......qq.",
    "....qqqq....",
    "...qqqqqq...",
    "...qqqqqq...",
    "....qqqq....",
    "............",
  ], { ".": "Y" }), "Q"))],
  teen_toybox: [
    at(2, 0, [
      ".KK......KK.",
      "KWWK....KWWK",
      "KWWWWWWWWWWK",
    ]),
    at(0, 3, [
      "KKKKKKKKKKKKKKKK",
      "KUUUUUUUUUUUUUUK",
      "KUuUUUUUUUUUUuUK",
      "KUUUUYYYYYYUUUUK",
      "KUUUUYYYYYYUUUUK",
      "KUUUUUUUUUUUUUUK",
      "KuuuuuuuuuuuuuuK",
      "KKKKKKKKKKKKKKKK",
    ]),
  ],
  teen_plant: [at(0, 0, [
    "..KK..KK..",
    ".KIIKKIIK.",
    ".KIiIIiIK.",
    "..KIIIIK..",
    "KKKIiiIKKK",
    "KIIIKKIIIK",
    ".KKKiiKKK.",
    "....KK....",
    ".KKKKKKKK.",
    ".KQQQQQQK.",
    "..KQQQQK..",
    "..KqqqqK..",
    "...KKKK...",
  ])],

  // Adult: cosy grown-up home
  adult_bed: [at(0, 0, [
    "......KKKKKKKKKKKKKKKKKK......",
    "...KKKuuuuuuuuuuuuuuuuuuKKK...",
    ".KKuuUUUUUUUUUUUUUUUUUUUUuuKK.",
    "KuuUUAAAAAAAAAAAAAAAAAAAAUUuuK",
    "KuUUAAAAAAAAAAAAAAAAAAAAAAUUuK",
    "KuUUaaaaaaaaaaaaaaaaaaaaaaUUuK",
    "KuUUUUUUUUUUUUUUUUUUUUUUUUUUuK",
    "KuuUUUUUUUUUUUUUUUUUUUUUUUUuuK",
    ".KuuuuuuuuuuuuuuuuuuuuuuuuuuK.",
    "..KKKKKKKKKKKKKKKKKKKKKKKKKK..",
  ])],
  adult_shelf: [at(0, 0, [
    "KKKKKKKKKKKKKKKK",
    "KOOOOOOOOOOOOOOK",
    ...[
      "oRoUUoooVZoo",
      "oRYUUoQoVZRo",
      "oRYUUoQoVZRo",
      "oRYUUoQoVZRo",
      "oRYUUoQoVZRo",
    ].map((r) => "KO" + r + "OK"),
    "KOOOOOOOOOOOOOOK",
    ...[
      "ooYooooooUoo",
      "oYYYoooooUVo",
      "ooYooRRooUVo",
      "oKKKoRRooUVo",
      "oKKKoRRooUVo",
    ].map((r) => "KO" + r + "OK"),
    "KOOOOOOOOOOOOOOK",
    ...[
      "oVVoZoooQQQo",
      "oVVoZZooQQQo",
      "oVVoZZooQQQo",
      "oVVoZZRRRRRo",
      "oVVoZZUUUUUo",
    ].map((r) => "KO" + r + "OK"),
    "KOOOOOOOOOOOOOOK",
    "KKKKKKKKKKKKKKKK",
    ".KK..........KK.",
  ])],
  adult_lamp: [at(0, 0, [
    "..KKKKKK..",
    ".KXXXXXXK.",
    ".KXXXXXXK.",
    "KXXXXXXXXK",
    "KKKKKKKKKK",
    ...Array(18).fill("....KK...."),
    "..KKKKKK..",
    ".KZZZZZZK.",
    ".KKKKKKKK.",
  ])],
  // The pup and Mochi, framed
  adult_photo: [at(0, 0, framed([
    "SSSSSSSSSSSS",
    "SDSSSDzSSSzS",
    "SDBBBDzZZZzS",
    "SBEBEBZEZEZS",
    "SBBNBBZZNZZS",
    "SSBBBSSZZZSS",
    "SSSSSPPSSSSS",
    "IIIIIIIIIIII",
  ], "Y"))],
  adult_plant: [at(0, 0, [
    ".....KK.....",
    "..KK.KIK.KK.",
    ".KIIKKIKKIIK",
    ".KIiIKIKIiIK",
    "..KIIIIIIIK.",
    "KKKKIiIiIKKK",
    "KIIIKIIIKIIK",
    ".KIiIIiIIiK.",
    "..KKIIIIKK..",
    "....KiiK....",
    "....KiiK....",
    ".KKKKKKKKKK.",
    ".KAAAAAAAAK.",
    ".KaAAAAAAaK.",
    "..KAAAAAAK..",
    "..KaaaaaaK..",
    "...KKKKKK...",
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

for (const [breed, { palette, marks }] of Object.entries(BREEDS)) {
  for (const [pose, overlay] of Object.entries(POSES)) {
    write(`dog/${breed}/${pose}.svg`, render([at(0, 0, DOG_BASE), ...marks, ...overlay], { w: 32, h: 32 }, { ...PALETTE, ...palette }));
  }
}
for (const [name, layers] of Object.entries(PARTNER)) {
  write(`partner/${name}.svg`, render(layers, { w: 32, h: 32 }, PARTNER_PALETTE));
}
for (const [name, layers] of Object.entries(ITEMS)) write(`items/${name}.svg`, render(layers, { w: 32, h: 32 }));
for (const [name, layers] of Object.entries(ICONS)) write(`icons/${name}.svg`, render(layers, { w: 10, h: 10 }));
for (const [name, layers] of Object.entries(ROOM)) {
  // Canvas is the bounding box of all layers.
  const w = Math.max(...layers.map((l) => l.x + l.rows[0].length));
  const h = Math.max(...layers.map((l) => l.y + l.rows.length));
  write(`room/${name}.svg`, render(layers, { w, h }, ROOM_PALETTE));
}
