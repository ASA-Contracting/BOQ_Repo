import type { ImportTenderProjectsResultDto } from "@/application/dto/project/importTenderProjectsDto";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { IClientRepository } from "@/domain/client/repositories/IClientRepository";
import { normalizeOwnerType } from "@/domain/project/TenderStatus";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { ValidationError } from "@/domain/shared/errors/ValidationError";
import { err, ok, type Result } from "@/domain/shared/Result";
import type { IProjectRepository } from "@/domain/project/repositories/IProjectRepository";
import {
  parseTenderProjectsCsv,
  type TenderProjectCsvRow,
} from "@/infrastructure/import/tenderProjectsCsv";

export type ImportTenderProjectsDependencies = {
  projectRepository: IProjectRepository;
  clientRepository: IClientRepository;
};

/** One-time import of the final ABRD tender project CSV into the local master list. */
export class ImportTenderProjectsUseCase
  implements IUseCase<TenderProjectCsvRow[], ImportTenderProjectsResultDto, DomainError>
{
  constructor(private readonly deps: ImportTenderProjectsDependencies) {}

  async execute(
    ctx: RequestContext,
    rows: TenderProjectCsvRow[],
  ): Promise<Result<ImportTenderProjectsResultDto, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    if (rows.length === 0) {
      return err(new ValidationError("Tender project CSV is empty."));
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let clientsCreated = 0;

    for (const row of rows) {
      if (!row.name.trim() || !row.owner.trim()) {
        skipped += 1;
        continue;
      }

      let client = await this.deps.clientRepository.findByName(row.owner);
      if (!client) {
        client = await this.deps.clientRepository.create({
          name: row.owner,
          externalSource: "abrd",
        });
        clientsCreated += 1;
      }

      const result = await this.deps.projectRepository.importFromTenderCsv({
        abrdProjectId: row.abrdProjectId,
        name: row.name,
        client: row.owner,
        clientId: client.id,
        ownerType: normalizeOwnerType(row.ownerType),
        tenderStatus: row.tenderStatus,
        country: row.country,
        assignedTo: row.assignedTo,
      });

      if (result === "imported") {
        imported += 1;
      } else if (result === "updated") {
        updated += 1;
      } else {
        skipped += 1;
      }
    }

    return ok({
      imported,
      updated,
      skipped,
      clientsCreated,
      total: rows.length,
    });
  }
}

export function parseTenderProjectsCsvContent(content: string): TenderProjectCsvRow[] {
  return parseTenderProjectsCsv(content);
}
