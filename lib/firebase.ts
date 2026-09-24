import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  type Auth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ─── Firebase config ──────────────────────────────────────────────────────────
// Env vars are set in .env.local and take full precedence.
// The hard-coded fallbacks are the OLD project — they will never be used in
// production because NEXT_PUBLIC_* vars are always present, but they prevent
// a crash during `next build` static analysis when env vars are absent.

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            ?? "",
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? "",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         ?? "",
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             ?? "",
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// ─── Firebase app (singleton) ─────────────────────────────────────────────────

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ─── Auth (stable singleton — critical for RecaptchaVerifier) ─────────────────
//
// RecaptchaVerifier stores an internal reference to the Auth instance it was
// constructed with.  signInWithPhoneNumber() also receives that same Auth
// instance. Firebase validates that both references are identical.
//
// The previous Proxy pattern called getClientAuth() on every property access,
// which could return different object references across calls (because
// initializeAuth throws on a second call, the catch branch returned null, and
// getAuth() was used as fallback — producing a different object).  That
// mismatch is the exact cause of:
//
//   RecaptchaVerifier.assertNotDestroyed → auth/internal-error
//
// Fix: resolve auth ONCE to a module-level constant.  On the server (SSR/edge)
// where window is absent we export a null-safe stub so server-side imports
// don't crash; the real auth is only used in the browser.

let auth: Auth;

if (typeof window !== "undefined") {
  // Browser — initialise the real Auth instance exactly once.
  try {
    auth = initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    });
  } catch {
    // initializeAuth throws "already exists" on hot-reload / Strict Mode
    // double-init. getAuth() always returns the existing instance.
    auth = getAuth(app);
  }
} else {
  // Server-side rendering — getAuth works without persistence options.
  // This instance is never used for reCAPTCHA/phone auth (browser-only).
  auth = getAuth(app);
}

// ─── Firestore ────────────────────────────────────────────────────────────────

const db = getFirestore(app);

// ─── Storage ──────────────────────────────────────────────────────────────────

const storage = getStorage(app);

// ─── Exports ──────────────────────────────────────────────────────────────────

export { auth, db, storage };
export default app;
