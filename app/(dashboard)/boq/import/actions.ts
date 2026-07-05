"use server";

import { revalidatePath } from "next/cache";

import type { ImportBoqResultDto } from "@/application/dto/workshop/categorizationDto";
import {
  actionFailure,
  mapUseCaseResult,
  unauthorizedActionFailure,
  type ActionResult,
} from "@/application/dto/family/actionResult";
import { importBoqSchema } from "@/application/dto/workshop/importBoqSchema";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";

function mapZodFailure(error: { flatten: () => Record<string, unknown> }) {
  return actionFailure("VALIDATION_ERROR", "Invalid request.", {
    issues: error.flatten(),
  });
}

async function requireRequestContext() {
  return resolveRequestContext();
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
    revalidatePath("/boq");
    if (result.value.boqId > 0) {
      revalidatePath(`/boq/${result.value.boqId}`);
    }
  }

  return mapUseCaseResult(result);
}
