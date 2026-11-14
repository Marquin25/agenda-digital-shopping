import type { CSSProperties } from "react";

/** Fixed flight plan, so the animation is the same on every render (no randomness). */
const BATS = Array.from({ length: 22 }, (_, i) => ({
  top: (i * 37) % 96,
  delay: (i * 53) % 520,
  duration: 900 + ((i * 71) % 400),
  size: 3 + ((i * 29) % 9),
  reverse: i % 3 === 0,
}));

/**
 * Decorative flight of bats over the whole screen (B-77). Hidden from assistive technology and
 * transparent to pointer events; CSS keeps it off entirely when the visitor prefers reduced motion.
 */
export function BatFlight() {
  return (
    <div className="bat-flight" aria-hidden="true" data-testid="bat-flight">
      {BATS.map((bat, i) => (
        <span
          key={i}
          className={bat.reverse ? "bat bat--reverse" : "bat"}
          style={
            {
              "--bat-top": `${bat.top}vh`,
              "--bat-delay": `${bat.delay}ms`,
              "--bat-duration": `${bat.duration}ms`,
              "--bat-size": `${bat.size}rem`,
            } as CSSProperties
          }
        >
          <svg viewBox="0 0 64 32" focusable="false">
            <path d="M32 9c-1.8 0-2.9 1.3-3.4 2.8C26.4 8.6 22.2 6.8 18 7.4c1.6 1.5 2.2 3.6 1.7 5.6-3.2-1.6-7.4-1.6-10.6.5 2.7.5 4.8 2.1 5.8 4.7-2.6 0-5.3 1-6.9 3.2 4.2-1 9.5 0 13.2 3.2 1-2.1 3.7-3.2 5.8-2.6 1.1 1.6 3.2 2.6 5 2.6s3.9-1 5-2.6c2.1-.6 4.8.5 5.8 2.6 3.7-3.2 9-4.2 13.2-3.2-1.6-2.2-4.3-3.2-6.9-3.2 1-2.6 3.1-4.2 5.8-4.7-3.2-2.1-7.4-2.1-10.6-.5-.5-2 .1-4.1 1.7-5.6-4.2-.6-8.4 1.2-10.6 4.4-.5-1.5-1.6-2.8-3.4-2.8zM29.6 9.6 28.8 6l2.2 2.4M34.4 9.6l.8-3.6-2.2 2.4" />
          </svg>
        </span>
      ))}
    </div>
  );
}
