"use client";

import React, { use } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Shield, CheckCircle2, Mail, ExternalLink, Briefcase } from "lucide-react";
import { Navbar } from "@/components/nst/navbar";
import { Footer } from "@/components/nst/footer";
import { NETWORK_PEOPLE } from "@/lib/nst-data";
import { toast } from "sonner";

export default function ProfileDetailPage({ params }: { params: Promise<{ profileId: string }> }) {
  const resolvedParams = use(params);
  const person = NETWORK_PEOPLE.find((p) => p.id === resolvedParams.profileId);

  if (!person) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f7f6f2] text-[#171b22]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center bg-white border border-[#e5e3db] p-8">
            <h1 className="text-2xl font-medium mb-3">Profile Not Found</h1>
            <p className="text-sm text-[#737a83] mb-6">The requested professional record does not exist in the public directory.</p>
            <Link
              href="/network"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#171b22] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#d95325] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Network Directory
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleConnect = () => {
    toast.success(`Connection request sent to ${person.name}.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f6f2] text-[#171b22]">
      <Navbar />

      <main className="flex-1">
        {/* Profile Hero (Dark Band) */}
        <div className="bg-[#171b22] text-white border-b border-[#3b414a] pt-12 pb-16">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="flex items-center gap-2 text-xs font-mono text-[#9299a2] mb-6">
              <Link href="/" className="hover:text-white transition-colors">TheNST</Link>
              <span>/</span>
              <Link href="/network" className="hover:text-white transition-colors">Network</Link>
              <span>/</span>
              <span className="text-[#d95325]">{person.domain}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-[#d95325] text-white flex items-center justify-center font-mono text-2xl font-bold flex-shrink-0 shadow-lg">
                {person.initials}
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold mb-1 block">
                  {person.domain} · Verified Institutional Profile
                </span>
                <h1 className="text-3xl sm:text-5xl font-medium tracking-tight text-white mb-2">
                  {person.name}
                </h1>
                <p className="text-sm sm:text-base text-[#c5c9ce] font-sans">
                  {person.role} at <span className="text-white font-medium">{person.affiliation}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Section */}
        <section className="bg-white py-16 sm:py-20 border-b border-[#e5e3db]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.8fr] gap-12 items-start">
              {/* Left Column: Biography & Expertise */}
              <div className="space-y-10">
                <div>
                  <h2 className="text-xl font-medium text-[#171b22] mb-4 pb-2 border-b border-[#e5e3db]">
                    Professional Overview & Biography
                  </h2>
                  <p className="text-sm sm:text-base text-[#616872] leading-relaxed font-sans">
                    {person.bio}
                  </p>
                </div>

                {person.expertise && person.expertise.length > 0 && (
                  <div>
                    <h2 className="text-xl font-medium text-[#171b22] mb-4 pb-2 border-b border-[#e5e3db]">
                      Core Domains & Competencies
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {person.expertise.map((exp, i) => (
                        <div
                          key={i}
                          className="px-3.5 py-1.5 bg-[#faf9f5] border border-[#e5e3db] text-xs font-medium text-[#171b22] font-sans flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d95325]" />
                          <span>{exp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h2 className="text-xl font-medium text-[#171b22] mb-4 pb-2 border-b border-[#e5e3db]">
                    Institutional Affiliation & Location
                  </h2>
                  <div className="p-4 bg-[#faf9f5] border border-[#e5e3db] space-y-2 text-xs font-sans text-[#616872]">
                    <div className="flex items-center justify-between">
                      <span>Primary Organization:</span>
                      <span className="font-semibold text-[#171b22]">{person.affiliation}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Station / City:</span>
                      <span className="font-semibold text-[#171b22]">{person.location || "National"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Connection & Actions */}
              <div className="p-8 bg-[#faf9f5] border border-[#e5e3db] sticky top-24 shadow-sm space-y-6">
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-[#737a83] mb-4 pb-2 border-b border-[#e5e3db]">
                    Network Actions
                  </div>

                  <button
                    type="button"
                    onClick={handleConnect}
                    className="w-full inline-flex items-center justify-center min-h-[46px] px-6 text-xs font-semibold tracking-wider text-white bg-[#d95325] hover:bg-[#bc3f18] transition-all uppercase shadow-sm mb-3"
                  >
                    Request Institutional Connection
                  </button>

                  <Link
                    href="/network"
                    className="w-full inline-flex items-center justify-center min-h-[40px] px-4 text-xs font-semibold tracking-wider text-[#171b22] border border-[#e5e3db] bg-white hover:bg-[#f7f6f2] transition-all uppercase"
                  >
                    ← Back to Directory
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
