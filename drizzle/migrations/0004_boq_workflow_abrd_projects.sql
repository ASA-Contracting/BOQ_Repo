-- Projects: ABRD linkage + Master Spec §6.1 fields
ALTER TABLE "Projects"
  ADD COLUMN IF NOT EXISTS "AbdrProjectId" integer,
  ADD COLUMN IF NOT EXISTS "ExternalSource" varchar(20) NOT NULL DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS "Client" varchar(150) NOT NULL DEFAULT 'TBD',
  ADD COLUMN IF NOT EXISTS "Status" varchar(50) NOT NULL DEFAULT 'active';

CREATE UNIQUE INDEX IF NOT EXISTS "Projects_AbdrProjectId_unique"
  ON "Projects" ("AbdrProjectId")
  WHERE "AbdrProjectId" IS NOT NULL;

-- BOQ versions: approval workflow
ALTER TABLE "BoqVersions"
  ADD COLUMN IF NOT EXISTS "VersionNumber" integer,
  ADD COLUMN IF NOT EXISTS "ApprovalStatus" varchar(30) NOT NULL DEFAULT 'draft';

-- Workshop batch: two-stage review workflow
ALTER TABLE "boq_work_batch"
  ADD COLUMN IF NOT EXISTS "workflow_stage" varchar(40) NOT NULL DEFAULT 'imported',
  ADD COLUMN IF NOT EXISTS "linked_boq_version_id" integer,
  ADD COLUMN IF NOT EXISTS "engineer_submitted_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "engineer_submitted_by" varchar(450),
  ADD COLUMN IF NOT EXISTS "section_head_approved_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "section_head_approved_by" varchar(450),
  ADD COLUMN IF NOT EXISTS "return_to_engineer_notes" text;

ALTER TABLE "boq_work_batch"
  ADD CONSTRAINT "boq_work_batch_linked_boq_version_id_BoqVersions_Id_fk"
  FOREIGN KEY ("linked_boq_version_id") REFERENCES "BoqVersions" ("Id")
  ON DELETE NO ACTION;

ALTER TABLE "boq_work_batch"
  ADD CONSTRAINT "boq_work_batch_engineer_submitted_by_AspNetUsers_Id_fk"
  FOREIGN KEY ("engineer_submitted_by") REFERENCES "AspNetUsers" ("Id")
  ON DELETE NO ACTION;

ALTER TABLE "boq_work_batch"
  ADD CONSTRAINT "boq_work_batch_section_head_approved_by_AspNetUsers_Id_fk"
  FOREIGN KEY ("section_head_approved_by") REFERENCES "AspNetUsers" ("Id")
  ON DELETE NO ACTION;

-- Backfill workflow_stage from legacy status
UPDATE "boq_work_batch"
SET "workflow_stage" = CASE
  WHEN "status" = 'ai_running' THEN 'ai_running'
  WHEN "status" = 'ready_for_review' THEN 'ready_for_engineer_review'
  WHEN "status" = 'completed' THEN 'completed'
  ELSE 'imported'
END
WHERE "workflow_stage" = 'imported';
