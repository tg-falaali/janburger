<template>
  <!-- The build-your-own controls: what is in it (minus to take out) and what
       can go in (plus to add). -->
  <div class="build">
    <ul class="build-list" :aria-label="t('menu.inIt')">
      <!-- Only what can be taken out is listed. The bun (or the carton) is
           always there, so naming it would be a row with nothing to press. -->
      <template v-for="(layer, i) in shown" :key="i + layer.key">
        <li v-if="!layer.fixed" class="build-row">
          <button
            class="build-btn" type="button"
            :aria-label="t('menu.remove', { name: pick(layer.label, layer.labelAr) })" @click="$emit('remove', i)"
          >
            <q-icon name="remove" size="16px" />
          </button>
          <span class="build-name">{{ pick(layer.label, layer.labelAr) }}</span>
          <span class="build-ar" dir="auto">{{ other(layer.label, layer.labelAr) }}</span>
        </li>
      </template>
    </ul>

    <div v-if="extras.length" class="build-add">
      <button
        v-for="key in extras" :key="key" class="build-chip" type="button" :disabled="full"
        :aria-label="t('menu.add', { name: pick(LAYERS[key].label, LAYERS[key].labelAr) })" @click="$emit('add', key)"
      >
        <q-icon name="add" size="15px" />{{ pick(LAYERS[key].label, LAYERS[key].labelAr) }}
      </button>
    </div>

    <div class="build-foot">
      <span v-if="full">{{ t("menu.full") }}</span>
      <button v-if="changed" class="build-reset" type="button" @click="$emit('reset')">
        <q-icon name="restart_alt" size="16px" /> {{ t("menu.reset") }}
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
const { pick, other } = useLocale();

const props = defineProps({
  layers: { type: Array, default: () => [] },
  extras: { type: Array, default: () => [] },
  changed: { type: Boolean, default: false },
  full: { type: Boolean, default: false },
});

defineEmits(["remove", "add", "reset"]);

const shown = computed(() => resolveLayers(props.layers));
</script>
