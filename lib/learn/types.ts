export type AccentColor = "sky" | "amber" | "emerald" | "violet";

export type BannerCategory =
  | "Featured"
  | "Offer"
  | "Announcement"
  | "Trivia"
  | "Webinar";

export interface BannerCard {
  id: string;
  category: BannerCategory;
  title: string;
  subtitle: string;
  cta: string;
  accent: AccentColor;
}

export interface TierPricing {
  students: number;
  msmes: number;
  enterprise: number;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  instructor: string;
  category: string;
  rating: number;
  reviews: number;
  durationHours: number;
  enrolled: number;
  thumbnailColor: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  price: number; // rupees, whole number; 0 = free
  tierPricing?: TierPricing; // per-audience rupees, whole numbers
}

export interface PricingTier {
  id: string;
  audience: string;
  price: number;
  unit: string;
  note: string;
  perks: string[];
  accent: AccentColor;
  highlight?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  durationMin: number;
  preview?: boolean;
  videoUrl?: string;
  content?: string;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface CourseReview {
  id: string;
  name: string;
  rating: number;
  comment: string;
}

export interface CourseDetail extends Course {
  longDescription: string;
  outcomes: string[];
  prerequisites: string[];
  modules: Module[];
  faqs: { q: string; a: string }[];
  reviewList: CourseReview[];
  certification: string;
}
