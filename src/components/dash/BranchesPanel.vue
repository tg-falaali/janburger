<template>
  <div>
    <div class="dtool">
      <q-space />
      <q-btn unelevated rounded no-caps color="primary" icon="add" label="Add branch" @click="open()" />
    </div>

    <div class="dash-panel">
      <div v-if="!state.branches.length" class="q-pa-md text-grey-8">No branches yet.</div>
      <div v-for="branch in state.branches" :key="branch.id" class="dash-row row items-center q-pa-sm q-pl-md no-wrap">
        <div class="col" style="min-width: 0">
          <div class="text-weight-bold ellipsis">
            {{ branch.name }} <span class="text-grey-8" lang="ar">· {{ branch.nameAr }}</span>
          </div>
          <div class="text-caption text-grey-8 ellipsis">
            Today: {{ formatDay(branch.hours?.[today]) }}
            <template v-if="branch.phone"> · {{ branch.phone }}</template>
          </div>
        </div>
        <q-toggle
          :model-value="branch.active !== false" color="positive" dense class="q-mx-sm"
          :aria-label="`${branch.name} shown on site`"
          @update:model-value="(v) => quickSave({ ...branch, active: v })"
        >
          <q-tooltip>Shown on the site</q-tooltip>
        </q-toggle>
        <q-btn flat round dense icon="edit" :aria-label="`Edit ${branch.name}`" @click="open(branch)" />
        <q-btn flat round dense icon="delete" color="negative" :aria-label="`Delete ${branch.name}`" @click="remove(branch)" />
      </div>
    </div>

    <q-dialog v-model="dialog" persistent position="right" full-height :maximized="$q.screen.lt.md">
      <q-card class="ded ded--side">
        <q-card-section class="dlg-head">
          {{ form.id ? "Edit branch" : "New branch" }}
        </q-card-section>
        <q-form @submit.prevent="save">
          <q-card-section class="form-stack ded-scroll">
            <div class="form-row">
              <q-input v-model.trim="form.name" label="Branch name (English)" outlined dense
                :rules="[(v) => !!v || 'Name is required']" lazy-rules hide-bottom-space />
              <q-input v-model.trim="form.nameAr" label="اسم الفرع (عربي)" outlined dense dir="rtl" />
            </div>
            <q-input v-model.trim="form.address" label="Address" outlined dense />
            <q-input v-model.trim="form.addressAr" label="العنوان (عربي)" outlined dense dir="rtl" />
            <div class="form-row">
              <q-input v-model.trim="form.phone2" label="Second phone (optional)" type="tel" outlined dense />
              <q-input v-model.trim="form.phone" label="Phone" type="tel" outlined dense />
              <q-input v-model.trim="form.mapUrl" label="Google Maps link for this branch" type="url" outlined dense
                hint="Opens when a customer presses the little shop on the site" />
            </div>

            <div>
              <div class="row items-center q-mb-xs">
                <div class="text-weight-bold">Working hours</div>
                <q-space />
                <q-btn flat dense no-caps color="primary" icon="content_copy" label="Copy Sunday to all days" @click="copyFirst" />
              </div>
              <div v-for="(day, i) in DAYS" :key="day.en" class="row items-center q-col-gutter-sm q-mb-xs">
                <div class="col-12 col-sm-3 text-weight-medium">{{ day.en }}</div>
                <q-input v-model="form.hours[i].open" type="time" outlined dense
                  :disable="form.hours[i].closed" :aria-label="`${day.en} opens`" />
                <q-input v-model="form.hours[i].close" type="time" outlined dense
                  :disable="form.hours[i].closed" :aria-label="`${day.en} closes`" />
                <q-checkbox v-model="form.hours[i].closed" label="Closed" class="col-auto" />
              </div>
              <div class="text-caption text-grey-8">
                A closing time earlier than the opening time means after midnight (11:00 → 01:00).
              </div>
            </div>

            <div class="form-row items-center">
              <q-input v-model.number="form.order" type="number" label="Position" outlined dense
                hint="Lower shows first" />
              <q-toggle v-model="form.active" label="Show on the site" color="positive" />
            </div>
          </q-card-section>
          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat no-caps label="Cancel" v-close-popup />
            <q-btn type="submit" unelevated rounded no-caps color="primary" icon="check" label="Save" :loading="busy" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useQuasar } from "quasar";
import { useSiteData } from "src/composables/useSiteData";
import { DAYS, bahrainNow, defaultWeek, formatDay } from "src/utils/hours";

const $q = useQuasar();
const { state, saveBranch, removeBranch, nextOrder } = useSiteData();

const today = bahrainNow().day;

const dialog = ref(false);
const busy = ref(false);
const form = ref({ hours: defaultWeek() });

function open(branch) {
  const base = {
    name: "", nameAr: "", address: "", phone: "", phone2: "", mapUrl: "",
    active: true, order: nextOrder(state.branches),
  };
  const copy = branch ? JSON.parse(JSON.stringify(branch)) : {};
  const hours =
    Array.isArray(copy.hours) && copy.hours.length === 7 ? copy.hours : defaultWeek();
  form.value = { ...base, ...copy, active: copy.active !== false, hours };
  dialog.value = true;
}

function copyFirst() {
  const first = form.value.hours[0];
  form.value.hours = form.value.hours.map(() => ({ ...first }));
}

const fail = (err) =>
  $q.notify({ type: "negative", message: err?.message || "Could not save. Try again." });

async function save() {
  busy.value = true;
  try {
    await saveBranch({ ...form.value, order: Number(form.value.order) || 0 });
    dialog.value = false;
    $q.notify({ type: "positive", message: "Branch saved" });
  } catch (err) {
    fail(err);
  } finally {
    busy.value = false;
  }
}

const quickSave = (branch) => saveBranch(branch).catch(fail);

function remove(branch) {
  $q.dialog({
    title: "Delete branch",
    message: `Remove the ${branch.name} branch? This cannot be undone. To hide it for a while, switch it off instead.`,
    cancel: true,
    ok: { label: "Delete", color: "negative", unelevated: true },
  }).onOk(() => removeBranch(branch.id).catch(fail));
}
</script>
