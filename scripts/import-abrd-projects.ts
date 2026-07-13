import { ImportAbrdClientsUseCase } from "@/application/use-cases/client/ImportAbrdClientsUseCase";
import { ImportAbrdProjectsUseCase } from "@/application/use-cases/project/ImportAbrdProjectsUseCase";
import { createRequestContextValue } from "@/domain/shared/RequestContext";
import { toCorrelationId, toUserId } from "@/domain/shared/ids";
import { AbrdOwnerCatalogService } from "@/infrastructure/abrd/AbrdOwnerCatalogService";
import { AbrdProjectCatalogService } from "@/infrastructure/abrd/AbrdProjectCatalogService";
import { isAbrdConfigured } from "@/infrastructure/config/env";
import { DrizzleClientRepository } from "@/infrastructure/persistence/client/DrizzleClientRepository";
import { DrizzleProjectRepository } from "@/infrastructure/persistence/project/DrizzleProjectRepository";

if (!isAbrdConfigured()) {
  console.error("FAIL: ABRD_API_BASE_URL and ABRD_API_TOKEN must be set in .env.local");
  process.exit(1);
}

const ctx = createRequestContextValue({
  userId: toUserId("import-abrd-script"),
  roles: ["system_administrator"],
  correlationId: toCorrelationId(crypto.randomUUID()),
});

const clientRepository = new DrizzleClientRepository();
const projectRepository = new DrizzleProjectRepository();
const ownerCatalogService = new AbrdOwnerCatalogService();
const projectCatalogService = new AbrdProjectCatalogService();

const clientsUseCase = new ImportAbrdClientsUseCase({
  clientRepository,
  ownerCatalogService,
});

const clientsResult = await clientsUseCase.execute(ctx);
if (!clientsResult.ok) {
  console.error("FAIL (clients):", clientsResult.error.message);
  process.exit(1);
}

console.log(
  `Clients: ${clientsResult.value.imported} imported, ${clientsResult.value.skipped} skipped, ${clientsResult.value.total} in ABRD owner catalog`,
);

const projectsUseCase = new ImportAbrdProjectsUseCase({
  projectRepository,
  projectCatalogService,
  clientRepository,
});

const projectsResult = await projectsUseCase.execute(ctx);
if (!projectsResult.ok) {
  console.error("FAIL (projects):", projectsResult.error.message);
  process.exit(1);
}

console.log(
  `Projects: ${projectsResult.value.imported} imported, ${projectsResult.value.skipped} skipped, ${projectsResult.value.total} in ABRD catalog`,
);
process.exit(0);
