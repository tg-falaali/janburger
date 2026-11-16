// Everything the site SAYS, in English and in Arabic. What it SHOWS - the
// menu, the branches - comes from the database, where each thing carries both
// of its names (name / nameAr and the like); see `pick` in ./index.js.

export const messages = {
  en: {
    lang: { other: "العربية", switchTo: "عرض الموقع بالعربية" },
    demo: "Demo mode — sample menu and hours, not connected to Firebase yet.",
    error: "We couldn't load the latest details. Please refresh, or call us.",
    currency: "BD",

    nav: { menu: "Menu", branches: "Branches & hours", contact: "Contact", call: "Call {phone}" },
    open: {
      none: "We're closed right now — see the hours below",
      one: "We're open now",
      all: "All {n} branches are open now",
      some: "{open} of {n} branches open now",
    },

    menu: {
      title: "Our menu",
      pdf: "View the full menu (PDF)",
      all: "All",
      categories: "Menu categories",
      empty: "The menu is being written up. Call us and we'll tell you what's on the grill.",
      unavailable: "Not available today",
      pick: "Pick an item to see it here.",
      takeApart: "Take it apart",
      putBack: "Put it back together",
      inIt: "In it now, top to bottom",
      remove: "Remove {name}",
      add: "Add {name}",
      full: "That's as tall as it gets!",
      reset: "Back to the original",
      close: "Close",
    },

    branches: {
      title: "Branches & working hours",
      empty: "Branch details are on their way.",
      openNow: "Open now",
      closedNow: "Closed now",
      today: "Today",
      week: "All week",
      closed: "Closed",
      map: "Open in Google Maps",
      mapAria: "Open the {name} branch in Google Maps",
      noMap: "Map link coming soon",
    },

    footer: {
      call: "Call us",
      listening: "We're listening",
      helpdesk: "Help desk & feedback",
      catering: "Catering enquiries",
      follow: "Follow us",
      staff: "Staff login",
      top: "Back to the top",
    },

    login: {
      title: "Staff sign-in",
      demo: "Demo mode: Firebase is not connected, so any email and password will open the dashboard. Changes stay in this browser.",
      email: "Email",
      password: "Password",
      needEmail: "Enter your email",
      needPassword: "Enter your password",
      show: "Show password",
      hide: "Hide password",
      submit: "Sign in",
      back: "Back to the site",
    },
  },

  ar: {
    lang: { other: "English", switchTo: "View the site in English" },
    demo: "وضع تجريبي — قائمة وأوقات عمل تجريبية، غير متصل بقاعدة البيانات بعد.",
    error: "تعذّر تحميل آخر التفاصيل. يرجى تحديث الصفحة أو الاتصال بنا.",
    currency: "د.ب",

    nav: { menu: "القائمة", branches: "الفروع وأوقات العمل", contact: "تواصل معنا", call: "اتصل {phone}" },
    open: {
      none: "نحن مغلقون الآن — أوقات العمل في الأسفل",
      one: "نحن مفتوحون الآن",
      all: "جميع الفروع ({n}) مفتوحة الآن",
      some: "{open} من {n} فروع مفتوحة الآن",
    },

    menu: {
      title: "قائمة الطعام",
      pdf: "عرض القائمة كاملة (PDF)",
      all: "الكل",
      categories: "أقسام القائمة",
      empty: "القائمة قيد الإعداد. اتصل بنا لنخبرك بما على الشواية.",
      unavailable: "غير متوفر اليوم",
      pick: "اختر صنفاً لعرضه هنا.",
      takeApart: "افتح المكونات",
      putBack: "أعد التجميع",
      inIt: "المكونات الحالية من الأعلى إلى الأسفل",
      remove: "إزالة {name}",
      add: "إضافة {name}",
      full: "هذا أقصى ارتفاع!",
      reset: "العودة إلى الأصل",
      close: "إغلاق",
    },

    branches: {
      title: "الفروع وأوقات العمل",
      empty: "تفاصيل الفروع في الطريق.",
      openNow: "مفتوح الآن",
      closedNow: "مغلق الآن",
      today: "اليوم",
      week: "طوال الأسبوع",
      closed: "مغلق",
      map: "افتح في خرائط Google",
      mapAria: "افتح فرع {name} في خرائط Google",
      noMap: "رابط الخريطة قريباً",
    },

    footer: {
      call: "اتصل بنا",
      listening: "نسمع منكم",
      helpdesk: "المساعدة والشكاوى",
      catering: "خدمة الكيترنق",
      follow: "تابعونا",
      staff: "دخول الموظفين",
      top: "العودة إلى الأعلى",
    },

    login: {
      title: "دخول الموظفين",
      demo: "وضع تجريبي: قاعدة البيانات غير متصلة، لذا أي بريد وكلمة مرور يفتحان لوحة التحكم. التغييرات تبقى في هذا المتصفح.",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      needEmail: "أدخل بريدك الإلكتروني",
      needPassword: "أدخل كلمة المرور",
      show: "إظهار كلمة المرور",
      hide: "إخفاء كلمة المرور",
      submit: "تسجيل الدخول",
      back: "العودة إلى الموقع",
    },
  },
};

// Menu categories are typed by staff, in English, and are also what an item
// is filed under - so they are looked up here rather than translated in the
// database. One that is not listed is shown as it was typed.
export const categoryAr = {
  Meals: "الوجبات",
  Sides: "الأطباق الجانبية",
  Mojitos: "الموهيتو",
  "Ice Teas": "الشاي المثلج",
  "Soft Drinks": "المشروبات الباردة",
  Burgers: "البرجر",
  Sandwiches: "السندويشات",
  Drinks: "المشروبات",
  Desserts: "الحلويات",
};
