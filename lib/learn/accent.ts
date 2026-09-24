import { AccentColor } from "@/lib/learn/types";

export const accentMap: Record<AccentColor, { bg: string; soft: string; text: string }> = {
  sky:     { bg: "bg-sky",     soft: "bg-sky-soft",     text: "text-sky" },
  amber:   { bg: "bg-amber",   soft: "bg-amber-soft",   text: "text-amber" },
  emerald: { bg: "bg-emerald", soft: "bg-emerald-soft", text: "text-emerald" },
  violet:  { bg: "bg-violet",  soft: "bg-violet-soft",  text: "text-violet" },
};

export const accentGradient: Record<AccentColor, { from: string; to: string; glow: string }> = {
  sky:     { from: "#2E90FA", to: "#0A2540", glow: "#5BAEFF" },
  amber:   { from: "#F5A623", to: "#B5430A", glow: "#FFC65C" },
  emerald: { from: "#10B981", to: "#065F46", glow: "#4FE0A8" },
  violet:  { from: "#7C5CFC", to: "#3A1D8A", glow: "#A78BFF" },
};

export function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}