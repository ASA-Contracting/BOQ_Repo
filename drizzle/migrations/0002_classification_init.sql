CREATE TABLE IF NOT EXISTS "classification_schemas" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_by" text
);

CREATE TABLE IF NOT EXISTS "level_types" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "prefix" text,
  "suffix" text,
  "is_numeric" boolean DEFAULT false NOT NULL,
  "standard_unit_id" integer,
  "is_active" boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS "level_maps" (
  "id" serial PRIMARY KEY NOT NULL,
  "schema_id" integer NOT NULL,
  "level_order" integer NOT NULL,
  "level_type_id" integer NOT NULL,
  "is_required" boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS "material_nodes" (
  "id" serial PRIMARY KEY NOT NULL,
  "schema_id" integer NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "parent_id" integer,
  "level_type_id" integer,
  "purpose" integer DEFAULT 1 NOT NULL,
  "value" numeric(18, 4),
  "unit_id" integer,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_by" text
);

CREATE TABLE IF NOT EXISTS "tags" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "material_tags" (
  "id" serial PRIMARY KEY NOT NULL,
  "material_node_id" integer NOT NULL,
  "tag_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "material_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "material_node_id" integer NOT NULL,
  "full_name" text NOT NULL,
  "path_ids" text
);

CREATE TABLE IF NOT EXISTS "material_sheets" (
  "id" serial PRIMARY KEY NOT NULL,
  "schema_id" integer NOT NULL,
  "material_node_id" integer,
  "columns_json" text,
  "rows_json" text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "level_maps" ADD CONSTRAINT "level_maps_schema_id_classification_schemas_id_fk"
  FOREIGN KEY ("schema_id") REFERENCES "public"."classification_schemas"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "level_maps" ADD CONSTRAINT "level_maps_level_type_id_level_types_id_fk"
  FOREIGN KEY ("level_type_id") REFERENCES "public"."level_types"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "material_nodes" ADD CONSTRAINT "material_nodes_schema_id_classification_schemas_id_fk"
  FOREIGN KEY ("schema_id") REFERENCES "public"."classification_schemas"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "material_nodes" ADD CONSTRAINT "material_nodes_level_type_id_level_types_id_fk"
  FOREIGN KEY ("level_type_id") REFERENCES "public"."level_types"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "material_tags" ADD CONSTRAINT "material_tags_material_node_id_material_nodes_id_fk"
  FOREIGN KEY ("material_node_id") REFERENCES "public"."material_nodes"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "material_tags" ADD CONSTRAINT "material_tags_tag_id_tags_id_fk"
  FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "material_items" ADD CONSTRAINT "material_items_material_node_id_material_nodes_id_fk"
  FOREIGN KEY ("material_node_id") REFERENCES "public"."material_nodes"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "material_sheets" ADD CONSTRAINT "material_sheets_schema_id_classification_schemas_id_fk"
  FOREIGN KEY ("schema_id") REFERENCES "public"."classification_schemas"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "material_sheets" ADD CONSTRAINT "material_sheets_material_node_id_material_nodes_id_fk"
  FOREIGN KEY ("material_node_id") REFERENCES "public"."material_nodes"("id") ON DELETE no action ON UPDATE no action;

CREATE UNIQUE INDEX IF NOT EXISTS "level_maps_schema_level_type_uq" ON "level_maps" ("schema_id", "level_type_id");
CREATE UNIQUE INDEX IF NOT EXISTS "level_maps_schema_order_uq" ON "level_maps" ("schema_id", "level_order");
CREATE UNIQUE INDEX IF NOT EXISTS "material_nodes_parent_name_purpose_uq" ON "material_nodes" ("parent_id", "name", "purpose", "schema_id");
CREATE UNIQUE INDEX IF NOT EXISTS "tags_name_uq" ON "tags" ("name");
CREATE UNIQUE INDEX IF NOT EXISTS "material_tags_node_tag_uq" ON "material_tags" ("material_node_id", "tag_id");
CREATE UNIQUE INDEX IF NOT EXISTS "material_sheets_schema_node_uq" ON "material_sheets" ("schema_id", "material_node_id");
