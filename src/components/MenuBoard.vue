<template>
  <div>
    <div v-if="groups.length > 1" class="cat-row" role="tablist" :aria-label="t('menu.categories')">
      <button
        class="cat-chip"
        :class="{ 'is-on': picked === '' }"
        role="tab"
        :aria-selected="picked === ''"
        @click="picked = ''"
      >
        {{ t("menu.all") }}
      </button>
      <button
        v-for="group in groups"
        :key="group.name"
        class="cat-chip"
        :class="{ 'is-on': picked === group.name }"
        role="tab"
        :aria-selected="picked === group.name"
        @click="picked = group.name"
      >
        {{ category(group.name) }}
      </button>
    </div>

    <div v-if="!groups.length" class="empty-note">
      {{ t("menu.empty") }}
    </div>

    <div v-else class="menu-layout">
      <!-- left: the menu -->
      <div class="mgroups">
        <section v-for="group in shown" :key="group.name" class="mgroup">
          <h3 v-reveal:left class="mgroup-head">
            <span class="mgroup-name">{{ category(group.name) }}</span>
          </h3>

          <div class="mcards">
            <!-- A card with layers is a button: press it and the item comes apart on the right. -->
            <component
              :is="hasLayers(item) ? 'button' : 'div'"
              v-for="(item, i) in group.items"
              :key="item.id"
              v-reveal="i"
              class="mcard"
              :class="{ 'is-on': selected?.id === item.id, 'is-out': item.available === false, 'is-plain': !hasLayers(item) }"
              :type="hasLayers(item) ? 'button' : undefined"
              :aria-pressed="hasLayers(item) ? selected?.id === item.id : undefined"
              @click="hasLayers(item) && selectItem(item)"
            >
              <span class="mcard-art">
                <BurgerStack v-if="hasLayers(item)" mini :layers="item.layers" />
                <q-icon v-else name="restaurant" size="30px" />
              </span>
              <span class="mcard-body">
                <span class="mcard-name">{{ pick(item.name, item.nameAr) }}</span>
                <span v-if="item.available === false" class="sold-out">{{ t("menu.unavailable") }}</span>
                <span v-else-if="pick(item.description, item.descriptionAr)" class="mcard-desc">{{ pick(item.description, item.descriptionAr) }}</span>
              </span>
              <span class="mcard-price" dir="ltr">
                <span class="mcard-bd">{{ t("currency") }}</span>{{ priceOnly(item.price) }}
              </span>
            </component>
          </div>
        </section>
      </div>

      <!-- right: the picked item, taken apart (wide screens) -->
      <aside v-if="!narrow" class="stage">
        <template v-if="selected">
          <!-- press the burger to put it together or take it apart. Not a
               <button>: the minus beside each layer is one, and a button
               cannot hold another. -->
          <div
            v-if="photos" class="stage-burger" :class="{ 'is-static': !canPlay, 'is-eating': eatStage > 0 }"
            :role="canPlay ? 'button' : undefined" :tabindex="canPlay ? 0 : undefined"
            :aria-label="canPlay ? (exploded ? t('menu.putBack') : t('menu.takeApart')) : undefined"
            @click="toggle" @keydown.enter.self.prevent="toggle" @keydown.space.self.prevent="toggle"
          >
            <BurgerStack
              :key="selected.id + '-' + served" :layers="build" :open="exploded && canPlay" :labels="false"
              :gap-at="drag ? drag.index : -1" :removable="removable" @remove="removeAt"
              :class="eatStage > 0 ? 'bite-' + eatStage : ''"
            />
            <!-- crumbs from the last bite -->
            <span v-if="crumbs" :key="crumbs.n" class="crumbs" :style="{ left: crumbs.x + 'px', top: crumbs.y + 'px' }" aria-hidden="true">
              <i v-for="c in 7" :key="c" :style="{ '--c': c }"></i>
            </span>
          </div>
          <Burger3D v-else :layers="build" :open="exploded && canPlay" />
          <BuildControls
            v-if="canPlay" :layers="build" :extras="extras" :changed="changed" :full="build.length >= MAX_LAYERS"
            :eating="eatStage > 0" @remove="removeAt" @add="add" @grab="grab" @reset="reset" @eat="eat"
          />
        </template>
        <div v-else class="stage-hint">{{ t("menu.pick") }}</div>
      </aside>
    </div>

    <!-- on a phone there is no right side: the same view opens in the middle,
         on a pane of frosted glass over the menu -->
    <q-dialog v-model="sheet" class="glass-dialog" transition-show="scale" transition-hide="scale">
      <q-card v-if="selected" class="stage-sheet scroll">
        <div class="stage">
          <!-- press the burger to put it together or take it apart. Not a
               <button>: the minus beside each layer is one, and a button
               cannot hold another. -->
          <div
            v-if="photos" class="stage-burger" :class="{ 'is-static': !canPlay, 'is-eating': eatStage > 0 }"
            :role="canPlay ? 'button' : undefined" :tabindex="canPlay ? 0 : undefined"
            :aria-label="canPlay ? (exploded ? t('menu.putBack') : t('menu.takeApart')) : undefined"
            @click="toggle" @keydown.enter.self.prevent="toggle" @keydown.space.self.prevent="toggle"
          >
            <BurgerStack
              :key="selected.id + '-' + served" :layers="build" :open="exploded && canPlay" :labels="false"
              :gap-at="drag ? drag.index : -1" :removable="removable" @remove="removeAt"
              :class="eatStage > 0 ? 'bite-' + eatStage : ''"
            />
            <!-- crumbs from the last bite -->
            <span v-if="crumbs" :key="crumbs.n" class="crumbs" :style="{ left: crumbs.x + 'px', top: crumbs.y + 'px' }" aria-hidden="true">
              <i v-for="c in 7" :key="c" :style="{ '--c': c }"></i>
            </span>
          </div>
          <Burger3D v-else :layers="build" :open="exploded && canPlay" />
          <BuildControls
            v-if="canPlay" :layers="build" :extras="extras" :changed="changed" :full="build.length >= MAX_LAYERS"
            :eating="eatStage > 0" @remove="removeAt" @add="add" @grab="grab" @reset="reset" @eat="eat"
          />
        </div>
      </q-card>
    </q-dialog>

    <!-- the ingredient in hand, following the finger or the mouse -->
    <Teleport to="body">
      <div
        v-if="drag" class="drag-ghost" :class="{ 'is-over': drag.index >= 0 }"
        :style="{ left: drag.x + 'px', top: drag.y + 'px' }" aria-hidden="true"
      >
        <img v-if="drag.file" :src="'layers/' + drag.file" alt="" draggable="false" />
        <span v-else>{{ drag.label }}</span>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, onBeforeUnmount, ref, watch } from "vue";
import { useQuasar } from "quasar";
import BurgerStack from "components/BurgerStack.vue";

// three.js is only fetched when the menu is actually looked at
const Burger3D = defineAsyncComponent(() => import("components/Burger3D.vue"));
import BuildControls from "components/BuildControls.vue";
import vReveal from "src/directives/reveal";
import { useI18n } from "vue-i18n";
import { useLocale } from "src/i18n";

const { t } = useI18n();
const { pick, other, category } = useLocale();

const priceOnly = (price) => Number(price || 0).toFixed(3);
import { LAYERS, resolveLayers, extrasFor, addLayer, hasPhotos, MAX_LAYERS } from "src/utils/burgerLayers";

const props = defineProps({
  items: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] },
});

const $q = useQuasar();
const narrow = computed(() => $q.screen.width < 900);

const picked = ref("");

const groups = computed(() =>
  props.categories
    .map((name) => ({
      name,
      items: props.items.filter((item) => item.category === name),
    }))
    .filter((group) => group.items.length)
);

const shown = computed(() =>
  picked.value && groups.value.some((g) => g.name === picked.value)
    ? groups.value.filter((g) => g.name === picked.value)
    : groups.value
);

const hasLayers = (item) => resolveLayers(item.layers).length > 0;

// One item is shown at a time. It arrives whole, and a moment later its
// layers lift apart - so the coming-apart is what is seen.
const selectedId = ref(null);
const exploded = ref(false);
const sheet = ref(false);
let timer = null;

const selected = computed(
  () => props.items.find((item) => item.id === selectedId.value && hasLayers(item)) || null
);

// A newly picked item is shown WHOLE - closed, as it is served. It only comes
// apart when the customer presses it, or starts dragging an ingredient in.
function explodeSoon() {
  clearTimeout(timer);
  exploded.value = false;
}

// The build-your-own game: `build` starts as the item's own layers and the
// customer adds to it and takes from it. It is play - nothing is saved, and
// picking another item (or Reset) puts it back as the kitchen makes it.
const build = ref([]);
const original = computed(() => resolveLayers(selected.value?.layers).map((l) => l.key));
const canPlay = computed(() => original.value.length > 1); // a drink is shown whole
const extras = computed(() => extrasFor(original.value));
const changed = computed(() => build.value.join() !== original.value.join());
// photographs when every layer has one; the 3D view is the fallback
const photos = computed(() => hasPhotos(build.value));

// What may be taken out. Never the bun or the carton. And never the meat the
// item is made with: a Jan Meal keeps its beef patty, a Big Jan Meal both of
// them. Meat that was ADDED can come out again - so a patty shows its minus
// only while there are more of them than the item started with.
const MEATS = ["patty", "chicken", "sausage"];
const count = (keys, key) => keys.filter((k) => k === key).length;
const removable = computed(() =>
  build.value.map((key) => {
    if (LAYERS[key]?.fixed) return false;
    if (MEATS.includes(key)) return count(build.value, key) > count(original.value, key);
    return true;
  })
);

const reset = () => (build.value = [...original.value]);

// ---- Eat ------------------------------------------------------------------
// The burger is put together and wolfed down: four quick bites from one side,
// each with a chomp and a spray of crumbs, and what is left is gone. Then the
// item is put away, as if it had never been picked - the dialog closes on a
// phone, and the panel beside the menu empties on a wide screen.
const BITE_MS = 200;
const eatStage = ref(0); // 0 = not eating, 1-4 = bites taken, 5 = finished
const served = ref(0); // a new number = a new burger on the plate
const crumbs = ref(null); // { n, x, y } where the last bite was
// where each bite lands, as a share of the burger's width and height
// big bites, right to left, until nothing is left
const BITES = [[0.96, 0.42], [0.8, 0.72], [0.74, 0.22], [0.55, 0.5], [0.34, 0.24], [0.28, 0.76], [0.08, 0.48]];
const wait = (ms) => new Promise((done) => setTimeout(done, ms));
let eatRun = 0;

async function eat() {
  if (eatStage.value > 0) return;
  const run = ++eatRun;
  clearTimeout(timer);
  if (exploded.value) {
    exploded.value = false; // shut it first: nobody bites a burger in pieces
    await wait(380);
  }
  for (let i = 1; i <= BITES.length; i++) {
    if (run !== eatRun) return;
    eatStage.value = i;
    sprayCrumbs(BITES[i - 1]);
    await wait(BITE_MS);
  }
  if (run !== eatRun) return;
  eatStage.value = BITES.length + 1; // the crumbs of it, fading
  crumbs.value = null;
  await wait(340);
  if (run !== eatRun) return;
  if (sheet.value) {
    sheet.value = false; // let the dialog close before its contents go
    await wait(300);
    if (run !== eatRun) return;
  }
  eatStage.value = 0;
  served.value++;
  selectedId.value = null; // back to how it was before anything was picked
}

function sprayCrumbs([fx, fy]) {
  const holder = [...document.querySelectorAll(".stage-burger")].find((el) => el.getClientRects().length);
  const stack = holder?.querySelector(".bstack");
  if (!stack) return;
  const h = holder.getBoundingClientRect();
  const s = stack.getBoundingClientRect();
  const rtl = document.documentElement.dir === "rtl";
  const x = rtl ? s.right - fx * s.width : s.left + fx * s.width;
  crumbs.value = { n: Date.now(), x: x - h.left, y: s.top + fy * s.height - h.top };
}

function stopEating() {
  eatRun++;
  eatStage.value = 0;
  crumbs.value = null;
}
const removeAt = (index) => {
  if (removable.value[index]) build.value.splice(index, 1);
};
// pressing the burger itself puts it together or takes it apart
const toggle = () => {
  if (!canPlay.value || eatStage.value > 0) return; // nothing to take apart, or it is being eaten
  clearTimeout(timer);
  exploded.value = !exploded.value;
};
const add = (key) => {
  if (build.value.length < MAX_LAYERS) build.value = addLayer(build.value, key);
};

// ---- carrying an ingredient to the burger --------------------------------
// An ingredient is picked up from the tray and dropped INTO the burger, at the
// height it is let go: between whichever two layers the hand is over. A gap
// opens there while it hovers, so it is plain where it will land. Dropped
// anywhere else, nothing happens. This is done with pointer events rather
// than the browser's own drag-and-drop, which does not exist on a phone.
const drag = ref(null); // { key, file, label, x, y, index } while something is in hand
let held = null; // the press that may become a drag
const DRAG_AFTER_PX = 6; // less movement than this is a tap, not a drag

function grab(key, event) {
  if (build.value.length >= MAX_LAYERS) return;
  if (event.button != null && event.button !== 0) return; // left button / finger only
  const layer = resolveLayers([key])[0];
  held = {
    key,
    file: layer?.photo?.file || "",
    label: pick(layer?.label, layer?.labelAr),
    x: event.clientX,
    y: event.clientY,
    moved: false,
  };
  window.addEventListener("pointermove", carry, { passive: false });
  window.addEventListener("pointerup", drop);
  window.addEventListener("pointercancel", letGo);
}

function carry(event) {
  if (!held) return;
  if (!held.moved) {
    if (Math.hypot(event.clientX - held.x, event.clientY - held.y) < DRAG_AFTER_PX) return;
    held.moved = true;
    clearTimeout(timer);
    exploded.value = true; // open it up, so there is somewhere to put the thing
  }
  event.preventDefault();
  drag.value = {
    key: held.key, file: held.file, label: held.label,
    x: event.clientX, y: event.clientY,
    index: slotAt(event.clientX, event.clientY),
  };
}

/** Which place in the stack the point is over: the layer it would go ABOVE, or -1. */
function slotAt(x, y) {
  const stage = [...document.querySelectorAll(".stage-burger")].find((el) => el.getClientRects().length);
  if (!stage) return -1;
  const box = stage.getBoundingClientRect();
  if (x < box.left || x > box.right || y < box.top - 30 || y > box.bottom + 30) return -1;

  const layers = [...stage.querySelectorAll(".bl")];
  let index = layers.length;
  for (let i = 0; i < layers.length; i++) {
    const r = layers[i].getBoundingClientRect();
    if (y < r.top + r.height / 2) {
      index = i;
      break;
    }
  }
  // never above the top bun or under the base: those stay where they are
  const keys = build.value;
  const min = LAYERS[keys[0]]?.fixed ? 1 : 0;
  const max = LAYERS[keys[keys.length - 1]]?.fixed ? keys.length - 1 : keys.length;
  return Math.min(max, Math.max(min, index));
}

function drop() {
  if (held && !held.moved) {
    add(held.key); // a tap: it goes in at the usual place, on top of the base
  } else if (drag.value && drag.value.index >= 0 && build.value.length < MAX_LAYERS) {
    const next = [...build.value];
    next.splice(drag.value.index, 0, drag.value.key);
    build.value = next;
  }
  letGo();
}

function letGo() {
  held = null;
  drag.value = null;
  window.removeEventListener("pointermove", carry);
  window.removeEventListener("pointerup", drop);
  window.removeEventListener("pointercancel", letGo);
}

// (re)start from the item's own layers whenever a different item is shown,
// or staff change that item's layers while it is on screen
watch(() => original.value.join(), reset, { immediate: true });

function selectItem(item) {
  stopEating();
  selectedId.value = item.id;
  if (narrow.value) sheet.value = true;
  explodeSoon();
}

// On a wide screen the side panel starts on the first item rather than empty.
watch(
  () => [props.items, narrow.value],
  () => {
    if (!selected.value && !narrow.value) {
      const first = props.items.find(hasLayers);
      if (first) {
        selectedId.value = first.id;
        explodeSoon();
      }
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  clearTimeout(timer);
  letGo();
});
</script>
