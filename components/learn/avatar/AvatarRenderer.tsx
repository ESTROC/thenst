"use client";

import { memo, useEffect, useId, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { AvatarConfig, CosmeticItem } from "@/lib/learn/avatar/types";
import { getCosmetic } from "@/data/avatar";
import { loadAvatarAsset } from "@/lib/learn/avatar/svg-loader";

interface AvatarRendererProps {
  config: AvatarConfig;
  size?: number;
  /** "circle" matches the old avatar chips; "square" suits editor previews. */
  shape?: "circle" | "square";
  className?: string;
}

function AvatarRendererBase({ config, size = 56, shape = "circle", className }: AvatarRendererProps) {
  const clipId = `avclip-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const equippedKey = JSON.stringify(config.equipped);

  // Resolve equipped ids -> registry items, skipping unknown ids (graceful
  // fallback: a missing asset never crashes the avatar), sorted back-to-front.
  const layers = useMemo<CosmeticItem[]>(
    () =>
      Object.values(config.equipped)
        .map((id) => (id ? getCosmetic(id) : undefined))
        .filter((c): c is CosmeticItem => c !== undefined)
        .sort((a, b) => a.zIndex - b.zIndex),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [equippedKey],
  );

  const [markup, setMarkup] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      layers.map(async (layer) => [layer.assetPath, await loadAvatarAsset(layer.assetPath)] as const),
    ).then((entries) => {
      if (cancelled) return;
      const next: Record<string, string> = {};
      for (const [path, inner] of entries) {
        if (inner) next[path] = inner;
      }
      setMarkup(next);
    });
    return () => {
      cancelled = true;
    };
  }, [layers]);

  const style = { "--skin": config.skinTone, "--hair": config.hairColor } as CSSProperties;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      className={className}
      role="img"
      aria-label="User avatar"
    >
      {shape === "circle" && (
        <clipPath id={clipId}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      )}
      <g clipPath={shape === "circle" ? `url(#${clipId})` : undefined}>
        {layers.map((layer) =>
          markup[layer.assetPath] ? (
            <g key={layer.id} dangerouslySetInnerHTML={{ __html: markup[layer.assetPath] }} />
          ) : null,
        )}
      </g>
    </svg>
  );
}

export const AvatarRenderer = memo(
  AvatarRendererBase,
  (prev, next) =>
    prev.size === next.size &&
    prev.shape === next.shape &&
    prev.className === next.className &&
    JSON.stringify(prev.config) === JSON.stringify(next.config),
);
