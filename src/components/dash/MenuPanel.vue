<template>
  <div>
    <!-- toolbar -->
    <div class="dtool">
      <q-input v-model="search" dense outlined clearable placeholder="Search the menu" class="dtool-search">
        <template #prepend><q-icon name="search" /></template>
      </q-input>
      <div class="dchips">
        <button type="button" class="dchip" :class="{ 'is-on': filter === 'All' }" @click="filter = 'All'">
          All <span class="dchip-n">{{ state.menu.length }}</span>
        </button>
        <button
          v-for="c in categories" :key="c" type="button" class="dchip"
          :class="{ 'is-on': filter === c }" @click="filter = c"
        >
          {{ c }} <span class="dchip-n">{{ countIn(c) }}</span>
        </button>
      </div>
      <q-space />
      <!-- a new item: blank, or started from one already on the menu -->
      <q-btn-dropdown
        split unelevated rounded no-caps color="primary" icon="add" label="Add item"
        dropdown-icon="expand_more" @click="open()"
      >
        <q-list style="min-width: 240px">
          <q-item v-close-popup clickable @click="open()">
            <q-item-section avatar><q-icon name="note_add" /></q-item-section>
            <q-item-section>
              <q-item-label>New item</q-item-label>
              <q-item-label caption>Start from a blank form</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-close-popup clickable :disable="!state.menu.length" @click="pickOpen = true">
            <q-item-section avatar><q-icon name="content_copy" /></q-item-section>
            <q-item-section>
              <q-item-label>From an existing item</q-item-label>
              <q-item-label caption>Copy one, then change what differs</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
    </div>

    <!-- choosing the item to start from -->
    <q-dialog v-model="pickOpen" @hide="pickSearch = ''">
      <q-card class="dpick">
        <header class="ded-head">
          <div>
            <div class="ded-title">Start from an existing item</div>
            <div class="ded-sub">
              Its name, prices, sizes and picture are copied<template v-if="filter !== 'All'">, into <b>{{ filter }}</b></template>.
            </div>
          </div>
          <q-btn v-close-popup flat round icon="close" aria-label="Close" />
        </header>
        <div class="dpick-search">
          <q-input v-model="pickSearch" dense outlined clearable autofocus placeholder="Find an item">
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </div>
        <div class="dpick-list">
          <button
            v-for="item in pickRows" :key="item.id" type="button" class="drow-main dpick-row"
            @click="startFrom(item)"
          >
            <span class="drow-pic">
              <BurgerStack v-if="hasPicture(item)" mini :layers="item.layers" />
              <q-icon v-else name="restaurant" size="22px" />
            </span>
            <span class="drow-text">
              <span class="drow-name">{{ item.name }}</span>
              <span class="drow-sub">
                <span class="dtag">{{ item.category }}</span>
                <span lang="ar">{{ item.nameAr }}</span>
              </span>
            </span>
            <span class="drow-price">{{ priceLabel(item) }}</span>
          </button>
          <div v-if="!pickRows.length" class="dempty q-pa-md">Nothing matches</div>
        </div>
      </q-card>
    </q-dialog>

    <div v-if="unavailable" class="dnote">
      <q-icon name="visibility_off" /> {{ unavailable }} item{{ unavailable > 1 ? "s are" : " is" }} marked not available today.
    </div>

    <div v-if="!rows.length" class="dempty">
      <q-icon name="restaurant_menu" size="42px" />
      <div class="dempty-title">{{ state.menu.length ? "Nothing matches" : "No menu items yet" }}</div>
      <q-btn v-if="!state.menu.length" flat no-caps color="primary" label="Add the first item" @click="open()" />
    </div>

    <!-- the items -->
    <div class="dlist">
      <div v-for="item in rows" :key="item.id" class="drow" :class="{ 'is-off': item.available === false }">
        <button type="button" class="drow-main" @click="open(item)">
          <span class="drow-pic">
            <BurgerStack v-if="hasPicture(item)" mini :layers="item.layers" />
            <q-icon v-else name="restaurant" size="22px" />
          </span>
          <span class="drow-text">
            <span class="drow-name">{{ item.name }}</span>
            <span class="drow-sub">
              <span class="dtag">{{ item.category }}</span>
              <span lang="ar">{{ item.nameAr }}</span>
            </span>
          </span>
          <span class="drow-price">
            {{ priceLabel(item) }}
            <span v-if="item.sizes?.length" class="drow-sizes">{{ item.sizes.map((s) => s.name).join(" · ") }}</span>
          </span>
        </button>
        <q-toggle
          :model-value="item.available !== false" color="positive" dense
          :aria-label="`${item.name} available today`"
          @update:model-value="(v) => quickSave({ ...item, available: v })"
        >
          <q-tooltip>{{ item.available === false ? "Not available today" : "Available today" }}</q-tooltip>
        </q-toggle>
        <q-btn flat round dense icon="more_vert" :aria-label="`More for ${item.name}`">
          <q-menu auto-close anchor="bottom right" self="top right">
            <q-list dense style="min-width: 170px">
              <q-item clickable @click="open(item)"><q-item-section avatar><q-icon name="edit" /></q-item-section><q-item-section>Edit</q-item-section></q-item>
              <q-item clickable @click="duplicate(item)"><q-item-section avatar><q-icon name="content_copy" /></q-item-section><q-item-section>Duplicate</q-item-section></q-item>
              <q-separator />
              <q-item clickable class="text-negative" @click="remove(item)"><q-item-section avatar><q-icon name="delete_outline" color="negative" /></q-item-section><q-item-section>Delete</q-item-section></q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </div>

    <!-- the editor: a panel from the side, in sections, with a live preview -->
    <q-dialog v-model="dialog" persistent position="right" full-height :maximized="$q.screen.lt.md" @hide="clearPreview">
      <q-card class="ded ded--side">
        <header class="ded-head">
          <div>
            <div class="ded-title">{{ form.id ? "Edit item" : "New item" }}</div>
            <div class="ded-sub">{{ form.name || "Untitled" }}<template v-if="dirty"> · unsaved changes</template></div>
          </div>
          <q-btn flat round icon="close" aria-label="Close" @click="tryClose" />
        </header>

        <q-form ref="formRef" class="ded-scroll" @submit.prevent="save">
          <!-- basics -->
          <section class="dsec">
            <div class="dsec-title"><q-icon name="badge" /> Name and price</div>
            <div class="form-row">
              <q-input
                v-model.trim="form.name" label="Name in English" outlined dense autofocus
                :rules="[(v) => !!v || 'Give it a name']" lazy-rules
              />
              <q-input v-model.trim="form.nameAr" label="الاسم بالعربي" outlined dense dir="rtl" />
            </div>
            <div class="form-row">
              <q-select
                v-model="form.category" :options="categories" label="Category"
                outlined dense use-input new-value-mode="add-unique" input-debounce="0"
                hint="Pick one, or type a new one and press Enter"
                :rules="[(v) => !!v || 'Choose a category']" lazy-rules
                @new-value="(val, done) => done(val.trim())"
              />
              <q-input
                v-if="!form.hasSizes"
                v-model.number="form.price" type="number" step="0.001" min="0" label="Price" outlined dense
                :rules="[(v) => (v !== '' && v !== null && v >= 0) || 'Enter a price']" lazy-rules
              >
                <template #prepend><span class="dprefix">BD</span></template>
              </q-input>
              <div v-else class="dsizes-note">
                <q-icon name="straighten" /> Priced by size, below
              </div>
            </div>

            <!-- one item in several sizes, each with its own price -->
            <q-toggle
              v-model="form.hasSizes" color="primary" label="Comes in sizes (Regular, Large…)"
              @update:model-value="onSizesToggle"
            />
            <div v-if="form.hasSizes" class="dsizes">
              <div v-for="(size, i) in form.sizes" :key="i" class="dsize">
                <q-input
                  v-model.trim="size.name" label="Size" outlined dense
                  :rules="[(v) => !!v || 'Name it']" lazy-rules
                />
                <q-input v-model.trim="size.nameAr" label="بالعربي" outlined dense dir="rtl" />
                <q-input
                  v-model.number="size.price" type="number" step="0.001" min="0" label="Price" outlined dense
                  :rules="[(v) => (v !== '' && v !== null && v >= 0) || 'Price']" lazy-rules
                >
                  <template #prepend><span class="dprefix">BD</span></template>
                </q-input>
                <div class="dsize-tools">
                  <q-btn flat round dense size="sm" icon="arrow_upward" :disable="i === 0" aria-label="Move size up" @click="moveSize(i, -1)" />
                  <q-btn
                    flat round dense size="sm" icon="close" :disable="form.sizes.length <= 2"
                    :aria-label="`Remove ${size.name || 'size'}`" @click="form.sizes.splice(i, 1)"
                  >
                    <q-tooltip v-if="form.sizes.length <= 2">An item in sizes has at least two</q-tooltip>
                  </q-btn>
                </div>
              </div>
              <div class="dsize-add">
                <q-btn
                  v-for="p in SIZE_PRESETS.filter((p) => !form.sizes.some((s) => s.name === p.name))" :key="p.name"
                  flat dense no-caps size="sm" color="primary" icon="add" :label="p.name"
                  @click="form.sizes.push({ ...p, price: null })"
                />
                <q-btn flat dense no-caps size="sm" icon="add" label="Other size" @click="form.sizes.push({ name: '', nameAr: '', price: null })" />
              </div>
            </div>
          </section>

          <!-- description -->
          <section class="dsec">
            <div class="dsec-title"><q-icon name="notes" /> Description <span class="dopt">optional</span></div>
            <q-input v-model.trim="form.description" label="In English" outlined dense autogrow counter maxlength="90" />
            <q-input v-model.trim="form.descriptionAr" label="بالعربي" outlined dense autogrow dir="rtl" counter maxlength="90" />
          </section>

          <!-- picture -->
          <section class="dsec">
            <div class="dsec-title">
              <q-icon name="layers" /> Picture <span class="dopt">built from layers, top to bottom</span>
              <q-space />
              <q-btn flat dense no-caps size="sm" color="primary" label="Classic burger" @click="form.layers = [...CLASSIC_BURGER]" />
              <q-btn v-if="form.layers.length" flat dense no-caps size="sm" label="Clear" @click="form.layers = []" />
            </div>

            <div class="lbuild">
              <div class="lbuild-preview stage">
                <BurgerStack v-if="form.layers.length" :layers="form.layers" :open="previewOpen" :labels="false" />
                <div v-else class="dprev-empty">No picture. Add layers to build one, or leave it empty for a plain card.</div>
                <q-btn
                  v-if="form.layers.length > 1" flat dense no-caps size="sm" class="lbuild-toggle"
                  :icon="previewOpen ? 'unfold_less' : 'unfold_more'" :label="previewOpen ? 'Close' : 'Open'"
                  @click="previewOpen = !previewOpen"
                />
              </div>

              <ol v-if="form.layers.length" class="lorder">
                <li v-for="(key, i) in form.layers" :key="i + key" class="lorder-row">
                  <span class="lorder-n">{{ i + 1 }}</span>
                  <img v-if="photo(key)" :src="photo(key)" alt="" class="lorder-pic" />
                  <span class="lorder-name">{{ LAYERS[key]?.label || key }}</span>
                  <q-btn flat round dense size="sm" icon="arrow_upward" :disable="i === 0" aria-label="Move up" @click="move(i, -1)" />
                  <q-btn flat round dense size="sm" icon="arrow_downward" :disable="i === form.layers.length - 1" aria-label="Move down" @click="move(i, 1)" />
                  <q-btn flat round dense size="sm" icon="close" aria-label="Remove" @click="form.layers.splice(i, 1)" />
                </li>
              </ol>
            </div>

            <div class="dlabel">Add a layer</div>
            <q-input v-model="layerSearch" dense outlined clearable placeholder="Find a layer" class="q-mb-sm">
              <template #prepend><q-icon name="search" size="18px" /></template>
            </q-input>
            <div class="lpalette">
              <button
                v-for="o in palette" :key="o.value" type="button" class="lpal" :title="o.label"
                @click="addPiece(o.value)"
              >
                <span class="lpal-pic"><img v-if="o.src" :src="o.src" alt="" loading="lazy" /></span>
                <span class="lpal-name">{{ o.label }}</span>
                <span v-if="o.custom" class="lpal-new">new</span>
              </button>
            </div>
            <div class="dhint">Pictures for new ingredients are added in <b>Layers</b>, in the side menu.</div>
          </section>

          <!-- visibility -->
          <section class="dsec">
            <div class="dsec-title"><q-icon name="tune" /> On the menu</div>
            <div class="form-row items-center">
              <q-toggle v-model="form.available" color="positive" label="Available today" />
              <q-input v-model.number="form.order" type="number" label="Position" outlined dense hint="Lower shows first" />
            </div>
          </section>
        </q-form>

        <footer class="ded-foot">
          <q-btn v-if="form.id" flat no-caps color="negative" icon="delete_outline" label="Delete" @click="remove(form, true)" />
          <q-space />
          <q-btn flat no-caps label="Cancel" @click="tryClose" />
          <q-btn unelevated rounded no-caps color="primary" icon="check" label="Save" :loading="busy" @click="save" />
        </footer>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useQuasar } from "quasar";
import { useSiteData, formatPrice } from "src/composables/useSiteData";
import BurgerStack from "components/BurgerStack.vue";
import { LAYERS, layerOptions, CLASSIC_BURGER, resolveLayers, addLayer } from "src/utils/burgerLayers";

const $q = useQuasar();
const { state, categories, saveMenuItem, removeMenuItem, nextOrder } = useSiteData();

// ---- the list ---------------------------------------------------------------
const filter = ref("All");
const search = ref("");
const countIn = (c) => state.menu.filter((m) => m.category === c).length;
const unavailable = computed(() => state.menu.filter((m) => m.available === false).length);
const rows = computed(() => {
  const q = (search.value || "").toLowerCase();
  return state.menu
    .filter((m) => filter.value === "All" || m.category === filter.value)
    .filter((m) => !q || `${m.name} ${m.nameAr} ${m.description || ""}`.toLowerCase().includes(q));
});
const hasPicture = (item) => resolveLayers(item.layers).length > 0;
// an item in sizes shows its range: "BD 0.700 – 1.300"
function priceLabel(item) {
  const prices = (item.sizes || []).map((s) => Number(s.price) || 0);
  if (prices.length < 2) return formatPrice(item.price);
  const lo = Math.min(...prices), hi = Math.max(...prices);
  return lo === hi ? formatPrice(lo) : `${formatPrice(lo)} – ${hi.toFixed(3)}`;
}

// ---- sizes --------------------------------------------------------------------
const SIZE_PRESETS = [
  { name: "Regular", nameAr: "عادي" },
  { name: "Large", nameAr: "كبير" },
  { name: "Small", nameAr: "صغير" },
  { name: "Medium", nameAr: "وسط" },
];
function onSizesToggle(on) {
  if (on && form.value.sizes.length < 2) {
    const first = form.value.price ?? null;
    form.value.sizes = [
      { ...SIZE_PRESETS[0], price: first },
      { ...SIZE_PRESETS[1], price: null },
    ];
  }
}
function moveSize(i, step) {
  const list = form.value.sizes;
  const j = i + step;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
}

// ---- the editor -------------------------------------------------------------
const dialog = ref(false);
const busy = ref(false);
const formRef = ref(null);
const form = ref({ layers: [] });
const startedAs = ref("");
const previewOpen = ref(true);
const layerSearch = ref("");

const snapshot = () => JSON.stringify(form.value);
const dirty = computed(() => dialog.value && snapshot() !== startedAs.value);

function open(item) {
  form.value = item
    ? {
        description: "", descriptionAr: "", nameAr: "", ...JSON.parse(JSON.stringify(item)),
        available: item.available !== false, layers: [...(item.layers || [])],
        sizes: JSON.parse(JSON.stringify(item.sizes || [])),
        hasSizes: (item.sizes || []).length > 1,
      }
    : {
        name: "", nameAr: "", description: "", descriptionAr: "", price: null, available: true, layers: [],
        sizes: [], hasSizes: false,
        category: filter.value !== "All" ? filter.value : categories.value[0] || "",
        order: nextOrder(state.menu),
      };
  startedAs.value = snapshot();
  previewOpen.value = true;
  layerSearch.value = "";
  dialog.value = true;
}

function duplicate(item) {
  open({ ...item, id: undefined, name: `${item.name} (copy)`, order: nextOrder(state.menu) });
  startedAs.value = ""; // a copy is unsaved from the start
}

// ---- adding from an existing item ----------------------------------------------
const pickOpen = ref(false);
const pickSearch = ref("");
const pickRows = computed(() => {
  const q = (pickSearch.value || "").toLowerCase();
  return state.menu.filter((m) => !q || `${m.name} ${m.nameAr} ${m.category}`.toLowerCase().includes(q));
});
/** A new item, filled in from one already on the menu - into the category in view, if one is chosen. */
function startFrom(item) {
  pickOpen.value = false;
  const category = filter.value !== "All" ? filter.value : item.category;
  open({ ...item, id: undefined, category, available: true, order: nextOrder(state.menu) });
  startedAs.value = ""; // nothing of it is saved yet
}

function tryClose() {
  if (!dirty.value) {
    dialog.value = false;
    return;
  }
  $q.dialog({
    title: "Discard changes?",
    message: "What you changed in this item has not been saved.",
    cancel: { flat: true, noCaps: true, label: "Keep editing" },
    ok: { unelevated: true, noCaps: true, color: "negative", label: "Discard" },
  }).onOk(() => (dialog.value = false));
}
const clearPreview = () => {};

const photo = (key) => resolveLayers([key])[0]?.photo?.src || "";
const palette = computed(() => {
  void state.layers;
  const q = (layerSearch.value || "").toLowerCase();
  return layerOptions().filter((o) => !q || `${o.label} ${o.labelAr} ${o.value}`.toLowerCase().includes(q));
});
function addPiece(key) {
  form.value.layers = form.value.layers.length ? addLayer(form.value.layers, key) : [key];
}
function move(i, step) {
  const list = form.value.layers;
  const j = i + step;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
}

const fail = (err) => $q.notify({ type: "negative", message: err?.message || "Could not save. Try again." });

async function save() {
  const ok = await formRef.value?.validate();
  if (!ok) return;
  busy.value = true;
  try {
    const { hasSizes, sizes, ...f } = form.value;
    const item = { ...f, order: Number(f.order) || 0 };
    if (hasSizes) {
      // the sizes as listed; the item's own price is the smallest, for anything that reads one price
      item.sizes = sizes.map((s) => ({ name: s.name, nameAr: s.nameAr || "", price: Number(s.price) || 0 }));
      item.price = Math.min(...item.sizes.map((s) => s.price));
    } else {
      item.price = Number(f.price) || 0;
    }
    await saveMenuItem(item);
    startedAs.value = snapshot();
    dialog.value = false;
    $q.notify({ type: "positive", message: `“${f.name}” saved`, icon: "check_circle" });
  } catch (err) {
    fail(err);
  } finally {
    busy.value = false;
  }
}

const quickSave = (item) =>
  saveMenuItem(item)
    .then(() => $q.notify({ message: `${item.name}: ${item.available === false ? "not available today" : "available"}`, timeout: 1500 }))
    .catch(fail);

function remove(item, fromEditor = false) {
  $q.dialog({
    title: "Delete this item?",
    message: `“${item.name}” will be removed from the menu. This cannot be undone.`,
    cancel: { flat: true, noCaps: true, label: "Keep it" },
    ok: { unelevated: true, noCaps: true, color: "negative", label: "Delete" },
  }).onOk(async () => {
    try {
      await removeMenuItem(item.id);
      if (fromEditor) dialog.value = false;
      $q.notify({ message: `“${item.name}” deleted` });
    } catch (err) {
      fail(err);
    }
  });
}
</script>
