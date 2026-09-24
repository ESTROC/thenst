"use client";

import React, { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, BookOpen, User, CheckCircle2, ArrowRight, ShieldCheck, Share2 } from "lucide-react";
import { Navbar } from "@/components/nst/navbar";
import { Footer } from "@/components/nst/footer";
import { COURSES } from "@/lib/nst-data";
import { toast } from "sonner";

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const resolvedParams = use(params);
  const course = COURSES.find((c) => c.id === resolvedParams.courseId);

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f7f6f2] text-[#171b22]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center bg-white border border-[#e5e3db] p-8">
            <h1 className="text-2xl font-medium mb-3">Course Not Found</h1>
            <p className="text-sm text-[#737a83] mb-6">The requested course does not exist or has been archived.</p>
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#171b22] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#d95325] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Learn Catalog
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleEnrolClick = () => {
    toast.success(`Enrolled in "${course.title}". Added to your platform learning dashboard.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f6f2] text-[#171b22]">
      <Navbar />

      <main className="flex-1">
        {/* Breadcrumb Header */}
        <div className="bg-[#171b22] text-white border-b border-[#3b414a] pt-12 pb-16">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="flex items-center gap-2 text-xs font-mono text-[#9299a2] mb-6">
              <Link href="/" className="hover:text-white transition-colors">TheNST</Link>
              <span>/</span>
              <Link href="/learn" className="hover:text-white transition-colors">Learn</Link>
              <span>/</span>
              <span className="text-[#d95325]">{course.category}</span>
            </div>

            <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold mb-2 block">
              {course.category} · {course.level} Level
            </span>

            <h1 className="text-3xl sm:text-5xl font-medium tracking-tight text-white mb-5 max-w-[850px]">
              {course.title}
            </h1>

            <p className="text-base sm:text-lg text-[#c5c9ce] leading-relaxed max-w-[700px] font-sans">
              {course.description}
            </p>
          </div>
        </div>

        {/* Content Section */}
        <section className="bg-white py-16 sm:py-20 border-b border-[#e5e3db]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.8fr] gap-12 items-start">
              {/* Left Details */}
              <div className="space-y-10">
                <div>
                  <h2 className="text-xl font-medium text-[#171b22] mb-4 pb-2 border-b border-[#e5e3db]">
                    Course Overview
                  </h2>
                  <p className="text-sm text-[#616872] leading-relaxed font-sans">
                    {course.overview || course.description}
                  </p>
                </div>

                {course.modules && course.modules.length > 0 && (
                  <div>
                    <h2 className="text-xl font-medium text-[#171b22] mb-4 pb-2 border-b border-[#e5e3db]">
                      Syllabus & Core Modules
                    </h2>
                    <div className="space-y-3">
                      {course.modules.map((mod, idx) => (
                        <div key={idx} className="p-4 bg-[#faf9f5] border border-[#e5e3db] flex items-start gap-3">
                          <span className="text-xs font-mono font-bold text-[#d95325] mt-0.5">
                            Module 0{idx + 1}
                          </span>
                          <span className="text-sm font-medium text-[#171b22] font-sans">
                            {mod}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h2 className="text-xl font-medium text-[#171b22] mb-4 pb-2 border-b border-[#e5e3db]">
                    Prerequisites & Target Audience
                  </h2>
                  <p className="text-sm text-[#616872] leading-relaxed font-sans">
                    {course.prerequisites || "Open to all verified security practitioners and students."}
                  </p>
                </div>
              </div>

              {/* Right Summary Card */}
              <div className="p-8 bg-[#faf9f5] border border-[#e5e3db] sticky top-24 shadow-sm">
                <div className="text-xs font-mono uppercase tracking-widest text-[#737a83] mb-4 pb-2 border-b border-[#e5e3db]">
                  Course Specifications
                </div>

                <div className="space-y-4 text-xs font-sans mb-8">
                  <div className="flex items-center justify-between">
                    <span className="text-[#737a83]">Duration:</span>
                    <span className="font-semibold text-[#171b22] font-mono">{course.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#737a83]">Proficiency:</span>
                    <span className="font-semibold text-[#171b22]">{course.level}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#737a83]">Instruction Desk:</span>
                    <span className="font-semibold text-[#171b22]">{course.instructor}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#737a83]">Format:</span>
                    <span className="font-semibold text-[#171b22]">{course.format || "Modular Curriculum"}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleEnrolClick}
                  className="w-full inline-flex items-center justify-center min-h-[46px] px-6 text-xs font-semibold tracking-wider text-white bg-[#d95325] hover:bg-[#bc3f18] transition-all uppercase shadow-sm mb-3"
                >
                  Enrol in Course
                </button>

                <Link
                  href="/learn"
                  className="w-full inline-flex items-center justify-center min-h-[40px] px-4 text-xs font-semibold tracking-wider text-[#171b22] border border-[#e5e3db] bg-white hover:bg-[#f7f6f2] transition-all uppercase"
                >
                  ← Back to Catalog
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
