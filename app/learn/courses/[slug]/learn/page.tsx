"use client";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/context/AuthContext";
import { isDev } from "@/lib/learn/dev";
import { useState, useMemo, useEffect, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft, PlayCircle, CheckCircle2, Circle, Film, Lock,
} from "lucide-react";
import { getCourseDetail } from "@/lib/learn/courses";
import { CourseDetail } from "@/lib/learn/types";

function LearnInner() {
  const { slug } = useParams<{ slug: string }>();
  const params = useSearchParams();
  const router = useRouter();
 const [course, setCourse] = useState<CourseDetail | null>(null);

  useEffect(() => {
    getCourseDetail(slug).then(setCourse);
  }, [slug]);

  const allLessons = useMemo(
    () => course?.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleTitle: m.title }))) ?? [],
    [course],
  );

  const initial = params.get("lesson") || allLessons[0]?.id;
  const [activeId, setActiveId] = useState<string | undefined>(initial);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  if (!course) {
    return <div className="flex min-h-screen items-center justify-center text-[var(--ink-soft)]">Course not found.</div>;
  }

  const active = allLessons.find((l) => l.id === activeId) ?? allLessons[0];
  const progress = Math.round((completed.size / allLessons.length) * 100);
  const canView = isDev(user?.id);

  function toggleComplete(id: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-navy-700 lg:flex-row">
      {/* main player */}
      <div className="flex-1">
        <div className="flex items-center justify-between px-5 py-4">
          <button onClick={() => router.push(`/learn/courses/${slug}`)} className="inline-flex items-center gap-1.5 text-sm text-navy-100 hover:text-white">
            <ArrowLeft size={15} /> Back to course
          </button>
          <span className="text-sm text-navy-200">{progress}% complete</span>
        </div>

        {/* video placeholder */}
        <div className="mx-5 overflow-hidden rounded-2xl bg-navy-900">
          <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-navy-800 to-navy-900">
            <div className="text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white">
                <Film size={28} />
              </span>
              <p className="mt-4 font-display text-lg font-semibold text-white">Lesson video coming soon</p>
              <p className="mt-1 text-sm text-navy-200">Video lectures will appear here once added by the instructor.</p>
            </div>
          </div>
        </div>

        {active.content && (
          <div className="mx-5 mt-5 rounded-2xl border border-white/10 bg-navy-800 p-6">
            {canView ? (
              <article className="prose prose-invert max-w-none prose-headings:font-display prose-headings:text-white prose-p:text-navy-100 prose-li:text-navy-100 prose-strong:text-white prose-code:text-sky">
                <ReactMarkdown>{active.content}</ReactMarkdown>
              </article>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-navy-200">
                  <Lock size={22} />
                </span>
                <p className="font-display font-semibold text-white">Content locked</p>
                <p className="text-sm text-navy-200">Enroll in this course to access lesson content.</p>
              </div>
            )}
          </div>
        )}

        <div className="px-5 py-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky">{active.moduleTitle}</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white">{active.title}</h1>

          <button
            onClick={() => toggleComplete(active.id)}
            className={`mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              completed.has(active.id)
                ? "bg-emerald text-white"
                : "bg-sky text-white hover:bg-[#1f7fe0]"
            }`}
          >
            {completed.has(active.id) ? <><CheckCircle2 size={16} /> Completed</> : <><Circle size={16} /> Mark as complete</>}
          </button>
        </div>
      </div>

      {/* lesson list */}
      <aside className="w-full border-t border-white/10 bg-navy-800 lg:w-80 lg:border-l lg:border-t-0">
        <div className="px-5 py-4">
          <p className="font-display font-bold text-white">{course.title}</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-emerald transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-navy-200">{completed.size} of {allLessons.length} lessons done</p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto pb-4">
          {course.modules.map((m) => (
            <div key={m.id}>
              <p className="px-5 py-2 text-xs font-semibold uppercase tracking-wide text-navy-200">{m.title}</p>
              {m.lessons.map((l) => {
                const isActive = l.id === active.id;
                const isDone = completed.has(l.id);
                return (
                  <button
                    key={l.id}
                    onClick={() => setActiveId(l.id)}
                    className={`flex w-full items-center gap-2.5 px-5 py-2.5 text-left text-sm transition-colors ${
                      isActive ? "bg-white/10 text-white" : "text-navy-100 hover:bg-white/5"
                    }`}
                  >
                    {isDone ? <CheckCircle2 size={16} className="shrink-0 text-emerald" /> : <PlayCircle size={16} className="shrink-0 text-navy-200" />}
                    <span className="flex-1">{l.title}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={null}>
      <LearnInner />
    </Suspense>
  );
}
