import type { ImportAbrdClientsResultDto } from "@/application/dto/client/importAbrdClientsDto";
import type { IOwnerCatalogService } from "@/application/ports/IOwnerCatalogService";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { IClientRepository } from "@/domain/client/repositories/IClientRepository";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import { ValidationError } from "@/domain/shared/errors/ValidationError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";

export type ImportAbrdClientsDependencies = {
  clientRepository: IClientRepository;
  ownerCatalogService: IOwnerCatalogService;
};

/** One-time import of ABRD owners into the local client master list. Existing rows are never updated. */
export class ImportAbrdClientsUseCase
  implements IUseCase<void, ImportAbrdClientsResultDto, DomainError>
{
  constructor(private readonly deps: ImportAbrdClientsDependencies) {}

  async execute(
    ctx: RequestContext,
  ): Promise<Result<ImportAbrdClientsResultDto, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    if (!this.deps.ownerCatalogService.isConfigured()) {
      return err(new ValidationError("ABRD owner catalog is not configured."));
    }

    const catalog = await this.deps.ownerCatalogService.fetchAllOwners();
    let imported = 0;
    let skipped = 0;

    for (const entry of catalog) {
      const result = await this.deps.clientRepository.importFromAbrd({
        abrdOwnerId: entry.id,
        name: entry.name,
      });

      if (result === "imported") {
        imported += 1;
      } else {
        skipped += 1;
      }
    }

    return ok({
      imported,
      skipped,
      total: catalog.length,
    });
  }
}
