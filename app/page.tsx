"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  BookOpen,
  Compass,
  ArrowUpRight,
  ArrowRight,
  Users,
  Building2,
  FileText,
  GraduationCap,
  Sparkles,
  Layers,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { Navbar } from "@/components/nst/navbar";
import { Footer } from "@/components/nst/footer";
import { CapabilityGraph } from "@/components/nst/capability-graph";
import { COURSES, ARTICLES, NETWORK_PEOPLE, OPPORTUNITIES } from "@/lib/nst-data";
import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const { user, profile, loading } = useAuth();
  const [activePillar, setActivePillar] = useState<"People" | "Knowledge" | "Organisations" | "Opportunities">("People");

  const pillarDetails = {
    People: {
      headline: "Discover security professionals, drone pilots, and certified instructors.",
      description: "Connect with verified security guards, drone operators, researchers, and teachers ready to work and collaborate.",
      actionText: "Browse Professionals",
      href: "/network"
    },
    Knowledge: {
      headline: "Take practical online courses and read expert security reports.",
      description: "Access step-by-step video lessons, verified certificates, drone training, and plain-language security guides.",
      actionText: "Explore Courses & Research",
      href: "/learn"
    },
    Organisations: {
      headline: "Connect companies, security agencies, and training partners.",
      description: "Help employers, security firms, tech builders, and schools find pre-screened talent and train their teams.",
      actionText: "Explore Organisations",
      href: "/about"
    },
    Opportunities: {
      headline: "Find jobs, flight missions, research projects, and training programs.",
      description: "Browse verified job postings, field drone missions, paid research grants, and accredited internships.",
      actionText: "Browse Opportunities",
      href: "/opportunities"
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f6f2] text-[#171b22] selection:bg-[#d95325]/20 selection:text-[#d95325]">
      {/* Top Navigation */}
      <Navbar />

      <main className="flex-1">
        {/* ========================================================
            1. HERO SECTION (DARK CHARCOAL #171b22)
        ======================================================== */}
        <section className="bg-[#171b22] text-white pt-20 pb-24 border-b border-[#3b414a] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#d95325]/5 rounded-full blur-[140px] pointer-events-none" />

          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
              {/* Left Column: Hero Text */}
              <div className="flex flex-col items-start">
                <span className="text-[11px] font-mono uppercase tracking-[2.5px] text-[#d95325] font-bold mb-4">
                  THE NATIONAL SECURITY THINK TANK
                </span>

                <h1 className="text-4xl sm:text-6xl lg:text-[74px] font-medium leading-[0.95] tracking-[-2.5px] mb-6 text-white">
                  Security is a <em className="font-serif italic font-normal text-[#e5e3db]">team</em> effort.
                </h1>

                <p className="text-base sm:text-lg text-[#c5c9ce] leading-relaxed max-w-[540px] mb-9 font-normal">
                  The National Security Think Tank brings together security guards, drone pilots, researchers, educators, and companies to build real skills, share knowledge, and find careers.
                </p>

                {/* Hero Action Buttons */}
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="/ecosystem"
                    className="inline-flex items-center justify-center min-h-[46px] px-6 text-xs font-semibold tracking-wider text-white bg-[#d95325] hover:bg-[#bc3f18] transition-all duration-200 uppercase shadow-md"
                  >
                    Explore TheNST
                  </Link>
                  <a
                    href="#where-do-you-fit"
                    className="inline-flex items-center justify-center min-h-[46px] px-6 text-xs font-semibold tracking-wider text-white border border-[#525965] hover:bg-white hover:text-[#171b22] transition-all duration-200 uppercase"
                  >
                    Find Your Role
                  </a>
                </div>
              </div>

              {/* Right Column: Interactive 2D/3D Capability Graph */}
              <div className="w-full flex justify-center lg:justify-end">
                <CapabilityGraph />
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            2. WHAT IS THE NST? (WARM WHITE / PAPER STATEMENT)
        ======================================================== */}
        <section className="bg-white py-24 sm:py-28 border-b border-[#e5e3db]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 lg:gap-20 items-start">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-[2px] text-[#737a83] font-semibold">
                  WHAT IS THE NST
                </span>
              </div>

              <div className="flex flex-col items-start">
                <h2 className="text-3xl sm:text-5xl font-medium leading-[1.06] tracking-[-2px] text-[#171b22] mb-6 max-w-[760px]">
                  A complete platform for skills, training, research, and hiring.
                </h2>

                <p className="text-base sm:text-lg text-[#616872] leading-relaxed max-w-[650px] mb-8 font-sans">
                  TheNST is an easy place to learn new skills, get your background verified, connect with employers, and discover career opportunities in security and defense.
                </p>

                <Link
                  href="/ecosystem"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#d95325] hover:text-[#bc3f18] transition-colors border-b border-transparent hover:border-[#d95325] pb-0.5"
                >
                  Explore the platform
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            3. ECOSYSTEM PILLARS (DARK BAND #171b22)
        ======================================================== */}
        <section className="bg-[#171b22] text-white py-24 sm:py-28 border-b border-[#3b414a]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            {/* Section Header */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.25fr] gap-8 mb-14">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-[2px] text-[#a7adb5] font-semibold">
                  TheNST / Ecosystem
                </span>
                <h2 className="text-3xl sm:text-5xl font-medium leading-[1.05] tracking-[-2px] text-white mt-3">
                  One institution. Many ways in.
                </h2>
              </div>
              <p className="text-base text-[#a7adb5] leading-relaxed self-end font-sans">
                Choose the part of TheNST that is most useful to you now. Your path can change as your work does.
              </p>
            </div>

            {/* Interactive Pillar Tabs */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.45fr] border-t border-[#3d434c]">
              {/* Left Pillar Selector */}
              <div className="border-b lg:border-b-0 lg:border-r border-[#3d434c]">
                {(["People", "Knowledge", "Organisations", "Opportunities"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setActivePillar(item)}
                    className={`w-full flex justify-between items-center text-left py-6 px-4 sm:px-0 sm:pr-8 text-xl font-medium border-b border-[#3d434c] transition-all duration-200 ${
                      activePillar === item
                        ? "text-white sm:pl-4 bg-white/5 sm:bg-transparent font-semibold"
                        : "text-[#8d949e] hover:text-white"
                    }`}
                  >
                    <span>{item}</span>
                    <ArrowRight
                      className={`w-4 h-4 transition-transform ${
                        activePillar === item ? "text-[#d95325] translate-x-1" : "text-[#5b626d]"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Right Pillar Detail */}
              <div className="py-10 lg:py-16 lg:pl-16 flex flex-col justify-center items-start">
                <span className="text-[11px] font-mono uppercase tracking-[2px] text-[#d95325] font-semibold mb-3">
                  {activePillar} Pillar
                </span>

                <h3 className="text-2xl sm:text-4xl font-medium leading-tight tracking-[-1.2px] text-white max-w-[560px] mb-4">
                  {pillarDetails[activePillar].headline}
                </h3>

                <p className="text-sm sm:text-base text-[#a2a8b2] leading-relaxed max-w-[520px] mb-8 font-sans">
                  {pillarDetails[activePillar].description}
                </p>

                <Link
                  href={pillarDetails[activePillar].href}
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white hover:text-[#d95325] transition-colors border-b border-white hover:border-[#d95325] pb-1"
                >
                  {pillarDetails[activePillar].actionText}
                  <ArrowUpRight className="w-4 h-4 text-[#d95325]" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            4. WHERE DO YOU FIT? (WHITE / PAPER TILES)
        ======================================================== */}
        <section id="where-do-you-fit" className="bg-white py-24 sm:py-28 border-b border-[#e5e3db]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.25fr] gap-8 mb-14">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-[2px] text-[#737a83] font-semibold">
                  Choose your path
                </span>
                <h2 className="text-3xl sm:text-5xl font-medium leading-[1.05] tracking-[-2px] text-[#171b22] mt-3">
                  Where do you fit?
                </h2>
              </div>
              <p className="text-base text-[#616872] leading-relaxed self-end font-sans">
                Start with the role or question that brings you here. TheNST is designed to meet you there.
              </p>
            </div>

            {/* Path Grid: 3 Major Visual Journeys */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#e5e3db] border border-[#e5e3db] mb-8">
              {/* Path 1: Security Professional */}
              <div className="bg-white p-8 sm:p-10 flex flex-col justify-between min-h-[320px] hover:bg-[#faf9f5] transition-all duration-200 group">
                <div>
                  <div className="text-[#d95325] mb-8">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-medium tracking-[-0.7px] text-[#171b22] mb-3 group-hover:text-[#d95325] transition-colors">
                    Become a Security Professional
                  </h3>
                  <p className="text-sm text-[#616872] leading-relaxed mb-6 font-sans">
                    Build your professional identity, discover opportunities and connect with the security community.
                  </p>
                </div>
                <Link
                  href="/security-professional"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#d95325] uppercase tracking-wider group-hover:translate-x-1 transition-transform"
                >
                  Explore the Professional Path <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Path 2: Educator */}
              <div className="bg-white p-8 sm:p-10 flex flex-col justify-between min-h-[320px] hover:bg-[#faf9f5] transition-all duration-200 group">
                <div>
                  <div className="text-[#d95325] mb-8">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-medium tracking-[-0.7px] text-[#171b22] mb-3 group-hover:text-[#d95325] transition-colors">
                    Become an Educator
                  </h3>
                  <p className="text-sm text-[#616872] leading-relaxed mb-6 font-sans">
                    Share your expertise and create structured learning experiences for the next generation of security professionals.
                  </p>
                </div>
                <Link
                  href="/educator"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#d95325] uppercase tracking-wider group-hover:translate-x-1 transition-transform"
                >
                  Become an Educator <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Path 3: Drone Pilot */}
              <div className="bg-white p-8 sm:p-10 flex flex-col justify-between min-h-[320px] hover:bg-[#faf9f5] transition-all duration-200 group">
                <div>
                  <div className="text-[#d95325] mb-8">
                    <Compass className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-medium tracking-[-0.7px] text-[#171b22] mb-3 group-hover:text-[#d95325] transition-colors">
                    Become a Drone Pilot
                  </h3>
                  <p className="text-sm text-[#616872] leading-relaxed mb-6 font-sans">
                    Bring operational drone capability, field experience and emerging technology into the wider security ecosystem.
                  </p>
                </div>
                <Link
                  href="/drone-pilot"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#d95325] uppercase tracking-wider group-hover:translate-x-1 transition-transform"
                >
                  Explore Drone Pilot Path <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            5. LARGE EDITORIAL CTA BANNER 1: BECOME AN EDUCATOR
        ======================================================== */}
        <section className="bg-[#eceae3] border-b border-[#e5e3db] py-10 sm:py-14">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto bg-white border border-[#e5e3db] shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 items-stretch min-h-[340px] lg:min-h-[380px]">
              {/* Photography side - full height, zero gaps */}
              <div className="relative w-full min-h-[260px] md:min-h-full overflow-hidden bg-[#171b22]">
                <img
                  src="/images/educator-classroom.jpg"
                  alt="Institutional briefing and educator lecture"
                  className="absolute inset-0 w-full h-full object-cover object-[center_35%] grayscale-[5%] contrast-[1.05]"
                />
                <div className="absolute inset-0 bg-[#171b22]/10" />
              </div>

              {/* Editorial Content side */}
              <div className="p-8 sm:p-12 lg:p-14 flex flex-col justify-center items-start bg-white">
                <span className="text-[11px] font-mono uppercase tracking-[2px] text-[#737a83] font-semibold mb-3">
                  CONTRIBUTE KNOWLEDGE
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium leading-[1.05] tracking-[-1.8px] text-[#171b22] mb-4">
                  Become an Educator
                </h2>
                <p className="text-base text-[#616872] leading-relaxed max-w-[480px] mb-8 font-sans">
                  Turn your expertise into structured learning and contribute knowledge to the next generation of security professionals.
                </p>
                <Link
                  href="/educator"
                  className="inline-flex items-center justify-center min-h-[44px] px-6 text-xs font-semibold tracking-wider text-white bg-[#d95325] hover:bg-[#bc3f18] transition-all uppercase shadow-sm"
                >
                  Become an Educator →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            6. THE NST LEARN (LIGHT SECTION)
        ======================================================== */}
        <section className="bg-[#f7f6f2] py-24 sm:py-28 border-b border-[#e5e3db]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.25fr] gap-8 mb-14">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-[2px] text-[#737a83] font-semibold">
                  TheNST Learn
                </span>
                <h2 className="text-3xl sm:text-5xl font-medium leading-[1.05] tracking-[-2px] text-[#171b22] mt-3">
                  Structured learning for the security profession.
                </h2>
              </div>
              <p className="text-base text-[#616872] leading-relaxed self-end font-sans">
                Curated courses across national security, cyber operations, defence systems, AI and strategic affairs.
              </p>
            </div>

            {/* Featured Course + Category Rows */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 border-t border-[#e5e3db] pt-10">
              {/* Left Featured Course */}
              <div className="flex flex-col justify-between bg-white border border-[#e5e3db] p-8 sm:p-10 shadow-sm">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold mb-3 block">
                    Featured Course / Foundational
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-medium tracking-[-1px] text-[#171b22] mb-4">
                    {COURSES[0].title}
                  </h3>
                  <p className="text-sm text-[#616872] leading-relaxed mb-6 font-sans">
                    {COURSES[0].description}
                  </p>

                  <div className="flex flex-wrap items-center gap-6 text-xs font-mono text-[#737a83] mb-8 pb-6 border-b border-[#e5e3db]">
                    <span>Duration: {COURSES[0].duration}</span>
                    <span>Level: {COURSES[0].level}</span>
                    <span>Desk: {COURSES[0].instructor}</span>
                  </div>
                </div>

                <Link
                  href={`/learn/${COURSES[0].id}`}
                  className="inline-flex items-center justify-between w-full text-xs font-semibold text-[#d95325] uppercase tracking-wider hover:text-[#bc3f18]"
                >
                  <span>View Course Details & Syllabus</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Right Course Index Rows */}
              <div className="flex flex-col justify-between">
                <div className="flex flex-col divide-y divide-[#e5e3db] border-t border-b border-[#e5e3db]">
                  {COURSES.slice(1, 5).map((c) => (
                    <Link
                      key={c.id}
                      href={`/learn/${c.id}`}
                      className="grid grid-cols-[1fr_auto] sm:grid-cols-[1.1fr_2fr_auto] gap-4 items-center py-4.5 group hover:pl-2 transition-all duration-200"
                    >
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#737a83]">
                        {c.category}
                      </span>
                      <b className="text-sm sm:text-base font-medium text-[#171b22] group-hover:text-[#d95325] transition-colors">
                        {c.title}
                      </b>
                      <span className="text-[11px] font-mono text-[#737a83] hidden sm:block">
                        {c.duration}
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="mt-8">
                  <Link
                    href="/learn"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#d95325] uppercase tracking-wider hover:text-[#bc3f18]"
                  >
                    Explore all {COURSES.length} courses
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            7. RESEARCH & INTELLIGENCE (DARK BAND #171b22)
        ======================================================== */}
        <section className="bg-[#171b22] text-white py-24 sm:py-28 border-b border-[#3b414a]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.25fr] gap-8 mb-14">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-[2px] text-[#a7adb5] font-semibold">
                  Research & Intelligence
                </span>
                <h2 className="text-3xl sm:text-5xl font-medium leading-[1.05] tracking-[-2px] text-white mt-3">
                  Independent analysis. Rigorous inquiry.
                </h2>
              </div>
              <p className="text-base text-[#a7adb5] leading-relaxed self-end font-sans">
                Intelligence monographs, doctrinal assessments and strategic research authored by defense analysts and sovereign researchers.
              </p>
            </div>

            {/* Featured Monograph + Supporting Articles */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-[#1b2028] border border-[#3b414a] p-8 sm:p-12 mb-10">
              <div className="flex flex-col justify-center items-start">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold mb-3">
                  Featured Intelligence Monograph
                </span>
                <h3 className="text-2xl sm:text-3xl font-medium leading-tight tracking-[-1px] text-white mb-4">
                  {ARTICLES[0].title}
                </h3>
                <p className="text-sm text-[#b8bec5] leading-relaxed mb-6 font-sans">
                  {ARTICLES[0].summary}
                </p>
                <div className="flex items-center gap-4 text-xs font-mono text-[#9299a2] mb-8">
                  <span>{ARTICLES[0].date}</span>
                  <span>•</span>
                  <span>{ARTICLES[0].readTime}</span>
                  <span>•</span>
                  <span className="text-[#d95325]">{ARTICLES[0].category}</span>
                </div>
                <Link
                  href={`/research/${ARTICLES[0].id}`}
                  className="inline-flex items-center justify-center min-h-[42px] px-5 text-xs font-semibold tracking-wider text-white bg-[#d95325] hover:bg-[#bc3f18] uppercase transition-all"
                >
                  Read Monograph
                </Link>
              </div>

              <div className="relative min-h-[260px] overflow-hidden border border-[#3b414a]">
                <img
                  src={ARTICLES[0].image}
                  alt={ARTICLES[0].title}
                  className="w-full h-full object-cover grayscale-[25%]"
                />
              </div>
            </div>

            {/* Supporting Articles Rows */}
            <div className="divide-y divide-[#3b414a] border-t border-b border-[#3b414a]">
              {ARTICLES.slice(1, 4).map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col sm:flex-row justify-between sm:items-center py-5 gap-4 group"
                >
                  <div>
                    <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-[#9299a2] mb-1.5">
                      <span>{a.category}</span>
                      <span>•</span>
                      <span>{a.date}</span>
                      <span>•</span>
                      <span>{a.readTime}</span>
                    </div>
                    <Link
                      href={`/research/${a.id}`}
                      className="text-lg font-medium text-white group-hover:text-[#d95325] transition-colors"
                    >
                      {a.title}
                    </Link>
                  </div>
                  <Link
                    href={`/research/${a.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#9299a2] group-hover:text-[#d95325] whitespace-nowrap transition-colors uppercase tracking-wider self-start sm:self-auto"
                  >
                    <span>Read Brief</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link
                href="/research"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#d95325] uppercase tracking-wider hover:text-[#bc3f18]"
              >
                Explore Research Desk
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================
            8. LARGE EDITORIAL CTA BANNER 2: BECOME A DRONE PILOT
        ======================================================== */}
        <section className="bg-[#eceae3] border-b border-[#e5e3db] py-10 sm:py-14">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto bg-white border border-[#e5e3db] shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 items-stretch min-h-[340px] lg:min-h-[380px]">
              {/* Editorial Content side */}
              <div className="p-8 sm:p-12 lg:p-14 flex flex-col justify-center items-start bg-white order-2 md:order-1">
                <span className="text-[11px] font-mono uppercase tracking-[2px] text-[#737a83] font-semibold mb-3">
                  OPERATIONAL EXCELLENCE
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium leading-[1.05] tracking-[-1.8px] text-[#171b22] mb-4">
                  For Drone Pilots &amp; UAV Operators
                </h2>
                <p className="text-base text-[#616872] leading-relaxed max-w-[480px] mb-8 font-sans">
                  Access certified flight frameworks, live simulated scenarios, and verified operational briefs designed for modern defense and dual-use aerospace technologies.
                </p>
                <Link
                  href="/drone-pilot"
                  className="inline-flex items-center justify-center min-h-[44px] px-6 text-xs font-semibold tracking-wider text-white bg-[#d95325] hover:bg-[#bc3f18] transition-all uppercase shadow-sm"
                >
                  Explore the Drone Pilot Path →
                </Link>
              </div>

              {/* Drone Photography side - full height, zero gaps */}
              <div className="relative w-full min-h-[260px] md:min-h-full overflow-hidden bg-[#171b22] order-1 md:order-2">
                <img
                  src="/images/drone-operations.jpg"
                  alt="UAV operational equipment, frames and telemetry setup"
                  className="absolute inset-0 w-full h-full object-cover object-center grayscale-[5%] contrast-[1.05]"
                />
                <div className="absolute inset-0 bg-[#171b22]/10" />
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            9. PROFESSIONAL NETWORK (LIGHT SECTION)
        ======================================================== */}
        <section className="bg-white py-24 sm:py-28 border-b border-[#e5e3db]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.25fr] gap-8 mb-14">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-[2px] text-[#737a83] font-semibold">
                  TheNST Network
                </span>
                <h2 className="text-3xl sm:text-5xl font-medium leading-[1.05] tracking-[-2px] text-[#171b22] mt-3">
                  Discover professionals, experts and organisations.
                </h2>
              </div>
              <p className="text-base text-[#616872] leading-relaxed self-end font-sans">
                Connect with verified analysts, advisors, and institutional leaders collaborating across national security disciplines.
              </p>
            </div>

            {/* Network Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#e5e3db] border border-[#e5e3db] mb-8">
              {NETWORK_PEOPLE.slice(0, 3).map((person) => (
                <div key={person.id} className="bg-white p-8 flex flex-col justify-between min-h-[260px]">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-full bg-[#171b22] text-white flex items-center justify-center font-mono text-xs font-bold">
                        {person.initials}
                      </div>
                      <span className="text-[10px] font-mono text-[#737a83] uppercase tracking-wider">
                        {person.domain}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-[#171b22] mb-1">
                      {person.name}
                    </h3>
                    <p className="text-xs text-[#737a83] font-sans mb-3">
                      {person.role} · {person.affiliation}
                    </p>
                    <p className="text-xs text-[#616872] leading-relaxed font-sans">
                      {person.bio}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-[#e5e3db] mt-4 flex items-center justify-between text-[11px] font-mono text-[#737a83]">
                    <span>{person.location}</span>
                    <Link href={`/network/${person.id}`} className="text-[#d95325] hover:underline">
                      View Profile →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <Link
                href="/network"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#d95325] uppercase tracking-wider hover:text-[#bc3f18]"
              >
                Explore Full Network Directory
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================
            10. LARGE EDITORIAL CTA BANNER 3: BECOME A SECURITY PROFESSIONAL
        ======================================================== */}
        <section className="bg-[#eceae3] border-b border-[#e5e3db] py-10 sm:py-14">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto bg-white border border-[#e5e3db] shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 items-stretch min-h-[340px] lg:min-h-[380px]">
              {/* Photography side - full height, zero gaps */}
              <div className="relative w-full min-h-[260px] md:min-h-full overflow-hidden bg-[#171b22]">
                <img
                  src="/images/security-professional-field.jpg"
                  alt="Tactical field training and operational capability briefing"
                  className="absolute inset-0 w-full h-full object-cover object-[center_45%] grayscale-[5%] contrast-[1.05]"
                />
                <div className="absolute inset-0 bg-[#171b22]/10" />
              </div>

              {/* Editorial Content side */}
              <div className="p-8 sm:p-12 lg:p-14 flex flex-col justify-center items-start bg-white">
                <span className="text-[11px] font-mono uppercase tracking-[2px] text-[#737a83] font-semibold mb-3">
                  PROFESSIONAL IDENTITY
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium leading-[1.05] tracking-[-1.8px] text-[#171b22] mb-4">
                  Become a Security Professional
                </h2>
                <p className="text-base text-[#616872] leading-relaxed max-w-[480px] mb-8 font-sans">
                  Build your professional identity, discover operational opportunities, and connect with defense, intelligence, and security practitioners.
                </p>
                <Link
                  href="/security-professional"
                  className="inline-flex items-center justify-center min-h-[44px] px-6 text-xs font-semibold tracking-wider text-white bg-[#d95325] hover:bg-[#bc3f18] transition-all uppercase shadow-sm"
                >
                  Join the Network →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            11. PLATFORM PREVIEW (DARK BAND #171b22)
        ======================================================== */}
        <section className="bg-[#171b22] text-white py-24 sm:py-28 border-b border-[#3b414a]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-14 items-center">
              {/* Left Info */}
              <div>
                <span className="text-[11px] font-mono uppercase tracking-[2px] text-[#d95325] font-semibold mb-3 block">
                  The Platform
                </span>
                <h2 className="text-3xl sm:text-5xl font-medium leading-[1] tracking-[-2px] text-white mb-6">
                  TheNST becomes personalized after you join.
                </h2>
                <p className="text-base text-[#b5bbc2] leading-relaxed max-w-[480px] mb-8 font-sans">
                  Access a structured workspace aligned with your role. Manage active learning modules, browse verified opportunities, publish research insights, and connect directly with peers.
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/platform"
                    className="inline-flex items-center justify-center min-h-[44px] px-6 text-xs font-semibold tracking-wider text-white bg-[#d95325] hover:bg-[#bc3f18] transition-all uppercase shadow-md"
                  >
                    Enter Platform
                  </Link>
                  {!loading && !user && (
                    <Link
                      href="/sign-in"
                      className="inline-flex items-center justify-center min-h-[44px] px-6 text-xs font-semibold tracking-wider text-white border border-[#3b414a] hover:bg-white hover:text-[#171b22] transition-all uppercase"
                    >
                      Sign In / Create Account
                    </Link>
                  )}
                </div>
              </div>

              {/* Right Dashboard Task Preview */}
              <div className="bg-[#1b2028] border border-[#3b414a] p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-[#3b414a] text-xs font-mono text-[#9299a2]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-white font-semibold">Personalized Hub Preview</span>
                  </div>
                  <span>Task-Oriented UX</span>
                </div>

                {/* 5 Core Personalized Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
                  <div className="p-4 bg-[#14171d] border border-[#3b414a]/60">
                    <div className="text-xs font-mono text-[#d95325] mb-1">01 / Learning</div>
                    <div className="text-sm font-medium text-white">My Active Courses</div>
                    <div className="text-[11px] text-[#8e95a0] mt-1 font-sans">Track syllabus progress and assessment milestones.</div>
                  </div>

                  <div className="p-4 bg-[#14171d] border border-[#3b414a]/60">
                    <div className="text-xs font-mono text-[#d95325] mb-1">02 / Opportunities</div>
                    <div className="text-sm font-medium text-white">Applications & Briefs</div>
                    <div className="text-[11px] text-[#8e95a0] mt-1 font-sans">Direct submissions for field missions & fellowships.</div>
                  </div>

                  <div className="p-4 bg-[#14171d] border border-[#3b414a]/60">
                    <div className="text-xs font-mono text-[#d95325] mb-1">03 / Profile</div>
                    <div className="text-sm font-medium text-white">Verified Capabilities</div>
                    <div className="text-[11px] text-[#8e95a0] mt-1 font-sans">Institutional identity & domain certifications.</div>
                  </div>

                  <div className="p-4 bg-[#14171d] border border-[#3b414a]/60">
                    <div className="text-xs font-mono text-[#d95325] mb-1">04 / Research</div>
                    <div className="text-sm font-medium text-white">Desk Feeds & Library</div>
                    <div className="text-[11px] text-[#8e95a0] mt-1 font-sans">Saved monographs and policy briefings.</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#3b414a] flex items-center justify-between text-xs text-[#a2a8b2]">
                  <span>Supports Security Professionals, Drone Pilots, Educators & Organisations</span>
                  <Link href="/platform" className="text-[#d95325] hover:underline font-semibold font-mono text-[11px]">
                    Preview Hub →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            12. FINAL INSTITUTIONAL CALL TO ACTION
        ======================================================== */}
        <section className="bg-white py-20 sm:py-24 border-b border-[#e5e3db]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto text-center">
            <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-[#171b22] mb-6 max-w-[700px] mx-auto">
              Build knowledge, expertise and opportunity across national security.
            </h2>
            <p className="text-base text-[#616872] leading-relaxed max-w-[520px] mx-auto mb-8 font-sans">
              Join vetted practitioners, educators, researchers and organisations on TheNST platform.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/platform"
                className="inline-flex items-center justify-center min-h-[46px] px-7 text-xs font-semibold tracking-wider text-white bg-[#171b22] hover:bg-[#d95325] transition-all uppercase"
              >
                Enter Platform
              </Link>
              <Link
                href="/ecosystem"
                className="inline-flex items-center justify-center min-h-[46px] px-7 text-xs font-semibold tracking-wider text-[#171b22] border border-[#e5e3db] hover:bg-[#f7f6f2] transition-all uppercase"
              >
                Explore The Ecosystem
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Institutional Footer */}
      <Footer />
    </div>
  );
}
