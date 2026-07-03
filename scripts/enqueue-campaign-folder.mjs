/**
 * Admin script: enqueue Excel files from a folder into an import campaign.
 *
 * Usage:
 *   node --env-file=.env.local scripts/enqueue-campaign-folder.mjs <campaignId> <folderPath>
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import postgres from "postgres";

const campaignId = Number(process.argv[2]);
const folderPath = process.argv[3];

if (!Number.isInteger(campaignId) || campaignId <= 0 || !folderPath) {
  console.error(
    "Usage: node --env-file=.env.local scripts/enqueue-campaign-folder.mjs <campaignId> <folderPath>",
  );
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });
const extensions = [".xlsx", ".xls", ".xlsm"];

const files = readdirSync(folderPath).filter((name) =>
  extensions.some((ext) => name.toLowerCase().endsWith(ext)),
);

if (files.length === 0) {
  console.error("No Excel files found in folder.");
  process.exit(1);
}

const now = new Date();

for (const fileName of files) {
  const fullPath = join(folderPath, fileName);
  const base64 = readFileSync(fullPath).toString("base64");

  await sql`
    INSERT INTO boq_work_import_job (
      campaign_id, file_name, file_content_base64, status, created_at, updated_at
    ) VALUES (
      ${campaignId}, ${fileName}, ${base64}, 'pending', ${now}, ${now}
    )
  `;
}

await sql`
  UPDATE boq_work_import_campaign
  SET total_files = total_files + ${files.length},
      status = 'processing',
      updated_at = ${now}
  WHERE id = ${campaignId}
`;

await sql.end();

console.log(`Enqueued ${files.length} Excel file(s) for campaign ${campaignId}.`);
