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
            <span class="mgroup-rule" aria-hidden="true"></span>
            <span class="mgroup-count">{{ group.items.length }}</span>
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
                <span v-if="other(item.name, item.nameAr)" class="mcard-ar" dir="auto">{{ other(item.name, item.nameAr) }}</span>
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
          <button
            v-if="photos" type="button" class="stage-burger" :class="{ 'is-static': !canPlay }"
            :aria-label="exploded ? t('menu.putBack') : t('menu.takeApart')" @click="toggle"
          >
            <BurgerStack :key="selected.id" :layers="build" :open="exploded && canPlay" :labels="false" />
          </button>
          <Burger3D v-else :layers="build" :open="exploded && canPlay" />
          <BuildControls
            v-if="canPlay" :layers="build" :extras="extras" :changed="changed" :full="build.length >= MAX_LAYERS"
            @remove="removeAt" @add="add" @reset="reset"
          />
        </template>
        <div v-else class="stage-hint">{{ t("menu.pick") }}</div>
      </aside>
    </div>

    <!-- on a phone there is no right side: the same view comes up from the bottom -->
    <q-dialog v-model="sheet" position="bottom">
      <q-card v-if="selected" class="stage-sheet scroll">
        <q-btn flat round dense icon="close" :aria-label="t('menu.close')" class="stage-close" v-close-popup />
        <div class="stage">
          <button
            v-if="photos" type="button" class="stage-burger" :class="{ 'is-static': !canPlay }"
            :aria-label="exploded ? t('menu.putBack') : t('menu.takeApart')" @click="toggle"
          >
            <BurgerStack :key="selected.id" :layers="build" :open="exploded && canPlay" :labels="false" />
          </button>
          <Burger3D v-else :layers="build" :open="exploded && canPlay" />
          <BuildControls
            v-if="canPlay" :layers="build" :extras="extras" :changed="changed" :full="build.length >= MAX_LAYERS"
            @remove="removeAt" @add="add" @reset="reset"
          />
        </div>
      </q-card>
    </q-dialog>
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
import { resolveLayers, extrasFor, addLayer, hasPhotos, MAX_LAYERS } from "src/utils/burgerLayers";

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

function explodeSoon() {
  clearTimeout(timer);
  exploded.value = false;
  // long enough for the layers to finish dropping into place first
  timer = setTimeout(() => (exploded.value = true), 520 + original.value.length * 70);
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

const reset = () => (build.value = [...original.value]);
const removeAt = (index) => build.value.splice(index, 1);
// pressing the burger itself puts it together or takes it apart
const toggle = () => {
  if (!canPlay.value) return; // a drink or fries: nothing to take apart
  clearTimeout(timer);
  exploded.value = !exploded.value;
};
const add = (key) => {
  if (build.value.length < MAX_LAYERS) build.value = addLayer(build.value, key);
};

// (re)start from the item's own layers whenever a different item is shown,
// or staff change that item's layers while it is on screen
watch(() => original.value.join(), reset, { immediate: true });

function selectItem(item) {
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

onBeforeUnmount(() => clearTimeout(timer));
</script>
