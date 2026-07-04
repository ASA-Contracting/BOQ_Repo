import { and, desc, eq } from "drizzle-orm";

import type {
  DeleteSavedFilterInput,
  ListSavedFiltersInput,
  SavedFilterDto,
  SetFavoriteSavedFilterInput,
  UpsertSavedFilterInput,
} from "@/application/dto/preferences/savedFilterDto";
import type { ISavedFilterRepository } from "@/application/ports/ISavedFilterRepository";
import { savedPageFilters } from "@/drizzle/schema/preferences";
import { getDb } from "@/infrastructure/persistence/db";
import {
  normalizeSavedFilterDefinition,
  type SavedFilterDefinition,
} from "@/lib/filter-engine";

function toIsoString(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function readDefinition(raw: string): SavedFilterDefinition {
  try {
    const parsed = JSON.parse(raw) as SavedFilterDefinition;
    return normalizeSavedFilterDefinition(parsed) ?? { groups: [] };
  } catch {
    return { groups: [] };
  }
}

function mapRow(row: typeof savedPageFilters.$inferSelect): SavedFilterDto {
  return {
    id: row.id,
    pageKey: row.pageKey,
    name: row.name,
    definition: readDefinition(row.definitionJson),
    isFavorite: row.isFavorite,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  };
}

export class DrizzleSavedFilterRepository implements ISavedFilterRepository {
  async listByUserAndPage(userId: string, input: ListSavedFiltersInput): Promise<SavedFilterDto[]> {
    const db = getDb();
    const rows = await db
      .select()
      .from(savedPageFilters)
      .where(
        and(
          eq(savedPageFilters.userId, userId),
          eq(savedPageFilters.pageKey, input.pageKey.trim()),
          eq(savedPageFilters.isDeleted, false),
        ),
      )
      .orderBy(desc(savedPageFilters.isFavorite), desc(savedPageFilters.updatedAt), savedPageFilters.name);

    return rows.map(mapRow);
  }

  async upsert(userId: string, input: UpsertSavedFilterInput): Promise<SavedFilterDto> {
    const db = getDb();
    const pageKey = input.pageKey.trim();
    const name = input.name.trim();
    const definition = normalizeSavedFilterDefinition(input.definition);
    if (!definition) {
      throw new Error("Saved filter definition is empty.");
    }

    const now = new Date();
    const definitionJson = JSON.stringify(definition);

    const existing = await db
      .select()
      .from(savedPageFilters)
      .where(
        and(
          eq(savedPageFilters.userId, userId),
          eq(savedPageFilters.pageKey, pageKey),
          eq(savedPageFilters.name, name),
        ),
      )
      .limit(1);

    if (existing[0]) {
      const [updated] = await db
        .update(savedPageFilters)
        .set({
          definitionJson,
          isDeleted: false,
          updatedAt: now,
        })
        .where(eq(savedPageFilters.id, existing[0].id))
        .returning();
      return mapRow(updated);
    }

    const [created] = await db
      .insert(savedPageFilters)
      .values({
        userId,
        pageKey,
        name,
        definitionJson,
        isFavorite: false,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return mapRow(created);
  }

  async delete(userId: string, input: DeleteSavedFilterInput): Promise<void> {
    const db = getDb();
    await db
      .update(savedPageFilters)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(and(eq(savedPageFilters.id, input.id), eq(savedPageFilters.userId, userId)));
  }

  async setFavorite(userId: string, input: SetFavoriteSavedFilterInput): Promise<SavedFilterDto> {
    const db = getDb();
    const [entity] = await db
      .select()
      .from(savedPageFilters)
      .where(
        and(
          eq(savedPageFilters.id, input.id),
          eq(savedPageFilters.userId, userId),
          eq(savedPageFilters.isDeleted, false),
        ),
      )
      .limit(1);

    if (!entity) {
      throw new Error("Saved filter not found.");
    }

    const makeFavorite = !entity.isFavorite;
    const now = new Date();

    await db
      .update(savedPageFilters)
      .set({ isFavorite: false })
      .where(
        and(eq(savedPageFilters.userId, userId), eq(savedPageFilters.pageKey, entity.pageKey)),
      );

    const [updated] = await db
      .update(savedPageFilters)
      .set({
        isFavorite: makeFavorite,
        updatedAt: makeFavorite ? now : entity.updatedAt,
      })
      .where(eq(savedPageFilters.id, entity.id))
      .returning();

    return mapRow(updated);
  }
}
