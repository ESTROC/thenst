"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { Course } from "@/lib/learn/types";
import { createCourse, CourseDoc } from "@/lib/learn/admin";

const LEVELS: Course["level"][] = ["Beginner", "Intermediate", "Advanced"];
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const TIERS = [
  { key: "students", label: "Students" },
  { key: "msmes", label: "MSMEs" },
  { key: "enterprise", label: "Enterprise" },
] as const;

function toWhole(v: string | number): number {
  return Math.max(0, Math.round(Number(v) || 0));
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s-]+/g, "-").replace(/^-|-$/g, "");
}

function toLines(s: string): string[] {
  return s.split("\n").map((l) => l.trim()).filter(Boolean);
}

function LabelledInput({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[var(--ink)]">{label}</span>
      {hint && <span className="ml-2 text-xs text-[var(--ink-soft)]">{hint}</span>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-soft)] focus:border-sky"
      />
    </label>
  );
}

export default function NewCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [category, setCategory] = useState("");
  const [instructor, setInstructor] = useState("");
  const [level, setLevel] = useState<Course["level"]>("Beginner");
  const [thumbnailColor, setThumbnailColor] = useState("#2D9CDB");
  const [price, setPrice] = useState("");
  const [tiers, setTiers] = useState<Record<(typeof TIERS)[number]["key"], string>>({
    students: "", msmes: "", enterprise: "",
  });
  const [certification, setCertification] = useState("Certificate of completion");
  const [outcomesText, setOutcomesText] = useState("");
  const [prereqText, setPrereqText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const effectiveSlug = slugTouched ? slug : slugify(title);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError("Title is required."); return; }
    if (!SLUG_RE.test(effectiveSlug)) {
      setError("Slug must be lowercase letters, numbers and hyphens (e.g. intro-to-python).");
      return;
    }
    if (!category.trim()) { setError("Category is required."); return; }

    const data: CourseDoc = {
      slug: effectiveSlug,
      title: title.trim(),
      description: description.trim(),
      longDescription: longDescription.trim() || description.trim(),
      category: category.trim(),
      level,
      price: Math.max(0, Math.round(Number(price) || 0)),
      tierPricing: {
        students: toWhole(tiers.students),
        msmes: toWhole(tiers.msmes),
        enterprise: toWhole(tiers.enterprise),
      },
      thumbnailColor,
      certification: certification.trim(),
      outcomes: toLines(outcomesText),
      prerequisites: toLines(prereqText),
      faqs: [],
      modules: [],
      reviewList: [],
      instructor: instructor.trim() || "TBA",
      rating: 0,
      reviews: 0,
      durationHours: 0,
      enrolled: 0,
    };

    setBusy(true);
    try {
      await createCourse(data);
      router.push(`/admin/courses/${effectiveSlug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the course.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => router.push("/learn/admin/courses")}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]"
      >
        <ArrowLeft size={15} /> Back to courses
      </button>
      <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Add course</h1>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Set up the basics here — modules, lessons and FAQs are added on the edit screen after creation.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
          <p className="font-display font-bold text-[var(--ink)]">Basics</p>
          <LabelledInput label="Title" value={title} onChange={setTitle} placeholder="Introduction to Python" />
          <LabelledInput
            label="Slug"
            hint="used in the URL and as the document id"
            value={effectiveSlug}
            onChange={(v) => { setSlugTouched(true); setSlug(slugify(v) || v.toLowerCase()); }}
            placeholder="introduction-to-python"
          />
          <LabelledInput
            label="Instructor"
            hint='defaults to "TBA" if left empty'
            value={instructor}
            onChange={setInstructor}
            placeholder="Dr. Aarti Menon"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <LabelledInput label="Category" value={category} onChange={setCategory} placeholder="Programming" />
            <label className="block">
              <span className="text-sm font-semibold text-[var(--ink)]">Level</span>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as Course["level"])}
                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-sky"
              >
                {LEVELS.map((l) => (<option key={l} value={l}>{l}</option>))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-[var(--ink)]">Price (₹)</span>
              <span className="ml-2 text-xs text-[var(--ink-soft)]">whole rupees — 0 or empty means free</span>
              <input
                type="number"
                min={0}
                step={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-soft)] focus:border-sky"
              />
            </label>
          </div>
          <div>
            <span className="text-sm font-semibold text-[var(--ink)]">Tier pricing (₹)</span>
            <span className="ml-2 text-xs text-[var(--ink-soft)]">per-audience pricing — 0 or empty means free</span>
            <div className="mt-1.5 grid gap-4 sm:grid-cols-3">
              {TIERS.map((t) => (
                <label key={t.key} className="block">
                  <span className="text-xs font-semibold text-[var(--ink)]">{t.label}</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={tiers[t.key]}
                    onChange={(e) => setTiers((s) => ({ ...s, [t.key]: e.target.value }))}
                    placeholder="0"
                    className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-soft)] focus:border-sky"
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
                value={thumbnailColor}
                onChange={(e) => setThumbnailColor(e.target.value)}
                aria-label="Thumbnail colour picker"
                className="h-10 w-14 cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg)]"
              />
              <input
                value={thumbnailColor}
                onChange={(e) => setThumbnailColor(e.target.value)}
                className="w-32 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-sky"
              />
            </span>
          </label>
        </section>

        <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
          <p className="font-display font-bold text-[var(--ink)]">Description</p>
          <label className="block">
            <span className="text-sm font-semibold text-[var(--ink)]">Short description</span>
            <span className="ml-2 text-xs text-[var(--ink-soft)]">shown on cards</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-soft)] focus:border-sky"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-[var(--ink)]">Long description</span>
            <span className="ml-2 text-xs text-[var(--ink-soft)]">shown on the course page</span>
            <textarea
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              rows={4}
              className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-soft)] focus:border-sky"
            />
          </label>
          <LabelledInput label="Certification" value={certification} onChange={setCertification} />
        </section>

        <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
          <p className="font-display font-bold text-[var(--ink)]">Outcomes &amp; prerequisites</p>
          <label className="block">
            <span className="text-sm font-semibold text-[var(--ink)]">What students will learn</span>
            <span className="ml-2 text-xs text-[var(--ink-soft)]">one per line</span>
            <textarea
              value={outcomesText}
              onChange={(e) => setOutcomesText(e.target.value)}
              rows={4}
              placeholder={"Write clean Python code\nBuild small CLI tools"}
              className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-soft)] focus:border-sky"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-[var(--ink)]">Prerequisites</span>
            <span className="ml-2 text-xs text-[var(--ink-soft)]">one per line</span>
            <textarea
              value={prereqText}
              onChange={(e) => setPrereqText(e.target.value)}
              rows={3}
              placeholder={"A computer with internet access\nNo prior coding experience needed"}
              className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-soft)] focus:border-sky"
            />
          </label>
        </section>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="flex items-center gap-2 rounded-xl bg-sky px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1f7fe0] disabled:opacity-60"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            Create course
          </button>
          <button
            type="button"
            onClick={() => router.push("/learn/admin/courses")}
            className="rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--bg)]"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
