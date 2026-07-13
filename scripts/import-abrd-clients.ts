import { ImportAbrdClientsUseCase } from "@/application/use-cases/client/ImportAbrdClientsUseCase";
import { createRequestContextValue } from "@/domain/shared/RequestContext";
import { toCorrelationId, toUserId } from "@/domain/shared/ids";
import { AbrdOwnerCatalogService } from "@/infrastructure/abrd/AbrdOwnerCatalogService";
import { isAbrdConfigured } from "@/infrastructure/config/env";
import { DrizzleClientRepository } from "@/infrastructure/persistence/client/DrizzleClientRepository";

if (!isAbrdConfigured()) {
  console.error("FAIL: ABRD_API_BASE_URL and ABRD_API_TOKEN must be set in .env.local");
  process.exit(1);
}

const useCase = new ImportAbrdClientsUseCase({
  clientRepository: new DrizzleClientRepository(),
  ownerCatalogService: new AbrdOwnerCatalogService(),
});

const result = await useCase.execute(
  createRequestContextValue({
    userId: toUserId("import-abrd-script"),
    roles: ["system_administrator"],
    correlationId: toCorrelationId(crypto.randomUUID()),
  }),
);

if (!result.ok) {
  console.error("FAIL:", result.error.message);
  process.exit(1);
}

console.log(
  `Client import complete: ${result.value.imported} imported, ${result.value.skipped} skipped (already present), ${result.value.total} in ABRD owner catalog`,
);
process.exit(0);
