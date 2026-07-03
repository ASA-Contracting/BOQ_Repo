-- Import campaign orchestration for bulk Excel BOQ ingestion

CREATE TABLE IF NOT EXISTS "boq_work_import_campaign" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "name" varchar(150) NOT NULL,
  "status" varchar(30) NOT NULL,
  "total_files" integer NOT NULL DEFAULT 0,
  "imported_count" integer NOT NULL DEFAULT 0,
  "ai_complete_count" integer NOT NULL DEFAULT 0,
  "failed_count" integer NOT NULL DEFAULT 0,
  "default_column_mapping_json" text,
  "created_by" varchar(450) NOT NULL,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  CONSTRAINT "boq_work_import_campaign_created_by_AspNetUsers_Id_fk"
    FOREIGN KEY ("created_by") REFERENCES "AspNetUsers"("Id") ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "boq_work_import_job" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "campaign_id" integer NOT NULL,
  "file_name" varchar(500) NOT NULL,
  "file_content_base64" text,
  "status" varchar(30) NOT NULL,
  "workshop_batch_id" integer,
  "error_message" text,
  "sheet_name" varchar(200),
  "column_mapping_json" text,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "started_at" timestamptz,
  "completed_at" timestamptz,
  CONSTRAINT "boq_work_import_job_campaign_id_boq_work_import_campaign_id_fk"
    FOREIGN KEY ("campaign_id") REFERENCES "boq_work_import_campaign"("id") ON DELETE NO ACTION,
  CONSTRAINT "boq_work_import_job_workshop_batch_id_boq_work_batch_id_fk"
    FOREIGN KEY ("workshop_batch_id") REFERENCES "boq_work_batch"("id") ON DELETE NO ACTION
);

CREATE INDEX IF NOT EXISTS "IX_boq_work_import_job_campaign_status"
  ON "boq_work_import_job" ("campaign_id", "status");
