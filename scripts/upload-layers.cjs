// Moves the layer pictures that used to ship with the site into Firebase
// Storage, and writes each layer's settings to the database at layers/{key},
// so every layer is managed from the dashboard and nothing is built in.
//
//   node scripts/upload-layers.cjs            uploads, then writes scripts/out/layers.json
//   firebase database:update /layers scripts/out/layers.json
//
// It signs in with the Firebase CLI's own login (run `firebase login` first),
// the same access `firebase deploy` uses. Pictures are read from
// assets-src/layers/ (the cut-outs made by scripts/cut-layers.mjs).

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

const BUCKET = "jan-brger.firebasestorage.app";
const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "assets-src", "layers");
const PHOTOS = require(path.join(ROOT, "assets-src", "photoLayers.json"));
const OUT = path.join(__dirname, "out", "layers.json");

// ---- what each layer is, and how it behaves --------------------------------
const NAMES = {
  "bun-top": ["Sesame bun", "خبز بالسمسم"],
  "bun-bottom": ["Toasted bun", "خبز محمص"],
  lettuce: ["Lettuce", "خس"],
  onion: ["Red onion", "بصل أحمر"],
  tomato: ["Tomato", "طماطم"],
  cheese: ["Cheese", "جبن"],
  patty: ["Charcoal beef patty", "لحم على الفحم"],
  chicken: ["Crispy chicken", "دجاج مقرمش"],
  egg: ["Egg", "بيض"],
  pickles: ["Pickles", "مخلل"],
  "hotdog-bun-top": ["Hot dog bun", "خبز هوت دوغ"],
  "hotdog-bun-bottom": ["Hot dog bun", "خبز هوت دوغ"],
  sausage: ["Sausage", "نقانق"],
  "sauce-line": ["Ketchup drizzle", "خط كاتشب"],
  sauce: ["Ketchup", "كاتشب"],
  mayo: ["Mayonnaise", "مايونيز"],
  fries: ["Fries", "بطاطس"],
  "fries-box": ["Carton", "علبة"],
  "cheese-sauce": ["Cheese sauce", "صلصة الجبن"],
  "soft-drink": ["Soft drink", "مشروب غازي"],
  "water-bottle": ["Water", "ماء"],
  "fries-boxed": ["French fries", "بطاطس"],
  "cheese-fries-boxed": ["Cheese fries", "بطاطس بالجبن"],
};
const KIND = {
  "bun-top": ["top", "burger"],
  "hotdog-bun-top": ["top", "hotdog"],
  "bun-bottom": ["base", "burger"],
  "hotdog-bun-bottom": ["base", "hotdog"],
  "fries-box": ["base", "fries"],
  "fries-boxed": ["whole"],
  "cheese-fries-boxed": ["whole"],
  "soft-drink": ["whole"],
  "water-bottle": ["whole"],
};
// what a customer may add, in the order the menu offers them
const ADD_TO = {
  burger: ["lettuce", "onion", "tomato", "pickles", "cheese", "sauce", "mayo", "patty", "chicken"],
  hotdog: ["sausage", "sauce-line", "mayo", "pickles", "cheese", "onion"],
  fries: ["fries", "cheese-sauce"],
};
const MEAT = new Set(["patty", "chicken", "sausage"]);
// how far each sits into the one above (closed) and overlaps it (open), and how wide
const FIT = { closed: 0.64, open: 0.34 };
const PHOTO_FIT = {
  onion: { closed: 0.7 }, cheese: { closed: 0.72, open: 0.42 }, egg: { closed: 0.7 },
  pickles: { closed: 0.55, open: 0 }, sauce: { closed: 0.74 }, mayo: { closed: 0.74 },
  "sauce-line": { closed: 0.45, open: 0 }, sausage: { closed: 0.6, open: 0 },
  "bun-bottom": { closed: 0.58 }, "hotdog-bun-bottom": { closed: 0.62, open: 0 },
  fries: { closed: 0.2, open: 0 }, "fries-box": { closed: 0.8, open: 0.05 },
  "fries-boxed": { width: 96, closed: 0, open: 0 }, "cheese-fries-boxed": { width: 96, closed: 0, open: 0 },
  "soft-drink": { width: 76, closed: 0, open: 0 }, "water-bottle": { width: 50, closed: 0, open: 0 },
};
const ORDER = [
  "bun-top", "lettuce", "onion", "tomato", "pickles", "egg", "cheese", "sauce", "sauce-line", "mayo",
  "cheese-sauce", "patty", "chicken", "sausage", "fries", "bun-bottom", "hotdog-bun-top", "hotdog-bun-bottom",
  "fries-box", "fries-boxed", "cheese-fries-boxed", "soft-drink", "water-bottle",
];

// ---- signing in with the CLI's login ---------------------------------------
async function accessToken() {
  const root = execSync("npm root -g").toString().trim();
  const auth = require(path.join(root, "firebase-tools", "lib", "auth.js"));
  const account = auth.getGlobalDefaultAccount();
  if (!account?.tokens?.refresh_token) throw new Error("Run `firebase login` first.");
  const data = await auth.getAccessToken(account.tokens.refresh_token, ["https://www.googleapis.com/auth/cloud-platform"]);
  return data.access_token;
}

async function upload(token, file, name) {
  const body = fs.readFileSync(file);
  const downloadToken = crypto.randomUUID();
  const meta = {
    name,
    contentType: "image/webp",
    cacheControl: "public, max-age=31536000, immutable",
    metadata: { firebaseStorageDownloadTokens: downloadToken },
  };
  const boundary = "jb" + crypto.randomBytes(8).toString("hex");
  const multipart = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: image/webp\r\n\r\n`),
    body,
    Buffer.from(`\r\n--${boundary}--`),
  ]);
  const res = await fetch(`https://storage.googleapis.com/upload/storage/v1/b/${BUCKET}/o?uploadType=multipart`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": `multipart/related; boundary=${boundary}` },
    body: multipart,
  });
  if (!res.ok) throw new Error(`${name}: ${res.status} ${await res.text()}`);
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(name)}?alt=media&token=${downloadToken}`;
}

(async () => {
  const token = await accessToken();
  const stamp = Date.now();
  const rows = {};
  for (const key of ORDER) {
    const photo = PHOTOS[key];
    if (!photo) throw new Error(`no picture for ${key}`);
    const file = path.join(SRC, photo.file);
    const name = `layers/${key}-${stamp}.webp`;
    const url = await upload(token, file, name);
    const [kind, itemType] = KIND[key] || ["ingredient"];
    const fit = { ...FIT, ...PHOTO_FIT[key] };
    const addTo = Object.keys(ADD_TO).filter((t) => ADD_TO[t].includes(key));
    rows[key] = {
      label: NAMES[key][0],
      labelAr: NAMES[key][1],
      kind,
      ...(itemType ? { itemType } : {}),
      addTo,
      meat: MEAT.has(key),
      width: fit.width ?? Math.round(120 * photo.rel),
      closed: fit.closed,
      open: fit.open,
      w: photo.w,
      h: photo.h,
      url,
      path: name,
      order: ORDER.indexOf(key) + 1,
      updatedAt: stamp,
    };
    console.log("uploaded", key.padEnd(20), `${Math.round(fs.statSync(file).size / 1024)} KB`);
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(rows, null, 2) + "\n");
  console.log(`\n${Object.keys(rows).length} layers uploaded; settings in ${path.relative(ROOT, OUT)}`);
})().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
