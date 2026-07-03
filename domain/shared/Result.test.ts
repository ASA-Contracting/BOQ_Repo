import { describe, expect, it } from "vitest";

import { err, ok } from "@/domain/shared/Result";

describe("Result", () => {
  it("creates ok and err variants", () => {
    const success = ok({ value: 1 });
    const failure = err(new Error("failed"));

    expect(success.ok).toBe(true);
    if (success.ok) {
      expect(success.value.value).toBe(1);
    }

    expect(failure.ok).toBe(false);
    if (!failure.ok) {
      expect(failure.error.message).toBe("failed");
    }
  });
});
