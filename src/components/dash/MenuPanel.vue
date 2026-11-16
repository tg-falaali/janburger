<template>
  <div>
    <div class="row items-center q-gutter-sm q-mb-md">
      <q-select
        v-model="filter" :options="['All', ...categories]" dense outlined
        bg-color="white" style="min-width: 170px" label="Category"
      />
      <q-space />
      <q-btn outline rounded no-caps color="primary" icon="add" label="Add item" @click="open()" />
    </div>

    <div class="dash-panel">
      <div v-if="!rows.length" class="q-pa-md text-grey-8">No menu items yet.</div>
      <div v-for="item in rows" :key="item.id" class="dash-row row items-center q-pa-sm q-pl-md no-wrap">
        <div class="col" style="min-width: 0">
          <div class="text-weight-bold ellipsis">{{ item.name }}</div>
          <div class="text-caption text-grey-8 ellipsis">
            {{ item.category }} · <span lang="ar">{{ item.nameAr }}</span>
          </div>
        </div>
        <div class="text-weight-bold q-mx-sm" style="white-space: nowrap">{{ formatPrice(item.price) }}</div>
        <q-toggle
          :model-value="item.available !== false" color="positive" dense class="q-mx-sm"
          :aria-label="`${item.name} available`"
          @update:model-value="(v) => quickSave({ ...item, available: v })"
        >
          <q-tooltip>Available today</q-tooltip>
        </q-toggle>
        <q-btn flat round dense icon="edit" :aria-label="`Edit ${item.name}`" @click="open(item)" />
        <q-btn flat round dense icon="delete" color="negative" :aria-label="`Delete ${item.name}`" @click="remove(item)" />
      </div>
    </div>

    <q-dialog v-model="dialog" persistent>
      <q-card class="dlg-card" style="width: 520px; max-width: 96vw">
        <q-card-section class="dlg-head">
          {{ form.id ? "Edit item" : "New item" }}
        </q-card-section>
        <q-form @submit.prevent="save">
          <q-card-section class="form-stack">
            <q-input v-model.trim="form.name" label="Name (English)" outlined dense
              :rules="[(v) => !!v || 'Name is required']" lazy-rules hide-bottom-space />
            <q-input v-model.trim="form.nameAr" label="الاسم (عربي)" outlined dense dir="rtl" />
            <div class="form-row">
              <q-select
                v-model="form.category" :options="categories" label="Category"
                outlined dense use-input new-value-mode="add-unique" hide-dropdown-icon
                hint="Pick one or type a new one and press Enter" input-debounce="0"
                :rules="[(v) => !!v || 'Category is required']" lazy-rules
                @new-value="(val, done) => done(val.trim())"
              />
              <q-input
                v-model.number="form.price" type="number" step="0.001" min="0" label="Price" prefix="BD"
                outlined dense
                :rules="[(v) => (v !== '' && v !== null && v >= 0) || 'Enter a price']" lazy-rules
              />
            </div>
            <q-input v-model.trim="form.description" label="Short description (optional)" outlined dense />
            <q-input v-model.trim="form.descriptionAr" label="الوصف (عربي، اختياري)" outlined dense dir="rtl" />

            <!-- what the item is built from; the site animates these apart -->
            <div>
              <div class="row items-center q-mb-xs">
                <div class="text-weight-bold">Layers</div>
                <q-space />
                <q-btn flat dense no-caps color="primary" label="Classic burger" @click="form.layers = [...CLASSIC_BURGER]" />
                <q-btn flat dense no-caps label="Clear" @click="form.layers = []" />
              </div>
              <div class="row items-start q-gutter-md no-wrap">
                <div class="col">
                  <q-select
                    :model-value="null" :options="LAYER_OPTIONS" label="Add a layer" outlined dense
                    emit-value map-options
                    hint="Top to bottom. Burgers, fries, drinks - pick the parts in order."
                    @update:model-value="(key) => key && form.layers.push(key)"
                  />
                  <div class="q-mt-sm">
                    <q-chip
                      v-for="(key, i) in form.layers" :key="i + key" removable outline color="secondary" dense
                      @remove="form.layers.splice(i, 1)"
                    >
                      {{ i + 1 }}. {{ LAYERS[key]?.label || key }}
                    </q-chip>
                  </div>
                </div>
                <BurgerStack v-if="form.layers.length" mini :layers="form.layers" class="q-mt-xs" />
              </div>
            </div>

            <div class="form-row items-center">
              <q-input v-model.number="form.order" type="number" label="Position" outlined dense
                hint="Lower shows first" />
              <q-toggle v-model="form.available" label="Available" color="positive" />
            </div>
          </q-card-section>
          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat no-caps label="Cancel" v-close-popup />
            <q-btn type="submit" outline rounded no-caps color="primary" label="Save" :loading="busy" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useQuasar } from "quasar";
import { useSiteData, formatPrice } from "src/composables/useSiteData";
import BurgerStack from "components/BurgerStack.vue";
import { LAYERS, LAYER_OPTIONS, CLASSIC_BURGER } from "src/utils/burgerLayers";

const $q = useQuasar();
const { state, categories, saveMenuItem, removeMenuItem, nextOrder } = useSiteData();

const filter = ref("All");
const rows = computed(() =>
  filter.value === "All" ? state.menu : state.menu.filter((m) => m.category === filter.value)
);

const dialog = ref(false);
const busy = ref(false);
const form = ref({});

function open(item) {
  form.value = item
    ? { description: "", nameAr: "", ...item, available: item.available !== false, layers: [...(item.layers || [])] }
    : {
        name: "", nameAr: "", description: "", price: null, available: true, layers: [],
        category: filter.value !== "All" ? filter.value : categories.value[0] || "",
        order: nextOrder(state.menu),
      };
  dialog.value = true;
}

const fail = (err) =>
  $q.notify({ type: "negative", message: err?.message || "Could not save. Try again." });

async function save() {
  busy.value = true;
  try {
    await saveMenuItem({ ...form.value, price: Number(form.value.price) || 0, order: Number(form.value.order) || 0 });
    dialog.value = false;
    $q.notify({ type: "positive", message: "Menu item saved" });
  } catch (err) {
    fail(err);
  } finally {
    busy.value = false;
  }
}

const quickSave = (item) => saveMenuItem(item).catch(fail);

function remove(item) {
  $q.dialog({
    title: "Delete item",
    message: `Remove "${item.name}" from the menu? This cannot be undone.`,
    cancel: true,
    ok: { label: "Delete", color: "negative", unelevated: true },
  }).onOk(() => removeMenuItem(item.id).catch(fail));
}
</script>
