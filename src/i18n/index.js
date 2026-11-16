import { computed } from "vue";
import { createI18n } from "vue-i18n";
import { messages, categoryAr } from "./messages.js";

// English or Arabic. The choice is remembered on this device; a first-time
// visitor gets Arabic if that is what their browser asks for, else English.

const KEY = "jan-burger-lang";
const SUPPORTED = ["en", "ar"];

function initial() {
  try {
    const saved = localStorage.getItem(KEY);
    if (SUPPORTED.includes(saved)) return saved;
  } catch {
    /* private window: nothing remembered */
  }
  return String(navigator.language || "").toLowerCase().startsWith("ar") ? "ar" : "en";
}

export const i18n = createI18n({
  legacy: false,
  locale: initial(),
  fallbackLocale: "en",
  messages,
});

/** Tells the page itself which language it is in: Arabic reads right to left. */
function applyToDocument(locale) {
  const html = document.documentElement;
  html.lang = locale;
  html.dir = locale === "ar" ? "rtl" : "ltr";
}
applyToDocument(i18n.global.locale.value);

export function setLocale(locale) {
  if (!SUPPORTED.includes(locale)) return;
  i18n.global.locale.value = locale;
  applyToDocument(locale);
  try {
    localStorage.setItem(KEY, locale);
  } catch {
    /* not remembered, still switched */
  }
}

/**
 * For what comes from the database. Each thing carries both of its names, and
 * `pick(english, arabic)` gives the one for the language in use - falling back
 * to the other when one of them was never filled in.
 */
export function useLocale() {
  const locale = i18n.global.locale;
  const isAr = computed(() => locale.value === "ar");
  const pick = (en, ar) => (isAr.value ? ar || en : en || ar) || "";
  /** ...and the other one, for the smaller line under it. */
  const other = (en, ar) => {
    const main = pick(en, ar);
    const second = isAr.value ? en : ar;
    return second && second !== main ? second : "";
  };
  const category = (name) => (isAr.value ? categoryAr[name] || name : name);
  const toggle = () => setLocale(isAr.value ? "en" : "ar");
  return { locale, isAr, pick, other, category, toggle };
}
