<template>
  <div class="dash">
    <header class="dash-bar">
      <div class="wrap row items-center q-py-sm no-wrap">
        <img class="dash-logo" src="logo.png" alt="Jan Burger" />
        <div class="q-ml-sm gt-xs text-weight-bold">· Dashboard</div>
        <q-space />
        <span class="gt-sm q-mr-md ellipsis">{{ auth.user?.name }}</span>
        <q-btn flat dense no-caps icon="storefront" label="View site" to="/jan-brger" class="q-mr-xs" />
        <q-btn flat dense no-caps icon="logout" label="Sign out" @click="leave" />
      </div>
    </header>

    <div v-if="state.demo" class="demo-ribbon">
      Demo mode — changes are saved in this browser only, until Firebase is connected.
    </div>

    <div class="wrap q-py-lg">
      <q-banner v-if="state.error" class="text-negative q-mb-md" role="alert">
        Could not read from Firebase: {{ state.error }}
      </q-banner>

      <div
        v-if="!state.loading && !state.branches.length && !state.menu.length"
        class="dash-panel q-pa-md q-mb-lg row items-center q-gutter-md"
      >
        <div class="col">
          <div class="text-weight-bold">Nothing here yet.</div>
          Start from the six branches on the shop sign and a sample menu, then edit them.
        </div>
        <q-btn outline rounded no-caps color="primary" label="Load sample data" :loading="seeding" @click="seed" />
      </div>

      <q-tabs
        v-model="tab" align="left" no-caps inline-label
        active-color="primary" indicator-color="primary" class="text-secondary text-weight-bold"
      >
        <q-tab name="menu" icon="restaurant_menu" :label="`Menu (${state.menu.length})`" />
        <q-tab name="branches" icon="store" :label="`Branches & hours (${state.branches.length})`" />
        <q-tab name="info" icon="info" label="General info" />
      </q-tabs>

      <q-tab-panels v-model="tab" class="bg-transparent q-mt-md" keep-alive>
        <q-tab-panel name="menu" class="q-pa-none"><MenuPanel /></q-tab-panel>
        <q-tab-panel name="branches" class="q-pa-none"><BranchesPanel /></q-tab-panel>
        <q-tab-panel name="info" class="q-pa-none"><InfoPanel /></q-tab-panel>
      </q-tab-panels>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import MenuPanel from "components/dash/MenuPanel.vue";
import BranchesPanel from "components/dash/BranchesPanel.vue";
import InfoPanel from "components/dash/InfoPanel.vue";
import { useAuth } from "src/composables/useAuth";
import { useSiteData } from "src/composables/useSiteData";

const $q = useQuasar();
const router = useRouter();
const { state: auth, signOut } = useAuth();
const { state, loadSample } = useSiteData();

const tab = ref("menu");
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
