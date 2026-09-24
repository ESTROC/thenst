"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Users, Building2, MapPin, Shield, ArrowRight, ArrowUpRight, CheckCircle2, Filter } from "lucide-react";
import { Navbar } from "@/components/nst/navbar";
import { Footer } from "@/components/nst/footer";
import { NETWORK_PEOPLE, ORGANISATIONS, Person, OrganisationEntity } from "@/lib/nst-data";

const DOMAINS = [
  "All",
  "Strategic Affairs",
  "Defence Technology",
  "Emerging Technology",
  "Drone Systems",
  "Cybersecurity",
  "National Security"
];

export default function NetworkPage() {
  const [tab, setTab] = useState<"people" | "organisations">("people");
  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("All");

  const filteredPeople = NETWORK_PEOPLE.filter((p) => {
    const matchesDomain = selectedDomain === "All" || p.domain === selectedDomain;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.role.toLowerCase().includes(search.toLowerCase()) ||
      p.affiliation.toLowerCase().includes(search.toLowerCase()) ||
      (p.location && p.location.toLowerCase().includes(search.toLowerCase()));
    return matchesDomain && matchesSearch;
  });

  const filteredOrgs = ORGANISATIONS.filter((o) => {
    const matchesSearch =
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.focusArea.toLowerCase().includes(search.toLowerCase()) ||
      o.type.toLowerCase().includes(search.toLowerCase()) ||
      o.location.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f6f2] text-[#171b22]">
      <Navbar />

      <main className="flex-1">
        {/* Intro (Dark Band) */}
        <section className="bg-[#171b22] text-white pt-20 pb-24 border-b border-[#3b414a]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <span className="text-[11px] font-mono uppercase tracking-[2px] text-[#d95325] font-semibold mb-3 block">
              TheNST / Professional Directory
            </span>
            <h1 className="text-4xl sm:text-6xl font-medium leading-[0.98] tracking-[-2.5px] text-white mb-6 max-w-[850px]">
              Discover Professionals, Experts & Organisations.
            </h1>
            <p className="text-base sm:text-lg text-[#c5c9ce] leading-relaxed max-w-[640px] font-sans">
              Connect with vetted practitioners across intelligence, defense technology, autonomous systems and sovereign policy.
            </p>
          </div>
        </section>

        {/* Directory Section */}
        <section className="bg-white py-16 sm:py-20 border-b border-[#e5e3db]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            {/* View Switcher & Search Bar */}
            <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-center justify-between pb-8 mb-10 border-b border-[#e5e3db]">
              {/* Tab Selector */}
              <div className="inline-flex border border-[#e5e3db] bg-[#faf9f5] p-1 self-start">
                <button
                  type="button"
                  onClick={() => setTab("people")}
                  className={`px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                    tab === "people"
                      ? "bg-[#171b22] text-white shadow-sm"
                      : "text-[#737a83] hover:text-[#171b22]"
                  }`}
                >
                  Professionals ({NETWORK_PEOPLE.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTab("organisations")}
                  className={`px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                    tab === "organisations"
                      ? "bg-[#171b22] text-white shadow-sm"
                      : "text-[#737a83] hover:text-[#171b22]"
                  }`}
                >
                  Organisations ({ORGANISATIONS.length})
                </button>
              </div>

              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737a83]" />
                <input
                  type="text"
                  placeholder={`Search ${tab === "people" ? "names, roles, locations..." : "entities, focus areas..."}`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f7f6f2] border border-[#e5e3db] text-xs text-[#171b22] placeholder:text-[#737a83] focus:outline-none focus:border-[#d95325] focus:bg-white transition-all font-sans"
                />
              </div>
            </div>

            {/* Domain Filter Pills for People */}
            {tab === "people" && (
              <div className="flex flex-wrap items-center gap-2 mb-8 pb-6 border-b border-[#e5e3db]/60">
                <span className="text-xs font-mono uppercase tracking-wider text-[#737a83] mr-2">Domain:</span>
                {DOMAINS.map((dom) => (
                  <button
                    key={dom}
                    type="button"
                    onClick={() => setSelectedDomain(dom)}
                    className={`px-3 py-1 text-xs font-medium transition-all ${
                      selectedDomain === dom
                        ? "bg-[#171b22] text-white"
                        : "bg-[#f7f6f2] text-[#4f555d] hover:bg-[#e5e3db]"
                    }`}
                  >
                    {dom}
                  </button>
                ))}
              </div>
            )}

            {/* Content Display: People Tab */}
            {tab === "people" && (
              filteredPeople.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredPeople.map((p) => (
                    <div
                      key={p.id}
                      className="bg-[#faf9f5] border border-[#e5e3db] p-8 flex flex-col justify-between hover:border-[#171b22]/40 transition-all duration-200"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-10 h-10 rounded-full bg-[#171b22] text-white flex items-center justify-center font-mono text-xs font-bold">
                            {p.initials}
                          </div>
                          <span className="text-[10px] font-mono text-[#d95325] font-semibold uppercase tracking-wider">
                            {p.domain}
                          </span>
                        </div>

                        <h3 className="text-xl font-medium tracking-tight text-[#171b22] mb-1">
                          {p.name}
                        </h3>

                        <p className="text-xs text-[#737a83] font-sans mb-3">
                          {p.role} · {p.affiliation}
                        </p>

                        <p className="text-xs text-[#616872] leading-relaxed font-sans mb-6">
                          {p.bio}
                        </p>

                        {p.expertise && p.expertise.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-6">
                            {p.expertise.map((exp, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-white border border-[#e5e3db] text-[10px] font-mono text-[#4f555d]"
                              >
                                {exp}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-[#e5e3db] flex items-center justify-between text-xs font-mono text-[#737a83]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#737a83]" /> {p.location || "National"}
                        </span>
                        <Link
                          href={`/network/${p.id}`}
                          className="text-[#d95325] hover:underline font-semibold"
                        >
                          Profile →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-[#faf9f5] border border-[#e5e3db] p-8">
                  <Users className="w-10 h-10 text-[#737a83] mx-auto mb-4 stroke-1" />
                  <h3 className="text-lg font-medium text-[#171b22] mb-2">No professionals found</h3>
                  <p className="text-xs text-[#737a83] max-w-sm mx-auto mb-6">
                    No directory records match your search query.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setSelectedDomain("All");
                    }}
                    className="px-4 py-2 bg-[#171b22] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#d95325] transition-colors"
                  >
                    Reset Directory Filters
                  </button>
                </div>
              )
            )}

            {/* Content Display: Organisations Tab */}
            {tab === "organisations" && (
              filteredOrgs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {filteredOrgs.map((org) => (
                    <div
                      key={org.id}
                      className="bg-[#faf9f5] border border-[#e5e3db] p-8 flex flex-col justify-between hover:border-[#171b22]/40 transition-all duration-200"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-2 bg-[#171b22] text-white">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold">
                            {org.type}
                          </span>
                        </div>

                        <h3 className="text-2xl font-medium tracking-tight text-[#171b22] mb-2">
                          {org.name}
                        </h3>

                        <p className="text-xs font-mono uppercase text-[#737a83] mb-4">
                          Focus: {org.focusArea}
                        </p>

                        <p className="text-sm text-[#616872] leading-relaxed font-sans mb-6">
                          {org.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-[#e5e3db] flex items-center justify-between text-xs font-mono text-[#737a83]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {org.location}
                        </span>
                        <Link href="/about" className="text-[#d95325] hover:underline font-semibold">
                          Learn More →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-[#faf9f5] border border-[#e5e3db] p-8">
                  <Building2 className="w-10 h-10 text-[#737a83] mx-auto mb-4 stroke-1" />
                  <h3 className="text-lg font-medium text-[#171b22] mb-2">No organisations found</h3>
                  <p className="text-xs text-[#737a83] max-w-sm mx-auto mb-6">
                    No organisations match your search query.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="px-4 py-2 bg-[#171b22] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#d95325] transition-colors"
                  >
                    Clear Search
                  </button>
                </div>
              )
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
