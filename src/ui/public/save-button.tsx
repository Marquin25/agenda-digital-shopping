"use client";

import { Heart } from "lucide-react";
import { useSavedSlugs } from "./saved-events-store";

/** Heart toggle that keeps the event in "Salvos" on this device only. */
export function SaveButton({
  slug,
  title,
  className = "",
}: {
  slug: string;
  title: string;
  className?: string;
}) {
  const { slugs, toggle } = useSavedSlugs();
  const saved = slugs.includes(slug);
  return (
    <button
      type="button"
      className={`icon-button ${className}`}
      aria-pressed={saved}
      aria-label={`Salvar “${title}” neste aparelho`}
      title={saved ? "Remover dos salvos" : "Salvar"}
      onClick={() => toggle(slug)}
    >
      <Heart size={20} aria-hidden="true" />
    </button>
  );
}
