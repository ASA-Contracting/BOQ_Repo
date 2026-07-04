import { and, eq, sql } from "drizzle-orm";

import {
  boqItemVersions,
  boqItems,
  boqVersions,
  boqs,
  projects,
} from "@/drizzle/schema";
import type {
  IBoqImportRepository,
  ImportBoqSnapshotResult,
} from "@/domain/boq/repositories/IBoqImportRepository";
import {
  toBoqId,
  toBoqItemId,
  toBoqVersionId,
  toProjectId,
} from "@/domain/boq/ids";
import { DrizzleRepository } from "@/infrastructure/persistence/repositories/BaseRepository";
import { normalizeImportQuantity } from "@/application/use-cases/workshop/normalizeImportQuantity";

const INSERT_CHUNK_SIZE = 500;

export class DrizzleBoqImportRepository
  extends DrizzleRepository
  implements IBoqImportRepository
{
  async createImportSnapshot(input: {
    projectName: string;
    boqName: string;
    createdBy: string;
    lines: import("@/domain/boq/repositories/IBoqImportRepository").ImportBoqLineInput[];
    projectId?: number;
    boqId?: number;
    client?: string;
  }): Promise<ImportBoqSnapshotResult> {
    const now = new Date();
    const client = input.client ?? "TBD";

    let projectId = input.projectId ?? null;

    if (!projectId) {
      const existingProject = await this.database
        .select({ id: projects.Id })
        .from(projects)
        .where(
          and(
            eq(projects.Name, input.projectName),
            eq(projects.IsDeleted, false),
          ),
        )
        .limit(1);
      projectId = existingProject[0]?.id ?? null;
    }

    if (!projectId) {
      const projectRows = await this.database
        .insert(projects)
        .values({
          Name: input.projectName,
          Description: `Project for BOQ: ${input.boqName}`,
          AbdrProjectId: null,
          ExternalSource: "local",
          Client: client,
          Status: "active",
          IsDeleted: false,
          CreatedAt: now,
          UpdatedAt: now,
        })
        .returning({ id: projects.Id });
      projectId = projectRows[0]?.id ?? null;
    }

    if (!projectId) {
      throw new Error("Failed to resolve project for import.");
    }

    let boqId = input.boqId ?? null;

    if (!boqId) {
      const boqRows = await this.database
        .insert(boqs)
        .values({
          Name: input.boqName,
          Description: "Workshop import snapshot source",
          ProjectId: projectId,
          CreatedBy: input.createdBy,
          IsDeleted: false,
        })
        .returning({ id: boqs.Id });
      boqId = boqRows[0]?.id ?? null;
    }

    if (!boqId) {
      throw new Error("Failed to resolve BOQ for import.");
    }

    const versionNumberRows = await this.database
      .select({
        maxNumber: sql<number>`coalesce(max(${boqVersions.VersionNumber}), 0)::int`,
      })
      .from(boqVersions)
      .where(and(eq(boqVersions.BoqId, boqId), eq(boqVersions.IsDeleted, false)));

    const versionNumber = (versionNumberRows[0]?.maxNumber ?? 0) + 1;

    const versionRows = await this.database
      .insert(boqVersions)
      .values({
        BoqId: boqId,
        VersionName: `Import draft v${versionNumber}`,
        VersionNumber: versionNumber,
        ApprovalStatus: "draft",
        Notes: "Created by Excel import",
        Source: "workshop_import",
        CreatedBy: input.createdBy,
        CreatedAt: now,
        IsDeleted: false,
      })
      .returning({ id: boqVersions.Id });

    const boqVersionId = versionRows[0]?.id;
    if (!boqVersionId) {
      throw new Error("Failed to create BOQ version for import.");
    }

    const createdItems: ImportBoqSnapshotResult["items"] = [];

    for (let offset = 0; offset < input.lines.length; offset += INSERT_CHUNK_SIZE) {
      const chunk = input.lines.slice(offset, offset + INSERT_CHUNK_SIZE);

      const itemRows = await this.database
        .insert(boqItems)
        .values(
          chunk.map((line) => ({
            BoqId: boqId,
            RowIndex: line.rowIndex,
            OriginalRowIndex: line.rowIndex,
            ItemNo: line.itemNo,
            Description: line.description,
            Unit: line.unit,
            IsHeader: line.isHeader,
            IsMeasurable: line.isMeasurable,
            FamilyId: line.originalFamilyId ?? null,
            IsDeleted: false,
            UpdatedAt: now,
          })),
        )
        .returning({ id: boqItems.Id, rowIndex: boqItems.RowIndex });

      const versionValues: Array<{
        BoqItemId: number;
        BoqVersionId: number;
        Quantity: string;
        CreatedBy: string;
        CreatedAt: Date;
        IsDeleted: boolean;
      }> = [];

      for (const row of itemRows) {
        const line = chunk.find((entry) => entry.rowIndex === row.rowIndex);
        if (!line || !row.id) {
          continue;
        }

        const quantity = normalizeImportQuantity(line.quantity);
        if (quantity) {
          versionValues.push({
            BoqItemId: row.id,
            BoqVersionId: boqVersionId,
            Quantity: quantity,
            CreatedBy: input.createdBy,
            CreatedAt: now,
            IsDeleted: false,
          });
        }

        createdItems.push({
          id: toBoqItemId(row.id),
          rowIndex: line.rowIndex,
          description: line.description,
          unit: line.unit,
          quantity: line.quantity,
          itemNo: line.itemNo,
          isHeader: line.isHeader,
          isMeasurable: line.isMeasurable,
          contextSnapshot: line.contextSnapshot,
        });
      }

      if (versionValues.length > 0) {
        await this.database.insert(boqItemVersions).values(versionValues);
      }
    }

    createdItems.sort((a, b) => a.rowIndex - b.rowIndex);

    return {
      projectId: toProjectId(projectId),
      boqId: toBoqId(boqId),
      boqVersionId: toBoqVersionId(boqVersionId),
      items: createdItems,
    };
  }
}

export async function ensureAspNetUser(input: {
  userId: string;
  email: string | null;
  displayName: string | null;
}): Promise<void> {
  const { getDb } = await import("@/infrastructure/persistence/db");
  const { aspNetUsers } = await import("@/drizzle/schema");
  const db = getDb();
  const now = new Date();
  const fullName = input.displayName?.trim() || input.email || "Workshop User";

  const existing = await db
    .select({ id: aspNetUsers.Id })
    .from(aspNetUsers)
    .where(eq(aspNetUsers.Id, input.userId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(aspNetUsers)
      .set({
        Email: input.email,
        FullName: fullName,
        IsActive: true,
        UpdatedAt: now,
      })
      .where(eq(aspNetUsers.Id, input.userId));
    return;
  }

  await db.insert(aspNetUsers).values({
    Id: input.userId,
    UserName: input.email,
    Email: input.email,
    FullName: fullName,
    IsActive: true,
    IsDeleted: false,
    CreatedAt: now,
    UpdatedAt: now,
  });
}
