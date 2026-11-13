"use client";

import { useMemo, useSyncExternalStore } from "react";
import { parseSavedSlugs, SAVED_EVENTS_STORAGE_KEY, toggleSavedSlug } from "@/domain/agenda/saved-events";

/** Browser-only list of saved events (localStorage). Nothing is sent to the server. */
const CHANGE_EVENT = "conecta:saved-events-changed";

function read(): string | null {
  try {
    return window.localStorage.getItem(SAVED_EVENTS_STORAGE_KEY);
  } catch {
    return null; // private mode or blocked storage: behave as "nothing saved"
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function useSavedSlugs(): { slugs: string[]; ready: boolean; toggle: (slug: string) => void } {
  const raw = useSyncExternalStore(subscribe, read, () => undefined);
  const slugs = useMemo(() => parseSavedSlugs(raw ?? null), [raw]);
  return {
    slugs,
    ready: raw !== undefined,
    toggle(slug) {
      try {
        window.localStorage.setItem(
          SAVED_EVENTS_STORAGE_KEY,
          JSON.stringify(toggleSavedSlug(parseSavedSlugs(read()), slug)),
        );
        window.dispatchEvent(new Event(CHANGE_EVENT));
      } catch {
        // Storage unavailable: saving silently does nothing.
      }
    },
  };
}
