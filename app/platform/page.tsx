"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Compass,
  BookOpen,
  Building2,
  Lock,
  UserCheck,
  FileText,
  Clock,
  PlusCircle,
  CheckCircle2,
  ArrowRight,
  ArrowUpRight,
  Search,
  ExternalLink,
  Layers,
  Settings,
  Bell
} from "lucide-react";
import { Navbar } from "@/components/nst/navbar";
import { Footer } from "@/components/nst/footer";
import { COURSES, ARTICLES, OPPORTUNITIES, NETWORK_PEOPLE } from "@/lib/nst-data";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth-context";

type PlatformRole = "security-professional" | "drone-pilot" | "educator" | "organisation" | "admin";

export default function PlatformHubPage() {
  const { user, profile, loading } = useAuth();
  const [activeRole, setActiveRole] = useState<PlatformRole>("security-professional");
  const [activeTab, setActiveTab] = useState<string>("overview");

  const isAdmin = profile?.role === "admin" || profile?.role === "superadmin";

  const roleTabs = [
    { id: "security-professional" as PlatformRole, label: "Security Professional", icon: ShieldCheck },
    { id: "drone-pilot" as PlatformRole, label: "Drone Pilot", icon: Compass },
    { id: "educator" as PlatformRole, label: "Educator", icon: BookOpen },
    { id: "organisation" as PlatformRole, label: "Organisation", icon: Building2 },
    ...(isAdmin ? [{ id: "admin" as PlatformRole, label: "Admin Console", icon: Lock }] : []),
  ];

  // If user is not admin and activeRole is admin, fallback to security-professional
  const currentActiveRole = activeRole === "admin" && !isAdmin ? "security-professional" : activeRole;

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f6f2] text-[#171b22]">
      <Navbar />

      <main className="flex-1">
        {/* Platform Command Header (Dark Band) */}
        <section className="bg-[#171b22] text-white pt-12 pb-16 border-b border-[#3b414a]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#3b414a]/80 mb-8">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold block mb-1">
                  TheNST Platform / Role Hub
                </span>
                <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-white">
                  Personalized Capability Workspace
                </h1>
              </div>

              {!loading && !user ? (
                <div className="flex items-center gap-3">
                  <Link
                    href="/sign-in"
                    className="px-4 py-2 bg-[#d95325] hover:bg-[#bc3f18] text-white text-xs font-semibold uppercase tracking-wider transition-all"
                  >
                    Sign In / Create Account
                  </Link>
                </div>
              ) : user && profile ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-[#1b2028] border border-[#3b414a] text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-white font-medium">{profile.fullName || profile.email}</span>
                    <span className="text-[10px] font-mono uppercase text-[#d95325] bg-[#d95325]/15 px-1.5 py-0.5 border border-[#d95325]/30">
                      {profile.role}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Role Switcher Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#9299a2] mr-2">
                Active View:
              </span>
              {roleTabs.map((r) => {
                const Icon = r.icon;
                const isActive = currentActiveRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setActiveRole(r.id);
                      setActiveTab("overview");
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                      isActive
                        ? "bg-white text-[#171b22] shadow-sm"
                        : "bg-[#1b2028] text-[#a2a8b2] hover:text-white border border-[#3b414a]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Task-Oriented Role Workspace */}
        <section className="bg-white py-12 sm:py-16 border-b border-[#e5e3db]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            {/* ROLE 1: SECURITY PROFESSIONAL */}
            {currentActiveRole === "security-professional" && (
              <div className="space-y-10">
                <div className="p-6 bg-[#faf9f5] border border-[#e5e3db] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-medium text-[#171b22]">Security Professional Dashboard</h2>
                    <p className="text-xs text-[#737a83] font-sans">Manage your verified credentials, active applications, and intelligence reading queue.</p>
                  </div>
                  <Link
                    href="/security-professional"
                    className="text-xs font-semibold text-[#d95325] uppercase tracking-wider hover:underline"
                  >
                    View Roadmap Guidelines →
                  </Link>
                </div>

                {/* Security Field Operational Showcase */}
                <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr] gap-6 sm:gap-8 bg-[#171b22] text-white p-5 sm:p-6 border border-[#3b414a] items-stretch">
                  <div className="relative w-full min-h-[180px] md:min-h-full overflow-hidden border border-[#3b414a]">
                    <img
                      src="/images/security-training-tactical.jpg"
                      alt="Field operational briefing and tactical instruction"
                      className="absolute inset-0 w-full h-full object-cover object-[center_40%] grayscale-[5%] contrast-[1.05]"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold mb-1">
                      Field Operational Readiness
                    </span>
                    <h3 className="text-lg sm:text-xl font-medium text-white mb-2">
                      Tactical Integration & Inter-Agency Command
                    </h3>
                    <p className="text-xs text-[#b8bec5] leading-relaxed font-sans mb-4">
                      Participate in field doctrine briefings, joint defense technology integration sessions, and frontline capability evaluations across live operational environments.
                    </p>
                    <div className="flex items-center gap-3">
                      <Link
                        href="/opportunities"
                        className="px-4 py-2 bg-[#d95325] hover:bg-[#bc3f18] text-white text-xs font-semibold uppercase tracking-wider transition-all"
                      >
                        Explore Security Missions & Briefs →
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Task 1: My Learning */}
                  <div className="p-6 bg-[#faf9f5] border border-[#e5e3db] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold">
                          01 / Learning Desk
                        </span>
                        <BookOpen className="w-4 h-4 text-[#737a83]" />
                      </div>
                      <h3 className="text-base font-medium text-[#171b22] mb-2">{COURSES[0].title}</h3>
                      <p className="text-xs text-[#616872] leading-relaxed font-sans mb-4">
                        Progress: Module 2 of 4 (Intelligence Frameworks & OSINT).
                      </p>
                      <div className="w-full bg-[#e5e3db] h-1.5 mb-4">
                        <div className="bg-[#d95325] h-1.5 w-1/2" />
                      </div>
                    </div>
                    <Link
                      href={`/learn/${COURSES[0].id}`}
                      className="text-xs font-semibold text-[#171b22] hover:text-[#d95325] uppercase tracking-wider"
                    >
                      Resume Syllabus →
                    </Link>
                  </div>

                  {/* Task 2: Active Applications */}
                  <div className="p-6 bg-[#faf9f5] border border-[#e5e3db] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold">
                          02 / Opportunities
                        </span>
                        <Compass className="w-4 h-4 text-[#737a83]" />
                      </div>
                      <h3 className="text-base font-medium text-[#171b22] mb-2">{OPPORTUNITIES[0].title}</h3>
                      <p className="text-xs text-[#616872] leading-relaxed font-sans mb-4">
                        Status: <span className="text-emerald-700 font-semibold font-mono">Under Desk Review</span>
                      </p>
                    </div>
                    <Link
                      href="/opportunities"
                      className="text-xs font-semibold text-[#171b22] hover:text-[#d95325] uppercase tracking-wider"
                    >
                      Browse More Briefs →
                    </Link>
                  </div>

                  {/* Task 3: Saved Research */}
                  <div className="p-6 bg-[#faf9f5] border border-[#e5e3db] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold">
                          03 / Intelligence
                        </span>
                        <FileText className="w-4 h-4 text-[#737a83]" />
                      </div>
                      <h3 className="text-base font-medium text-[#171b22] mb-2">{ARTICLES[0].title}</h3>
                      <p className="text-xs text-[#616872] leading-relaxed font-sans mb-4">
                        Reading Queue · {ARTICLES[0].readTime}
                      </p>
                    </div>
                    <Link
                      href={`/research/${ARTICLES[0].id}`}
                      className="text-xs font-semibold text-[#171b22] hover:text-[#d95325] uppercase tracking-wider"
                    >
                      Open Monograph →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* ROLE 2: DRONE PILOT */}
            {currentActiveRole === "drone-pilot" && (
              <div className="space-y-10">
                <div className="p-6 bg-[#faf9f5] border border-[#e5e3db] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-medium text-[#171b22]">Drone Pilot & UAV Operator Hub</h2>
                    <p className="text-xs text-[#737a83] font-sans">Manage flight equipment registries, counter-UAS certifications, and field deployments.</p>
                  </div>
                  <Link
                    href="/drone-pilot"
                    className="text-xs font-semibold text-[#d95325] uppercase tracking-wider hover:underline"
                  >
                    View Capability Requirements →
                  </Link>
                </div>

                {/* Drone Visual Operational Showcase (1st Picture) */}
                <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr] gap-6 sm:gap-8 bg-[#171b22] text-white p-5 sm:p-6 border border-[#3b414a] items-stretch">
                  <div className="relative w-full min-h-[180px] md:min-h-full overflow-hidden border border-[#3b414a]">
                    <img
                      src="/images/drone-operations.jpg"
                      alt="UAV telemetry and operational setup"
                      className="absolute inset-0 w-full h-full object-cover object-center grayscale-[5%] contrast-[1.05]"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold mb-1">
                      Operational Deployment Registry
                    </span>
                    <h3 className="text-lg sm:text-xl font-medium text-white mb-2">
                      Field Hardware & Autonomous Payloads
                    </h3>
                    <p className="text-xs text-[#b8bec5] leading-relaxed font-sans mb-4">
                      Telemetry links, encrypted BVLOS controllers, optical/thermal payloads, and counter-UAS sensor arrays configured for multi-operator field trials.
                    </p>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/opportunities/${OPPORTUNITIES[0].id}`}
                        className="px-4 py-2 bg-[#d95325] hover:bg-[#bc3f18] text-white text-xs font-semibold uppercase tracking-wider transition-all"
                      >
                        Apply for Drone Flight Mission →
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-[#faf9f5] border border-[#e5e3db]">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold">
                        Open Drone Missions
                      </span>
                      <Compass className="w-4 h-4 text-[#737a83]" />
                    </div>
                    <h3 className="text-lg font-medium text-[#171b22] mb-2">{OPPORTUNITIES[0].title}</h3>
                    <p className="text-xs text-[#616872] leading-relaxed font-sans mb-4">
                      {OPPORTUNITIES[0].description}
                    </p>
                    <Link
                      href={`/opportunities/${OPPORTUNITIES[0].id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#d95325] uppercase tracking-wider hover:underline"
                    >
                      View Mission Brief <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="p-8 bg-[#faf9f5] border border-[#e5e3db]">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold">
                        Technical Primer & Protocols
                      </span>
                      <BookOpen className="w-4 h-4 text-[#737a83]" />
                    </div>
                    <h3 className="text-lg font-medium text-[#171b22] mb-2">{COURSES[3].title}</h3>
                    <p className="text-xs text-[#616872] leading-relaxed font-sans mb-4">
                      {COURSES[3].description}
                    </p>
                    <Link
                      href={`/learn/${COURSES[3].id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#d95325] uppercase tracking-wider hover:underline"
                    >
                      Enrol in EW & Sensor Fusion Course <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* ROLE 3: EDUCATOR */}
            {currentActiveRole === "educator" && (
              <div className="space-y-10">
                <div className="p-6 bg-[#faf9f5] border border-[#e5e3db] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-medium text-[#171b22]">Educator & Faculty Studio</h2>
                    <p className="text-xs text-[#737a83] font-sans">Draft modular course syllabi, submit proposals for peer review, and manage enrolled cohorts.</p>
                  </div>
                  <Link
                    href="/educator"
                    className="text-xs font-semibold text-[#d95325] uppercase tracking-wider hover:underline"
                  >
                    Educator Guide & Accreditation →
                  </Link>
                </div>

                {/* Educator Visual Briefing Showcase (2nd Picture) */}
                <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr] gap-6 sm:gap-8 bg-[#171b22] text-white p-5 sm:p-6 border border-[#3b414a] items-stretch">
                  <div className="relative w-full min-h-[180px] md:min-h-full overflow-hidden border border-[#3b414a]">
                    <img
                      src="/images/educator-classroom.jpg"
                      alt="Instructional briefing and software pedagogy"
                      className="absolute inset-0 w-full h-full object-cover object-[center_35%] grayscale-[5%] contrast-[1.05]"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold mb-1">
                      Structured Pedagogy & Masterclasses
                    </span>
                    <h3 className="text-lg sm:text-xl font-medium text-white mb-2">
                      Educator Briefing & Ground Station Instruction
                    </h3>
                    <p className="text-xs text-[#b8bec5] leading-relaxed font-sans mb-4">
                      Deliver live interactive sessions, instruct cohorts on mission planning software, and translate operational doctrine into accredited national security curricula.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toast.success("Draft course proposal wizard opened.")}
                        className="px-4 py-2 bg-[#d95325] hover:bg-[#bc3f18] text-white text-xs font-semibold uppercase tracking-wider transition-all"
                      >
                        + Create Course Proposal
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-[#faf9f5] border border-[#e5e3db]">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold block mb-2">
                      Course Proposal Workflow
                    </span>
                    <h3 className="text-xl font-medium text-[#171b22] mb-3">Submit New Curriculum Draft</h3>
                    <p className="text-xs text-[#616872] leading-relaxed font-sans mb-6">
                      Define syllabus modules, assessment rubrics, and recommended reading for review by the academic board.
                    </p>
                    <button
                      type="button"
                      onClick={() => toast.success("Draft course proposal wizard opened.")}
                      className="px-5 py-2.5 bg-[#171b22] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#d95325] transition-colors"
                    >
                      + Create Course Proposal
                    </button>
                  </div>

                  <div className="p-8 bg-[#faf9f5] border border-[#e5e3db]">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold block mb-2">
                      Active Curricula
                    </span>
                    <h3 className="text-xl font-medium text-[#171b22] mb-3">Foundations of National Security</h3>
                    <p className="text-xs text-[#616872] leading-relaxed font-sans mb-4">
                      Cohort 2026-Q1 active · 4 Modules · In Progress
                    </p>
                    <Link
                      href={`/learn/${COURSES[0].id}`}
                      className="text-xs font-semibold text-[#d95325] uppercase tracking-wider hover:underline"
                    >
                      View Student Submissions →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* ROLE 4: ORGANISATION */}
            {currentActiveRole === "organisation" && (
              <div className="space-y-10">
                <div className="p-6 bg-[#faf9f5] border border-[#e5e3db] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-medium text-[#171b22]">Organisation & Enterprise Console</h2>
                    <p className="text-xs text-[#737a83] font-sans">Post capability briefs, commission strategic research, and access verified security talent.</p>
                  </div>
                  <Link
                    href="/about#contact"
                    className="text-xs font-semibold text-[#d95325] uppercase tracking-wider hover:underline"
                  >
                    Enterprise Partnership Desk →
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-[#faf9f5] border border-[#e5e3db]">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold block mb-2">
                      Publish Institutional Brief
                    </span>
                    <h3 className="text-xl font-medium text-[#171b22] mb-3">Post Project or Mission Tender</h3>
                    <p className="text-xs text-[#616872] leading-relaxed font-sans mb-6">
                      Publish high-clearance opportunities to verified security practitioners and research contributors.
                    </p>
                    <button
                      type="button"
                      onClick={() => toast.success("Institutional brief draft initiated.")}
                      className="px-5 py-2.5 bg-[#171b22] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#d95325] transition-colors"
                    >
                      + Post New Capability Call
                    </button>
                  </div>

                  <div className="p-8 bg-[#faf9f5] border border-[#e5e3db]">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold block mb-2">
                      Talent Matching
                    </span>
                    <h3 className="text-xl font-medium text-[#171b22] mb-3">Browse Directory of Analysts</h3>
                    <p className="text-xs text-[#616872] leading-relaxed font-sans mb-6">
                      Filter verified personnel by sector, operational credentials, and security clearance.
                    </p>
                    <Link
                      href="/network"
                      className="px-5 py-2.5 bg-[#171b22] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#d95325] transition-colors inline-block"
                    >
                      Search Professional Directory
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* ROLE 5: ADMIN (Visible to Admins and Superadmins only) */}
            {isAdmin && currentActiveRole === "admin" && (
              <div className="space-y-10">
                <div className="p-6 bg-[#faf9f5] border border-[#e5e3db] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-medium text-[#171b22]">Platform Administration Desk</h2>
                    <p className="text-xs text-[#737a83] font-sans">Manage content modules, verify professional submissions, and oversee research releases.</p>
                  </div>
                  <span className="text-xs font-mono uppercase text-[#d95325] font-semibold">
                    Institutional Tier
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="p-6 bg-[#faf9f5] border border-[#e5e3db]">
                    <div className="text-xs font-mono text-[#737a83] uppercase mb-1">Curricula</div>
                    <div className="text-2xl font-medium text-[#171b22] mb-2">{COURSES.length} Courses</div>
                    <Link href="/learn" className="text-xs font-semibold text-[#d95325] hover:underline">Manage →</Link>
                  </div>

                  <div className="p-6 bg-[#faf9f5] border border-[#e5e3db]">
                    <div className="text-xs font-mono text-[#737a83] uppercase mb-1">Monographs</div>
                    <div className="text-2xl font-medium text-[#171b22] mb-2">{ARTICLES.length} Articles</div>
                    <Link href="/research" className="text-xs font-semibold text-[#d95325] hover:underline">Manage →</Link>
                  </div>

                  <div className="p-6 bg-[#faf9f5] border border-[#e5e3db]">
                    <div className="text-xs font-mono text-[#737a83] uppercase mb-1">Postings</div>
                    <div className="text-2xl font-medium text-[#171b22] mb-2">{OPPORTUNITIES.length} Briefs</div>
                    <Link href="/opportunities" className="text-xs font-semibold text-[#d95325] hover:underline">Manage →</Link>
                  </div>

                  <div className="p-6 bg-[#faf9f5] border border-[#e5e3db]">
                    <div className="text-xs font-mono text-[#737a83] uppercase mb-1">Directory</div>
                    <div className="text-2xl font-medium text-[#171b22] mb-2">{NETWORK_PEOPLE.length} Profiles</div>
                    <Link href="/network" className="text-xs font-semibold text-[#d95325] hover:underline">Manage →</Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
