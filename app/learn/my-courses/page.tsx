"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { Header } from "@/components/learn/layout/Header";
import { Sidebar } from "@/components/learn/layout/Sidebar";
import { CourseGrid } from "@/components/learn/courses/CourseGrid";
import { CourseCardSkeleton } from "@/components/learn/ui/Skeleton";
import { EmptyState } from "@/components/learn/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { Course } from "@/lib/learn/types";
import { getCourses } from "@/lib/learn/courses";
import { getUserEnrollments } from "@/lib/learn/enrollments";

export default function MyCoursesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [enrolled, setEnrolled] = useState<Course[] | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setEnrolled([]);
      return;
    }
    let cancelled = false;
    Promise.all([getUserEnrollments(user.id), getCourses()])
      .then(([slugs, courses]) => {
        if (cancelled) return;
        const set = new Set(slugs);
        setEnrolled(courses.filter((c) => set.has(c.slug)));
      })
      .catch(() => {
        if (!cancelled) setEnrolled([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">My Courses</h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Pick up where you left off.</p>

          <div className="mt-8">
            {enrolled === null ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (<CourseCardSkeleton key={i} />))}
              </div>
            ) : enrolled.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No courses yet"
                message="Enroll in a course to start learning."
                actionLabel="Browse courses"
                onAction={() => router.push("/explore")}
              />
            ) : (
              <CourseGrid courses={enrolled} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
