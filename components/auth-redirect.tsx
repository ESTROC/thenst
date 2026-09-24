"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Suspense } from "react";

function AuthRedirectInner() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && profile) {
      // Support ?redirect=/learn or ?redirect=/learn/admin for post-login navigation
      const redirect = searchParams.get("redirect");
      if (redirect && redirect.startsWith("/")) {
        router.push(redirect);
        return;
      }
      // Default role-based redirects
      if (profile.role === "guard") router.push("/dashboard/guard");
      else if (profile.role === "hr") router.push("/dashboard/hr");
      else if (profile.role === "admin") router.push("/dashboard/admin");
      else if (profile.role === "superadmin") router.push("/dashboard/superadmin");
      else if (profile.role === "agency") router.push("/dashboard/agency");
      else if (profile.role === "intern") router.push("/dashboard/intern");
      else router.push("/");
    }
  }, [profile, loading, router, searchParams]);

  return null;
}

export function AuthRedirect() {
  return (
    <Suspense fallback={null}>
      <AuthRedirectInner />
    </Suspense>
  );
}
