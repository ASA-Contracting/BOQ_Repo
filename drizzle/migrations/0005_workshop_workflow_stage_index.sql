CREATE INDEX IF NOT EXISTS "boq_work_batch_workflow_stage_idx"
  ON "boq_work_batch" ("workflow_stage");

CREATE INDEX IF NOT EXISTS "boq_work_batch_engineer_submitted_at_idx"
  ON "boq_work_batch" ("engineer_submitted_at" DESC NULLS LAST);
