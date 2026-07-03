import { describe, expect, it } from "vitest";

import {
  authorizeFamilyAdmin,
  requireAuthenticatedUser,
} from "@/application/use-cases/family/authorizeFamilyAdmin";
import {
  adminContext,
  unauthenticatedContext,
  viewerContext,
} from "@/application/use-cases/family/testHelpers";

describe("authorizeFamilyAdmin", () => {
  it("allows system administrators", () => {
    const result = authorizeFamilyAdmin(adminContext);
    expect(result.ok).toBe(true);
  });

  it("denies non-administrators", () => {
    const result = authorizeFamilyAdmin(viewerContext);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUTHORIZATION_ERROR");
    }
  });
});

describe("requireAuthenticatedUser", () => {
  it("allows authenticated contexts", () => {
    const result = requireAuthenticatedUser(viewerContext);
    expect(result.ok).toBe(true);
  });

  it("denies empty user ids", () => {
    const result = requireAuthenticatedUser(unauthenticatedContext);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUTHORIZATION_ERROR");
    }
  });
});
