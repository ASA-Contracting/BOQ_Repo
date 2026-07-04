CREATE TABLE "saved_page_filters" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "saved_page_filters_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar(450) NOT NULL,
	"page_key" varchar(200) NOT NULL,
	"name" varchar(120) NOT NULL,
	"definition_json" text NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "IX_saved_page_filters_user_page" ON "saved_page_filters" USING btree ("user_id","page_key") WHERE "is_deleted" = false;
