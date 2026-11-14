"use client";

import { Moon } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { BatFlight } from "./bat-flight";
import { applyTheme, BAT_FLIGHT_MS, readTheme, THEME_SWITCH_DELAY_MS, type Theme } from "./theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
const currentTheme = (): Theme => readTheme(document.documentElement);
const serverTheme = (): Theme => "light";

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Light/dark switch (B-77). Turning the dark theme on sends a flight of bats across the screen and
 * switches the theme while they cover it; with reduced motion, it just switches. The bats are a
 * decorative layer (`aria-hidden`, `pointer-events: none`) that never blocks clicks or navigation.
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, currentTheme, serverTheme);
  const [flying, setFlying] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const apply = () => applyTheme(next, document.documentElement, storage());
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (next === "light" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFlying(false);
      apply();
      return;
    }
    setFlying(true);
    timers.current.push(setTimeout(apply, THEME_SWITCH_DELAY_MS));
    timers.current.push(setTimeout(() => setFlying(false), BAT_FLIGHT_MS));
  }

  return (
    <>
      <button
        type="button"
        className="theme-toggle"
        aria-pressed={theme === "dark"}
        title={theme === "dark" ? "Voltar ao modo claro" : "Ativar o modo escuro"}
        onClick={toggle}
      >
        <Moon size={20} aria-hidden="true" />
        <span className="visually-hidden">Modo escuro</span>
      </button>
      {flying && createPortal(<BatFlight />, document.body)}
    </>
  );
}
