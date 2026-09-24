"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, PlayCircle, Lock, Check, ChevronDown, Award, BookOpen, Sparkles,
} from "lucide-react";
import { Sidebar } from "@/components/learn/layout/Sidebar";
import { Header } from "@/components/learn/layout/Header";
import { CoursePricingModal } from "@/components/learn/courses/CoursePricingModal";
import { getCourseDetail } from "@/lib/learn/courses";
import { CourseDetail } from "@/lib/learn/types";
import { VideoPlayer } from "@/components/learn/video/VideoPlayer";
import { INTRO_VIDEO_SRC } from "@/lib/learn/video-config";

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCourseDetail(slug).then((c) => { setCourse(c); setLoading(false); });
  }, [slug]);
  const [showPricing, setShowPricing] = useState(false);
  const [openModule, setOpenModule] = useState<string | null>("m1");

  if (loading) return null;
  if (!course) {
    return (
      <div className="min-h-screen">
        <Sidebar />
        <div className="lg:pl-64">
          <Header />
          <main className="mx-auto max-w-3xl px-4 py-20 text-center">
            <p className="text-[var(--ink-soft)]">Course not found.</p>
            <button onClick={() => router.push("/")} className="mt-4 rounded-lg bg-sky px-4 py-2 text-sm font-semibold text-white">Back to dashboard</button>
          </main>
        </div>
      </div>
    );
  }

  const totalLessons = course.modules.reduce((n, m) => n + m.lessons.length, 0);

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />

        {/* hero */}
        <div className="text-white" style={{ backgroundImage: `linear-gradient(135deg, ${course.thumbnailColor} 0%, #0A2540 100%)` }}>
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <button onClick={() => router.push("/")} className="mb-5 inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white">
              <ArrowLeft size={15} /> Back to courses
            </button>
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-semibold ring-1 ring-white/25">{course.category}</span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-xs font-semibold ring-1 ring-white/25"><Sparkles size={12} /> New course</span>
                </div>
                <h1 className="mt-3 font-display text-3xl font-bold leading-tight">{course.title}</h1>
                <p className="mt-2 max-w-2xl text-white/85">{course.longDescription}</p>
                <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-white/90">
                  <span className="flex items-center gap-1.5"><BookOpen size={15} /> {totalLessons} lessons</span>
                  <span className="rounded-md bg-white/15 px-2 py-0.5 text-xs font-semibold">{course.level}</span>
                  <span>Duration: —</span>
                </div>
                <p className="mt-3 text-sm text-white/80">Instructor: {course.instructor || "TBA"}</p>
              </div>
              <div className="lg:col-span-1">
                <div className="rounded-2xl bg-white p-5 text-navy-500 shadow-hover">
                  <p className="font-display text-lg font-bold">Ready to start?</p>
                  <p className="mt-1 text-sm text-[#5B6B7E]">Choose a plan that fits you — students, startups, or enterprise.</p>
                  <button onClick={() => setShowPricing(true)} className="mt-4 w-full rounded-xl bg-sky py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1f7fe0]">
                    Enroll now
                  </button>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-[#5B6B7E]"><Award size={13} className="text-emerald" /> Certificate of completion included</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {/* course preview video */}
          <section className="mb-10">
            <h2 className="mb-4 font-display text-xl font-bold text-[var(--ink)]">Course preview</h2>
            <div className="mx-auto max-w-3xl">
              <VideoPlayer src={INTRO_VIDEO_SRC} />
              <p className="mt-2 text-center text-xs text-[var(--ink-soft)]">A quick introduction to what this course covers.</p>
            </div>
          </section>

          <div className="grid gap-10 lg:grid-cols-3">
            <div className="space-y-10 lg:col-span-2">
              {/* outcomes */}
              <section>
                <h2 className="font-display text-xl font-bold text-[var(--ink)]">What you&apos;ll learn</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {course.outcomes.map((o) => (
                    <div key={o} className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--ink)]">
                      <Check size={16} className="mt-0.5 shrink-0 text-emerald" /> {o}
                    </div>
                  ))}
                </div>
              </section>

              {/* curriculum */}
              <section>
                <h2 className="font-display text-xl font-bold text-[var(--ink)]">Curriculum</h2>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">{course.modules.length} modules · {totalLessons} lessons</p>
                <div className="mt-4 space-y-3">
                  {course.modules.map((m) => {
                    const open = openModule === m.id;
                    return (
                      <div key={m.id} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                        <button onClick={() => setOpenModule(open ? null : m.id)} className="flex w-full items-center justify-between px-5 py-4 text-left">
                          <span className="font-semibold text-[var(--ink)]">{m.title}</span>
                          <span className="flex items-center gap-3 text-xs text-[var(--ink-soft)]">
                            {m.lessons.length} lessons
                            <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
                          </span>
                        </button>
                        {open && (
                          <div className="border-t border-[var(--border)]">
                            {m.lessons.map((l) => (
                              <button
                                key={l.id}
                                onClick={() => router.push(`/learn/courses/${course.slug}/learn?lesson=${l.id}`)}
                                className="flex w-full items-center justify-between px-5 py-3 text-left text-sm hover:bg-[var(--bg)]"
                              >
                                <span className="flex items-center gap-2.5 text-[var(--ink)]">
                                  {l.preview ? <PlayCircle size={16} className="text-sky" /> : <Lock size={15} className="text-[var(--ink-soft)]" />}
                                  {l.title}
                                  {l.preview && <span className="rounded bg-sky-soft px-1.5 py-0.5 text-xs font-semibold text-sky">Preview</span>}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* prerequisites */}
              <section>
                <h2 className="font-display text-xl font-bold text-[var(--ink)]">Prerequisites</h2>
                <ul className="mt-3 space-y-2">
                  {course.prerequisites.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-[var(--ink)]"><Check size={15} className="mt-0.5 shrink-0 text-sky" /> {p}</li>
                  ))}
                </ul>
              </section>

              {/* reviews — only shown when real reviews exist */}
              {course.reviewList.length > 0 && (
                <section>
                  <h2 className="font-display text-xl font-bold text-[var(--ink)]">Student reviews</h2>
                  <div className="mt-4 space-y-3">
                    {course.reviewList.map((r) => (
                      <div key={r.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                        <p className="font-semibold text-[var(--ink)]">{r.name}</p>
                        <p className="mt-1.5 text-sm text-[var(--ink-soft)]">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* faq */}
              <section>
                <h2 className="font-display text-xl font-bold text-[var(--ink)]">FAQ</h2>
                <div className="mt-4 space-y-3">
                  {course.faqs.map((f) => (
                    <div key={f.q} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                      <p className="font-semibold text-[var(--ink)]">{f.q}</p>
                      <p className="mt-1 text-sm text-[var(--ink-soft)]">{f.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* sticky sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
                  <p className="font-display font-bold text-[var(--ink)]">This course includes</p>
                  <ul className="mt-3 space-y-2 text-sm text-[var(--ink-soft)]">
                    <li className="flex items-center gap-2"><PlayCircle size={15} className="text-sky" /> {totalLessons} on-demand lessons</li>
                    <li className="flex items-center gap-2"><Award size={15} className="text-emerald" /> Certificate of completion</li>
                    <li className="flex items-center gap-2"><BookOpen size={15} className="text-violet" /> Hands-on project</li>
                  </ul>
                  <button onClick={() => setShowPricing(true)} className="mt-4 w-full rounded-xl bg-sky py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1f7fe0]">Enroll now</button>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>

      <CoursePricingModal course={showPricing ? course : null} onClose={() => setShowPricing(false)} />
    </div>
  );
}
