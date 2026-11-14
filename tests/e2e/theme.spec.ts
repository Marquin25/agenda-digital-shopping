import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./a11y";

const theme = (page: Page) => page.evaluate(() => document.documentElement.dataset.theme ?? "light");
const stored = (page: Page) => page.evaluate(() => localStorage.getItem("cs-theme"));

async function open(page: Page, path = "/") {
  // Keep these visits out of the visitor metrics the main suite asserts on.
  await page.route("**/api/metrics/**", (route) => route.fulfill({ status: 204 }));
  await page.goto(path);
  return page.getByRole("button", { name: "Modo escuro" });
}

test.describe("Dark mode with bats (B-77)", () => {
  test("bats cross the screen without blocking it, then the dark theme stays on across pages and reloads", async ({
    page,
  }) => {
    const toggle = await open(page);
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(await theme(page)).toBe("light");

    await toggle.click();
    const flight = page.getByTestId("bat-flight");
    await expect(flight).toBeAttached();
    await expect(flight).toHaveAttribute("aria-hidden", "true");
    await expect(flight).toHaveCSS("pointer-events", "none");
    // Whatever is under the bats is still what a tap reaches.
    expect(
      await page.evaluate(() => {
        const hit = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
        return Boolean(hit && !hit.closest(".bat-flight"));
      }),
    ).toBe(true);

    await expect(flight).not.toBeAttached();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(await theme(page)).toBe("dark");
    expect(await stored(page)).toBe("dark");

    await page.reload();
    expect(await theme(page)).toBe("dark");
    await expect(page.getByRole("button", { name: "Modo escuro" })).toHaveAttribute("aria-pressed", "true");

    await page.goto("/admin/entrar");
    expect(await theme(page)).toBe("dark");
    await expectNoSeriousA11yViolations(page);
    await page.goto("/privacidade");
    await expectNoSeriousA11yViolations(page);

    // Back to light: no bats, and the choice is remembered too.
    await page.getByRole("button", { name: "Modo escuro" }).click();
    await expect(page.getByTestId("bat-flight")).toHaveCount(0);
    expect(await theme(page)).toBe("light");
    expect(await stored(page)).toBe("light");
    await page.reload();
    expect(await theme(page)).toBe("light");
  });

  test("with reduced motion the theme switches at once, without bats, and the control works by keyboard", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const toggle = await open(page, "/privacidade");
    await toggle.focus();
    await expect(toggle).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Enter");
    expect(await theme(page)).toBe("dark");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("bat-flight")).toHaveCount(0);
    await expect(toggle).toBeFocused();
    await expectNoSeriousA11yViolations(page, ".site-header");

    await page.keyboard.press("Space");
    expect(await theme(page)).toBe("light");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  });
});
