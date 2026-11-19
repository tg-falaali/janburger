<template>
  <!--
    The announcement, on a strip of torn paper tape laid across the page at a
    slant. Its words slide sideways as the page scrolls - to the left going down,
    or to the right in Arabic - so the sentence passes by as you read on.

    The text comes from General info in the dashboard: one sentence per line
    (or between " - "), and a word between *stars* is printed in red.
  -->
  <div v-if="phrases.length" ref="root" class="tape" :class="{ 'tape--rtl': rtl, 'tape--still': still }">
    <p class="tape-sr">{{ plain }}</p>
    <div class="tape-band" aria-hidden="true">
      <div class="tape-paper" :style="tearStyle">
        <div class="tape-track" :dir="rtl ? 'rtl' : 'ltr'" :style="{ transform: `translate3d(${x}px, 0, 0)` }">
          <span
            v-for="n in copies" :key="n" :ref="(el) => { if (n === 1) copyEl = el; }"
            class="tape-copy"
          >
            <template v-for="(phrase, i) in phrases" :key="i">
              <span class="tape-phrase"><template v-for="(part, j) in phrase" :key="j"><em v-if="part.hot">{{ part.text }}</em><template v-else>{{ part.text }}</template></template></span>
              <span class="tape-dot">●</span>
            </template>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps({
  text: { type: String, default: "" },
  rtl: { type: Boolean, default: false },
  /** Held still, as in the dashboard's preview. */
  still: { type: Boolean, default: false },
});

// ---- the words ----------------------------------------------------------------
/** "Charcoal Burger - *NEW* branch" -> [[{text}], [{text: "NEW", hot}, {text: " branch"}]] */
const phrases = computed(() =>
  String(props.text || "")
    .split(/\r?\n|\s+[-–—•|]\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) =>
      line
        .split(/(\*[^*]+\*)/)
        .filter(Boolean)
        .map((bit) => (/^\*[^*]+\*$/.test(bit) ? { text: bit.slice(1, -1), hot: true } : { text: bit, hot: false }))
    )
);
const plain = computed(() => phrases.value.map((p) => p.map((b) => b.text).join("")).join(". "));

// ---- the torn edges: a ragged line, the same at both ends so it repeats --------
function tear(seed, flip) {
  let s = seed;
  const rand = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const pts = [];
  for (let x = 0; x < 400; x += 5 + rand() * 9) pts.push(`${x.toFixed(1)},${(1 + rand() * 8).toFixed(1)}`);
  pts.push("400,5");
  pts[0] = "0,5";
  const edge = pts.join(" L");
  const path = flip ? `M0,0 L${edge} L400,0 Z` : `M0,10 L${edge} L400,10 Z`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='10' viewBox='0 0 400 10' preserveAspectRatio='none'><path d='${path}' fill='black'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
const TEAR_TOP = tear(17, false);
const TEAR_BOTTOM = tear(53, true);
const tearStyle = {
  "--tear-top": TEAR_TOP,
  "--tear-bottom": TEAR_BOTTOM,
};

// ---- sliding with the scroll --------------------------------------------------
const SPEED = 0.5; // how far the words travel for each pixel scrolled
const root = ref(null);
let copyEl = null;
const copies = ref(6);
const x = ref(0);
let frame = 0;
let reduce = false;

function place() {
  frame = 0;
  const el = root.value;
  if (!el || !copyEl) return;
  const w = copyEl.offsetWidth || 1;
  const band = el.offsetWidth + 128;
  const shift = (window.innerHeight / 2 + el.offsetHeight) * SPEED; // the farthest it travels either way
  const lead = Math.ceil(shift / w); // copies held off the start, so it never runs out there
  const need = lead * 2 + Math.ceil(band / w) + 1;
  if (need !== copies.value) copies.value = need;

  const r = el.getBoundingClientRect();
  const off = props.still || reduce ? 0 : (r.top + r.height / 2 - window.innerHeight / 2) * SPEED;
  // held still, it starts at the beginning of the first sentence
  x.value = props.still ? 0 : props.rtl ? lead * w - off : off - lead * w;
}
function onScroll() {
  if (!frame) frame = requestAnimationFrame(place);
}

onMounted(() => {
  reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || false;
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  // the display font may arrive after the first measure, changing the width
  document.fonts?.ready?.then(onScroll);
  nextTick(place);
});
onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", onScroll);
  if (frame) cancelAnimationFrame(frame);
});
watch(() => [props.text, props.rtl, props.still], () => nextTick(place));
watch(copies, () => nextTick(place));
</script>
