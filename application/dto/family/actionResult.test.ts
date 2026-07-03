import { describe, expect, it } from "vitest";

import {
  actionFailure,
  mapUseCaseResult,
  unauthorizedActionFailure,
} from "@/application/dto/family/actionResult";
import { DuplicateSiblingNameError } from "@/domain/family/errors/FamilyErrors";
import { err, ok } from "@/domain/shared/Result";
import { ValidationError } from "@/domain/shared/errors/ValidationError";

describe("actionResult helpers", () => {
  it("maps successful use case results", () => {
    const result = mapUseCaseResult(ok({ id: 1, name: "HVAC" }));

    expect(result).toEqual({
      success: true,
      data: { id: 1, name: "HVAC" },
    });
  });

  it("maps domain errors to action failures", () => {
    const result = mapUseCaseResult(
      err(new DuplicateSiblingNameError("HVAC")),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("DUPLICATE_SIBLING_NAME");
    }
  });

  it("creates validation and unauthorized failures", () => {
    expect(unauthorizedActionFailure().error.code).toBe("AUTHORIZATION_ERROR");
    expect(
      actionFailure("VALIDATION_ERROR", "Invalid", { field: "name" }).error
        .details,
    ).toEqual({ field: "name" });
    expect(new ValidationError("Invalid").code).toBe("VALIDATION_ERROR");
  });
});
