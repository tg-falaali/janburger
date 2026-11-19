<template>
  <div>
    <!-- toolbar -->
    <div class="dtool">
      <q-input v-model="search" dense outlined clearable placeholder="Search layers" class="dtool-search">
        <template #prepend><q-icon name="search" /></template>
      </q-input>
      <div class="dchips">
        <button
          v-for="f in FILTERS" :key="f.value" type="button" class="dchip"
          :class="{ 'is-on': show === f.value }" @click="show = f.value"
        >
          {{ f.label }} <span class="dchip-n">{{ counts[f.value] }}</span>
        </button>
      </div>
      <q-space />
      <q-btn unelevated rounded no-caps color="primary" icon="add_photo_alternate" label="New layer" @click="openNew" />
    </div>

    <div v-if="!rows.length" class="dempty">
      <q-icon name="layers" size="42px" />
      <div class="dempty-title">{{ all.length ? "Nothing matches" : "No layers yet" }}</div>
      <div>Upload a cut-out picture of a new ingredient, bun or item, and it can be used in any menu item.</div>
      <q-btn v-if="!all.length" flat no-caps color="primary" label="Upload the first one" @click="openNew" />
    </div>

    <!-- the layers -->
    <div class="lgrid">
      <component
        :is="layer.custom ? 'button' : 'div'" v-for="layer in rows" :key="layer.key"
        class="lcard" :class="{ 'is-custom': layer.custom }" :type="layer.custom ? 'button' : undefined"
        @click="layer.custom && openEdit(layer.key)"
      >
        <span class="lcard-pic">
          <img v-if="layer.src" :src="layer.src" alt="" loading="lazy" />
          <q-icon v-else name="image_not_supported" size="28px" />
        </span>
        <span class="lcard-name">{{ layer.label }}</span>
        <span class="lcard-ar" lang="ar">{{ layer.labelAr }}</span>
        <span class="lcard-tags">
          <span class="dtag">{{ KINDS.find((k) => k.value === layer.kind)?.label || "Ingredient" }}</span>
          <span v-if="usedIn(layer.key).length" class="dtag">In {{ usedIn(layer.key).length }} item{{ usedIn(layer.key).length > 1 ? "s" : "" }}</span>
        </span>
        <q-icon v-if="layer.custom" name="edit" class="lcard-edit" />
      </component>
    </div>

    <!-- the editor -->
    <q-dialog v-model="dialog" persistent :maximized="$q.screen.lt.md" transition-show="slide-up" transition-hide="slide-down">
      <q-card class="ded">
        <header class="ded-head">
          <div>
            <div class="ded-title">{{ editingKey ? "Edit layer" : "New layer" }}</div>
            <div class="ded-sub">A cut-out picture that can be stacked into menu items</div>
          </div>
          <q-btn flat round icon="close" aria-label="Close" @click="close" />
        </header>

        <div class="ded-body">
          <q-form ref="formRef" class="ded-form" @submit.prevent="save">
            <!-- 1. picture -->
            <section class="dsec">
              <div class="dsec-title"><span class="dsec-n">1</span> Picture</div>
              <label
                class="drop" :class="{ 'is-over': dragOver, 'has-pic': !!form.url }"
                @dragover.prevent="dragOver = true" @dragleave="dragOver = false" @drop.prevent="onDrop"
              >
                <input type="file" accept="image/*" class="drop-input" @change="onPick" />
                <template v-if="form.url">
                  <img :src="form.url" alt="" class="drop-pic" />
                  <span class="drop-change"><q-icon name="swap_horiz" /> Choose another picture</span>
                </template>
                <template v-else>
                  <q-icon name="cloud_upload" size="38px" />
                  <span class="drop-title">Drop a picture here, or click to choose</span>
                  <span class="drop-hint">PNG or WebP with a see-through background works best</span>
                </template>
                <q-inner-loading :showing="preparing" />
              </label>
              <div v-if="sourceFile" class="drop-tools">
                <q-toggle v-model="cutBackground" dense label="Take away a plain background" @update:model-value="prepare" />
                <span v-if="picture" class="drop-meta">{{ picture.w }} × {{ picture.h }} px · {{ kb(picture.blob.size) }}</span>
              </div>
              <div v-if="picture && !picture.transparent && !cutBackground" class="dwarn">
                <q-icon name="info" /> This picture has no see-through background, so it will show as a box. Switch on
                "Take away a plain background" if it is on a plain colour.
              </div>
            </section>

            <!-- 2. names -->
            <section class="dsec">
              <div class="dsec-title"><span class="dsec-n">2</span> Name</div>
              <div class="form-row">
                <q-input
                  v-model.trim="form.label" label="Name in English" outlined dense
                  :rules="[(v) => !!v || 'Give it a name']" lazy-rules
                />
                <q-input v-model.trim="form.labelAr" label="الاسم بالعربي" outlined dense dir="rtl" />
              </div>
              <div class="dkey">
                Saved as <code>{{ keyFor || "…" }}</code>
                <span v-if="keyClash" class="text-negative"> — that name is already taken, please change it</span>
              </div>
            </section>

            <!-- 3. kind -->
            <section class="dsec">
              <div class="dsec-title"><span class="dsec-n">3</span> What is it?</div>
              <div class="kinds">
                <button
                  v-for="k in KINDS" :key="k.value" type="button" class="kind"
                  :class="{ 'is-on': form.kind === k.value }" @click="setKind(k.value)"
                >
                  <q-icon :name="k.icon" size="22px" />
                  <span class="kind-name">{{ k.label }}</span>
                  <span class="kind-hint">{{ k.hint }}</span>
                </button>
              </div>
              <template v-if="form.kind === 'top' || form.kind === 'base'">
                <div class="dlabel">It is the {{ form.kind === "top" ? "top" : "base" }} of</div>
                <div class="row q-gutter-sm">
                  <q-radio v-for="t in ITEM_TYPES" :key="t.value" v-model="form.itemType" :val="t.value" :label="t.label" dense />
                </div>
                <div class="dhint">Items built on it offer the ingredients set to be added to {{ ITEM_TYPES.find((t) => t.value === form.itemType)?.label.toLowerCase() || "them" }}.</div>
              </template>
              <template v-if="form.kind === 'ingredient'">
                <div class="dlabel">Customers can add it to</div>
                <div class="row q-gutter-sm">
                  <q-checkbox v-model="form.addTo" val="burger" label="Burgers" dense />
                  <q-checkbox v-model="form.addTo" val="hotdog" label="Hot dogs" dense />
                  <q-checkbox v-model="form.addTo" val="fries" label="Fries" dense />
                </div>
                <q-toggle
                  v-model="form.meat" dense class="q-mt-sm"
                  label="It is a meat - an item keeps its own, and only extras can be taken out"
                />
              </template>
            </section>

            <!-- 4. fit -->
            <section class="dsec">
              <div class="dsec-title">
                <span class="dsec-n">4</span> Size and stacking
                <q-space />
                <q-btn flat dense no-caps size="sm" color="primary" label="Reset" @click="resetFit" />
              </div>
              <div class="dslider">
                <span>Width</span>
                <q-slider v-model="form.width" :min="40" :max="160" :step="1" label color="primary" />
              </div>
              <div v-if="form.kind !== 'whole'" class="dslider">
                <span>Tucks under the layer above (closed)</span>
                <q-slider v-model="form.closed" :min="0" :max="0.9" :step="0.01" color="primary" />
              </div>
              <div v-if="form.kind !== 'whole'" class="dslider">
                <span>Overlap when opened</span>
                <q-slider v-model="form.open" :min="0" :max="0.6" :step="0.01" color="primary" />
              </div>
            </section>
          </q-form>

          <!-- live preview -->
          <aside class="ded-preview">
            <div class="dprev-head">
              <span>Preview</span>
              <q-btn-toggle
                v-model="previewOpen" dense no-caps rounded unelevated toggle-color="primary" color="white" text-color="dark"
                :options="[{ label: 'Closed', value: false }, { label: 'Open', value: true }]"
              />
            </div>
            <div class="dprev-stage stage">
              <BurgerStack v-if="form.url" :layers="previewLayers" :open="previewOpen" :labels="false" />
              <div v-else class="dprev-empty">Choose a picture to see it in a burger</div>
            </div>
            <div class="dprev-note">Shown in a sample {{ previewKindLabel }} — the menu uses the same settings.</div>
          </aside>
        </div>

        <footer class="ded-foot">
          <q-btn
            v-if="editingKey" flat no-caps color="negative" icon="delete_outline" label="Delete layer"
            @click="confirmRemove"
          />
          <q-space />
          <q-btn flat no-caps label="Cancel" @click="close" />
          <q-btn unelevated rounded no-caps color="primary" icon="check" label="Save layer" :loading="busy" @click="save" />
        </footer>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useQuasar } from "quasar";
import BurgerStack from "components/BurgerStack.vue";
import { useSiteData } from "src/composables/useSiteData";
import { LAYERS, layerOptions, setPreviewLayer, defaultFit, PREVIEW_KEY } from "src/utils/burgerLayers";
import { prepareLayerImage, slugify } from "src/utils/imagePrep";

const $q = useQuasar();
const { state, saveLayer, removeLayer } = useSiteData();

const FILTERS = [
  { value: "all", label: "All" },
  { value: "ingredient", label: "Ingredients" },
  { value: "bun", label: "Buns & bases" },
  { value: "whole", label: "Whole items" },
];
const inFilter = (l, f) => f === "all" || (f === "bun" ? l.kind === "top" || l.kind === "base" : l.kind === f);
const ITEM_TYPES = [
  { value: "burger", label: "Burgers" },
  { value: "hotdog", label: "Hot dogs" },
  { value: "fries", label: "Fries" },
];
const KINDS = [
  { value: "ingredient", icon: "lunch_dining", label: "Ingredient", hint: "Goes between the buns" },
  { value: "top", icon: "vertical_align_top", label: "Top", hint: "A top bun, a lid" },
  { value: "base", icon: "vertical_align_bottom", label: "Base", hint: "A bottom bun, a carton" },
  { value: "whole", icon: "local_drink", label: "Whole item", hint: "Shown as it is: a drink" },
];

// ---- the list ---------------------------------------------------------------
const search = ref("");
const show = ref("all");
const all = computed(() => {
  void state.layers; // re-read when an upload arrives
  return layerOptions().map((o) => ({ key: o.value, ...o }));
});
const counts = computed(() => Object.fromEntries(FILTERS.map((f) => [f.value, all.value.filter((l) => inFilter(l, f.value)).length])));
const rows = computed(() => {
  const q = (search.value || "").toLowerCase();
  return all.value
    .filter((l) => inFilter(l, show.value))
    .filter((l) => !q || `${l.label} ${l.labelAr} ${l.key}`.toLowerCase().includes(q));
});
const usedIn = (key) => state.menu.filter((m) => (m.layers || []).includes(key));

// ---- the editor -------------------------------------------------------------
const dialog = ref(false);
const busy = ref(false);
const formRef = ref(null);
const editingKey = ref("");
const form = ref({});
const sourceFile = ref(null);
const picture = ref(null); // the prepared image, when a new one was chosen
const preparing = ref(false);
const cutBackground = ref(false);
const dragOver = ref(false);
const previewOpen = ref(true);

const blank = () => ({ label: "", labelAr: "", kind: "ingredient", itemType: "burger", addTo: ["burger"], meat: false, url: "", w: 0, h: 0, ...defaultFit("ingredient") });
const nextLayerOrder = () => Object.values(state.layers || {}).reduce((m, l) => Math.max(m, Number(l.order) || 0), 0) + 1;

function openNew() {
  editingKey.value = "";
  form.value = blank();
  sourceFile.value = null;
  picture.value = null;
  cutBackground.value = false;
  previewOpen.value = true;
  dialog.value = true;
}

function openEdit(key) {
  const row = state.layers[key];
  if (!row) return;
  editingKey.value = key;
  form.value = { ...blank(), ...JSON.parse(JSON.stringify(row)), addTo: [...(row.addTo || [])] };
  sourceFile.value = null;
  picture.value = null;
  cutBackground.value = false;
  previewOpen.value = true;
  dialog.value = true;
}

function close() {
  dialog.value = false;
  setPreviewLayer(null);
  if (picture.value) URL.revokeObjectURL(picture.value.previewUrl);
}

const keyFor = computed(() => editingKey.value || slugify(form.value.label));
const keyClash = computed(() => !editingKey.value && !!keyFor.value && !!LAYERS[keyFor.value]);

function setKind(kind) {
  form.value.kind = kind;
  Object.assign(form.value, defaultFit(kind));
  if (kind !== "ingredient") form.value.meat = false;
}
const resetFit = () => Object.assign(form.value, defaultFit(form.value.kind));

const onPick = (e) => {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (file) choose(file);
};
const onDrop = (e) => {
  dragOver.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) choose(file);
};
function choose(file) {
  sourceFile.value = file;
  cutBackground.value = false;
  if (!form.value.label) form.value.label = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  prepare();
}
async function prepare() {
  if (!sourceFile.value) return;
  preparing.value = true;
  try {
    const old = picture.value;
    picture.value = await prepareLayerImage(sourceFile.value, { removeBackground: cutBackground.value });
    if (old) URL.revokeObjectURL(old.previewUrl);
    form.value.url = picture.value.previewUrl;
    form.value.w = picture.value.w;
    form.value.h = picture.value.h;
  } catch (err) {
    $q.notify({ type: "negative", message: err.message });
  } finally {
    preparing.value = false;
  }
}

// the sample it is shown in, depending on what it is
const previewLayers = computed(() => {
  const P = PREVIEW_KEY;
  switch (form.value.kind) {
    case "top": return [P, "lettuce", "tomato", "cheese", "patty", "bun-bottom"];
    case "base": return ["bun-top", "lettuce", "tomato", "cheese", "patty", P];
    case "whole": return [P];
    default: return ["bun-top", "lettuce", P, "cheese", "patty", "bun-bottom"];
  }
});
const previewKindLabel = computed(() => (form.value.kind === "whole" ? "spot on the menu" : "burger"));

// keep the preview layer in step with the form
watch(
  () => [dialog.value, form.value],
  ([open, f]) => {
    if (open) setPreviewLayer({ ...f, url: f.url });
  },
  { deep: true }
);
onBeforeUnmount(() => setPreviewLayer(null));

const kb = (bytes) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

async function save() {
  const ok = await formRef.value?.validate();
  if (!ok) return;
  if (!form.value.url) {
    $q.notify({ type: "warning", message: "Choose a picture first." });
    return;
  }
  if (!keyFor.value || keyClash.value) {
    $q.notify({ type: "warning", message: "Please give it a different name." });
    return;
  }
  busy.value = true;
  try {
    const f = form.value;
    const details = {
      label: f.label,
      labelAr: f.labelAr || "",
      kind: f.kind,
      ...(f.kind === "top" || f.kind === "base" ? { itemType: f.itemType || "burger" } : {}),
      addTo: f.kind === "ingredient" ? f.addTo : [],
      order: Number(f.order) || nextLayerOrder(),
      meat: f.kind === "ingredient" && !!f.meat,
      width: Number(f.width),
      closed: f.kind === "whole" ? 0 : Number(f.closed),
      open: f.kind === "whole" ? 0 : Number(f.open),
      w: f.w,
      h: f.h,
      // an unchanged picture keeps its address; a new one gets one on upload
      ...(picture.value ? {} : { url: f.url, path: f.path || "" }),
      updatedAt: Date.now(),
    };
    await saveLayer(keyFor.value, details, picture.value);
    $q.notify({ type: "positive", message: `“${f.label}” saved` });
    close();
  } catch (err) {
    $q.notify({ type: "negative", message: err?.message || "Could not save the layer.", timeout: 8000 });
  } finally {
    busy.value = false;
  }
}

function confirmRemove() {
  const key = editingKey.value;
  const items = usedIn(key);
  $q.dialog({
    title: "Delete this layer?",
    message: items.length
      ? `It is used in ${items.map((i) => i.name).join(", ")}. It will disappear from ${items.length > 1 ? "them" : "it"}. This cannot be undone.`
      : "Its picture is deleted too. This cannot be undone.",
    cancel: { flat: true, noCaps: true, label: "Keep it" },
    ok: { unelevated: true, noCaps: true, color: "negative", label: "Delete" },
  }).onOk(async () => {
    try {
      await removeLayer(key);
      $q.notify({ type: "positive", message: "Layer deleted" });
      close();
    } catch (err) {
      $q.notify({ type: "negative", message: err?.message || "Could not delete it." });
    }
  });
}
</script>
