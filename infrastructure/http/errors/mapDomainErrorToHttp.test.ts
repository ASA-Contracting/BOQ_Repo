import { describe, expect, it } from "vitest";

import {
  CircularParentError,
  DuplicateSiblingNameError,
  FamilyHasChildrenError,
  FamilyNotFoundError,
  FamilyReferencedError,
} from "@/domain/family/errors/FamilyErrors";
import { AuthorizationError } from "@/domain/shared/errors/AuthorizationError";
import { NotFoundError } from "@/domain/shared/errors/NotFoundError";
import { ValidationError } from "@/domain/shared/errors/ValidationError";
import { toFamilyId } from "@/domain/family/ids";
import {
  mapDomainErrorToDto,
  mapDomainErrorToHttpStatus,
} from "@/infrastructure/http/errors/mapDomainErrorToHttp";

describe("mapDomainErrorToHttp", () => {
  it("maps known domain errors to HTTP status codes", () => {
    expect(mapDomainErrorToHttpStatus(new AuthorizationError())).toBe(403);
    expect(mapDomainErrorToHttpStatus(new NotFoundError("Family", "1"))).toBe(404);
    expect(mapDomainErrorToHttpStatus(new FamilyNotFoundError(toFamilyId(1)))).toBe(
      404,
    );
    expect(
      mapDomainErrorToHttpStatus(
        new ValidationError("Invalid", { field: "name" }),
      ),
    ).toBe(400);
    expect(
      mapDomainErrorToHttpStatus(new DuplicateSiblingNameError("HVAC")),
    ).toBe(409);
    expect(
      mapDomainErrorToHttpStatus(new FamilyHasChildrenError(toFamilyId(2))),
    ).toBe(409);
    expect(
      mapDomainErrorToHttpStatus(new FamilyReferencedError(toFamilyId(2))),
    ).toBe(409);
    expect(
      mapDomainErrorToHttpStatus(
        new CircularParentError(toFamilyId(1), toFamilyId(2)),
      ),
    ).toBe(409);
  });

  it("maps domain errors to API DTOs", () => {
    const dto = mapDomainErrorToDto(
      new ValidationError("Invalid", { field: "name" }),
    );

    expect(dto.code).toBe("VALIDATION_ERROR");
    expect(dto.details).toEqual({ field: "name" });
  });
});
