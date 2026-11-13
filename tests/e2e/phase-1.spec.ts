import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { E2E_ADMIN_PASSWORD } from "../../playwright.config";

/** Next.js route announcer also has role="alert"; exclude it. */
const ALERT = '[role="alert"]:not(#__next-route-announcer__)';
const NEW_PASSWORD = "e2e-new-password-after-first-login";

async function expectNoSeriousA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

function localDateTime(daysFromNow: number, time: string) {
  const date = new Date(Date.now() + daysFromNow * 86_400_000);
  const key = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(date);
  return `${key}T${time}`;
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/admin/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

/** Hit count cell of the "Cartaz entrada A" promo link on the dashboard. */
function promoHits(page: Page) {
  return page
    .getByRole("row", { name: /Cartaz entrada A/ })
    .getByRole("cell")
    .last();
}

async function visitorPage(browser: Browser) {
  const context = await browser.newContext();
  return context.newPage();
}

test.describe.serial("Phase 1 — admin publishes, visitor discovers", () => {
  let admin: Page;
  let eventUrl = "";
  let promoPath = "";

  test.beforeAll(async ({ browser }) => {
    admin = await (await browser.newContext()).newPage();
  });

  test("login page is accessible and rejects wrong credentials generically", async () => {
    await admin.goto("/admin/entrar");
    await expectNoSeriousA11yViolations(admin);
    await signIn(admin, "admin@e2e.test", "wrong-password-123");
    await expect(admin.locator(ALERT)).toContainText("E-mail ou senha incorretos");
  });

  test("first sign-in forces a password change", async () => {
    await signIn(admin, "admin@e2e.test", E2E_ADMIN_PASSWORD);
    await expect(admin).toHaveURL(/\/admin\/senha$/);
    await admin.getByLabel("Senha atual").fill(E2E_ADMIN_PASSWORD);
    await admin.getByLabel("Nova senha", { exact: true }).fill(NEW_PASSWORD);
    await admin.getByLabel("Confirme a nova senha").fill(NEW_PASSWORD);
    await admin.getByRole("button", { name: "Salvar nova senha" }).click();
    await expect(admin.getByRole("heading", { name: "Painel", level: 1 })).toBeVisible();
    await expect(admin.getByText("Indisponível").first()).toBeVisible();
    await expectNoSeriousA11yViolations(admin);
    // Narrowest supported screen: wide tables overflow and must stay keyboard-scrollable.
    const viewport = admin.viewportSize()!;
    await admin.setViewportSize({ width: 320, height: 640 });
    await expectNoSeriousA11yViolations(admin);
    await admin.setViewportSize(viewport);
  });

  test("editor flow: create venue, create and publish an event", async () => {
    await admin.goto("/admin/espacos");
    await admin.locator("#novo-name").fill("Praça Central");
    await admin.locator("#novo-floor").fill("L1");
    await admin.getByRole("button", { name: "Cadastrar espaço" }).click();
    await expect(admin.getByRole("status").filter({ hasText: "Espaço cadastrado." })).toBeVisible();

    await admin.goto("/admin/eventos/novo");
    await admin.getByLabel("Título *").fill("Show Acústico E2E");
    await admin.getByLabel("Descrição *").fill("Apresentação acústica para testar a agenda pública.");
    await admin.getByLabel(/Início \*/).fill(localDateTime(1, "19:00"));
    await admin.getByLabel("Término *").fill(localDateTime(1, "21:00"));
    await admin.getByLabel("Espaço *").selectOption({ label: "L1 · Praça Central" });
    await admin.getByLabel("Categoria *").selectOption({ label: "Música" });
    await admin.getByRole("checkbox", { name: "Intérprete de Libras" }).check();
    await admin.getByLabel("Limitadas, por ordem de chegada").check();
    await expect(admin.getByLabel("Com reserva — pendente de aprovação")).toBeDisabled();
    await admin.getByRole("button", { name: "Salvar rascunho" }).click();
    await expect(admin.getByRole("status").filter({ hasText: "Alterações salvas." })).toBeVisible();
    await expectNoSeriousA11yViolations(admin);

    await admin.getByRole("button", { name: "Publicar" }).click();
    await expect(admin.getByRole("status").filter({ hasText: "Evento publicado." })).toBeVisible();
    eventUrl = (await admin.getByRole("link", { name: "Ver página pública" }).getAttribute("href")) ?? "";
    expect(eventUrl).toMatch(/^\/eventos\/show-acustico-e2e/);
  });

  test("validation errors are announced and linked to fields", async () => {
    await admin.goto("/admin/eventos/novo");
    await admin.getByRole("button", { name: "Salvar rascunho" }).click();
    const alert = admin.locator(ALERT);
    await expect(alert).toContainText("Revise os campos destacados");
    await expect(alert.getByRole("link", { name: /Título/ })).toBeVisible();
  });

  test("visitor finds the event with filters and opens accessible details", async ({ browser }) => {
    const visitor = await visitorPage(browser);
    await visitor.goto("/");
    await expect(visitor.getByRole("heading", { name: "Agenda de eventos", level: 1 })).toBeVisible();
    await expectNoSeriousA11yViolations(visitor);

    await visitor.locator("summary", { hasText: "Acessibilidade" }).click();
    await visitor.getByRole("checkbox", { name: "Intérprete de Libras" }).check();
    await visitor.getByRole("button", { name: "Aplicar filtros" }).click();
    await expect(visitor).toHaveURL(/acessibilidade=libras/);
    await expect(visitor.getByRole("status").first()).toContainText("1 evento encontrado");

    await visitor.getByRole("link", { name: "Show Acústico E2E" }).click();
    await expect(visitor.getByRole("heading", { name: "Show Acústico E2E", level: 1 })).toBeVisible();
    await expect(visitor.getByText("Vagas limitadas, por ordem de chegada.")).toBeVisible();
    await expect(visitor.getByText("Tenho interesse")).toHaveCount(0);
    await expectNoSeriousA11yViolations(visitor);

    const ics = await visitor.request.get(`${eventUrl}/calendario.ics`);
    expect(ics.headers()["content-type"]).toContain("text/calendar");
    expect(await ics.text()).toContain("SUMMARY:Show Acústico E2E");
    await visitor.context().close();
  });

  test("promo link and QR code redirect with origin and are counted as measured hits", async ({
    browser,
  }) => {
    await admin.goto("/admin/divulgacao");
    await expect(admin.getByText("não registra presença")).toBeVisible();
    await admin.getByLabel("Canal *").selectOption({ label: "QR em cartaz" });
    await admin.getByLabel("Onde será usado *").fill("Cartaz entrada A");
    await admin.getByLabel("Um evento").check();
    await admin.getByLabel("Evento *").selectOption({ label: "Show Acústico E2E" });
    await admin.getByRole("button", { name: "Criar link de divulgação" }).click();
    const created = admin.getByText(/Link criado: \/r\/[a-z0-9]+/);
    await expect(created).toBeVisible();
    promoPath = ((await created.textContent()) ?? "").match(/\/r\/[a-z0-9]+/)![0];

    const qr = await admin.request.get(
      (await admin.getByRole("link", { name: "Baixar PNG" }).first().getAttribute("href")) ?? "",
    );
    expect(qr.headers()["content-type"]).toBe("image/png");

    const visitor = await visitorPage(browser);
    await visitor.goto(promoPath);
    await expect(visitor).toHaveURL(/\/eventos\/show-acustico-e2e.*utm_source=qr_poster/);
    await expect(visitor.getByRole("heading", { level: 1 })).toHaveText("Show Acústico E2E");
    await visitor.waitForLoadState("networkidle");
    await visitor.context().close();

    await admin.goto("/admin");
    await expect(promoHits(admin)).toHaveText("1");
    await expect(admin.getByRole("row", { name: /^QR em cartaz 1 / })).toBeVisible();
  });

  test("staff browsing is not counted", async () => {
    await admin.goto(promoPath);
    await admin.waitForLoadState("networkidle");
    await admin.goto("/admin");
    await expect(promoHits(admin)).toHaveText("1");
  });

  test("analyst can read the dashboard but cannot manage events", async ({ browser }) => {
    const analyst = await visitorPage(browser);
    await signIn(analyst, "analista@e2e.test", E2E_ADMIN_PASSWORD);
    await analyst.getByLabel("Senha atual").fill(E2E_ADMIN_PASSWORD);
    await analyst.getByLabel("Nova senha", { exact: true }).fill(NEW_PASSWORD);
    await analyst.getByLabel("Confirme a nova senha").fill(NEW_PASSWORD);
    await analyst.getByRole("button", { name: "Salvar nova senha" }).click();
    await expect(analyst.getByRole("heading", { name: "Painel" })).toBeVisible();
    await expect(analyst.getByRole("link", { name: "Usuários" })).toHaveCount(0);
    await analyst.goto("/admin/eventos/novo");
    await expect(analyst.getByRole("heading", { name: "Acesso negado" })).toBeVisible();
    await analyst.goto("/admin/usuarios");
    await expect(analyst.getByRole("heading", { name: "Acesso negado" })).toBeVisible();
    await analyst.context().close();
  });

  test("cancelling a published event requires confirmation and shows a public notice", async ({
    browser,
  }) => {
    await admin.goto("/admin/eventos");
    await admin.getByRole("link", { name: "Show Acústico E2E" }).click();
    await admin.getByRole("button", { name: "Cancelar evento" }).click();
    await expect(admin.locator(ALERT)).toContainText("Marque a confirmação");
    await admin.getByLabel("Confirmo o cancelamento deste evento publicado.").check();
    await admin.getByRole("button", { name: "Cancelar evento" }).click();
    await expect(admin.getByRole("status").filter({ hasText: "Evento cancelado." })).toBeVisible();

    const visitor = await visitorPage(browser);
    await visitor.goto(eventUrl);
    await expect(visitor.getByRole("note").filter({ hasText: "Evento cancelado" })).toBeVisible();
    await visitor.context().close();
  });

  test("visitor can delete this device's data", async ({ browser }) => {
    const visitor = await visitorPage(browser);
    await visitor.goto("/privacidade");
    await expectNoSeriousA11yViolations(visitor);
    await visitor.getByRole("button", { name: "Apagar meus dados deste dispositivo" }).click();
    await expect(visitor.getByRole("status")).toContainText("foram apagados");
    await visitor.context().close();
  });
});
