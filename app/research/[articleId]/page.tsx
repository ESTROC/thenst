"use client";

import React, { use } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, User, Share2, Download, CheckCircle2, FileText, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/nst/navbar";
import { Footer } from "@/components/nst/footer";
import { ARTICLES } from "@/lib/nst-data";
import { toast } from "sonner";

export default function ArticleDetailPage({ params }: { params: Promise<{ articleId: string }> }) {
  const resolvedParams = use(params);
  const article = ARTICLES.find((a) => a.id === resolvedParams.articleId);

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f7f6f2] text-[#171b22]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center bg-white border border-[#e5e3db] p-8">
            <h1 className="text-2xl font-medium mb-3">Monograph Not Found</h1>
            <p className="text-sm text-[#737a83] mb-6">The requested research brief does not exist or has been relocated.</p>
            <Link
              href="/research"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#171b22] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#d95325] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Research Desk
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success("Monograph link copied to clipboard!");
  };

  const handleDownload = () => {
    toast.success("Briefing summary document generated.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f6f2] text-[#171b22]">
      <Navbar />

      <main className="flex-1">
        {/* Breadcrumb & Article Header */}
        <div className="bg-[#171b22] text-white border-b border-[#3b414a] pt-12 pb-16">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="flex items-center gap-2 text-xs font-mono text-[#9299a2] mb-6">
              <Link href="/" className="hover:text-white transition-colors">TheNST</Link>
              <span>/</span>
              <Link href="/research" className="hover:text-white transition-colors">Research</Link>
              <span>/</span>
              <span className="text-[#d95325]">{article.category}</span>
            </div>

            <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold mb-3 block">
              {article.category} Intelligence Monograph
            </span>

            <h1 className="text-3xl sm:text-5xl font-medium tracking-tight text-white mb-6 max-w-[900px] leading-tight">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-xs font-mono text-[#9299a2] pt-4 border-t border-[#3b414a]/80">
              <span>Author: {article.author} ({article.authorRole || "Research Fellow"})</span>
              <span>•</span>
              <span>Published: {article.date}</span>
              <span>•</span>
              <span>{article.readTime}</span>
            </div>
          </div>
        </div>

        {/* Monograph Body Section */}
        <section className="bg-white py-16 sm:py-20 border-b border-[#e5e3db]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.8fr] gap-12 items-start">
              {/* Left Column: Article Text */}
              <div className="space-y-8">
                {/* Executive Summary Box */}
                <div className="p-6 sm:p-8 bg-[#faf9f5] border-l-4 border-[#d95325] border-y border-r border-[#e5e3db]">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold mb-2 block">
                    Executive Summary
                  </span>
                  <p className="text-sm sm:text-base text-[#171b22] leading-relaxed font-sans font-medium">
                    {article.summary}
                  </p>
                </div>

                {/* Key Takeaways */}
                {article.keyTakeaways && article.keyTakeaways.length > 0 && (
                  <div>
                    <h2 className="text-xl font-medium text-[#171b22] mb-4 pb-2 border-b border-[#e5e3db]">
                      Strategic Implications & Key Takeaways
                    </h2>
                    <ul className="space-y-3">
                      {article.keyTakeaways.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-[#616872] font-sans">
                          <CheckCircle2 className="w-4 h-4 text-[#d95325] flex-shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Full Article Content Paragraphs */}
                <div className="space-y-6 pt-4 border-t border-[#e5e3db]">
                  <h2 className="text-xl font-medium text-[#171b22] mb-2">
                    Analysis & Assessment
                  </h2>
                  {article.content && article.content.length > 0 ? (
                    article.content.map((p, idx) => (
                      <p key={idx} className="text-sm sm:text-base text-[#4f555d] leading-relaxed font-sans">
                        {p}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-[#4f555d] leading-relaxed font-sans">
                      {article.summary}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Actions & Desk Metadata */}
              <div className="p-8 bg-[#faf9f5] border border-[#e5e3db] sticky top-24 shadow-sm space-y-6">
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-[#737a83] mb-4 pb-2 border-b border-[#e5e3db]">
                    Institutional Actions
                  </div>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 text-xs font-semibold tracking-wider text-white bg-[#171b22] hover:bg-[#d95325] transition-all uppercase"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Executive Brief
                    </button>
                    <button
                      type="button"
                      onClick={handleShare}
                      className="w-full inline-flex items-center justify-center gap-2 min-h-[40px] px-4 text-xs font-semibold tracking-wider text-[#171b22] border border-[#e5e3db] bg-white hover:bg-[#f7f6f2] transition-all uppercase"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share Monograph Link
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#e5e3db]">
                  <div className="text-xs font-mono uppercase tracking-widest text-[#737a83] mb-3">
                    Contributing Author
                  </div>
                  <div className="text-sm font-semibold text-[#171b22]">{article.author}</div>
                  <div className="text-xs text-[#737a83] font-sans mt-0.5">{article.authorRole || "Research Fellow"}</div>
                </div>

                <div className="pt-4 border-t border-[#e5e3db]">
                  <Link
                    href="/research"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#d95325] uppercase tracking-wider hover:underline"
                  >
                    ← Back to Research Desk
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
