import { expect, test, type Browser, type Page } from "@playwright/test";
import { E2E_ADMIN_PASSWORD, E2E_CRON_SECRET } from "../../playwright.config";
import { expectNoSeriousA11yViolations } from "./a11y";

/** Next.js route announcer also has role="alert"; exclude it. */
const ALERT = '[role="alert"]:not(#__next-route-announcer__)';
/** Valid 1x1 PNG; the server re-encodes it into every banner size. */
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);
const NEW_PASSWORD = "e2e-new-password-after-first-login";

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

/** Pages created here fail the test if the browser blocks anything by Content-Security-Policy. */
const cspViolations: string[] = [];
function watchCsp(page: Page) {
  page.on("console", (message) => {
    if (/Content Security Policy|Content-Security-Policy/i.test(message.text()))
      cspViolations.push(message.text());
  });
  return page;
}

async function visitorPage(browser: Browser) {
  const context = await browser.newContext();
  return watchCsp(await context.newPage());
}

test.describe.serial("Phase 1 — admin publishes, visitor discovers", () => {
  let admin: Page;
  let eventUrl = "";
  let promoPath = "";

  test.beforeAll(async ({ browser }) => {
    admin = watchCsp(await (await browser.newContext()).newPage());
  });

  test.afterAll(async () => {
    await admin.context().close();
    expect(cspViolations).toEqual([]);
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

  test("staff registers a participating store with business data only", async () => {
    await admin.goto("/admin/estabelecimentos");
    await expect(admin.getByRole("heading", { name: "Lojas e segmentos", level: 1 })).toBeVisible();
    await admin.locator("#nova-loja-name").fill("Empório Violão");
    await admin.locator("#nova-loja-segmentId").selectOption({ label: "Lazer" });
    await admin.locator("#nova-loja-floor").fill("L2");
    await admin.getByRole("button", { name: "Cadastrar loja" }).click();
    await expect(admin.getByRole("status").filter({ hasText: "Loja cadastrada." })).toBeVisible();
    await expect(admin.locator("#nova-loja-name")).toHaveValue("");

    await admin.locator("#novo-segmento-name").fill("lazer");
    await admin.getByRole("button", { name: "Cadastrar segmento" }).click();
    await expect(admin.getByText("Já existe um segmento com esse nome.")).toBeVisible();
    // What was typed survives a rejected submission.
    await expect(admin.locator("#novo-segmento-name")).toHaveValue("lazer");
    await expectNoSeriousA11yViolations(admin);
  });

  test("administrator maintains the experience catalog with weights and an update date", async () => {
    await admin.goto("/admin/catalogo/novo");
    await admin.getByLabel("Nome *").fill("Consultoria de estilo E2E");
    await admin.getByLabel("Custo mínimo (R$) *").fill("8000");
    await admin.getByLabel("Custo máximo (R$) *").fill("3000");
    await admin.getByLabel("Duração típica (minutos) *").fill("240");
    await admin.getByRole("button", { name: "Cadastrar modelo" }).click();
    const alert = admin.locator(ALERT);
    await expect(alert.getByRole("link", { name: /Objetivos: Indique ao menos um objetivo/ })).toBeVisible();
    await expect(alert.getByRole("link", { name: /Custo máximo: O custo máximo não pode/ })).toBeVisible();
    await expectNoSeriousA11yViolations(admin);

    await admin.getByLabel("Aumentar vendas").selectOption("3");
    await admin.getByLabel("Adultos (25–40)").selectOption("3");
    await admin.getByRole("checkbox", { name: "Moda" }).check();
    await admin.getByLabel("Custo mínimo (R$) *").fill("3000");
    await admin.getByLabel("Custo máximo (R$) *").fill("8000");
    await admin.getByRole("checkbox", { name: "Satisfação (CSAT) (ainda não medido)" }).check();
    await admin.getByRole("button", { name: "Cadastrar modelo" }).click();
    await expect(admin.getByRole("status").filter({ hasText: "Alterações salvas." })).toBeVisible();
    await expect(admin.getByText("Rascunho para revisão").first()).toBeVisible();
    await expect(admin.getByText("Atualizado em")).toBeVisible();
    await expect(admin.getByLabel("Aumentar vendas")).toHaveValue("3");

    await admin.getByLabel("Revisado pelo shopping").check();
    await admin.getByRole("button", { name: "Salvar modelo" }).click();
    await admin.goto("/admin/catalogo");
    const row = admin.getByRole("row", { name: /Consultoria de estilo E2E/ });
    await expect(row).toContainText("Aumentar vendas");
    await expect(row).toContainText("4 h");
    await expect(row).toContainText("Revisado");
    await expectNoSeriousA11yViolations(admin);
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
    await admin.getByRole("checkbox", { name: "Empório Violão · L2" }).check();
    await admin.getByLabel("Limitadas, por ordem de chegada").check();
    await expect(admin.getByLabel("Com reserva — pendente de aprovação")).toBeDisabled();
    await admin
      .getByLabel(/^Banner/)
      .setInputFiles({ name: "banner.png", mimeType: "image/png", buffer: TINY_PNG });
    await admin.getByLabel(/^Texto alternativo do banner/).fill("Violão e microfone no palco da praça");
    await admin.getByRole("button", { name: "Salvar rascunho" }).click();
    await expect(admin.getByRole("status").filter({ hasText: "Alterações salvas." })).toBeVisible();
    await expectNoSeriousA11yViolations(admin);

    await admin.getByRole("button", { name: "Publicar" }).click();
    await expect(admin.getByRole("status").filter({ hasText: "Evento publicado." })).toBeVisible();
    eventUrl = (await admin.getByRole("link", { name: "Ver página pública" }).getAttribute("href")) ?? "";
    expect(eventUrl).toMatch(/^\/eventos\/show-acustico-e2e/);
  });

  test("staff writes a planning brief with a target audience, budget, period and venues", async () => {
    await admin.goto("/admin/planejamento/novo");
    await admin.getByLabel("Nome do planejamento *").fill("Março da moda E2E");
    await admin.getByLabel("Orçamento mínimo (R$) *").fill("15000");
    await admin.getByLabel("Orçamento máximo (R$) *").fill("5000");
    await admin.getByRole("button", { name: "Cadastrar planejamento" }).click();
    const alert = admin.locator(ALERT);
    await expect(
      alert.getByRole("link", { name: /Objetivo principal: Escolha o objetivo principal/ }),
    ).toBeVisible();
    await expect(
      alert.getByRole("link", { name: /Público desejado: Escolha ao menos um público/ }),
    ).toBeVisible();
    await expect(alert.getByRole("link", { name: /Espaços: Escolha ao menos um espaço/ })).toBeVisible();
    await expect(admin.getByLabel("Nome do planejamento *")).toHaveValue("Março da moda E2E");
    await expectNoSeriousA11yViolations(admin);

    await admin.getByLabel("Objetivo principal *").selectOption({ label: "Aumentar vendas" });
    await admin.getByRole("checkbox", { name: "Adultos (25–40)" }).check();
    await admin.getByRole("checkbox", { name: "L1 · Praça Central" }).check();
    await admin.getByLabel("Orçamento mínimo (R$) *").fill("5000");
    await admin.getByLabel("Orçamento máximo (R$) *").fill("15000");
    await admin.getByLabel("Início do período *").fill(localDateTime(10, "00:00").slice(0, 10));
    await admin.getByLabel("Fim do período *").fill(localDateTime(40, "00:00").slice(0, 10));
    await admin.getByLabel("Horário disponível: início").fill("10:00");
    await admin.getByLabel("Horário disponível: fim").fill("18:00");
    await admin.getByRole("button", { name: "Cadastrar planejamento" }).click();
    await expect(admin.getByRole("status").filter({ hasText: "Alterações salvas." })).toBeVisible();
    await expect(admin.getByRole("heading", { name: "Março da moda E2E", level: 1 })).toBeVisible();
    await expect(admin.getByRole("checkbox", { name: "Adultos (25–40)" })).toBeChecked();

    await admin.goto("/admin/planejamento");
    await expect(admin.getByRole("row", { name: /Março da moda E2E/ })).toContainText("Aumentar vendas");
    await expectNoSeriousA11yViolations(admin);
  });

  test("a brief has a recommendations page, and an idea prefills a new event linked to the brief", async () => {
    await admin.goto("/admin/planejamento");
    await admin.getByRole("link", { name: "Março da moda E2E" }).click();
    await admin.getByRole("link", { name: "Ver recomendações" }).click();
    await expect(admin.getByRole("heading", { name: "Recomendações", level: 1 })).toBeVisible();
    await expect(admin.getByText("Nenhuma recomendação gerada para este planejamento.")).toBeVisible();
    await expectNoSeriousA11yViolations(admin);
    const planId = admin.url().split("/planejamento/")[1]!.split("/")[0]!;

    await admin.goto("/admin/catalogo");
    const templateHref = await admin
      .getByRole("link", { name: "Consultoria de estilo E2E" })
      .getAttribute("href");
    const templateId = templateHref!.split("/").pop()!;

    await admin.goto(`/admin/eventos/novo?planejamento=${planId}&modelo=${templateId}`);
    await expect(admin.getByRole("status").filter({ hasText: "Consultoria de estilo E2E" })).toContainText(
      "Março da moda E2E",
    );
    await expect(admin.getByLabel("Título *")).toHaveValue("Consultoria de estilo E2E");
    await admin.getByLabel("Descrição *").fill("Consultores de moda atendem nas lojas participantes.");
    await admin.getByLabel(/Início \*/).fill(localDateTime(12, "14:00"));
    await admin.getByLabel("Término *").fill(localDateTime(12, "18:00"));
    await admin.getByLabel("Espaço *").selectOption({ label: "L1 · Praça Central" });
    await admin.getByLabel("Categoria *").selectOption({ label: "Música" });
    await expectNoSeriousA11yViolations(admin);
    await admin.getByRole("button", { name: "Salvar rascunho" }).click();
    await expect(admin.getByRole("status").filter({ hasText: "Alterações salvas." })).toBeVisible();
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
    const stores = visitor.getByRole("region", { name: "Lojas participantes" });
    await expect(stores.getByText("Empório Violão")).toBeVisible();
    await expect(stores.getByText("Lazer · Piso L2")).toBeVisible();
    const banner = visitor.getByRole("img", { name: "Violão e microfone no palco da praça" });
    const srcset = (await banner.getAttribute("srcset")) ?? "";
    expect(srcset).toMatch(/\.webp 1200w, .*-600\.webp 600w$/);
    const small = await visitor.request.get(srcset.split(", ")[1]!.split(" ")[0]!);
    expect([small.status(), small.headers()["content-type"]]).toEqual([200, "image/webp"]);
    await expectNoSeriousA11yViolations(visitor);

    const ics = await visitor.request.get(`${eventUrl}/calendario.ics`);
    expect(ics.headers()["content-type"]).toContain("text/calendar");
    expect(await ics.text()).toContain("SUMMARY:Show Acústico E2E");

    // The click downloads the .ics and is reported as an "add to calendar" (estimated) engagement.
    const download = visitor.waitForEvent("download");
    await visitor.getByRole("link", { name: "Adicionar à agenda (.ics)" }).click();
    expect((await download).suggestedFilename()).toMatch(/\.ics$/);
    await visitor.waitForLoadState("networkidle");
    await visitor.context().close();
  });

  test("visitor saves an event on this device and finds it in Salvos", async ({ browser }) => {
    const visitor = await visitorPage(browser);
    await visitor.goto("/salvos");
    await expect(visitor.getByRole("status")).toHaveText("Nenhum evento salvo.");

    await visitor.goto("/");
    const save = visitor.getByRole("button", { name: "Salvar “Show Acústico E2E” neste aparelho" });
    await save.click();
    await expect(save).toHaveAttribute("aria-pressed", "true");

    await visitor.getByRole("navigation", { name: "Atalhos" }).getByRole("link", { name: "Salvos" }).click();
    await expect(visitor.getByRole("status")).toHaveText("1 evento salvo.");
    await expect(visitor.getByRole("heading", { name: "Show Acústico E2E", level: 2 })).toBeVisible();
    await expectNoSeriousA11yViolations(visitor);

    await visitor.getByRole("button", { name: "Salvar “Show Acústico E2E” neste aparelho" }).click();
    await expect(visitor.getByRole("status")).toHaveText("Nenhum evento salvo.");
    await visitor.context().close();
  });

  /** The slide fade-in is real-time (not driven by the fake clock); axe must see the settled slide. */
  async function settledSignage(page: Page) {
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
    await expectNoSeriousA11yViolations(page);
  }

  test("digital signage shows highlights with 'painel' QR codes and a pausable rotation", async ({
    browser,
  }) => {
    const screen = await visitorPage(browser);
    const metrics: string[] = [];
    screen.on("request", (r) => r.url().includes("/api/metrics/") && metrics.push(r.url()));
    await screen.clock.install();
    await screen.goto("/painel?tela=entrada-a&intervalo=6");
    await expect(screen.getByRole("heading", { name: "Destaques da agenda", level: 1 })).toBeVisible();
    await expect(screen.getByRole("heading", { name: "Show Acústico E2E", level: 2 })).toBeVisible();
    const qr = screen.getByRole("img", { name: "QR Code: abre “Show Acústico E2E” no celular" });
    expect(await qr.getAttribute("data-qr-value")).toMatch(
      /\/eventos\/show-acustico-e2e[^?]*\?utm_source=painel&utm_campaign=entrada-a$/,
    );
    // Made to be looked at: no links, and nothing to pause while there is a single highlight.
    await expect(screen.locator("main a")).toHaveCount(0);
    await expect(screen.getByRole("button", { name: "Pausar rotação" })).toHaveCount(0);
    await settledSignage(screen);

    await admin.goto("/admin/eventos");
    await admin.getByRole("link", { name: "Consultoria de estilo E2E" }).click();
    await admin.getByRole("button", { name: "Publicar" }).click();
    await expect(admin.getByRole("status").filter({ hasText: "Evento publicado." })).toBeVisible();

    await screen.reload();
    const first = screen.getByRole("heading", { name: "Show Acústico E2E", level: 2 });
    const second = screen.getByRole("heading", { name: "Consultoria de estilo E2E", level: 2 });
    await expect(first).toBeVisible();
    await expect(second).toBeHidden();
    await screen.clock.runFor(6_000);
    await expect(second).toBeVisible();
    await expect(first).toBeHidden();

    await screen.getByRole("button", { name: "Pausar rotação" }).click();
    await screen.clock.runFor(30_000);
    await expect(second).toBeVisible();
    await settledSignage(screen);
    await screen.getByRole("button", { name: "Retomar rotação" }).click();
    await screen.clock.runFor(6_000);
    await expect(first).toBeVisible();

    // The screen itself is not a visitor: only phones that open a QR are counted.
    expect(metrics).toEqual([]);
    expect(await screen.context().cookies()).toEqual([]);
    await screen.context().close();
  });

  test("visitor rates an ended event once, and staff see aggregates with their caveats", async ({
    browser,
  }) => {
    test.slow(); // includes the 3 s minimum filling time
    await admin.goto("/admin/eventos/novo");
    await admin.getByLabel("Título *").fill("Oficina Encerrada E2E");
    await admin.getByLabel("Descrição *").fill("Oficina que já aconteceu, para testar a avaliação.");
    await admin.getByLabel(/Início \*/).fill(localDateTime(-1, "10:00"));
    await admin.getByLabel("Término *").fill(localDateTime(-1, "12:00"));
    await admin.getByLabel("Espaço *").selectOption({ label: "L1 · Praça Central" });
    await admin.getByLabel("Categoria *").selectOption({ label: "Música" });
    await expect(admin.getByLabel("Período de avaliação (dias)")).toHaveValue("7");
    await admin.getByRole("button", { name: "Salvar rascunho" }).click();
    await expect(admin.getByRole("status").filter({ hasText: "Alterações salvas." })).toBeVisible();
    await admin.getByRole("button", { name: "Publicar" }).click();
    await expect(admin.getByRole("status").filter({ hasText: "Evento publicado." })).toBeVisible();
    const ratedUrl =
      (await admin.getByRole("link", { name: "Ver página pública" }).getAttribute("href")) ?? "";

    const visitor = await visitorPage(browser);
    await visitor.goto(ratedUrl);
    await expect(visitor.getByText("Este evento já foi encerrado.")).toBeVisible();
    await visitor.getByRole("link", { name: "Avaliar este evento" }).click();
    await expect(visitor.getByRole("heading", { name: "Como foi o evento?", level: 1 })).toBeVisible();
    await expectNoSeriousA11yViolations(visitor);

    await visitor.getByRole("button", { name: "Enviar avaliação" }).click();
    const alert = visitor.locator(ALERT);
    await expect(alert).toContainText("Revise os campos destacados");
    await expect(alert.getByRole("link", { name: /Nota/ })).toBeVisible();

    await visitor.getByRole("radio", { name: /5\s*Excelente/ }).check();
    await visitor.getByRole("checkbox", { name: "Atração" }).check();
    await visitor.getByLabel("Comentário (opcional)").fill("Gostei muito da oficina.");
    // A person takes a few seconds; faster submissions are dropped as automated (docs/spec/03 §5).
    await visitor.waitForTimeout(3_000);
    await visitor.getByRole("button", { name: "Enviar avaliação" }).click();
    await expect(visitor.getByRole("status")).toContainText("Obrigado! Sua avaliação foi registrada.");

    await visitor.goto(ratedUrl);
    await expect(visitor.getByText("Você já avaliou este evento neste aparelho. Obrigado!")).toBeVisible();
    await expect(visitor.getByRole("link", { name: "Avaliar este evento" })).toHaveCount(0);
    await visitor.context().close();

    await admin.goto("/admin/eventos");
    await admin.getByRole("link", { name: "Oficina Encerrada E2E" }).click();
    const ratings = admin.getByRole("region", { name: "Avaliações do público" });
    await expect(ratings.getByText("Avaliações sem check-in não comprovam participação.")).toBeVisible();
    await expect(ratings.getByText("Amostra pequena (n = 1)")).toBeVisible();
    await expect(ratings.getByRole("row", { name: /Atração 1/ })).toBeVisible();
    await expect(ratings.getByText("Gostei muito")).toHaveCount(0);
    await expectNoSeriousA11yViolations(admin);

    // B-28: staff read the comment on the moderation page and hide it; it leaves the aggregates.
    await ratings.getByRole("link", { name: /Ler comentários e moderar/ }).click();
    await expect(admin.getByRole("heading", { name: "Avaliações do público", level: 1 })).toBeVisible();
    const row = admin.getByRole("row", { name: /Oficina Encerrada E2E/ });
    await expect(row).toContainText("Gostei muito da oficina.");
    await expect(row).toContainText("Visível");
    await expectNoSeriousA11yViolations(admin);
    await row.getByRole("button", { name: /^Ocultar avaliação/ }).click();
    await expect(row).toContainText("Oculta");
    await expect(row.getByRole("button", { name: /^Reexibir avaliação/ })).toBeVisible();
    await admin.goBack();
    await admin.reload();
    await expect(
      admin.getByText("1 avaliação(ões) ocultada(s) pela moderação ficam fora destes números.", {
        exact: false,
      }),
    ).toBeAttached();
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
    // Columns: devices, page loads, shares, .ics, Google.
    const eventRow = admin.getByRole("row", { name: /^Show Acústico E2E/ }).getByRole("cell");
    await expect(eventRow.nth(3)).toHaveText("1");
    await expect(admin.getByText("Adições à agenda")).toBeVisible();
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
    await expect(analyst.getByRole("link", { name: "Planejamento" })).toBeVisible();
    await analyst.goto("/admin/catalogo");
    await expect(analyst.getByRole("heading", { name: "Acesso negado" })).toBeVisible();
    await analyst.goto("/admin/usuarios");
    await expect(analyst.getByRole("heading", { name: "Acesso negado" })).toBeVisible();
    await analyst.goto("/admin/avaliacoes");
    await expect(analyst.getByRole("row", { name: /Oficina Encerrada E2E/ })).toBeVisible();
    await expect(analyst.getByRole("button", { name: /Ocultar|Reexibir/ })).toHaveCount(0);
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

  test("pages are served with the security headers", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["content-security-policy"]).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
    expect(headers).toMatchObject({
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      "referrer-policy": "strict-origin-when-cross-origin",
      "cross-origin-opener-policy": "same-origin",
      "strict-transport-security": "max-age=31536000; includeSubDomains",
    });
    expect(headers).not.toHaveProperty("x-powered-by");
  });

  test("retention job runs only with the cron secret", async ({ request }) => {
    expect((await request.get("/api/cron/retention")).status()).toBe(401);
    const wrong = await request.get("/api/cron/retention", { headers: { authorization: "Bearer nope" } });
    expect(wrong.status()).toBe(401);
    const ok = await request.get("/api/cron/retention", {
      headers: { authorization: `Bearer ${E2E_CRON_SECRET}` },
    });
    expect(ok.status()).toBe(200);
    expect(Object.keys(await ok.json()).sort()).toEqual([
      "auditEntries",
      "engagementRows",
      "expiredSessions",
      "orphanBanners",
      "pageViewRows",
      "ratingDeviceHashes",
      "ratings",
    ]);
  });
});
