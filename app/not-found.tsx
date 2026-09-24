"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, FileText } from "lucide-react";
import { Navbar } from "@/components/nst/navbar";
import { Footer } from "@/components/nst/footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f7f6f2] text-[#171b22]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-20 px-6">
        <div className="max-w-md w-full text-center bg-white border border-[#e5e3db] p-10 shadow-sm">
          <span className="text-xs font-mono font-bold text-[#d95325] uppercase tracking-widest block mb-2">
            404 // Resource Not Located
          </span>
          <h1 className="text-3xl font-medium tracking-tight text-[#171b22] mb-3">
            This page could not be found.
          </h1>
          <p className="text-xs sm:text-sm text-[#616872] leading-relaxed font-sans mb-8">
            The requested document, course, or pathway has been moved, renamed, or is unavailable in the public registry.
          </p>

          <div className="space-y-3">
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center min-h-[44px] px-5 text-xs font-semibold uppercase tracking-wider text-white bg-[#171b22] hover:bg-[#d95325] transition-colors"
            >
              Return Home
            </Link>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <Link
                href="/research"
                className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 text-xs font-semibold uppercase tracking-wider text-[#171b22] border border-[#e5e3db] hover:bg-[#f7f6f2] transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-[#d95325]" /> Research
              </Link>
              <Link
                href="/learn"
                className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 text-xs font-semibold uppercase tracking-wider text-[#171b22] border border-[#e5e3db] hover:bg-[#f7f6f2] transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#d95325]" /> Learn
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
