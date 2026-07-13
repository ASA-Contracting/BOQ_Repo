-- Clients master list (ABRD Owner / Owner-Contractor)
CREATE TABLE IF NOT EXISTS "Clients" (
  "Id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Name" varchar(150) NOT NULL,
  "AbdrOwnerId" integer,
  "ExternalSource" varchar(20) NOT NULL DEFAULT 'local',
  "IsDeleted" boolean NOT NULL DEFAULT false,
  "CreatedAt" timestamp with time zone,
  "UpdatedAt" timestamp with time zone
);

CREATE UNIQUE INDEX IF NOT EXISTS "Clients_AbdrOwnerId_unique"
  ON "Clients" ("AbdrOwnerId")
  WHERE "AbdrOwnerId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Clients_Name_active_uq"
  ON "Clients" (lower("Name"))
  WHERE "IsDeleted" = false;

ALTER TABLE "Projects"
  ADD COLUMN IF NOT EXISTS "ClientId" integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Projects_ClientId_Clients_Id_fk'
  ) THEN
    ALTER TABLE "Projects"
      ADD CONSTRAINT "Projects_ClientId_Clients_Id_fk"
      FOREIGN KEY ("ClientId") REFERENCES "Clients" ("Id")
      ON DELETE NO ACTION;
  END IF;
END $$;
