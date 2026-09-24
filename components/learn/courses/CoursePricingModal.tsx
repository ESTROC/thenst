"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Check } from "lucide-react";
import { Course, TierPricing } from "@/lib/learn/types";
import { pricingTiers } from "@/data/pricing";
import { accentMap } from "@/lib/learn/accent";

// Maps the static tier ids in data/pricing.ts to the per-course tierPricing keys.
const tierKeyById: Record<string, keyof TierPricing> = {
  students: "students",
  msme: "msmes",
  enterprise: "enterprise",
};

export function CoursePricingModal({ course, onClose }: { course: Course | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {course && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.98 }} transition={{ type: "spring", stiffness: 280, damping: 26 }} className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-[var(--surface)] shadow-hover">
              <div className="relative px-7 pb-7 pt-8 text-white" style={{ backgroundImage: `linear-gradient(135deg, ${course.thumbnailColor} 0%, #0A2540 100%)` }}>
                <button onClick={onClose} aria-label="Close" className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm transition-colors hover:bg-white/25"><X size={18} /></button>
                <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-semibold ring-1 ring-white/25">{course.category}</span>
                <h2 className="mt-3 font-display text-2xl font-bold leading-tight">{course.title}</h2>
                <p className="mt-1.5 max-w-xl text-sm text-white/85">{course.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-white/90">
                  <span className="flex items-center gap-1.5"><Sparkles size={15} /> New course</span>
                  <span>Duration: —</span>
                  <span className="rounded-md bg-white/15 px-2 py-0.5 text-xs font-semibold">{course.level}</span>
                </div>
                <p className="mt-3 text-xs text-white/80">Instructor: {course.instructor || "TBA"}</p>
              </div>
              <div className="px-7 py-7">
                <h3 className="font-display text-lg font-bold text-[var(--ink)]">Choose your plan</h3>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">Pricing tailored to who you are.</p>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {pricingTiers.map((tier) => {
                    const a = accentMap[tier.accent];
                    const live = course.tierPricing?.[tierKeyById[tier.id]];
                    const price = typeof live === "number" ? live : tier.price;
                    return (
                      <div key={tier.id} className={`relative flex flex-col rounded-2xl border bg-[var(--surface)] p-5 transition-shadow hover:shadow-card ${tier.highlight ? "border-emerald shadow-card" : "border-[var(--border)]"}`}>
                        {tier.highlight && (<span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald px-3 py-0.5 text-xs font-semibold text-white">Popular</span>)}
                        <span className={`inline-flex w-fit rounded-md px-2 py-0.5 text-xs font-semibold ${a.soft} ${a.text}`}>{tier.audience}</span>
                        <div className="mt-3 flex items-baseline gap-1"><span className="font-display text-2xl font-bold text-[var(--ink)]">{price === 0 ? "Free" : `₹${price.toLocaleString("en-IN")}`}</span>{price !== 0 && <span className="text-xs text-[var(--ink-soft)]">/ {tier.unit}</span>}</div>
                        <p className="mt-0.5 text-xs text-[var(--ink-soft)]">{tier.note}</p>
                        <ul className="mt-4 flex-1 space-y-2">
                          {tier.perks.map((perk) => (<li key={perk} className="flex items-start gap-2 text-sm text-[var(--ink)]"><Check size={15} className={`mt-0.5 shrink-0 ${a.text}`} />{perk}</li>))}
                        </ul>
                        <button className={`mt-5 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 ${a.bg}`}>Get started</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
