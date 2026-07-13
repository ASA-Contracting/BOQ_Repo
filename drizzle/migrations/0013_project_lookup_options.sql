INSERT INTO "boq_lookup_options" ("category", "name", "tone", "sort_order", "is_deleted", "created_at", "updated_at") VALUES
  ('owner_type', 'Contractor', 'blue', 0, false, NOW(), NOW()),
  ('owner_type', 'Owner', 'teal', 1, false, NOW(), NOW());
--> statement-breakpoint
INSERT INTO "boq_lookup_options" ("category", "name", "tone", "sort_order", "is_deleted", "created_at", "updated_at") VALUES
  ('tender_status', 'Sent', 'blue', 0, false, NOW(), NOW()),
  ('tender_status', 'Lose', 'red', 1, false, NOW(), NOW()),
  ('tender_status', 'cold case', 'gray', 2, false, NOW(), NOW()),
  ('tender_status', 'Postponed', 'orange', 3, false, NOW(), NOW()),
  ('tender_status', 'Under Study', 'yellow', 4, false, NOW(), NOW()),
  ('tender_status', 'New', 'green', 5, false, NOW(), NOW()),
  ('tender_status', 'Done To Review', 'purple', 6, false, NOW(), NOW()),
  ('tender_status', 'Closed Won', 'green', 7, false, NOW(), NOW());
--> statement-breakpoint
INSERT INTO "boq_lookup_options" ("category", "name", "tone", "sort_order", "is_deleted", "created_at", "updated_at") VALUES
  ('assigned_to', 'Unassigned', 'gray', 0, false, NOW(), NOW()),
  ('assigned_to', 'Ahmed Farawilo', NULL, 1, false, NOW(), NOW()),
  ('assigned_to', 'Ahmed Frawelo', NULL, 2, false, NOW(), NOW()),
  ('assigned_to', 'Ahmed Mosbah', NULL, 3, false, NOW(), NOW()),
  ('assigned_to', 'Ali Ketkat', NULL, 4, false, NOW(), NOW()),
  ('assigned_to', 'Faiza Ahmed', NULL, 5, false, NOW(), NOW()),
  ('assigned_to', 'Fathy Keshk', NULL, 6, false, NOW(), NOW()),
  ('assigned_to', 'Fatma Hesham', NULL, 7, false, NOW(), NOW()),
  ('assigned_to', 'Ghaidaa Saad', NULL, 8, false, NOW(), NOW()),
  ('assigned_to', 'Mahmoud Hassan', NULL, 9, false, NOW(), NOW()),
  ('assigned_to', 'Maya Qasem', NULL, 10, false, NOW(), NOW()),
  ('assigned_to', 'Mohamed Ali', NULL, 11, false, NOW(), NOW()),
  ('assigned_to', 'Nada Mohamed', NULL, 12, false, NOW(), NOW()),
  ('assigned_to', 'Nourhan Mohamed', NULL, 13, false, NOW(), NOW()),
  ('assigned_to', 'Omar Al-Harbi', NULL, 14, false, NOW(), NOW()),
  ('assigned_to', 'Radwa Ahmed', NULL, 15, false, NOW(), NOW()),
  ('assigned_to', 'Sherouk Ramdan', NULL, 16, false, NOW(), NOW());
