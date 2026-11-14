import { createHash, randomBytes } from "node:crypto";
import { and, asc, eq, gt, ne } from "drizzle-orm";
import { recordAudit } from "@/application/audit";
import type { AdminRole } from "@/domain/auth/permissions";
import { hashPassword, validateNewPassword, verifyPassword } from "@/infrastructure/auth/password";
import type { Database } from "@/infrastructure/db/client";
import { adminSessions, adminUsers } from "@/infrastructure/db/schema";

export const SESSION_IDLE_MS = 8 * 60 * 60 * 1000;
export const SESSION_ABSOLUTE_MS = 7 * 24 * 60 * 60 * 1000;
export const MAX_FAILED_LOGINS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000;

export interface AdminIdentity {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  mustChangePassword: boolean;
}

export class AuthError extends Error {}

/** Precomputed so unknown e-mails take as long as wrong passwords (no account enumeration). */
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword(randomBytes(16).toString("hex")));

const hashToken = (token: string) => createHash("sha256").update(token).digest("base64url");
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

function toIdentity(user: typeof adminUsers.$inferSelect): AdminIdentity {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };
}

export type LoginResult = { ok: true; token: string; user: AdminIdentity } | { ok: false };

export async function login(
  db: Database,
  email: string,
  password: string,
  now = new Date(),
): Promise<LoginResult> {
  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, normalizeEmail(email)))
    .limit(1);
  if (!user || !user.active) {
    await verifyPassword(await getDummyHash(), password);
    return { ok: false };
  }
  if (user.lockedUntil && user.lockedUntil > now) {
    await recordAudit(db, {
      userId: user.id,
      action: "auth.login_locked",
      entity: "admin_user",
      entityId: user.id,
    });
    return { ok: false };
  }
  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    const failedLogins = user.failedLogins + 1;
    const lock = failedLogins >= MAX_FAILED_LOGINS;
    await db
      .update(adminUsers)
      .set({
        failedLogins: lock ? 0 : failedLogins,
        lockedUntil: lock ? new Date(now.getTime() + LOCK_DURATION_MS) : user.lockedUntil,
      })
      .where(eq(adminUsers.id, user.id));
    await recordAudit(db, {
      userId: user.id,
      action: lock ? "auth.account_locked" : "auth.login_failed",
      entity: "admin_user",
      entityId: user.id,
    });
    return { ok: false };
  }
  await db.update(adminUsers).set({ failedLogins: 0, lockedUntil: null }).where(eq(adminUsers.id, user.id));
  const token = randomBytes(32).toString("base64url");
  await db.insert(adminSessions).values({
    id: hashToken(token),
    userId: user.id,
    createdAt: now,
    lastSeenAt: now,
    expiresAt: new Date(now.getTime() + SESSION_ABSOLUTE_MS),
  });
  await recordAudit(db, { userId: user.id, action: "auth.login", entity: "admin_user", entityId: user.id });
  return { ok: true, token, user: toIdentity(user) };
}

/** Validates a session token (idle and absolute expiry) and refreshes its idle timer. */
export async function getSessionUser(
  db: Database,
  token: string,
  now = new Date(),
): Promise<AdminIdentity | null> {
  const id = hashToken(token);
  const [row] = await db
    .select({ session: adminSessions, user: adminUsers })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminUsers.id, adminSessions.userId))
    .where(and(eq(adminSessions.id, id), gt(adminSessions.expiresAt, now)))
    .limit(1);
  if (!row || !row.user.active) return null;
  if (now.getTime() - row.session.lastSeenAt.getTime() > SESSION_IDLE_MS) {
    await db.delete(adminSessions).where(eq(adminSessions.id, id));
    return null;
  }
  if (now.getTime() - row.session.lastSeenAt.getTime() > 60_000) {
    await db.update(adminSessions).set({ lastSeenAt: now }).where(eq(adminSessions.id, id));
  }
  return toIdentity(row.user);
}

export async function logout(db: Database, token: string): Promise<void> {
  await db.delete(adminSessions).where(eq(adminSessions.id, hashToken(token)));
}

export async function changeOwnPassword(
  db: Database,
  userId: string,
  currentPassword: string,
  newPassword: string,
  keepSessionToken: string,
): Promise<void> {
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, userId)).limit(1);
  if (!user || !(await verifyPassword(user.passwordHash, currentPassword))) {
    throw new AuthError("A senha atual está incorreta.");
  }
  const problem = validateNewPassword(newPassword);
  if (problem) throw new AuthError(problem);
  if (await verifyPassword(user.passwordHash, newPassword))
    throw new AuthError("A nova senha precisa ser diferente da atual.");
  await db
    .update(adminUsers)
    .set({ passwordHash: await hashPassword(newPassword), mustChangePassword: false, updatedAt: new Date() })
    .where(eq(adminUsers.id, userId));
  // Sign out every other session.
  await db
    .delete(adminSessions)
    .where(and(eq(adminSessions.userId, userId), ne(adminSessions.id, hashToken(keepSessionToken))));
  await recordAudit(db, { userId, action: "auth.password_changed", entity: "admin_user", entityId: userId });
}

// ---- User management (administrators only; enforced by callers) ----

export function listAdminUsers(db: Database) {
  return db
    .select({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      role: adminUsers.role,
      active: adminUsers.active,
      mustChangePassword: adminUsers.mustChangePassword,
    })
    .from(adminUsers)
    .orderBy(asc(adminUsers.name));
}

export async function createAdminUser(
  db: Database,
  actorId: string | null,
  input: { name: string; email: string; role: AdminRole; temporaryPassword: string },
): Promise<string> {
  const problem = validateNewPassword(input.temporaryPassword);
  if (problem) throw new AuthError(problem);
  const email = normalizeEmail(input.email);
  const [existing] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);
  if (existing) throw new AuthError("Já existe um usuário com esse e-mail.");
  const [created] = await db
    .insert(adminUsers)
    .values({
      name: input.name.trim(),
      email,
      role: input.role,
      passwordHash: await hashPassword(input.temporaryPassword),
      mustChangePassword: true,
    })
    .returning({ id: adminUsers.id });
  await recordAudit(db, {
    userId: actorId,
    action: "admin_user.created",
    entity: "admin_user",
    entityId: created!.id,
    details: { role: input.role },
  });
  return created!.id;
}

async function assertNotLastActiveAdministrator(db: Database, userId: string) {
  const admins = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(and(eq(adminUsers.role, "administrator"), eq(adminUsers.active, true)));
  if (admins.length === 1 && admins[0]!.id === userId) {
    throw new AuthError("É preciso manter pelo menos um administrador ativo.");
  }
}

export async function updateAdminUser(
  db: Database,
  actorId: string,
  userId: string,
  changes: { role?: AdminRole; active?: boolean },
): Promise<void> {
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, userId)).limit(1);
  if (!user) throw new AuthError("Usuário não encontrado.");
  const losesAdmin =
    user.role === "administrator" &&
    user.active &&
    ((changes.role && changes.role !== "administrator") || changes.active === false);
  if (losesAdmin) await assertNotLastActiveAdministrator(db, userId);
  await db
    .update(adminUsers)
    .set({ ...changes, updatedAt: new Date() })
    .where(eq(adminUsers.id, userId));
  if (changes.active === false) await db.delete(adminSessions).where(eq(adminSessions.userId, userId));
  await recordAudit(db, {
    userId: actorId,
    action: "admin_user.updated",
    entity: "admin_user",
    entityId: userId,
    details: changes,
  });
}

export async function resetAdminPassword(
  db: Database,
  actorId: string | null,
  userId: string,
  temporaryPassword: string,
) {
  const problem = validateNewPassword(temporaryPassword);
  if (problem) throw new AuthError(problem);
  await db
    .update(adminUsers)
    .set({
      passwordHash: await hashPassword(temporaryPassword),
      mustChangePassword: true,
      failedLogins: 0,
      lockedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(adminUsers.id, userId));
  await db.delete(adminSessions).where(eq(adminSessions.userId, userId));
  await recordAudit(db, {
    userId: actorId,
    action: "admin_user.password_reset",
    entity: "admin_user",
    entityId: userId,
  });
}
