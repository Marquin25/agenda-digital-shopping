"use client";

import { Pause, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { nextSlideIndex } from "@/domain/signage/signage";

export interface SignageSlide {
  key: string;
  content: ReactNode;
}

/** Fetch the highlights again now and then, so a screen left on all day drops ended events. */
const REFRESH_MS = 5 * 60_000;

/**
 * Highlights shown one at a time (WAI-ARIA APG carousel). Rotation pauses with the visible button
 * (WCAG 2.2.2) or while a mouse rests on the slide; the change is a short fade, removed under
 * prefers-reduced-motion, and nothing ever flashes.
 */
export function SignageCarousel({ slides, intervalMs }: { slides: SignageSlide[]; intervalMs: number }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const count = slides.length;
  // A refresh can bring fewer highlights than before.
  const current = count > 0 ? index % count : 0;
  const rotating = count > 1 && !paused && !hovered;

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(() => setIndex(nextSlideIndex(current, count)), intervalMs);
    return () => window.clearTimeout(timer);
  }, [rotating, current, count, intervalMs]);

  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [router]);

  return (
    <section className="signage-carousel" aria-roledescription="carrossel" aria-label="Destaques da agenda">
      <div
        className="signage-carousel__slides"
        aria-live={rotating ? "off" : "polite"}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        {slides.map((slide, i) => (
          <div
            key={slide.key}
            className="signage-carousel__slide"
            role="group"
            aria-roledescription="destaque"
            aria-label={`${i + 1} de ${count}`}
            hidden={i !== current}
          >
            {slide.content}
          </div>
        ))}
      </div>
      {count > 1 && (
        <div className="signage-carousel__controls">
          <button type="button" className="button button--secondary" onClick={() => setPaused((p) => !p)}>
            {paused ? <Play size={18} aria-hidden="true" /> : <Pause size={18} aria-hidden="true" />}
            {paused ? "Retomar rotação" : "Pausar rotação"}
          </button>
          <p className="signage-carousel__position" aria-hidden="true">
            {current + 1} de {count}
          </p>
        </div>
      )}
    </section>
  );
}
