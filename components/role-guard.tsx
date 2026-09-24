"use client";

import React from "react"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/lib/types";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !profile) {
      router.push("/");
    } else if (!loading && profile && !allowedRoles.includes(profile.role)) {
      // Redirect to appropriate dashboard
      switch (profile.role) {
        case "guard":
          router.push("/dashboard/guard");
          break;
        case "hr":
          router.push("/dashboard/hr");
          break;
        case "admin":
          router.push("/dashboard/admin");
          break;
        case "superadmin":
          router.push("/dashboard/superadmin");
          break;
        case "agency":
          router.push("/dashboard/agency");
          break;
        case "intern":
          router.push("/dashboard/intern");
          break;
        default:
          router.push("/");
      }
    }
  }, [loading, profile, allowedRoles, router]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Shield className="h-10 w-10 animate-pulse text-primary" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    return null;
  }

  return <>{children}</>;
}
