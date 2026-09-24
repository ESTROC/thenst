"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Bookmark } from "lucide-react";
import { Course } from "@/lib/learn/types";
import { useAuth } from "@/context/AuthContext";
import { getBookmarks, toggleBookmark } from "@/lib/learn/bookmarks";

const levelColor: Record<Course["level"], string> = {
  Beginner: "bg-emerald-soft text-emerald",
  Intermediate: "bg-sky-soft text-sky",
  Advanced: "bg-violet-soft text-violet",
};

export function CourseCard({ course }: { course: Course }) {
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setSaved(false);
      return;
    }
    let cancelled = false;
    getBookmarks(user.id).then((slugs) => {
      if (!cancelled) setSaved(slugs.includes(course.slug));
    });
    return () => {
      cancelled = true;
    };
  }, [user, course.slug]);

  function onBookmark(e: React.MouseEvent) {
    e.stopPropagation();
    if (!user) {
      router.push("/learn/login");
      return;
    }
    const optimistic = !saved;
    setSaved(optimistic);
    toggleBookmark(user.id, course.slug)
      .then((actual) => setSaved(actual))
      .catch(() => setSaved(!optimistic));
  }

  return (
    <motion.article
      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      onClick={() => router.push(`/learn/courses/${course.slug}`)}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-card transition-shadow hover:shadow-hover"
    >
      <div className="relative h-32 overflow-hidden" style={{ background: course.thumbnailColor }}>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 to-black/20" />
        <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-0.5 text-xs font-semibold text-navy-500">{course.category}</span>
        <button
          onClick={onBookmark}
          aria-label={saved ? "Remove bookmark" : "Add bookmark"}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-navy-500 transition-colors hover:bg-white"
        >
          <Bookmark size={15} fill={saved ? "#F5A623" : "none"} color={saved ? "#F5A623" : "currentColor"} />
        </button>
        <span className="absolute bottom-3 left-3 font-display text-2xl font-bold text-white/95">{course.title.split(" ").slice(0, 2).map((w) => w[0]).join("")}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between">
          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${levelColor[course.level]}`}>{course.level}</span>
          <span className="flex items-center gap-1 rounded-md bg-amber-soft px-2 py-0.5 text-xs font-semibold text-amber">
            <Sparkles size={12} /> New course
          </span>
        </div>
        <h3 className="mt-2 font-display text-base font-semibold leading-snug text-[var(--ink)]">{course.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-[var(--ink-soft)]">{course.description}</p>
        <p className="mt-2 text-xs text-[var(--ink-soft)]">Instructor: {course.instructor || "TBA"}</p>
        <div className="mt-3 flex items-center gap-4 text-xs text-[var(--ink-soft)]">
          <span>Duration: —</span>
          <span>Lessons: coming soon</span>
        </div>
        <div className="mt-auto pt-4">
          <span className="block w-full rounded-lg bg-sky px-3 py-2.5 text-center text-sm font-semibold text-white transition-colors group-hover:bg-[#1f7fe0]">
            View course &amp; pricing
          </span>
        </div>
      </div>
    </motion.article>
  );
}
