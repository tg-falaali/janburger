// Jan Burger's real details, as published by the shop itself on
//   https://linktr.ee/Janburgerbh           branches: hours, phones, map links
//   the "JB Menu.pdf" that page links to    the menu and prices; branch addresses
// (read on 16 Nov 2026), with the branches' hours and map links then corrected
// by the owner from each branch's Google Maps listing. Running this writes
// three JSON files beside it, which
// are then loaded into the Realtime Database:
//
//   node scripts/real-data.mjs
//   firebase database:set    /menu      scripts/out/menu.json
//   firebase database:set    /branches  scripts/out/branches.json
//   firebase database:update /site/info scripts/out/info.json
//
// What neither source says is left out or hidden rather than guessed - see
// the notes on Adliya and Gudaibiya below.

import { mkdirSync, writeFileSync } from "node:fs";

// ------------------------------------------------------------------ branches
const week = (open, close) => Array.from({ length: 7 }, () => ({ closed: false, open, close }));
// index 0 = Sunday ... 5 = Friday
const withFriday = (open, close, friOpen, friClose) =>
  week(open, close).map((day, i) => (i === 5 ? { closed: false, open: friOpen, close: friClose } : day));

const DAILY = week("16:00", "01:00"); // "Daily: 4:00 pm - 1:00 am"

const branches = {
  "seed-branch-2": {
    order: 1, name: "Riffa", nameAr: "الرفاع", address: "",
    phone: "77999881", phone2: "77999882",
    mapUrl: "https://maps.app.goo.gl/7cGyXmHr7tiBTzZ98",
    active: true, hours: DAILY,
  },
  "seed-branch-4": {
    order: 2, name: "Jid Ali", nameAr: "جدعلي", address: "",
    phone: "17780232", phone2: "17780383",
    mapUrl: "https://maps.app.goo.gl/p7CYvuf6AU1wV5WY9",
    active: true, hours: DAILY,
  },
  "seed-branch-3": {
    order: 3, name: "Muharraq", nameAr: "المحرق", address: "Near Bahrain Club",
    phone: "17322292", phone2: "17331991",
    mapUrl: "https://maps.app.goo.gl/jKrKvLdB9Rgc8SbX7",
    active: true, hours: DAILY,
  },
  "seed-branch-5": {
    order: 4, name: "Hamad Town", nameAr: "مدينة حمد", address: "",
    phone: "17414606", phone2: "17414811",
    mapUrl: "https://maps.app.goo.gl/F1e28yf8j8VpHQ3N9",
    active: true, hours: DAILY,
  },
  "branch-diyar": {
    order: 5, name: "Diyar Al Muharraq", nameAr: "ديار المحرق", address: "Souq Al Baraha",
    phone: "77990013", phone2: "77990014",
    mapUrl: "https://maps.app.goo.gl/ASTLnYaJwLqN3XsA8",
    active: true,
    // from the owner: 4 PM - 12:30 AM, and until 1 AM on Thursday and Friday
    hours: week("16:00", "00:30").map((day, i) => (i === 4 || i === 5 ? { ...day, close: "01:00" } : day)),
  },
  "branch-jidhafs": {
    order: 6, name: "Jidhafs", nameAr: "جدحفص", address: "Gardenia Plaza",
    phone: "77900084", phone2: "77900085",
    mapUrl: "https://maps.app.goo.gl/8x5ick7gTTTpiZNY8",
    active: true,
    // "Sat-Thu: 10:00 am - 1:00 am, Friday: 4:00 pm - 1:00 am"
    hours: withFriday("10:00", "01:00", "16:00", "01:00"),
  },
  // Adliya is on the menu's branch list with its phones, but not on the
  // Linktree: no opening hours and no map link are published for it. It is
  // kept, HIDDEN, until someone who knows the hours fills them in.
  "seed-branch-6": {
    order: 7, name: "Adliya", nameAr: "العدلية", address: "Manama",
    phone: "17712505", phone2: "17712554",
    // temporarily closed (owner, Nov 2026): the map link is kept for when it reopens
    mapUrl: "https://maps.app.goo.gl/c7nTjH5VefDnCyQGA", active: false, hours: DAILY,
  },
  // Gudaibiya is on the old shop sign only - in neither current source.
  // Hidden, not deleted, in case it is still open.
  "seed-branch-1": {
    order: 8, name: "Gudaibiya", nameAr: "القضيبية", address: "",
    phone: "", phone2: "", mapUrl: "", active: false, hours: DAILY,
  },
};

// ---------------------------------------------------------------------- menu
const BEEF = ["bun-top", "lettuce", "tomato", "cheese", "patty", "bun-bottom"];
const CHICKEN = ["bun-top", "lettuce", "tomato", "cheese", "chicken", "bun-bottom"];
const BIG_BEEF = ["bun-top", "lettuce", "tomato", "cheese", "patty", "cheese", "patty", "bun-bottom"];
const BIG_CHICKEN = ["bun-top", "lettuce", "tomato", "cheese", "chicken", "cheese", "chicken", "bun-bottom"];
const MIX = ["bun-top", "lettuce", "tomato", "cheese", "chicken", "cheese", "patty", "bun-bottom"];
const FRIES = ["fries-boxed"];

// [category, name, nameAr, price, description, layers]
// The names, prices and descriptions are the menu's own. The LAYERS are only
// how the item is pictured on the site: the menu does not list what is in a
// burger beyond its patty, so the salad and cheese shown are an illustration.
const rows = [
  ["Burger Meals", "Jan Meal", "جان وجبة", 2.2, "Beef patty, fries & drink", BEEF],
  ["Burger Meals", "Chi. Jan Meal", "ج جان وجبة", 2.2, "Chicken patty, fries & drink", CHICKEN],
  ["Burger Meals", "Big Jan Meal", "بق جان وجبة", 2.8, "2x beef patty, fries & drink", BIG_BEEF],
  ["Burger Meals", "Big Chi. Jan Meal", "بق ج جان وجبة", 2.8, "2x chicken patty, fries & drink", BIG_CHICKEN],
  ["Burger Meals", "Mix Jan Meal", "مكس جان وجبة", 2.8, "Chicken & beef patty, fries & drink", MIX],
  ["Club Meals", "Classic Club Meal", "وجبة كلوب كلاسيكية", 2.0, "", []],
  ["Club Meals", "Jan Club Meal", "جان كلوب وجبة", 2.6, "", []],

  ["Sides", "Janapeño Cheese Bites", "قطع الجبن بالهالبينو", 1.1, "New", []],
  ["Sides", "French Fries - Regular", "بطاطس مقلية - عادي", 0.7, "", []],
  ["Sides", "French Fries - Large", "بطاطس مقلية - كبير", 1.3, "", []],
  ["Sides", "Garlic Fries - Regular", "بطاطس بالثوم - عادي", 1.1, "", []],
  ["Sides", "Garlic Fries - Large", "بطاطس بالثوم - كبير", 1.7, "", []],
  ["Sides", "Extra Cheese", "جبن إضافي", 0.15, "", []],

  ["Mojitos", "Blue Oasis", "الواحة الزرقاء", 1.2, "", []],
  ["Mojitos", "Passion Mirage", "سراب الشغف", 1.2, "", []],
  ["Mojitos", "Strawberry Sahara", "انتعاش الفراولة", 1.2, "", []],
  ["Mojitos", "Guilt-Free Mango Medina", "مدينة المانجو خالي من الذنب", 1.5, "Sugar-free mojito", []],

  ["Ice Teas", "Peach Kasbah", "قصبة الخوخ", 1.2, "", []],
  ["Ice Teas", "Lemon Tea", "شاي الليمون", 1.2, "", []],
  ["Ice Teas", "Razzle Tea", "شاي رازل", 1.2, "", []],

  ["Soft Drinks", "Water", "ماء", 0.2, "", ["water-bottle"]],
  ["Soft Drinks", "Juice", "عصير", 0.3, "", []],
  ["Soft Drinks", "Soft Drinks", "مشروبات غازية", 0.4, "Cola, Orange, Blackcurrant, Citrus, Lemon, Zero Lime", []],
];

// The Arabic of each description. "Sugar-free mojito" is the menu's own
// wording; the rest are plain translations of the English beside them.
const DESCRIPTION_AR = {
  "Beef patty, fries & drink": "قطعة لحم، بطاطس ومشروب",
  "Chicken patty, fries & drink": "قطعة دجاج، بطاطس ومشروب",
  "2x beef patty, fries & drink": "قطعتا لحم، بطاطس ومشروب",
  "2x chicken patty, fries & drink": "قطعتا دجاج، بطاطس ومشروب",
  "Chicken & beef patty, fries & drink": "قطعة دجاج وقطعة لحم، بطاطس ومشروب",
  New: "جديد",
  "Sugar-free mojito": "موهيتو خالي من السكر",
  "Cola, Orange, Blackcurrant, Citrus, Lemon, Zero Lime": "كولا، برتقال، كشمش أسود، حمضيات، ليمون، لايم زيرو",
};
const ADDRESS_AR = {
  "Near Bahrain Club": "بالقرب من نادي البحرين",
  "Souq Al Baraha": "سوق البراحة",
  "Gardenia Plaza": "جاردينيا بلازا",
  Manama: "المنامة",
};
for (const branch of Object.values(branches)) {
  if (ADDRESS_AR[branch.address]) branch.addressAr = ADDRESS_AR[branch.address];
}

const menu = Object.fromEntries(
  rows.map(([category, name, nameAr, price, description, layers], i) => [
    `item-${String(i + 1).padStart(2, "0")}`,
    {
      order: i + 1, category, name, nameAr, price, description, available: true,
      ...(DESCRIPTION_AR[description] ? { descriptionAr: DESCRIPTION_AR[description] } : {}),
      ...(layers.length ? { layers } : {}),
    },
  ])
);

// ------------------------------------------------------------------ the shop
// Merged INTO site/info: the name and the sign's wording are left as they are.
const info = {
  about: "Serving you since 1993. Nobody does it better.",
  aboutAr: "في خدمتكم منذ عام 1993.",
  // the Muharraq branch's two lines - the same shop the old sign's numbers were for
  phones: ["17331991", "17322292"],
  categories: ["Burger Meals", "Club Meals", "Sides", "Mojitos", "Ice Teas", "Soft Drinks"],
  announcement: "New branch - coming soon | فرع جديد - قريباً",
  menuUrl: "https://drive.google.com/file/d/1RcssOsTpUYYtEfaROgYJGh-Kf3YveE6p/view",
  helpdeskUrl: "https://janburger.odoo.com/helpdesk/customer-care-1",
  cateringEmail: "care@janburgerbh.com",
  linktreeUrl: "https://linktr.ee/Janburgerbh",
};

mkdirSync(new URL("./out/", import.meta.url), { recursive: true });
for (const [name, data] of Object.entries({ branches, menu, info })) {
  writeFileSync(new URL(`./out/${name}.json`, import.meta.url), JSON.stringify(data, null, 2) + "\n");
}
console.log(`${Object.keys(branches).length} branches, ${Object.keys(menu).length} menu items, info: ${Object.keys(info).join(", ")}`);
