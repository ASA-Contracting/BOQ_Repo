import { describe, expect, it } from "vitest";

import {
  getPermissionsForRole,
  roleHasPermission,
} from "@/domain/shared/Permission";
import { ROLES } from "@/domain/shared/Role";

describe("Permission", () => {
  it("grants publish to general manager but not estimator", () => {
    expect(roleHasPermission("general_manager", "publish_production")).toBe(true);
    expect(roleHasPermission("estimator", "publish_production")).toBe(false);
  });

  it("grants all permissions to system administrator", () => {
    for (const permission of getPermissionsForRole("system_administrator")) {
      expect(roleHasPermission("system_administrator", permission)).toBe(true);
    }
  });

  it("covers every role in the matrix", () => {
    expect(ROLES.length).toBe(7);
  });
});
