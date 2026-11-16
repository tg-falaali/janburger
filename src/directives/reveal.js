// v-reveal: an element comes into being as it is scrolled into view - it
// starts hidden, and moves into place when it enters the window.
//
//   <div v-reveal>            rises on its own
//   <div v-reveal="i">        the i-th of a row: each a beat after the last
//   <h2 v-reveal:left>        comes in from the side instead   (left | right | zoom)
//
// It works in both directions. Scrolling DOWN, a thing enters at the bottom
// of the window and rises into place. Scroll back UP and the things you left
// behind come in at the top, dropping into place instead. Once something is
// wholly out of the window it is reset, so it arrives again next time.
//
// With reduced motion asked for, or in a browser with no
// IntersectionObserver, everything is simply there.

const STAGGER_MS = 70;
const PER_ROW = 6; // after this many the delay starts again, so a long list is not a long wait
const ENTER_AT = 0.08; // this much of it showing counts as arrived

let observer = null;

function watcher() {
  if (observer || typeof IntersectionObserver === "undefined") return observer;
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        if (entry.intersectionRatio >= ENTER_AT || (entry.isIntersecting && entry.intersectionRatio > 0 && isTall(entry))) {
          if (el.classList.contains("is-in")) return;
          // which edge did it come in by? its top is in the upper half of the
          // window when it arrives from above, in the lower half from below
          const height = entry.rootBounds?.height || window.innerHeight;
          el.dataset.from = entry.boundingClientRect.top < height * 0.35 ? "above" : "below";
          el.classList.add("is-in");
        } else if (!entry.isIntersecting) {
          // gone completely: ready to arrive again (leaving is not animated,
          // nobody is looking at it)
          el.classList.remove("is-in");
        }
      });
    },
    // told at "any of it", and again at "enough of it": arriving needs enough,
    // resetting needs none - so an element on the edge does not flicker
    { threshold: [0, ENTER_AT] }
  );
  return observer;
}

/** Something taller than the window can never show 8% of itself in a narrow one. */
function isTall(entry) {
  const height = entry.rootBounds?.height || window.innerHeight;
  return entry.boundingClientRect.height > height * 2;
}

export default {
  mounted(el, binding) {
    el.classList.add("reveal");
    if (binding.arg) el.dataset.reveal = binding.arg;
    if (typeof binding.value === "number") {
      el.style.setProperty("--reveal-delay", `${(binding.value % PER_ROW) * STAGGER_MS}ms`);
    }

    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const io = still ? null : watcher();
    if (io) io.observe(el);
    else el.classList.add("is-in");
  },
  unmounted(el) {
    observer?.unobserve(el);
  },
};
