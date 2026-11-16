import { defaultWeek } from "src/utils/hours";
import { FRIES, CHEESE_FRIES, SOFT_DRINK, WATER } from "src/utils/burgerLayers";

// What is known from the shop sign: the name, the six branches and the two
// phone numbers. Everything else - hours, menu items, prices - is SAMPLE data
// to be replaced from the dashboard.

export const seedInfo = {
  name: "Jan Burger",
  nameAr: "جان برجر",
  tagline: "On Charcoal Grill",
  taglineAr: "على الفحم",
  company: "Jan Burger Co. W.L.L. Bahrain",
  about:
    "Burgers grilled over real charcoal, the same way since day one. Come as you are, eat while it's hot.",
  aboutAr: "برجر مشوي على الفحم، بنفس الطعم من أول يوم.",
  phones: ["17331991", "17322202"],
  whatsapp: "",
  instagram: "",
  announcement: "",
  categories: ["Burgers", "Sandwiches", "Sides", "Drinks"],
};

const branch = (order, name, nameAr) => ({
  id: `seed-branch-${order}`,
  order,
  name,
  nameAr,
  address: "",
  phone: "",
  mapUrl: "",
  active: true,
  hours: defaultWeek(),
});

export const seedBranches = [
  branch(1, "Gudaibiya", "القضيبية"),
  branch(2, "Riffa", "الرفاع"),
  branch(3, "Muharraq", "المحرق"),
  branch(4, "Jid A'ali", "جدعلي"),
  branch(5, "Hamad Town", "مدينة حمد"),
  branch(6, "Adliya", "العدلية"),
];

const item = (order, category, name, nameAr, price, description = "", layers = []) => ({
  id: `seed-menu-${order}`,
  order,
  category,
  name,
  nameAr,
  price,
  description,
  available: true,
  layers, // top to bottom - see src/utils/burgerLayers.js
});

const TOP = "bun-top";
const BOTTOM = "bun-bottom";

export const seedMenu = [
  item(1, "Burgers", "Charcoal Beef Burger", "برجر لحم على الفحم", 0.8, "Sample item",
    [TOP, "lettuce", "onion", "tomato", "egg", "cheese", "patty", BOTTOM]),
  item(2, "Burgers", "Cheese Burger", "برجر بالجبن", 0.9, "Sample item",
    [TOP, "lettuce", "tomato", "cheese", "patty", BOTTOM]),
  item(3, "Burgers", "Double Burger", "برجر دبل", 1.4, "Sample item",
    [TOP, "lettuce", "tomato", "cheese", "patty", "cheese", "patty", BOTTOM]),
  item(4, "Burgers", "Chicken Burger", "برجر دجاج", 0.8, "Sample item",
    [TOP, "lettuce", "pickles", "sauce", "chicken", BOTTOM]),
  item(5, "Sandwiches", "Grilled Chicken Sandwich", "سندويش دجاج مشوي", 0.9, "Sample item",
    [TOP, "lettuce", "tomato", "sauce", "chicken", BOTTOM]),
  item(6, "Sandwiches", "Hot Dog", "هوت دوغ", 0.6, "Sample item",
    ["hotdog-bun-top", "sauce-line", "pickles", "sausage", "hotdog-bun-bottom"]),
  item(7, "Sides", "French Fries", "بطاطس", 0.5, "Sample item", FRIES),
  item(8, "Sides", "Cheese Fries", "بطاطس بالجبن", 0.7, "Sample item", CHEESE_FRIES),
  item(9, "Drinks", "Soft Drink", "مشروب غازي", 0.2, "Sample item", SOFT_DRINK),
  item(10, "Drinks", "Water", "ماء", 0.1, "Sample item", WATER),
];
