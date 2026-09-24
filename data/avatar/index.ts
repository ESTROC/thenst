import {
  ALL_CATEGORIES,
  EDITOR_CATEGORY_ORDER,
  OPTIONAL_EQUIP_CHANCE,
  REQUIRED_CATEGORIES,
} from "@/lib/learn/avatar/layers";
import type { CosmeticCategory } from "@/lib/learn/avatar/layers";
import type { AvatarConfig, Collection, CosmeticItem } from "@/lib/learn/avatar/types";
import { collections } from "./collections";
import { defenseCosmetics } from "./cosmetics/defense";
import { studentCosmetics } from "./cosmetics/student";
import { HAIR_COLORS, SKIN_TONES } from "./palettes";

/**
 * The single merged cosmetic registry.
 * Adding a collection = new cosmetics file + one spread below + a Collection
 * entry in collections.ts. Zero component edits.
 */
export const COSMETICS: CosmeticItem[] = [...studentCosmetics, ...defenseCosmetics];

const byId = new Map<string, CosmeticItem>(COSMETICS.map((c) => [c.id, c]));

export function getCosmetic(id: string): CosmeticItem | undefined {
  return byId.get(id);
}

export function getByCategory(category: CosmeticCategory): CosmeticItem[] {
  return COSMETICS.filter((c) => c.category === category);
}

export function getByCollection(collectionId: string): CosmeticItem[] {
  return COSMETICS.filter((c) => c.collectionId === collectionId);
}

export function getCollections(): Collection[] {
  return [...collections].sort((a, b) => a.order - b.order);
}

/** Categories that actually have items in a collection, in editor tab order. */
export function getCategoriesInCollection(collectionId: string): CosmeticCategory[] {
  const present = new Set(getByCollection(collectionId).map((c) => c.category));
  return EDITOR_CATEGORY_ORDER.filter((cat) => present.has(cat));
}

export const defaultAvatarConfig: AvatarConfig = {
  skinTone: "#E0AC7E",
  hairColor: "#1A1A1A",
  equipped: {
    background: "st_bg_sky_01",
    body: "st_body_regular_01",
    head: "st_head_round_01",
    face: "st_face_smile_01",
    hair: "st_hair_short_01",
    topwear: "st_top_tshirt_01",
    bottomwear: "st_bottom_jeans_01",
    footwear: "st_shoe_sneaker_white_01",
  },
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** A random valid combination across all collections. */
export function randomAvatarConfig(): AvatarConfig {
  const equipped: Partial<Record<CosmeticCategory, string>> = {};
  for (const category of ALL_CATEGORIES) {
    const pool = getByCategory(category);
    if (pool.length === 0) continue;
    const required = REQUIRED_CATEGORIES.includes(category);
    if (required || Math.random() < OPTIONAL_EQUIP_CHANCE) {
      equipped[category] = pick(pool).id;
    }
  }
  return { skinTone: pick(SKIN_TONES), hairColor: pick(HAIR_COLORS), equipped };
}

function cloneDefault(): AvatarConfig {
  return { ...defaultAvatarConfig, equipped: { ...defaultAvatarConfig.equipped } };
}

/**
 * Validates data loaded from Firestore. Unknown categories and cosmetic ids
 * (e.g. items removed from the registry) are dropped so the renderer never
 * receives an invalid config.
 */
export function sanitizeAvatarConfig(raw: unknown): AvatarConfig {
  if (!raw || typeof raw !== "object") return cloneDefault();
  const record = raw as Record<string, unknown>;
  const equippedRaw =
    record.equipped && typeof record.equipped === "object"
      ? (record.equipped as Record<string, unknown>)
      : {};

  const equipped: Partial<Record<CosmeticCategory, string>> = {};
  for (const category of ALL_CATEGORIES) {
    const id = equippedRaw[category];
    if (typeof id === "string" && byId.get(id)?.category === category) {
      equipped[category] = id;
    }
  }

  return {
    skinTone:
      typeof record.skinTone === "string" ? record.skinTone : defaultAvatarConfig.skinTone,
    hairColor:
      typeof record.hairColor === "string" ? record.hairColor : defaultAvatarConfig.hairColor,
    equipped: Object.keys(equipped).length > 0 ? equipped : { ...defaultAvatarConfig.equipped },
  };
}
