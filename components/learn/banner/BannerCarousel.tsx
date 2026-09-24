"use client";

import { ArrowRight, Sparkles, Tag, Megaphone, Lightbulb, Video } from "lucide-react";
import { BannerCard, BannerCategory } from "@/lib/learn/types";
import { accentMap, accentGradient } from "@/lib/learn/accent";

const icons: Record<BannerCategory, React.ElementType> = {
  Featured: Sparkles,
  Offer: Tag,
  Announcement: Megaphone,
  Trivia: Lightbulb,
  Webinar: Video,
};

function Card({ card }: { card: BannerCard }) {
  const g = accentGradient[card.accent];
  const Icon = icons[card.category];
  return (
    <div
      className="group/card relative h-36 w-80 shrink-0 overflow-hidden rounded-2xl p-5 text-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-hover"
      style={{ backgroundImage: `linear-gradient(135deg, ${g.from} 0%, ${g.to} 100%)` }}
    >
      {/* glow orb top-right */}
      <span
        className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full opacity-40 blur-2xl transition-opacity duration-300 group-hover/card:opacity-60"
        style={{ background: g.glow }}
      />
      {/* subtle dotted texture */}
      <span
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,.9) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />
      {/* sheen sweep on hover */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/card:translate-x-full" />

      <div className="relative flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white backdrop-blur-sm ring-1 ring-white/30">
          <Icon size={15} />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-white/90">
          {card.category}
        </span>
      </div>

      <h3 className="relative mt-3 font-display text-base font-semibold leading-tight drop-shadow-sm">
        {card.title}
      </h3>
      <p className="relative mt-1 text-sm text-white/80">{card.subtitle}</p>

      <button className="relative mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm transition-colors hover:bg-white/25">
        {card.cta}
        <ArrowRight size={14} className="transition-transform group-hover/card:translate-x-1" />
      </button>
    </div>
  );
}

export function BannerCarousel({ cards }: { cards: BannerCard[] }) {
  const loop = [...cards, ...cards];
  return (
    <div className="banner-mask relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[var(--bg)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[var(--bg)] to-transparent" />
      <div className="banner-track flex w-max gap-4">
        {loop.map((c, i) => (
          <Card key={`${c.id}-${i}`} card={c} />
        ))}
      </div>
    </div>
  );
}
