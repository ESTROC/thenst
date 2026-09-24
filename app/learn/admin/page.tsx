"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Users, ShieldCheck, Plus, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getAdminCounts, getAdmins } from "@/lib/learn/admin";

interface Overview {
  courses: number;
  users: number;
  admins: number;
}

function StatCard({ icon: Icon, label, value, soft, text }: {
  icon: LucideIcon; label: string; value: string; soft: string; text: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${soft} ${text}`}>
        <Icon size={18} />
      </span>
      <p className="mt-4 font-display text-2xl font-bold leading-none text-[var(--ink)]">{value}</p>
      <p className="mt-1.5 text-sm text-[var(--ink-soft)]">{label}</p>
    </div>
  );
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setData(null);
    setError(null);
    Promise.all([getAdminCounts(), getAdmins()])
      .then(([counts, admins]) => setData({ ...counts, admins: admins.length }))
      .catch(() => setError("Could not load overview. Check your connection and Firestore rules."));
  }, []);

  useEffect(() => load(), [load]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Dashboard</h1>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">A quick look at the platform.</p>

      <div className="mt-8">
        {error ? (
          <div className="flex flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center shadow-card">
            <p className="text-sm text-[var(--ink-soft)]">{error}</p>
            <button
              onClick={load}
              className="mt-4 flex items-center gap-2 rounded-xl bg-sky px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1f7fe0]"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : data === null ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-36 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard icon={BookOpen} label="Total courses" value={String(data.courses)} soft="bg-sky-soft" text="text-sky" />
              <StatCard icon={Users} label="Total users" value={String(data.users)} soft="bg-emerald-soft" text="text-emerald" />
              <StatCard icon={ShieldCheck} label="Admins" value={String(data.admins)} soft="bg-violet-soft" text="text-violet" />
            </div>

            <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
              <p className="font-display font-bold text-[var(--ink)]">Quick actions</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => router.push("/learn/admin/courses/new")}
                  className="flex items-center gap-2 rounded-xl bg-sky px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1f7fe0]"
                >
                  <Plus size={15} /> Add course
                </button>
                <button
                  onClick={() => router.push("/learn/admin/courses")}
                  className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--bg)]"
                >
                  <BookOpen size={15} /> Manage courses
                </button>
                <button
                  onClick={() => router.push("/learn/admin/admins")}
                  className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--bg)]"
                >
                  <ShieldCheck size={15} /> Manage admins
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
