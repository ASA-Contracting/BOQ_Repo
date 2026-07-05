ALTER TABLE "BoqVersions" ADD COLUMN "Discipline" varchar(150);

UPDATE "BoqVersions" bv
SET "Discipline" = sub.discipline
FROM (
  SELECT DISTINCT ON (b.linked_boq_version_id)
    b.linked_boq_version_id AS version_id,
    wi.context_snapshot_json::json->>'discipline' AS discipline
  FROM boq_work_batch b
  INNER JOIN boq_work_item wi ON wi.batch_id = b.id
  WHERE b.linked_boq_version_id IS NOT NULL
    AND wi.context_snapshot_json::json->>'discipline' IS NOT NULL
    AND wi.context_snapshot_json::json->>'discipline' <> ''
  ORDER BY b.linked_boq_version_id, wi.id
) sub
WHERE bv."Id" = sub.version_id
  AND bv."Discipline" IS NULL;
