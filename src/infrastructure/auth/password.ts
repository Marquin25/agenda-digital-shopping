import { hash, verify } from "@node-rs/argon2";
import breachedPasswords from "./breached-passwords.json";

// Argon2id with OWASP-recommended baseline parameters.
const OPTIONS = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;
export const MIN_PASSWORD_LENGTH = 12;

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

const COMMON_PASSWORDS = new Set([
  "123456789012",
  "senhasenha12",
  "password1234",
  "qwertyuiop12",
  "conectashopping",
  "shopping1234",
  "administrador",
]);

/**
 * Public breached passwords with 12+ characters (shorter ones fail the length rule anyway), embedded so
 * no password ever leaves the server. Source, license and regeneration: scripts/security/build-breached-passwords.sh.
 */
let breached: Set<string> | null = null;
function isBreached(lowercased: string): boolean {
  breached ??= new Set(breachedPasswords.entries);
  return breached.has(lowercased);
}

/** Returns a pt-BR error message, or null when acceptable. */
export function validateNewPassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH)
    return `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  if (password.length > 256) return "A senha é longa demais.";
  const lowercased = password.toLowerCase();
  // One generic message: it never says which list matched.
  if (COMMON_PASSWORDS.has(lowercased) || isBreached(lowercased))
    return "Essa senha é muito comum. Escolha outra.";
  return null;
}
