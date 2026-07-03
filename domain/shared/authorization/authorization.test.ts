import { describe, expect, it } from "vitest";

import { hasAnyRole, hasRole } from "@/domain/shared/authorization/hasRole";
import { requireAnyRole, requireRole } from "@/domain/shared/authorization/requireRole";
import { createRequestContextValue } from "@/domain/shared/RequestContext";
import { toCorrelationId, toUserId } from "@/domain/shared/ids";

const adminContext = createRequestContextValue({
  userId: toUserId("user-1"),
  roles: ["system_administrator"],
  correlationId: toCorrelationId("corr-1"),
});

const viewerContext = createRequestContextValue({
  userId: toUserId("user-2"),
  roles: ["viewer"],
  correlationId: toCorrelationId("corr-2"),
});

describe("authorization helpers", () => {
  it("detects assigned roles", () => {
    expect(hasRole(adminContext, "system_administrator")).toBe(true);
    expect(hasRole(viewerContext, "system_administrator")).toBe(false);
    expect(hasAnyRole(viewerContext, ["viewer", "estimator"])).toBe(true);
  });

  it("returns authorization errors when role is missing", () => {
    const result = requireRole(viewerContext, "system_administrator");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUTHORIZATION_ERROR");
    }
  });

  it("allows access when any required role matches", () => {
    const result = requireAnyRole(adminContext, [
      "general_manager",
      "system_administrator",
    ]);
    expect(result.ok).toBe(true);
  });
});
