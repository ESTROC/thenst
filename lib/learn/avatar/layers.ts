/**
 * Single source of truth for avatar layer categories.
 *
 * Adding a category = add one key here (plus a label below). Every component,
 * the registry and the renderer derive their category knowledge from this map.
 */
export const LAYER_Z = {
  background: 0,
  body: 10,
  accessoryBack: 15,
  bottomwear: 20,
  topwear: 30,
  footwear: 40,
  head: 50,
  face: 60,
  hair: 70,
  facialHair: 80,
  headwear: 90,
  eyewear: 100,
  accessoryFront: 110,
  handheld: 120,
} as const satisfies Record<string, number>;

export type CosmeticCategory = keyof typeof LAYER_Z;

export const ALL_CATEGORIES = Object.keys(LAYER_Z) as CosmeticCategory[];

/** Categories sorted back-to-front for compositing. */
export const RENDER_ORDER: CosmeticCategory[] = [...ALL_CATEGORIES].sort(
  (a, b) => LAYER_Z[a] - LAYER_Z[b],
);

/** Human-friendly tab order for the editor. */
export const EDITOR_CATEGORY_ORDER: CosmeticCategory[] = [
  "body",
  "head",
  "face",
  "hair",
  "facialHair",
  "topwear",
  "bottomwear",
  "footwear",
  "headwear",
  "eyewear",
  "accessoryFront",
  "accessoryBack",
  "handheld",
  "background",
];

export const CATEGORY_LABELS: Record<CosmeticCategory, string> = {
  background: "Background",
  body: "Body",
  accessoryBack: "Back gear",
  bottomwear: "Bottoms",
  topwear: "Tops",
  footwear: "Shoes",
  head: "Head",
  face: "Face",
  hair: "Hair",
  facialHair: "Facial hair",
  headwear: "Headwear",
  eyewear: "Eyewear",
  accessoryFront: "Accessories",
  handheld: "Handheld",
};

/** Categories that must always have something equipped (core anatomy). */
export const LOCKED_CATEGORIES: CosmeticCategory[] = ["body", "head"];

/** Categories randomize() always fills; the rest are equipped by chance. */
export const REQUIRED_CATEGORIES: CosmeticCategory[] = [
  "background",
  "body",
  "head",
  "face",
  "hair",
  "topwear",
  "bottomwear",
  "footwear",
];

export const OPTIONAL_EQUIP_CHANCE = 0.35;
