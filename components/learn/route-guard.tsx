/**
 * RouteGuard — protects NST Learn routes.
 * If user is not authenticated, redirects to /login?redirect=/learn
 * Uses the unified AuthContext (thenst-main auth).
 */
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

const PUBLIC_LEARN_ROUTES = [
  "/learn",
  "/learn/explore",
];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Check if current route is public
  const isPublicRoute = 
    PUBLIC_LEARN_ROUTES.includes(pathname) ||
    (pathname.startsWith("/learn/courses/") && !pathname.endsWith("/learn")) ||
    (pathname.startsWith("/learn/") && !pathname.includes("/admin") && !pathname.includes("/my-courses") && !pathname.includes("/bookmarks") && !pathname.includes("/certificates") && !pathname.includes("/analytics") && !pathname.includes("/settings") && !pathname.endsWith("/learn"));

  useEffect(() => {
    if (loading || isPublicRoute) return;
    if (!user) {
      // Private route and not authenticated — redirect to unified sign-in
      router.replace(`/sign-in?redirect=${pathname}`);
    }
  }, [user, loading, router, pathname, isPublicRoute]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Show loading while checking auth for private routes
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <Loader2 size={24} className="animate-spin text-sky" />
      </div>
    );
  }

  // Not authenticated on protected route — don't render anything
  if (!user) {
    return null;
  }

  // Authenticated — render the route
  return <>{children}</>;
}
