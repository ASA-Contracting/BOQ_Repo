import {
  boolean,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const boqLookupOptions = pgTable(
  "boq_lookup_options",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    category: varchar("category", { length: 50 }).notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    customLabel: varchar("custom_label", { length: 100 }),
    tone: varchar("tone", { length: 20 }),
    customHex: varchar("custom_hex", { length: 7 }),
    sortOrder: integer("sort_order").notNull().default(0),
    isDeleted: boolean("is_deleted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    uniqueIndex("boq_lookup_options_category_name_active_uq")
      .on(table.category, sql`lower(${table.name})`)
      .where(sql`${table.isDeleted} = false`),
  ],
);
