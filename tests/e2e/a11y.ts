import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Fails on serious or critical WCAG 2.2 A/AA violations reported by axe (optionally only inside `include`). */
export async function expectNoSeriousA11yViolations(page: Page, include?: string) {
  // Next.js streams page metadata, so <title> can land just after the body; wait for it instead of
  // racing axe's document-title rule. A page that never gets a title still fails here.
  await expect(page).toHaveTitle(/\S/);
  const builder = new AxeBuilder({ page });
  if (include) builder.include(include);
  const results = await builder.withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}
