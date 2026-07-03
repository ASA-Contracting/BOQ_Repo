CREATE TABLE "AspNetUsers" (
	"Id" varchar(450) PRIMARY KEY NOT NULL,
	"UserName" varchar(256),
	"Email" varchar(256),
	"FullName" varchar(150) NOT NULL,
	"IsActive" boolean DEFAULT false NOT NULL,
	"IsDeleted" boolean DEFAULT false NOT NULL,
	"CreatedAt" timestamp with time zone NOT NULL,
	"UpdatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AuditTrails" (
	"Id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"UserId" varchar(450),
	"UserName" varchar(256),
	"EntityName" varchar(200) NOT NULL,
	"EntityId" varchar(100),
	"ActionType" varchar(50) NOT NULL,
	"Description" text,
	"OldValues" text,
	"NewValues" text,
	"ChangedColumns" text,
	"Timestamp" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "BoqItemVersions" (
	"Id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "BoqItemVersions_Id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"BoqItemId" integer NOT NULL,
	"BoqVersionId" integer NOT NULL,
	"Quantity" numeric(18, 2),
	"UnitRate" numeric(18, 2),
	"TotalSale" numeric(18, 4),
	"CreatedBy" varchar(255),
	"CreatedAt" timestamp with time zone NOT NULL,
	"IsDeleted" boolean DEFAULT false NOT NULL,
	"Notes1" text,
	"Notes2" text
);
--> statement-breakpoint
CREATE TABLE "BoqItems" (
	"Id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "BoqItems_Id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"BoqId" integer NOT NULL,
	"RowIndex" integer NOT NULL,
	"ItemNo" varchar(150),
	"Description" text,
	"Unit" varchar(50),
	"IsHeader" boolean DEFAULT false NOT NULL,
	"IsMeasurable" boolean DEFAULT true NOT NULL,
	"FamilyId" integer,
	"BuildingId" integer,
	"IsDeleted" boolean DEFAULT false NOT NULL,
	"UpdatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "BoqVersions" (
	"Id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "BoqVersions_Id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"BoqId" integer NOT NULL,
	"VersionName" varchar(250),
	"Notes" text,
	"Source" varchar(200),
	"CreatedBy" varchar(200),
	"CreatedAt" timestamp with time zone NOT NULL,
	"IsDeleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Boqs" (
	"Id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "Boqs_Id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"Name" varchar(150) NOT NULL,
	"Description" text,
	"ProjectId" integer NOT NULL,
	"CreatedBy" text,
	"IsDeleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Families" (
	"Id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "Families_Id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"Name" varchar(100) NOT NULL,
	"ReferenceCode" text,
	"Description" text,
	"FamilyLevelTypeId" integer NOT NULL,
	"ParentId" integer
);
--> statement-breakpoint
CREATE TABLE "FamilyLevelTypes" (
	"Id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "FamilyLevelTypes_Id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"Name" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Projects" (
	"Id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "Projects_Id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"Name" varchar(150) NOT NULL,
	"Description" text,
	"IsDeleted" boolean DEFAULT false NOT NULL,
	"CreatedAt" timestamp with time zone,
	"UpdatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "boq_work_ai_analysis" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "boq_work_ai_analysis_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"batch_id" integer NOT NULL,
	"status" varchar(20) NOT NULL,
	"model_name" varchar(100) NOT NULL,
	"prompt_version" varchar(50) NOT NULL,
	"family_tree_snapshot_json" text,
	"item_count" integer NOT NULL,
	"uncategorized_item_count" integer NOT NULL,
	"detected_patterns_json" text,
	"suggested_strategy_json" text,
	"category_conflicts_json" text,
	"needs_human_attention_json" text,
	"overall_confidence" numeric(5, 4),
	"raw_response_json" text,
	"error_message" text,
	"triggered_by" varchar(450),
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boq_work_ai_suggestion" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "boq_work_ai_suggestion_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"workshop_item_id" integer NOT NULL,
	"ai_analysis_id" integer,
	"run_number" integer NOT NULL,
	"suggested_family_id" integer,
	"confidence" numeric(5, 4),
	"rationale" text,
	"alternative_family_ids_json" text,
	"model_name" varchar(100) NOT NULL,
	"prompt_version" varchar(50) NOT NULL,
	"raw_response_json" text,
	"raw_response_reference" varchar(500),
	"status" varchar(20) NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" varchar(450)
);
--> statement-breakpoint
CREATE TABLE "boq_work_batch" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "boq_work_batch_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(150) NOT NULL,
	"description" text,
	"scope_type" varchar(30) NOT NULL,
	"scope_project_id" integer,
	"scope_boq_id" integer,
	"scope_filter_json" text,
	"status" varchar(30) NOT NULL,
	"latest_ai_analysis_id" integer,
	"import_snapshot_at" timestamp with time zone,
	"import_item_count" integer DEFAULT 0 NOT NULL,
	"publish_policy" varchar(30) NOT NULL,
	"publish_policy_options_json" text,
	"items_pending_review_count" integer DEFAULT 0 NOT NULL,
	"items_approved_count" integer DEFAULT 0 NOT NULL,
	"items_published_count" integer DEFAULT 0 NOT NULL,
	"created_by" varchar(450) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_by" varchar(450),
	"updated_at" timestamp with time zone NOT NULL,
	"cancelled_by" varchar(450),
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "boq_work_event_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "boq_work_event_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"batch_id" integer NOT NULL,
	"workshop_item_id" integer,
	"export_batch_id" integer,
	"ai_analysis_id" integer,
	"event_type" varchar(50) NOT NULL,
	"user_id" varchar(450),
	"payload_json" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boq_work_export_batch" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "boq_work_export_batch_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"batch_id" integer NOT NULL,
	"status" varchar(30) NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"requested_by" varchar(450) NOT NULL,
	"published_by" varchar(450),
	"total_items" integer DEFAULT 0 NOT NULL,
	"succeeded_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"publish_policy_snapshot" text,
	"error_summary" text
);
--> statement-breakpoint
CREATE TABLE "boq_work_export_item" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "boq_work_export_item_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"export_batch_id" integer NOT NULL,
	"workshop_item_id" integer NOT NULL,
	"source_boq_item_id" integer NOT NULL,
	"old_family_id" integer,
	"new_family_id" integer NOT NULL,
	"status" varchar(30) NOT NULL,
	"error_message" text,
	"audit_trail_id" uuid,
	"published_at" timestamp with time zone,
	"attempt_number" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boq_work_item" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "boq_work_item_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"batch_id" integer NOT NULL,
	"source_boq_item_id" integer NOT NULL,
	"source_boq_id" integer NOT NULL,
	"source_project_id" integer NOT NULL,
	"original_family_id" integer,
	"original_description" text,
	"original_unit" varchar(50),
	"original_item_no" varchar(150),
	"original_row_index" integer NOT NULL,
	"original_is_header" boolean DEFAULT false NOT NULL,
	"original_is_measurable" boolean DEFAULT true NOT NULL,
	"imported_at" timestamp with time zone NOT NULL,
	"context_boq_version_id" integer,
	"context_quantity" numeric(18, 2),
	"context_unit_rate" numeric(18, 2),
	"context_snapshot_json" text,
	"latest_suggested_family_id" integer,
	"latest_ai_confidence" numeric(5, 4),
	"latest_ai_suggestion_id" integer,
	"ai_processed_at" timestamp with time zone,
	"final_family_id" integer,
	"review_status" varchar(30) NOT NULL,
	"reviewed_by" varchar(450),
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"published_at" timestamp with time zone,
	"published_by" varchar(450),
	"publish_error" text,
	"last_export_item_id" integer,
	"production_family_id_at_publish_check" integer,
	"drift_detected_at" timestamp with time zone,
	"drift_reason" varchar(500),
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boq_work_review_action" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "boq_work_review_action_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"workshop_item_id" integer NOT NULL,
	"action_type" varchar(30) NOT NULL,
	"previous_family_id" integer,
	"selected_family_id" integer,
	"previous_review_status" varchar(30),
	"new_review_status" varchar(30) NOT NULL,
	"notes" text,
	"user_id" varchar(450) NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "AuditTrails" ADD CONSTRAINT "AuditTrails_UserId_AspNetUsers_Id_fk" FOREIGN KEY ("UserId") REFERENCES "public"."AspNetUsers"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BoqItemVersions" ADD CONSTRAINT "BoqItemVersions_BoqItemId_BoqItems_Id_fk" FOREIGN KEY ("BoqItemId") REFERENCES "public"."BoqItems"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BoqItemVersions" ADD CONSTRAINT "BoqItemVersions_BoqVersionId_BoqVersions_Id_fk" FOREIGN KEY ("BoqVersionId") REFERENCES "public"."BoqVersions"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BoqItems" ADD CONSTRAINT "BoqItems_BoqId_Boqs_Id_fk" FOREIGN KEY ("BoqId") REFERENCES "public"."Boqs"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BoqItems" ADD CONSTRAINT "BoqItems_FamilyId_Families_Id_fk" FOREIGN KEY ("FamilyId") REFERENCES "public"."Families"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BoqVersions" ADD CONSTRAINT "BoqVersions_BoqId_Boqs_Id_fk" FOREIGN KEY ("BoqId") REFERENCES "public"."Boqs"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Boqs" ADD CONSTRAINT "Boqs_ProjectId_Projects_Id_fk" FOREIGN KEY ("ProjectId") REFERENCES "public"."Projects"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Families" ADD CONSTRAINT "Families_FamilyLevelTypeId_FamilyLevelTypes_Id_fk" FOREIGN KEY ("FamilyLevelTypeId") REFERENCES "public"."FamilyLevelTypes"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Families" ADD CONSTRAINT "Families_ParentId_Families_Id_fk" FOREIGN KEY ("ParentId") REFERENCES "public"."Families"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_ai_analysis" ADD CONSTRAINT "boq_work_ai_analysis_batch_id_boq_work_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."boq_work_batch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_ai_analysis" ADD CONSTRAINT "boq_work_ai_analysis_triggered_by_AspNetUsers_Id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."AspNetUsers"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_ai_suggestion" ADD CONSTRAINT "boq_work_ai_suggestion_workshop_item_id_boq_work_item_id_fk" FOREIGN KEY ("workshop_item_id") REFERENCES "public"."boq_work_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_ai_suggestion" ADD CONSTRAINT "boq_work_ai_suggestion_ai_analysis_id_boq_work_ai_analysis_id_fk" FOREIGN KEY ("ai_analysis_id") REFERENCES "public"."boq_work_ai_analysis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_ai_suggestion" ADD CONSTRAINT "boq_work_ai_suggestion_suggested_family_id_Families_Id_fk" FOREIGN KEY ("suggested_family_id") REFERENCES "public"."Families"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_ai_suggestion" ADD CONSTRAINT "boq_work_ai_suggestion_created_by_AspNetUsers_Id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."AspNetUsers"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_batch" ADD CONSTRAINT "boq_work_batch_scope_project_id_Projects_Id_fk" FOREIGN KEY ("scope_project_id") REFERENCES "public"."Projects"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_batch" ADD CONSTRAINT "boq_work_batch_scope_boq_id_Boqs_Id_fk" FOREIGN KEY ("scope_boq_id") REFERENCES "public"."Boqs"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_batch" ADD CONSTRAINT "boq_work_batch_created_by_AspNetUsers_Id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."AspNetUsers"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_batch" ADD CONSTRAINT "boq_work_batch_updated_by_AspNetUsers_Id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."AspNetUsers"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_batch" ADD CONSTRAINT "boq_work_batch_cancelled_by_AspNetUsers_Id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."AspNetUsers"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_event_log" ADD CONSTRAINT "boq_work_event_log_batch_id_boq_work_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."boq_work_batch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_event_log" ADD CONSTRAINT "boq_work_event_log_workshop_item_id_boq_work_item_id_fk" FOREIGN KEY ("workshop_item_id") REFERENCES "public"."boq_work_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_event_log" ADD CONSTRAINT "boq_work_event_log_export_batch_id_boq_work_export_batch_id_fk" FOREIGN KEY ("export_batch_id") REFERENCES "public"."boq_work_export_batch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_event_log" ADD CONSTRAINT "boq_work_event_log_ai_analysis_id_boq_work_ai_analysis_id_fk" FOREIGN KEY ("ai_analysis_id") REFERENCES "public"."boq_work_ai_analysis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_event_log" ADD CONSTRAINT "boq_work_event_log_user_id_AspNetUsers_Id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."AspNetUsers"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_export_batch" ADD CONSTRAINT "boq_work_export_batch_batch_id_boq_work_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."boq_work_batch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_export_batch" ADD CONSTRAINT "boq_work_export_batch_requested_by_AspNetUsers_Id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."AspNetUsers"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_export_batch" ADD CONSTRAINT "boq_work_export_batch_published_by_AspNetUsers_Id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."AspNetUsers"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_export_item" ADD CONSTRAINT "boq_work_export_item_export_batch_id_boq_work_export_batch_id_fk" FOREIGN KEY ("export_batch_id") REFERENCES "public"."boq_work_export_batch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_export_item" ADD CONSTRAINT "boq_work_export_item_workshop_item_id_boq_work_item_id_fk" FOREIGN KEY ("workshop_item_id") REFERENCES "public"."boq_work_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_export_item" ADD CONSTRAINT "boq_work_export_item_source_boq_item_id_BoqItems_Id_fk" FOREIGN KEY ("source_boq_item_id") REFERENCES "public"."BoqItems"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_export_item" ADD CONSTRAINT "boq_work_export_item_old_family_id_Families_Id_fk" FOREIGN KEY ("old_family_id") REFERENCES "public"."Families"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_export_item" ADD CONSTRAINT "boq_work_export_item_new_family_id_Families_Id_fk" FOREIGN KEY ("new_family_id") REFERENCES "public"."Families"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_export_item" ADD CONSTRAINT "boq_work_export_item_audit_trail_id_AuditTrails_Id_fk" FOREIGN KEY ("audit_trail_id") REFERENCES "public"."AuditTrails"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_item" ADD CONSTRAINT "boq_work_item_batch_id_boq_work_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."boq_work_batch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_item" ADD CONSTRAINT "boq_work_item_source_boq_item_id_BoqItems_Id_fk" FOREIGN KEY ("source_boq_item_id") REFERENCES "public"."BoqItems"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_item" ADD CONSTRAINT "boq_work_item_source_boq_id_Boqs_Id_fk" FOREIGN KEY ("source_boq_id") REFERENCES "public"."Boqs"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_item" ADD CONSTRAINT "boq_work_item_source_project_id_Projects_Id_fk" FOREIGN KEY ("source_project_id") REFERENCES "public"."Projects"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_item" ADD CONSTRAINT "boq_work_item_original_family_id_Families_Id_fk" FOREIGN KEY ("original_family_id") REFERENCES "public"."Families"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_item" ADD CONSTRAINT "boq_work_item_context_boq_version_id_BoqVersions_Id_fk" FOREIGN KEY ("context_boq_version_id") REFERENCES "public"."BoqVersions"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_item" ADD CONSTRAINT "boq_work_item_latest_suggested_family_id_Families_Id_fk" FOREIGN KEY ("latest_suggested_family_id") REFERENCES "public"."Families"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_item" ADD CONSTRAINT "boq_work_item_final_family_id_Families_Id_fk" FOREIGN KEY ("final_family_id") REFERENCES "public"."Families"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_item" ADD CONSTRAINT "boq_work_item_production_family_id_at_publish_check_Families_Id_fk" FOREIGN KEY ("production_family_id_at_publish_check") REFERENCES "public"."Families"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_item" ADD CONSTRAINT "boq_work_item_reviewed_by_AspNetUsers_Id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."AspNetUsers"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_item" ADD CONSTRAINT "boq_work_item_published_by_AspNetUsers_Id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."AspNetUsers"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_review_action" ADD CONSTRAINT "boq_work_review_action_workshop_item_id_boq_work_item_id_fk" FOREIGN KEY ("workshop_item_id") REFERENCES "public"."boq_work_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_review_action" ADD CONSTRAINT "boq_work_review_action_previous_family_id_Families_Id_fk" FOREIGN KEY ("previous_family_id") REFERENCES "public"."Families"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_review_action" ADD CONSTRAINT "boq_work_review_action_selected_family_id_Families_Id_fk" FOREIGN KEY ("selected_family_id") REFERENCES "public"."Families"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_review_action" ADD CONSTRAINT "boq_work_review_action_user_id_AspNetUsers_Id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."AspNetUsers"("Id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Denormalized pointer FKs (circular refs — columns in Drizzle schema, constraints added here)
ALTER TABLE "boq_work_batch" ADD CONSTRAINT "boq_work_batch_latest_ai_analysis_id_boq_work_ai_analysis_id_fk" FOREIGN KEY ("latest_ai_analysis_id") REFERENCES "public"."boq_work_ai_analysis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_item" ADD CONSTRAINT "boq_work_item_latest_ai_suggestion_id_boq_work_ai_suggestion_id_fk" FOREIGN KEY ("latest_ai_suggestion_id") REFERENCES "public"."boq_work_ai_suggestion"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boq_work_item" ADD CONSTRAINT "boq_work_item_last_export_item_id_boq_work_export_item_id_fk" FOREIGN KEY ("last_export_item_id") REFERENCES "public"."boq_work_export_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "UX_boq_work_ai_suggestion_item_run" ON "boq_work_ai_suggestion" USING btree ("workshop_item_id","run_number");--> statement-breakpoint
CREATE UNIQUE INDEX "UX_boq_work_export_item_batch_item" ON "boq_work_export_item" USING btree ("export_batch_id","workshop_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "UX_boq_work_item_batch_source" ON "boq_work_item" USING btree ("batch_id","source_boq_item_id");