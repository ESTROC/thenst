"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Users, BookOpen, Building2, Compass, ArrowRight, ArrowUpRight, CheckCircle2, Shield } from "lucide-react";
import { Navbar } from "@/components/nst/navbar";
import { Footer } from "@/components/nst/footer";

const PILLARS = [
  {
    id: "people",
    num: "01",
    title: "People",
    subtitle: "Professionals, Experts, Educators and Learners",
    description: "The core of national security is human judgment, operational experience, and technical leadership. TheNST connects vetted practitioners across defense, cybersecurity, intelligence, and emerging technologies.",
    focusAreas: [
      "Security Professionals & Strategic Analysts",
      "Drone Pilots & Autonomous Systems Operators",
      "Educators & Curriculum Designers",
      "Field Specialists & Technical Researchers"
    ],
    actionText: "Explore Professional Network",
    href: "/network"
  },
  {
    id: "knowledge",
    num: "02",
    title: "Knowledge",
    subtitle: "Research, Intelligence, Analysis and Learning",
    description: "Rigorous inquiry and continuous education are essential for navigating contemporary multi-domain challenges. TheNST produces peer-reviewed monographs and delivers structured professional education.",
    focusAreas: [
      "Intelligence Briefings & Strategic Doctrine",
      "Cyber Threat Analysis & Infrastructure Defense",
      "Counter-UAS & Autonomy Research",
      "Accredited Modular Courses & Masterclasses"
    ],
    actionText: "Visit Research Desk",
    href: "/research"
  },
  {
    id: "organisations",
    num: "03",
    title: "Organisations",
    subtitle: "Institutions, Employers, Partners and Research Entities",
    description: "Sovereign capability requires structural alignment between government institutions, defense innovators, academic foundations, and enterprise partners.",
    focusAreas: [
      "National Security Research Foundations",
      "Critical Infrastructure Resilience Institutes",
      "Autonomous Systems Testing Facilities",
      "Defence Electronics & Hardware Consortia"
    ],
    actionText: "Learn About Organisations",
    href: "/about"
  },
  {
    id: "opportunities",
    num: "04",
    title: "Opportunities",
    subtitle: "Careers, Projects, Collaboration and Pathways",
    description: "Direct pathways for deployment, contributing research, designing curricula, and participating in sovereign defense initiatives.",
    focusAreas: [
      "Research Contributor Calls & Monographs",
      "Technical Curriculum Review Panels",
      "Field Capability & UAV Trials",
      "Senior Strategic Fellowships"
    ],
    actionText: "Browse Open Briefs",
    href: "/opportunities"
  }
];

export default function EcosystemPage() {
  const [selectedPillar, setSelectedPillar] = useState(PILLARS[0]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f6f2] text-[#171b22]">
      <Navbar />

      <main className="flex-1">
        {/* Intro Hero (Dark Band) */}
        <section className="bg-[#171b22] text-white pt-20 pb-24 border-b border-[#3b414a]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <span className="text-[11px] font-mono uppercase tracking-[2px] text-[#d95325] font-semibold mb-3 block">
              TheNST / Architecture
            </span>
            <h1 className="text-4xl sm:text-6xl font-medium leading-[0.98] tracking-[-2.5px] text-white mb-6 max-w-[850px]">
              The Four Pillars of National Security Capability.
            </h1>
            <p className="text-base sm:text-lg text-[#c5c9ce] leading-relaxed max-w-[640px] font-sans">
              TheNST organizes national security collaboration around four essential dimensions: people, knowledge, organisations, and opportunity.
            </p>
          </div>
        </section>

        {/* 4 Pillars Interactive & Detailed Grid */}
        <section className="bg-white py-24 sm:py-28 border-b border-[#e5e3db]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {PILLARS.map((pillar) => (
                <div
                  key={pillar.id}
                  onClick={() => setSelectedPillar(pillar)}
                  className={`p-8 sm:p-10 border transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[360px] ${
                    selectedPillar.id === pillar.id
                      ? "border-[#d95325] bg-[#faf9f5] shadow-md ring-1 ring-[#d95325]"
                      : "border-[#e5e3db] bg-white hover:border-[#171b22]/30 hover:bg-[#faf9f5]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-sm font-mono font-bold text-[#d95325]">
                        {pillar.num} / Pillar
                      </span>
                      <span className="text-xs font-mono uppercase tracking-wider text-[#737a83]">
                        {pillar.title}
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#171b22] mb-2">
                      {pillar.title}
                    </h2>

                    <p className="text-xs font-mono uppercase text-[#737a83] mb-4">
                      {pillar.subtitle}
                    </p>

                    <p className="text-sm text-[#616872] leading-relaxed font-sans mb-6">
                      {pillar.description}
                    </p>

                    <div className="space-y-2 mb-6">
                      {pillar.focusAreas.map((area, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-xs text-[#171b22] font-medium font-sans">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d95325]" />
                          <span>{area}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#e5e3db]">
                    <Link
                      href={pillar.href}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#d95325] uppercase tracking-wider hover:text-[#bc3f18]"
                    >
                      {pillar.actionText} <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Strategic Summary Box */}
            <div className="p-8 sm:p-12 bg-[#171b22] text-white border border-[#3b414a] grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold mb-2 block">
                  Institutional Integration
                </span>
                <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-white mb-4">
                  Moving between dimensions as your mission evolves.
                </h3>
                <p className="text-sm text-[#a2a8b2] leading-relaxed font-sans">
                  A researcher can design curricula on TheNST Learn; an operational drone pilot can bid on field trials; an organisation can recruit specialized talent. The system operates as an interconnected whole.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                <Link
                  href="/platform"
                  className="w-full inline-flex items-center justify-center min-h-[44px] px-6 text-xs font-semibold tracking-wider text-white bg-[#d95325] hover:bg-[#bc3f18] transition-all uppercase text-center"
                >
                  Enter TheNST Platform
                </Link>
                <Link
                  href="/about"
                  className="w-full inline-flex items-center justify-center min-h-[44px] px-6 text-xs font-semibold tracking-wider text-white border border-[#3b414a] hover:bg-white hover:text-[#171b22] transition-all uppercase text-center"
                >
                  About The Think Tank
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
