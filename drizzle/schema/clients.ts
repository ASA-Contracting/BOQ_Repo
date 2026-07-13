import { foreignKey } from "drizzle-orm/pg-core";
import { boolean, integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const clients = pgTable("Clients", {
  Id: integer("Id").primaryKey().generatedAlwaysAsIdentity(),
  Name: varchar("Name", { length: 150 }).notNull(),
  AbdrOwnerId: integer("AbdrOwnerId"),
  ExternalSource: varchar("ExternalSource", { length: 20 }).notNull().default("local"),
  IsDeleted: boolean("IsDeleted").notNull().default(false),
  CreatedAt: timestamp("CreatedAt", { withTimezone: true, mode: "date" }),
  UpdatedAt: timestamp("UpdatedAt", { withTimezone: true, mode: "date" }),
});
