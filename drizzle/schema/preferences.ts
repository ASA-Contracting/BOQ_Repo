import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const savedPageFilters = pgTable("saved_page_filters", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id", { length: 450 }).notNull(),
  pageKey: varchar("page_key", { length: 200 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  definitionJson: text("definition_json").notNull(),
  isFavorite: boolean("is_favorite").notNull().default(false),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
});
