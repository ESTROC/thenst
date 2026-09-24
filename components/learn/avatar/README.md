# Layered Avatar System

Game-style, registry-driven avatar system. An avatar is an ordered stack of SVG
layers composited by z-index inside one `<svg viewBox="0 0 100 100">`. **The
core code never changes when adding cosmetics** — new assets are new data + new
SVG files only.

## Architecture at a glance

| Piece | Path | Role |
|---|---|---|
| Layer map | `src/lib/avatar/layers.ts` | Category union + z-index (single source of truth) |
| Types | `src/lib/avatar/types.ts` | `CosmeticItem`, `Collection`, `AvatarConfig` |
| SVG loader | `src/lib/avatar/svg-loader.ts` | Fetches + inlines asset markup (cached) |
| Registry | `src/data/avatar/index.ts` | Merged `COSMETICS` + helpers + default/random/sanitize |
| Collections | `src/data/avatar/collections.ts` | Collection metadata |
| Cosmetics | `src/data/avatar/cosmetics/*.ts` | One file per collection |
| Palettes | `src/data/avatar/palettes.ts` | Skin/hair swatches |
| Renderer | `src/components/avatar/AvatarRenderer.tsx` | `<AvatarRenderer config size shape />` |
| Editor | `src/components/avatar/AvatarEditor.tsx` | Character-creator modal |
| State | `src/context/AvatarContext.tsx` | Loads/saves `users/{uid}.avatar` in Firestore |
| Assets | `public/avatars/{collection}/{category}/*.svg` | Static SVG layers |

Layer order (back → front):
`background(0) → body(10) → accessoryBack(15) → bottomwear(20) → topwear(30) →
footwear(40) → head(50) → face(60) → hair(70) → facialHair(80) → headwear(90) →
eyewear(100) → accessoryFront(110) → handheld(120)`

## Authoring rules for SVG assets

- Fixed `viewBox="0 0 100 100"` so all layers align. Shared body plan:
  head circle at (50, 24) r 13.5 · torso y 40–66 · legs y 60–88 · feet y 84–92.
- Recolorable regions use `fill="var(--skin)"` or `fill="var(--hair)"` — the
  renderer sets those CSS variables from `AvatarConfig.skinTone` / `hairColor`.
- No `<defs>` with `id`s (assets are inlined into one composite SVG; ids would
  collide). Use solid fills + `opacity` instead of gradients.
- Keep content inside the root `<svg>` element; the loader inlines its children.

## How to add a cosmetic (zero component edits)

1. Drop the SVG in `public/avatars/{collection}/{category}/my_item_01.svg`.
2. Add one entry to that collection's file, e.g. `src/data/avatar/cosmetics/student.ts`:

```ts
{ id: "st_top_flannel_01", category: "topwear", name: "Flannel", file: "flannel_01", tags: ["casual"] },
```

Done. `assetPath` and `zIndex` are derived by `defineCosmetics()`. Optional
fields: `recolorable`, `thumbnail`, `zIndex` (override), `unlockType`
(`"free" | "premium"`, reserved for future gating — ignored today).

## How to add a collection (zero component edits)

1. Create `src/data/avatar/cosmetics/space.ts`:

```ts
import { defineCosmetics } from "./define";
export const spaceCosmetics = defineCosmetics("space", [ /* items */ ]);
```

2. Add its assets under `public/avatars/space/{category}/`.
3. Register it in `src/data/avatar/index.ts` (one import + one spread):

```ts
import { spaceCosmetics } from "./cosmetics/space";
export const COSMETICS: CosmeticItem[] = [...studentCosmetics, ...defenseCosmetics, ...spaceCosmetics];
```

4. Add a `Collection` entry in `src/data/avatar/collections.ts`
   (`icon` is a key in the editor's `COLLECTION_ICONS` map; unknown keys fall
   back to a sparkles icon).

The editor picks up the new tab automatically and only shows category sub-tabs
that actually have items.

## How to add a category

Add one key to `LAYER_Z` in `src/lib/avatar/layers.ts` (plus a label in
`CATEGORY_LABELS` and a slot in `EDITOR_CATEGORY_ORDER`). The
`CosmeticCategory` union, renderer sorting and editor tabs all derive from that
map. Optionally add a zoomed thumbnail viewBox in `THUMB_VIEWBOX`
(AvatarEditor) — it falls back fine without one only if you add it, so add it.

## Persistence

`users/{uid}.avatar` holds the `AvatarConfig` map
(`{ skinTone, hairColor, equipped: { category: cosmeticId } }`). The context
writes the default config on first load, sanitizes whatever it reads (unknown
ids/categories are dropped — removing a cosmetic from the registry can never
crash a user's avatar), and `save()` merge-writes back. Assets are static files
in `/public`; no Firebase Storage involved.
