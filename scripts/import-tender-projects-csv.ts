import { readFileSync } from "node:fs";
import path from "node:path";

import {
  ImportTenderProjectsUseCase,
  parseTenderProjectsCsvContent,
} from "@/application/use-cases/project/ImportTenderProjectsUseCase";
import { createRequestContextValue } from "@/domain/shared/RequestContext";
import { toCorrelationId, toUserId } from "@/domain/shared/ids";
import { DrizzleClientRepository } from "@/infrastructure/persistence/client/DrizzleClientRepository";
import { DrizzleProjectRepository } from "@/infrastructure/persistence/project/DrizzleProjectRepository";

async function main() {
  const csvArg = process.argv[2];
  const csvPath = csvArg
    ? path.resolve(csvArg)
    : path.join(process.cwd(), "data", "tender-projects-with-owners-2026-07-06.csv");

  const content = readFileSync(csvPath, "latin1");
  const rows = parseTenderProjectsCsvContent(content);

  const ctx = createRequestContextValue({
    userId: toUserId("import-tender-csv-script"),
    roles: ["system_administrator"],
    correlationId: toCorrelationId(crypto.randomUUID()),
  });

  const useCase = new ImportTenderProjectsUseCase({
    projectRepository: new DrizzleProjectRepository(),
    clientRepository: new DrizzleClientRepository(),
  });

  const result = await useCase.execute(ctx, rows);
  if (!result.ok) {
    console.error("FAIL:", result.error.message);
    process.exit(1);
  }

  console.log(
    `Tender projects: ${result.value.imported} imported, ${result.value.updated} updated, ${result.value.skipped} skipped, ${result.value.clientsCreated} clients created, ${result.value.total} rows in CSV`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
