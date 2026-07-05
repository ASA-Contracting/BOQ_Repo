export const ROLES = [
  "system_administrator",
  "general_manager",
  "technical_office_manager",
  "estimator",
  "viewer",
] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
