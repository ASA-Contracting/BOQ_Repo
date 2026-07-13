import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";

import { clients, projects } from "@/drizzle/schema";
import type { NewProject, Project } from "@/domain/project/Project";
import { toProjectId, type ProjectId } from "@/domain/project/ids";
import type {
  IProjectRepository,
  ProjectListQuery,
  ProjectListResult,
  UpdateProjectInput,
  AbrdProjectImportInput,
  TenderProjectImportInput,
} from "@/domain/project/repositories/IProjectRepository";
import { DrizzleRepository } from "@/infrastructure/persistence/repositories/BaseRepository";

function mapRowToProject(row: typeof projects.$inferSelect): Project {
  return {
    id: toProjectId(row.Id),
    name: row.Name,
    description: row.Description ?? null,
    client: row.Client,
    clientId: row.ClientId ?? null,
    tenderStatus: row.TenderStatus ?? null,
    country: row.Country ?? null,
    assignedTo: row.AssignedTo ?? null,
    ownerType: row.OwnerType ?? null,
    status: row.Status === "closed" ? "closed" : "active",
    abrdProjectId: row.AbdrProjectId ?? null,
    externalSource: row.ExternalSource ?? "local",
    createdAt: row.CreatedAt ?? null,
    updatedAt: row.UpdatedAt ?? null,
  };
}

export class DrizzleProjectRepository
  extends DrizzleRepository
  implements IProjectRepository
{
  async findById(id: ProjectId): Promise<Project | null> {
    const rows = await this.database
      .select()
      .from(projects)
      .where(and(eq(projects.Id, id), eq(projects.IsDeleted, false)))
      .limit(1);

    const row = rows[0];
    return row ? mapRowToProject(row) : null;
  }

  async list(query: ProjectListQuery): Promise<ProjectListResult> {
    const offset = (query.page - 1) * query.pageSize;
    const searchPattern = query.search?.trim()
      ? `%${query.search.trim()}%`
      : null;

    const whereClause = searchPattern
      ? and(
          eq(projects.IsDeleted, false),
          or(
            ilike(projects.Name, searchPattern),
            ilike(projects.Client, searchPattern),
          ),
        )
      : eq(projects.IsDeleted, false);

    const [rows, countRows] = await Promise.all([
      this.database
        .select()
        .from(projects)
        .where(whereClause)
        .orderBy(desc(projects.CreatedAt), asc(projects.Name))
        .limit(query.pageSize)
        .offset(offset),
      this.database
        .select({ total: sql<number>`count(*)::int` })
        .from(projects)
        .where(whereClause),
    ]);

    return {
      items: rows.map(mapRowToProject),
      total: countRows[0]?.total ?? 0,
    };
  }

  async create(input: NewProject): Promise<Project> {
    const now = new Date();
    let client = input.client?.trim() || "TBD";
    if (input.clientId != null) {
      const clientRows = await this.database
        .select({ name: clients.Name })
        .from(clients)
        .where(and(eq(clients.Id, input.clientId), eq(clients.IsDeleted, false)))
        .limit(1);
      if (!clientRows[0]) {
        throw new Error("Client not found.");
      }
      client = clientRows[0].name;
    }
    const rows = await this.database
      .insert(projects)
      .values({
        Name: input.name,
        Description: input.description ?? null,
        Client: client,
        ClientId: input.clientId ?? null,
        TenderStatus: input.tenderStatus ?? null,
        Country: input.country ?? null,
        AssignedTo: input.assignedTo ?? null,
        OwnerType: input.ownerType ?? null,
        Status: "active",
        AbdrProjectId: input.abrdProjectId ?? null,
        ExternalSource: input.externalSource ?? "local",
        IsDeleted: false,
        CreatedAt: now,
        UpdatedAt: now,
      })
      .returning();

    const row = rows[0];
    if (!row) {
      throw new Error("Failed to create project.");
    }

    return mapRowToProject(row);
  }

  async update(id: ProjectId, input: UpdateProjectInput): Promise<Project> {
    const now = new Date();
    const rows = await this.database
      .update(projects)
      .set({
        ...(input.name !== undefined ? { Name: input.name } : {}),
        ...(input.client !== undefined ? { Client: input.client } : {}),
        ...(input.description !== undefined ? { Description: input.description } : {}),
        UpdatedAt: now,
      })
      .where(and(eq(projects.Id, id), eq(projects.IsDeleted, false)))
      .returning();

    const row = rows[0];
    if (!row) {
      throw new Error(`Project ${id} not found.`);
    }

    return mapRowToProject(row);
  }

  async close(id: ProjectId): Promise<Project> {
    const now = new Date();
    const rows = await this.database
      .update(projects)
      .set({
        Status: "closed",
        UpdatedAt: now,
      })
      .where(and(eq(projects.Id, id), eq(projects.IsDeleted, false)))
      .returning();

    const row = rows[0];
    if (!row) {
      throw new Error(`Project ${id} not found.`);
    }

    return mapRowToProject(row);
  }

  async importFromAbrd(
    input: AbrdProjectImportInput,
  ): Promise<"imported" | "skipped"> {
    const existing = await this.database
      .select({ id: projects.Id })
      .from(projects)
      .where(and(eq(projects.AbdrProjectId, input.abrdProjectId), eq(projects.IsDeleted, false)))
      .limit(1);
    if (existing.length > 0) return "skipped";

    await this.create({
      name: input.name,
      client: input.client,
      clientId: input.clientId,
      abrdProjectId: input.abrdProjectId,
      externalSource: "abrd",
    });
    return "imported";
  }

  async importFromTenderCsv(
    input: TenderProjectImportInput,
  ): Promise<"imported" | "updated" | "skipped"> {
    const existing = input.abrdProjectId == null
      ? []
      : await this.database
          .select({ id: projects.Id })
          .from(projects)
          .where(and(eq(projects.AbdrProjectId, input.abrdProjectId), eq(projects.IsDeleted, false)))
          .limit(1);

    const values = {
      Name: input.name,
      Client: input.client,
      ClientId: input.clientId,
      AbdrProjectId: input.abrdProjectId,
      ExternalSource: "abrd",
      OwnerType: input.ownerType,
      TenderStatus: input.tenderStatus,
      Country: input.country,
      AssignedTo: input.assignedTo,
      UpdatedAt: new Date(),
    };

    if (existing[0]) {
      await this.database.update(projects).set(values).where(eq(projects.Id, existing[0].id));
      return "updated";
    }

    await this.database.insert(projects).values({
      ...values,
      Status: "active",
      IsDeleted: false,
      CreatedAt: new Date(),
    });
    return "imported";
  }
}
