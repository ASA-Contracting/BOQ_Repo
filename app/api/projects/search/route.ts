import { NextRequest } from "next/server";

import { apiError, apiSuccess, requireAuthUserId } from "@/infrastructure/auth/api-auth";
import { AbrdProjectCatalogService } from "@/infrastructure/abrd/AbrdProjectCatalogService";
import { isAbrdConfigured } from "@/infrastructure/config/env";

export async function GET(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) return apiError("Unauthorized", 401);

  if (!isAbrdConfigured()) {
    return apiSuccess([], "ABRD project catalog is not configured");
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return apiSuccess([], "Enter at least 2 characters to search");
  }

  try {
    const service = new AbrdProjectCatalogService();
    const projects = await service.searchProjects(query);
    return apiSuccess(projects, "Projects retrieved");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to search ABRD projects",
      502,
    );
  }
}
