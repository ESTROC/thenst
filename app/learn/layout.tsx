/**
 * NST Learn layout — mounted at /learn
 *
 * Wraps all learn pages with:
 * - AuthProvider adapter (context/AuthContext.tsx) → bridges to thenst-main's auth (lib/auth-context)
 * - RouteGuard → enforces authentication; unauthenticated users redirected to /login?redirect=/learn
 * - ThemeProvider → light/dark theme toggle
 * - AvatarProvider → user avatar customization
 *
 * Single source of truth: thenst-main's Firebase project (thenst) via lib/auth-context.
 * NST Learn does NOT have its own login page or separate auth system.
 */
import type { Metadata } from "next";
import { Sora } from "next/font/google";
import { AvatarProvider } from "@/context/AvatarContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { RouteGuard } from "@/components/learn/route-guard";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });

export const metadata: Metadata = {
  title: "NST Learn — Learn In-Demand Security Skills",
  description: "A premium online learning platform for security professionals.",
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={sora.variable}>
      <ThemeProvider>
        <AuthProvider>
          <RouteGuard>
            <AvatarProvider>{children}</AvatarProvider>
          </RouteGuard>
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}
