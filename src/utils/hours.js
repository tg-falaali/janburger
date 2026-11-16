// Working hours. A branch holds seven days, index 0 = Sunday:
//   { closed: false, open: "11:00", close: "01:00" }
// A close at or before the open means the branch shuts after midnight.

export const DAYS = [
  { en: "Sunday", ar: "الأحد" },
  { en: "Monday", ar: "الإثنين" },
  { en: "Tuesday", ar: "الثلاثاء" },
  { en: "Wednesday", ar: "الأربعاء" },
  { en: "Thursday", ar: "الخميس" },
  { en: "Friday", ar: "الجمعة" },
  { en: "Saturday", ar: "السبت" },
];

export function defaultWeek(open = "11:00", close = "01:00") {
  return DAYS.map(() => ({ closed: false, open, close }));
}

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** The day and minute it is in Bahrain, whatever the visitor's own clock says. */
export function bahrainNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bahrain",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    get("weekday")
  );
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

export function isOpenNow(hours, now = bahrainNow()) {
  if (!Array.isArray(hours) || hours.length !== 7) return false;

  const today = hours[now.day];
  if (today && !today.closed) {
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);
    if (close > open ? now.minutes >= open && now.minutes < close : now.minutes >= open) {
      return true;
    }
  }

  // Still inside last night's shift, the one that ran past midnight.
  const yesterday = hours[(now.day + 6) % 7];
  if (yesterday && !yesterday.closed) {
    const open = toMinutes(yesterday.open);
    const close = toMinutes(yesterday.close);
    if (close <= open && now.minutes < close) return true;
  }
  return false;
}

// In Arabic the half of the day is written ص (morning) or م (evening), after
// the time, and the digits stay as they are on the shop's own menu.
const WORDS = {
  en: { am: "AM", pm: "PM", closed: "Closed" },
  ar: { am: "ص", pm: "م", closed: "مغلق" },
};

export function formatTime(hhmm, locale = "en") {
  const words = WORDS[locale] || WORDS.en;
  const total = toMinutes(hhmm);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  const suffix = h < 12 ? words.am : words.pm;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? ":" + String(m).padStart(2, "0") : ""} ${suffix}`;
}

export function formatDay(day, locale = "en") {
  if (!day || day.closed) return (WORDS[locale] || WORDS.en).closed;
  return `${formatTime(day.open, locale)} – ${formatTime(day.close, locale)}`;
}
