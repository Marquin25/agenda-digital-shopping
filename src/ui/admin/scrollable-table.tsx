import type { ReactNode } from "react";

/**
 * Wrapper for wide tables. When the table overflows on small screens, the region must be focusable so
 * keyboard users can scroll it (WCAG 2.1.1; axe "scrollable-region-focusable").
 */
export function ScrollableTable({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="table-wrap" role="region" aria-label={label} tabIndex={0}>
      {children}
    </div>
  );
}
