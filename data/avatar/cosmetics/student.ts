import { defineCosmetics } from "./define";

/**
 * Student collection. Assets live in public/avatars/student/{category}/.
 * Add an item = drop the SVG + add one entry here. Nothing else changes.
 */
export const studentCosmetics = defineCosmetics("student", [
  // ── body (skin-recolorable base) ─────────────────────────────────────────
  { id: "st_body_slim_01", category: "body", name: "Slim", file: "body_slim_01", recolorable: true, tags: ["base"] },
  { id: "st_body_regular_01", category: "body", name: "Regular", file: "body_regular_01", recolorable: true, tags: ["base"] },
  { id: "st_body_broad_01", category: "body", name: "Broad", file: "body_broad_01", recolorable: true, tags: ["base"] },

  // ── head ─────────────────────────────────────────────────────────────────
  { id: "st_head_round_01", category: "head", name: "Round", file: "head_round_01", recolorable: true, tags: ["base"] },
  { id: "st_head_oval_01", category: "head", name: "Oval", file: "head_oval_01", recolorable: true, tags: ["base"] },
  { id: "st_head_soft_square_01", category: "head", name: "Soft square", file: "head_soft_square_01", recolorable: true, tags: ["base"] },

  // ── face ─────────────────────────────────────────────────────────────────
  { id: "st_face_smile_01", category: "face", name: "Smile", file: "face_smile_01", tags: ["happy"] },
  { id: "st_face_grin_01", category: "face", name: "Grin", file: "face_grin_01", tags: ["happy"] },
  { id: "st_face_chill_01", category: "face", name: "Chill", file: "face_chill_01", tags: ["calm"] },
  { id: "st_face_wink_01", category: "face", name: "Wink", file: "face_wink_01", tags: ["playful"] },

  // ── hair (hair-recolorable) ──────────────────────────────────────────────
  { id: "st_hair_short_01", category: "hair", name: "Short", file: "hair_short_01", recolorable: true },
  { id: "st_hair_long_01", category: "hair", name: "Long", file: "hair_long_01", recolorable: true },
  { id: "st_hair_curly_01", category: "hair", name: "Curly", file: "hair_curly_01", recolorable: true },
  { id: "st_hair_bun_01", category: "hair", name: "Bun", file: "hair_bun_01", recolorable: true },
  { id: "st_hair_spiky_01", category: "hair", name: "Spiky", file: "hair_spiky_01", recolorable: true },

  // ── topwear ──────────────────────────────────────────────────────────────
  { id: "st_top_tshirt_01", category: "topwear", name: "Tee", file: "tshirt_01", tags: ["casual"] },
  { id: "st_top_hoodie_01", category: "topwear", name: "Hoodie", file: "hoodie_01", tags: ["casual"] },
  { id: "st_top_jacket_01", category: "topwear", name: "Jacket", file: "jacket_01", tags: ["casual"] },
  { id: "st_top_varsity_01", category: "topwear", name: "Varsity", file: "varsity_01", tags: ["sport"] },

  // ── bottomwear ───────────────────────────────────────────────────────────
  { id: "st_bottom_jeans_01", category: "bottomwear", name: "Jeans", file: "jeans_01" },
  { id: "st_bottom_joggers_01", category: "bottomwear", name: "Joggers", file: "joggers_01" },
  { id: "st_bottom_shorts_01", category: "bottomwear", name: "Shorts", file: "shorts_01" },

  // ── footwear ─────────────────────────────────────────────────────────────
  { id: "st_shoe_sneaker_white_01", category: "footwear", name: "White sneakers", file: "sneaker_white_01" },
  { id: "st_shoe_sneaker_sky_01", category: "footwear", name: "Sky sneakers", file: "sneaker_sky_01" },
  { id: "st_shoe_slides_01", category: "footwear", name: "Slides", file: "slides_01" },

  // ── eyewear ──────────────────────────────────────────────────────────────
  { id: "st_eye_round_glasses_01", category: "eyewear", name: "Round glasses", file: "round_glasses_01" },
  { id: "st_eye_square_glasses_01", category: "eyewear", name: "Square glasses", file: "square_glasses_01" },
  { id: "st_eye_sunglasses_01", category: "eyewear", name: "Sunglasses", file: "sunglasses_01" },

  // ── headwear ─────────────────────────────────────────────────────────────
  { id: "st_hw_beanie_01", category: "headwear", name: "Beanie", file: "beanie_01" },
  { id: "st_hw_cap_01", category: "headwear", name: "Cap", file: "cap_01" },
  { id: "st_hw_bucket_01", category: "headwear", name: "Bucket hat", file: "bucket_01" },

  // ── accessoryFront ───────────────────────────────────────────────────────
  { id: "st_af_headphones_01", category: "accessoryFront", name: "Headphones", file: "headphones_01", tags: ["music"] },
  { id: "st_af_gaming_headset_01", category: "accessoryFront", name: "Gaming headset", file: "gaming_headset_01", tags: ["gaming"] },
  { id: "st_af_lanyard_01", category: "accessoryFront", name: "ID lanyard", file: "lanyard_01" },

  // ── accessoryBack ────────────────────────────────────────────────────────
  { id: "st_ab_backpack_01", category: "accessoryBack", name: "Backpack", file: "backpack_01" },

  // ── handheld ─────────────────────────────────────────────────────────────
  { id: "st_hh_laptop_01", category: "handheld", name: "Laptop", file: "laptop_01", tags: ["study"] },
  { id: "st_hh_notebook_01", category: "handheld", name: "Notebook", file: "notebook_01", tags: ["study"] },
  { id: "st_hh_coffee_01", category: "handheld", name: "Coffee", file: "coffee_01" },

  // ── background ───────────────────────────────────────────────────────────
  { id: "st_bg_sky_01", category: "background", name: "Sky", file: "bg_sky_01" },
  { id: "st_bg_mint_01", category: "background", name: "Mint", file: "bg_mint_01" },
  { id: "st_bg_violet_01", category: "background", name: "Violet", file: "bg_violet_01" },
  { id: "st_bg_campus_01", category: "background", name: "Campus", file: "bg_campus_01" },
]);
