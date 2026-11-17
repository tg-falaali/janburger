// Jan Burger - public site + staff dashboard.
// https://v2.quasar.dev/quasar-cli-webpack/quasar-config-file

import { defineConfig } from "#q-app/wrappers";
import dotenv from "dotenv";
dotenv.config();

export default defineConfig(() => {
  return {
    boot: ["i18n"],

    css: ["app.css"],

    extras: ["material-icons"],

    build: {
      vueRouterMode: "hash",

      // This app has its OWN Firebase project. Empty values = demo mode.
      env: {
        FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || "",
        FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN || "",
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "",
        FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL || "",
        FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || "",
        FIREBASE_MESSAGING_SENDER_ID:
          process.env.FIREBASE_MESSAGING_SENDER_ID || "",
        FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || "",
      },

      esbuildTarget: {
        browser: ["es2022", "firefox115", "chrome115", "safari14"],
        node: "node20",
      },
    },

    devServer: {
      server: { type: "http" },
      historyApiFallback: true,
      // 8080 is tg-tasks, 8090 is tg-auto.
      port: 8095,
      open: false,
    },

    framework: {
      config: {
        brand: {
          primary: "#e31e24", // the red of the logo
          secondary: "#1c1c1c",
          accent: "#ffc72c", // the logo's yellow
          dark: "#1a1210",
          positive: "#2e9e4f",
          negative: "#b00020",
          info: "#3a6ea5",
          warning: "#f2a20c",
        },
      },
      plugins: ["Notify", "Dialog"],
    },

    animations: [],

    // The installable app ("Add to Home Screen"). The service worker keeps the
    // site working offline and takes a new version as soon as one is deployed,
    // rather than waiting for every open tab to be closed first.
    pwa: {
      workboxMode: "GenerateSW",
      injectPwaMetaTags: true,
      swFilename: "sw.js",
      manifestFilename: "manifest.json",
      useCredentialsForManifestTag: false,
      extendGenerateSWOptions(cfg) {
        cfg.skipWaiting = true;
        cfg.clientsClaim = true;
        cfg.cleanupOutdatedCaches = true;
        // the 3D view is a big, rarely used file: fetched when wanted, not up front
        cfg.maximumFileSizeToCacheInBytes = 3 * 1024 * 1024;
        // live data (the menu, the branches) always comes from the database,
        // never from an old copy
        cfg.navigateFallbackDenylist = [/^\/__\//];
      },
    },
  };
});
