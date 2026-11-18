<template>
  <!-- The build-your-own controls: what is in it (minus to take out) and what
       can go in (plus to add). -->
  <div class="build">
    <div v-if="extras.length" class="build-add">
      <button
        v-for="key in extras" :key="key" class="build-chip" type="button" :disabled="full"
        :aria-label="t('menu.add', { name: pick(LAYERS[key].label, LAYERS[key].labelAr) })"
        @pointerdown="$emit('grab', key, $event)"
        @keydown.enter.prevent="$emit('add', key)" @keydown.space.prevent="$emit('add', key)"
      >
        <img v-if="thumb(key)" class="build-thumb" :src="'layers/' + thumb(key)" alt="" draggable="false" />
        <q-icon v-else name="drag_indicator" size="15px" />
        {{ pick(LAYERS[key].label, LAYERS[key].labelAr) }}
      </button>
    </div>
    <div v-if="extras.length" class="build-hint">
      <q-icon name="pan_tool_alt" size="15px" /> {{ t("menu.dragHint") }}
    </div>

    <div class="build-foot">
      <span v-if="full">{{ t("menu.full") }}</span>
      <!-- pops in like a power-up when something has changed; spins back
           (a rewind) as it goes -->
      <Transition name="reset-pop">
        <button
          v-if="changed" class="build-reset" type="button"
          :aria-label="t('menu.reset')" :title="t('menu.reset')" @click="$emit('reset')"
        >
          <q-icon name="restart_alt" size="22px" />
        </button>
      </Transition>
      <!-- the first letter has had a bite taken out of it -->
      <button class="build-eat" type="button" :disabled="eating" :aria-label="t('menu.eat')" @click="$emit('eat')">
        <span class="eat-first" aria-hidden="true">{{ eatWord[0] }}</span><span aria-hidden="true">{{ eatWord.slice(1).join("") }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { LAYERS, resolveLayers } from "src/utils/burgerLayers";
import { useI18n } from "vue-i18n";
import { useLocale } from "src/i18n";

const { t } = useI18n();
const eatWord = computed(() => [...t("menu.eat")]);
const { pick, other } = useLocale();

const props = defineProps({
  layers: { type: Array, default: () => [] },
  extras: { type: Array, default: () => [] },
  changed: { type: Boolean, default: false },
  full: { type: Boolean, default: false },
  eating: { type: Boolean, default: false },
});

defineEmits(["remove", "add", "grab", "reset", "eat"]);

/** The ingredient's own photograph, small, as the thing to pick up. */
const thumb = (key) => resolveLayers([key])[0]?.photo?.file || "";

const shown = computed(() => resolveLayers(props.layers));
</script>
