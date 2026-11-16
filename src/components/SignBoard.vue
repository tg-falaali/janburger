<template>
  <!-- The shop sign, drawn in outline: English panel, logo panel, Arabic panel. -->
  <div class="sign" role="banner">
    <div class="sign-panel sign-panel--main">
      <h1 class="sign-font sign-title q-ma-none">{{ info.name }}</h1>
      <div class="sign-font sign-sub">{{ info.tagline }}</div>
      <div v-if="info.company" class="sign-company">{{ info.company }}</div>
      <!-- <div v-if="branchNames" class="sign-branches">
        Branches: {{ branchNames }}
      </div> -->
    </div>

    <div class="sign-panel sign-panel--center">
      <img class="sign-logo" src="logo.png" :alt="info.name + ' — Nobody Does It Better'" width="240" height="146" />
      <div v-if="phones.length" class="sign-phones">
        <template v-for="(phone, i) in phones" :key="phone">
          <q-icon v-if="i > 0" name="call" size="15px" />
          <a :href="'tel:' + phone">{{ phone }}</a>
        </template>
      </div>
    </div>

    <div class="sign-panel sign-panel--ar" lang="ar">
      <div class="sign-font-ar sign-title-ar">{{ info.nameAr }}</div>
      <div class="sign-font-ar sign-sub-ar">{{ info.taglineAr }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  info: { type: Object, required: true },
  branches: { type: Array, default: () => [] },
});

const phones = computed(() => (props.info.phones || []).filter(Boolean));

const branchNames = computed(() =>
  props.branches.map((b) => b.name).filter(Boolean).join(", ")
);
</script>
