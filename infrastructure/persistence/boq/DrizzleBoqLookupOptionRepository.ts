import { and, asc, eq, inArray, sql } from "drizzle-orm";

import type {
  BoqLookupCategory,
  BoqLookupOptionDto,
  BoqLookupTone,
  CreateBoqLookupOptionInput,
  ReorderBoqLookupOptionsInput,
  UpdateBoqLookupOptionInput,
} from "@/application/dto/boq/boqLookupOptionDto";
import type { IBoqLookupOptionRepository } from "@/application/ports/IBoqLookupOptionRepository";
import { boqLookupOptions } from "@/drizzle/schema/boq-settings";
import { getDb } from "@/infrastructure/persistence/db";

function normalizeTone(value: string | null | undefined): BoqLookupTone | null {
  if (!value) return null;
  const key = value.trim().toLowerCase();
  if (key === "grey") return "gray";
  const allowed = new Set([
    "green",
    "yellow",
    "red",
    "blue",
    "purple",
    "teal",
    "orange",
    "gray",
  ]);
  return allowed.has(key) ? (key as BoqLookupTone) : null;
}

function mapRow(row: typeof boqLookupOptions.$inferSelect): BoqLookupOptionDto {
  return {
    id: row.id,
    category: row.category as BoqLookupCategory,
    name: row.name,
    customLabel: row.customLabel,
    tone: normalizeTone(row.tone),
    customHex: row.customHex,
    sortOrder: row.sortOrder,
  };
}

export class DrizzleBoqLookupOptionRepository implements IBoqLookupOptionRepository {
  async listByCategory(category: BoqLookupCategory): Promise<BoqLookupOptionDto[]> {
    const db = getDb();
    const rows = await db
      .select()
      .from(boqLookupOptions)
      .where(and(eq(boqLookupOptions.category, category), eq(boqLookupOptions.isDeleted, false)))
      .orderBy(asc(boqLookupOptions.sortOrder), asc(boqLookupOptions.name));

    return rows.map(mapRow);
  }

  async findById(id: number): Promise<BoqLookupOptionDto | null> {
    const db = getDb();
    const rows = await db
      .select()
      .from(boqLookupOptions)
      .where(and(eq(boqLookupOptions.id, id), eq(boqLookupOptions.isDeleted, false)))
      .limit(1);

    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(input: CreateBoqLookupOptionInput): Promise<BoqLookupOptionDto> {
    const db = getDb();
    const now = new Date();
    const sortOrder =
      input.sortOrder ??
      ((
        await db
          .select({
            maxOrder: sql<number>`coalesce(max(${boqLookupOptions.sortOrder}), -1)::int`,
          })
          .from(boqLookupOptions)
          .where(
            and(eq(boqLookupOptions.category, input.category), eq(boqLookupOptions.isDeleted, false)),
          )
      )[0]?.maxOrder ?? -1) + 1;

    const rows = await db
      .insert(boqLookupOptions)
      .values({
        category: input.category,
        name: input.name.trim(),
        customLabel: input.customLabel?.trim() || null,
        tone: input.customHex ? null : input.tone ?? null,
        customHex: input.customHex?.toLowerCase() ?? null,
        sortOrder,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const row = rows[0];
    if (!row) {
      throw new Error("Failed to create BOQ lookup option.");
    }

    return mapRow(row);
  }

  async update(input: UpdateBoqLookupOptionInput): Promise<BoqLookupOptionDto> {
    const db = getDb();
    const now = new Date();

    const rows = await db
      .update(boqLookupOptions)
      .set({
        name: input.name.trim(),
        customLabel: input.customLabel?.trim() || null,
        tone: input.customHex ? null : input.tone ?? null,
        customHex: input.customHex?.toLowerCase() ?? null,
        sortOrder: input.sortOrder,
        updatedAt: now,
      })
      .where(and(eq(boqLookupOptions.id, input.id), eq(boqLookupOptions.isDeleted, false)))
      .returning();

    const row = rows[0];
    if (!row) {
      throw new Error("BOQ lookup option not found.");
    }

    return mapRow(row);
  }

  async softDelete(id: number): Promise<void> {
    const db = getDb();
    const now = new Date();

    await db
      .update(boqLookupOptions)
      .set({ isDeleted: true, updatedAt: now })
      .where(and(eq(boqLookupOptions.id, id), eq(boqLookupOptions.isDeleted, false)));
  }

  async reorder(input: ReorderBoqLookupOptionsInput): Promise<BoqLookupOptionDto[]> {
    const db = getDb();
    const now = new Date();

    await db.transaction(async (tx) => {
      for (let index = 0; index < input.orderedIds.length; index += 1) {
        const id = input.orderedIds[index];
        if (id == null) continue;
        await tx
          .update(boqLookupOptions)
          .set({ sortOrder: index, updatedAt: now })
          .where(
            and(
              eq(boqLookupOptions.id, id),
              eq(boqLookupOptions.category, input.category),
              eq(boqLookupOptions.isDeleted, false),
            ),
          );
      }
    });

    const rows = await db
      .select()
      .from(boqLookupOptions)
      .where(
        and(
          eq(boqLookupOptions.category, input.category),
          eq(boqLookupOptions.isDeleted, false),
          inArray(boqLookupOptions.id, input.orderedIds),
        ),
      )
      .orderBy(asc(boqLookupOptions.sortOrder), asc(boqLookupOptions.name));

    return rows.map(mapRow);
  }
}
