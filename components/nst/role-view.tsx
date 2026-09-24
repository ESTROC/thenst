"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Shield, ArrowUpRight, BookOpen, Compass, Users, ChevronDown } from "lucide-react";
import { Navbar } from "@/components/nst/navbar";
import { Footer } from "@/components/nst/footer";
import { ROLE_COPY } from "@/lib/nst-data";

export function RolePageView({ roleKey }: { roleKey: string }) {
  const role = ROLE_COPY[roleKey] || ROLE_COPY["security-professional"];
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "Who is eligible to participate in this track?",
      a: "Practitioners, researchers, officers, engineers, and faculty with demonstrated experience in security, technology, aviation, or related analytical disciplines."
    },
    {
      q: "How does the onboarding and verification process work?",
      a: "Upon creating your account, you will submit your background details and core domain interests. Our editorial and compliance desk reviews credentials to grant appropriate platform privileges."
    },
    {
      q: "Are opportunities and curricula compensated?",
      a: "Yes. Research monographs, course authoring, and field project deployments carry institutional honoraria, retainers, or direct contracts as specified in each brief."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f6f2] text-[#171b22]">
      <Navbar />

      <main className="flex-1">
        {/* Role Hero (Dark Band) */}
        <section className="bg-[#171b22] text-white pt-20 pb-24 border-b border-[#3b414a]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-[2px] text-[#d95325] font-semibold mb-3 block">
                  TheNST / Role Pathway // {role.subtitle}
                </span>
                <h1 className="text-4xl sm:text-6xl font-medium leading-[0.98] tracking-[-2.5px] text-white mb-6 max-w-[850px]">
                  {role.heroTitle}
                </h1>
                <p className="text-base sm:text-lg text-[#c5c9ce] leading-relaxed max-w-[640px] font-sans mb-8">
                  {role.heroDesc}
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center justify-center min-h-[46px] px-7 text-xs font-semibold tracking-wider text-white bg-[#d95325] hover:bg-[#bc3f18] uppercase transition-all shadow-md"
                  >
                    Join as {role.title} →
                  </Link>
                  <Link
                    href="/platform"
                    className="inline-flex items-center justify-center min-h-[46px] px-7 text-xs font-semibold tracking-wider text-white border border-[#3b414a] hover:bg-white hover:text-[#171b22] uppercase transition-all"
                  >
                    Preview Platform Workspace
                  </Link>
                </div>
              </div>

              {/* Visual Role Image Showcase */}
              <div className="relative h-60 sm:h-72 lg:h-[300px] max-w-lg w-full overflow-hidden border border-[#3b414a] shadow-xl justify-self-end">
                <img
                  src={
                    roleKey === "educator"
                      ? "/images/educator-classroom.jpg"
                      : roleKey === "drone-pilot"
                      ? "/images/drone-operations.jpg"
                      : "/images/security-professional-field.jpg"
                  }
                  alt={role.title}
                  className={`absolute inset-0 w-full h-full object-cover ${
                    roleKey === "educator" ? "object-[center_35%]" : "object-[center_45%]"
                  } grayscale-[5%] contrast-[1.05]`}
                />
                <div className="absolute inset-0 bg-[#171b22]/15" />
              </div>
            </div>
          </div>
        </section>

        {/* 5-Step Journey: "What happens after I join?" */}
        <section className="bg-white py-20 sm:py-24 border-b border-[#e5e3db]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="mb-14">
              <span className="text-[11px] font-mono uppercase tracking-[2px] text-[#737a83] font-semibold block mb-2">
                Structured Journey
              </span>
              <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#171b22]">
                What happens after you join.
              </h2>
              <p className="text-sm text-[#616872] leading-relaxed max-w-xl font-sans mt-2">
                A clear, five-step progression from initial registration to active contribution and project deployment.
              </p>
            </div>

            {/* Modern Milestone Stepper Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 my-8">
              {role.steps.map((step, idx) => (
                <div 
                  key={step.num} 
                  className="group relative bg-[#faf9f5] border border-[#e5e3db] p-7 flex flex-col justify-between min-h-[260px] hover:bg-white hover:border-[#171b22] hover:shadow-md transition-all duration-200"
                >
                  <div>
                    {/* Top Step Header with Pill Badge & Arrow */}
                    <div className="flex items-center justify-between mb-8">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#fdf2ee] border border-[#d95325]/30 text-[#d95325] font-mono text-xs font-bold">
                        {step.num}
                      </span>
                      {idx < role.steps.length - 1 && (
                        <ArrowRight className="hidden lg:block w-3.5 h-3.5 text-[#a4abb4] group-hover:text-[#d95325] group-hover:translate-x-0.5 transition-all" />
                      )}
                    </div>

                    <h3 className="text-base font-semibold tracking-tight text-[#171b22] mb-2 leading-snug group-hover:text-[#d95325] transition-colors">
                      {step.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-[13px] text-[#616872] leading-relaxed font-sans pt-3 border-t border-[#e5e3db]/60">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Privileges & Features */}
            <div className="pt-12">
              <span className="text-[11px] font-mono uppercase tracking-[2px] text-[#737a83] font-semibold block mb-4">
                ROLE PRIVILEGES & PLATFORM ACCESS
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {role.benefits.map((b, i) => (
                  <div key={i} className="p-6 border border-[#e5e3db] bg-[#faf9f5] flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#d95325] flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-[#171b22] font-sans">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-[#faf9f5] py-20 border-b border-[#e5e3db]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <span className="text-[11px] font-mono uppercase tracking-[2px] text-[#737a83] font-semibold block mb-2">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl font-medium tracking-tight text-[#171b22] mb-10">
              Clarifications & Guidelines
            </h2>

            <div className="divide-y divide-[#e5e3db] border-y border-[#e5e3db] bg-white">
              {faqs.map((faq, idx) => (
                <div key={idx} className="p-6">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <span className="text-base font-medium text-[#171b22] font-sans">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-[#737a83] transition-transform ${openFaq === idx ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === idx && (
                    <p className="mt-3 text-xs sm:text-sm text-[#616872] leading-relaxed font-sans pr-8">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom CTA Banner */}
            <div className="mt-14 text-center">
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center min-h-[46px] px-8 text-xs font-semibold tracking-wider text-white bg-[#171b22] hover:bg-[#d95325] uppercase transition-all"
              >
                Create Account & Join as {role.title} →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
