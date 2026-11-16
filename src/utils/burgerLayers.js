// The layers a menu item can be built from. An item holds a list of these
// keys, top to bottom:  layers: ["bun-top", "lettuce", "patty", "bun-bottom"]
//
// Each layer is drawn in a 120-wide box of its own height `h`, shaded to look
// like the real thing: gradients for roundness, a highlight, a little texture.
// `closed` is how far the layer sits into the one above while the stack is
// shut, in the drawing's own units (default -4). A carton or a cup is drawn
// last and pulled up over what it holds, so shut it looks like the thing itself.

import PHOTOS from "src/data/photoLayers.json";

const vertical = (id, top, bottom) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`;
const across = (id, left, mid, right) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${left}"/><stop offset="0.45" stop-color="${mid}"/><stop offset="1" stop-color="${right}"/></linearGradient>`;
const radial = (id, cx, cy, r, inner, mid, outer) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"><stop offset="0" stop-color="${inner}"/><stop offset="0.55" stop-color="${mid}"/><stop offset="1" stop-color="${outer}"/></radialGradient>`;

const seed = (x, y, turn) =>
  `<ellipse cx="${x}" cy="${y}" rx="3" ry="1.5" transform="rotate(${turn} ${x} ${y})"/>`;
const dot = (x, y, r, fill, opacity = 1) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${opacity}"/>`;

export const LAYERS = {
  "bun-top": {
    label: "Sesame bun",
    fixed: true,
    labelAr: "خبز بالسمسم",
    h: 48,
    svg: `<defs>${radial("jb-bun", "0.4", "0.2", "0.85", "#f9cf7e", "#e29a3b", "#a9591a")}</defs>
      <path d="M5 40 Q1 7 60 5 Q119 7 115 40 Q112 46 60 46 Q8 46 5 40 Z" fill="url(#jb-bun)"/>
      <path d="M5 40 Q60 49 115 40 Q112 46 60 46 Q8 46 5 40 Z" fill="#f6dfae"/>
      <ellipse cx="40" cy="15" rx="26" ry="7" fill="#fff" opacity="0.2"/>
      <g fill="#fdf1cf" stroke="#cfa55e" stroke-width="0.4">
        ${seed(30, 22, -20)}${seed(44, 13, 10)}${seed(58, 20, -8)}${seed(70, 11, 25)}${seed(84, 19, -15)}
        ${seed(96, 28, 20)}${seed(20, 32, 15)}${seed(40, 30, -25)}${seed(62, 31, 12)}${seed(80, 31, -5)}
        ${seed(54, 9, 30)}${seed(102, 36, -20)}
      </g>`,
  },
  lettuce: {
    label: "Lettuce",
    labelAr: "خس",
    h: 26,
    closed: -9,
    svg: `<defs>${vertical("jb-lettuce", "#c4e86f", "#4f9426")}</defs>
      <path d="M2 11 Q7 2 14 8 Q19 0 27 7 Q34 -1 42 8 Q49 1 57 7 Q65 -1 72 8 Q80 0 87 7 Q95 -1 102 8 Q110 1 118 12 Q115 22 105 17 Q99 25 90 18 Q82 26 73 18 Q65 25 56 18 Q47 26 39 18 Q30 25 22 18 Q11 24 2 11 Z" fill="url(#jb-lettuce)"/>
      <path d="M8 11 Q14 6 20 11 Q27 5 34 11 Q42 5 49 11 Q57 5 64 11 Q72 5 79 11 Q87 5 94 11 Q102 6 112 12" fill="none" stroke="#e4f7a8" stroke-width="1.1" opacity="0.75"/>
      <path d="M12 17 Q21 13 30 17 Q39 13 48 17 Q57 13 66 17 Q75 13 84 17 Q93 13 106 17" fill="none" stroke="#3c7a1c" stroke-width="0.9" opacity="0.55"/>`,
  },
  onion: {
    label: "Red onion",
    labelAr: "بصل أحمر",
    h: 20,
    closed: -7,
    svg: `<g fill="none">
        <ellipse cx="48" cy="10" rx="32" ry="6" stroke="#7d1f63" stroke-width="5"/>
        <ellipse cx="48" cy="10" rx="32" ry="6" stroke="#f6e9f1" stroke-width="2.6"/>
        <ellipse cx="74" cy="11" rx="30" ry="5.5" stroke="#932a76" stroke-width="5"/>
        <ellipse cx="74" cy="11" rx="30" ry="5.5" stroke="#fbf2f7" stroke-width="2.6"/>
        <ellipse cx="62" cy="10" rx="17" ry="3" stroke="#a8498c" stroke-width="2.4"/>
      </g>`,
  },
  tomato: {
    label: "Tomato",
    labelAr: "طماطم",
    h: 20,
    closed: -7,
    svg: `<defs>${vertical("jb-tomato-side", "#de3a26", "#a51c12")}${radial("jb-tomato-top", "0.45", "0.4", "0.7", "#ff8a66", "#f0492f", "#d8321f")}</defs>
      <path d="M12 8 V12 Q12 18 60 18 Q108 18 108 12 V8 Z" fill="url(#jb-tomato-side)"/>
      <ellipse cx="60" cy="8" rx="48" ry="6" fill="url(#jb-tomato-top)"/>
      <g fill="#ffd9a6" opacity="0.85">
        <ellipse cx="38" cy="8" rx="2" ry="1"/><ellipse cx="50" cy="6" rx="2" ry="1"/><ellipse cx="62" cy="10" rx="2" ry="1"/>
        <ellipse cx="74" cy="6" rx="2" ry="1"/><ellipse cx="84" cy="9" rx="2" ry="1"/>
      </g>
      <ellipse cx="44" cy="5" rx="16" ry="1.6" fill="#fff" opacity="0.3"/>`,
  },
  pickles: {
    label: "Pickles",
    labelAr: "مخلل",
    h: 14,
    svg: `<defs>${vertical("jb-pickle", "#b3d465", "#587f27")}</defs>
      <g>
        <ellipse cx="32" cy="7" rx="14" ry="4.5" fill="url(#jb-pickle)"/><ellipse cx="32" cy="6.4" rx="10" ry="2.6" fill="#cfe58b" opacity="0.8"/>
        <ellipse cx="60" cy="7" rx="14" ry="4.5" fill="url(#jb-pickle)"/><ellipse cx="60" cy="6.4" rx="10" ry="2.6" fill="#cfe58b" opacity="0.8"/>
        <ellipse cx="88" cy="7" rx="14" ry="4.5" fill="url(#jb-pickle)"/><ellipse cx="88" cy="6.4" rx="10" ry="2.6" fill="#cfe58b" opacity="0.8"/>
      </g>`,
  },
  cheese: {
    label: "Cheese",
    labelAr: "جبن",
    h: 24,
    closed: -9,
    svg: `<defs>${vertical("jb-cheese", "#ffe066", "#f2a51e")}</defs>
      <path d="M4 5 Q60 1 116 5 L105 12 Q101 14 96 12 H78 L68 20 Q64 23 60 20 L54 12 H22 Q18 13 15 11 Z" fill="url(#jb-cheese)"/>
      <path d="M10 5.5 Q60 2.5 110 5.5" fill="none" stroke="#fff5b8" stroke-width="1.4" opacity="0.9"/>`,
  },
  egg: {
    label: "Egg",
    labelAr: "بيض",
    h: 18,
    closed: -6,
    svg: `<defs>${vertical("jb-egg", "#ffffff", "#e9e6dc")}${radial("jb-yolk", "0.4", "0.35", "0.7", "#ffe27a", "#fbb42c", "#e88a12")}</defs>
      <path d="M10 10 Q10 3 38 4 Q60 1 82 4 Q110 3 110 10 Q110 16 82 15 Q60 18 38 15 Q10 16 10 10 Z" fill="url(#jb-egg)"/>
      <ellipse cx="62" cy="8.5" rx="14" ry="4.6" fill="url(#jb-yolk)"/>
      <ellipse cx="57" cy="7" rx="5" ry="1.3" fill="#fff" opacity="0.55"/>`,
  },
  sauce: {
    label: "Ketchup",
    labelAr: "كاتشب",
    h: 12,
    svg: `<path d="M10 6 Q18 0 26 6 T42 6 T58 6 T74 6 T90 6 T110 6" fill="none" stroke="#b81f17" stroke-width="5" stroke-linecap="round"/>
      <path d="M12 5 Q18 1 26 5 T42 5 T58 5 T74 5 T90 5 T108 5" fill="none" stroke="#ff8a75" stroke-width="1.2" stroke-linecap="round" opacity="0.8"/>`,
  },
  "sauce-line": {
    label: "Ketchup drizzle",
    labelAr: "خط كاتشب",
    h: 12,
    svg: `<path d="M10 6 Q18 0 26 6 T42 6 T58 6 T74 6 T90 6 T110 6" fill="none" stroke="#b81f17" stroke-width="5" stroke-linecap="round"/>`,
  },
  mayo: {
    label: "Mayonnaise",
    labelAr: "مايونيز",
    h: 16,
    svg: `<path d="M12 9 Q12 3 38 4 Q60 1 82 4 Q108 3 108 9 Q108 14 82 13 Q60 16 38 13 Q12 14 12 9 Z" fill="#f6efd9"/>
      <ellipse cx="54" cy="7" rx="14" ry="1.6" fill="#fff" opacity="0.7"/>`,
  },
  patty: {
    label: "Charcoal beef patty",
    labelAr: "لحم على الفحم",
    h: 28,
    closed: -7,
    svg: `<defs>${vertical("jb-patty", "#8a4d2c", "#35190c")}</defs>
      <path d="M6 14 Q4 5 18 4 Q40 1 60 3 Q82 1 102 4 Q116 5 114 14 Q116 23 102 24 Q80 27 60 25 Q40 27 18 24 Q4 23 6 14 Z" fill="url(#jb-patty)"/>
      <path d="M14 7 Q40 3 60 5 Q82 3 106 7" fill="none" stroke="#b98058" stroke-width="1.6" opacity="0.6"/>
      <g stroke="#1b0c05" stroke-width="2.6" stroke-linecap="round" opacity="0.75" fill="none">
        <path d="M24 8 L36 19"/><path d="M42 7 L54 20"/><path d="M60 7 L72 20"/><path d="M78 7 L90 20"/><path d="M95 8 L104 18"/>
      </g>
      ${dot(18, 15, 1.2, "#b07249", 0.7)}${dot(33, 22, 1, "#1b0c05", 0.5)}${dot(50, 12, 1.1, "#b07249", 0.6)}
      ${dot(68, 22, 1, "#1b0c05", 0.5)}${dot(86, 12, 1.1, "#b07249", 0.6)}${dot(104, 21, 1, "#b07249", 0.6)}`,
  },
  chicken: {
    label: "Crispy chicken",
    labelAr: "دجاج مقرمش",
    h: 28,
    closed: -7,
    svg: `<defs>${vertical("jb-chicken", "#f5c463", "#a9621a")}</defs>
      <path d="M8 14 Q5 5 18 5 Q24 0 33 4 Q41 0 50 4 Q58 0 67 4 Q76 0 85 4 Q95 0 102 5 Q116 6 112 14 Q116 22 103 23 Q95 28 86 24 Q77 28 68 24 Q59 28 50 24 Q41 28 32 24 Q24 28 17 23 Q4 22 8 14 Z" fill="url(#jb-chicken)"/>
      <path d="M16 9 Q24 5 32 9 Q41 5 50 9 Q59 5 68 9 Q77 5 86 9 Q95 5 104 9" fill="none" stroke="#ffe6a6" stroke-width="1.3" opacity="0.7"/>
      ${dot(24, 16, 1.2, "#8a4c12", 0.6)}${dot(40, 19, 1, "#ffe6a6", 0.8)}${dot(56, 15, 1.2, "#8a4c12", 0.6)}
      ${dot(72, 19, 1, "#ffe6a6", 0.8)}${dot(88, 15, 1.2, "#8a4c12", 0.6)}${dot(100, 18, 1, "#ffe6a6", 0.8)}`,
  },
  sausage: {
    label: "Sausage",
    labelAr: "نقانق",
    h: 20,
    closed: -6,
    svg: `<defs>${vertical("jb-sausage", "#e27a56", "#8a2c18")}</defs>
      <rect x="2" y="3" width="116" height="14" rx="7" fill="url(#jb-sausage)"/>
      <path d="M12 7 H104" stroke="#ffc4ac" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>
      <g stroke="#5e1b0e" stroke-width="1.6" stroke-linecap="round" opacity="0.6"><path d="M34 6 L40 14"/><path d="M58 6 L64 14"/><path d="M82 6 L88 14"/></g>`,
  },
  "bun-bottom": {
    label: "Toasted bun",
    fixed: true,
    labelAr: "خبز محمص",
    h: 32,
    closed: -9,
    svg: `<defs>${vertical("jb-bun-side", "#e6a246", "#a9591a")}${radial("jb-bun-face", "0.5", "0.5", "0.6", "#f3c877", "#eab45c", "#d08a30")}</defs>
      <path d="M6 11 Q6 28 26 29 H94 Q114 28 114 11 Z" fill="url(#jb-bun-side)"/>
      <ellipse cx="60" cy="11" rx="54" ry="8" fill="url(#jb-bun-face)"/>
      <ellipse cx="60" cy="11" rx="46" ry="5.6" fill="none" stroke="#b9722a" stroke-width="1.2" opacity="0.55"/>
      <ellipse cx="60" cy="11" rx="54" ry="8" fill="none" stroke="#f8e3b4" stroke-width="1"/>`,
  },

  // ---- the long bun a hot dog comes in
  "hotdog-bun-top": {
    label: "Hot dog bun",
    labelAr: "خبز هوت دوغ",
    fixed: true,
    h: 30,
    svg: `<defs>${radial("jb-hd-bun", "0.4", "0.2", "0.9", "#f9cf7e", "#e29a3b", "#a9591a")}</defs>
      <path d="M3 24 Q1 6 26 5 H94 Q119 6 117 24 Q114 28 60 28 Q6 28 3 24 Z" fill="url(#jb-hd-bun)"/>
      <path d="M3 24 Q60 30 117 24 Q114 28 60 28 Q6 28 3 24 Z" fill="#f6dfae"/>
      <path d="M22 11 H82" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.2"/>`,
  },
  "hotdog-bun-bottom": {
    label: "Hot dog bun",
    labelAr: "خبز هوت دوغ",
    fixed: true,
    h: 26,
    closed: -7,
    svg: `<defs>${vertical("jb-hd-side", "#e6a246", "#a9591a")}</defs>
      <path d="M3 8 Q3 22 22 23 H98 Q117 22 117 8 Z" fill="url(#jb-hd-side)"/>
      <rect x="3" y="3" width="114" height="9" rx="4.5" fill="#f1c878"/>`,
  },

  // ---- shown whole: nothing to take apart
  "soft-drink": {
    label: "Soft drink",
    labelAr: "مشروب غازي",
    fixed: true,
    h: 88,
    svg: `<defs>${across("jb-sd-cup", "#ffffff", "#f3f4f6", "#c9ced5")}${across("jb-sd-band", "#f25a48", "#e02d25", "#a81717")}</defs>
      <rect x="64" y="2" width="7" height="26" rx="2" fill="#e02d25"/>
      <path d="M32 32 Q32 22 60 22 Q88 22 88 32 Z" fill="url(#jb-sd-cup)" stroke="#b3bac2" stroke-width="0.6"/>
      <rect x="26" y="31" width="68" height="6" rx="3" fill="url(#jb-sd-cup)" stroke="#b3bac2" stroke-width="0.6"/>
      <path d="M30 37 H90 L83 85 H37 Z" fill="url(#jb-sd-cup)" stroke="#b3bac2" stroke-width="0.6"/>
      <path d="M32.3 52 H87.7 L85.6 67 H34.4 Z" fill="url(#jb-sd-band)"/>`,
  },
  "water-bottle": {
    label: "Water",
    labelAr: "ماء",
    fixed: true,
    h: 78,
    svg: `<defs>${across("jb-wb", "#f6fcff", "#dff2fc", "#a9d6f0")}${across("jb-wb-label", "#6fb4ee", "#2f86d6", "#1c5fa3")}</defs>
      <rect x="49" y="2" width="22" height="9" rx="2" fill="url(#jb-wb-label)"/>
      <path d="M52 12 H68 V19 Q84 25 84 37 V68 Q84 74 78 74 H42 Q36 74 36 68 V37 Q36 25 52 19 Z" fill="url(#jb-wb)" stroke="#8fc3e3" stroke-width="0.7"/>
      <rect x="36" y="41" width="48" height="14" fill="url(#jb-wb-label)"/>
      <path d="M42 31 V68" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.7"/>`,
  },

  "fries-boxed": {
    label: "French fries",
    labelAr: "بطاطس",
    fixed: true,
    h: 80,
    svg: `<g fill="#f8c84a">
        <rect x="34" y="6" width="9" height="40" rx="2"/><rect x="45" y="2" width="9" height="44" rx="2"/>
        <rect x="56" y="5" width="9" height="41" rx="2"/><rect x="67" y="1" width="9" height="45" rx="2"/>
        <rect x="78" y="7" width="9" height="39" rx="2"/>
      </g>
      <path d="M24 34 Q60 46 96 34 L89 76 Q60 79 31 76 Z" fill="#e02d25"/>`,
  },
  "cheese-fries-boxed": {
    label: "Cheese fries",
    labelAr: "بطاطس بالجبن",
    fixed: true,
    h: 80,
    svg: `<g fill="#f8c84a">
        <rect x="34" y="6" width="9" height="40" rx="2"/><rect x="45" y="2" width="9" height="44" rx="2"/>
        <rect x="56" y="5" width="9" height="41" rx="2"/><rect x="67" y="1" width="9" height="45" rx="2"/>
        <rect x="78" y="7" width="9" height="39" rx="2"/>
      </g>
      <path d="M30 12 Q30 4 60 5 Q90 4 90 12 Q90 19 60 18 Q30 19 30 12 Z" fill="#ffc531"/>
      <path d="M24 34 Q60 46 96 34 L89 76 Q60 79 31 76 Z" fill="#e02d25"/>`,
  },

  // ---- not burgers
  "cheese-sauce": {
    label: "Cheese sauce",
    labelAr: "صلصة الجبن",
    h: 20,
    svg: `<defs>${vertical("jb-cheese-sauce", "#ffe36e", "#f0a61e")}</defs>
      <path d="M24 8 Q24 3 40 4 Q60 1 80 4 Q96 3 96 8 Q96 12 90 12 Q90 18 86 18 Q82 18 82 12 H64 Q64 17 60 17 Q56 17 56 12 H40 Q40 16 36 16 Q32 16 32 12 Q24 12 24 8 Z" fill="url(#jb-cheese-sauce)"/>
      <path d="M32 6 Q60 3 88 6" fill="none" stroke="#fff6bf" stroke-width="1.3" opacity="0.9"/>`,
  },
  fries: {
    label: "Fries",
    labelAr: "بطاطس",
    h: 36,
    closed: -12,
    svg: `<defs>${across("jb-fry", "#ffe488", "#f8c84a", "#d9952a")}</defs>
      <g fill="url(#jb-fry)">
        <rect x="29" y="10" width="9" height="26" rx="2"/><rect x="39" y="4" width="9" height="32" rx="2"/>
        <rect x="49" y="8" width="9" height="28" rx="2"/><rect x="59" y="3" width="9" height="33" rx="2"/>
        <rect x="69" y="9" width="9" height="27" rx="2"/><rect x="79" y="5" width="9" height="31" rx="2"/>
      </g>`,
  },
  "fries-box": {
    label: "Carton",
    fixed: true,
    labelAr: "علبة",
    h: 44,
    closed: -20,
    svg: `<defs>${across("jb-carton", "#f25a48", "#e02d25", "#a81717")}</defs>
      <path d="M22 4 Q60 14 98 4 L90 40 Q60 43 30 40 Z" fill="url(#jb-carton)"/>
      <circle cx="60" cy="26" r="7" fill="#fff"/>
      <path d="M27 8 L33 38" stroke="#ff9d8f" stroke-width="1.4" opacity="0.6"/>`,
  },
  straw: {
    label: "Straw",
    labelAr: "مصاصة",
    h: 28,
    svg: `<defs>${across("jb-straw", "#ff8a7a", "#e8392c", "#a81c14")}</defs>
      <rect x="64" y="3" width="7" height="25" rx="2" fill="url(#jb-straw)"/>`,
  },
  lid: {
    label: "Lid",
    labelAr: "غطاء",
    h: 22,
    closed: -6,
    svg: `<defs>${across("jb-lid", "#ffffff", "#f1f3f5", "#c3c9d0")}</defs>
      <path d="M32 14 Q32 4 60 4 Q88 4 88 14 Z" fill="url(#jb-lid)" stroke="#b3bac2" stroke-width="0.6"/>
      <rect x="26" y="13" width="68" height="6" rx="3" fill="url(#jb-lid)" stroke="#b3bac2" stroke-width="0.6"/>`,
  },
  ice: {
    label: "Ice",
    labelAr: "ثلج",
    h: 18,
    svg: `<defs>${vertical("jb-ice", "#f4fbff", "#bfe2f6")}</defs>
      <g fill="url(#jb-ice)" stroke="#9ccbe8" stroke-width="0.7">
        <rect x="38" y="4" width="12" height="11" rx="2" transform="rotate(-8 44 9)"/>
        <rect x="54" y="3" width="12" height="11" rx="2" transform="rotate(6 60 8)"/>
        <rect x="70" y="5" width="12" height="11" rx="2" transform="rotate(-4 76 10)"/>
      </g>`,
  },
  cola: {
    label: "Soft drink",
    labelAr: "مشروب غازي",
    h: 24,
    svg: `<defs>${vertical("jb-cola", "#8a4d2a", "#2f160a")}</defs>
      <path d="M34 3 H86 L83 21 H37 Z" fill="url(#jb-cola)"/>
      ${dot(46, 9, 1.4, "#e9c9a8", 0.7)}${dot(58, 14, 1, "#e9c9a8", 0.7)}${dot(70, 8, 1.3, "#e9c9a8", 0.7)}${dot(76, 15, 1, "#e9c9a8", 0.7)}`,
  },
  cup: {
    label: "Cup",
    labelAr: "كوب",
    h: 52,
    closed: -42,
    svg: `<defs>${across("jb-cup", "#ffffff", "#f3f4f6", "#c9ced5")}${across("jb-cup-band", "#f25a48", "#e02d25", "#a81717")}</defs>
      <path d="M30 3 H90 L83 49 H37 Z" fill="url(#jb-cup)" stroke="#b3bac2" stroke-width="0.6"/>
      <path d="M32.5 18 H87.5 L85.5 32 H34.5 Z" fill="url(#jb-cup-band)"/>`,
  },
  cap: {
    label: "Cap",
    labelAr: "غطاء",
    h: 14,
    svg: `<defs>${across("jb-cap", "#6fb4ee", "#2f86d6", "#1c5fa3")}</defs>
      <rect x="49" y="3" width="22" height="9" rx="2" fill="url(#jb-cap)"/>`,
  },
  water: {
    label: "Water",
    labelAr: "ماء",
    h: 26,
    svg: `<defs>${vertical("jb-drop", "#d3eefc", "#5fb3ea")}</defs>
      <path d="M60 3 Q74 17 60 23 Q46 17 60 3 Z" fill="url(#jb-drop)"/>
      <ellipse cx="56" cy="15" rx="2" ry="3.4" fill="#fff" opacity="0.7"/>`,
  },
  bottle: {
    label: "Bottle",
    labelAr: "قارورة",
    h: 68,
    closed: -26,
    svg: `<defs>${across("jb-bottle", "#f6fcff", "#dff2fc", "#a9d6f0")}${across("jb-bottle-label", "#6fb4ee", "#2f86d6", "#1c5fa3")}</defs>
      <path d="M52 3 H68 V10 Q84 16 84 28 V58 Q84 64 78 64 H42 Q36 64 36 58 V28 Q36 16 52 10 Z" fill="url(#jb-bottle)" stroke="#8fc3e3" stroke-width="0.7"/>
      <rect x="36" y="32" width="48" height="14" fill="url(#jb-bottle-label)"/>
      <path d="M42 22 V58" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.7"/>`,
  },
};

// fries come as they are served - in the carton, one picture - not in parts
export const FRIES = ["fries-boxed"];
export const CHEESE_FRIES = ["cheese-fries-boxed"];
export const SOFT_DRINK = ["soft-drink"];
export const WATER = ["water-bottle"];

export const LAYER_OPTIONS = Object.entries(LAYERS).map(([value, layer]) => ({
  value,
  label: layer.label,
}));

export const CLASSIC_BURGER = ["bun-top", "lettuce", "onion", "tomato", "egg", "cheese", "patty", "bun-bottom"];

// ---- the build-your-own game on the menu ---------------------------------
// What goes ON a burger. The meat is not in this list: a customer adds more of
// the meat the item already has - beef on a beef burger, chicken on a chicken
// one - never the other kind.
const BURGER_EXTRAS = ["lettuce", "onion", "tomato", "pickles", "cheese", "sauce", "mayo"];
const BURGER_MEATS = ["patty", "chicken"];
export const MAX_LAYERS = 14;

/** What a customer may add to this item while playing with it. */
export function extrasFor(keys) {
  const has = (key) => keys.includes(key);
  if (has("hotdog-bun-top") || has("hotdog-bun-bottom")) return ["sausage", "sauce-line", "mayo", "pickles", "cheese", "onion"];
  if (has("bun-top") || has("bun-bottom")) return [...BURGER_EXTRAS, ...BURGER_MEATS.filter(has)];
  if (has("fries-box")) return ["fries", "cheese-sauce"];
  return [];
}

/** Adds a layer where it belongs: on top of the base (bottom bun, carton), not under it. */
export function addLayer(keys, key) {
  const next = [...keys];
  const last = next[next.length - 1];
  if (last && LAYERS[last]?.fixed) next.splice(next.length - 1, 0, key);
  else next.push(key);
  return next;
}

// ---- photographs ----------------------------------------------------------
// Each layer has a cut-out photograph in public/layers/ (scripts/cut-layers.mjs
// makes them and lists them in photoLayers.json). A photograph shows the layer
// from above and to the side, so how layers sit together is not the drawings'
// arithmetic. Per layer, as a share of its own height:
//   closed  how far it slides up behind the layer above when the stack is shut
//   open    how far it still overlaps when the stack is apart (keeps a tall
//           burger on one screen; 0 = clear air between layers)
// and `width`, in the same units as the drawings (a bun is 120 wide).
const FIT = { closed: 0.64, open: 0.34 };
const PHOTO_FIT = {
  onion: { closed: 0.7 },
  cheese: { closed: 0.72, open: 0.42 },
  egg: { closed: 0.7 },
  pickles: { closed: 0.55, open: 0 },
  sauce: { closed: 0.74 },
  mayo: { closed: 0.74 },
  "sauce-line": { closed: 0.45, open: 0 },
  sausage: { closed: 0.6, open: 0 },
  "bun-bottom": { closed: 0.58 },
  "hotdog-bun-bottom": { closed: 0.62, open: 0 },
  fries: { closed: 0.2, open: 0 },
  "fries-box": { closed: 0.8, open: 0.05 },
  // shown whole, on their own: sized to be seen, not to match a bun
  "fries-boxed": { width: 96 },
  "cheese-fries-boxed": { width: 96 },
  "soft-drink": { width: 76 },
  "water-bottle": { width: 50 },
};

const photoOf = (key) => {
  const photo = PHOTOS[key];
  if (!photo) return null;
  const fit = { ...FIT, ...PHOTO_FIT[key] };
  return { ...photo, width: fit.width ?? Math.round(120 * photo.rel), closed: fit.closed, open: fit.open };
};

/**
 * Fries are shown as they are served: standing in their carton, as one
 * picture - with the cheese sauce on top if the item has it. An item saved
 * as the separate parts (fries + carton) is shown the same way, so nothing
 * already in the database has to be rewritten.
 */
function asServed(keys) {
  if (keys.includes("fries") && keys.includes("fries-box")) {
    return [keys.includes("cheese-sauce") ? "cheese-fries-boxed" : "fries-boxed"];
  }
  return keys;
}

/** Only the keys this file knows how to show, in the order given. */
export function resolveLayers(keys) {
  return asServed(Array.isArray(keys) ? keys : [])
    .filter((key) => LAYERS[key])
    .map((key) => ({ key, ...LAYERS[key], photo: photoOf(key) }));
}

/** True when every layer of the item has a photograph. */
export function hasPhotos(keys) {
  const layers = resolveLayers(keys);
  return layers.length > 0 && layers.every((layer) => layer.photo);
}
