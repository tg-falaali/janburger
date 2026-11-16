import { reactive, computed } from "vue";
import { ref as dbRef, onValue, set, push, remove, update } from "firebase/database";
import { db, firebaseReady } from "src/firebase/config";
import { seedInfo, seedBranches, seedMenu } from "src/data/seed";

/**
 * Realtime Database layout:
 *   site/info        name, phones, announcement, categories...
 *   branches/{id}    name, nameAr, address, phone, mapUrl, active, order, hours[7]
 *   menu/{id}        name, nameAr, category, price, description, available, order, layers[]
 *
 *
 * Everyone may read; only a signed-in user may write (database.rules.json).
 * Without Firebase keys the same API runs over localStorage, as a demo.
 *
 * RTDB keeps no empty lists and no empty strings' worth of structure: a list
 * that was saved empty comes back as nothing at all. Whatever reads a list
 * here therefore treats "missing" as "empty".
 */

const DEMO_KEY = "jan-burger-demo-v5"; // bumped when the sample data gains fields

const state = reactive({
  demo: !firebaseReady,
  loading: true,
  error: "",
  info: { ...seedInfo, phones: [...seedInfo.phones] },
  branches: [],
  menu: [],
});

let started = false;
const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);
const clone = (value) => JSON.parse(JSON.stringify(value));

/** RTDB hands a list back as an array, or as an object if it has gaps. */
const asList = (value) =>
  Array.isArray(value) ? value.filter((x) => x != null) : value ? Object.values(value) : [];

// ---------------------------------------------------------------- demo mode
function demoLoad() {
  try {
    const saved = JSON.parse(localStorage.getItem(DEMO_KEY));
    if (saved?.info) return saved;
  } catch {
    /* fall through to the seed */
  }
  return { info: seedInfo, branches: seedBranches, menu: seedMenu };
}

function demoSave() {
  try {
    localStorage.setItem(
      DEMO_KEY,
      JSON.stringify({
        info: state.info,
        branches: state.branches,
        menu: state.menu,
      })
    );
  } catch {
    /* private window: the demo just does not persist */
  }
}

function demoUpsert(list, item) {
  const row = clone(item);
  if (!row.id) row.id = `demo-${Date.now()}`;
  const at = list.findIndex((x) => x.id === row.id);
  if (at === -1) list.push(row);
  else list.splice(at, 1, row);
  list.sort(byOrder);
  demoSave();
}

// --------------------------------------------------------------------- start
function start() {
  if (started) return;
  started = true;

  if (state.demo) {
    const data = clone(demoLoad());
    state.info = { ...seedInfo, ...data.info };
    state.branches = data.branches.sort(byOrder);
    state.menu = data.menu.sort(byOrder);
    state.loading = false;
    return;
  }

  let pending = 3;
  const settled = () => {
    if (pending > 0 && --pending === 0) state.loading = false;
  };
  const failed = (err) => {
    state.error = err?.message || "Could not load data";
    state.loading = false;
  };

  onValue(
    dbRef(db, "site/info"),
    (snap) => {
      // The seed only supplies the name and the like until staff save their own.
      const saved = snap.val();
      state.info = saved
        ? {
            ...seedInfo,
            announcement: "",
            ...saved,
            phones: asList(saved.phones),
            categories: asList(saved.categories),
          }
        : { ...seedInfo };
      settled();
    },
    failed
  );

  const listen = (name) =>
    onValue(
      dbRef(db, name),
      (snap) => {
        const rows = snap.val() || {};
        state[name] = Object.entries(rows)
          .map(([id, row]) => ({
            ...row,
            id,
            ...(name === "menu" ? { layers: asList(row.layers) } : { hours: asList(row.hours) }),
          }))
          .sort(byOrder);
        settled();
      },
      failed
    );
  listen("branches");
  listen("menu");
}

// ------------------------------------------------------------------- actions
const withoutId = (item) => {
  const { id, ...rest } = clone(item);
  return rest;
};

async function saveInfo(info) {
  if (state.demo) {
    state.info = clone(info);
    demoSave();
    return;
  }
  await set(dbRef(db, "site/info"), clone(info));
}

async function saveItem(name, item) {
  if (state.demo) return demoUpsert(state[name], item);
  if (item.id) await set(dbRef(db, `${name}/${item.id}`), withoutId(item));
  else await push(dbRef(db, name), withoutId(item));
}

async function removeItem(name, id) {
  if (state.demo) {
    state[name] = state[name].filter((x) => x.id !== id);
    demoSave();
    return;
  }
  await remove(dbRef(db, `${name}/${id}`));
}

/** The sample data as one RTDB tree: { site, branches, menu }. */
export function sampleTree() {
  const keyed = (rows) => Object.fromEntries(rows.map((row) => [row.id, withoutId(row)]));
  return {
    site: { info: clone(seedInfo) },
    branches: keyed(seedBranches),
    menu: keyed(seedMenu),
  };
}

/** Fills an empty project with the sign's branches and a sample menu. */
async function loadSample() {
  if (state.demo) {
    state.info = clone(seedInfo);
    state.branches = clone(seedBranches);
    state.menu = clone(seedMenu);
    demoSave();
    return;
  }
  const tree = sampleTree();
  // one write, three places: all of it lands or none of it does
  await update(dbRef(db), {
    "site/info": tree.site.info,
    branches: tree.branches,
    menu: tree.menu,
  });
}

const nextOrder = (list) =>
  list.reduce((max, x) => Math.max(max, x.order ?? 0), 0) + 1;

export function useSiteData() {
  start();

  /** Categories in the order staff set, then any an item uses that is not listed. */
  const categories = computed(() => {
    const listed = state.info.categories || [];
    const used = state.menu.map((m) => m.category).filter(Boolean);
    return [...new Set([...listed, ...used])];
  });

  return {
    state,
    categories,
    saveInfo,
    saveBranch: (b) => saveItem("branches", b),
    removeBranch: (id) => removeItem("branches", id),
    saveMenuItem: (m) => saveItem("menu", m),
    removeMenuItem: (id) => removeItem("menu", id),
    loadSample,
    nextOrder,
  };
}

export const formatPrice = (price) => `BD ${Number(price || 0).toFixed(3)}`;
