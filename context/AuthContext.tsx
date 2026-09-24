/**
 * NST Learn AuthContext — bridges the learn platform to thenst-main's auth system.
 * 
 * NST Learn expects: { user: AuthUser | null, loading, login, register, loginWithGoogle, logout }
 * thenst-main provides:  { user, profile, loading, signIn, signUp, signOut, resetPassword }
 *
 * We adapt thenst-main's profile into the AuthUser shape that NST Learn expects.
 * Auth state comes from a SINGLE Firebase project (thenst) — nst-learn's own Firebase
 * config is no longer used.
 */
"use client";

import {
  createContext, useContext, ReactNode,
} from "react";
import { useAuth as useMainAuth } from "@/lib/auth-context";
import { AuthUser } from "@/lib/learn/auth-types";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const main = useMainAuth();

  // Map thenst-main UserProfile → NST Learn AuthUser
  const adaptedUser: AuthUser | null = main.profile
    ? {
        id: main.profile.uid,
        full_name: main.profile.fullName,
        email: main.profile.email,
        // Superadmin and admin map to "admin" in learn; everyone else is "student"
        role: (main.profile.role === "superadmin" || main.profile.role === "admin")
          ? "admin"
          : "student",
        auth_provider: "local",
        created_at: main.profile.createdAt,
      }
    : null;

  const login = async (email: string, password: string) => {
    await main.signIn(email, password);
  };

  const register = async (_fullName: string, _email: string, _password: string) => {
    // NST Learn registration requires phone OTP verification.
    // Redirect to the main onboarding flow which handles the full signup + OTP step.
    window.location.href = "/sign-in?mode=onboarding&redirect=/platform";
  };

  const loginWithGoogle = async () => {
    // thenst-main doesn't expose Google login — redirect to main login
    window.location.href = "/login?redirect=/learn";
  };

  const logout = async () => {
    await main.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user: adaptedUser,
        loading: main.loading,
        login,
        register,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
