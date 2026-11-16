<template>
  <q-form class="dash-panel q-pa-md form-stack" @submit.prevent="save">
    <div class="form-row">
      <q-input v-model.trim="form.name" label="Restaurant name" outlined dense
        :rules="[(v) => !!v || 'Name is required']" lazy-rules hide-bottom-space />
      <q-input v-model.trim="form.nameAr" label="الاسم (عربي)" outlined dense dir="rtl" />
      <q-input v-model.trim="form.tagline" label="Tagline" outlined dense />
      <q-input v-model.trim="form.taglineAr" label="الشعار (عربي)" outlined dense dir="rtl" />
    </div>
    <q-input v-model.trim="form.company" label="Company line on the sign" outlined dense />

    <q-input v-model.trim="form.announcement" label="Announcement strip (optional)" outlined dense
      hint="Shown in yellow under the sign, e.g. Ramadan timings. Leave empty to hide." />

    <q-select
      v-model="form.phones" label="Phone numbers" multiple use-chips use-input hide-dropdown-icon
      new-value-mode="add-unique" outlined dense input-debounce="0"
      hint="Type a number and press Enter. The first is the main one."
    />

    <q-select
      v-model="form.categories" label="Menu categories, in the order they appear" multiple use-chips use-input
      hide-dropdown-icon new-value-mode="add-unique" outlined dense input-debounce="0"
      hint="Type a category and press Enter"
    />

    <q-input v-model.trim="form.about" label="About" type="textarea" autogrow outlined dense />
    <q-input v-model.trim="form.aboutAr" label="نبذة (عربي)" type="textarea" autogrow outlined dense dir="rtl" />

    <div class="form-row">
      <q-input v-model.trim="form.whatsapp" label="WhatsApp number (with 973)" outlined dense />
      <q-input v-model.trim="form.instagram" label="Instagram username" outlined dense />
    </div>

    <div class="form-row">
      <q-input v-model.trim="form.menuUrl" label="Full menu link (PDF)" type="url" outlined dense />
      <q-input v-model.trim="form.helpdeskUrl" label="Help desk & feedback link" type="url" outlined dense />
      <q-input v-model.trim="form.cateringEmail" label="Catering email" type="email" outlined dense />
    </div>

    <div class="row">
      <q-space />
      <q-btn flat no-caps label="Undo changes" class="q-mr-sm" @click="reset" />
      <q-btn type="submit" outline rounded no-caps color="primary" icon="save" label="Save info" :loading="busy" />
    </div>
  </q-form>
</template>

<script setup>
import { ref, watch } from "vue";
import { useQuasar } from "quasar";
import { useSiteData } from "src/composables/useSiteData";

const $q = useQuasar();
const { state, saveInfo } = useSiteData();

const form = ref({});
const busy = ref(false);

function reset() {
  form.value = {
    phones: [],
    categories: [],
    ...JSON.parse(JSON.stringify(state.info)),
  };
}
reset();

// The first snapshot may land after this panel is built.
watch(() => state.loading, (loading) => !loading && reset());

async function save() {
  busy.value = true;
  try {
    await saveInfo(form.value);
    $q.notify({ type: "positive", message: "Info saved" });
  } catch (err) {
    $q.notify({ type: "negative", message: err?.message || "Could not save. Try again." });
  } finally {
    busy.value = false;
  }
}
</script>
