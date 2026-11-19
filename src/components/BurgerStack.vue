<template>
  <!-- An item as a stack of layers. Closed, they sit on each other; open,
       they lift apart one after another. A layer is its photograph when
       there is one, and its drawing when there is not. -->
  <div
    class="bstack"
    :class="{
      'is-open': open, 'is-mini': mini, 'is-photo': allPhotos, 'no-labels': !labels,
      'gap-end': gapAt === shown.length && shown.length > 0,
    }"
    role="img"
    :aria-label="mini ? 'Item' : 'Layers: ' + shown.map((l) => l.label).join(', ')"
  >
    <div
      v-for="(layer, i) in shown" :key="layer.id" class="bl" :class="{ 'is-gap': gapAt === i }"
      :style="layerStyle(layer, i)"
    >
      <img
        v-if="layer.photo" class="bl-photo" :src="layer.photo.src" alt=""
        :width="layer.photo.w" :height="layer.photo.h" decoding="async" draggable="false"
      />
      <svg v-else class="bl-art" :viewBox="'0 0 120 ' + layer.h" aria-hidden="true">
        <g v-html="layer.svg"></g>
      </svg>
      <!-- beside the layer itself: take THIS one out -->
      <button
        v-if="removable[i]" type="button" class="bl-remove"
        :aria-label="t('menu.remove', { name: pick(layer.label, layer.labelAr) })"
        @click.stop="$emit('remove', i)" @pointerdown.stop
      >
        <q-icon name="remove" size="15px" />
        <span class="bl-remove-name">{{ pick(layer.label, layer.labelAr) }}</span>
      </button>
      <span v-if="!mini && labels" class="bl-label">
        {{ layer.label }} <span class="bl-ar" lang="ar">{{ layer.labelAr }}</span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { resolveLayers } from "src/utils/burgerLayers";
import { useI18n } from "vue-i18n";
import { useLocale } from "src/i18n";

const props = defineProps({
  layers: { type: Array, default: () => [] },
  open: { type: Boolean, default: false },
  mini: { type: Boolean, default: false },
  labels: { type: Boolean, default: true },
  // while an ingredient is being dragged over the stack: the place it would
  // go in - a gap opens above this layer (or after the last one). -1 = none.
  gapAt: { type: Number, default: -1 },
  // one true/false per layer: may this one be taken out? (none, by default)
  removable: { type: Array, default: () => [] },
});

defineEmits(["remove"]);

const { t } = useI18n();
const { pick } = useLocale();

// How a layer arrives. The first time the stack is shown it is BUILT: the
// bottom lands first and the rest drop onto it one after another. A layer
// added later (the build-your-own game) just drops in at once. Each layer is
// told its delay once, when it is first seen, and keeps it.
const DROP_GAP_MS = 70;
const arrival = new Map();
let building = true;
onMounted(() => (building = false));

const shown = computed(() => {
  const layers = resolveLayers(props.layers);
  // A stable name for each layer - "patty#0", "patty#1" - so adding or
  // removing one leaves the others where they are, on screen and in the DOM.
  const seen = {};
  const named = layers.map((layer) => {
    const nth = (seen[layer.key] = (seen[layer.key] ?? -1) + 1);
    return { ...layer, id: `${layer.key}#${nth}` };
  });
  named.forEach((layer, i) => {
    if (!arrival.has(layer.id)) {
      arrival.set(layer.id, building ? (named.length - 1 - i) * DROP_GAP_MS : 0);
    }
  });
  // forget what has gone, so the same ingredient added again drops in again
  const live = new Set(named.map((layer) => layer.id));
  [...arrival.keys()].forEach((id) => live.has(id) || arrival.delete(id));
  return named;
});

const allPhotos = computed(() => shown.value.length > 0 && shown.value.every((l) => l.photo));

/**
 * Sizes are in the drawing's own units (a bun is 120 wide); the stylesheet
 * turns one unit into pixels with --u, so the same stack can be a 44px icon
 * or the big view. A photograph is taken from above and to the side, so a
 * layer shows its top as well as its edge: shut, each one has to slide a
 * good way up behind the one above it to look stacked.
 */
function layerStyle(layer, i) {
  const base = { "--i": i, "--drop": `${arrival.get(layer.id) ?? 0}ms` };
  if (!layer.photo) return { ...base, "--tuck": layer.closed ?? -4 };
  const { w, h, width, closed, open } = layer.photo;
  const height = (width * h) / w;
  return {
    ...base,
    "--w": width,
    "--tuck": -(closed * height),
    "--open-m": `calc(${-(open * height)} * var(--u))`,
    zIndex: 60 - i, // what is higher up is nearer the eye, so it goes in front
  };
}
</script>
