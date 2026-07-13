import { and, asc, eq, ilike, sql } from "drizzle-orm";

import { clients } from "@/drizzle/schema";
import type { Client, NewClient } from "@/domain/client/Client";
import { toClientId, type ClientId } from "@/domain/client/ids";
import type {
  AbrdClientImportInput,
  ClientListQuery,
  ClientListResult,
  IClientRepository,
} from "@/domain/client/repositories/IClientRepository";
import { DrizzleRepository } from "@/infrastructure/persistence/repositories/BaseRepository";

function mapRowToClient(row: typeof clients.$inferSelect): Client {
  return {
    id: toClientId(row.Id),
    name: row.Name,
    abrdOwnerId: row.AbdrOwnerId ?? null,
    externalSource: row.ExternalSource ?? "local",
    createdAt: row.CreatedAt ?? null,
    updatedAt: row.UpdatedAt ?? null,
  };
}

export class DrizzleClientRepository extends DrizzleRepository implements IClientRepository {
  async findById(id: ClientId): Promise<Client | null> {
    const rows = await this.database
      .select()
      .from(clients)
      .where(and(eq(clients.Id, id), eq(clients.IsDeleted, false)))
      .limit(1);

    const row = rows[0];
    return row ? mapRowToClient(row) : null;
  }

  async findByAbdrOwnerId(abrdOwnerId: number): Promise<Client | null> {
    const rows = await this.database
      .select()
      .from(clients)
      .where(and(eq(clients.AbdrOwnerId, abrdOwnerId), eq(clients.IsDeleted, false)))
      .limit(1);

    const row = rows[0];
    return row ? mapRowToClient(row) : null;
  }

  async findByName(name: string): Promise<Client | null> {
    const trimmed = name.trim();
    if (!trimmed) {
      return null;
    }

    const rows = await this.database
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.IsDeleted, false),
          sql`lower(${clients.Name}) = lower(${trimmed})`,
        ),
      )
      .limit(1);

    const row = rows[0];
    return row ? mapRowToClient(row) : null;
  }

  async list(query: ClientListQuery): Promise<ClientListResult> {
    const offset = (query.page - 1) * query.pageSize;
    const searchPattern = query.search?.trim() ? `%${query.search.trim()}%` : null;

    const whereClause = searchPattern
      ? and(eq(clients.IsDeleted, false), ilike(clients.Name, searchPattern))
      : eq(clients.IsDeleted, false);

    const [rows, countRows] = await Promise.all([
      this.database
        .select()
        .from(clients)
        .where(whereClause)
        .orderBy(asc(clients.Name))
        .limit(query.pageSize)
        .offset(offset),
      this.database
        .select({ total: sql<number>`count(*)::int` })
        .from(clients)
        .where(whereClause),
    ]);

    return {
      items: rows.map(mapRowToClient),
      total: countRows[0]?.total ?? 0,
    };
  }

  async create(input: NewClient): Promise<Client> {
    const now = new Date();
    const rows = await this.database
      .insert(clients)
      .values({
        Name: input.name.trim(),
        AbdrOwnerId: input.abrdOwnerId ?? null,
        ExternalSource: input.externalSource ?? "local",
        IsDeleted: false,
        CreatedAt: now,
        UpdatedAt: now,
      })
      .returning();

    const row = rows[0];
    if (!row) {
      throw new Error("Failed to create client.");
    }

    return mapRowToClient(row);
  }

  async importFromAbrd(input: AbrdClientImportInput): Promise<"imported" | "skipped"> {
    const existing = await this.findByAbdrOwnerId(input.abrdOwnerId);
    if (existing) {
      return "skipped";
    }

    await this.create({
      name: input.name,
      abrdOwnerId: input.abrdOwnerId,
      externalSource: "abrd",
    });

    return "imported";
  }
}
