"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Shield, BookOpen, Users, Compass, Mail, Send, CheckCircle2, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/nst/navbar";
import { Footer } from "@/components/nst/footer";
import { toast } from "sonner";

export default function AboutPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitted(true);
    toast.success("Inquiry received. The institutional contact desk will respond shortly.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f6f2] text-[#171b22]">
      <Navbar />

      <main className="flex-1">
        {/* Intro (Dark Band) */}
        <section className="bg-[#171b22] text-white pt-20 pb-24 border-b border-[#3b414a]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <span className="text-[11px] font-mono uppercase tracking-[2px] text-[#d95325] font-semibold mb-3 block">
              TheNST / Institutional Mission
            </span>
            <h1 className="text-4xl sm:text-6xl font-medium leading-[0.98] tracking-[-2.5px] text-white mb-6 max-w-[850px]">
              About The National Security Think Tank.
            </h1>
            <p className="text-base sm:text-lg text-[#c5c9ce] leading-relaxed max-w-[640px] font-sans">
              Building a connected, rigorous, and enduring capability across the security landscape through research, education, and professional collaboration.
            </p>
          </div>
        </section>

        {/* Mission & Purpose Section */}
        <section className="bg-white py-20 sm:py-24 border-b border-[#e5e3db]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.8fr] gap-12 lg:gap-20 items-start">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-[2px] text-[#737a83] font-semibold">
                  OUR PURPOSE
                </span>
                <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#171b22] mt-3">
                  Why TheNST exists.
                </h2>
              </div>

              <div className="space-y-6 text-base text-[#4f555d] leading-relaxed font-sans">
                <p>
                  Contemporary national security challenges require far more than isolated departmental responses. The convergence of cyber warfare, autonomous systems, maritime contestation, and strategic economic competition demands shared capability between defense practitioners, technology researchers, educators, and enterprise leaders.
                </p>
                <p>
                  TheNST functions as an independent institutional bridge. We provide the intellectual doctrine, accredited curriculum, and professional pathways needed to translate specialized knowledge into operational readiness.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Principles & Editorial Standards */}
        <section className="bg-[#faf9f5] py-20 sm:py-24 border-b border-[#e5e3db]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="text-[11px] font-mono uppercase tracking-[2px] text-[#737a83] font-semibold mb-3">
              INSTITUTIONAL FOUNDATION
            </div>
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#171b22] mb-12">
              Our Core Principles
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 bg-white border border-[#e5e3db]">
                <span className="text-xs font-mono font-bold text-[#d95325] block mb-4">01 / Rigor</span>
                <h3 className="text-xl font-medium text-[#171b22] mb-3">Analytical Independence</h3>
                <p className="text-xs sm:text-sm text-[#616872] leading-relaxed font-sans">
                  Our research monographs and assessments adhere to strict methodological review, open evidence standards, and non-partisan strategic inquiry.
                </p>
              </div>

              <div className="p-8 bg-white border border-[#e5e3db]">
                <span className="text-xs font-mono font-bold text-[#d95325] block mb-4">02 / Competence</span>
                <h3 className="text-xl font-medium text-[#171b22] mb-3">Practitioner-Led Pedagogy</h3>
                <p className="text-xs sm:text-sm text-[#616872] leading-relaxed font-sans">
                  Curricula on TheNST Learn are authored and reviewed by experienced field operators, senior defense analysts, and domain researchers.
                </p>
              </div>

              <div className="p-8 bg-white border border-[#e5e3db]">
                <span className="text-xs font-mono font-bold text-[#d95325] block mb-4">03 / Trust</span>
                <h3 className="text-xl font-medium text-[#171b22] mb-3">Institutional Integrity</h3>
                <p className="text-xs sm:text-sm text-[#616872] leading-relaxed font-sans">
                  We build genuine capability without manufactured claims, providing clear verification and high-security collaboration standards.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact & Desk Inquiries */}
        <section id="contact" className="bg-white py-20 sm:py-24 border-b border-[#e5e3db]">
          <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-12 lg:gap-16 items-start">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-[2px] text-[#737a83] font-semibold">
                  COMMUNICATION
                </span>
                <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#171b22] mt-3 mb-4">
                  Institutional Contact Desk
                </h2>
                <p className="text-sm text-[#616872] leading-relaxed font-sans mb-8">
                  For institutional partnerships, research contributions, faculty inquiries, or official correspondence, reach out directly to the desk.
                </p>

                <div className="space-y-4 text-xs font-mono text-[#737a83] pt-6 border-t border-[#e5e3db]">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#d95325]" />
                    <span>desk@thenst.co</span>
                  </div>
                  <div>Office Hours: Monday – Friday, 09:00 – 18:00 IST</div>
                </div>
              </div>

              {/* Form */}
              <div className="p-8 sm:p-10 bg-[#faf9f5] border border-[#e5e3db]">
                {submitted ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-[#171b22] mb-1">Inquiry Submitted</h3>
                    <p className="text-xs text-[#737a83]">Thank you for reaching out. We will respond to your official address shortly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitContact} className="space-y-4">
                    <div>
                      <label className="text-xs font-mono uppercase tracking-wider text-[#737a83] block mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Dr. Raghav Sharma"
                        className="w-full px-4 py-2.5 bg-white border border-[#e5e3db] text-xs text-[#171b22] focus:outline-none focus:border-[#d95325]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-mono uppercase tracking-wider text-[#737a83] block mb-1.5">
                          Official Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="r.sharma@institution.org"
                          className="w-full px-4 py-2.5 bg-white border border-[#e5e3db] text-xs text-[#171b22] focus:outline-none focus:border-[#d95325]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-mono uppercase tracking-wider text-[#737a83] block mb-1.5">
                          Organisation / Affiliation
                        </label>
                        <input
                          type="text"
                          value={org}
                          onChange={(e) => setOrg(e.target.value)}
                          placeholder="Think Tank / University / Agency"
                          className="w-full px-4 py-2.5 bg-white border border-[#e5e3db] text-xs text-[#171b22] focus:outline-none focus:border-[#d95325]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-mono uppercase tracking-wider text-[#737a83] block mb-1.5">
                        Inquiry / Topic *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Please state the nature of your inquiry or collaboration proposal..."
                        className="w-full px-4 py-2.5 bg-white border border-[#e5e3db] text-xs text-[#171b22] focus:outline-none focus:border-[#d95325]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center min-h-[44px] px-6 text-xs font-semibold tracking-wider text-white bg-[#171b22] hover:bg-[#d95325] transition-all uppercase"
                    >
                      Submit Official Inquiry
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
