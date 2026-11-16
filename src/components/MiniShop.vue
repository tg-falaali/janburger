<template>
  <!-- A little Jan Burger shop, alive: the sign lit, smoke off the charcoal,
       a pin over the roof. With a map link it is a link - press the shop and
       the branch opens in Google Maps. -->
  <component
    :is="href ? 'a' : 'div'"
    class="shop"
    :class="{ 'is-link': href }"
    :href="href || undefined"
    :target="href ? '_blank' : undefined"
    :rel="href ? 'noopener' : undefined"
    :aria-label="href ? t('branches.mapAria', { name }) : undefined"
  >
    <svg class="shop-art" viewBox="0 0 200 150" aria-hidden="true">
      <defs>
        <linearGradient id="jb-shop-light" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffcd3c" stop-opacity="0.75" />
          <stop offset="1" stop-color="#ffcd3c" stop-opacity="0.05" />
        </linearGradient>
      </defs>

      <!-- smoke off the grill -->
      <g class="shop-smoke" fill="#b9b2ad">
        <circle cx="158" cy="38" r="4" />
        <circle cx="158" cy="38" r="4" />
        <circle cx="158" cy="38" r="4" />
      </g>
      <rect x="152" y="36" width="12" height="10" fill="#fff" stroke="#1c1c1c" stroke-width="2" />

      <!-- the pin -->
      <g v-if="href" class="shop-pin">
        <path d="M100 30 C92 20 88 16 88 10 a12 12 0 0 1 24 0 c0 6 -4 10 -12 20 Z" fill="#e31e24" stroke="#1c1c1c" stroke-width="1.5" />
        <circle cx="100" cy="10" r="4.2" fill="#fff" />
      </g>

      <!-- the shop front, lit from inside -->
      <rect x="30" y="72" width="140" height="62" fill="#fff" stroke="#1c1c1c" stroke-width="2" />
      <rect class="shop-glow" x="31" y="80" width="138" height="53" fill="url(#jb-shop-light)" />

      <!-- the sign -->
      <rect x="24" y="44" width="152" height="28" fill="#fff" stroke="#e31e24" stroke-width="2.5" />
      <rect x="28.5" y="48.5" width="143" height="19" fill="none" stroke="#e31e24" stroke-width="1" />
      <text x="100" y="63.5" text-anchor="middle" class="shop-sign">JAN BURGER</text>

      <!-- the tube light -->
      <rect class="shop-tube" x="34" y="75" width="132" height="5" rx="2.5" fill="#fff6c9" stroke="#1c1c1c" stroke-width="1.4" />

      <!-- window -->
      <rect x="38" y="90" width="78" height="36" fill="#fff" fill-opacity="0.35" stroke="#1c1c1c" stroke-width="2" />
      <path d="M64 90 V126 M90 90 V126" stroke="#1c1c1c" stroke-width="1.6" />
      <!-- a table and two red chairs inside -->
      <path d="M46 126 V114 h8 v12 M74 126 V114 h8 v12" fill="none" stroke="#e31e24" stroke-width="2" />
      <path d="M56 118 h16 M64 118 v8" fill="none" stroke="#1c1c1c" stroke-width="1.6" />

      <!-- door -->
      <rect x="128" y="90" width="34" height="44" fill="#fff" stroke="#1c1c1c" stroke-width="2" />
      <rect x="133" y="95" width="24" height="22" fill="none" stroke="#e31e24" stroke-width="1.5" />
      <circle cx="134.5" cy="122" r="1.6" fill="#1c1c1c" />

      <!-- the step -->
      <rect x="22" y="134" width="156" height="7" fill="#fff" stroke="#1c1c1c" stroke-width="2" />
    </svg>

    <span class="shop-caption">
      <template v-if="href">
        <q-icon name="place" size="16px" /> {{ t("branches.map") }}
      </template>
      <template v-else>{{ t("branches.noMap") }}</template>
    </span>
  </component>
</template>

<script setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();

defineProps({
  name: { type: String, default: "" },
  href: { type: String, default: "" },
});
</script>
