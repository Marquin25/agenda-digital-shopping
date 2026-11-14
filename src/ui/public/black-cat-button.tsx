"use client";

import { useEffect, useRef, useState } from "react";
import { CELEBRATION_MESSAGE, CELEBRATION_MS, isLuckyActivation } from "./black-cat";

/**
 * Decorative black cat in the public footer (B-76). The count lives only in this component's memory:
 * nothing is stored or sent, and a reload starts again. The celebration is announced in a polite live
 * region, so it never interrupts the visitor.
 */
export function BlackCatButton() {
  const count = useRef(0);
  const [message, setMessage] = useState("");
  const [celebrating, setCelebrating] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function activate() {
    count.current += 1;
    if (!isLuckyActivation(count.current)) return;
    // Clearing first makes screen readers announce the message again on every 13th activation.
    setMessage("");
    requestAnimationFrame(() => setMessage(CELEBRATION_MESSAGE));
    setCelebrating(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCelebrating(false), CELEBRATION_MS);
  }

  return (
    <div className="black-cat">
      <button
        type="button"
        className="black-cat__button"
        aria-label="Gato preto na lua"
        data-celebrating={celebrating ? "true" : undefined}
        onClick={activate}
      >
        <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true" focusable="false">
          <path className="black-cat__moon" d="M23 3a10 10 0 1 0 6.5 17.6A8 8 0 0 1 23 3z" />
          <path
            className="black-cat__body"
            d="M7 30c0-5 2.2-9 5.4-10.6A5 5 0 0 1 10.6 15c0-.8.2-1.6.5-2.3L10.4 8l3 2.3a5.2 5.2 0 0 1 3.2 0l3-2.3-.7 4.7c.3.7.5 1.5.5 2.3a5 5 0 0 1-1.8 4.4C20.8 21 23 25 23 30z"
          />
          <path className="black-cat__tail" d="M22 29.5c3.2 0 5-1.8 5-4.5" />
          <circle className="black-cat__eye" cx="13.6" cy="15" r="0.9" />
          <circle className="black-cat__eye" cx="17.4" cy="15" r="0.9" />
        </svg>
      </button>
      <p id="black-cat-message" className="black-cat__message" aria-live="polite" aria-atomic="true">
        {message}
      </p>
    </div>
  );
}
