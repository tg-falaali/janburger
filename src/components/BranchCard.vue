<template>
  <article class="branch">
    <header class="branch-head">
      <span class="en">{{ pick(branch.name, branch.nameAr) }}</span>
      <span class="pill" :class="{ 'pill--off': !open }">
        <span class="dot" :class="{ 'dot--off': !open }"></span>
        {{ open ? t("branches.openNow") : t("branches.closedNow") }}
      </span>
    </header>

    <!-- press the little shop and this branch opens in Google Maps -->
    <MiniShop :name="pick(branch.name, branch.nameAr)" :href="mapLink" />

    <div class="branch-body">

      <div class="branch-today">
        <q-icon name="schedule" size="18px" class="q-mr-xs" />
        {{ t("branches.today") }}: {{ formatDay(branch.hours?.[now.day], locale) }}
      </div>

      <div v-if="branch.address" class="branch-addr">
        <q-icon name="place" size="18px" class="q-mr-xs" />{{ pick(branch.address, branch.addressAr) }}
      </div>

      <q-expansion-item dense :label="t('branches.week')" header-class="q-px-none text-weight-bold" expand-icon-class="text-primary">
        <table class="week">
          <tbody>
            <tr v-for="(day, i) in DAYS" :key="day.en" :class="{ 'is-today': i === now.day }">
              <td>{{ isAr ? day.ar : day.en }}</td>
              <td>{{ formatDay(branch.hours?.[i], locale) }}</td>
            </tr>
          </tbody>
        </table>
      </q-expansion-item>

      <div class="branch-actions">
        <q-btn
          v-if="phone"
          outline rounded no-caps color="primary" icon="call"
          :label="phone" :href="`tel:${phone}`"
        />
        <q-btn
          v-if="branch.phone2"
          outline rounded no-caps color="primary" icon="call"
          :label="branch.phone2" :href="`tel:${branch.phone2}`"
        />
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from "vue";
import MiniShop from "components/MiniShop.vue";
import { useI18n } from "vue-i18n";
import { useLocale } from "src/i18n";

const { t } = useI18n();
const { locale, isAr, pick, other } = useLocale();
import { DAYS, formatDay, isOpenNow } from "src/utils/hours";

const props = defineProps({
  branch: { type: Object, required: true },
  now: { type: Object, required: true },
  fallbackPhone: { type: String, default: "" },
});

const open = computed(() => isOpenNow(props.branch.hours, props.now));
const phone = computed(() => props.branch.phone || props.fallbackPhone);

// Only a real web address becomes a link: what staff typed is not trusted to be one.
const mapLink = computed(() => {
  const url = String(props.branch.mapUrl || "").trim();
  return /^https?:\/\//i.test(url) ? url : "";
});
</script>
