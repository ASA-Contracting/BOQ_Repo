"use server";

import { revalidatePath } from "next/cache";

import type {
  CategorizationBatchContextDto,
  WorkshopItemReviewDto,
} from "@/application/dto/workshop/categorizationDto";
import {
  actionFailure,
  mapUseCaseResult,
  unauthorizedActionFailure,
  type ActionResult,
} from "@/application/dto/family/actionResult";
import {
  batchIdSchema,
  bulkApproveSimilarSchema,
  publishBatchSchema,
  returnToEngineerSchema,
  saveClassificationSchema,
  workshopItemIdSchema,
} from "@/application/dto/workshop/importBoqSchema";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";

const categorizePath = (batchId: number) => `/workshop/categorize/${batchId}`;

function mapZodFailure(error: { flatten: () => Record<string, unknown> }) {
  return actionFailure("VALIDATION_ERROR", "Invalid request.", {
    issues: error.flatten(),
  });
}

async function requireRequestContext() {
  return resolveRequestContext();
}

export async function getBatchContextAction(
  batchId: number,
): Promise<ActionResult<CategorizationBatchContextDto>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  return mapUseCaseResult(
    await getAppServices().workshop.getCategorizationBatchContextUseCase.execute(
      ctx,
      { batchId },
    ),
  );
}

export async function getWorkshopItemAction(
  batchId: number,
  itemId: number,
): Promise<ActionResult<WorkshopItemReviewDto>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  return mapUseCaseResult(
    await getAppServices().workshop.getWorkshopItemForReviewUseCase.execute(ctx, {
      batchId,
      itemId,
    }),
  );
}

export async function getNextItemAction(
  batchId: number,
  currentItemId?: number,
): Promise<ActionResult<{ itemId: number | null }>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  return mapUseCaseResult(
    await getAppServices().workshop.getNextWorkshopItemUseCase.execute(ctx, {
      batchId,
      currentItemId,
    }),
  );
}

export async function getPreviousItemAction(
  batchId: number,
  currentItemId: number,
): Promise<ActionResult<{ itemId: number | null }>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  return mapUseCaseResult(
    await getAppServices().workshop.getPreviousWorkshopItemUseCase.execute(ctx, {
      batchId,
      currentItemId,
    }),
  );
}

export async function saveClassificationAction(
  input: unknown,
): Promise<ActionResult<{ itemId: number }>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  const parsed = saveClassificationSchema.safeParse(input);
  if (!parsed.success) {
    return mapZodFailure(parsed.error);
  }

  const result = await getAppServices().workshop.saveWorkshopItemClassificationUseCase.execute(
    ctx,
    parsed.data,
  );

  if (result.ok) {
    revalidatePath(categorizePath(parsed.data.batchId));
  }

  return mapUseCaseResult(result);
}

export async function skipItemAction(
  input: unknown,
): Promise<ActionResult<{ itemId: number }>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  const parsed = workshopItemIdSchema.safeParse(input);
  if (!parsed.success) {
    return mapZodFailure(parsed.error);
  }

  const result = await getAppServices().workshop.skipWorkshopItemUseCase.execute(
    ctx,
    parsed.data,
  );

  if (result.ok) {
    revalidatePath(categorizePath(parsed.data.batchId));
  }

  return mapUseCaseResult(result);
}

export async function runBatchAiAction(
  input: unknown,
): Promise<ActionResult<{ batchId: number; suggestionCount: number }>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  const parsed = batchIdSchema.safeParse(input);
  if (!parsed.success) {
    return mapZodFailure(parsed.error);
  }

  const result = await getAppServices().workshop.runBatchCategorizationUseCase.execute(
    ctx,
    parsed.data,
  );

  if (result.ok) {
    revalidatePath(categorizePath(parsed.data.batchId));
  }

  return mapUseCaseResult(result);
}

export async function publishBatchAction(
  input: unknown,
): Promise<
  ActionResult<{ batchId: number; exportBatchId: number; publishedCount: number }>
> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  const parsed = publishBatchSchema.safeParse(input);
  if (!parsed.success) {
    return mapZodFailure(parsed.error);
  }

  const result = await getAppServices().workshop.publishWorkshopBatchUseCase.execute(
    ctx,
    parsed.data,
  );

  if (result.ok) {
    revalidatePath(categorizePath(parsed.data.batchId));
    revalidatePath("/workshop");
  }

  return mapUseCaseResult(result);
}

export async function bulkApproveSimilarAction(
  input: unknown,
): Promise<ActionResult<{ approvedCount: number }>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  const parsed = bulkApproveSimilarSchema.safeParse(input);
  if (!parsed.success) {
    return mapZodFailure(parsed.error);
  }

  const result = await getAppServices().workshop.bulkApproveSimilarUseCase.execute(
    ctx,
    parsed.data,
  );

  if (result.ok) {
    revalidatePath(categorizePath(parsed.data.batchId));
  }

  return mapUseCaseResult(result);
}

export async function submitEngineerReviewAction(
  input: unknown,
): Promise<ActionResult<{ batchId: number }>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  const parsed = batchIdSchema.safeParse(input);
  if (!parsed.success) {
    return mapZodFailure(parsed.error);
  }

  const result = await getAppServices().workshop.submitEngineerReviewUseCase.execute(
    ctx,
    parsed.data,
  );

  if (result.ok) {
    revalidatePath(categorizePath(parsed.data.batchId));
    revalidatePath("/boq");
  }

  return mapUseCaseResult(result);
}

export async function approveBoqVersionAction(
  input: unknown,
): Promise<ActionResult<{ batchId: number; versionName: string; versionNumber: number }>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  const parsed = batchIdSchema.safeParse(input);
  if (!parsed.success) {
    return mapZodFailure(parsed.error);
  }

  const result = await getAppServices().workshop.approveBoqVersionUseCase.execute(
    ctx,
    parsed.data,
  );

  if (result.ok) {
    revalidatePath(categorizePath(parsed.data.batchId));
    revalidatePath("/boq");
  }

  return mapUseCaseResult(result);
}

export async function returnToEngineerAction(
  input: unknown,
): Promise<ActionResult<{ batchId: number }>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  const parsed = returnToEngineerSchema.safeParse(input);
  if (!parsed.success) {
    return mapZodFailure(parsed.error);
  }

  const result = await getAppServices().workshop.returnBoqVersionToEngineerUseCase.execute(
    ctx,
    parsed.data,
  );

  if (result.ok) {
    revalidatePath(categorizePath(parsed.data.batchId));
    revalidatePath("/boq");
  }

  return mapUseCaseResult(result);
}
