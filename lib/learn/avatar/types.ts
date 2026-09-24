import type { CosmeticCategory } from "./layers";

export type { CosmeticCategory };

export type UnlockType = "free" | "premium";

export interface CosmeticItem {
  /** Globally unique, e.g. "def_top_camo_jacket_01". */
  id: string;
  category: CosmeticCategory;
  name: string;
  /** "student" | "defense" | future collections. */
  collectionId: string;
  /** e.g. "/avatars/defense/topwear/camo_jacket_01.svg" — static file in /public. */
  assetPath: string;
  /** Derived from category by default, overridable per item. */
  zIndex: number;
  /** If true, the asset uses var(--skin) / var(--hair) tokens and gets tinted. */
  recolorable?: boolean;
  /** Optional dedicated thumbnail; else the asset itself is rendered small. */
  thumbnail?: string;
  tags?: string[];
  /** Reserved for future monetization; ignored by renderer/editor for now. */
  unlockType?: UnlockType;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  order: number;
  /** Icon key resolved by the editor (e.g. "graduation-cap", "shield"). */
  icon: string;
}

/** What is stored per user at Firestore users/{uid}.avatar. */
export interface AvatarConfig {
  /** Hex color applied to var(--skin) regions. */
  skinTone: string;
  /** Hex color applied to var(--hair) regions. */
  hairColor: string;
  /** category -> cosmeticId. Missing key = nothing equipped in that slot. */
  equipped: Partial<Record<CosmeticCategory, string>>;
}
