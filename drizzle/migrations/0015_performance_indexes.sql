-- BOQ breakdown cursor pagination + pricing pivot scan performance
CREATE INDEX IF NOT EXISTS idx_boq_items_boq_row
  ON boq_items ("BoqId", "RowIndex", "Id")
  WHERE "IsDeleted" = false;

CREATE INDEX IF NOT EXISTS idx_boq_items_measurable
  ON boq_items ("BoqId", "IsMeasurable", "IsHeader", "MaterialNodeId")
  WHERE "IsDeleted" = false;

CREATE INDEX IF NOT EXISTS idx_boq_item_versions_item_version
  ON boq_item_versions ("BoqItemId", "BoqVersionId")
  WHERE "IsDeleted" = false;

CREATE INDEX IF NOT EXISTS idx_boq_versions_boq_created
  ON boq_versions ("BoqId", "CreatedAt" DESC, "Id" DESC)
  WHERE "IsDeleted" = false;
