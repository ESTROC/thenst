"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, BookOpen, CheckCircle2, Clock3, Flame } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Header } from "@/components/learn/layout/Header";
import { Sidebar } from "@/components/learn/layout/Sidebar";
import { EmptyState } from "@/components/learn/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { getUserEnrollments } from "@/lib/learn/enrollments";
import { emptyStats, formatHours } from "@/lib/learn/stats";

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

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [enrolledSlugs, setEnrolledSlugs] = useState<string[] | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setEnrolledSlugs([]);
      return;
    }
    let cancelled = false;
    getUserEnrollments(user.id).then((slugs) => {
      if (!cancelled) setEnrolledSlugs(slugs);
    });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  // Real values will come from the backend later; enrollment count is live,
  // everything else starts at zero (no fake data).
  const stats = { ...emptyStats, coursesInProgress: enrolledSlugs?.length ?? 0 };

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Analytics</h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Track your learning progress over time.</p>

          <div className="mt-8">
            {enrolledSlugs === null ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-36 rounded-2xl" />
                ))}
              </div>
            ) : enrolledSlugs.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="Begin your learning journey"
                message="Enroll in a course to unlock your analytics and track your growth."
                actionLabel="Browse courses"
                onAction={() => router.push("/explore")}
              />
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard icon={BookOpen} label="Courses in progress" value={String(stats.coursesInProgress)} soft="bg-sky-soft" text="text-sky" />
                  <StatCard icon={CheckCircle2} label="Lessons completed" value="0" soft="bg-emerald-soft" text="text-emerald" />
                  <StatCard icon={Clock3} label="Hours learned" value={formatHours(stats.hoursLearned)} soft="bg-violet-soft" text="text-violet" />
                  <StatCard icon={Flame} label="Day streak" value={String(stats.dayStreak)} soft="bg-amber-soft" text="text-amber" />
                </div>
                <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
                  <p className="font-display font-bold text-[var(--ink)]">Weekly activity</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    Detailed charts will appear here as you complete lessons.
                  </p>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
