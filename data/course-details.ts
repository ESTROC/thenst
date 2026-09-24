import { CourseDetail, Module } from "@/lib/types";
import { courses } from "./courses";

// Generic curriculum scaffold. Real lessons/videos slot in here later.
function buildModules(title: string): Module[] {
  return [
    {
      id: "m1",
      title: "Getting Started",
      lessons: [
        { id: "l1", title: "Welcome & course overview", durationMin: 0, preview: true },
        { id: "l2", title: "How this course works", durationMin: 0 },
        { id: "l3", title: "Setting up your environment", durationMin: 0 },
      ],
    },
    {
      id: "m2",
      title: `Core Concepts of ${title}`,
      lessons: [
        { id: "l4", title: "Foundations & key terminology", durationMin: 0 },
        { id: "l5", title: "Hands-on walkthrough", durationMin: 0 },
        { id: "l6", title: "Common patterns & pitfalls", durationMin: 0 },
      ],
    },
    {
      id: "m3",
      title: "Applied Project",
      lessons: [
        { id: "l7", title: "Project brief & planning", durationMin: 0 },
        { id: "l8", title: "Building it step by step", durationMin: 0 },
        { id: "l9", title: "Review, polish & next steps", durationMin: 0 },
      ],
    },
  ];
}

export function getCourseDetail(slug: string): CourseDetail | null {
  const base = courses.find((c) => c.slug === slug);
  if (!base) return null;

  return {
    ...base,
    longDescription: `${base.description} This course takes you from the fundamentals to applied, real-world skills through guided lessons, hands-on practice, and a capstone project. Designed for ${base.level.toLowerCase()} learners who want practical, job-ready knowledge in ${base.category}.`,
    outcomes: [
      `Understand the core principles of ${base.title}`,
      "Apply concepts through hands-on exercises",
      "Build a portfolio-ready project",
      "Gain confidence to tackle real-world problems",
    ],
    prerequisites:
      base.level === "Beginner"
        ? ["No prior experience required", "Curiosity and willingness to learn"]
        : ["Basic familiarity with the fundamentals", "Comfort with hands-on practice"],
    modules: buildModules(base.title),
    certification:
      "Earn a verified certificate of completion you can share on LinkedIn and add to your resume.",
    faqs: [
      { q: "Do I need any prior experience?", a: `This is a ${base.level.toLowerCase()}-level course. Check the prerequisites section above for details.` },
      { q: "How long do I have access?", a: "Access depends on your chosen plan. Self-paced plans include lifetime access." },
      { q: "Is there a certificate?", a: "Yes — you receive a verified certificate once you complete the course." },
      { q: "Can I learn at my own pace?", a: "Absolutely. Lessons are available on-demand so you can learn whenever suits you." },
    ],
    reviewList: [],
  };
}

export function getAllSlugs(): string[] {
  return courses.map((c) => c.slug);
}
