import { describe, expect, it } from "vitest";
import { MIN_PASSWORD_LENGTH, validateNewPassword } from "@/infrastructure/auth/password";

const TOO_COMMON = "Essa senha é muito comum. Escolha outra.";

describe("new staff password policy (ASVS V2)", () => {
  it("accepts a long passphrase that is not in any list", () => {
    expect(validateNewPassword("luz azul na cadeira do violão 27")).toBeNull();
  });

  it("refuses passwords shorter than 12 characters or longer than 256", () => {
    expect(MIN_PASSWORD_LENGTH).toBe(12);
    expect(validateNewPassword("curta-11chr")).toBe("A senha precisa ter pelo menos 12 caracteres.");
    expect(validateNewPassword("a".repeat(257))).toBe("A senha é longa demais.");
  });

  it("refuses long passwords found in public breach lists, ignoring case", () => {
    for (const breached of ["qwertyuiopasdfghjkl", "QwErTyUiOpAsDfGhJkL", "!qaz2wsx#edc", "iloveyou1234"]) {
      expect(validateNewPassword(breached)).toBe(TOO_COMMON);
    }
  });

  it("still refuses the project's own obvious choices", () => {
    expect(validateNewPassword("ConectaShopping")).toBe(TOO_COMMON);
    expect(validateNewPassword("senhasenha12")).toBe(TOO_COMMON);
  });
});
