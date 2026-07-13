import type { ImportAbrdProjectsResultDto } from "@/application/dto/project/importAbrdProjectsDto";
import type { IProjectCatalogService } from "@/application/ports/IProjectCatalogService";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { IClientRepository } from "@/domain/client/repositories/IClientRepository";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";
import type { IProjectRepository } from "@/domain/project/repositories/IProjectRepository";
import { ValidationError } from "@/domain/shared/errors/ValidationError";

export type ImportAbrdProjectsDependencies = {
  projectRepository: IProjectRepository;
  projectCatalogService: IProjectCatalogService;
  clientRepository: IClientRepository;
};

/** One-time import of ABRD projects into the local master list. Existing rows are never updated. */
export class ImportAbrdProjectsUseCase
  implements IUseCase<void, ImportAbrdProjectsResultDto, DomainError>
{
  constructor(private readonly deps: ImportAbrdProjectsDependencies) {}

  async execute(
    ctx: RequestContext,
  ): Promise<Result<ImportAbrdProjectsResultDto, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    if (!this.deps.projectCatalogService.isConfigured()) {
      return err(new ValidationError("ABRD project catalog is not configured."));
    }

    const catalog = await this.deps.projectCatalogService.fetchAllProjects();
    let imported = 0;
    let skipped = 0;

    for (const entry of catalog) {
      const linkedClient =
        entry.ownerId != null
          ? await this.deps.clientRepository.findByAbdrOwnerId(entry.ownerId)
          : null;

      const result = await this.deps.projectRepository.importFromAbrd({
        abrdProjectId: entry.id,
        name: entry.name,
        abrdOwnerId: entry.ownerId,
        clientId: linkedClient?.id ?? null,
        client: linkedClient?.name ?? (entry.client?.trim() || "TBD"),
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
