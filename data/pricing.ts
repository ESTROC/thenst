import { PricingTier } from "@/lib/types";

export const pricingTiers: PricingTier[] = [
  {
    id: "students",
    audience: "Students",
    price: 999,
    unit: "per week",
    note: "5 days of guided learning",
    perks: ["Live cohort sessions", "Hands-on assignments", "Community access", "Completion certificate"],
    accent: "sky",
  },
  {
    id: "msme",
    audience: "MSMEs & Startups",
    price: 1500,
    unit: "per person",
    note: "Self-paced access",
    perks: ["Lifetime course access", "Team progress tracking", "Priority support", "Verified certificate"],
    accent: "emerald",
    highlight: true,
  },
  {
    id: "enterprise",
    audience: "Enterprise",
    price: 9999,
    unit: "single package",
    note: "End-to-end deployment",
    perks: ["Custom AI agent build", "Recruitment automation", "Media engagement suite", "Dedicated success manager"],
    accent: "violet",
  },
];