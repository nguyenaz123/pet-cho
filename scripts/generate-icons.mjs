// Generates the PNG app icons (home screen, PWA manifest) from the shiba idle sprite.
// Run: npm run icons  (re-run after `npm run sprites` if the shiba changes)
//
// The sprite is nested inside a padded square SVG so sharp/librsvg rasterises the
// pixel rects as vectors: edges stay crisp at every size, no nearest-neighbour upscaling.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SPRITE = join(ROOT, "public", "sprites", "dog", "shiba", "idle.svg");

const BG = "#f6dcb3";

/** Inner markup of the 32x32 sprite (everything between the root <svg> tags). */
const sprite = readFileSync(SPRITE, "utf8")
  .replace(/^[\s\S]*?<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "");

/** `inset` is the sprite's share of the icon width; the rest is padding. */
function iconSvg(size, inset) {
  const s = 32 / inset;
  const o = (s - 32) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${size}" height="${size}" shape-rendering="crispEdges">
<rect width="${s}" height="${s}" fill="${BG}"/>
<g transform="translate(${o} ${o})">${sprite}</g>
</svg>`;
}

const ICONS = [
  // iOS crops its own rounded corners and ignores transparency, so: full bleed.
  { out: "src/app/apple-icon.png", size: 180, inset: 0.8 },
  { out: "public/icons/icon-192.png", size: 192, inset: 0.8 },
  { out: "public/icons/icon-512.png", size: 512, inset: 0.8 },
  // Android masks to a circle/squircle inside the central 80%: keep the dog well within it.
  { out: "public/icons/icon-maskable-512.png", size: 512, inset: 0.6 },
];

for (const { out, size, inset } of ICONS) {
  const file = join(ROOT, out);
  mkdirSync(dirname(file), { recursive: true });
  const png = await sharp(Buffer.from(iconSvg(size, inset))).png().toBuffer();
  writeFileSync(file, png);
  console.log(`wrote ${out} (${size}px)`);
}
