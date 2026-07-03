import { describe, expect, it, vi } from "vitest";

import { ConsoleLogger } from "@/infrastructure/logging/ConsoleLogger";

describe("ConsoleLogger", () => {
  it("writes structured JSON logs", () => {
    const logger = new ConsoleLogger({}, "info");
    const infoSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    logger.info("hello", { userId: "user-1" });

    expect(infoSpy).toHaveBeenCalledOnce();
    const payload = JSON.parse(String(infoSpy.mock.calls[0]?.[0]));
    expect(payload.message).toBe("hello");
    expect(payload.correlationId).toBeUndefined();
    expect(payload.userId).toBe("user-1");

    infoSpy.mockRestore();
  });
});
