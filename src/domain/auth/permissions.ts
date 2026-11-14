export const ADMIN_ROLES = ["administrator", "editor", "analyst"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  administrator: "Administrador",
  editor: "Editor",
  analyst: "Analista",
};

export type Permission =
  | "dashboard:view"
  | "events:manage"
  | "venues:manage"
  | "stores:manage"
  | "catalog:manage"
  | "plans:manage"
  | "promo-links:manage"
  | "users:manage"
  | "feedback:moderate"
  | "audit:view";

/**
 * Permission matrix (docs/spec/01 §7, provisional roles confirmed by the product owner).
 * `catalog:manage` is administrator-only until P-INT-IA-1 says who maintains the catalog.
 * `plans:manage` follows docs/spec/01 §7 (administrators and analysts); editors wait for P-INT-IA-2.
 * `feedback:moderate` (hide/show ratings, triage suggestions) follows docs/spec/01 §7; analysts only read.
 */
const MATRIX: Record<AdminRole, ReadonlySet<Permission>> = {
  administrator: new Set<Permission>([
    "dashboard:view",
    "events:manage",
    "venues:manage",
    "stores:manage",
    "catalog:manage",
    "plans:manage",
    "promo-links:manage",
    "users:manage",
    "feedback:moderate",
    "audit:view",
  ]),
  editor: new Set<Permission>([
    "dashboard:view",
    "events:manage",
    "venues:manage",
    "stores:manage",
    "promo-links:manage",
    "feedback:moderate",
  ]),
  analyst: new Set<Permission>(["dashboard:view", "plans:manage"]),
};

export function can(role: AdminRole, permission: Permission): boolean {
  return MATRIX[role].has(permission);
}

export function isAdminRole(value: string): value is AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(value);
}
