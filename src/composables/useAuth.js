import { reactive } from "vue";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, firebaseReady } from "src/firebase/config";

/**
 * An employee is a Firebase Authentication user - nothing more. Whoever is
 * added under Authentication > Users can sign in here and edit the site, and
 * the database rules ask the same single question (is this request signed in?).
 *
 * That only holds while PUBLIC SIGN-UP IS OFF in the Firebase console
 * (Authentication > Settings > User actions > "Enable create (sign-up)").
 * With it on, anyone could make themselves an account and with it a way in.
 */

const DEMO_FLAG = "jan-burger-demo-staff";

const state = reactive({
  user: null, // { uid, email, name }
  ready: false,
});

const asUser = (fbUser) => ({
  uid: fbUser.uid,
  email: fbUser.email,
  name: fbUser.displayName || fbUser.email,
});

let readyPromise = null;

function init() {
  if (readyPromise) return readyPromise;

  readyPromise = new Promise((resolve) => {
    if (!firebaseReady) {
      if (sessionStorage.getItem(DEMO_FLAG)) {
        state.user = { uid: "demo", email: "demo@local", name: "Demo staff" };
      }
      state.ready = true;
      resolve();
      return;
    }

    onAuthStateChanged(auth, (fbUser) => {
      state.user = fbUser ? asUser(fbUser) : null;
      state.ready = true;
      resolve();
    });
  });
  return readyPromise;
}

async function signIn(email, password) {
  if (!firebaseReady) {
    sessionStorage.setItem(DEMO_FLAG, "1");
    state.user = { uid: "demo", email: "demo@local", name: "Demo staff" };
    return;
  }

  const cred = await signInWithEmailAndPassword(auth, email, password);
  state.user = asUser(cred.user);
}

async function signOut() {
  if (firebaseReady) await firebaseSignOut(auth);
  sessionStorage.removeItem(DEMO_FLAG);
  state.user = null;
}

export function authErrorMessage(err) {
  switch (err?.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "Wrong email or password.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again in a few minutes.";
    case "auth/network-request-failed":
      return "No connection. Check the internet and try again.";
    case "auth/operation-not-allowed":
      return "Email sign-in is not switched on for this site yet.";
    default:
      return "Could not sign in. Please try again.";
  }
}

export function useAuth() {
  return { state, init, signIn, signOut, demo: !firebaseReady };
}
