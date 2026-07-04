import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const classificationSchemas = pgTable('classification_schemas', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: text('created_by'),
});

export const levelTypes = pgTable('level_types', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  prefix: text('prefix'),
  suffix: text('suffix'),
  isNumeric: boolean('is_numeric').notNull().default(false),
  standardUnitId: integer('standard_unit_id'),
  isActive: boolean('is_active').notNull().default(true),
});

export const levelMaps = pgTable(
  'level_maps',
  {
    id: serial('id').primaryKey(),
    schemaId: integer('schema_id')
      .notNull()
      .references(() => classificationSchemas.id, { onDelete: 'no action' }),
    levelOrder: integer('level_order').notNull(),
    levelTypeId: integer('level_type_id')
      .notNull()
      .references(() => levelTypes.id, { onDelete: 'no action' }),
    isRequired: boolean('is_required').notNull().default(true),
  },
  (table) => [
    uniqueIndex('level_maps_schema_level_type_uq').on(table.schemaId, table.levelTypeId),
    uniqueIndex('level_maps_schema_order_uq').on(table.schemaId, table.levelOrder),
  ]
);

export const materialNodes = pgTable(
  'material_nodes',
  {
    id: serial('id').primaryKey(),
    schemaId: integer('schema_id')
      .notNull()
      .references(() => classificationSchemas.id, { onDelete: 'no action' }),
    name: text('name').notNull(),
    description: text('description'),
    parentId: integer('parent_id'),
    levelTypeId: integer('level_type_id').references(() => levelTypes.id, {
      onDelete: 'no action',
    }),
    purpose: integer('purpose').notNull().default(1),
    value: decimal('value', { precision: 18, scale: 4 }),
    unitId: integer('unit_id'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: text('created_by'),
  },
  (table) => [
    uniqueIndex('material_nodes_parent_name_purpose_uq').on(
      table.parentId,
      table.name,
      table.purpose,
      table.schemaId
    ),
  ]
);

export const tags = pgTable(
  'tags',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    color: text('color'),
  },
  (table) => [uniqueIndex('tags_name_uq').on(table.name)]
);

export const materialTags = pgTable(
  'material_tags',
  {
    id: serial('id').primaryKey(),
    materialNodeId: integer('material_node_id')
      .notNull()
      .references(() => materialNodes.id, { onDelete: 'no action' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'no action' }),
  },
  (table) => [
    uniqueIndex('material_tags_node_tag_uq').on(table.materialNodeId, table.tagId),
  ]
);

export const materialItems = pgTable('material_items', {
  id: serial('id').primaryKey(),
  materialNodeId: integer('material_node_id')
    .notNull()
    .references(() => materialNodes.id, { onDelete: 'no action' }),
  fullName: text('full_name').notNull(),
  pathIds: text('path_ids'),
});

export const materialSheets = pgTable(
  'material_sheets',
  {
    id: serial('id').primaryKey(),
    schemaId: integer('schema_id')
      .notNull()
      .references(() => classificationSchemas.id, { onDelete: 'no action' }),
    materialNodeId: integer('material_node_id').references(() => materialNodes.id, {
      onDelete: 'no action',
    }),
    columnsJson: text('columns_json'),
    rowsJson: text('rows_json'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('material_sheets_schema_node_uq').on(table.schemaId, table.materialNodeId),
  ]
);

export const classificationSchemasRelations = relations(classificationSchemas, ({ many }) => ({
  levelMaps: many(levelMaps),
  materialNodes: many(materialNodes),
  materialSheets: many(materialSheets),
}));

export const levelTypesRelations = relations(levelTypes, ({ many }) => ({
  levelMaps: many(levelMaps),
  materialNodes: many(materialNodes),
}));

export const levelMapsRelations = relations(levelMaps, ({ one }) => ({
  schema: one(classificationSchemas, {
    fields: [levelMaps.schemaId],
    references: [classificationSchemas.id],
  }),
  levelType: one(levelTypes, {
    fields: [levelMaps.levelTypeId],
    references: [levelTypes.id],
  }),
}));

export const materialNodesRelations = relations(materialNodes, ({ one, many }) => ({
  schema: one(classificationSchemas, {
    fields: [materialNodes.schemaId],
    references: [classificationSchemas.id],
  }),
  parent: one(materialNodes, {
    fields: [materialNodes.parentId],
    references: [materialNodes.id],
    relationName: 'nodeParent',
  }),
  levelType: one(levelTypes, {
    fields: [materialNodes.levelTypeId],
    references: [levelTypes.id],
  }),
  materialItems: many(materialItems),
  materialTags: many(materialTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  materialTags: many(materialTags),
}));

export const materialTagsRelations = relations(materialTags, ({ one }) => ({
  materialNode: one(materialNodes, {
    fields: [materialTags.materialNodeId],
    references: [materialNodes.id],
  }),
  tag: one(tags, {
    fields: [materialTags.tagId],
    references: [tags.id],
  }),
}));

export const materialItemsRelations = relations(materialItems, ({ one }) => ({
  materialNode: one(materialNodes, {
    fields: [materialItems.materialNodeId],
    references: [materialNodes.id],
  }),
}));

export const materialSheetsRelations = relations(materialSheets, ({ one }) => ({
  schema: one(classificationSchemas, {
    fields: [materialSheets.schemaId],
    references: [classificationSchemas.id],
  }),
  materialNode: one(materialNodes, {
    fields: [materialSheets.materialNodeId],
    references: [materialNodes.id],
  }),
}));
