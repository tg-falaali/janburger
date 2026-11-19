// The layers a menu item is built from. An item holds a list of their keys,
// top to bottom:  layers: ["bun-top", "lettuce", "patty", "bun-bottom"]
//
// Nothing is built in. Every layer - its cut-out picture and how it behaves -
// is managed from the dashboard (Layers): the picture is in Firebase Storage,
// the settings in the database at layers/{key}:
//   { label, labelAr, url, path, w, h,
//     kind: "ingredient" | "top" | "base" | "whole",
//     itemType: "burger" | "hotdog" | "fries"     (a top or base: what it is for)
//     addTo: ["burger", "hotdog", "fries"],        (an ingredient: where it can be added)
//     meat, width, closed, open, order }
// They are merged in here by registerCustomLayers() as they arrive.
//
// A photograph shows a layer from above and to the side, so how layers sit
// together is set per layer, as a share of its own height:
//   closed  how far it slides up behind the layer above when the stack is shut
//   open    how far it still overlaps when the stack is apart
// and `width`, in units where a bun is 120 wide.

import { reactive } from "vue";

export const LAYERS = reactive({});
const PHOTOS = reactive({});

const FIT = { closed: 0.64, open: 0.34 };

// what the sample data uses (the keys of layers in the database)
export const FRIES = ["fries-boxed"];
export const CHEESE_FRIES = ["cheese-fries-boxed"];
export const SOFT_DRINK = ["soft-drink"];
export const WATER = ["water-bottle"];
export const CLASSIC_BURGER = ["bun-top", "lettuce", "onion", "tomato", "egg", "cheese", "patty", "bun-bottom"];
export const MAX_LAYERS = 14;

const toLayer = (key, row) => ({
  key,
  label: row.label || key,
  labelAr: row.labelAr || "",
  kind: row.kind || "ingredient",
  itemType: row.itemType || "",
  fixed: row.kind === "base" || row.kind === "top" || row.kind === "whole",
  meat: !!row.meat,
  addTo: Array.isArray(row.addTo) ? row.addTo : [],
  order: Number(row.order) || 999,
  custom: true,
  h: 20,
  closed: -4,
  svg: "",
});
const toPhoto = (row) => ({
  file: row.url,
  w: Number(row.w) || 400,
  h: Number(row.h) || 200,
  rel: (Number(row.width) || 120) / 120,
  fit: {
    ...(row.closed != null ? { closed: Number(row.closed) } : {}),
    ...(row.open != null ? { open: Number(row.open) } : {}),
    ...(row.width != null ? { width: Number(row.width) } : {}),
  },
});

// ---- layers from the database ----------------------------------------------
const known = new Set();
export function registerCustomLayers(rows) {
  const incoming = rows || {};
  for (const key of [...known]) {
    if (!incoming[key]?.url) {
      delete LAYERS[key];
      delete PHOTOS[key];
      known.delete(key);
    }
  }
  for (const [key, row] of Object.entries(incoming)) {
    if (!row || !row.url) continue;
    LAYERS[key] = toLayer(key, row);
    PHOTOS[key] = toPhoto(row);
    known.add(key);
  }
}

export function customLayerKeys() {
  return [...known];
}

const byOrder = (a, b) => (LAYERS[a]?.order ?? 999) - (LAYERS[b]?.order ?? 999);

/** Every layer there is, for a picker. */
export function layerOptions() {
  return Object.keys(LAYERS)
    .filter((key) => !LAYERS[key].hidden)
    .sort(byOrder)
    .map((value) => {
      const layer = LAYERS[value];
      return { value, label: layer.label, labelAr: layer.labelAr, kind: layer.kind, custom: true, src: photoOf(value)?.src || "" };
    });
}

// ---- the build-your-own game ------------------------------------------------
/** What kind of item this is: from its top or base ("burger", "hotdog", "fries"). */
function itemTypeOf(keys) {
  for (const key of keys) {
    const type = LAYERS[key]?.itemType;
    if (type) return type;
  }
  return "";
}

/**
 * What a customer may add to this item: the ingredients set to be added to
 * its kind of item, in their order. A meat only if the item already has it -
 * more beef on a beef burger, never chicken on it.
 */
export function extrasFor(keys) {
  const type = itemTypeOf(keys);
  if (!type) return [];
  return Object.keys(LAYERS)
    .filter((key) => {
      const layer = LAYERS[key];
      if (layer.hidden || layer.fixed || !layer.addTo.includes(type)) return false;
      return !layer.meat || keys.includes(key);
    })
    .sort(byOrder);
}

/** Adds a layer where it belongs: on top of the base (bottom bun, carton), not under it. */
export function addLayer(keys, key) {
  const next = [...keys];
  const last = next[next.length - 1];
  if (last && LAYERS[last]?.fixed) next.splice(next.length - 1, 0, key);
  else next.push(key);
  return next;
}

// ---- pictures ---------------------------------------------------------------
const photoOf = (key) => {
  const photo = PHOTOS[key];
  if (!photo) return null;
  const fit = { ...FIT, ...photo.fit };
  const src = /^(https?:|data:|blob:)/.test(photo.file) ? photo.file : "layers/" + photo.file;
  return { ...photo, src, width: fit.width ?? Math.round(120 * photo.rel), closed: fit.closed, open: fit.open };
};

/**
 * Fries are shown as they are served: standing in their carton, as one
 * picture. An item saved as the separate parts (fries + carton) is shown the
 * same way, where that picture exists.
 */
function asServed(keys) {
  if (keys.includes("fries") && keys.includes("fries-box")) {
    const whole = keys.includes("cheese-sauce") ? "cheese-fries-boxed" : "fries-boxed";
    if (LAYERS[whole]) return [whole];
  }
  return keys;
}

/** The layers of an item that exist, in the order given, each with its picture. */
export function resolveLayers(keys) {
  return asServed(Array.isArray(keys) ? keys : [])
    .filter((key) => LAYERS[key])
    .map((key) => ({ ...LAYERS[key], key, photo: photoOf(key) }));
}

/** True when every layer of the item has a picture. */
export function hasPhotos(keys) {
  const layers = resolveLayers(keys);
  return layers.length > 0 && layers.every((layer) => layer.photo);
}

// ---- a layer being made in the dashboard, before it is saved ---------------
export const PREVIEW_KEY = "__preview";
export function setPreviewLayer(row) {
  if (!row || !row.url) {
    delete LAYERS[PREVIEW_KEY];
    delete PHOTOS[PREVIEW_KEY];
    return;
  }
  LAYERS[PREVIEW_KEY] = { ...toLayer(PREVIEW_KEY, row), label: row.label || "New layer", hidden: true };
  PHOTOS[PREVIEW_KEY] = toPhoto(row);
}

/** The usual fit for a kind of layer: how wide, and how far it tucks in. */
export function defaultFit(kind) {
  if (kind === "whole") return { width: 96, closed: 0, open: 0 };
  if (kind === "base") return { width: 116, closed: 0.58, open: 0.34 };
  if (kind === "top") return { width: 120, closed: 0.64, open: 0.34 };
  return { width: 112, closed: 0.66, open: 0.3 };
}
