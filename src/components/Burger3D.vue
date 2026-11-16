<template>
  <!-- The picked item as real 3D objects, centred. Shut, the layers sit
       together; open, they lift apart. Drag to turn it. -->
  <BurgerStack v-if="failed" :layers="layers" :open="open" class="b3d-fallback" />
  <div v-else ref="box" class="b3d" :style="{ height: height + 'px' }">
    <canvas
      ref="canvas" class="b3d-canvas" role="img" :aria-label="'3D view: ' + names.join(', ')"
      @pointerdown="dragStart" @pointermove="dragMove" @pointerup="dragEnd" @pointercancel="dragEnd"
    ></canvas>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import BurgerStack from "components/BurgerStack.vue";
import { resolveLayers } from "src/utils/burgerLayers";
import { THREE, buildIngredient, disposeObject, loadModel, makeShadow } from "src/utils/ingredients3d";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const props = defineProps({
  layers: { type: Array, default: () => [] },
  open: { type: Boolean, default: false },
});

const GAP = 0.26; // air between layers when open
const FOV = 26;
const MAX_HEIGHT = 430;

const box = ref(null);
const canvas = ref(null);
const failed = ref(false);
const height = ref(320);

const names = computed(() => resolveLayers(props.layers).map((l) => l.label));

let renderer, scene, camera, pivot, frame, resizeObserver, pmrem, shadow;
let parts = []; // { key, object, closedY, openY, y, from }
let toggledAt = 0;
let spin = 0.5;
let dragging = false;
let lastX = 0;
let lastOpenHeight = 2;
const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Rebuilds the stack from the layer list. A layer that was already there
 * keeps where it is and glides to its new place; a new one drops in from
 * above - which is what makes adding and removing feel like building.
 */
function build() {
  const old = parts;
  const reuse = new Map();
  old.forEach((p) => {
    if (!reuse.has(p.key)) reuse.set(p.key, []);
    reuse.get(p.key).push(p);
  });

  const made = [];
  resolveLayers(props.layers).forEach((def) => {
    const kept = reuse.get(def.key)?.shift();
    if (kept) {
      made.push(kept);
      return;
    }
    const built = buildIngredient(def.key);
    if (!built) return;
    const part = { key: def.key, object: built.object, h: built.h, tuck: built.tuck, fresh: true };
    made.push(part);
    swapInModel(part);
  });

  // whatever was not reused is gone
  reuse.forEach((left) =>
    left.forEach((p) => {
      pivot.remove(p.object);
      disposeObject(p.object);
    })
  );

  layout(made, old.length === 0);
}

/**
 * If a generated model file exists for this ingredient it replaces the built
 * shape as soon as it has loaded; the stack is then laid out again, since
 * the model has a height of its own.
 */
function swapInModel(part) {
  loadModel(part.key).then((model) => {
    if (!model || !parts.includes(part) || !pivot) return;
    pivot.remove(part.object);
    disposeObject(part.object);
    part.object = model.object;
    part.h = model.h;
    part.object.position.y = part.y;
    pivot.add(part.object);
    layout(parts, false);
  });
}

function layout(made, first) {
  // lay the stack out twice, top down: shut and open
  let closedTop = 0;
  let openTop = 0;
  made.forEach((p, i) => {
    if (i > 0) {
      closedTop += p.tuck;
      openTop -= GAP;
    }
    p.closedY = closedTop - p.h / 2;
    p.openY = openTop - p.h / 2;
    closedTop -= p.h;
    openTop -= p.h;
  });

  // centre both layouts on the origin
  const closedMid = closedTop / 2;
  const openMid = openTop / 2;
  made.forEach((p) => {
    p.closedY -= closedMid;
    p.openY -= openMid;
    if (p.fresh) {
      const rest = props.open ? p.openY : p.closedY;
      p.y = first ? rest : rest + 1.6; // a later arrival falls into place
      p.object.position.y = p.y;
      pivot.add(p.object);
      p.fresh = false;
    }
  });

  parts = made;
  startMove();
  fit(-openTop);
}

/** Sizes the canvas and pulls the camera back until the open stack fits. */
function fit(openHeight = lastOpenHeight) {
  lastOpenHeight = openHeight;
  if (!box.value || !renderer) return;
  const width = Math.max(160, box.value.clientWidth);
  const tall = Math.round(Math.min(MAX_HEIGHT, Math.max(250, openHeight * 92 + 60)));
  height.value = tall;

  renderer.setSize(width, tall, false);
  canvas.value.style.width = width + "px";
  canvas.value.style.height = tall + "px";

  const aspect = width / tall;
  const half = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const distance = Math.max((openHeight / 2 + 0.35) / half, 1.45 / (half * aspect));
  const lift = THREE.MathUtils.degToRad(16); // looking slightly down, like the photo
  camera.aspect = aspect;
  camera.position.set(0, Math.sin(lift) * distance, Math.cos(lift) * distance);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}

// The move is worked out from the clock, not counted in frames, so it takes
// the same half second on a fast screen and on a throttled one.
const MOVE_MS = 550;
const STAGGER_MS = 45;
const easeOutBack = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

function startMove() {
  toggledAt = performance.now();
  parts.forEach((p) => (p.from = p.y));
}

let lastTick = 0;
function tick(now) {
  frame = requestAnimationFrame(tick);
  const dt = Math.min(100, now - (lastTick || now));
  lastTick = now;

  parts.forEach((p, i) => {
    const target = props.open ? p.openY : p.closedY;
    const t = still ? 1 : Math.min(1, Math.max(0, (now - toggledAt - i * STAGGER_MS) / MOVE_MS));
    p.y = t >= 1 ? target : p.from + (target - p.from) * easeOutBack(t);
    p.object.position.y = p.y;
  });
  if (!dragging && !still) spin += dt * 0.00028;
  pivot.rotation.y = spin;
  // the shadow stays just under whatever is lowest
  const lowest = parts[parts.length - 1];
  if (shadow && lowest) shadow.position.y = lowest.y - lowest.h / 2 - 0.05;
  renderer.render(scene, camera);
}

function dragStart(e) {
  dragging = true;
  lastX = e.clientX;
  canvas.value.setPointerCapture?.(e.pointerId);
}
function dragMove(e) {
  if (!dragging) return;
  spin += (e.clientX - lastX) * 0.012;
  lastX = e.clientX;
}
function dragEnd() {
  dragging = false;
}

onMounted(() => {
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas.value, antialias: true, alpha: true });
  } catch {
    failed.value = true; // no WebGL here: the drawn stack takes over
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  pivot = new THREE.Group();
  scene.add(pivot);

  // A lit room to reflect: it is what puts the shine on a glazed bun, a
  // yolk, a wet slice of tomato. Then three lamps, as a food photo is lit.
  pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.28;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcdb89a, 0.7));
  shadow = makeShadow();
  scene.add(shadow);
  const key = new THREE.DirectionalLight(0xfff1dc, 2.0);
  key.position.set(3, 5, 4);
  const fill = new THREE.DirectionalLight(0xffffff, 0.6);
  fill.position.set(-4, 1.5, 2);
  const rim = new THREE.DirectionalLight(0xffe2b0, 0.8);
  rim.position.set(0, 2, -5);
  scene.add(key, fill, rim);

  build();
  frame = requestAnimationFrame(tick);

  // Refit on a change of WIDTH only, and on the next frame: fit() sets the
  // box's height, and answering that inside the observer is a resize loop.
  let seenWidth = box.value.clientWidth;
  resizeObserver = new ResizeObserver(() => {
    const width = box.value?.clientWidth;
    if (!width || width === seenWidth) return;
    seenWidth = width;
    requestAnimationFrame(() => fit());
  });
  resizeObserver.observe(box.value);
});

watch(
  () => props.layers,
  () => renderer && build(),
  { deep: true }
);

watch(
  () => props.open,
  () => startMove()
);

onBeforeUnmount(() => {
  cancelAnimationFrame(frame);
  resizeObserver?.disconnect();
  parts.forEach((p) => disposeObject(p.object));
  if (renderer) {
    scene.environment?.dispose();
    pmrem?.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }
});
</script>
