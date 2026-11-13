import { devices, expect, test, type Page } from "@playwright/test";
import { E2E_ADMIN_PASSWORD } from "../../playwright.config";

const OUT = "docs/telas";
const NEW_PASSWORD = "screens-new-password-after-first-login";
// Lower pixel density keeps the PNGs light enough for the repository.
const MOBILE = {
  ...devices["Pixel 7"],
  deviceScaleFactor: 1.5,
  locale: "pt-BR",
  timezoneId: "America/Sao_Paulo",
};

async function shot(page: Page, name: string, fullPage = true) {
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage, animations: "disabled" });
}

test("capture the main screens", async ({ browser }) => {
  test.setTimeout(120_000);

  // Visitor (phone): agenda, filters, event details, privacy.
  const visitorContext = await browser.newContext({ ...MOBILE });
  const visitor = await visitorContext.newPage();
  await visitor.goto("/");
  await expect(visitor.getByRole("heading", { level: 1 })).toBeVisible();
  await shot(visitor, "01-agenda-celular");
  await visitor.locator("summary", { hasText: "Acessibilidade" }).click();
  await shot(visitor, "02-filtros-celular", false);
  await visitor.locator('article a[href^="/eventos/"]').first().click();
  await visitor.waitForURL("**/eventos/**");
  await shot(visitor, "03-detalhes-do-evento-celular");
  await visitor.goto("/privacidade");
  await shot(visitor, "04-privacidade-celular");

  // Staff (desktop): sign-in, dashboard, events, event form, promo links with QR.
  const admin = await (
    await browser.newContext({
      viewport: { width: 1280, height: 860 },
      locale: "pt-BR",
      timezoneId: "America/Sao_Paulo",
    })
  ).newPage();
  await admin.goto("/admin/entrar");
  await shot(admin, "05-login-equipe", false);
  await admin.getByLabel("E-mail").fill("admin@e2e.test");
  await admin.getByLabel("Senha").fill(E2E_ADMIN_PASSWORD);
  await admin.getByRole("button", { name: "Entrar" }).click();
  await admin.getByLabel("Senha atual").fill(E2E_ADMIN_PASSWORD);
  await admin.getByLabel("Nova senha", { exact: true }).fill(NEW_PASSWORD);
  await admin.getByLabel("Confirme a nova senha").fill(NEW_PASSWORD);
  await admin.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(admin.getByRole("heading", { name: "Painel", level: 1 })).toBeVisible();

  await admin.goto("/admin/divulgacao");
  await admin.getByLabel("Canal *").selectOption({ label: "Instagram / redes sociais" });
  await admin.getByLabel("Onde será usado *").fill("Link na bio do Instagram");
  await admin.getByRole("button", { name: "Criar link de divulgação" }).click();
  const created = admin.getByText(/Link criado: \/r\/[a-z0-9]+/);
  await expect(created).toBeVisible();
  const promoPath = ((await created.textContent()) ?? "").match(/\/r\/[a-z0-9]+/)![0];

  // A visitor arrives through the promo link and adds an event to the calendar.
  const fromInstagram = await (await browser.newContext({ ...MOBILE })).newPage();
  await fromInstagram.goto(promoPath);
  await fromInstagram.waitForLoadState("networkidle");
  await fromInstagram.locator('article a[href^="/eventos/"]').first().click();
  await fromInstagram.waitForURL("**/eventos/**");
  const download = fromInstagram.waitForEvent("download");
  await fromInstagram.getByRole("link", { name: "Adicionar à agenda (.ics)" }).click();
  await download;
  await fromInstagram.waitForLoadState("networkidle");

  await admin.goto("/admin");
  await shot(admin, "06-painel-de-metricas");
  await admin.goto("/admin/eventos");
  await shot(admin, "07-lista-de-eventos");
  await admin.goto("/admin/eventos/novo");
  await shot(admin, "08-cadastro-de-evento");
  await admin.goto("/admin/divulgacao");
  await shot(admin, "09-links-e-qr-de-divulgacao");
});
