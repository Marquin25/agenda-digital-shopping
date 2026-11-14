import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./a11y";

const CELEBRATION = /sexta-feira 13/i;

/** The easter egg must never talk to the server: anything sent while playing fails the test. */
function watchRequests(page: Page) {
  const sent: string[] = [];
  page.on("request", (request) => {
    // Next.js prefetches linked pages (RSC requests) as they scroll into view; unrelated to the cat.
    if (request.headers()["rsc"]) return;
    sent.push(`${request.method()} ${request.url()}`);
  });
  return { reset: () => sent.splice(0), sent };
}

async function openAgenda(page: Page) {
  // Keep these visits out of the visitor metrics the main suite asserts on.
  await page.route("**/api/metrics/**", (route) => route.fulfill({ status: 204 }));
  await page.goto("/");
  const cat = page.getByRole("button", { name: "Gato preto na lua" });
  await cat.scrollIntoViewIfNeeded();
  return { cat, message: page.locator("#black-cat-message") };
}

test.describe("Black cat easter egg (B-76)", () => {
  test("the 13th click celebrates Friday the 13th in a live region, without storing or sending anything", async ({
    page,
  }) => {
    const { cat, message } = await openAgenda(page);
    await expect(message).toHaveAttribute("aria-live", "polite");
    const requests = watchRequests(page);
    requests.reset();

    for (let i = 1; i <= 12; i++) await cat.click();
    await expect(message).toBeEmpty();
    await expect(cat).not.toHaveAttribute("data-celebrating", "true");

    await cat.click();
    await expect(message).toHaveText(CELEBRATION);
    await expect(cat).toHaveAttribute("data-celebrating", "true");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expectNoSeriousA11yViolations(page, ".site-footer");

    expect(requests.sent).toEqual([]);
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
    expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);
    expect(await page.context().cookies()).toEqual([]);

    // The count lives only in this page: after a reload it starts again.
    await page.reload();
    await page.getByRole("button", { name: "Gato preto na lua" }).click();
    await expect(page.locator("#black-cat-message")).toBeEmpty();
  });

  test("keyboard activations count once each, with Enter and Space", async ({ page }) => {
    const { cat, message } = await openAgenda(page);
    await cat.focus();
    for (let i = 1; i <= 6; i++) await page.keyboard.press("Enter");
    for (let i = 1; i <= 6; i++) await page.keyboard.press("Space");
    await expect(message).toBeEmpty();
    await page.keyboard.press("Space");
    await expect(message).toHaveText(CELEBRATION);
    await expect(cat).toBeFocused();
  });
});
