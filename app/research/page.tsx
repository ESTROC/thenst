"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, BookOpen, Clock, FileText, ArrowRight, ArrowUpRight, Download, Share2, Tag } from "lucide-react";
import { Navbar } from "@/components/nst/navbar";
import { Footer } from "@/components/nst/footer";
import { ARTICLES, Article } from "@/lib/nst-data";

const CATEGORIES = [
  "All",
  "Strategic Affairs",
  "Defence Technology",
  "Emerging Technology",
  "Cybersecurity",
  "National Security"
];

export default function ResearchPage() {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");

  const featuredArticle = ARTICLES.find((a) => a.featured) || ARTICLES[0];

  const filteredArticles = ARTICLES.filter((a) => {
    const matchesCat = selectedCat === "All" || a.category === selectedCat;
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f6f2] text-[#171b22]">
      <Navbar />

      <main className="flex-1">
        {/* Intro (Dark Band) */}
        <section className="bg-[#171b22] text-white pt-20 pb-24 border-b border-[#3b414a]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <span className="text-[11px] font-mono uppercase tracking-[2px] text-[#d95325] font-semibold mb-3 block">
              TheNST / Research & Intelligence Desk
            </span>
            <h1 className="text-4xl sm:text-6xl font-medium leading-[0.98] tracking-[-2.5px] text-white mb-6 max-w-[850px]">
              Independent Analysis. Rigorous Inquiry.
            </h1>
            <p className="text-base sm:text-lg text-[#c5c9ce] leading-relaxed max-w-[640px] font-sans">
              Peer-reviewed intelligence briefs, doctrinal analyses, and technology assessments covering multi-domain security, autonomous systems, and strategic geopolitics.
            </p>
          </div>
        </section>

        {/* Featured Monograph Spotlight */}
        <section className="bg-white py-16 border-b border-[#e5e3db]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#737a83] mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#d95325]" />
              <span>Editorially Highlighted · Featured Monograph</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 bg-[#171b22] text-white p-8 sm:p-12 border border-[#3b414a]">
              <div className="flex flex-col justify-center items-start">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold mb-3">
                  {featuredArticle.category} Desk
                </span>
                <h2 className="text-2xl sm:text-4xl font-medium leading-tight tracking-[-1px] text-white mb-4">
                  {featuredArticle.title}
                </h2>
                <p className="text-sm text-[#b8bec5] leading-relaxed mb-6 font-sans">
                  {featuredArticle.summary}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#9299a2] mb-8 pb-4 border-b border-[#3b414a]/70 w-full">
                  <span>Author: {featuredArticle.author}</span>
                  <span>•</span>
                  <span>{featuredArticle.date}</span>
                  <span>•</span>
                  <span>{featuredArticle.readTime}</span>
                </div>

                <Link
                  href={`/research/${featuredArticle.id}`}
                  className="inline-flex items-center justify-center min-h-[44px] px-6 text-xs font-semibold tracking-wider text-white bg-[#d95325] hover:bg-[#bc3f18] uppercase transition-all"
                >
                  Read Intelligence Monograph →
                </Link>
              </div>

              <div className="relative min-h-[280px] overflow-hidden border border-[#3b414a]">
                <img
                  src={featuredArticle.image}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover grayscale-[25%]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Latest & Archive Section */}
        <section className="bg-[#faf9f5] py-16 sm:py-20 border-b border-[#e5e3db]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-center justify-between pb-8 mb-10 border-b border-[#e5e3db]">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737a83]" />
                <input
                  type="text"
                  placeholder="Search articles, monographs, keywords..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e5e3db] text-xs text-[#171b22] placeholder:text-[#737a83] focus:outline-none focus:border-[#d95325] transition-all font-sans"
                />
              </div>

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

            <div className="text-xs font-mono uppercase tracking-widest text-[#737a83] mb-6 flex items-center justify-between">
              <span>Chronological Intelligence Stream ({filteredArticles.length})</span>
              <span>Peer-Reviewed Institutional Publications</span>
            </div>

            {/* Articles List / Grid */}
            {filteredArticles.length > 0 ? (
              <div className="divide-y divide-[#e5e3db] border-t border-b border-[#e5e3db] bg-white">
                {filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    className="p-6 sm:p-8 flex flex-col md:flex-row justify-between md:items-center gap-6 hover:bg-[#faf9f5] transition-colors group"
                  >
                    <div className="max-w-3xl">
                      <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-[#737a83] mb-2">
                        <span className="text-[#d95325] font-semibold">{article.category}</span>
                        <span>•</span>
                        <span>{article.date}</span>
                        <span>•</span>
                        <span>{article.readTime}</span>
                        <span>•</span>
                        <span>{article.author}</span>
                      </div>

                      <Link
                        href={`/research/${article.id}`}
                        className="text-xl sm:text-2xl font-medium text-[#171b22] group-hover:text-[#d95325] transition-colors block mb-2"
                      >
                        {article.title}
                      </Link>

                      <p className="text-xs sm:text-sm text-[#616872] leading-relaxed font-sans">
                        {article.summary}
                      </p>
                    </div>

                    <Link
                      href={`/research/${article.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#171b22] group-hover:text-[#d95325] whitespace-nowrap self-start md:self-center transition-colors"
                    >
                      <span>Read Brief</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white border border-[#e5e3db] p-8">
                <FileText className="w-10 h-10 text-[#737a83] mx-auto mb-4 stroke-1" />
                <h3 className="text-lg font-medium text-[#171b22] mb-2">No articles found</h3>
                <p className="text-xs text-[#737a83] max-w-sm mx-auto mb-6">
                  No research monographs match your search criteria.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedCat("All");
                  }}
                  className="px-4 py-2 bg-[#171b22] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#d95325] transition-colors"
                >
                  Clear Filters
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
