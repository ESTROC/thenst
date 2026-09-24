"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Search, BookOpen, Clock, User, ArrowRight, ArrowUpRight, 
  CheckCircle2, Filter, Layers, GraduationCap, ShieldCheck, 
  Plane, FileText, Building2, Users, Cpu, Award, Lock, Sparkles
} from "lucide-react";
import { Navbar } from "@/components/nst/navbar";
import { Footer } from "@/components/nst/footer";
import { COURSES, Course } from "@/lib/nst-data";
import { useAuth } from "@/lib/auth-context";

const CATEGORIES = [
  "All",
  "National Security",
  "Cybersecurity",
  "Emerging Technology",
  "Defence Technology",
  "Strategic Affairs",
  "AI & Technology"
];

const LEVELS = ["All", "Foundational", "Intermediate", "Advanced"];

const PLATFORM_PILLARS = [
  {
    num: "01",
    icon: Plane,
    title: "Drone Piloting & Operations",
    subtitle: "Flight Training & Rules",
    description: "Learn how to fly drones safely, use sensors and cameras, follow government rules, and earn your official pilot qualification.",
    badge: "Drone Training",
    href: "/drone-pilot"
  },
  {
    num: "02",
    icon: ShieldCheck,
    title: "Security Guards & Officers",
    subtitle: "Protection & Safety",
    description: "Complete practical training for security work. Learn site safety, emergency response, and complete your official background verification.",
    badge: "Security",
    href: "/security-professional"
  },
  {
    num: "03",
    icon: FileText,
    title: "Security Research & Reports",
    subtitle: "Expert Knowledge & Analysis",
    description: "Read clear guides, threat updates, and technology research papers written by security and defense experts.",
    badge: "Research",
    href: "/research"
  },
  {
    num: "04",
    icon: Building2,
    title: "Hiring & Team Training",
    subtitle: "For Companies & Agencies",
    description: "Companies and security agencies can find, hire, and train verified guards, drone pilots, and security staff.",
    badge: "For Companies",
    href: "/organisation"
  }
];

const ECOSYSTEM_STATS = [
  { value: "100%", label: "Verified Certificates", detail: "Government-aligned & PSARA Compliant" },
  { value: "48+", label: "Step-by-Step Lessons", detail: "Drones, Security, Cyber & AI" },
  { value: "3-Tier", label: "Flexible Pricing", detail: "For Students, Small Teams & Companies" },
  { value: "Direct", label: "Job Placement", detail: "Connect with Agencies & Employers" }
];

export default function LearnPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");

  const filteredCourses = COURSES.filter((c) => {
    const matchesCat = selectedCat === "All" || c.category === selectedCat;
    const matchesLevel = selectedLevel === "All" || c.level === selectedLevel;
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesLevel && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f6f2] text-[#171b22]">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-[#171b22] text-white pt-20 pb-24 border-b border-[#3b414a]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <span className="text-[11px] font-mono uppercase tracking-[2px] text-[#d95325] font-semibold mb-3 block">
              TheNST / Learning &amp; Training Hub
            </span>
            <h1 className="text-4xl sm:text-6xl font-medium leading-[0.98] tracking-[-2.5px] text-white mb-6 max-w-[900px]">
              Learn, Get Certified, and Build Your Career in Security.
            </h1>
            <p className="text-base sm:text-lg text-[#c5c9ce] leading-relaxed max-w-[720px] font-sans mb-10">
              TheNST brings together simple drone training, verified security certifications, expert research, and direct hiring in one easy-to-use platform.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-[#3b414a]/80">
              {ECOSYSTEM_STATS.map((stat, idx) => (
                <div key={idx} className="p-4 bg-[#232830] border border-[#3b414a]/60">
                  <div className="text-2xl font-mono font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-xs font-semibold text-[#d95325] uppercase tracking-wider mb-0.5">{stat.label}</div>
                  <div className="text-[11px] text-[#8e95a0]">{stat.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Platform Overview */}
        <section className="bg-white py-20 border-b border-[#e5e3db]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="max-w-2xl mb-14">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold mb-2 block">
                What We Offer
              </span>
              <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#171b22] mb-4">
                What You Can Do on TheNST
              </h2>
              <p className="text-sm sm:text-base text-[#616872] leading-relaxed">
                Everything you need to learn practical skills, get your credentials verified, and connect with real employers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {PLATFORM_PILLARS.map((pillar) => {
                const IconComponent = pillar.icon;
                return (
                  <div 
                    key={pillar.num} 
                    className="bg-[#faf9f5] border border-[#e5e3db] p-8 sm:p-10 flex flex-col justify-between hover:border-[#171b22]/40 transition-all duration-200 group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center bg-[#171b22] text-white text-sm font-mono font-bold">
                            {pillar.num}
                          </span>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-[#737a83]">
                            {pillar.badge}
                          </span>
                        </div>
                        <div className="h-9 w-9 flex items-center justify-center text-[#171b22] group-hover:text-[#d95325] transition-colors">
                          <IconComponent className="w-6 h-6" />
                        </div>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-medium tracking-tight text-[#171b22] mb-2">
                        {pillar.title}
                      </h3>
                      <p className="text-xs font-mono text-[#d95325] mb-4">
                        {pillar.subtitle}
                      </p>
                      <p className="text-xs sm:text-sm text-[#616872] leading-relaxed font-sans mb-8">
                        {pillar.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#e5e3db]">
                      <Link
                        href={pillar.href}
                        className="inline-flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider text-[#171b22] group-hover:text-[#d95325] transition-colors"
                      >
                        <span>Learn More About {pillar.badge}</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Catalog Section */}
        <section className="bg-[#faf9f5] py-16 sm:py-20 border-b border-[#e5e3db]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-6 border-b border-[#e5e3db] gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold mb-2 block">
                  Course Catalog
                </span>
                <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#171b22]">
                  Explore Courses &amp; Certifications
                </h2>
              </div>
              <p className="text-xs text-[#737a83] max-w-sm">
                Learn as an individual student, train your team, or sign up your company.
              </p>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-center justify-between pb-8 mb-10 border-b border-[#e5e3db]">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737a83]" />
                <input
                  type="text"
                  placeholder="Search by topic, keyword, or instructor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e5e3db] text-xs text-[#171b22] placeholder:text-[#737a83] focus:outline-none focus:border-[#d95325] focus:bg-white transition-all font-sans"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCat(cat)}
                    className={`px-3 py-1.5 text-xs font-medium transition-all ${
                      selectedCat === cat
                        ? "bg-[#171b22] text-white"
                        : "bg-white text-[#4f555d] border border-[#e5e3db] hover:bg-[#e5e3db]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Level Filter Sub-bar */}
            <div className="flex items-center justify-between pb-6 mb-8 text-xs font-mono text-[#737a83] border-b border-[#e5e3db]/60">
              <div className="flex items-center gap-3">
                <span className="uppercase tracking-wider">Level:</span>
                {LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedLevel(lvl)}
                    className={`px-2 py-0.5 transition-colors ${
                      selectedLevel === lvl ? "text-[#d95325] font-bold underline" : "hover:text-[#171b22]"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <span>Showing {filteredCourses.length} of {COURSES.length} Courses</span>
            </div>

            {/* Course Cards Grid */}
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white border border-[#e5e3db] p-8 flex flex-col justify-between hover:border-[#171b22]/40 transition-all duration-200"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold">
                          {c.category}
                        </span>
                        <span className="text-[10px] font-mono text-[#737a83] uppercase">
                          {c.level}
                        </span>
                      </div>

                      <h3 className="text-xl font-medium tracking-tight text-[#171b22] mb-3">
                        {c.title}
                      </h3>

                      <p className="text-xs text-[#616872] leading-relaxed font-sans mb-6">
                        {c.description}
                      </p>

                      <div className="space-y-1.5 mb-6 text-[11px] font-sans text-[#737a83] border-t border-[#e5e3db] pt-4">
                        <div className="flex items-center justify-between">
                          <span>Duration:</span>
                          <span className="font-mono text-[#171b22]">{c.duration}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Instructor:</span>
                          <span className="font-mono text-[#171b22]">{c.instructor}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#e5e3db]">
                      <Link
                        href={`/learn/${c.id}`}
                        className="inline-flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider text-[#d95325] hover:text-[#bc3f18]"
                      >
                        <span>View Lessons &amp; Enroll</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white border border-[#e5e3db] p-8">
                <BookOpen className="w-10 h-10 text-[#737a83] mx-auto mb-4 stroke-1" />
                <h3 className="text-lg font-medium text-[#171b22] mb-2">No courses found</h3>
                <p className="text-xs text-[#737a83] max-w-sm mx-auto mb-6">
                  No courses match your search. Try clearing your filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedCat("All");
                    setSelectedLevel("All");
                  }}
                  className="px-4 py-2 bg-[#171b22] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#d95325] transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* Educator Callout */}
            <div className="mt-16 p-8 sm:p-12 bg-white border border-[#e5e3db] flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold mb-2 block">
                  Teach with Us
                </span>
                <h3 className="text-2xl font-medium tracking-tight text-[#171b22] mb-2">
                  Are you an experienced instructor or security expert?
                </h3>
                <p className="text-xs sm:text-sm text-[#616872] leading-relaxed max-w-xl font-sans">
                  Create and teach practical courses on TheNST. Submit your course idea to our team.
                </p>
              </div>
              <Link
                href="/educator"
                className="inline-flex items-center justify-center min-h-[44px] px-6 text-xs font-semibold tracking-wider text-white bg-[#171b22] hover:bg-[#d95325] transition-all uppercase whitespace-nowrap shadow-sm"
              >
                Become an Educator →
              </Link>
            </div>
          </div>
        </section>

        {/* Action Buttons Section */}
        <section className="bg-[#171b22] text-white py-20 border-t border-[#3b414a]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto text-center">
            <span className="text-[11px] font-mono uppercase tracking-[2px] text-[#d95325] font-semibold mb-3 block">
              Join The Platform
            </span>
            <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white mb-6 max-w-2xl mx-auto">
              Ready to Get Started?
            </h2>
            <p className="text-sm sm:text-base text-[#c5c9ce] max-w-xl mx-auto mb-10 font-sans">
              Create a free account to start learning, get your certificates verified, or find and hire trained professionals.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center min-h-[48px] px-8 text-xs font-semibold tracking-wider text-white bg-[#d95325] hover:bg-[#bc3f18] transition-all uppercase whitespace-nowrap shadow-md"
              >
                Register / Create Account →
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center min-h-[48px] px-8 text-xs font-semibold tracking-wider text-white bg-[#232830] hover:bg-[#2d343f] border border-[#3b414a] transition-all uppercase whitespace-nowrap"
              >
                Sign In
              </Link>
              <Link
                href={user ? "/dashboard" : "/sign-in?redirect=/dashboard"}
                className="inline-flex items-center justify-center min-h-[48px] px-8 text-xs font-semibold tracking-wider text-[#171b22] bg-[#f7f6f2] hover:bg-white transition-all uppercase whitespace-nowrap"
              >
                Enter Platform
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}



