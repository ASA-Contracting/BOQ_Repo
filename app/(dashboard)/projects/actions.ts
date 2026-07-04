"use server";

import { revalidatePath } from "next/cache";

import {
  actionFailure,
  mapUseCaseResult,
  unauthorizedActionFailure,
  type ActionResult,
} from "@/application/dto/family/actionResult";
import type { ProjectDetailDto } from "@/application/dto/project/projectDto";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/application/dto/project/projectSchema";
import { getAppServices, resolveRequestContext } from "@/infrastructure/di/container";

function mapZodFailure(error: { flatten: () => Record<string, unknown> }) {
  return actionFailure("VALIDATION_ERROR", "Invalid request.", {
    issues: error.flatten(),
  });
}

async function requireRequestContext() {
  return resolveRequestContext();
}

export async function createProjectAction(
  input: unknown,
): Promise<ActionResult<ProjectDetailDto>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    return mapZodFailure(parsed.error);
  }

  const result = await getAppServices().project.createProjectUseCase.execute(ctx, parsed.data);
  if (result.ok) {
    revalidatePath("/projects");
  }

  return mapUseCaseResult(result);
}

export async function closeProjectAction(
  projectId: number,
): Promise<ActionResult<ProjectDetailDto>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  const result = await getAppServices().project.closeProjectUseCase.execute(ctx, { projectId });
  if (result.ok) {
    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
  }

  return mapUseCaseResult(result);
}

export async function updateProjectAction(
  projectId: number,
  input: unknown,
): Promise<ActionResult<ProjectDetailDto>> {
  const ctx = await requireRequestContext();
  if (!ctx) {
    return unauthorizedActionFailure();
  }

  const parsed = updateProjectSchema.safeParse(input);
  if (!parsed.success) {
    return mapZodFailure(parsed.error);
  }

  const result = await getAppServices().project.updateProjectUseCase.execute(ctx, {
    projectId,
    ...parsed.data,
  });
  if (result.ok) {
    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
  }

  return mapUseCaseResult(result);
}
