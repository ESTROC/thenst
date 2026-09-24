"use client";

import React, { useEffect, useState } from "react"

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { DashboardShell } from "@/components/dashboard-shell";
import { Shield, AlertCircle, Info, CheckCircle2, AlertTriangle, Construction, Clock } from "lucide-react";
import { getSystemConfig } from "@/lib/firestore";
import type { SystemConfig } from "@/lib/types";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<SystemConfig | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const data = await getSystemConfig();
        setConfig(data);
      } catch (error) {
        console.error("Failed to load system config");
      }
    }
    fetchConfig();
  }, []);

  useEffect(() => {
    if (!loading && !profile) {
      router.push("/");
    }
  }, [loading, profile, router]);

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Shield className="h-10 w-10 animate-pulse text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Admin & Intern Verification check
  if ((profile.role === "admin" || profile.role === "intern") && profile.status === "pending_verification") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <div className="h-20 w-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
          <Clock className="h-10 w-10 text-blue-500 animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold mb-4 tracking-tight text-foreground">Account Under Review</h1>
        <p className="text-muted-foreground max-w-md text-lg leading-relaxed">
          Hello {profile.fullName}, your {profile.role === "admin" ? "Admin" : "Intern"} account has been registered successfully.
          To maintain platform security, all {profile.role === "admin" ? "Admin" : "Intern"} accounts must be manually verified by a Superadmin or Admin.
        </p>
        <p className="mt-4 text-primary font-medium">We'll notify you once your access is granted.</p>
      </div>
    );
  }

  // Maintenance Mode check (Superadmins can still access)
  if (config?.maintenanceMode && profile.role !== "superadmin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <div className="h-20 w-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
          <Construction className="h-10 w-10 text-amber-500" />
        </div>
        <h1 className="text-4xl font-bold mb-4 tracking-tight text-foreground">Down for Maintenance</h1>
        <p className="text-muted-foreground max-w-md text-lg leading-relaxed">
          We're currently performing scheduled system updates to improve your experience.
          Please check back shortly.
        </p>
      </div>
    );
  }

  return (
    <DashboardShell>
      {config?.globalBanner?.active && (
        <div className={`mb-6 p-4 rounded-2xl border-2 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 ${config.globalBanner.type === 'info' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' :
          config.globalBanner.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
            'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
          }`}>
          <div className="p-2 rounded-xl bg-background/50 backdrop-blur-sm">
            {config.globalBanner.type === 'info' && <Info className="h-5 w-5" />}
            {config.globalBanner.type === 'warning' && <AlertTriangle className="h-5 w-5" />}
            {config.globalBanner.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
          </div>
          <p className="font-semibold text-sm md:text-base">{config.globalBanner.message}</p>
        </div>
      )}
      {children}
    </DashboardShell>
  );
}

