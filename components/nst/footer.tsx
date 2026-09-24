"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#171b22] text-white border-t border-[#3b414a] pt-16 pb-12">
      <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto">
        {/* Top Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 pb-14 border-b border-[#3b414a]">
          {/* Col 1: Brand & Statement */}
          <div className="lg:col-span-2 flex flex-col items-start pr-0 lg:pr-8">
            <Link href="/" className="flex items-baseline gap-0 text-2xl font-medium tracking-tight text-white mb-4">
              <span className="font-sans font-bold">The</span>
              <span className="font-serif italic font-normal text-[28px] tracking-[-0.5px]">NST</span>
            </Link>
            <p className="text-sm text-[#a2a8b2] leading-relaxed max-w-[340px] mb-6 font-sans">
              The National Security Think Tank brings together professionals, researchers, educators, organisations and emerging capabilities.
            </p>
            <div className="text-xs text-[#9299a2] font-mono">
              Independent · Rigorous · National Security Capability
            </div>
          </div>

          {/* Col 2: Explore */}
          <div className="flex flex-col space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-[#d95325] font-semibold mb-1">
              Explore
            </span>
            <Link href="/ecosystem" className="text-sm text-[#c5c9ce] hover:text-white transition-colors">
              Ecosystem
            </Link>
            <Link href="/learn" className="text-sm text-[#c5c9ce] hover:text-white transition-colors">
              TheNST Learn
            </Link>
            <Link href="/research" className="text-sm text-[#c5c9ce] hover:text-white transition-colors">
              Research Desk
            </Link>
            <Link href="/network" className="text-sm text-[#c5c9ce] hover:text-white transition-colors">
              Professional Network
            </Link>
            <Link href="/opportunities" className="text-sm text-[#c5c9ce] hover:text-white transition-colors">
              Opportunities & Briefs
            </Link>
          </div>

          {/* Col 3: Participate */}
          <div className="flex flex-col space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-[#d95325] font-semibold mb-1">
              Participate
            </span>
            <Link href="/educator" className="text-sm text-[#c5c9ce] hover:text-white transition-colors">
              Become an Educator
            </Link>
            <Link href="/drone-pilot" className="text-sm text-[#c5c9ce] hover:text-white transition-colors">
              Become a Drone Pilot
            </Link>
            <Link href="/security-professional" className="text-sm text-[#c5c9ce] hover:text-white transition-colors">
              Become a Security Professional
            </Link>
            <Link href="/about#contact" className="text-sm text-[#c5c9ce] hover:text-white transition-colors">
              Institutional Contact
            </Link>
          </div>

          {/* Col 4: Platform */}
          <div className="flex flex-col space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-[#d95325] font-semibold mb-1">
              Platform
            </span>
            <Link href="/sign-in" className="text-sm text-[#c5c9ce] hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/platform" className="text-sm text-[#c5c9ce] hover:text-white transition-colors">
              Enter Platform
            </Link>
            <Link href="/about" className="text-sm text-[#c5c9ce] hover:text-white transition-colors">
              About TheNST
            </Link>
          </div>
        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#89909a] font-sans">
          <p>© {new Date().getFullYear()} TheNST — The National Security Think Tank. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/about" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/about" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/about" className="hover:text-white transition-colors">
              Code of Conduct
            </Link>
            <Link href="/about#contact" className="hover:text-white transition-colors">
              Contact Desk
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
