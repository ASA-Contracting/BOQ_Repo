"use server";

import { revalidatePath } from "next/cache";

import type { ExcelPreviewDto, ImportBoqResultDto } from "@/application/dto/workshop/categorizationDto";
import {
  actionFailure,
  mapUseCaseResult,
  unauthorizedActionFailure,
  type ActionResult,
} from "@/application/dto/family/actionResult";
import {
  importBoqSchema,
  parseExcelSchema,
} from "@/application/dto/workshop/importBoqSchema";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";

function mapZodFailure(error: { flatten: () => Record<string, unknown> }) {
  return actionFailure("VALIDATION_ERROR", "Invalid request.", {
    issues: error.flatten(),
  });
}

async function requireRequestContext() {
  return resolveRequestContext();
}

export async function parseExcelUploadAction(
  input: unknown,
): Promise<ActionResult<ExcelPreviewDto>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  const parsed = parseExcelSchema.safeParse(input);
  if (!parsed.success) {
    return mapZodFailure(parsed.error);
  }

  return mapUseCaseResult(
    await getAppServices().workshop.parseExcelUploadUseCase.execute(
      ctx,
      parsed.data,
    ),
  );
}

export async function importBoqAction(
  input: unknown,
): Promise<ActionResult<ImportBoqResultDto>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  const parsed = importBoqSchema.safeParse(input);
  if (!parsed.success) {
    return mapZodFailure(parsed.error);
  }

  const result = await getAppServices().workshop.importBoqFromExcelUseCase.execute(
    ctx,
    parsed.data,
  );

  if (result.ok) {
    revalidatePath("/workshop");
    revalidatePath("/boq");
    if (result.value.boqId > 0) {
      revalidatePath(`/boq/${result.value.boqId}`);
    }
  }

  return mapUseCaseResult(result);
}
