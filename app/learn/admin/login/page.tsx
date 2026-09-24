/**
 * NST Learn /learn/admin/login — redirects to main thenst-main login.
 * Admin auth is handled by thenst-main (superadmin / admin roles).
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function LearnAdminLoginRedirect() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user?.role === "admin") {
      router.replace("/learn/admin");
    } else {
      router.replace("/login?redirect=/learn/admin");
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <Loader2 size={24} className="animate-spin text-sky" />
    </div>
  );
}
