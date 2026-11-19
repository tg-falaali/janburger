<template>
  <div class="dash">
    <!-- side menu (a row of tabs along the bottom on a phone) -->
    <aside class="dside">
      <div class="dside-brand">
        <img class="dash-logo" src="logo.png" alt="Jan Burger" />
        <span class="dside-tag">Dashboard</span>
      </div>
      <nav class="dnav" aria-label="Dashboard sections">
        <button
          v-for="s in SECTIONS" :key="s.value" type="button" class="dnav-item"
          :class="{ 'is-on': tab === s.value }" :aria-current="tab === s.value ? 'page' : undefined"
          @click="tab = s.value"
        >
          <q-icon :name="s.icon" size="21px" />
          <span class="dnav-label">{{ s.label }}</span>
          <span v-if="s.count && s.count()" class="dnav-n">{{ s.count() }}</span>
        </button>
      </nav>
      <div class="dside-foot">
        <div class="dside-user">
          <q-avatar size="30px" color="primary" text-color="white">{{ initial }}</q-avatar>
          <span class="ellipsis">{{ auth.user?.name }}</span>
        </div>
        <q-btn flat dense no-caps align="left" icon="storefront" label="View site" to="/jan-brger" class="full-width" />
        <q-btn flat dense no-caps align="left" icon="logout" label="Sign out" class="full-width" @click="leave" />
      </div>
    </aside>

    <main class="dmain">
      <!-- top bar on a phone -->
      <header class="dtop">
        <img class="dash-logo" src="logo.png" alt="Jan Burger" />
        <q-space />
        <q-btn flat round dense icon="storefront" to="/jan-brger" aria-label="View site" />
        <q-btn flat round dense icon="logout" aria-label="Sign out" @click="leave" />
      </header>

      <div v-if="state.demo" class="demo-ribbon">
        Demo mode — changes are saved in this browser only, until Firebase is connected.
      </div>

      <div class="dpage">
        <div class="dpage-head">
          <h1 class="dpage-title">{{ current.label }}</h1>
          <p class="dpage-sub">{{ current.sub }}</p>
        </div>

        <q-banner v-if="state.error" class="dbanner" rounded>
          <template #avatar><q-icon name="cloud_off" color="negative" /></template>
          Could not read from Firebase: {{ state.error }}
        </q-banner>

        <div v-if="!state.loading && !state.branches.length && !state.menu.length" class="dempty q-mb-lg">
          <q-icon name="inventory_2" size="42px" />
          <div class="dempty-title">Nothing here yet</div>
          <div>Start from the branches on the shop sign and a sample menu, then edit them.</div>
          <q-btn unelevated rounded no-caps color="primary" label="Load sample data" :loading="seeding" @click="seed" />
        </div>

        <keep-alive>
          <MenuPanel v-if="tab === 'menu'" />
          <LayersPanel v-else-if="tab === 'layers'" />
          <BranchesPanel v-else-if="tab === 'branches'" />
          <InfoPanel v-else-if="tab === 'info'" />
        </keep-alive>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import MenuPanel from "components/dash/MenuPanel.vue";
import LayersPanel from "components/dash/LayersPanel.vue";
import BranchesPanel from "components/dash/BranchesPanel.vue";
import InfoPanel from "components/dash/InfoPanel.vue";
import { useAuth } from "src/composables/useAuth";
import { useSiteData } from "src/composables/useSiteData";

const $q = useQuasar();
const router = useRouter();
const { state: auth, signOut } = useAuth();
const { state, loadSample } = useSiteData();

const SECTIONS = [
  { value: "menu", icon: "restaurant_menu", label: "Menu", sub: "What is on the menu, the prices, and the pictures.", count: () => state.menu.length },
  { value: "layers", icon: "layers", label: "Layers", sub: "Cut-out pictures of ingredients and items that the menu pictures are built from.", count: () => Object.keys(state.layers || {}).length },
  { value: "branches", icon: "storefront", label: "Branches", sub: "Where the branches are, their phones and opening hours.", count: () => state.branches.length },
  { value: "info", icon: "tune", label: "General info", sub: "The name, phones, links and announcement shown across the site." },
];

// the section is remembered, so a reload comes back to it
const SAVED = "jan-burger-dash-tab";
const saved = (() => {
  try {
    return localStorage.getItem(SAVED);
  } catch {
    return null;
  }
})();
const tab = ref(SECTIONS.some((s) => s.value === saved) ? saved : "menu");
watch(tab, (v) => {
  try {
    localStorage.setItem(SAVED, v);
  } catch {
    /* not remembered */
  }
});
const current = computed(() => SECTIONS.find((s) => s.value === tab.value));
const initial = computed(() => String(auth.user?.name || "?").trim().charAt(0).toUpperCase());

const seeding = ref(false);
async function seed() {
  seeding.value = true;
  try {
    await loadSample();
    $q.notify({ type: "positive", message: "Sample data loaded" });
  } catch (err) {
    $q.notify({ type: "negative", message: err.message || "Could not load sample data" });
  } finally {
    seeding.value = false;
  }
}

async function leave() {
  await signOut();
  router.push("/jan-brger");
}
</script>
