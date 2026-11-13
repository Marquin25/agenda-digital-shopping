/**
 * "Salvos": events the visitor bookmarked. The list lives only in the visitor's browser
 * (localStorage) and is never sent to the server, so it needs no account and no personal data.
 */
export const SAVED_EVENTS_STORAGE_KEY = "conecta:saved-events";
export const MAX_SAVED_EVENTS = 50;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Reads the stored list defensively: storage can hold anything (old versions, manual edits). */
export function parseSavedSlugs(raw: string | null): string[] {
  if (!raw) return [];
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(value)) return [];
  const slugs = value.filter((v): v is string => typeof v === "string" && SLUG.test(v));
  return [...new Set(slugs)].slice(0, MAX_SAVED_EVENTS);
}

/** Saves the event at the top of the list, or removes it when it is already saved. */
export function toggleSavedSlug(saved: readonly string[], slug: string): string[] {
  if (saved.includes(slug)) return saved.filter((s) => s !== slug);
  return [slug, ...saved].slice(0, MAX_SAVED_EVENTS);
}
