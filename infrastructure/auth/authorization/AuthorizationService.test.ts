import { describe, expect, it } from "vitest";

import { createRequestContextValue } from "@/domain/shared/RequestContext";
import { toCorrelationId, toUserId } from "@/domain/shared/ids";
import { AuthorizationService } from "@/infrastructure/auth/authorization/AuthorizationService";

describe("AuthorizationService", () => {
  const service = new AuthorizationService();

  it("authorizes system administrators", () => {
    const ctx = createRequestContextValue({
      userId: toUserId("admin"),
      roles: ["system_administrator"],
      correlationId: toCorrelationId("corr-admin"),
    });

    expect(service.requireRole(ctx, "system_administrator").ok).toBe(true);
  });

  it("rejects viewers for admin-only operations", () => {
    const ctx = createRequestContextValue({
      userId: toUserId("viewer"),
      roles: ["viewer"],
      correlationId: toCorrelationId("corr-viewer"),
    });

    const result = service.requireRole(ctx, "system_administrator");
    expect(result.ok).toBe(false);
  });
});
