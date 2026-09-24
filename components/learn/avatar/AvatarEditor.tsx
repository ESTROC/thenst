"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Shuffle, RotateCcw, Check, Loader2, GraduationCap, Shield, Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AvatarRenderer } from "./AvatarRenderer";
import { useAvatar } from "@/context/AvatarContext";
import { useAuth } from "@/context/AuthContext";
import { CATEGORY_LABELS, LOCKED_CATEGORIES } from "@/lib/learn/avatar/layers";
import type { CosmeticCategory } from "@/lib/learn/avatar/layers";
import type { AvatarConfig, CosmeticItem } from "@/lib/learn/avatar/types";
import { getByCollection, getCategoriesInCollection, getCollections } from "@/data/avatar";
import { HAIR_COLORS, SKIN_TONES } from "@/data/avatar/palettes";
import { loadAvatarAsset } from "@/lib/learn/avatar/svg-loader";

const COLLECTION_ICONS: Record<string, LucideIcon> = {
  "graduation-cap": GraduationCap,
  shield: Shield,
};

/** Zoomed viewBox per category so small assets read well as thumbnails. */
const THUMB_VIEWBOX: Record<CosmeticCategory, string> = {
  background: "0 0 100 100",
  body: "18 30 64 64",
  accessoryBack: "14 32 72 36",
  bottomwear: "28 54 44 40",
  topwear: "20 30 60 42",
  footwear: "28 74 44 24",
  head: "30 5 40 40",
  face: "33 11 34 26",
  hair: "27 0 46 34",
  facialHair: "34 22 32 22",
  headwear: "26 0 48 28",
  eyewear: "31 11 38 22",
  accessoryFront: "25 2 50 58",
  handheld: "54 40 44 40",
};

function CosmeticThumb({ item, config }: { item: CosmeticItem; config: AvatarConfig }) {
  const [inner, setInner] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadAvatarAsset(item.thumbnail ?? item.assetPath).then((markup) => {
      if (!cancelled) setInner(markup);
    });
    return () => {
      cancelled = true;
    };
  }, [item.thumbnail, item.assetPath]);

  const style = { "--skin": config.skinTone, "--hair": config.hairColor } as CSSProperties;

  return (
    <svg viewBox={THUMB_VIEWBOX[item.category]} className="h-full w-full" style={style} aria-hidden>
      {inner ? <g dangerouslySetInnerHTML={{ __html: inner }} /> : null}
    </svg>
  );
}

function Swatch({ color, active, onClick }: { color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={`Color ${color}`}
      className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-[var(--bg)] transition-transform hover:scale-110 ${
        active ? "ring-sky" : "ring-transparent"
      }`}
      style={{ background: color }}
    />
  );
}

export function AvatarEditor({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { avatar, setEquipped, setSkin, setHair, randomize, reset, save, saving, dirty } = useAvatar();
  const { user } = useAuth();

  const collections = getCollections();
  const [collectionId, setCollectionId] = useState(collections[0]?.id ?? "");
  const categories = useMemo(() => getCategoriesInCollection(collectionId), [collectionId]);
  const [category, setCategory] = useState<CosmeticCategory | null>(categories[0] ?? null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCategory(categories[0] ?? null);
  }, [categories]);

  const items = useMemo(
    () => (category ? getByCollection(collectionId).filter((i) => i.category === category) : []),
    [collectionId, category],
  );

  function toggleEquip(item: CosmeticItem) {
    const isEquipped = avatar.equipped[item.category] === item.id;
    if (isEquipped && !LOCKED_CATEGORIES.includes(item.category)) {
      setEquipped(item.category, null);
    } else {
      setEquipped(item.category, item.id);
    }
  }

  async function handleSave() {
    await save();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-[var(--surface)] shadow-hover"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-6 py-4">
                <h2 className="font-display text-lg font-bold text-[var(--ink)]">Customize your avatar</h2>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink)] hover:bg-[var(--bg)]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
                <div className="grid lg:h-full lg:grid-cols-[300px,1fr]">
                  {/* preview + colors + actions */}
                  <div className="border-b border-[var(--border)] bg-[var(--bg)] p-5 lg:overflow-y-auto lg:border-b-0 lg:border-r">
                    <div className="mx-auto w-fit overflow-hidden rounded-2xl shadow-card">
                      <AvatarRenderer config={avatar} size={200} shape="square" />
                    </div>

                    <div className="mt-4 flex justify-center gap-2">
                      <button
                        onClick={randomize}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--ink)] transition-colors hover:border-sky"
                      >
                        <Shuffle size={13} /> Randomize
                      </button>
                      <button
                        onClick={reset}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--ink)] transition-colors hover:border-sky"
                      >
                        <RotateCcw size={13} /> Reset
                      </button>
                    </div>

                    <div className="mt-5">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Skin tone</p>
                      <div className="flex flex-wrap gap-2">
                        {SKIN_TONES.map((c) => (
                          <Swatch key={c} color={c} active={avatar.skinTone === c} onClick={() => setSkin(c)} />
                        ))}
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Hair color</p>
                      <div className="flex flex-wrap gap-2">
                        {HAIR_COLORS.map((c) => (
                          <Swatch key={c} color={c} active={avatar.hairColor === c} onClick={() => setHair(c)} />
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleSave}
                      disabled={!user || saving || (!dirty && !saved)}
                      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1f7fe0] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? (
                        <><Loader2 size={15} className="animate-spin" /> Saving…</>
                      ) : saved ? (
                        <><Check size={15} /> Saved</>
                      ) : (
                        "Save avatar"
                      )}
                    </button>
                    {!user && (
                      <p className="mt-2 text-center text-xs text-[var(--ink-soft)]">Sign in to save your avatar.</p>
                    )}
                  </div>

                  {/* collection tabs + category tabs + grid */}
                  <div className="flex min-h-0 min-w-0 flex-col">
                    <div className="flex shrink-0 gap-1 border-b border-[var(--border)] px-5 pt-3">
                      {collections.map((col) => {
                        const Icon = COLLECTION_ICONS[col.icon] ?? Sparkles;
                        const active = col.id === collectionId;
                        return (
                          <button
                            key={col.id}
                            onClick={() => setCollectionId(col.id)}
                            title={col.description}
                            className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                              active
                                ? "border-sky text-[var(--ink)]"
                                : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
                            }`}
                          >
                            <Icon size={15} /> {col.name}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex shrink-0 flex-nowrap gap-2 overflow-x-auto whitespace-nowrap border-b border-[var(--border)] px-5 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%_-_16px),transparent)]">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategory(cat)}
                          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                            cat === category
                              ? "bg-navy-500 text-white"
                              : "border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:border-sky"
                          }`}
                        >
                          {CATEGORY_LABELS[cat]}
                        </button>
                      ))}
                    </div>

                    <div className="min-h-0 flex-1 p-5 lg:overflow-y-auto">
                      {items.length === 0 ? (
                        <p className="py-10 text-center text-sm text-[var(--ink-soft)]">
                          No items in this category yet — check back soon.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                          {items.map((item) => {
                            const selected = avatar.equipped[item.category] === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => toggleEquip(item)}
                                title={selected ? `Unequip ${item.name}` : `Equip ${item.name}`}
                                className={`rounded-xl border p-2 text-left transition-all ${
                                  selected
                                    ? "border-sky bg-sky/10 ring-2 ring-sky/40"
                                    : "border-[var(--border)] bg-[var(--surface)] hover:border-sky/60"
                                }`}
                              >
                                <span className="block aspect-square w-full overflow-hidden rounded-lg bg-[var(--bg)]">
                                  <CosmeticThumb item={item} config={avatar} />
                                </span>
                                <span className="mt-1.5 block truncate text-[11px] font-medium text-[var(--ink)]">
                                  {item.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
