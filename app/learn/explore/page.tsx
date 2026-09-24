"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/learn/layout/Header";
import { Sidebar } from "@/components/learn/layout/Sidebar";
import { CourseGrid } from "@/components/learn/courses/CourseGrid";
import { CourseCardSkeleton } from "@/components/learn/ui/Skeleton";
import { Course } from "@/lib/learn/types";
import { getCourses } from "@/lib/learn/courses";

export default function ExplorePage() {
  const [courses, setCourses] = useState<Course[] | null>(null);

  useEffect(() => {
    getCourses().then(setCourses).catch(() => setCourses([]));
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Course[]>();
    for (const c of courses ?? []) {
      const list = map.get(c.category) ?? [];
      list.push(c);
      map.set(c.category, list);
    }
    return Array.from(map.entries());
  }, [courses]);

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Explore</h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Browse every course, organised by domain.</p>

          {courses === null ? (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (<CourseCardSkeleton key={i} />))}
            </div>
          ) : grouped.length === 0 ? (
            <p className="py-16 text-center text-[var(--ink-soft)]">No courses available yet. Check back soon.</p>
          ) : (
            <div className="mt-8 space-y-10">
              {grouped.map(([category, list]) => (
                <section key={category}>
                  <div className="mb-5 flex items-baseline gap-2">
                    <h2 className="font-display text-xl font-bold text-[var(--ink)]">{category}</h2>
                    <span className="text-sm text-[var(--ink-soft)]">{list.length} {list.length === 1 ? "course" : "courses"}</span>
                  </div>
                  <CourseGrid courses={list} />
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
