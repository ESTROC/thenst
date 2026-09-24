"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, Briefcase, CheckCircle2, ArrowRight, Building2 } from "lucide-react";
import { Navbar } from "@/components/nst/navbar";
import { Footer } from "@/components/nst/footer";
import { OPPORTUNITIES } from "@/lib/nst-data";
import { toast } from "sonner";

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const opp = OPPORTUNITIES.find((o) => o.id === resolvedParams.id);
  const [applied, setApplied] = useState(false);

  if (!opp) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f7f6f2] text-[#171b22]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center bg-white border border-[#e5e3db] p-8">
            <h1 className="text-2xl font-medium mb-3">Opportunity Not Found</h1>
            <p className="text-sm text-[#737a83] mb-6">The requested institutional posting does not exist or has expired.</p>
            <Link
              href="/opportunities"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#171b22] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#d95325] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Opportunities Board
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleApply = () => {
    setApplied(true);
    toast.success(`Application submitted for "${opp.title}". The lead desk has received your response.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f6f2] text-[#171b22]">
      <Navbar />

      <main className="flex-1">
        {/* Opportunity Header (Dark Band) */}
        <div className="bg-[#171b22] text-white border-b border-[#3b414a] pt-12 pb-16">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="flex items-center gap-2 text-xs font-mono text-[#9299a2] mb-6">
              <Link href="/" className="hover:text-white transition-colors">TheNST</Link>
              <span>/</span>
              <Link href="/opportunities" className="hover:text-white transition-colors">Opportunities</Link>
              <span>/</span>
              <span className="text-[#d95325]">{opp.type}</span>
            </div>

            <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold mb-2 block">
              {opp.type} · {opp.organisation}
            </span>

            <h1 className="text-3xl sm:text-5xl font-medium tracking-tight text-white mb-5 max-w-[850px]">
              {opp.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-xs font-mono text-[#9299a2] pt-4 border-t border-[#3b414a]/80">
              <span>Location: {opp.location}</span>
              <span>•</span>
              <span>Category: {opp.category}</span>
              <span>•</span>
              <span>Status: {opp.date}</span>
            </div>
          </div>
        </div>

        {/* Opportunity Content Section */}
        <section className="bg-white py-16 sm:py-20 border-b border-[#e5e3db]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.8fr] gap-12 items-start">
              {/* Left Column: Brief Details */}
              <div className="space-y-10">
                <div>
                  <h2 className="text-xl font-medium text-[#171b22] mb-4 pb-2 border-b border-[#e5e3db]">
                    Brief Description & Scope
                  </h2>
                  <p className="text-sm sm:text-base text-[#616872] leading-relaxed font-sans">
                    {opp.description}
                  </p>
                </div>

                {opp.requirements && opp.requirements.length > 0 && (
                  <div>
                    <h2 className="text-xl font-medium text-[#171b22] mb-4 pb-2 border-b border-[#e5e3db]">
                      Candidate & Participant Requirements
                    </h2>
                    <ul className="space-y-3">
                      {opp.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-[#616872] font-sans">
                          <CheckCircle2 className="w-4 h-4 text-[#d95325] flex-shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h2 className="text-xl font-medium text-[#171b22] mb-4 pb-2 border-b border-[#e5e3db]">
                    Institutional Context
                  </h2>
                  <p className="text-sm text-[#616872] leading-relaxed font-sans">
                    Applications and submissions are reviewed directly by the sponsoring lead desk at {opp.organisation}. Verified practitioners receive priority evaluation.
                  </p>
                </div>
              </div>

              {/* Right Column: Application Card */}
              <div className="p-8 bg-[#faf9f5] border border-[#e5e3db] sticky top-24 shadow-sm space-y-6">
                <div className="text-xs font-mono uppercase tracking-widest text-[#737a83] pb-2 border-b border-[#e5e3db]">
                  Posting Overview
                </div>

                <div className="space-y-3 text-xs font-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-[#737a83]">Organisation:</span>
                    <span className="font-semibold text-[#171b22]">{opp.organisation}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#737a83]">Engagement Type:</span>
                    <span className="font-semibold text-[#171b22]">{opp.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#737a83]">Arrangement:</span>
                    <span className="font-semibold text-[#171b22]">{opp.compensation || "Institutional Rate"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#737a83]">Location:</span>
                    <span className="font-semibold text-[#171b22]">{opp.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#737a83]">Deadline:</span>
                    <span className="font-semibold text-[#d95325] font-mono">{opp.deadline || "Rolling"}</span>
                  </div>
                </div>

                {applied ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium text-center">
                    ✓ Application Received by Desk
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleApply}
                    className="w-full inline-flex items-center justify-center min-h-[46px] px-6 text-xs font-semibold tracking-wider text-white bg-[#d95325] hover:bg-[#bc3f18] transition-all uppercase shadow-sm"
                  >
                    Submit Expression of Interest
                  </button>
                )}

                <Link
                  href="/opportunities"
                  className="w-full inline-flex items-center justify-center min-h-[40px] px-4 text-xs font-semibold tracking-wider text-[#171b22] border border-[#e5e3db] bg-white hover:bg-[#f7f6f2] transition-all uppercase"
                >
                  ← Back to Opportunities
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
