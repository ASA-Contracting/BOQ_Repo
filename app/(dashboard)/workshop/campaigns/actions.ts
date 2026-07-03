"use server";

import { revalidatePath } from "next/cache";

import type {
  ImportCampaignDetailDto,
  ImportCampaignDto,
} from "@/application/dto/workshop/campaignDto";
import {
  actionFailure,
  mapUseCaseResult,
  unauthorizedActionFailure,
  type ActionResult,
} from "@/application/dto/family/actionResult";
import {
  campaignIdSchema,
  createCampaignSchema,
  processJobsSchema,
  uploadCampaignZipSchema,
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

export async function createCampaignAction(
  input: unknown,
): Promise<ActionResult<ImportCampaignDto>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  const parsed = createCampaignSchema.safeParse(input);
  if (!parsed.success) {
    return mapZodFailure(parsed.error);
  }

  const result = await getAppServices().workshop.createImportCampaignUseCase.execute(
    ctx,
    parsed.data,
  );

  if (result.ok) {
    revalidatePath("/workshop/campaigns");
  }

  return mapUseCaseResult(result);
}

export async function uploadCampaignZipAction(
  input: unknown,
): Promise<ActionResult<{ campaign: ImportCampaignDto; enqueuedFiles: number }>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  const parsed = uploadCampaignZipSchema.safeParse(input);
  if (!parsed.success) {
    return mapZodFailure(parsed.error);
  }

  const result = await getAppServices().workshop.uploadCampaignZipUseCase.execute(
    ctx,
    parsed.data,
  );

  if (result.ok) {
    revalidatePath("/workshop/campaigns");
    revalidatePath(`/workshop/campaigns/${parsed.data.campaignId}`);
  }

  return mapUseCaseResult(result);
}

export async function processCampaignJobsAction(
  input: unknown,
): Promise<
  ActionResult<{ processedCount: number; succeededCount: number; failedCount: number }>
> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  const parsed = processJobsSchema.safeParse(input);
  if (!parsed.success) {
    return mapZodFailure(parsed.error);
  }

  const result = await getAppServices().workshop.importJobWorker.run(ctx, {
    campaignId: parsed.data.campaignId,
    maxJobs: parsed.data.maxJobs,
  });

  if (result.ok) {
    revalidatePath("/workshop/campaigns");
    revalidatePath(`/workshop/campaigns/${parsed.data.campaignId}`);
    revalidatePath("/workshop");
  }

  return mapUseCaseResult(result);
}

export async function getCampaignDetailAction(
  campaignId: number,
): Promise<ActionResult<ImportCampaignDetailDto>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  const parsed = campaignIdSchema.safeParse({ campaignId });
  if (!parsed.success) {
    return mapZodFailure(parsed.error);
  }

  return mapUseCaseResult(
    await getAppServices().workshop.getImportCampaignDetailUseCase.execute(ctx, parsed.data),
  );
}

export async function getNextCampaignItemAction(
  campaignId: number,
): Promise<ActionResult<{ batchId: number | null; itemId: number | null }>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  const parsed = campaignIdSchema.safeParse({ campaignId });
  if (!parsed.success) {
    return mapZodFailure(parsed.error);
  }

  return mapUseCaseResult(
    await getAppServices().workshop.getNextWorkshopItemInCampaignUseCase.execute(
      ctx,
      parsed.data,
    ),
  );
}
