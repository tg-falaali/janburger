// The ingredients as real 3D objects, built in code - no model files.
// One builder per layer key (the same keys as burgerLayers.js). Each returns
//   { object, h, tuck }
// where the object's origin is its vertical centre, `h` is its height and
// `tuck` is how far it sits into the layer above while the stack is shut
// (a cup is pulled up over the drink it holds). A bun is 1 unit in radius.

import * as THREE from "three";

// ----------------------------------------------------------------- helpers
/** The same "random" numbers every time, so a burger does not reshuffle. */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mat = (color, roughness = 0.6, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...extra });

const glass = (color, opacity) =>
  new THREE.MeshPhysicalMaterial({
    color, roughness: 0.08, metalness: 0, transparent: true, opacity,
    side: THREE.DoubleSide, depthWrite: false,
  });

const lathe = (points, segments = 56) =>
  new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), segments);

/** Pushes every vertex in or out a little, so an edge is not machine-perfect. */
function roughen(geometry, amount, frequency = 7) {
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const r = Math.hypot(x, z);
    if (r < 0.05) continue;
    const angle = Math.atan2(z, x);
    const n =
      Math.sin(angle * frequency + y * 9) * 0.6 +
      Math.sin(angle * (frequency * 2 + 3) + y * 17) * 0.4;
    const k = 1 + (n * amount) / r;
    pos.setX(i, x * k);
    pos.setZ(i, z * k);
    pos.setY(i, y + Math.sin(angle * frequency * 1.7) * amount * 0.35 * Math.min(1, r));
  }
  geometry.computeVertexNormals();
  return geometry;
}

const group = (...children) => {
  const g = new THREE.Group();
  children.forEach((c) => g.add(c));
  return g;
};

const mesh = (geometry, material, y = 0) => {
  const m = new THREE.Mesh(geometry, material);
  m.position.y = y;
  return m;
};

const BUN = 0xd98b33;

// ---------------------------------------------------------- drawn surfaces
// What makes a shape read as food is its surface, so the surfaces are
// painted here, on canvases, once each: browning on a bun, char on a patty,
// veins in a leaf, the seed chambers of a tomato. No image files.

const made = {};
const once = (name, make) => () => (made[name] ||= make());

function drawn(size, draw, { colour = true, repeat } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  draw(canvas.getContext("2d"), size);
  const texture = new THREE.CanvasTexture(canvas);
  if (colour) texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  if (repeat) texture.repeat.set(repeat[0], repeat[1]);
  texture.anisotropy = 4;
  return texture;
}

function speckle(ctx, size, rand, count, colours, min, max, alpha = 1) {
  ctx.globalAlpha = alpha;
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colours[(rand() * colours.length) | 0];
    const r = min + rand() * (max - min);
    ctx.beginPath();
    ctx.ellipse(rand() * size, rand() * size, r, r * (0.6 + rand() * 0.8), rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

const SURFACE = {
  /** fine grain, as a height map: bread crust, anything baked */
  grain: once("grain", () =>
    drawn(256, (ctx, s) => {
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, s, s);
      speckle(ctx, s, seeded(3), 2600, ["#666", "#999", "#555", "#aaa"], 0.8, 2.6, 0.55);
    }, { colour: false, repeat: [3, 1] })
  ),

  /** a bun's crust: dark and glossy on the crown, pale gold at the rim */
  bun: once("bun", () =>
    drawn(256, (ctx, s) => {
      const g = ctx.createLinearGradient(0, 0, 0, s);
      g.addColorStop(0, "#a9591a");
      g.addColorStop(0.35, "#c9792a");
      g.addColorStop(0.75, "#e0a044");
      g.addColorStop(1, "#f0c376");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      speckle(ctx, s, seeded(11), 260, ["#8f4a14", "#b96a22", "#f0c376"], 3, 12, 0.12);
    })
  ),

  /** the cut face of bread: pale, full of little holes */
  crumb: once("crumb", () =>
    drawn(256, (ctx, s) => {
      ctx.fillStyle = "#f3dba6";
      ctx.fillRect(0, 0, s, s);
      speckle(ctx, s, seeded(13), 1100, ["#d8b571", "#e7c98d", "#fdf2d2", "#cfa862"], 1, 4.5, 0.7);
    })
  ),

  /** the toasted face of the bottom bun: browned in a ring, pale at the edge */
  toast: once("toast", () =>
    drawn(256, (ctx, s) => {
      const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, "#e9b866");
      g.addColorStop(0.45, "#cf8f3a");
      g.addColorStop(0.72, "#b9722a");
      g.addColorStop(0.9, "#e8bd72");
      g.addColorStop(1, "#f4dba6");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      speckle(ctx, s, seeded(17), 900, ["#8f5318", "#f1d49a", "#a9651f"], 1, 5, 0.3);
    })
  ),

  /** grilled meat: dark, uneven, flecked with fat and char */
  meat: once("meat", () =>
    drawn(256, (ctx, s) => {
      ctx.fillStyle = "#5b2f17";
      ctx.fillRect(0, 0, s, s);
      const rand = seeded(19);
      speckle(ctx, s, rand, 1800, ["#3a1c0c", "#6f3c1f", "#874c28", "#2a1308"], 1.5, 6, 0.7);
      speckle(ctx, s, rand, 260, ["#a9714a", "#c08a60"], 0.8, 2.4, 0.6);
    }, { repeat: [2, 1] })
  ),
  meatBump: once("meatBump", () =>
    drawn(256, (ctx, s) => {
      ctx.fillStyle = "#777";
      ctx.fillRect(0, 0, s, s);
      speckle(ctx, s, seeded(23), 2200, ["#333", "#bbb", "#555", "#999", "#222"], 1.5, 6, 0.75);
    }, { colour: false, repeat: [2, 1] })
  ),

  /** a breadcrumb crust */
  crust: once("crust", () =>
    drawn(256, (ctx, s) => {
      ctx.fillStyle = "#cf8f2f";
      ctx.fillRect(0, 0, s, s);
      speckle(ctx, s, seeded(29), 2400, ["#a9661a", "#e6b45a", "#f3cf85", "#8a4c12"], 1.5, 5, 0.75);
    }, { repeat: [2, 1] })
  ),

  /** a lettuce leaf from above: pale rib in the middle, veins running out */
  leaf: once("leaf", () =>
    drawn(512, (ctx, s) => {
      const c = s / 2;
      const g = ctx.createRadialGradient(c, c, 0, c, c, c);
      g.addColorStop(0, "#e3f3b0");
      g.addColorStop(0.3, "#a9d95e");
      g.addColorStop(0.7, "#6fb236");
      g.addColorStop(1, "#3f8420");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      const rand = seeded(31);
      ctx.lineCap = "round";
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + rand() * 0.2;
        ctx.strokeStyle = "rgba(232, 247, 186, 0.75)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(c, c);
        ctx.lineTo(c + Math.cos(a) * c, c + Math.sin(a) * c);
        ctx.stroke();
        // side veins
        ctx.lineWidth = 1.2;
        for (let k = 1; k <= 5; k++) {
          const r = (k / 6) * c;
          const side = a + (k % 2 ? 0.5 : -0.5);
          ctx.beginPath();
          ctx.moveTo(c + Math.cos(a) * r, c + Math.sin(a) * r);
          ctx.lineTo(c + Math.cos(a) * r + Math.cos(side) * c * 0.16, c + Math.sin(a) * r + Math.sin(side) * c * 0.16);
          ctx.stroke();
        }
      }
      speckle(ctx, s, rand, 500, ["#3f8420", "#8fcb4a"], 2, 8, 0.12);
    })
  ),

  /** a tomato slice from above: flesh, five seed chambers, a pale core */
  tomato: once("tomato", () =>
    drawn(512, (ctx, s) => {
      const c = s / 2;
      ctx.fillStyle = "#d8341f";
      ctx.fillRect(0, 0, s, s);
      const flesh = ctx.createRadialGradient(c, c, c * 0.2, c, c, c);
      flesh.addColorStop(0, "#f58468");
      flesh.addColorStop(0.75, "#ee5338");
      flesh.addColorStop(1, "#cf2d19");
      ctx.fillStyle = flesh;
      ctx.beginPath();
      ctx.arc(c, c, c, 0, Math.PI * 2);
      ctx.fill();
      const rand = seeded(37);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const x = c + Math.cos(a) * c * 0.52, y = c + Math.sin(a) * c * 0.52;
        ctx.fillStyle = "#c4301b";
        ctx.beginPath();
        ctx.ellipse(x, y, c * 0.3, c * 0.2, a + Math.PI / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255, 130, 90, 0.55)"; // the wet jelly round the seeds
        ctx.beginPath();
        ctx.ellipse(x, y, c * 0.24, c * 0.14, a + Math.PI / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffe0a8";
        for (let k = 0; k < 7; k++) {
          const t = (k / 6 - 0.5) * c * 0.4;
          const off = (rand() - 0.5) * c * 0.1;
          ctx.beginPath();
          ctx.ellipse(
            x + Math.cos(a + Math.PI / 2) * t + Math.cos(a) * off,
            y + Math.sin(a + Math.PI / 2) * t + Math.sin(a) * off,
            c * 0.03, c * 0.016, a, 0, Math.PI * 2
          );
          ctx.fill();
        }
      }
      ctx.fillStyle = "#f9b199";
      ctx.beginPath();
      ctx.arc(c, c, c * 0.13, 0, Math.PI * 2);
      ctx.fill();
    })
  ),

  /** a soft round shadow, to sit the whole thing on something */
  shadow: once("shadow", () =>
    drawn(256, (ctx, s) => {
      const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, "rgba(40, 20, 8, 0.42)");
      g.addColorStop(0.5, "rgba(40, 20, 8, 0.16)");
      g.addColorStop(1, "rgba(40, 20, 8, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    })
  ),
};

/** A material with a clear glaze over it: anything wet, oily or freshly baked. */
const glazed = (options) =>
  new THREE.MeshPhysicalMaterial({ metalness: 0, roughness: 0.4, clearcoat: 0.4, clearcoatRoughness: 0.3, ...options });

const crustMat = () =>
  glazed({ map: SURFACE.bun(), bumpMap: SURFACE.grain(), bumpScale: 1.4, roughness: 0.55, clearcoat: 0.18, clearcoatRoughness: 0.5 });
const crumbMat = () => mat(0xffffff, 0.95, { map: SURFACE.crumb() });

/** The soft shadow drawn under whatever is on show. */
export function makeShadow() {
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 3.4).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: SURFACE.shadow(), transparent: true, depthWrite: false })
  );
  plane.renderOrder = -1;
  return plane;
}

// ---------------------------------------------------------------- builders
const BUILDERS = {
  "bun-top"() {
    const h = 0.64;
    const dome = new THREE.SphereGeometry(1, 56, 28, 0, Math.PI * 2, 0, Math.PI / 2);
    dome.scale(1, h, 1);
    const top = mesh(dome, crustMat(), -h / 2);
    const cut = mesh(new THREE.CircleGeometry(0.99, 56).rotateX(Math.PI / 2), crumbMat(), -h / 2);

    // sesame seeds, lying on the dome
    const rand = seeded(7);
    const seedGeo = new THREE.SphereGeometry(0.04, 10, 8);
    const seedMat = mat(0xf7e9c4, 0.55);
    const seeds = new THREE.Group();
    for (let i = 0; i < 60; i++) {
      const r = Math.sqrt(rand()) * 0.86;
      const angle = rand() * Math.PI * 2;
      const x = r * Math.cos(angle), z = r * Math.sin(angle);
      const y = h * Math.sqrt(Math.max(0, 1 - r * r));
      const seed = new THREE.Mesh(seedGeo, seedMat);
      seed.position.set(x, y - h / 2 + 0.004, z);
      // lie flat against the surface: point "up" along the dome's normal
      const normal = new THREE.Vector3(x, y / (h * h), z).normalize();
      seed.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      seed.rotateY(rand() * Math.PI);
      seed.scale.set(1.7, 0.45, 0.95);
      seeds.add(seed);
    }
    return { object: group(top, cut, seeds), h };
  },

  lettuce() {
    const geo = new THREE.RingGeometry(0.02, 1.16, 96, 8).rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const r = Math.hypot(x, z);
      const a = Math.atan2(z, x);
      const frill = 1 + 0.07 * Math.sin(a * 13) * (r / 1.16);
      pos.setX(i, x * frill);
      pos.setZ(i, z * frill);
      const edge = Math.pow(r / 1.16, 2.2);
      pos.setY(i, edge * (0.09 * Math.sin(a * 9) + 0.05 * Math.sin(a * 17 + 1)) + 0.02 * Math.sin(x * 6) * Math.cos(z * 6));
    }
    geo.computeVertexNormals();
    const leaf = mesh(geo, mat(0xffffff, 0.55, { map: SURFACE.leaf(), side: THREE.DoubleSide }));
    const under = leaf.clone();
    under.material = mat(0xb5cf9a, 0.6, { map: SURFACE.leaf(), side: THREE.DoubleSide });
    under.rotation.y = 0.5;
    under.position.y = -0.04;
    under.scale.setScalar(0.96);
    return { object: group(leaf, under), h: 0.22, tuck: 0.08 };
  },

  onion() {
    const ring = (radius, x, z, y) => {
      const skin = mesh(new THREE.TorusGeometry(radius, 0.05, 14, 64).rotateX(Math.PI / 2), glazed({ color: 0x8b2a73, roughness: 0.3 }));
      const flesh = mesh(new THREE.TorusGeometry(radius - 0.035, 0.045, 14, 64).rotateX(Math.PI / 2), glazed({ color: 0xf4e3ee, roughness: 0.3 }));
      const g = group(skin, flesh);
      g.position.set(x, y, z);
      g.scale.y = 1.25;
      return g;
    };
    return {
      object: group(ring(0.62, -0.26, 0.05, 0.01), ring(0.56, 0.32, -0.1, -0.01), ring(0.36, 0.02, 0.28, 0.02)),
      h: 0.14,
      tuck: 0.04,
    };
  },

  tomato() {
    const h = 0.14;
    const slice = mesh(
      roughen(lathe([[0, -h / 2], [0.86, -h / 2], [0.93, -h / 4], [0.94, 0], [0.93, h / 4], [0.86, h / 2], [0, h / 2]]), 0.008, 5),
      glazed({ color: 0xd8341f, roughness: 0.25 })
    );
    const face = mesh(new THREE.CircleGeometry(0.84, 48).rotateX(-Math.PI / 2), glazed({ map: SURFACE.tomato(), roughness: 0.3, clearcoat: 0.5 }), h / 2 + 0.002);
    return { object: group(slice, face), h };
  },

  pickles() {
    const g = new THREE.Group();
    [[-0.5, 0.1], [0.05, -0.35], [0.5, 0.2], [0, 0.45]].forEach(([x, z], i) => {
      const chip = group(
        mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 28), mat(0x6f9a33, 0.5)),
        mesh(new THREE.CircleGeometry(0.24, 28).rotateX(-Math.PI / 2), mat(0xb9d674, 0.45), 0.027)
      );
      chip.position.set(x, i * 0.012, z);
      g.add(chip);
    });
    return { object: g, h: 0.09 };
  },

  cheese() {
    // a square slice, its corners drooping over the edge of what is under it
    const geo = new THREE.BoxGeometry(1.95, 0.045, 1.95, 22, 1, 22);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const r = Math.hypot(pos.getX(i), pos.getZ(i));
      const over = Math.max(0, r - 0.98);
      pos.setY(i, pos.getY(i) - Math.pow(over, 1.25) * 0.95);
    }
    geo.computeVertexNormals();
    const slice = mesh(geo, glazed({ color: 0xf5a312, roughness: 0.45, clearcoat: 0.15 }), 0.07);
    slice.rotation.y = Math.PI / 4;
    return { object: group(slice), h: 0.22, tuck: 0.14 };
  },

  egg() {
    const white = new THREE.SphereGeometry(0.95, 48, 20);
    white.scale(1, 0.055, 1);
    roughen(white, 0.07, 5);
    const yolk = new THREE.SphereGeometry(0.27, 32, 20);
    yolk.scale(1, 0.5, 1);
    return {
      object: group(mesh(white, glazed({ color: 0xf3f0e4, roughness: 0.5, clearcoat: 0.15 })), mesh(yolk, glazed({ color: 0xf6a414, roughness: 0.12, clearcoat: 1 }), 0.06)),
      h: 0.2,
      tuck: 0.06,
    };
  },

  sauce() {
    const blob = new THREE.SphereGeometry(0.85, 48, 16);
    blob.scale(1, 0.035, 1);
    roughen(blob, 0.09, 6);
    return { object: group(mesh(blob, glazed({ color: 0xb3221a, roughness: 0.12, clearcoat: 1 }))), h: 0.06 };
  },

  patty() {
    const h = 0.3;
    const body = roughen(
      lathe([[0, -h / 2], [0.86, -h / 2], [0.98, -h / 3], [1.02, 0], [0.98, h / 3], [0.86, h / 2], [0, h / 2]], 72),
      0.02, 11
    );
    const meat = mesh(body, mat(0xffffff, 0.88, { map: SURFACE.meat(), bumpMap: SURFACE.meatBump(), bumpScale: 4 }));
    const charMat = mat(0x150a04, 0.95);
    const marks = new THREE.Group();
    [-0.6, -0.3, 0, 0.3, 0.6].forEach((x) => {
      const length = 2 * Math.sqrt(0.82 * 0.82 - x * x);
      const bar = mesh(new THREE.BoxGeometry(0.075, 0.012, length), charMat, h / 2 + 0.004);
      bar.position.x = x;
      marks.add(bar);
    });
    marks.rotation.y = Math.PI / 5;
    return { object: group(meat, marks), h };
  },

  chicken() {
    const h = 0.3;
    const body = roughen(
      lathe([[0, -h / 2], [0.84, -h / 2], [0.99, -h / 3], [1.04, 0], [0.99, h / 3], [0.84, h / 2], [0, h / 2]], 72),
      0.05, 9
    );
    const crust = mesh(body, mat(0xffffff, 0.8, { map: SURFACE.crust(), bumpMap: SURFACE.meatBump(), bumpScale: 3 }));
    const rand = seeded(21);
    const crumbMat = mat(0xe6b45a, 0.8);
    const crumbs = new THREE.Group();
    for (let i = 0; i < 70; i++) {
      const r = Math.sqrt(rand()) * 0.88, a = rand() * Math.PI * 2;
      const c = new THREE.Mesh(new THREE.SphereGeometry(0.035 + rand() * 0.03, 6, 5), crumbMat);
      c.position.set(Math.cos(a) * r, h / 2 - 0.005, Math.sin(a) * r);
      crumbs.add(c);
    }
    return { object: group(crust, crumbs), h };
  },

  sausage() {
    const body = mesh(new THREE.CapsuleGeometry(0.17, 1.7, 10, 24).rotateZ(Math.PI / 2), glazed({ color: 0xb5482d, roughness: 0.3, clearcoat: 0.7 }));
    return { object: group(body), h: 0.34, tuck: 0.06 };
  },

  "bun-bottom"() {
    const h = 0.36;
    const body = mesh(
      lathe([[0, -h / 2], [0.84, -h / 2], [0.97, -h / 2 + 0.07], [1.0, 0], [0.99, h / 2 - 0.04], [0.95, h / 2], [0, h / 2]]),
      glazed({ color: BUN, bumpMap: SURFACE.grain(), bumpScale: 1.4, roughness: 0.55, clearcoat: 0.25 })
    );
    const face = mesh(new THREE.CircleGeometry(0.94, 56).rotateX(-Math.PI / 2), mat(0xffffff, 0.85, { map: SURFACE.toast() }), h / 2 + 0.002);
    return { object: group(body, face), h };
  },

  // ---- the long bun a hot dog comes in -----------------------------------
  "hotdog-bun-top"() {
    const h = 0.42;
    const dome = new THREE.SphereGeometry(1, 56, 28, 0, Math.PI * 2, 0, Math.PI / 2);
    dome.scale(1.22, h, 0.46);
    const cut = new THREE.CircleGeometry(0.99, 56).rotateX(Math.PI / 2);
    cut.scale(1.22, 1, 0.46);
    return { object: group(mesh(dome, crustMat(), -h / 2), mesh(cut, crumbMat(), -h / 2)), h };
  },

  "hotdog-bun-bottom"() {
    const h = 0.3;
    const body = lathe([[0, -h / 2], [0.84, -h / 2], [0.97, -h / 2 + 0.07], [1.0, 0], [0.99, h / 2 - 0.04], [0.95, h / 2], [0, h / 2]]);
    body.scale(1.22, 1, 0.46);
    const face = new THREE.CircleGeometry(0.94, 56).rotateX(-Math.PI / 2);
    face.scale(1.22, 1, 0.46);
    return { object: group(mesh(body, glazed({ color: BUN, bumpMap: SURFACE.grain(), bumpScale: 1.4, roughness: 0.55, clearcoat: 0.25 })), mesh(face, crumbMat(), h / 2 + 0.002)), h };
  },

  // ---- shown whole: nothing to take apart --------------------------------
  "soft-drink"() {
    const cup = BUILDERS.cup().object; // 1.15 tall, centred
    const lid = BUILDERS.lid().object;
    lid.position.y = 0.575 + 0.11;
    const straw = BUILDERS.straw().object;
    straw.position.y = 0.575 + 0.45;
    const whole = group(cup, lid, straw);
    whole.position.y = -0.45; // centre the cup-plus-straw on the origin
    return { object: group(whole), h: 2.05 };
  },

  "water-bottle"() {
    const bottle = BUILDERS.bottle().object; // 1.6 tall, centred
    const cap = BUILDERS.cap().object;
    cap.position.y = 0.8 + 0.065;
    const whole = group(bottle, cap);
    whole.position.y = -0.065;
    return { object: group(whole), h: 1.73 };
  },

  // ---- not burgers ------------------------------------------------------
  "cheese-sauce"() {
    const blob = new THREE.SphereGeometry(0.5, 40, 16);
    blob.scale(1, 0.16, 0.55);
    roughen(blob, 0.06, 5);
    return { object: group(mesh(blob, glazed({ color: 0xffc12b, roughness: 0.15, clearcoat: 1 }))), h: 0.16, tuck: 0.02 };
  },

  fries() {
    const h = 0.95;
    const rand = seeded(5);
    const fryMat = mat(0xf2c04a, 0.6);
    const g = new THREE.Group();
    for (let i = 0; i < 16; i++) {
      const len = 0.65 + rand() * 0.3;
      const fry = new THREE.Mesh(new THREE.BoxGeometry(0.1, len, 0.1), fryMat);
      fry.position.set((rand() - 0.5) * 0.8, -h / 2 + len / 2, (rand() - 0.5) * 0.28);
      fry.rotation.set((rand() - 0.5) * 0.18, rand() * 3, (rand() - 0.5) * 0.3);
      g.add(fry);
    }
    return { object: g, h, tuck: 0.1 };
  },

  "fries-box"() {
    const h = 0.75;
    const shell = new THREE.CylinderGeometry(0.72, 0.5, h, 4, 1, true).rotateY(Math.PI / 4);
    shell.scale(1, 1, 0.48);
    const carton = mesh(shell, mat(0xd42a20, 0.5, { side: THREE.DoubleSide }));
    const base = new THREE.CylinderGeometry(0.5, 0.5, 0.02, 4).rotateY(Math.PI / 4);
    base.scale(1, 1, 0.48);
    const badge = mesh(new THREE.CircleGeometry(0.16, 32), mat(0xffffff, 0.5));
    badge.position.set(0, 0, 0.215);
    badge.rotation.x = -0.14;
    return { object: group(carton, mesh(base, mat(0xb81f17, 0.5), -h / 2 + 0.01), badge), h, tuck: 0.55 };
  },

  straw() {
    const h = 0.9;
    const tube = mesh(new THREE.CylinderGeometry(0.045, 0.045, h, 16), mat(0xe02d25, 0.35));
    tube.position.x = 0.15;
    return { object: group(tube), h, tuck: 0.2 };
  },

  lid() {
    const rim = mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.06, 48), mat(0xf4f5f7, 0.35), -0.08);
    const domeGeo = new THREE.SphereGeometry(0.56, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    domeGeo.scale(1, 0.4, 1);
    return { object: group(rim, mesh(domeGeo, mat(0xffffff, 0.3), -0.06)), h: 0.24, tuck: 0.06 };
  },

  ice() {
    const cube = () => new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), glass(0xdff3ff, 0.7));
    const g = new THREE.Group();
    [[-0.22, 0, 0.05, 0.3], [0.12, 0.02, -0.12, 1.1], [0.2, -0.02, 0.2, 0.6], [-0.05, 0.03, 0.26, 2]].forEach(([x, y, z, r]) => {
      const c = cube();
      c.position.set(x, y, z);
      c.rotation.set(r, r * 1.3, r * 0.7);
      g.add(c);
    });
    return { object: g, h: 0.32 };
  },

  cola() {
    const h = 0.42;
    const body = mesh(new THREE.CylinderGeometry(0.52, 0.47, h, 40), mat(0x3a1a0b, 0.12));
    const top = mesh(new THREE.CircleGeometry(0.52, 40).rotateX(-Math.PI / 2), mat(0x6b3a1c, 0.1), h / 2 + 0.002);
    return { object: group(body, top), h };
  },

  cup() {
    const h = 1.15;
    const wall = mesh(new THREE.CylinderGeometry(0.62, 0.46, h, 56, 1, true), mat(0xf7f7f8, 0.45, { side: THREE.DoubleSide }));
    const base = mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.03, 40), mat(0xe6e7ea, 0.5), -h / 2 + 0.015);
    // the red band, a hair wider than the cup where it sits
    const band = mesh(new THREE.CylinderGeometry(0.588, 0.532, 0.34, 56, 1, true), mat(0xe02d25, 0.4), 0.05);
    return { object: group(wall, base, band), h, tuck: 0.82 };
  },

  cap() {
    return { object: group(mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.13, 32), mat(0x2f86d6, 0.4))), h: 0.13 };
  },

  water() {
    const drop = lathe([[0, 0.3], [0.08, 0.16], [0.2, -0.02], [0.23, -0.14], [0.17, -0.26], [0, -0.3]], 40);
    return { object: group(mesh(drop, glass(0x58b4ee, 0.85))), h: 0.6 };
  },

  bottle() {
    const h = 1.6;
    const shell = lathe([
      [0, -0.8], [0.44, -0.8], [0.48, -0.74], [0.48, 0.2], [0.42, 0.36], [0.22, 0.58], [0.19, 0.64], [0.19, 0.8],
    ]);
    const body = mesh(shell, glass(0xbfe4f7, 0.42));
    const label = mesh(new THREE.CylinderGeometry(0.487, 0.487, 0.34, 48, 1, true), mat(0x2f86d6, 0.45, { side: THREE.DoubleSide }), -0.2);
    return { object: group(body, label), h, tuck: 0.66 };
  },
};

// two sauces that only differ in colour or shape from the one above
BUILDERS["sauce-line"] = BUILDERS.sauce;
BUILDERS.mayo = () => {
  const blob = new THREE.SphereGeometry(0.8, 48, 16);
  blob.scale(1, 0.06, 1);
  roughen(blob, 0.07, 5);
  return { object: group(mesh(blob, glazed({ color: 0xf6efd9, roughness: 0.2, clearcoat: 0.8 }))), h: 0.1 };
};

// fries as served: the fries standing in their carton, one object
BUILDERS["fries-boxed"] = () => {
  const fries = BUILDERS.fries().object;
  fries.position.y = 0.3;
  const carton = BUILDERS["fries-box"]().object;
  carton.position.y = -0.25;
  return { object: group(fries, carton), h: 1.3 };
};
BUILDERS["cheese-fries-boxed"] = () => {
  const made = BUILDERS["fries-boxed"]();
  const sauce = BUILDERS["cheese-sauce"]().object;
  sauce.position.y = 0.62;
  made.object.add(sauce);
  return made;
};

export function canBuild(key) {
  return Boolean(BUILDERS[key]);
}

/** Builds one layer. Returns null for a key there is no 3D object for. */
export function buildIngredient(key) {
  const build = BUILDERS[key];
  if (!build) return null;
  const made = build();
  return { tuck: 0, ...made };
}

/** Frees the GPU memory an object holds. A loaded model's is shared, and kept. */
export function disposeObject(object) {
  if (object.userData.shared) return;
  object.traverse((node) => {
    if (node.geometry) node.geometry.dispose();
    if (node.material) node.material.dispose();
  });
}

// ------------------------------------------------- generated model files
// A real model can stand in for any ingredient: put `<key>.glb` in
// public/models/ and name it in public/models/manifest.json -
//   { "bun-top": "bun-top.glb", "patty": "patty.glb" }
// Whatever is not listed keeps the shape built above, so the set can be
// filled in one piece at a time.

let manifestPromise = null;
function manifest() {
  manifestPromise ||= fetch("models/manifest.json", { cache: "no-cache" })
    .then((res) => (res.ok ? res.json() : {}))
    .catch(() => ({}));
  return manifestPromise;
}

const modelCache = new Map(); // key -> Promise<{ scene, h } | null>

async function loadOnce(key) {
  const file = (await manifest())[key];
  if (!file || typeof file !== "string") return null;

  const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
  const gltf = await new GLTFLoader().loadAsync("models/" + file);
  const scene = gltf.scene;

  // A generated model comes at any size and off-centre. Make it as wide as
  // the shape it replaces, and put its middle on the origin.
  const built = buildIngredient(key);
  const target = new THREE.Box3().setFromObject(built.object).getSize(new THREE.Vector3());
  disposeObject(built.object);

  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  const scale = Math.max(target.x, target.z) / Math.max(size.x, size.z, 0.0001);
  const centre = box.getCenter(new THREE.Vector3());
  scene.position.copy(centre).multiplyScalar(-scale);
  scene.scale.setScalar(scale);

  return { scene, h: size.y * scale };
}

/** The generated model for this ingredient, or null if there is none. */
export async function loadModel(key) {
  if (!modelCache.has(key)) {
    modelCache.set(key, loadOnce(key).catch(() => null)); // a bad file falls back to the built shape
  }
  const model = await modelCache.get(key);
  if (!model) return null;
  const holder = new THREE.Group();
  holder.add(model.scene.clone());
  holder.userData.shared = true;
  return { object: holder, h: model.h };
}

export { THREE };
