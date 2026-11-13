import { afterAll, describe, expect, it } from "vitest";
import {
  AuthError,
  changeOwnPassword,
  createAdminUser,
  getSessionUser,
  login,
  logout,
  MAX_FAILED_LOGINS,
  SESSION_IDLE_MS,
  updateAdminUser,
} from "@/application/auth/admin-auth";
import { createTestDb } from "./test-db";

describe("admin authentication", async () => {
  const connection = await createTestDb();
  const db = connection.db;
  const password = "senha-temporaria-forte";
  const adminId = await createAdminUser(db, null, {
    name: "Admin",
    email: "Admin@Example.test",
    role: "administrator",
    temporaryPassword: password,
  });
  afterAll(() => connection.close());

  it("logs in with a case-insensitive e-mail and requires a password change on first access", async () => {
    const result = await login(db, "admin@example.test", password);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.mustChangePassword).toBe(true);
    expect((await getSessionUser(db, result.token))?.id).toBe(adminId);
  });

  it("returns the same generic failure for unknown e-mails and wrong passwords", async () => {
    expect(await login(db, "nobody@example.test", password)).toEqual({ ok: false });
    expect(await login(db, "admin@example.test", "senha-errada-qualquer")).toEqual({ ok: false });
  });

  it("locks the account after repeated failures, even for the right password", async () => {
    const editorPassword = "outra-senha-forte-123";
    await createAdminUser(db, adminId, {
      name: "Ed",
      email: "ed@example.test",
      role: "editor",
      temporaryPassword: editorPassword,
    });
    const now = new Date("2026-11-18T12:00:00Z");
    for (let i = 0; i < MAX_FAILED_LOGINS; i++)
      await login(db, "ed@example.test", "errada-errada-errada", now);
    expect((await login(db, "ed@example.test", editorPassword, now)).ok).toBe(false);
    const later = new Date(now.getTime() + 16 * 60 * 1000);
    expect((await login(db, "ed@example.test", editorPassword, later)).ok).toBe(true);
  });

  it("expires idle sessions and invalidates on logout", async () => {
    const start = new Date("2026-11-18T12:00:00Z");
    const result = await login(db, "admin@example.test", password, start);
    if (!result.ok) throw new Error("login failed");
    expect(
      await getSessionUser(db, result.token, new Date(start.getTime() + SESSION_IDLE_MS + 1)),
    ).toBeNull();

    const second = await login(db, "admin@example.test", password);
    if (!second.ok) throw new Error("login failed");
    await logout(db, second.token);
    expect(await getSessionUser(db, second.token)).toBeNull();
  });

  it("changes the password and clears the first-access flag", async () => {
    const result = await login(db, "admin@example.test", password);
    if (!result.ok) throw new Error("login failed");
    await expect(changeOwnPassword(db, adminId, password, "curta", result.token)).rejects.toBeInstanceOf(
      AuthError,
    );
    await changeOwnPassword(db, adminId, password, "nova-senha-bem-longa", result.token);
    expect((await getSessionUser(db, result.token))?.mustChangePassword).toBe(false);
  });

  it("keeps at least one active administrator", async () => {
    await expect(updateAdminUser(db, adminId, adminId, { active: false })).rejects.toThrow(
      /pelo menos um administrador/,
    );
    await expect(updateAdminUser(db, adminId, adminId, { role: "analyst" })).rejects.toThrow(
      /pelo menos um administrador/,
    );
  });
});
