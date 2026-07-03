export type HealthCheckStatus = "ok" | "error";

export type HealthStatusDto = {
  status: "ok" | "degraded";
  checks: {
    database: HealthCheckStatus;
    supabase: HealthCheckStatus;
  };
  version: string;
  timestamp: string;
};
