import { LAYER_Z } from "@/lib/learn/avatar/layers";
import type { CosmeticCategory } from "@/lib/learn/avatar/layers";
import type { CosmeticItem, UnlockType } from "@/lib/learn/avatar/types";

export interface CosmeticSeed {
  id: string;
  category: CosmeticCategory;
  name: string;
  /** File name (without .svg) inside public/avatars/{collection}/{category}/. */
  file: string;
  recolorable?: boolean;
  thumbnail?: string;
  tags?: string[];
  unlockType?: UnlockType;
  /** Override the category's default z-index. */
  zIndex?: number;
}

export function defineCosmetics(collectionId: string, seeds: CosmeticSeed[]): CosmeticItem[] {
  return seeds.map(({ file, zIndex, ...rest }) => ({
    ...rest,
    collectionId,
    assetPath: `/avatars/${collectionId}/${rest.category}/${file}.svg`,
    zIndex: zIndex ?? LAYER_Z[rest.category],
  }));
}
