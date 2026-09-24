"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Compass,
  MapPin,
  Calendar,
  Briefcase,
  ArrowRight,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  DollarSign,
  Sparkles,
  SlidersHorizontal,
  X
} from "lucide-react";
import { Navbar } from "@/components/nst/navbar";
import { Footer } from "@/components/nst/footer";
import { OPPORTUNITIES, Opportunity } from "@/lib/nst-data";

const CATEGORIES = [
  "All Categories",
  "Drone Operations",
  "Security & Guarding",
  "Training & Teaching",
  "Research & Reports",
  "Technical Support",
  "Fellowship"
];

const TYPES = ["All Types", "Project", "Direct Placement", "Participation", "Collaboration", "Fellowship"];

const SORT_OPTIONS = [
  { label: "Recommended / Default", value: "recommended" },
  { label: "Pay: Highest First", value: "pay-desc" },
  { label: "Pay: Lowest First", value: "pay-asc" },
  { label: "Job Title (A to Z)", value: "title-asc" },
  { label: "Location (A to Z)", value: "location-asc" }
];

export default function OpportunitiesPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedType, setSelectedType] = useState("All Types");
  const [sortBy, setSortBy] = useState("recommended");
  const [remoteOnly, setRemoteOnly] = useState(false);

  // Filter and sort opportunities
  const processedOpportunities = useMemo(() => {
    let list = [...OPPORTUNITIES];

    // Filter by search query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (opp) =>
          opp.title.toLowerCase().includes(q) ||
          opp.organisation.toLowerCase().includes(q) ||
          opp.description.toLowerCase().includes(q) ||
          opp.location.toLowerCase().includes(q) ||
          opp.category.toLowerCase().includes(q) ||
          (opp.requirements && opp.requirements.some((r) => r.toLowerCase().includes(q)))
      );
    }

    // Filter by Category
    if (selectedCategory !== "All Categories") {
      list = list.filter((opp) => opp.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Filter by Type
    if (selectedType !== "All Types") {
      list = list.filter((opp) => opp.type.toLowerCase() === selectedType.toLowerCase());
    }

    // Filter by Remote Only
    if (remoteOnly) {
      list = list.filter((opp) => opp.location.toLowerCase().includes("remote"));
    }

    // Sort list
    list.sort((a, b) => {
      if (sortBy === "pay-desc") {
        return (b.payAmount || 0) - (a.payAmount || 0);
      }
      if (sortBy === "pay-asc") {
        return (a.payAmount || 0) - (b.payAmount || 0);
      }
      if (sortBy === "title-asc") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "location-asc") {
        return a.location.localeCompare(b.location);
      }
      return 0; // default order
    });

    return list;
  }, [search, selectedCategory, selectedType, sortBy, remoteOnly]);

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCategory !== "All Categories" ||
    selectedType !== "All Types" ||
    remoteOnly ||
    sortBy !== "recommended";

  const clearAllFilters = () => {
    setSearch("");
    setSelectedCategory("All Categories");
    setSelectedType("All Types");
    setSortBy("recommended");
    setRemoteOnly(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f6f2] text-[#171b22]">
      <Navbar />

      <main className="flex-1">
        {/* Header Hero Section */}
        <section className="bg-[#171b22] text-white pt-16 pb-20 border-b border-[#3b414a]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#242b35] border border-[#3b414a] text-[11px] font-mono uppercase tracking-widest text-[#d95325] font-semibold mb-4 rounded-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Open Jobs, Projects & Field Missions
            </div>
            <h1 className="text-3xl sm:text-5xl font-medium leading-[1.05] tracking-[-1.5px] text-white mb-4 max-w-[850px]">
              Find Real Opportunities with Clear Pay.
            </h1>
            <p className="text-sm sm:text-base text-[#c5c9ce] leading-relaxed max-w-[640px] font-sans">
              Explore verified security openings, drone flight missions, instructor roles, and research projects. Sort by pay, category, and location to find the best match for you.
            </p>
          </div>
        </section>

        {/* Filter, Sort & Job Listings Section */}
        <section className="py-12 sm:py-16">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto space-y-8">
            
            {/* Control Panel: Search + Sorting Dropdown + Remote Toggle */}
            <div className="bg-white border border-[#e5e3db] p-5 sm:p-6 shadow-sm rounded-sm space-y-5">
              
              {/* Row 1: Search & Sorting */}
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                
                {/* Search Box */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737a83]" />
                  <input
                    type="text"
                    placeholder="Search by job title, skill, city, or organisation..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-[#f7f6f2] border border-[#e5e3db] text-sm text-[#171b22] placeholder:text-[#737a83] focus:outline-none focus:border-[#d95325] focus:bg-white transition-all font-sans"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737a83] hover:text-[#171b22]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Sort By Dropdown */}
                <div className="flex items-center gap-2 min-w-[240px]">
                  <ArrowUpDown className="w-4 h-4 text-[#d95325] flex-shrink-0" />
                  <div className="flex-1">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#737a83] mb-1">
                      Sort Techniques:
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full py-2 px-3 bg-[#f7f6f2] border border-[#e5e3db] text-xs font-medium text-[#171b22] focus:outline-none focus:border-[#d95325] transition-all cursor-pointer font-sans"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Remote Only Switch */}
                <button
                  type="button"
                  onClick={() => setRemoteOnly(!remoteOnly)}
                  className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border transition-all flex items-center gap-2 self-start md:self-end h-[42px] ${
                    remoteOnly
                      ? "bg-[#171b22] text-white border-[#171b22]"
                      : "bg-[#f7f6f2] text-[#4f555d] border-[#e5e3db] hover:border-[#171b22]"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${remoteOnly ? "bg-[#d95325]" : "bg-[#9299a2]"}`} />
                  Remote Only
                </button>
              </div>

              {/* Row 2: Category Filter Badges */}
              <div className="space-y-2 pt-3 border-t border-[#e5e3db]">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#737a83] flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#d95325]" />
                  <span>Filter by Category:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 text-xs font-medium transition-all rounded-sm ${
                        selectedCategory === cat
                          ? "bg-[#d95325] text-white shadow-sm font-semibold"
                          : "bg-[#f7f6f2] text-[#4f555d] hover:bg-[#e5e3db] border border-transparent"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 3: Role / Engagement Type */}
              <div className="space-y-2 pt-3 border-t border-[#e5e3db]">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#737a83]">
                  Filter by Role Type:
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedType(t)}
                      className={`px-3 py-1 text-xs font-medium transition-all ${
                        selectedType === t
                          ? "bg-[#171b22] text-white"
                          : "bg-[#f7f6f2] text-[#616872] hover:bg-[#e5e3db]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Header Bar */}
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#737a83] px-1">
              <span>
                Showing <strong className="text-[#171b22]">{processedOpportunities.length}</strong> Available Opportunities
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-[#d95325] hover:underline font-semibold flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Reset Filters
                </button>
              )}
            </div>

            {/* Opportunities List Cards */}
            {processedOpportunities.length > 0 ? (
              <div className="grid grid-cols-1 gap-5">
                {processedOpportunities.map((opp) => (
                  <div
                    key={opp.id}
                    className="bg-white border border-[#e5e3db] p-6 sm:p-8 hover:border-[#171b22] transition-all shadow-sm group relative"
                  >
                    <div className="flex flex-col lg:flex-row justify-between lg:items-start gap-6">
                      
                      {/* Left: Main Details */}
                      <div className="space-y-3 flex-1 max-w-3xl">
                        
                        {/* Badges strip */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                          <span className="px-2.5 py-0.5 bg-[#f0eee6] text-[#171b22] font-semibold uppercase tracking-wider border border-[#e5e3db]">
                            {opp.category}
                          </span>
                          <span className="px-2.5 py-0.5 bg-[#fff3ee] text-[#d95325] font-semibold uppercase tracking-wider border border-[#ffd5c4]">
                            {opp.type}
                          </span>
                          <span className="text-[#737a83] flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#737a83]" />
                            {opp.location}
                          </span>
                        </div>

                        {/* Title */}
                        <Link
                          href={`/opportunities/${opp.id}`}
                          className="text-xl sm:text-2xl font-medium text-[#171b22] group-hover:text-[#d95325] transition-colors block"
                        >
                          {opp.title}
                        </Link>

                        {/* Organisation */}
                        <div className="text-xs text-[#737a83] font-medium font-sans">
                          Posted by: <span className="text-[#171b22] font-semibold">{opp.organisation}</span>
                        </div>

                        {/* Description */}
                        <p className="text-xs sm:text-sm text-[#4f555d] leading-relaxed font-sans pt-1">
                          {opp.description}
                        </p>

                        {/* Quick Requirements */}
                        {opp.requirements && opp.requirements.length > 0 && (
                          <div className="pt-2 space-y-1.5">
                            <div className="text-[11px] font-mono uppercase tracking-wider text-[#737a83]">
                              What you need:
                            </div>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {opp.requirements.map((req, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs text-[#4f555d]">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2e7d32] flex-shrink-0 mt-0.5" />
                                  <span>{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Right: Compensation & Apply Action */}
                      <div className="lg:w-64 flex flex-col justify-between items-start lg:items-end gap-4 p-4 bg-[#faf9f5] border border-[#e5e3db] self-stretch">
                        
                        <div className="space-y-1 lg:text-right w-full">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#737a83] block">
                            Compensation / Pay
                          </span>
                          <div className="text-lg font-bold text-[#171b22] font-mono">
                            {opp.compensation || "Institutional Rate"}
                          </div>
                          <div className="text-[11px] text-[#737a83] font-sans flex items-center gap-1 lg:justify-end">
                            <Calendar className="w-3 h-3 text-[#d95325]" />
                            <span>Deadline: <strong className="text-[#171b22]">{opp.deadline || "Rolling"}</strong></span>
                          </div>
                        </div>

                        <Link
                          href={`/opportunities/${opp.id}`}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#171b22] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#d95325] transition-all text-center shadow-sm"
                        >
                          <span>View & Apply</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-20 bg-white border border-[#e5e3db] p-8 space-y-4">
                <Compass className="w-12 h-12 text-[#737a83] mx-auto stroke-1" />
                <h3 className="text-lg font-medium text-[#171b22]">No matching opportunities found</h3>
                <p className="text-xs sm:text-sm text-[#737a83] max-w-md mx-auto leading-relaxed">
                  We couldn't find any opportunities matching your active filters or search terms. Try clearing some filters or searching for something else.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-5 py-2.5 bg-[#171b22] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#d95325] transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
