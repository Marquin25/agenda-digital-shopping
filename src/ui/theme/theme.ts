/**
 * Light/dark theme preference (B-77). The choice is kept only in this browser (localStorage) and never
 * sent to the server; the page reads it before paint through THEME_INIT_SCRIPT.
 */
export const THEME_STORAGE_KEY = "cs-theme";

export type Theme = "light" | "dark";

export function parseTheme(value: unknown): Theme {
  return value === "dark" ? "dark" : "light";
}

interface ThemeRoot {
  dataset: Record<string, string | undefined>;
}

interface ThemeStorage {
  setItem(key: string, value: string): void;
}

export function readTheme(root: ThemeRoot): Theme {
  return parseTheme(root.dataset.theme);
}

/** Applies the theme to the page; a browser that blocks storage still gets the theme for this page. */
export function applyTheme(theme: Theme, root: ThemeRoot, storage: ThemeStorage | null): void {
  if (theme === "dark") root.dataset.theme = "dark";
  else delete root.dataset.theme;
  try {
    storage?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode or blocked storage: the preference just is not remembered.
  }
}

/** Runs inline in <head> (with the CSP nonce) so a saved dark theme is applied before the first paint. */
export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;

/** Bats cross the screen for this long; the dark theme switches on while they cover it. */
export const BAT_FLIGHT_MS = 1_600;
export const THEME_SWITCH_DELAY_MS = 550;
