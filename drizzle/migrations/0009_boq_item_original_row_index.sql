ALTER TABLE "BoqItems" ADD COLUMN IF NOT EXISTS "OriginalRowIndex" integer;

UPDATE "BoqItems"
SET "OriginalRowIndex" = "RowIndex"
WHERE "OriginalRowIndex" IS NULL;
