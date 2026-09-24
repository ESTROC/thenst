import * as admin from "firebase-admin";

function getFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      // Prefer the base64-encoded service account JSON (set as
      // FIREBASE_SERVICE_ACCOUNT_KEY), which is portable and matches the
      // working forcesandfashion-66f97 project setup.
      const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

      if (base64Key) {
        const serviceAccount = JSON.parse(
          Buffer.from(base64Key, "base64").toString("utf8")
        );
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        // Fallback: separate env vars (legacy)
        const projectId =
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
          "forcesandfashion-66f97";
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(
          /\\n/g,
          "\n"
        );

        if (clientEmail && privateKey) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          });
        } else {
          admin.initializeApp({ projectId });
        }
      }
    } catch (error) {
      console.warn("Firebase admin initialization notice:", error);
      if (!admin.apps.length) {
        try {
          admin.initializeApp();
        } catch {
          // ignore build-time fallback
        }
      }
    }
  }
  return admin;
}

const adminInstance = getFirebaseAdmin();

// Safe lazy proxy for dbAdmin so it never crashes during module evaluation or build time
const dbAdmin = new Proxy({} as admin.firestore.Firestore, {
  get(target, prop, receiver) {
    try {
      if (admin.apps.length) {
        const db = admin.firestore();
        const value = Reflect.get(db, prop, receiver);
        return typeof value === "function" ? value.bind(db) : value;
      }
    } catch (e) {
      console.warn("dbAdmin safe proxy access warning:", e);
    }
    // Return safe dummy implementations for static page analysis / build time
    if (prop === "collection") {
      return () => ({
        where: () => ({
          limit: () => ({
            get: async () => ({ empty: true, docs: [] }),
          }),
          get: async () => ({ empty: true, docs: [] }),
        }),
        doc: () => ({
          get: async () => ({ exists: false, data: () => ({}) }),
          set: async () => ({}),
          update: async () => ({}),
        }),
        get: async () => ({ empty: true, docs: [] }),
        add: async () => ({ id: "mock-id" }),
      });
    }
    return () => {};
  },
});

export { adminInstance as admin, dbAdmin };
