export const ADMIN_ROLES = ["administrator", "editor", "analyst"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  administrator: "Administrador",
  editor: "Editor",
  analyst: "Analista",
};

export type Permission =
  "dashboard:view" | "events:manage" | "venues:manage" | "promo-links:manage" | "users:manage" | "audit:view";

/** Phase 1 permission matrix (docs/spec/01 §7, provisional roles confirmed by the product owner). */
const MATRIX: Record<AdminRole, ReadonlySet<Permission>> = {
  administrator: new Set<Permission>([
    "dashboard:view",
    "events:manage",
    "venues:manage",
    "promo-links:manage",
    "users:manage",
    "audit:view",
  ]),
  editor: new Set<Permission>(["dashboard:view", "events:manage", "venues:manage", "promo-links:manage"]),
  analyst: new Set<Permission>(["dashboard:view"]),
};

export function can(role: AdminRole, permission: Permission): boolean {
  return MATRIX[role].has(permission);
}

export function isAdminRole(value: string): value is AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(value);
}
