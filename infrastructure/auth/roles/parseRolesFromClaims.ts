import type { Role } from "@/domain/shared/Role";
import { isRole } from "@/domain/shared/Role";

const ROLES_METADATA_KEY = "roles";

function parseRolesArray(value: unknown): Role[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (entry): entry is Role => typeof entry === "string" && isRole(entry),
  );
}

function readRolesFromRecord(
  record: Record<string, unknown> | undefined,
): Role[] {
  if (!record) {
    return [];
  }

  return parseRolesArray(record[ROLES_METADATA_KEY]);
}

export function parseRolesFromAppMetadata(
  appMetadata: Record<string, unknown> | undefined,
): Role[] {
  return readRolesFromRecord(appMetadata);
}

export function parseRolesFromJwtClaims(
  jwtClaims: Record<string, unknown> | null | undefined,
): Role[] {
  if (!jwtClaims) {
    return [];
  }

  const appMetadata = jwtClaims.app_metadata;

  if (appMetadata && typeof appMetadata === "object" && !Array.isArray(appMetadata)) {
    return readRolesFromRecord(appMetadata as Record<string, unknown>);
  }

  return [];
}

export function resolveRolesFromClaims(input: {
  appMetadata?: Record<string, unknown>;
  jwtClaims?: Record<string, unknown> | null;
}): Role[] {
  const fromUserClaims = parseRolesFromAppMetadata(input.appMetadata);
  if (fromUserClaims.length > 0) {
    return fromUserClaims;
  }

  return parseRolesFromJwtClaims(input.jwtClaims);
}
