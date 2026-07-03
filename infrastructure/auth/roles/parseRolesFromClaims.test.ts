import { describe, expect, it } from "vitest";

import {
  parseRolesFromAppMetadata,
  parseRolesFromJwtClaims,
  resolveRolesFromClaims,
} from "@/infrastructure/auth/roles/parseRolesFromClaims";

describe("parseRolesFromClaims", () => {
  it("reads roles from app_metadata.roles", () => {
    const roles = parseRolesFromAppMetadata({
      roles: ["system_administrator", "viewer", "invalid_role"],
    });

    expect(roles).toEqual(["system_administrator", "viewer"]);
  });

  it("reads roles from jwt app_metadata fallback", () => {
    const roles = parseRolesFromJwtClaims({
      app_metadata: {
        roles: ["estimator"],
      },
    });

    expect(roles).toEqual(["estimator"]);
  });

  it("prefers user claims over jwt claims", () => {
    const roles = resolveRolesFromClaims({
      appMetadata: { roles: ["reviewer"] },
      jwtClaims: { app_metadata: { roles: ["viewer"] } },
    });

    expect(roles).toEqual(["reviewer"]);
  });

  it("returns empty array when metadata is missing", () => {
    expect(parseRolesFromAppMetadata(undefined)).toEqual([]);
    expect(parseRolesFromJwtClaims(null)).toEqual([]);
  });
});
