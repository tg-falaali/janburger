// Cuts the two ingredient sheets (assets-src/sheet-1.jpg, sheet-2.jpg: items
// on black, 2 columns x 5 rows) into one transparent image per ingredient,
// in public/layers/, and writes what it made to src/data/photoLayers.json.
//
//   node scripts/cut-layers.mjs
//
// How an item is told from the black around it: the background is whatever
// dark area can be reached from the edge of the sheet. A dark patch INSIDE
// an item - a grill mark, the shade under a leaf - is not reachable, and is
// kept. Only truly black enclosed holes (the middle of an onion ring) go too.

import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const SHEETS = [
  {
    file: "assets-src/sheet-1.jpg",
    keys: ["bun-top", "bun-bottom", "lettuce", "onion", "tomato", "cheese", "patty", "chicken", "egg", "pickles"],
  },
  {
    file: "assets-src/sheet-2.jpg",
    keys: [
      "hotdog-bun-top", "hotdog-bun-bottom", "sausage", "sauce-line", "sauce", "mayo",
      "fries", "fries-box", "cheese-sauce", "soft-drink", "water-bottle",
    ],
  },
];

// See-through things: on black their clear parts ARE black, so how solid a
// pixel is gets read from how bright it is.
const GLASS = new Set(["soft-drink", "water-bottle"]);

const BG_MAX = 24; // darker than this, and reachable from the edge, is background
const HOLE_MAX = 9; // an enclosed patch this black...
const HOLE_MIN_AREA = 260; // ...and this big is a hole right through the item
const SPECK_MAX_AREA = 1500; // a stray lit patch smaller than this is noise
const BLOCK = 8; // items are grouped on a coarse grid
const JOIN = 2; // blocks this close belong to the same item (pickles, rings)
const OUT_WIDTH = 520;

const outDir = "assets-src/layers"; // uploaded with scripts/upload-layers.cjs
mkdirSync(outDir, { recursive: true });
const manifest = {};

for (const sheet of SHEETS) {
  const { data, info } = await sharp(sheet.file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  const bright = new Uint8Array(N);
  for (let i = 0; i < N; i++) bright[i] = Math.max(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);

  // ---- 1. the background: dark, and connected to the edge
  const bg = new Uint8Array(N);
  const stack = [];
  const seed = (i) => {
    if (!bg[i] && bright[i] < BG_MAX) {
      bg[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
  while (stack.length) {
    const i = stack.pop();
    const x = i % W;
    if (x > 0) seed(i - 1);
    if (x < W - 1) seed(i + 1);
    if (i >= W) seed(i - W);
    if (i < N - W) seed(i + W);
  }

  /** Labels 4-connected regions where `test(i)` holds; calls back with each region's pixels. */
  function regions(test, each) {
    const seen = new Uint8Array(N);
    for (let start = 0; start < N; start++) {
      if (seen[start] || !test(start)) continue;
      const pixels = [start];
      seen[start] = 1;
      for (let k = 0; k < pixels.length; k++) {
        const i = pixels[k], x = i % W;
        const visit = (j) => {
          if (!seen[j] && test(j)) { seen[j] = 1; pixels.push(j); }
        };
        if (x > 0) visit(i - 1);
        if (x < W - 1) visit(i + 1);
        if (i >= W) visit(i - W);
        if (i < N - W) visit(i + W);
      }
      each(pixels);
    }
  }

  // ---- 2. holes right through an item, and stray specks
  regions((i) => !bg[i] && bright[i] <= HOLE_MAX, (px) => {
    if (px.length >= HOLE_MIN_AREA) px.forEach((i) => (bg[i] = 1));
  });
  regions((i) => !bg[i], (px) => {
    if (px.length < SPECK_MAX_AREA) px.forEach((i) => (bg[i] = 1));
  });

  // ---- 3. group what is left into items, on a coarse grid
  const BW = Math.ceil(W / BLOCK), BH = Math.ceil(H / BLOCK);
  const occupied = new Uint8Array(BW * BH);
  for (let i = 0; i < N; i++) if (!bg[i]) occupied[Math.floor(i / W / BLOCK) * BW + Math.floor((i % W) / BLOCK)] = 1;
  const label = new Int32Array(BW * BH).fill(-1);
  let count = 0;
  for (let start = 0; start < BW * BH; start++) {
    if (!occupied[start] || label[start] !== -1) continue;
    const queue = [start];
    label[start] = count;
    for (let k = 0; k < queue.length; k++) {
      const b = queue[k], bx = b % BW, by = Math.floor(b / BW);
      for (let dy = -JOIN; dy <= JOIN; dy++) {
        for (let dx = -JOIN; dx <= JOIN; dx++) {
          const nx = bx + dx, ny = by + dy;
          if (nx < 0 || ny < 0 || nx >= BW || ny >= BH) continue;
          const n = ny * BW + nx;
          if (occupied[n] && label[n] === -1) { label[n] = count; queue.push(n); }
        }
      }
    }
    count++;
  }

  const items = Array.from({ length: count }, (_, id) => ({ id, x0: W, y0: H, x1: 0, y1: 0, sx: 0, sy: 0, n: 0 }));
  const itemOf = new Int32Array(N).fill(-1);
  for (let i = 0; i < N; i++) {
    if (bg[i]) continue;
    const x = i % W, y = Math.floor(i / W);
    const it = items[label[Math.floor(y / BLOCK) * BW + Math.floor(x / BLOCK)]];
    itemOf[i] = it.id;
    if (x < it.x0) it.x0 = x;
    if (x > it.x1) it.x1 = x;
    if (y < it.y0) it.y0 = y;
    if (y > it.y1) it.y1 = y;
    it.sx += x; it.sy += y; it.n++;
  }

  // ---- 4. reading order: rows top to bottom, then left to right
  const found = items.filter((it) => it.n > 0).map((it) => ({ ...it, cx: it.sx / it.n, cy: it.sy / it.n }));
  found.sort((a, b) => a.cy - b.cy);
  const rows = [];
  for (const it of found) {
    const row = rows[rows.length - 1];
    if (row && it.cy - row.cy < H / 10) row.items.push(it);
    else rows.push({ cy: it.cy, items: [it] });
  }
  const ordered = rows.flatMap((row) => row.items.sort((a, b) => a.cx - b.cx));
  if (ordered.length !== sheet.keys.length) {
    console.error(`${sheet.file}: expected ${sheet.keys.length} items, found ${ordered.length}`);
    ordered.forEach((it) => console.error("  at", Math.round(it.cx), Math.round(it.cy), "size", it.x1 - it.x0, "x", it.y1 - it.y0));
    process.exit(1);
  }

  // every sheet's first item is a bun top: what "full width" means
  const fullWidth = ordered[0].x1 - ordered[0].x0 + 1;

  // ---- 5. cut each one out
  for (let k = 0; k < ordered.length; k++) {
    const it = ordered[k], key = sheet.keys[k];
    const pad = 3;
    const x0 = Math.max(0, it.x0 - pad), y0 = Math.max(0, it.y0 - pad);
    const x1 = Math.min(W - 1, it.x1 + pad), y1 = Math.min(H - 1, it.y1 + pad);
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    const out = Buffer.alloc(w * h * 4);
    const glass = GLASS.has(key);

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = y * W + x, o = ((y - y0) * w + (x - x0)) * 4;
        if (itemOf[i] !== it.id) continue; // stays fully transparent

        // how much of the 3x3 around this pixel is background: its distance from the edge
        let around = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H || bg[ny * W + nx]) around++;
          }
        }
        let alpha = around >= 5 ? 0 : 1 - around / 6; // shave the rim, soften what is next to it

        if (glass) {
          // clear plastic: solid where it is bright, see-through where it is dark
          const lit = Math.min(1, Math.pow(bright[i] / 255, 0.75) * 1.3);
          alpha *= bright[i] > 170 ? 1 : lit;
        }
        if (alpha <= 0) continue;

        // a pixel that was mixed with black is darker than it should be: undo the mix
        const lift = glass ? 1 / Math.max(alpha, 0.35) : around > 0 ? 1 / Math.max(alpha, 0.7) : 1;
        out[o] = Math.min(255, data[i * 3] * lift);
        out[o + 1] = Math.min(255, data[i * 3 + 1] * lift);
        out[o + 2] = Math.min(255, data[i * 3 + 2] * lift);
        out[o + 3] = Math.round(alpha * 255);
      }
    }

    const width = Math.min(OUT_WIDTH, w);
    const file = `${key}.webp`;
    const saved = await sharp(out, { raw: { width: w, height: h, channels: 4 } })
      .resize({ width })
      .webp({ quality: 86, alphaQuality: 92 })
      .toFile(`${outDir}/${file}`);

    manifest[key] = {
      file,
      w: saved.width,
      h: saved.height,
      // how wide it is next to a bun: a pickle row is narrower, a leaf wider
      rel: Math.round(((it.x1 - it.x0 + 1) / fullWidth) * 100) / 100,
    };
    console.log(key.padEnd(18), `${saved.width}x${saved.height}`.padEnd(10), `rel ${manifest[key].rel}`, `${Math.round(saved.size / 1024)} KB`);
  }
}

// ---- 6. fries as they are served: in the carton --------------------------
// The sheet has the fries and the carton apart. Served, the fries stand IN
// the carton: behind its red front, in front of its white back. So the carton
// goes down first, the fries over it, and then the carton's red front alone
// is laid back over the fries. The cheese version gets the sauce on top.
async function friesInCarton(key, withCheese) {
  const CW = 400; // the carton's width in the picture
  const carton = await sharp(`${outDir}/fries-box.webp`).resize({ width: CW }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: cw, height: ch } = carton.info;

  // the red front: every carton pixel that is red rather than white
  const front = Buffer.from(carton.data);
  for (let i = 0; i < cw * ch; i++) {
    const r = front[i * 4], g = front[i * 4 + 1], b = front[i * 4 + 2];
    if (!(r > 120 && g < 110 && b < 110)) front[i * 4 + 3] = 0;
  }

  const fries = await sharp(`${outDir}/fries.webp`).resize({ width: Math.round(CW * 1.02) }).toBuffer({ resolveWithObject: true });
  const W = CW + 80;
  const cartonTop = Math.round(fries.info.height * 0.5); // half the fries stand clear of the carton
  const H = cartonTop + ch;
  const left = (w) => Math.round((W - w) / 2);
  const raw = (data) => ({ raw: { width: cw, height: ch, channels: 4 } });

  const parts = [
    { input: await sharp(carton.data, raw()).png().toBuffer(), left: left(cw), top: cartonTop },
    { input: fries.data, left: left(fries.info.width), top: 0 },
    { input: await sharp(front, raw()).png().toBuffer(), left: left(cw), top: cartonTop },
  ];
  if (withCheese) {
    const cheese = await sharp(`${outDir}/cheese-sauce.webp`).resize({ width: Math.round(CW * 0.72) }).toBuffer({ resolveWithObject: true });
    parts.push({ input: cheese.data, left: left(cheese.info.width), top: Math.round(fries.info.height * 0.12) });
  }

  const file = `${key}.webp`;
  const flat = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(parts)
    .png()
    .toBuffer();
  const saved = await sharp(flat).trim().webp({ quality: 86, alphaQuality: 92 }).toFile(`${outDir}/${file}`);
  manifest[key] = { file, w: saved.width, h: saved.height, rel: 0.7 };
  console.log(key.padEnd(18), `${saved.width}x${saved.height}`.padEnd(10), "composed  ", `${Math.round(saved.size / 1024)} KB`);
}
await friesInCarton("fries-boxed", false);
await friesInCarton("cheese-fries-boxed", true);

mkdirSync("assets-src", { recursive: true });
writeFileSync("assets-src/photoLayers.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(`\n${Object.keys(manifest).length} layers written to ${outDir}/`);
