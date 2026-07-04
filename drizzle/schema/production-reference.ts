import { foreignKey } from "drizzle-orm/pg-core";
import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const projects = pgTable("Projects", {
  Id: integer("Id").primaryKey().generatedAlwaysAsIdentity(),
  Name: varchar("Name", { length: 150 }).notNull(),
  Description: text("Description"),
  AbdrProjectId: integer("AbdrProjectId"),
  ExternalSource: varchar("ExternalSource", { length: 20 }).notNull().default("local"),
  Client: varchar("Client", { length: 150 }).notNull().default("TBD"),
  Status: varchar("Status", { length: 50 }).notNull().default("active"),
  IsDeleted: boolean("IsDeleted").notNull().default(false),
  CreatedAt: timestamp("CreatedAt", { withTimezone: true, mode: "date" }),
  UpdatedAt: timestamp("UpdatedAt", { withTimezone: true, mode: "date" }),
});

export const boqs = pgTable(
  "Boqs",
  {
    Id: integer("Id").primaryKey().generatedAlwaysAsIdentity(),
    Name: varchar("Name", { length: 150 }).notNull(),
    Description: text("Description"),
    ProjectId: integer("ProjectId").notNull(),
    CreatedBy: text("CreatedBy"),
    IsDeleted: boolean("IsDeleted").notNull().default(false),
  },
  (table) => [
    foreignKey({
      name: "Boqs_ProjectId_Projects_Id_fk",
      columns: [table.ProjectId],
      foreignColumns: [projects.Id],
    }).onDelete("no action"),
  ],
);

export const boqVersions = pgTable(
  "BoqVersions",
  {
    Id: integer("Id").primaryKey().generatedAlwaysAsIdentity(),
    BoqId: integer("BoqId").notNull(),
    VersionName: varchar("VersionName", { length: 250 }),
    VersionNumber: integer("VersionNumber"),
    ApprovalStatus: varchar("ApprovalStatus", { length: 30 }).notNull().default("draft"),
    Notes: text("Notes"),
    Source: varchar("Source", { length: 200 }),
    CreatedBy: varchar("CreatedBy", { length: 200 }),
    CreatedAt: timestamp("CreatedAt", { withTimezone: true, mode: "date" }).notNull(),
    IsDeleted: boolean("IsDeleted").notNull().default(false),
  },
  (table) => [
    foreignKey({
      name: "BoqVersions_BoqId_Boqs_Id_fk",
      columns: [table.BoqId],
      foreignColumns: [boqs.Id],
    }).onDelete("no action"),
  ],
);

export const familyLevelTypes = pgTable("FamilyLevelTypes", {
  Id: integer("Id").primaryKey().generatedAlwaysAsIdentity(),
  Name: varchar("Name", { length: 50 }).notNull(),
});

export const families = pgTable(
  "Families",
  {
    Id: integer("Id").primaryKey().generatedAlwaysAsIdentity(),
    Name: varchar("Name", { length: 100 }).notNull(),
    ReferenceCode: text("ReferenceCode"),
    Description: text("Description"),
    FamilyLevelTypeId: integer("FamilyLevelTypeId").notNull(),
    ParentId: integer("ParentId"),
  },
  (table) => [
    foreignKey({
      name: "Families_FamilyLevelTypeId_FamilyLevelTypes_Id_fk",
      columns: [table.FamilyLevelTypeId],
      foreignColumns: [familyLevelTypes.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "Families_ParentId_Families_Id_fk",
      columns: [table.ParentId],
      foreignColumns: [table.Id],
    }).onDelete("no action"),
  ],
);

export const boqItems = pgTable(
  "BoqItems",
  {
    Id: integer("Id").primaryKey().generatedAlwaysAsIdentity(),
    BoqId: integer("BoqId").notNull(),
    RowIndex: integer("RowIndex").notNull(),
    OriginalRowIndex: integer("OriginalRowIndex"),
    ItemNo: varchar("ItemNo", { length: 150 }),
    Description: text("Description"),
    Unit: varchar("Unit", { length: 50 }),
    IsHeader: boolean("IsHeader").notNull().default(false),
    IsMeasurable: boolean("IsMeasurable").notNull().default(true),
    FamilyId: integer("FamilyId"),
    MaterialNodeId: integer("MaterialNodeId"),
    BuildingId: integer("BuildingId"),
    IsDeleted: boolean("IsDeleted").notNull().default(false),
    UpdatedAt: timestamp("UpdatedAt", { withTimezone: true, mode: "date" }),
  },
  (table) => [
    foreignKey({
      name: "BoqItems_BoqId_Boqs_Id_fk",
      columns: [table.BoqId],
      foreignColumns: [boqs.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "BoqItems_FamilyId_Families_Id_fk",
      columns: [table.FamilyId],
      foreignColumns: [families.Id],
    }).onDelete("no action"),
  ],
);

export const boqItemVersions = pgTable(
  "BoqItemVersions",
  {
    Id: integer("Id").primaryKey().generatedAlwaysAsIdentity(),
    BoqItemId: integer("BoqItemId").notNull(),
    BoqVersionId: integer("BoqVersionId").notNull(),
    Quantity: numeric("Quantity", { precision: 18, scale: 2 }),
    UnitRate: numeric("UnitRate", { precision: 18, scale: 2 }),
    TotalSale: numeric("TotalSale", { precision: 18, scale: 4 }),
    CreatedBy: varchar("CreatedBy", { length: 255 }),
    CreatedAt: timestamp("CreatedAt", { withTimezone: true, mode: "date" }).notNull(),
    IsDeleted: boolean("IsDeleted").notNull().default(false),
    Notes1: text("Notes1"),
    Notes2: text("Notes2"),
  },
  (table) => [
    foreignKey({
      name: "BoqItemVersions_BoqItemId_BoqItems_Id_fk",
      columns: [table.BoqItemId],
      foreignColumns: [boqItems.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "BoqItemVersions_BoqVersionId_BoqVersions_Id_fk",
      columns: [table.BoqVersionId],
      foreignColumns: [boqVersions.Id],
    }).onDelete("no action"),
  ],
);

export const aspNetUsers = pgTable("AspNetUsers", {
  Id: varchar("Id", { length: 450 }).primaryKey(),
  UserName: varchar("UserName", { length: 256 }),
  Email: varchar("Email", { length: 256 }),
  FullName: varchar("FullName", { length: 150 }).notNull(),
  IsActive: boolean("IsActive").notNull().default(false),
  IsDeleted: boolean("IsDeleted").notNull().default(false),
  CreatedAt: timestamp("CreatedAt", { withTimezone: true, mode: "date" }).notNull(),
  UpdatedAt: timestamp("UpdatedAt", { withTimezone: true, mode: "date" }).notNull(),
});

export const auditTrails = pgTable(
  "AuditTrails",
  {
    Id: uuid("Id").primaryKey().defaultRandom(),
    UserId: varchar("UserId", { length: 450 }),
    UserName: varchar("UserName", { length: 256 }),
    EntityName: varchar("EntityName", { length: 200 }).notNull(),
    EntityId: varchar("EntityId", { length: 100 }),
    ActionType: varchar("ActionType", { length: 50 }).notNull(),
    Description: text("Description"),
    OldValues: text("OldValues"),
    NewValues: text("NewValues"),
    ChangedColumns: text("ChangedColumns"),
    Timestamp: timestamp("Timestamp", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    foreignKey({
      name: "AuditTrails_UserId_AspNetUsers_Id_fk",
      columns: [table.UserId],
      foreignColumns: [aspNetUsers.Id],
    }).onDelete("no action"),
  ],
);
