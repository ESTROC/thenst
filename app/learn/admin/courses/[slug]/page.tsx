"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Check, ChevronDown, GripVertical, Loader2, Plus, RefreshCw, Save, Trash2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/learn/admin/ConfirmDialog";
import { Course, Lesson, Module } from "@/lib/learn/types";
import { getCourseDetail } from "@/lib/learn/courses";
import { updateCourse, CourseDoc } from "@/lib/learn/admin";

const LEVELS: Course["level"][] = ["Beginner", "Intermediate", "Advanced"];

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function toLines(s: string): string[] {
  return s.split("\n").map((l) => l.trim()).filter(Boolean);
}

const TIERS = [
  { key: "students", label: "Students" },
  { key: "msmes", label: "MSMEs" },
  { key: "enterprise", label: "Enterprise" },
] as const;

function toWhole(v: string | number): number {
  return Math.max(0, Math.round(Number(v) || 0));
}

type ConfirmTarget =
  | { kind: "module"; moduleId: string; title: string }
  | { kind: "lesson"; moduleId: string; lessonId: string; title: string };

const inputCls =
  "mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-soft)] focus:border-sky";

function Field({ label, hint, value, onChange, placeholder }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[var(--ink)]">{label}</span>
      {hint && <span className="ml-2 text-xs text-[var(--ink-soft)]">{hint}</span>}
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </label>
  );
}

function TextArea({ label, hint, value, onChange, rows, placeholder, mono }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void;
  rows: number; placeholder?: string; mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[var(--ink)]">{label}</span>
      {hint && <span className="ml-2 text-xs text-[var(--ink-soft)]">{hint}</span>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`${inputCls} ${mono ? "font-mono text-xs leading-relaxed" : ""}`}
      />
    </label>
  );
}

function Section({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
      <p className="font-display font-bold text-[var(--ink)]">{title}</p>
      {subtitle && <p className="mt-0.5 text-xs text-[var(--ink-soft)]">{subtitle}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export default function EditCoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [draft, setDraft] = useState<CourseDoc | null>(null);
  const [outcomesText, setOutcomesText] = useState("");
  const [prereqText, setPrereqText] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [openLessons, setOpenLessons] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<ConfirmTarget | null>(null);

  const load = useCallback(() => {
    setDraft(null);
    setLoadError(null);
    setNotFound(false);
    getCourseDetail(slug)
      .then((c) => {
        if (!c) { setNotFound(true); return; }
        const { id: _id, ...docData } = c;
        // Older docs may predate the pricing fields; undefined would be rejected by updateDoc.
        const tp = docData.tierPricing;
        setDraft({
          ...docData,
          instructor: typeof docData.instructor === "string" ? docData.instructor : "",
          price: Number.isFinite(docData.price) ? docData.price : 0,
          tierPricing: {
            students: tp && Number.isFinite(tp.students) ? tp.students : 0,
            msmes: tp && Number.isFinite(tp.msmes) ? tp.msmes : 0,
            enterprise: tp && Number.isFinite(tp.enterprise) ? tp.enterprise : 0,
          },
        });
        setOutcomesText(c.outcomes.join("\n"));
        setPrereqText(c.prerequisites.join("\n"));
        setDirty(false);
      })
      .catch(() => setLoadError("Could not load the course."));
  }, [slug]);

  useEffect(() => load(), [load]);

  // Guard against losing unsaved edits on tab close / refresh.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function patch(p: Partial<CourseDoc>) {
    setDraft((d) => (d ? { ...d, ...p } : d));
    setDirty(true);
    setSavedFlash(false);
  }

  function patchModule(moduleId: string, p: Partial<Module>) {
    setDraft((d) =>
      d ? { ...d, modules: d.modules.map((m) => (m.id === moduleId ? { ...m, ...p } : m)) } : d,
    );
    setDirty(true);
    setSavedFlash(false);
  }

  function patchLesson(moduleId: string, lessonId: string, p: Partial<Lesson>) {
    setDraft((d) =>
      d
        ? {
            ...d,
            modules: d.modules.map((m) =>
              m.id === moduleId
                ? { ...m, lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, ...p } : l)) }
                : m,
            ),
          }
        : d,
    );
    setDirty(true);
    setSavedFlash(false);
  }

  function addModule() {
    const id = makeId("m");
    patch({ modules: [...(draft?.modules ?? []), { id, title: "New module", lessons: [] }] });
  }

  function addLesson(moduleId: string) {
    if (!draft) return;
    const id = makeId("l");
    patchModule(moduleId, {
      lessons: [
        ...(draft.modules.find((m) => m.id === moduleId)?.lessons ?? []),
        { id, title: "New lesson", durationMin: 0, preview: false, videoUrl: "", content: "" },
      ],
    });
    setOpenLessons((s) => new Set(s).add(id));
  }

  function removeConfirmed() {
    if (!confirm || !draft) return;
    if (confirm.kind === "module") {
      patch({ modules: draft.modules.filter((m) => m.id !== confirm.moduleId) });
    } else {
      const target = draft.modules.find((m) => m.id === confirm.moduleId);
      if (target) {
        patchModule(confirm.moduleId, {
          lessons: target.lessons.filter((l) => l.id !== confirm.lessonId),
        });
      }
    }
    setConfirm(null);
  }

  function toggleLesson(id: string) {
    setOpenLessons((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateCourse(slug, {
        ...draft,
        outcomes: toLines(outcomesText),
        prerequisites: toLines(prereqText),
      });
      setDirty(false);
      setSavedFlash(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loadError || notFound) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-[var(--ink-soft)]">{notFound ? "Course not found." : loadError}</p>
        <div className="mt-4 flex justify-center gap-3">
          {!notFound && (
            <button onClick={load} className="flex items-center gap-2 rounded-xl bg-sky px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1f7fe0]">
              <RefreshCw size={14} /> Retry
            </button>
          )}
          <button onClick={() => router.push("/learn/admin/courses")} className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--bg)]">
            Back to courses
          </button>
        </div>
      </main>
    );
  }

  if (!draft) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="skeleton h-48 rounded-2xl" />))}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 pb-28 sm:px-6 lg:px-8">
      <button
        onClick={() => router.push("/learn/admin/courses")}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]"
      >
        <ArrowLeft size={15} /> Back to courses
      </button>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-[var(--ink)]">{draft.title || "Untitled course"}</h1>
        <span className="rounded-md bg-sky-soft px-2 py-0.5 text-xs font-semibold text-sky">/{slug}</span>
      </div>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">Changes are saved to Firestore when you press Save.</p>

      <div className="mt-8 space-y-6">
        <Section title="Course details">
          <Field label="Title" value={draft.title} onChange={(v) => patch({ title: v })} />
          <Field
            label="Instructor"
            hint='use "TBA" if not decided yet'
            value={draft.instructor}
            onChange={(v) => patch({ instructor: v })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" value={draft.category} onChange={(v) => patch({ category: v })} />
            <label className="block">
              <span className="text-sm font-semibold text-[var(--ink)]">Level</span>
              <select
                value={draft.level}
                onChange={(e) => patch({ level: e.target.value as Course["level"] })}
                className={inputCls}
              >
                {LEVELS.map((l) => (<option key={l} value={l}>{l}</option>))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-[var(--ink)]">Price (₹)</span>
              <span className="ml-2 text-xs text-[var(--ink-soft)]">whole rupees — 0 means free</span>
              <input
                type="number"
                min={0}
                step={1}
                value={Number.isFinite(draft.price) ? draft.price : 0}
                onChange={(e) => patch({ price: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
                className={inputCls}
              />
            </label>
          </div>
          <div>
            <span className="text-sm font-semibold text-[var(--ink)]">Tier pricing (₹)</span>
            <span className="ml-2 text-xs text-[var(--ink-soft)]">per-audience pricing — 0 means free</span>
            <div className="mt-1.5 grid gap-4 sm:grid-cols-3">
              {TIERS.map((t) => (
                <label key={t.key} className="block">
                  <span className="text-xs font-semibold text-[var(--ink)]">{t.label}</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={draft.tierPricing?.[t.key] ?? 0}
                    onChange={(e) =>
                      patch({
                        tierPricing: {
                          students: 0,
                          msmes: 0,
                          enterprise: 0,
                          ...draft.tierPricing,
                          [t.key]: toWhole(e.target.value),
                        },
                      })
                    }
                    className={inputCls}
                  />
                </label>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-sm font-semibold text-[var(--ink)]">Thumbnail colour</span>
            <span className="mt-1.5 flex items-center gap-3">
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(draft.thumbnailColor) ? draft.thumbnailColor : "#2D9CDB"}
                onChange={(e) => patch({ thumbnailColor: e.target.value })}
                aria-label="Thumbnail colour picker"
                className="h-10 w-14 cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg)]"
              />
              <input
                value={draft.thumbnailColor}
                onChange={(e) => patch({ thumbnailColor: e.target.value })}
                className="w-32 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-sky"
              />
            </span>
          </label>
          <TextArea label="Short description" hint="shown on cards" rows={2} value={draft.description} onChange={(v) => patch({ description: v })} />
          <TextArea label="Long description" hint="shown on the course page" rows={4} value={draft.longDescription} onChange={(v) => patch({ longDescription: v })} />
          <Field label="Certification" value={draft.certification} onChange={(v) => patch({ certification: v })} />
        </Section>

        <Section title="Outcomes & prerequisites" subtitle="One item per line.">
          <TextArea label="What students will learn" rows={4} value={outcomesText} onChange={(v) => { setOutcomesText(v); setDirty(true); setSavedFlash(false); }} />
          <TextArea label="Prerequisites" rows={3} value={prereqText} onChange={(v) => { setPrereqText(v); setDirty(true); setSavedFlash(false); }} />
        </Section>

        <Section title="FAQ">
          {draft.faqs.length === 0 && (
            <p className="text-sm text-[var(--ink-soft)]">No FAQs yet.</p>
          )}
          {draft.faqs.map((f, i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-3">
                  <input
                    value={f.q}
                    placeholder="Question"
                    onChange={(e) => patch({ faqs: draft.faqs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)) })}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--ink)] outline-none placeholder:text-[var(--ink-soft)] focus:border-sky"
                  />
                  <textarea
                    value={f.a}
                    placeholder="Answer"
                    rows={2}
                    onChange={(e) => patch({ faqs: draft.faqs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) })}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-soft)] focus:border-sky"
                  />
                </div>
                <button
                  onClick={() => patch({ faqs: draft.faqs.filter((_, j) => j !== i) })}
                  aria-label="Remove FAQ"
                  className="rounded-lg p-2 text-[var(--ink-soft)] transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => patch({ faqs: [...draft.faqs, { q: "", a: "" }] })}
            className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--ink-soft)] transition-colors hover:border-sky hover:text-sky"
          >
            <Plus size={15} /> Add FAQ
          </button>
        </Section>

        <Section title="Curriculum" subtitle="Modules and lessons shown on the course page and in the player.">
          {draft.modules.length === 0 && (
            <p className="text-sm text-[var(--ink-soft)]">No modules yet — add the first one below.</p>
          )}
          {draft.modules.map((m, mi) => (
            <div key={m.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="flex items-center gap-2">
                <GripVertical size={16} className="shrink-0 text-[var(--ink-soft)]" />
                <span className="shrink-0 rounded-md bg-violet-soft px-2 py-0.5 text-xs font-semibold text-violet">
                  Module {mi + 1}
                </span>
                <input
                  value={m.title}
                  onChange={(e) => patchModule(m.id, { title: e.target.value })}
                  placeholder="Module title"
                  className="w-full min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--ink)] outline-none placeholder:text-[var(--ink-soft)] focus:border-sky"
                />
                <button
                  onClick={() => setConfirm({ kind: "module", moduleId: m.id, title: m.title })}
                  aria-label={`Remove module ${m.title}`}
                  className="shrink-0 rounded-lg p-2 text-[var(--ink-soft)] transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="mt-3 space-y-2 pl-6">
                {m.lessons.map((l) => {
                  const openL = openLessons.has(l.id);
                  return (
                    <div key={l.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                      <div className="flex items-center gap-2 px-3 py-2">
                        <button
                          onClick={() => toggleLesson(l.id)}
                          aria-label={openL ? "Collapse lesson" : "Expand lesson"}
                          className="shrink-0 rounded p-1 text-[var(--ink-soft)] hover:text-[var(--ink)]"
                        >
                          <ChevronDown size={15} className={`transition-transform ${openL ? "rotate-180" : ""}`} />
                        </button>
                        <input
                          value={l.title}
                          onChange={(e) => patchLesson(m.id, l.id, { title: e.target.value })}
                          placeholder="Lesson title"
                          className="w-full min-w-0 flex-1 bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-soft)]"
                        />
                        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-[var(--ink-soft)]">
                          <input
                            type="checkbox"
                            checked={l.preview === true}
                            onChange={(e) => patchLesson(m.id, l.id, { preview: e.target.checked })}
                            className="accent-[#2D9CDB]"
                          />
                          Preview
                        </label>
                        <button
                          onClick={() => setConfirm({ kind: "lesson", moduleId: m.id, lessonId: l.id, title: l.title })}
                          aria-label={`Remove lesson ${l.title}`}
                          className="shrink-0 rounded-lg p-1.5 text-[var(--ink-soft)] transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {openL && (
                        <div className="space-y-3 border-t border-[var(--border)] p-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="block">
                              <span className="text-xs font-semibold text-[var(--ink)]">Video URL</span>
                              <input
                                value={l.videoUrl ?? ""}
                                onChange={(e) => patchLesson(m.id, l.id, { videoUrl: e.target.value })}
                                placeholder="https://…/lesson.mp4"
                                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-soft)] focus:border-sky"
                              />
                            </label>
                            <label className="block">
                              <span className="text-xs font-semibold text-[var(--ink)]">Duration (minutes)</span>
                              <input
                                type="number"
                                min={0}
                                value={Number.isFinite(l.durationMin) ? l.durationMin : 0}
                                onChange={(e) => patchLesson(m.id, l.id, { durationMin: Math.max(0, Number(e.target.value) || 0) })}
                                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-sky"
                              />
                            </label>
                          </div>
                          <label className="block">
                            <span className="text-xs font-semibold text-[var(--ink)]">Lesson content</span>
                            <span className="ml-2 text-xs text-[var(--ink-soft)]">Markdown</span>
                            <textarea
                              value={l.content ?? ""}
                              onChange={(e) => patchLesson(m.id, l.id, { content: e.target.value })}
                              rows={8}
                              placeholder={"## Lesson notes\n\nExplain the concepts covered in this lesson…"}
                              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-xs leading-relaxed text-[var(--ink)] outline-none placeholder:text-[var(--ink-soft)] focus:border-sky"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={() => addLesson(m.id)}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--ink-soft)] transition-colors hover:border-sky hover:text-sky"
                >
                  <Plus size={13} /> Add lesson
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={addModule}
            className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--ink-soft)] transition-colors hover:border-sky hover:text-sky"
          >
            <Plus size={15} /> Add module
          </button>
        </Section>
      </div>

      {/* sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md lg:left-64">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <p className="truncate text-sm text-[var(--ink-soft)]">
            {saveError ? (
              <span className="text-red-600">{saveError}</span>
            ) : savedFlash ? (
              <span className="flex items-center gap-1.5 text-emerald"><Check size={15} /> Saved</span>
            ) : dirty ? (
              "Unsaved changes"
            ) : (
              "All changes saved"
            )}
          </p>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-sky px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1f7fe0] disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save changes
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.kind === "module" ? "Remove module?" : "Remove lesson?"}
        message={
          confirm?.kind === "module"
            ? `"${confirm.title}" and all its lessons will be removed. This takes effect when you save.`
            : `"${confirm?.title ?? ""}" will be removed. This takes effect when you save.`
        }
        confirmLabel="Remove"
        onConfirm={removeConfirmed}
        onCancel={() => setConfirm(null)}
      />
    </main>
  );
}
