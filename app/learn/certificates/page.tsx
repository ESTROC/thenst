"use client";

import { useRouter } from "next/navigation";
import { Award } from "lucide-react";
import { Header } from "@/components/learn/layout/Header";
import { Sidebar } from "@/components/learn/layout/Sidebar";
import { EmptyState } from "@/components/learn/ui/EmptyState";

export default function CertificatesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Certificates</h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Your earned certificates live here.</p>

          <div className="mt-8">
            <EmptyState
              icon={Award}
              title="No certificates yet"
              message="Complete a course to earn your first certificate."
              actionLabel="Browse courses"
              onAction={() => router.push("/explore")}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
