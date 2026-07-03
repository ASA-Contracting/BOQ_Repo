ALTER TABLE "BoqItems" ADD COLUMN IF NOT EXISTS "MaterialNodeId" integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BoqItems_MaterialNodeId_material_nodes_id_fk'
  ) THEN
    ALTER TABLE "BoqItems"
      ADD CONSTRAINT "BoqItems_MaterialNodeId_material_nodes_id_fk"
      FOREIGN KEY ("MaterialNodeId") REFERENCES "material_nodes"("id")
      ON DELETE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "BoqItems_MaterialNodeId_idx" ON "BoqItems" ("MaterialNodeId");
