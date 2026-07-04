CREATE TABLE "boq_lookup_options" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "boq_lookup_options_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"category" varchar(50) NOT NULL,
	"name" varchar(150) NOT NULL,
	"custom_label" varchar(100),
	"tone" varchar(20),
	"custom_hex" varchar(7),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "boq_lookup_options_category_name_active_uq" ON "boq_lookup_options" ("category", lower("name")) WHERE "is_deleted" = false;
--> statement-breakpoint
INSERT INTO "boq_lookup_options" ("category", "name", "tone", "sort_order", "is_deleted", "created_at", "updated_at") VALUES
  ('discipline', 'Electrical', 'blue', 0, false, NOW(), NOW()),
  ('discipline', 'HVAC', 'teal', 1, false, NOW(), NOW()),
  ('discipline', 'Plumbing', 'green', 2, false, NOW(), NOW()),
  ('discipline', 'Fire Protection', 'red', 3, false, NOW(), NOW());
