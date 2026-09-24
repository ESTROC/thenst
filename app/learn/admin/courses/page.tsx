"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Pencil, Plus, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/learn/ui/EmptyState";
import { Course } from "@/lib/learn/types";
import { getCourses } from "@/lib/learn/courses";

export default function AdminCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setCourses(null);
    setError(null);
    getCourses()
      .then((list) => setCourses([...list].sort((a, b) => a.title.localeCompare(b.title))))
      .catch(() => setError("Could not load courses."));
  }, []);

  useEffect(() => load(), [load]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Courses</h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Create and edit course content.</p>
        </div>
        <button
          onClick={() => router.push("/learn/admin/courses/new")}
          className="flex items-center gap-2 rounded-xl bg-sky px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1f7fe0]"
        >
          <Plus size={15} /> Add course
        </button>
      </div>

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
        ) : courses === null ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-2xl" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No courses yet"
            message="Create your first course to get started."
            actionLabel="Add course"
            onAction={() => router.push("/learn/admin/courses/new")}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-card">
            {courses.map((c, i) => (
              <div
                key={c.id}
                className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? "border-t border-[var(--border)]" : ""}`}
              >
                <span
                  className="hidden h-10 w-10 shrink-0 rounded-xl sm:block"
                  style={{ background: c.thumbnailColor }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[var(--ink)]">{c.title}</p>
                  <p className="truncate text-xs text-[var(--ink-soft)]">/{c.slug}</p>
                </div>
                <span className="hidden shrink-0 rounded-md bg-sky-soft px-2 py-0.5 text-xs font-semibold text-sky sm:block">
                  {c.category}
                </span>
                <span className="hidden shrink-0 text-xs text-[var(--ink-soft)] md:block">{c.level}</span>
                <button
                  onClick={() => router.push(`/admin/courses/${c.slug}`)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--bg)]"
                >
                  <Pencil size={13} /> Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
