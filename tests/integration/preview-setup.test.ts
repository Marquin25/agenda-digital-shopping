import { afterAll, describe, expect, it } from "vitest";
import { changeOwnPassword, login, MAX_FAILED_LOGINS } from "@/application/auth/admin-auth";
import { listAdminEvents } from "@/application/events/event-queries";
import { maskEmail, preparePreviewDatabase, previewSetupPlan } from "@/application/demo/preview-setup";
import { createTestDb } from "./test-db";

describe("preview database setup on Vercel builds (B-84)", () => {
  it("runs only on Vercel preview builds, never on production or local builds", () => {
    expect(previewSetupPlan({ VERCEL_ENV: "production" })).toEqual({ run: false });
    expect(previewSetupPlan({})).toEqual({ run: false });
    expect(previewSetupPlan({ VERCEL_ENV: "development" })).toEqual({ run: false });
    expect(previewSetupPlan({ VERCEL_ENV: "preview" })).toEqual({ run: true, admin: null });
  });

  it("creates the evaluation account only when both e-mail and temporary password are set", () => {
    expect(
      previewSetupPlan({
        VERCEL_ENV: "preview",
        PREVIEW_ADMIN_EMAIL: " avaliacao@example.com ",
        PREVIEW_ADMIN_PASSWORD: "senha-temporaria-longa",
      }),
    ).toEqual({ run: true, admin: { email: "avaliacao@example.com", password: "senha-temporaria-longa" } });
    expect(previewSetupPlan({ VERCEL_ENV: "preview", PREVIEW_ADMIN_EMAIL: "a@example.com" })).toEqual({
      run: true,
      admin: null,
    });
  });
});

describe("preparePreviewDatabase", async () => {
  const connection = await createTestDb();
  const db = connection.db;
  afterAll(() => connection.close());
  const admin = { email: "avaliacao@example.com", password: "senha-temporaria-longa-de-teste" };

  it("loads fictitious demo data and the evaluation account, which must change its password", async () => {
    const report = await preparePreviewDatabase(db, admin);
    expect(report.demoEvents).toBeGreaterThan(0);
    expect(report.admin).toBe("created");
    expect((await listAdminEvents(db, {})).length).toBe(report.demoEvents);
    const signedIn = await login(db, admin.email, admin.password);
    expect(signedIn.ok && signedIn.user.mustChangePassword).toBe(true);
  });

  it("refreshes the temporary password and unlocks the account while it was never used", async () => {
    for (let i = 0; i < MAX_FAILED_LOGINS; i++) await login(db, admin.email, "senha-errada-qualquer");
    const renewed = { ...admin, password: "outra-senha-temporaria-de-teste" };
    const report = await preparePreviewDatabase(db, renewed);
    expect(report.admin).toBe("password_refreshed");
    expect((await login(db, admin.email, admin.password)).ok).toBe(false);
    const signedIn = await login(db, admin.email, renewed.password);
    expect(signedIn.ok && signedIn.user.mustChangePassword).toBe(true);
  });

  it("is safe to run on every deploy: data and a used account are not duplicated or reset", async () => {
    const renewed = "outra-senha-temporaria-de-teste";
    const signedIn = await login(db, admin.email, renewed);
    if (!signedIn.ok) throw new Error("expected sign-in");
    await changeOwnPassword(
      db,
      signedIn.user.id,
      renewed,
      "senha-definitiva-da-pessoa-avaliadora",
      signedIn.token,
    );
    const before = (await listAdminEvents(db, {})).length;
    const report = await preparePreviewDatabase(db, admin);
    expect(report).toMatchObject({ demoEvents: 0, admin: "exists" });
    expect((await listAdminEvents(db, {})).length).toBe(before);
    expect((await login(db, admin.email, "senha-definitiva-da-pessoa-avaliadora")).ok).toBe(true);
  });

  it("hints which e-mail the account uses without revealing it", () => {
    expect(maskEmail("avaliacao@example.com")).toBe("a********@example.com");
    expect(maskEmail("x@y.z")).toBe("x@y.z");
  });

  it("reports a rejected password without failing the build or echoing the value", async () => {
    const report = await preparePreviewDatabase(db, { email: "outra@example.com", password: "123" });
    expect(report.admin).toBe("rejected");
    expect(JSON.stringify(report)).not.toContain('123"');
  });
});
