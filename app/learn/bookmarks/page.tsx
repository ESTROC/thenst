"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { Header } from "@/components/learn/layout/Header";
import { Sidebar } from "@/components/learn/layout/Sidebar";
import { CourseGrid } from "@/components/learn/courses/CourseGrid";
import { CourseCardSkeleton } from "@/components/learn/ui/Skeleton";
import { EmptyState } from "@/components/learn/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { Course } from "@/lib/learn/types";
import { getCourses } from "@/lib/learn/courses";
import { getBookmarks } from "@/lib/learn/bookmarks";

export default function BookmarksPage() {
  const { user, loading: authLoading } = useAuth();
  const [bookmarked, setBookmarked] = useState<Course[] | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setBookmarked([]);
      return;
    }
    let cancelled = false;
    Promise.all([getBookmarks(user.id), getCourses()])
      .then(([slugs, courses]) => {
        if (cancelled) return;
        const set = new Set(slugs);
        setBookmarked(courses.filter((c) => set.has(c.slug)));
      })
      .catch(() => {
        if (!cancelled) setBookmarked([]);
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
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Bookmarks</h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Courses you saved for later.</p>

          <div className="mt-8">
            {bookmarked === null ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (<CourseCardSkeleton key={i} />))}
              </div>
            ) : bookmarked.length === 0 ? (
              <EmptyState
                icon={Bookmark}
                title="No bookmarks yet"
                message="Bookmark courses to save them here."
              />
            ) : (
              <CourseGrid courses={bookmarked} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
