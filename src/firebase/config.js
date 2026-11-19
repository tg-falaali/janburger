import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

/**
 * With no keys in .env the app runs in demo mode: sample data, kept in this
 * browser only, and a sign-in that is not a real one. It is there so the site
 * can be looked at before the Firebase project exists - never deploy it so.
 *
 * The database URL is part of "ready": without it the SDK guesses a US
 * address, which is wrong for a database kept in another region.
 */
export const firebaseReady = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.databaseURL
);

const app = firebaseReady ? initializeApp(firebaseConfig) : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getDatabase(app) : null;
// pictures of layers staff upload from the dashboard (storage.rules)
export const storage = app ? getStorage(app) : null;
