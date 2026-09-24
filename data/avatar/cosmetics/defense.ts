import { defineCosmetics } from "./define";

/**
 * Defense collection — cosmetic, respectful, non-political, non-violent.
 * No weapons or violent imagery; field-inspired clothing and gear only.
 * Assets live in public/avatars/defense/{category}/.
 */
export const defenseCosmetics = defineCosmetics("defense", [
  // ── topwear ──────────────────────────────────────────────────────────────
  { id: "def_top_camo_jacket_01", category: "topwear", name: "Camo jacket", file: "camo_jacket_01", tags: ["field"] },
  { id: "def_top_tactical_vest_01", category: "topwear", name: "Tactical vest", file: "tactical_vest_01", tags: ["field"] },
  { id: "def_top_field_uniform_01", category: "topwear", name: "Field uniform", file: "field_uniform_01", tags: ["field"] },

  // ── headwear ─────────────────────────────────────────────────────────────
  { id: "def_hw_tactical_cap_01", category: "headwear", name: "Tactical cap", file: "tactical_cap_01" },
  { id: "def_hw_beret_01", category: "headwear", name: "Beret", file: "beret_01" },
  { id: "def_hw_patrol_cap_01", category: "headwear", name: "Patrol cap", file: "patrol_cap_01" },

  // ── footwear ─────────────────────────────────────────────────────────────
  { id: "def_shoe_combat_boots_01", category: "footwear", name: "Combat boots", file: "combat_boots_01" },

  // ── accessoryFront ───────────────────────────────────────────────────────
  { id: "def_af_rank_badge_01", category: "accessoryFront", name: "Rank badge", file: "rank_badge_01" },
  { id: "def_af_unit_patch_01", category: "accessoryFront", name: "Unit patch", file: "unit_patch_01" },
  { id: "def_af_dog_tags_01", category: "accessoryFront", name: "Dog tags", file: "dog_tags_01" },

  // ── accessoryBack ────────────────────────────────────────────────────────
  { id: "def_ab_tactical_backpack_01", category: "accessoryBack", name: "Tactical backpack", file: "tactical_backpack_01" },

  // ── eyewear ──────────────────────────────────────────────────────────────
  { id: "def_eye_tactical_sunglasses_01", category: "eyewear", name: "Tactical sunglasses", file: "tactical_sunglasses_01" },

  // ── handheld ─────────────────────────────────────────────────────────────
  { id: "def_hh_binoculars_01", category: "handheld", name: "Binoculars", file: "binoculars_01" },
  { id: "def_hh_comm_headset_01", category: "handheld", name: "Comm headset", file: "comm_headset_01" },

  // ── background (abstract, non-political) ─────────────────────────────────
  { id: "def_bg_base_camp_01", category: "background", name: "Base camp", file: "bg_base_camp_01" },
  { id: "def_bg_parade_ground_01", category: "background", name: "Parade ground", file: "bg_parade_ground_01" },
]);
