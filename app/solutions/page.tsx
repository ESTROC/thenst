"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Shield, 
  ArrowLeft, 
  FileText, 
  Target, 
  Cpu, 
  Radio, 
  ExternalLink,
  ChevronRight,
  Database,
  TrendingUp,
  MapPin,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion } from "framer-motion";

export default function SolutionsPage() {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  return (
    <main className="min-h-screen flex flex-col bg-slate-50 relative font-sans selection:bg-saffron/30">
      
      {/* Tactical Grid Background overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a08_1px,transparent_1px),linear-gradient(to_bottom,#0f172a08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      {/* Tricolour atmosphere glow */}
      <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] rounded-full bg-saffron/5 blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-india-green/5 blur-[120px] pointer-events-none z-0" />

      {/* Top Navbar */}
      <header className="sticky top-0 w-full z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100 mr-2">
                <ArrowLeft className="w-5 h-5 text-ashoka-blue" />
              </Button>
            </Link>
            <div className="flex items-center gap-2.5">
              <Radio className="h-5 w-5 text-saffron animate-pulse" />
              <span className="text-xl font-black tracking-[0.2em] text-ashoka-blue uppercase italic">TheNST</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-xs font-bold text-ashoka-blue hover:bg-ashoka-blue/5 rounded-none px-6 uppercase tracking-widest leading-none">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="text-xs font-black bg-saffron hover:bg-saffron/90 text-white rounded-none px-6 uppercase tracking-widest shadow-xl leading-none">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content Body */}
      <div className="mx-auto max-w-7xl px-6 py-16 w-full flex-1 z-10">
        
        {/* Page Title */}
        <div className="max-w-3xl mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 border border-saffron/20 bg-saffron/5 px-4 py-1 text-[10px] font-bold text-saffron tracking-[0.2em] uppercase rounded-lg">
            <Shield className="h-3.5 w-3.5" />
            <span>National Defense & Tactical Technology</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-ashoka-blue tracking-tight uppercase leading-none">
            Counter-UAS (C-UAS) Solutions
          </h1>
          <p className="text-slate-650 text-base md:text-lg font-medium leading-relaxed">
            Leading-edge airspace surveillance, drone mitigation, and tactical sensor integration architectures tailored for India's strategic, homeland defense, and smart enterprise demands.
          </p>
        </div>

        {/* Highlight Feature Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Panel: Market & Tech Breakdown */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-ashoka-blue uppercase tracking-wider">
                Airspace Domain Dominance
              </h2>
              <div className="h-1 w-20 bg-saffron" />
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Modern conflicts and homeland security demands dictate comprehensive protection against tactical unmanned aerial systems. TheNST integrates military-grade sensing, radar architectures, and RF jamming technologies to ensure zero airspace intrusion.
              </p>
            </div>

            {/* Strategic Value Proposition Grid */}
            <div className="grid gap-4">
              {[
                { 
                  title: "Border Security Requirements", 
                  desc: "Mitigate battlefield drone proliferation across high-tension regional borderlines.", 
                  icon: Target, 
                  color: "border-saffron bg-saffron/5" 
                },
                { 
                  title: "Critical Infrastructure Protection", 
                  desc: "Comprehensive shield arrays surrounding refineries, power grids, oil & gas hubs, airports, and seaports.", 
                  icon: Shield, 
                  color: "border-ashoka-blue bg-blue-50/50" 
                },
                { 
                  title: "Command & Control Systems", 
                  desc: "Multisensor fusion processing powered by AI-enabled edge computing and radar sensing.", 
                  icon: Cpu, 
                  color: "border-india-green bg-emerald-50/30" 
                }
              ].map((item, idx) => (
                <div key={idx} className={`p-5 rounded-2xl border border-slate-200/60 shadow-sm flex gap-4 ${item.color}`}>
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                    <item.icon className="w-5 h-5 text-ashoka-blue" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-ashoka-blue uppercase tracking-wider mb-1">{item.title}</h3>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Metrics */}
            <div className="p-6 bg-slate-900 text-white rounded-2xl relative overflow-hidden shadow-xl border border-slate-800">
              <div className="absolute top-[-20%] right-[-10%] w-40 h-40 rounded-full bg-saffron/10 blur-xl pointer-events-none" />
              <h4 className="text-[10px] font-black tracking-[0.2em] uppercase text-saffron mb-3">Indian Market Potential</h4>
              <div className="text-2xl font-black mb-1 text-slate-100 flex items-baseline gap-1">
                ~₹12,000 Crore
                <span className="text-xs text-slate-400 font-bold">(~USD 1.5B)</span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                Projected over the next 5 years based on the strict requirements for nearly 1,200 anti-drone security installations in key regions.
              </p>
            </div>
          </div>

          {/* Right Panel: Interactive Infographic Container */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">C-UAS Strategic Opportunity Map</h3>
                <p className="text-xs font-medium text-slate-400">Click the infographic below to zoom into high-resolution metrics</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsLightboxOpen(true)}
                className="gap-1.5 rounded-xl text-xs font-bold border-slate-200 text-ashoka-blue"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Full Resolution
              </Button>
            </div>

            {/* Glowing Infographic Showcase */}
            <div className="relative flex justify-center w-full">
              <div className="absolute inset-0 bg-gradient-to-tr from-saffron/5 via-ashoka-blue/5 to-india-green/5 blur-3xl pointer-events-none rounded-3xl" />
              
              <motion.div 
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.4 }}
                className="relative p-2.5 bg-white rounded-3xl border border-slate-250/70 shadow-2xl overflow-hidden group cursor-pointer w-full"
                onClick={() => setIsLightboxOpen(true)}
              >
                {/* Tactical Corner Elements */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-saffron z-20" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-india-green z-20" />
                
                {/* Glow Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-ashoka-blue/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />

                <img 
                  src="/images/counter-uas.jpg" 
                  alt="Counter-UAS (C-UAS) Market Opportunity Infographic" 
                  className="w-full h-auto rounded-2xl object-contain transition-all duration-700 shadow-sm"
                />
              </motion.div>
            </div>
            
            {/* Infographic Caption Card */}
            <div className="p-4 bg-white rounded-xl border border-slate-200/50 shadow-sm flex items-start gap-3">
              <Radio className="w-5 h-5 text-saffron shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Source & Intelligence</span>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Data aggregated from industry reports, Indian defense assessments, military doctrine updates, and homeland security market research.
                </p>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Lightbox Dialog Modal */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-4xl bg-white/95 backdrop-blur-md rounded-3xl p-4 border border-slate-200/50 shadow-2xl flex items-center justify-center">
          <div className="relative w-full max-h-[85vh] overflow-auto">
            <img 
              src="/images/counter-uas.jpg" 
              alt="Counter-UAS (C-UAS) Market Opportunity Infographic" 
              className="w-full h-auto object-contain rounded-2xl"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Tactical Blueprint Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8 text-center text-slate-450 z-10 relative">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold">
          <p>© {new Date().getFullYear()} TheNST Solutions. All rights reserved. Secure Airspace Operations.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-white transition-colors">Tactical Overview</Link>
            <span className="text-slate-700">•</span>
            <Link href="/" className="hover:text-white transition-colors">Direct Deployment</Link>
          </div>
        </div>
      </footer>

    </main>
  );
}
