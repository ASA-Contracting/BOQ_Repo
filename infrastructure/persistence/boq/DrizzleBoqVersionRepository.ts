import { and, eq, sql } from "drizzle-orm";

import { boqVersions } from "@/drizzle/schema";
import type { BoqId, BoqVersionId } from "@/domain/boq/ids";
import type { IBoqVersionRepository } from "@/domain/boq/repositories/IBoqVersionRepository";
import type { BoqVersionApprovalStatus } from "@/domain/workshop/WorkshopWorkflowStage";
import { DrizzleRepository } from "@/infrastructure/persistence/repositories/BaseRepository";

export class DrizzleBoqVersionRepository
  extends DrizzleRepository
  implements IBoqVersionRepository
{
  async findById(versionId: BoqVersionId) {
    const rows = await this.database
      .select({
        id: boqVersions.Id,
        boqId: boqVersions.BoqId,
        versionNumber: boqVersions.VersionNumber,
        versionName: boqVersions.VersionName,
        approvalStatus: boqVersions.ApprovalStatus,
      })
      .from(boqVersions)
      .where(and(eq(boqVersions.Id, versionId), eq(boqVersions.IsDeleted, false)))
      .limit(1);

    return rows[0] ?? null;
  }

  async getNextVersionNumber(boqId: BoqId): Promise<number> {
    const rows = await this.database
      .select({
        maxNumber: sql<number>`coalesce(max(${boqVersions.VersionNumber}), 0)::int`,
      })
      .from(boqVersions)
      .where(and(eq(boqVersions.BoqId, boqId), eq(boqVersions.IsDeleted, false)));

    return (rows[0]?.maxNumber ?? 0) + 1;
  }

  async updateApprovalStatus(
    versionId: BoqVersionId,
    input: {
      approvalStatus: BoqVersionApprovalStatus;
      versionName?: string;
      versionNumber?: number;
    },
  ): Promise<void> {
    await this.database
      .update(boqVersions)
      .set({
        ApprovalStatus: input.approvalStatus,
        ...(input.versionName !== undefined ? { VersionName: input.versionName } : {}),
        ...(input.versionNumber !== undefined ? { VersionNumber: input.versionNumber } : {}),
      })
      .where(eq(boqVersions.Id, versionId));
  }
}
