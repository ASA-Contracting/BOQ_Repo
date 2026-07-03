import { and, desc, eq, sql, asc } from "drizzle-orm";

import { boqWorkImportCampaign, boqWorkImportJob } from "@/drizzle/schema";
import type {
  CreateImportCampaignInput,
  CreateImportJobInput,
  IImportCampaignRepository,
} from "@/domain/workshop/repositories/IImportCampaignRepository";
import type { ImportCampaign, ImportJob } from "@/domain/workshop/ImportCampaign";
import { DrizzleRepository } from "@/infrastructure/persistence/repositories/BaseRepository";

function mapCampaignRow(row: typeof boqWorkImportCampaign.$inferSelect): ImportCampaign {
  return {
    id: row.id,
    name: row.name,
    status: row.status as ImportCampaign["status"],
    totalFiles: row.total_files,
    importedCount: row.imported_count,
    aiCompleteCount: row.ai_complete_count,
    failedCount: row.failed_count,
    defaultColumnMappingJson: row.default_column_mapping_json,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapJobRow(row: typeof boqWorkImportJob.$inferSelect): ImportJob {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    fileName: row.file_name,
    status: row.status as ImportJob["status"],
    workshopBatchId: row.workshop_batch_id,
    errorMessage: row.error_message,
    sheetName: row.sheet_name,
    columnMappingJson: row.column_mapping_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

export class DrizzleImportCampaignRepository
  extends DrizzleRepository
  implements IImportCampaignRepository
{
  async findById(id: number): Promise<ImportCampaign | null> {
    const rows = await this.database
      .select()
      .from(boqWorkImportCampaign)
      .where(eq(boqWorkImportCampaign.id, id))
      .limit(1);

    const row = rows[0];
    return row ? mapCampaignRow(row) : null;
  }

  async listRecent(limit: number): Promise<ImportCampaign[]> {
    const rows = await this.database
      .select()
      .from(boqWorkImportCampaign)
      .orderBy(desc(boqWorkImportCampaign.created_at))
      .limit(limit);

    return rows.map(mapCampaignRow);
  }

  async createCampaign(input: CreateImportCampaignInput): Promise<ImportCampaign> {
    const now = new Date();
    const rows = await this.database
      .insert(boqWorkImportCampaign)
      .values({
        name: input.name,
        status: "draft",
        default_column_mapping_json: input.defaultColumnMappingJson,
        created_by: input.createdBy,
        created_at: now,
        updated_at: now,
      })
      .returning();

    const row = rows[0];
    if (!row) {
      throw new Error("Failed to create import campaign.");
    }

    return mapCampaignRow(row);
  }

  async updateCampaignStatus(id: number, status: ImportCampaign["status"]): Promise<void> {
    await this.database
      .update(boqWorkImportCampaign)
      .set({ status, updated_at: new Date() })
      .where(eq(boqWorkImportCampaign.id, id));
  }

  async adjustCampaignCounters(
    id: number,
    delta: {
      totalFiles?: number;
      imported?: number;
      aiComplete?: number;
      failed?: number;
    },
  ): Promise<void> {
    const updates: Record<string, unknown> = { updated_at: new Date() };

    if (delta.totalFiles !== undefined) {
      updates.total_files = sql`${boqWorkImportCampaign.total_files} + ${delta.totalFiles}`;
    }
    if (delta.imported !== undefined) {
      updates.imported_count = sql`${boqWorkImportCampaign.imported_count} + ${delta.imported}`;
    }
    if (delta.aiComplete !== undefined) {
      updates.ai_complete_count = sql`${boqWorkImportCampaign.ai_complete_count} + ${delta.aiComplete}`;
    }
    if (delta.failed !== undefined) {
      updates.failed_count = sql`${boqWorkImportCampaign.failed_count} + ${delta.failed}`;
    }

    await this.database
      .update(boqWorkImportCampaign)
      .set(updates)
      .where(eq(boqWorkImportCampaign.id, id));
  }

  async createJobs(jobs: CreateImportJobInput[]): Promise<number[]> {
    if (jobs.length === 0) {
      return [];
    }

    const now = new Date();
    const rows = await this.database
      .insert(boqWorkImportJob)
      .values(
        jobs.map((job) => ({
          campaign_id: job.campaignId,
          file_name: job.fileName,
          file_content_base64: job.fileContentBase64,
          status: "pending" as const,
          column_mapping_json: job.columnMappingJson,
          created_at: now,
          updated_at: now,
        })),
      )
      .returning({ id: boqWorkImportJob.id });

    return rows.map((row) => row.id);
  }

  async listJobsByCampaign(campaignId: number): Promise<ImportJob[]> {
    const rows = await this.database
      .select()
      .from(boqWorkImportJob)
      .where(eq(boqWorkImportJob.campaign_id, campaignId))
      .orderBy(asc(boqWorkImportJob.file_name));

    return rows.map(mapJobRow);
  }

  async claimNextPendingJob(
    campaignId: number,
  ): Promise<(ImportJob & { fileContentBase64: string | null }) | null> {
    return this.database.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(boqWorkImportJob)
        .where(
          and(
            eq(boqWorkImportJob.campaign_id, campaignId),
            eq(boqWorkImportJob.status, "pending"),
          ),
        )
        .orderBy(asc(boqWorkImportJob.id))
        .limit(1)
        .for("update", { skipLocked: true });

      const row = rows[0];
      if (!row) {
        return null;
      }

      const now = new Date();
      await tx
        .update(boqWorkImportJob)
        .set({
          status: "importing",
          started_at: now,
          updated_at: now,
        })
        .where(eq(boqWorkImportJob.id, row.id));

      return {
        ...mapJobRow(row),
        fileContentBase64: row.file_content_base64,
      };
    });
  }

  async updateJob(input: {
    jobId: number;
    status: ImportJob["status"];
    workshopBatchId?: number | null;
    errorMessage?: string | null;
    sheetName?: string | null;
    startedAt?: Date | null;
    completedAt?: Date | null;
  }): Promise<void> {
    await this.database
      .update(boqWorkImportJob)
      .set({
        status: input.status,
        workshop_batch_id: input.workshopBatchId,
        error_message: input.errorMessage,
        sheet_name: input.sheetName,
        started_at: input.startedAt,
        completed_at: input.completedAt,
        updated_at: new Date(),
      })
      .where(eq(boqWorkImportJob.id, input.jobId));
  }

  async getJobFileContent(jobId: number): Promise<string | null> {
    const rows = await this.database
      .select({ content: boqWorkImportJob.file_content_base64 })
      .from(boqWorkImportJob)
      .where(eq(boqWorkImportJob.id, jobId))
      .limit(1);

    return rows[0]?.content ?? null;
  }
}
