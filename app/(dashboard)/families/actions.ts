"use server";

import { revalidatePath } from "next/cache";

import {
  actionFailure,
  mapUseCaseResult,
  unauthorizedActionFailure,
  type ActionResult,
} from "@/application/dto/family/actionResult";
import { createFamilySchema } from "@/application/dto/family/createFamilySchema";
import type { FamilyDetailDto } from "@/application/dto/family/familyDto";
import type { FamilyListItemDto } from "@/application/dto/family/familyDto";
import { searchFamiliesSchema } from "@/application/dto/family/searchFamiliesSchema";
import { updateFamilySchema } from "@/application/dto/family/updateFamilySchema";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";

const FAMILIES_PATH = "/families";

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (value === null) {
    return null;
  }

  const text = String(value).trim();
  return text.length === 0 ? null : text;
}

function parseOptionalParentId(
  value: FormDataEntryValue | null,
): number | null | undefined {
  if (value === null || value === "") {
    return null;
  }

  return Number(value);
}

function mapZodFailure(error: { flatten: () => Record<string, unknown> }) {
  return actionFailure("VALIDATION_ERROR", "Invalid request.", {
    issues: error.flatten(),
  });
}

async function requireRequestContext() {
  const ctx = await resolveRequestContext();
  if (!ctx) {
    return null;
  }

  return ctx;
}

export async function searchFamiliesAction(
  input: unknown,
): Promise<ActionResult<FamilyListItemDto[]>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  const parsed = searchFamiliesSchema.safeParse(input);
  if (!parsed.success) {
    return mapZodFailure(parsed.error);
  }

  return mapUseCaseResult(
    await getAppServices().family.searchFamiliesUseCase.execute(
      ctx,
      parsed.data,
    ),
  );
}

export async function getFamilyAction(
  familyId: number,
): Promise<ActionResult<FamilyDetailDto>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  if (!Number.isInteger(familyId) || familyId <= 0) {
    return actionFailure("VALIDATION_ERROR", "Invalid family id.", {
      field: "familyId",
    });
  }

  return mapUseCaseResult(
    await getAppServices().family.getFamilyUseCase.execute(ctx, { familyId }),
  );
}

export async function createFamilyAction(
  formData: FormData,
): Promise<ActionResult<FamilyDetailDto>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  const parsed = createFamilySchema.safeParse({
    name: formData.get("name"),
    referenceCode: emptyToNull(formData.get("referenceCode")),
    description: emptyToNull(formData.get("description")),
    familyLevelTypeId: Number(formData.get("familyLevelTypeId")),
    parentId: parseOptionalParentId(formData.get("parentId")),
  });

  if (!parsed.success) {
    return mapZodFailure(parsed.error);
  }

  const result = await getAppServices().family.createFamilyUseCase.execute(
    ctx,
    parsed.data,
  );

  if (result.ok) {
    revalidatePath(FAMILIES_PATH);
  }

  return mapUseCaseResult(result);
}

export async function updateFamilyAction(
  formData: FormData,
): Promise<ActionResult<FamilyDetailDto>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  const parentIdRaw = formData.get("parentId");
  const parsed = updateFamilySchema.safeParse({
    id: Number(formData.get("id")),
    name: formData.has("name") ? formData.get("name") : undefined,
    referenceCode: formData.has("referenceCode")
      ? emptyToNull(formData.get("referenceCode"))
      : undefined,
    description: formData.has("description")
      ? emptyToNull(formData.get("description"))
      : undefined,
    familyLevelTypeId: formData.has("familyLevelTypeId")
      ? Number(formData.get("familyLevelTypeId"))
      : undefined,
    parentId: formData.has("parentId")
      ? parseOptionalParentId(parentIdRaw)
      : undefined,
  });

  if (!parsed.success) {
    return mapZodFailure(parsed.error);
  }

  const result = await getAppServices().family.updateFamilyUseCase.execute(
    ctx,
    parsed.data,
  );

  if (result.ok) {
    revalidatePath(FAMILIES_PATH);
  }

  return mapUseCaseResult(result);
}

export async function deleteFamilyAction(
  familyId: number,
): Promise<ActionResult<void>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  if (!Number.isInteger(familyId) || familyId <= 0) {
    return actionFailure("VALIDATION_ERROR", "Invalid family id.", {
      field: "familyId",
    });
  }

  const result = await getAppServices().family.deleteFamilyUseCase.execute(
    ctx,
    { familyId },
  );

  if (result.ok) {
    revalidatePath(FAMILIES_PATH);
  }

  return mapUseCaseResult(result);
}
