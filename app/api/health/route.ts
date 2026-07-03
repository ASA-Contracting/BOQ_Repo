import { withSupabaseRoute } from "@/infrastructure/auth/supabase/withSupabaseRoute";
import { getHealthHttpStatus } from "@/application/use-cases/health/GetHealthStatusUseCase";
import { getAppServices } from "@/infrastructure/di";

export const GET = withSupabaseRoute({ auth: "none" }, async (_req, ctx) => {
  const services = getAppServices();
  const health = await services.getHealthStatusUseCase.execute();

  if (!ctx.supabaseAdmin) {
    health.checks.supabase = "error";
    health.status = "degraded";
  }

  services.logger.info("Health check executed", {
    status: health.status,
    database: health.checks.database,
    supabase: health.checks.supabase,
  });

  return Response.json(health, { status: getHealthHttpStatus(health) });
});
