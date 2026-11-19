<template>
  <div>
    <div class="scroll-bar" aria-hidden="true" :style="{ '--p': progress }"></div>
    <button class="to-top" :class="{ 'is-shown': deep }" type="button" :aria-label="t('footer.top')" @click="toTop">
      <q-icon name="arrow_upward" size="24px" />
    </button>

    <div v-if="state.demo" class="demo-ribbon">
      {{ t("demo") }}
    </div>

    <header class="hero">
      <div class="wrap">
        <SignBoard :info="info" :branches="branches" />
        <div class="tube" aria-hidden="true"></div>

        <!-- the shop's glass front, holding the page's links -->
        <div class="shopfront">
          <nav class="hero-nav" aria-label="Sections">
            <a class="btn-line btn-line--red" href="#menu" @click.prevent="go('menu')">{{ t("nav.menu") }}</a>
            <a class="btn-line" href="#branches" @click.prevent="go('branches')">{{ t("nav.branches") }}</a>
            <a class="btn-line" href="#contact" @click.prevent="go('contact')">{{ t("nav.contact") }}</a>
            <a v-if="phones[0]" class="btn-line" :href="`tel:${phones[0]}`">
              <q-icon name="call" size="16px" class="q-mr-xs" />{{ t("nav.call", { phone: phones[0] }) }}
            </a>
            <!-- the other language: the label is always in the language it switches TO -->
            <button class="btn-line lang-btn" type="button" :aria-label="t('lang.switchTo')" @click="toggle">
              <q-icon name="translate" size="16px" class="q-mr-xs" />{{ t("lang.other") }}
            </button>
          </nav>
          <div v-if="branches.length" class="open-count" aria-live="polite">
            <span class="dot" :class="{ 'dot--off': !openCount }"></span>
            {{ openLine }}
          </div>
        </div>
      </div>
    </header>

    <!-- the announcement, on a strip of paper tape that slides as you scroll -->
    <TapeStrip :text="pick(info.announcement, info.announcementAr)" :rtl="isAr" />

    <q-banner v-if="state.error" class="text-negative" role="alert">
      {{ t("error") }}
    </q-banner>

    <!-- menu -->
    <section id="menu" class="section">
      <div class="wrap">
        <div v-reveal:left class="section-head">
          <h2>{{ t("menu.title") }}</h2>
          <a v-if="link(info.menuUrl)" class="head-link" :href="link(info.menuUrl)" target="_blank" rel="noopener">
            {{ t("menu.pdf") }} <q-icon name="north_east" size="15px" />
          </a>
        </div>
        <q-spinner v-if="state.loading" color="primary" size="36px" />
        <MenuBoard v-else :items="state.menu" :categories="categories" />
      </div>
    </section>

    <!-- branches -->
    <section id="branches" class="section">
      <div class="wrap">
        <div v-reveal:left class="section-head">
          <h2>{{ t("branches.title") }}</h2>
        </div>
        <q-spinner v-if="state.loading" color="primary" size="36px" />
        <div v-else-if="!branches.length" class="empty-note">
          {{ t("branches.empty") }}
        </div>
        <div v-else class="branch-grid">
          <BranchCard
            v-for="(branch, i) in branches"
            :key="branch.id"
            v-reveal="i"
            :branch="branch"
            :now="now"
            :fallback-phone="phones[0] || ''"
          />
        </div>
      </div>
    </section>

    <!-- contact -->
    <footer id="contact" class="foot">
      <div class="wrap">
        <div class="foot-grid">
          <div v-reveal="0">
            <!-- on the charcoal: the patty is flipped now and then, the smoke rises -->
            <svg class="foot-grill" viewBox="0 0 120 92" aria-hidden="true">
              <path class="g-smoke" d="M44 30 q-6 -7 0 -13 q6 -6 0 -13" />
              <path class="g-smoke" d="M60 28 q-6 -7 0 -13 q6 -6 0 -13" />
              <path class="g-smoke" d="M76 30 q-6 -7 0 -13 q6 -6 0 -13" />
              <g class="g-flip">
                <rect class="g-patty" x="38" y="36" width="44" height="12" rx="6" />
                <line class="g-mark" x1="48" y1="39" x2="52" y2="45" />
                <line class="g-mark" x1="58" y1="39" x2="62" y2="45" />
                <line class="g-mark" x1="68" y1="39" x2="72" y2="45" />
              </g>
              <path class="g-line g-bowl" d="M18 52 H102 Q98 78 60 80 Q22 78 18 52 Z" />
              <circle class="g-ember" cx="46" cy="64" r="3.2" />
              <circle class="g-ember" cx="60" cy="68" r="3.2" />
              <circle class="g-ember" cx="74" cy="64" r="3.2" />
              <path class="g-line" d="M14 52 H106" />
              <path class="g-line" d="M40 78 L32 90 M80 78 L88 90" />
            </svg>
            <h3>{{ pick(info.name, info.nameAr) }} — {{ pick(info.tagline, info.taglineAr) }}</h3>
            <p class="q-mb-none">{{ pick(info.about, info.aboutAr) }}</p>
          </div>

          <div v-if="phones.length" v-reveal="1">
            <h3>{{ t("footer.call") }}</h3>
            <a v-for="phone in phones" :key="phone" class="foot-phone" :href="`tel:${phone}`">
              {{ phone }}
            </a>
          </div>

          <div v-if="link(info.helpdeskUrl) || info.cateringEmail" v-reveal="2">
            <h3>{{ t("footer.listening") }}</h3>
            <div class="column q-gutter-sm items-start">
              <q-btn
                v-if="link(info.helpdeskUrl)" dir="ltr" outline rounded no-caps color="secondary" icon="support_agent"
                :label="t('footer.helpdesk')" :href="link(info.helpdeskUrl)" target="_blank" rel="noopener"
              />
              <q-btn
                v-if="info.cateringEmail" dir="ltr" outline rounded no-caps color="secondary" icon="celebration"
                :label="t('footer.catering')" :href="`mailto:${info.cateringEmail}`"
              />
            </div>
          </div>

          <!-- the map is per branch now: each branch card carries its own -->
          <div v-if="info.whatsapp || info.instagram" v-reveal="2">
            <h3>{{ t("footer.follow") }}</h3>
            <div class="column q-gutter-sm items-start">
              <q-btn
                v-if="info.whatsapp" dir="ltr" outline rounded no-caps color="secondary" icon="fa-brands fa-whatsapp"
                label="WhatsApp" :href="`https://wa.me/${whatsappDigits}`" target="_blank" rel="noopener"
              />
              <q-btn
                v-if="info.instagram" dir="ltr" outline rounded no-caps color="secondary" icon="fa-brands fa-instagram"
                :label="`@${instagramHandle}`" :href="`https://instagram.com/${instagramHandle}`"
                target="_blank" rel="noopener"
              />
            </div>
          </div>
        </div>

        <div class="foot-bottom">
          <span>© {{ year }} {{ info.company || info.name }}</span>
          <router-link to="/login-jan">{{ t("footer.staff") }}</router-link>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import SignBoard from "components/SignBoard.vue";
import MenuBoard from "components/MenuBoard.vue";
import BranchCard from "components/BranchCard.vue";
import TapeStrip from "components/TapeStrip.vue";
import { useSiteData } from "src/composables/useSiteData";
import { bahrainNow, isOpenNow } from "src/utils/hours";
import vReveal from "src/directives/reveal";
import { useI18n } from "vue-i18n";
import { useLocale } from "src/i18n";

const { state, categories } = useSiteData();
const { t } = useI18n();
const { isAr, pick, toggle } = useLocale();
// a heading says itself in the language in use, and smaller in the other one
const otherLocale = computed(() => (isAr.value ? "en" : "ar"));

const info = computed(() => state.info);
const phones = computed(() => (state.info.phones || []).filter(Boolean));
const branches = computed(() => state.branches.filter((b) => b.active !== false));

// The clock the "open now" badges read, ticked once a minute.
const now = ref(bahrainNow());
let timer = null;
onMounted(() => {
  timer = setInterval(() => (now.value = bahrainNow()), 60 * 1000);
});
onBeforeUnmount(() => clearInterval(timer));

// How far down the page the visitor is, 0 to 1, for the line along the top.
// Measured at most once a frame, however fast the scroll events come.
const progress = ref(0);
const deep = ref(false); // far enough down for the way-back-up button to be worth showing
const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
let measuring = false;
function measure() {
  measuring = false;
  const room = document.documentElement.scrollHeight - window.innerHeight;
  progress.value = room > 0 ? Math.min(1, Math.max(0, window.scrollY / room)) : 0;
  deep.value = window.scrollY > window.innerHeight * 0.9;
}
function onScroll() {
  if (measuring) return;
  measuring = true;
  requestAnimationFrame(measure);
}
onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  measure();
});
onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", onScroll);
});

const openCount = computed(
  () => branches.value.filter((b) => isOpenNow(b.hours, now.value)).length
);
const openLine = computed(() => {
  const total = branches.value.length;
  if (!openCount.value) return t("open.none");
  if (openCount.value === total) {
    return total === 1 ? t("open.one") : t("open.all", { n: total });
  }
  return t("open.some", { open: openCount.value, n: total });
});

const whatsappDigits = computed(() => String(state.info.whatsapp || "").replace(/\D/g, ""));
const instagramHandle = computed(() =>
  String(state.info.instagram || "").replace(/^.*instagram\.com\//, "").replace(/[@/]/g, "")
);
const year = new Date().getFullYear();

// Only a real web address becomes a link: what staff typed is not trusted to be one.
const link = (url) => (/^https?:\/\//i.test(String(url || "").trim()) ? String(url).trim() : "");

// Hash routing owns the URL's #, so sections are scrolled to by hand.
function go(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}
</script>
