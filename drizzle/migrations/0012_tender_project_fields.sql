-- Tender project metadata from ABRD export (final master list)
ALTER TABLE "Projects"
  ADD COLUMN IF NOT EXISTS "TenderStatus" varchar(50),
  ADD COLUMN IF NOT EXISTS "Country" varchar(100),
  ADD COLUMN IF NOT EXISTS "AssignedTo" varchar(150),
  ADD COLUMN IF NOT EXISTS "OwnerType" varchar(50);

CREATE INDEX IF NOT EXISTS "Projects_TenderStatus_idx"
  ON "Projects" ("TenderStatus")
  WHERE "IsDeleted" = false AND "TenderStatus" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "Projects_Country_idx"
  ON "Projects" ("Country")
  WHERE "IsDeleted" = false AND "Country" IS NOT NULL;
