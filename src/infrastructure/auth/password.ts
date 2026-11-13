import { hash, verify } from "@node-rs/argon2";

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

/** Returns a pt-BR error message, or null when acceptable. */
export function validateNewPassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  if (password.length > 256) return "A senha é longa demais.";
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return "Essa senha é muito comum. Escolha outra.";
  return null;
}
