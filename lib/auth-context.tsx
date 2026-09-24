"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User,
  type ConfirmationResult,
} from "firebase/auth";
import {
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  collection,
  addDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { UserProfile, UserRole } from "@/lib/types";
import { sendEmail } from "@/lib/email";
import { logActivity } from "@/lib/firestore";

// ─── constants ────────────────────────────────────────────────────────────────

const DEFAULT_SUPER_ADMIN_PASSWORD =
  process.env.NEXT_PUBLIC_DEFAULT_SUPER_ADMIN_PASSWORD || "SuperAdmin@123";
const APP_NAMESPACE = process.env.NEXT_PUBLIC_APP_NAMESPACE || "thenst";
const SUPER_ADMIN_EMAILS = [
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL_1,
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL_2,
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL_3,
]
  .filter(Boolean)
  .map((e) => e!.toLowerCase());

// ─── helpers ─────────────────────────────────────────────────────────────────

function isAppProfile(data: UserProfile): boolean {
  return !data.namespace || data.namespace === APP_NAMESPACE;
}

async function isSuperAdmin(email: string): Promise<boolean> {
  try {
    const res = await fetch("/api/check-superadmin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return data.isSuperAdmin === true;
  } catch {
    return false;
  }
}

function isDefaultSuperAdminLogin(email: string, password: string): boolean {
  return (
    SUPER_ADMIN_EMAILS.includes(email.toLowerCase()) &&
    password === DEFAULT_SUPER_ADMIN_PASSWORD
  );
}

// ─── pending-signup shape ─────────────────────────────────────────────────────
// Stored in React state between "submit form" and "OTP verified".
// Nothing is written to Firebase until the OTP is confirmed.

export interface PendingSignUp {
  email: string;
  password: string;
  fullName: string;
  phone: string; // E.164
  role: UserRole;
  companyDetails?: {
    name: string;
    website?: string;
    designation?: string;
  };
}

// ─── context shape ────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;

  /** Normal email/phone → password login. Unchanged from original. */
  signIn: (
    identifier: string,
    password: string,
    expectedRole?: UserRole
  ) => Promise<{ role: UserRole }>;

  /**
   * Step 1 of signup.
   * Checks for duplicate email/phone via the server API.
   * Does NOT create any Firebase user or Firestore document.
   * Returns the validated pending data so the caller can show the OTP modal.
   * Throws if duplicate found.
   */
  prepareSignUp: (data: PendingSignUp) => Promise<PendingSignUp>;

  /**
   * Step 2 of signup — called AFTER successful phone OTP verification.
   * Creates the Firebase Auth user, writes the Firestore profile, sends the
   * role-specific welcome email (exactly once).
   *
   * @param pending   The object returned by prepareSignUp.
   */
  completeSignUp: (pending: PendingSignUp) => Promise<void>;

  signOut: () => Promise<void>;

  /**
   * Step 1 of forgot-password: look up the phone attached to this account.
   * Returns the E.164 phone so the caller can open the OTP modal.
   * Throws if the account does not exist.
   */
  getPhoneForPasswordReset: (email: string) => Promise<string>;

  /**
   * Step 2 of forgot-password — called AFTER successful phone OTP verification.
   * Signs the user in temporarily, updates the password, then signs out.
   *
   * @param email       The account email.
   * @param newPassword The new password chosen by the user.
   * @param confirmationResult  The Firebase ConfirmationResult from OTP verification.
   */
  resetPasswordWithPhone: (
    email: string,
    newPassword: string,
    confirmationResult: ConfirmationResult
  ) => Promise<void>;

  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        const docRef = doc(db, "users", firebaseUser.uid);
        unsubscribeProfile = onSnapshot(
          docRef,
          (docSnap) => {
            if (
              docSnap.exists() &&
              isAppProfile(docSnap.data() as UserProfile)
            ) {
              setProfile(docSnap.data() as UserProfile);
            } else {
              setProfile(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error("Profile listener error:", error);
            setLoading(false);
          }
        );
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  // ─── signIn (unchanged) ──────────────────────────────────────────────────

  async function signIn(
    identifier: string,
    password: string,
    expectedRole?: UserRole
  ) {
    let email = identifier;

    if (!identifier.includes("@")) {
      const phoneClean = identifier.startsWith("+")
        ? "+" + identifier.replace(/\D/g, "")
        : identifier.replace(/\D/g, "");

      const res = await fetch("/api/auth/check-exists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneClean }),
      });
      const data = await res.json();

      if (!data.exists) {
        throw new Error("No account found with this phone number.");
      }
      email = data.email;
    }

    if (isDefaultSuperAdminLogin(email, password)) {
      try {
        const credential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const docRef = doc(db, "users", credential.user.uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          const newProfile: UserProfile = {
            uid: credential.user.uid,
            namespace: APP_NAMESPACE,
            email: credential.user.email || email,
            fullName: "Super Admin",
            phone: "",
            role: "superadmin",
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
          return { role: "superadmin" as UserRole };
        }

        const data = docSnap.data() as UserProfile;
        if (!isAppProfile(data)) {
          await firebaseSignOut(auth);
          throw new Error("Account not found in this application.");
        }
        setProfile(data);
        return { role: data.role };
      } catch (error: any) {
        if (
          error?.code !== "auth/user-not-found" &&
          error?.code !== "auth/invalid-credential"
        ) {
          throw error;
        }

        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const newProfile: UserProfile = {
          uid: credential.user.uid,
          namespace: APP_NAMESPACE,
          email: credential.user.email || email,
          fullName: "Super Admin",
          phone: "",
          role: "superadmin",
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "users", credential.user.uid), newProfile);
        setProfile(newProfile);
        return { role: "superadmin" as UserRole };
      }
    }

    const startTime = Date.now();
    const firebaseCred = await signInWithEmailAndPassword(auth, email, password);
    const duration = Date.now() - startTime;
    const firebaseUser = firebaseCred.user;

    const docRef = doc(db, "users", firebaseUser.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as UserProfile;

      if (!isAppProfile(data)) {
        await firebaseSignOut(auth);
        throw new Error("Account not found in this application.");
      }

      if (data.status === "blocked" || data.status === "disabled") {
        await firebaseSignOut(auth);
        throw new Error(
          "Your account has been " + data.status + ". Contact admin."
        );
      }

      if (
        expectedRole &&
        data.role !== expectedRole &&
        data.role !== "superadmin"
      ) {
        await firebaseSignOut(auth);
        throw new Error(
          `Access denied. You are registered as a ${data.role}, not a ${expectedRole}.`
        );
      }

      setProfile(data);

      await logActivity({
        userId: firebaseUser.uid,
        email: data.email,
        action: "Login",
        role: data.role,
        details: {
          method: identifier.includes("@") ? "email" : "phone",
          duration,
        },
      });

      return { role: data.role };
    }

    if (await isSuperAdmin(email)) {
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        namespace: APP_NAMESPACE,
        email: firebaseUser.email || "",
        fullName: "Super Admin",
        phone: "",
        role: "superadmin",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(docRef, newProfile);
      setProfile(newProfile);
      return { role: "superadmin" as UserRole };
    }

    throw new Error("Account not found. Please register first.");
  }

  // ─── prepareSignUp ───────────────────────────────────────────────────────
  // Step 1: validate uniqueness only. Nothing is written to Firebase.

  async function prepareSignUp(data: PendingSignUp): Promise<PendingSignUp> {
    const res = await fetch("/api/auth/check-exists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email, phone: data.phone }),
    });
    const checkData = await res.json();

    if (checkData.exists) {
      if (checkData.type === "email") {
        throw new Error("An account with this email address already exists.");
      } else {
        throw new Error("An account with this mobile number already exists.");
      }
    }

    return data;
  }

  // ─── completeSignUp ──────────────────────────────────────────────────────
  // Step 2: called only after successful phone OTP verification.
  // Creates the Firebase Auth user + Firestore profile + welcome email (once).

  async function completeSignUp(pending: PendingSignUp): Promise<void> {
    const { email, password, fullName, phone, role, companyDetails } = pending;

    // Guard against race-condition duplicates (re-verify just before write)
    const res = await fetch("/api/auth/check-exists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone }),
    });
    const checkData = await res.json();

    if (checkData.exists) {
      // Account was created between prepareSignUp and now — sign them in
      if (checkData.type === "email") {
        throw new Error("An account with this email address already exists.");
      } else {
        throw new Error("An account with this mobile number already exists.");
      }
    }

    // Firebase Phone Auth left a signed-in anonymous/phone user after OTP —
    // sign it out before creating the email/password account so there is no
    // credential clash.
    try {
      await firebaseSignOut(auth);
    } catch {
      // safe to ignore
    }

    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const newProfile: UserProfile = {
      uid: credential.user.uid,
      namespace: APP_NAMESPACE,
      email,
      fullName,
      phone,
      role,
      status:
        role === "admin" || role === "intern"
          ? "pending_verification"
          : "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(role === "hr" && { credits: 3 }),
      ...(companyDetails && { companyDetails }),
    };

    await setDoc(doc(db, "users", credential.user.uid), newProfile);
    setProfile(newProfile);

    await logActivity({
      userId: credential.user.uid,
      email,
      action: "Signup",
      role,
      details: { fullName, companyName: companyDetails?.name || "N/A" },
    });

    // Welcome email — sent once, right here, after successful OTP verification.
    // The role-specific templates live in app/api/send-email/route.ts.
    const roleSubjectMap: Partial<Record<UserRole, string>> = {
      guard: "Welcome to TheNST – Your Security Professional Journey Begins",
      pilot: "Welcome to TheNST – Deploy Your Aerial Capabilities",
      educator: "Welcome to TheNST – Shape the Next Generation of Security",
      hr: "Welcome to TheNST – Start Procuring Verified Security Talent",
      researcher:
        "Welcome to TheNST – Publish Your Defense Intelligence Work",
      learner: "Welcome to TheNST – Begin Your Security Learning Journey",
      admin: "Admin Account Created",
    };

    const subject =
      roleSubjectMap[role] || "Welcome to TheNST!";

    sendEmail({
      to: email,
      subject,
      template: "welcome",
      data: { fullName, role },
    }).catch((err) => console.warn("Welcome email delivery note:", err));
  }

  // ─── signOut ─────────────────────────────────────────────────────────────

  async function signOutUser() {
    if (user && profile) {
      await logActivity({
        userId: user.uid,
        email: user.email || "",
        action: "Logout",
        role: profile.role,
        details: {},
      });
    }
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
  }

  // ─── getPhoneForPasswordReset ─────────────────────────────────────────────
  // Returns the E.164 phone number stored on the account so the caller can
  // send an OTP to the right number. Throws if the account does not exist.

  async function getPhoneForPasswordReset(email: string): Promise<string> {
    const res = await fetch("/api/auth/check-exists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    if (!data.exists) {
      throw new Error(
        "No account found with this email address. Please register first."
      );
    }

    // check-exists returns email match only — fetch the profile for the phone
    const profileRes = await fetch("/api/auth/get-phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const profileData = await profileRes.json();

    if (!profileData.phone) {
      throw new Error(
        "No mobile number is linked to this account. Contact support."
      );
    }

    return profileData.phone as string;
  }

  // ─── resetPasswordWithPhone ───────────────────────────────────────────────
  // Called AFTER the OTP modal has successfully verified the phone.
  // Signs the user in by email+current... wait — we don't have the old password
  // here. Instead we use the Firebase Admin SDK via a secure API route to
  // update the password server-side after the OTP is verified client-side.

  async function resetPasswordWithPhone(
    email: string,
    newPassword: string,
    _confirmationResult: ConfirmationResult // OTP already confirmed by caller
  ): Promise<void> {
    if (newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }

    // Call the secure server-side endpoint that uses Firebase Admin SDK
    // to update the password without needing the old password.
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPassword }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || "Password reset failed. Please try again.");
    }
  }

  // ─── refreshProfile ───────────────────────────────────────────────────────

  async function fetchProfile(firebaseUser: User) {
    const docRef = doc(db, "users", firebaseUser.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as UserProfile;
      if (isAppProfile(data)) setProfile(data);
    }
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user);
  }

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        prepareSignUp,
        completeSignUp,
        signOut: signOutUser,
        getPhoneForPasswordReset,
        resetPasswordWithPhone,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
