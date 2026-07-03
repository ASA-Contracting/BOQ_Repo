import { foreignKey, uniqueIndex } from "drizzle-orm/pg-core";
import {
  bigint,
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import {
  aspNetUsers,
  auditTrails,
  boqItems,
  boqVersions,
  boqs,
  families,
  projects,
} from "./production-reference";

export const boqWorkAiAnalysis = pgTable(
  "boq_work_ai_analysis",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    batch_id: integer("batch_id")
      .notNull()
      .references(() => boqWorkBatch.id, { onDelete: "no action" }),
    status: varchar("status", { length: 20 }).notNull(),
    model_name: varchar("model_name", { length: 100 }).notNull(),
    prompt_version: varchar("prompt_version", { length: 50 }).notNull(),
    family_tree_snapshot_json: text("family_tree_snapshot_json"),
    item_count: integer("item_count").notNull(),
    uncategorized_item_count: integer("uncategorized_item_count").notNull(),
    detected_patterns_json: text("detected_patterns_json"),
    suggested_strategy_json: text("suggested_strategy_json"),
    category_conflicts_json: text("category_conflicts_json"),
    needs_human_attention_json: text("needs_human_attention_json"),
    overall_confidence: numeric("overall_confidence", { precision: 5, scale: 4 }),
    raw_response_json: text("raw_response_json"),
    error_message: text("error_message"),
    triggered_by: varchar("triggered_by", { length: 450 }),
    started_at: timestamp("started_at", { withTimezone: true, mode: "date" }),
    completed_at: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    created_at: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    foreignKey({
      name: "boq_work_ai_analysis_triggered_by_AspNetUsers_Id_fk",
      columns: [table.triggered_by],
      foreignColumns: [aspNetUsers.Id],
    }).onDelete("no action"),
  ],
);

export const boqWorkExportBatch = pgTable(
  "boq_work_export_batch",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    batch_id: integer("batch_id")
      .notNull()
      .references(() => boqWorkBatch.id, { onDelete: "no action" }),
    status: varchar("status", { length: 30 }).notNull(),
    started_at: timestamp("started_at", { withTimezone: true, mode: "date" }),
    completed_at: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    requested_by: varchar("requested_by", { length: 450 }).notNull(),
    published_by: varchar("published_by", { length: 450 }),
    total_items: integer("total_items").notNull().default(0),
    succeeded_count: integer("succeeded_count").notNull().default(0),
    failed_count: integer("failed_count").notNull().default(0),
    skipped_count: integer("skipped_count").notNull().default(0),
    publish_policy_snapshot: text("publish_policy_snapshot"),
    error_summary: text("error_summary"),
  },
  (table) => [
    foreignKey({
      name: "boq_work_export_batch_requested_by_AspNetUsers_Id_fk",
      columns: [table.requested_by],
      foreignColumns: [aspNetUsers.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_export_batch_published_by_AspNetUsers_Id_fk",
      columns: [table.published_by],
      foreignColumns: [aspNetUsers.Id],
    }).onDelete("no action"),
  ],
);

export const boqWorkAiSuggestion = pgTable(
  "boq_work_ai_suggestion",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    workshop_item_id: integer("workshop_item_id")
      .notNull()
      .references(() => boqWorkItem.id, { onDelete: "no action" }),
    ai_analysis_id: integer("ai_analysis_id"),
    run_number: integer("run_number").notNull(),
    suggested_family_id: integer("suggested_family_id"),
    confidence: numeric("confidence", { precision: 5, scale: 4 }),
    rationale: text("rationale"),
    alternative_family_ids_json: text("alternative_family_ids_json"),
    model_name: varchar("model_name", { length: 100 }).notNull(),
    prompt_version: varchar("prompt_version", { length: 50 }).notNull(),
    raw_response_json: text("raw_response_json"),
    raw_response_reference: varchar("raw_response_reference", { length: 500 }),
    status: varchar("status", { length: 20 }).notNull(),
    error_message: text("error_message"),
    created_at: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    created_by: varchar("created_by", { length: 450 }),
  },
  (table) => [
    uniqueIndex("UX_boq_work_ai_suggestion_item_run").on(
      table.workshop_item_id,
      table.run_number,
    ),
    foreignKey({
      name: "boq_work_ai_suggestion_ai_analysis_id_boq_work_ai_analysis_id_fk",
      columns: [table.ai_analysis_id],
      foreignColumns: [boqWorkAiAnalysis.id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_ai_suggestion_suggested_family_id_Families_Id_fk",
      columns: [table.suggested_family_id],
      foreignColumns: [families.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_ai_suggestion_created_by_AspNetUsers_Id_fk",
      columns: [table.created_by],
      foreignColumns: [aspNetUsers.Id],
    }).onDelete("no action"),
  ],
);

export const boqWorkReviewAction = pgTable(
  "boq_work_review_action",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    workshop_item_id: integer("workshop_item_id")
      .notNull()
      .references(() => boqWorkItem.id, { onDelete: "no action" }),
    action_type: varchar("action_type", { length: 30 }).notNull(),
    previous_family_id: integer("previous_family_id"),
    selected_family_id: integer("selected_family_id"),
    previous_review_status: varchar("previous_review_status", { length: 30 }),
    new_review_status: varchar("new_review_status", { length: 30 }).notNull(),
    notes: text("notes"),
    user_id: varchar("user_id", { length: 450 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    foreignKey({
      name: "boq_work_review_action_previous_family_id_Families_Id_fk",
      columns: [table.previous_family_id],
      foreignColumns: [families.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_review_action_selected_family_id_Families_Id_fk",
      columns: [table.selected_family_id],
      foreignColumns: [families.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_review_action_user_id_AspNetUsers_Id_fk",
      columns: [table.user_id],
      foreignColumns: [aspNetUsers.Id],
    }).onDelete("no action"),
  ],
);

export const boqWorkExportItem = pgTable(
  "boq_work_export_item",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    export_batch_id: integer("export_batch_id")
      .notNull()
      .references(() => boqWorkExportBatch.id, { onDelete: "no action" }),
    workshop_item_id: integer("workshop_item_id")
      .notNull()
      .references(() => boqWorkItem.id, { onDelete: "no action" }),
    source_boq_item_id: integer("source_boq_item_id").notNull(),
    old_family_id: integer("old_family_id"),
    new_family_id: integer("new_family_id").notNull(),
    status: varchar("status", { length: 30 }).notNull(),
    error_message: text("error_message"),
    audit_trail_id: uuid("audit_trail_id"),
    published_at: timestamp("published_at", { withTimezone: true, mode: "date" }),
    attempt_number: integer("attempt_number").notNull().default(1),
  },
  (table) => [
    uniqueIndex("UX_boq_work_export_item_batch_item").on(
      table.export_batch_id,
      table.workshop_item_id,
    ),
    foreignKey({
      name: "boq_work_export_item_source_boq_item_id_BoqItems_Id_fk",
      columns: [table.source_boq_item_id],
      foreignColumns: [boqItems.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_export_item_old_family_id_Families_Id_fk",
      columns: [table.old_family_id],
      foreignColumns: [families.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_export_item_new_family_id_Families_Id_fk",
      columns: [table.new_family_id],
      foreignColumns: [families.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_export_item_audit_trail_id_AuditTrails_Id_fk",
      columns: [table.audit_trail_id],
      foreignColumns: [auditTrails.Id],
    }).onDelete("no action"),
  ],
);

export const boqWorkItem = pgTable(
  "boq_work_item",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    batch_id: integer("batch_id")
      .notNull()
      .references(() => boqWorkBatch.id, { onDelete: "no action" }),
    source_boq_item_id: integer("source_boq_item_id").notNull(),
    source_boq_id: integer("source_boq_id").notNull(),
    source_project_id: integer("source_project_id").notNull(),
    original_family_id: integer("original_family_id"),
    original_description: text("original_description"),
    original_unit: varchar("original_unit", { length: 50 }),
    original_item_no: varchar("original_item_no", { length: 150 }),
    original_row_index: integer("original_row_index").notNull(),
    original_is_header: boolean("original_is_header").notNull().default(false),
    original_is_measurable: boolean("original_is_measurable").notNull().default(true),
    imported_at: timestamp("imported_at", { withTimezone: true, mode: "date" }).notNull(),
    context_boq_version_id: integer("context_boq_version_id"),
    context_quantity: numeric("context_quantity", { precision: 18, scale: 2 }),
    context_unit_rate: numeric("context_unit_rate", { precision: 18, scale: 2 }),
    context_snapshot_json: text("context_snapshot_json"),
    latest_suggested_family_id: integer("latest_suggested_family_id"),
    latest_ai_confidence: numeric("latest_ai_confidence", { precision: 5, scale: 4 }),
    // FK: boq_work_item_latest_ai_suggestion_id_boq_work_ai_suggestion_id_fk (see migration — circular ref)
    latest_ai_suggestion_id: integer("latest_ai_suggestion_id"),
    ai_processed_at: timestamp("ai_processed_at", { withTimezone: true, mode: "date" }),
    final_family_id: integer("final_family_id"),
    review_status: varchar("review_status", { length: 30 }).notNull(),
    reviewed_by: varchar("reviewed_by", { length: 450 }),
    reviewed_at: timestamp("reviewed_at", { withTimezone: true, mode: "date" }),
    review_notes: text("review_notes"),
    published_at: timestamp("published_at", { withTimezone: true, mode: "date" }),
    published_by: varchar("published_by", { length: 450 }),
    publish_error: text("publish_error"),
    // FK: boq_work_item_last_export_item_id_boq_work_export_item_id_fk (see migration — circular ref)
    last_export_item_id: integer("last_export_item_id"),
    production_family_id_at_publish_check: integer("production_family_id_at_publish_check"),
    drift_detected_at: timestamp("drift_detected_at", {
      withTimezone: true,
      mode: "date",
    }),
    drift_reason: varchar("drift_reason", { length: 500 }),
    created_at: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    uniqueIndex("UX_boq_work_item_batch_source").on(
      table.batch_id,
      table.source_boq_item_id,
    ),
    foreignKey({
      name: "boq_work_item_source_boq_item_id_BoqItems_Id_fk",
      columns: [table.source_boq_item_id],
      foreignColumns: [boqItems.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_item_source_boq_id_Boqs_Id_fk",
      columns: [table.source_boq_id],
      foreignColumns: [boqs.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_item_source_project_id_Projects_Id_fk",
      columns: [table.source_project_id],
      foreignColumns: [projects.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_item_original_family_id_Families_Id_fk",
      columns: [table.original_family_id],
      foreignColumns: [families.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_item_context_boq_version_id_BoqVersions_Id_fk",
      columns: [table.context_boq_version_id],
      foreignColumns: [boqVersions.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_item_latest_suggested_family_id_Families_Id_fk",
      columns: [table.latest_suggested_family_id],
      foreignColumns: [families.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_item_final_family_id_Families_Id_fk",
      columns: [table.final_family_id],
      foreignColumns: [families.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_item_production_family_id_at_publish_check_Families_Id_fk",
      columns: [table.production_family_id_at_publish_check],
      foreignColumns: [families.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_item_reviewed_by_AspNetUsers_Id_fk",
      columns: [table.reviewed_by],
      foreignColumns: [aspNetUsers.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_item_published_by_AspNetUsers_Id_fk",
      columns: [table.published_by],
      foreignColumns: [aspNetUsers.Id],
    }).onDelete("no action"),
  ],
);

export const boqWorkEventLog = pgTable(
  "boq_work_event_log",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    batch_id: integer("batch_id")
      .notNull()
      .references(() => boqWorkBatch.id, { onDelete: "no action" }),
    workshop_item_id: integer("workshop_item_id"),
    export_batch_id: integer("export_batch_id"),
    ai_analysis_id: integer("ai_analysis_id"),
    event_type: varchar("event_type", { length: 50 }).notNull(),
    user_id: varchar("user_id", { length: 450 }),
    payload_json: text("payload_json"),
    created_at: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    foreignKey({
      name: "boq_work_event_log_workshop_item_id_boq_work_item_id_fk",
      columns: [table.workshop_item_id],
      foreignColumns: [boqWorkItem.id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_event_log_export_batch_id_boq_work_export_batch_id_fk",
      columns: [table.export_batch_id],
      foreignColumns: [boqWorkExportBatch.id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_event_log_ai_analysis_id_boq_work_ai_analysis_id_fk",
      columns: [table.ai_analysis_id],
      foreignColumns: [boqWorkAiAnalysis.id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_event_log_user_id_AspNetUsers_Id_fk",
      columns: [table.user_id],
      foreignColumns: [aspNetUsers.Id],
    }).onDelete("no action"),
  ],
);

export const boqWorkBatch = pgTable(
  "boq_work_batch",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 150 }).notNull(),
    description: text("description"),
    scope_type: varchar("scope_type", { length: 30 }).notNull(),
    scope_project_id: integer("scope_project_id"),
    scope_boq_id: integer("scope_boq_id"),
    scope_filter_json: text("scope_filter_json"),
    status: varchar("status", { length: 30 }).notNull(),
    workflowStage: varchar("workflow_stage", { length: 40 }).notNull().default("imported"),
    linkedBoqVersionId: integer("linked_boq_version_id"),
    engineerSubmittedAt: timestamp("engineer_submitted_at", {
      withTimezone: true,
      mode: "date",
    }),
    engineerSubmittedBy: varchar("engineer_submitted_by", { length: 450 }),
    sectionHeadApprovedAt: timestamp("section_head_approved_at", {
      withTimezone: true,
      mode: "date",
    }),
    sectionHeadApprovedBy: varchar("section_head_approved_by", { length: 450 }),
    returnToEngineerNotes: text("return_to_engineer_notes"),
    // FK: boq_work_batch_latest_ai_analysis_id_boq_work_ai_analysis_id_fk (see migration — circular ref)
    latest_ai_analysis_id: integer("latest_ai_analysis_id"),
    import_snapshot_at: timestamp("import_snapshot_at", {
      withTimezone: true,
      mode: "date",
    }),
    import_item_count: integer("import_item_count").notNull().default(0),
    publish_policy: varchar("publish_policy", { length: 30 }).notNull(),
    publish_policy_options_json: text("publish_policy_options_json"),
    items_pending_review_count: integer("items_pending_review_count")
      .notNull()
      .default(0),
    items_approved_count: integer("items_approved_count").notNull().default(0),
    items_published_count: integer("items_published_count").notNull().default(0),
    created_by: varchar("created_by", { length: 450 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    updated_by: varchar("updated_by", { length: 450 }),
    updated_at: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
    cancelled_by: varchar("cancelled_by", { length: 450 }),
    cancelled_at: timestamp("cancelled_at", { withTimezone: true, mode: "date" }),
    cancellation_reason: varchar("cancellation_reason", { length: 500 }),
  },
  (table) => [
    foreignKey({
      name: "boq_work_batch_scope_project_id_Projects_Id_fk",
      columns: [table.scope_project_id],
      foreignColumns: [projects.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_batch_scope_boq_id_Boqs_Id_fk",
      columns: [table.scope_boq_id],
      foreignColumns: [boqs.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_batch_created_by_AspNetUsers_Id_fk",
      columns: [table.created_by],
      foreignColumns: [aspNetUsers.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_batch_updated_by_AspNetUsers_Id_fk",
      columns: [table.updated_by],
      foreignColumns: [aspNetUsers.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_batch_cancelled_by_AspNetUsers_Id_fk",
      columns: [table.cancelled_by],
      foreignColumns: [aspNetUsers.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_batch_linked_boq_version_id_BoqVersions_Id_fk",
      columns: [table.linkedBoqVersionId],
      foreignColumns: [boqVersions.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_batch_engineer_submitted_by_AspNetUsers_Id_fk",
      columns: [table.engineerSubmittedBy],
      foreignColumns: [aspNetUsers.Id],
    }).onDelete("no action"),
    foreignKey({
      name: "boq_work_batch_section_head_approved_by_AspNetUsers_Id_fk",
      columns: [table.sectionHeadApprovedBy],
      foreignColumns: [aspNetUsers.Id],
    }).onDelete("no action"),
  ],
);

export const boqWorkImportCampaign = pgTable(
  "boq_work_import_campaign",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 150 }).notNull(),
    status: varchar("status", { length: 30 }).notNull(),
    total_files: integer("total_files").notNull().default(0),
    imported_count: integer("imported_count").notNull().default(0),
    ai_complete_count: integer("ai_complete_count").notNull().default(0),
    failed_count: integer("failed_count").notNull().default(0),
    default_column_mapping_json: text("default_column_mapping_json"),
    created_by: varchar("created_by", { length: 450 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    foreignKey({
      name: "boq_work_import_campaign_created_by_AspNetUsers_Id_fk",
      columns: [table.created_by],
      foreignColumns: [aspNetUsers.Id],
    }).onDelete("no action"),
  ],
);

export const boqWorkImportJob = pgTable(
  "boq_work_import_job",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    campaign_id: integer("campaign_id")
      .notNull()
      .references(() => boqWorkImportCampaign.id, { onDelete: "no action" }),
    file_name: varchar("file_name", { length: 500 }).notNull(),
    file_content_base64: text("file_content_base64"),
    status: varchar("status", { length: 30 }).notNull(),
    workshop_batch_id: integer("workshop_batch_id").references(() => boqWorkBatch.id, {
      onDelete: "no action",
    }),
    error_message: text("error_message"),
    sheet_name: varchar("sheet_name", { length: 200 }),
    column_mapping_json: text("column_mapping_json"),
    created_at: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
    started_at: timestamp("started_at", { withTimezone: true, mode: "date" }),
    completed_at: timestamp("completed_at", { withTimezone: true, mode: "date" }),
  },
  (table) => [
    foreignKey({
      name: "boq_work_import_job_workshop_batch_id_boq_work_batch_id_fk",
      columns: [table.workshop_batch_id],
      foreignColumns: [boqWorkBatch.id],
    }).onDelete("no action"),
  ],
);
