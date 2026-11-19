// Getting a staff member's picture ready to be a menu layer, in the browser,
// before anything is uploaded:
//   1. read it            any image the browser can open
//   2. (optionally) take away a plain background - white, black, a colour
//   3. trim the empty space round it, so the layer is exactly its own size
//   4. shrink it to at most 520px wide and save it as WebP (PNG where the
//      browser cannot write WebP)
// What comes back is a Blob ready for Storage, a URL to preview it with, its
// size, and whether it really has a see-through background.

const MAX_WIDTH = 520;

export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file is not a picture this browser can open."));
    };
    img.src = url;
  });
}

function toCanvas(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  canvas.getContext("2d").drawImage(img, 0, 0);
  return canvas;
}

/** Does the picture already have see-through parts? */
function hasTransparency(data) {
  for (let i = 3; i < data.length; i += 4 * 7) if (data[i] < 250) return true;
  return false;
}

/**
 * Takes away a plain background: whatever is close to the colour of the
 * corners AND can be reached from the edge. A patch of the same colour inside
 * the food is left alone.
 */
function removeBackground(canvas, tolerance = 34) {
  const ctx = canvas.getContext("2d");
  const { width: W, height: H } = canvas;
  const image = ctx.getImageData(0, 0, W, H);
  const d = image.data;
  const corner = (x, y) => {
    const i = (y * W + x) * 4;
    return [d[i], d[i + 1], d[i + 2]];
  };
  const corners = [corner(0, 0), corner(W - 1, 0), corner(0, H - 1), corner(W - 1, H - 1)];
  const bg = [0, 1, 2].map((c) => Math.round(corners.reduce((sum, rgb) => sum + rgb[c], 0) / 4));
  const near = (i) => Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2]) < tolerance * 3;

  const gone = new Uint8Array(W * H);
  const stack = [];
  const seed = (p) => {
    if (!gone[p] && near(p * 4)) {
      gone[p] = 1;
      stack.push(p);
    }
  };
  for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
  while (stack.length) {
    const p = stack.pop();
    const x = p % W;
    if (x > 0) seed(p - 1);
    if (x < W - 1) seed(p + 1);
    if (p >= W) seed(p - W);
    if (p < W * (H - 1)) seed(p + W);
  }
  // clear it, and soften the pixels right next to it so the edge is not jagged
  for (let p = 0; p < W * H; p++) {
    if (gone[p]) {
      d[p * 4 + 3] = 0;
      continue;
    }
    const x = p % W;
    let around = 0;
    if (x > 0 && gone[p - 1]) around++;
    if (x < W - 1 && gone[p + 1]) around++;
    if (p >= W && gone[p - W]) around++;
    if (p < W * (H - 1) && gone[p + W]) around++;
    if (around) d[p * 4 + 3] = Math.round(d[p * 4 + 3] * (1 - around * 0.22));
  }
  ctx.putImageData(image, 0, 0);
}

/** The smallest box round everything that is not see-through. */
function trimBox(canvas) {
  const { width: W, height: H } = canvas;
  const d = canvas.getContext("2d").getImageData(0, 0, W, H).data;
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (d[(y * W + x) * 4 + 3] > 10) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null; // nothing left at all
  const pad = 2;
  return {
    x: Math.max(0, x0 - pad),
    y: Math.max(0, y0 - pad),
    w: Math.min(W, x1 + pad + 1) - Math.max(0, x0 - pad),
    h: Math.min(H, y1 + pad + 1) - Math.max(0, y0 - pad),
  };
}

function toBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob && blob.type === "image/webp") return resolve(blob);
      canvas.toBlob((png) => resolve(png), "image/png"); // no WebP writer here
    }, "image/webp", 0.88);
  });
}

/**
 * The whole preparation. `options.removeBackground` takes away a plain
 * background first.
 */
export async function prepareLayerImage(file, options = {}) {
  if (file.size > 15 * 1024 * 1024) throw new Error("That picture is very large. Please use one under 15 MB.");
  const { img, url } = await loadImage(file);
  try {
    const source = toCanvas(img);
    const ctx = source.getContext("2d");
    let transparent = hasTransparency(ctx.getImageData(0, 0, source.width, source.height).data);
    if (options.removeBackground) {
      removeBackground(source);
      transparent = true;
    }
    const box = trimBox(source);
    if (!box) throw new Error("Nothing is left of the picture once its background is taken away.");

    const scale = Math.min(1, MAX_WIDTH / box.w);
    const out = document.createElement("canvas");
    out.width = Math.max(1, Math.round(box.w * scale));
    out.height = Math.max(1, Math.round(box.h * scale));
    const octx = out.getContext("2d");
    octx.imageSmoothingQuality = "high";
    octx.drawImage(source, box.x, box.y, box.w, box.h, 0, 0, out.width, out.height);

    const blob = await toBlob(out);
    return {
      blob,
      previewUrl: URL.createObjectURL(blob),
      w: out.width,
      h: out.height,
      transparent,
      type: blob.type,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** For the demo, which has no Storage: the picture itself, as text. */
export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** A key for the database from a name: "Beef Bacon" -> "beef-bacon". */
export function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
}
