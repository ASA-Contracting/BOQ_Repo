import { z } from "zod";

import type { IUseCase } from "@/application/use-cases/IUseCase";
import { authorizeWorkshopImport } from "@/application/use-cases/workshop/authorizeWorkshopImport";
import type { IBoqReadRepository } from "@/application/ports/IBoqReadRepository";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import { NotFoundError } from "@/domain/shared/errors/NotFoundError";
import { ValidationError } from "@/domain/shared/errors/ValidationError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";

export const deleteBoqMasterListEntriesSchema = z.object({
  versionIds: z.array(z.number().int().positive()).min(1),
});

export type DeleteBoqMasterListEntriesInput = z.infer<typeof deleteBoqMasterListEntriesSchema>;

export type DeleteBoqMasterListEntriesResult = {
  deletedCount: number;
};

export type DeleteBoqMasterListEntriesDependencies = {
  boqReadRepository: IBoqReadRepository;
};

function mapZodError(error: z.ZodError): ValidationError {
  const first = error.issues[0];
  return new ValidationError(first?.message ?? "Invalid request.", {
    field: first?.path.join(".") || undefined,
  });
}

export class DeleteBoqMasterListEntriesUseCase
  implements
    IUseCase<
      DeleteBoqMasterListEntriesInput,
      DeleteBoqMasterListEntriesResult,
      DomainError
    >
{
  constructor(private readonly deps: DeleteBoqMasterListEntriesDependencies) {}

  async execute(
    ctx: RequestContext,
    input: DeleteBoqMasterListEntriesInput,
  ): Promise<Result<DeleteBoqMasterListEntriesResult, DomainError>> {
    const auth = authorizeWorkshopImport(ctx);
    if (!auth.ok) {
      return auth;
    }

    const parsed = deleteBoqMasterListEntriesSchema.safeParse(input);
    if (!parsed.success) {
      return err(mapZodError(parsed.error));
    }

    const uniqueVersionIds = [...new Set(parsed.data.versionIds)];
    const deletedCount = await this.deps.boqReadRepository.softDeleteBoqVersions(uniqueVersionIds);

    if (deletedCount === 0) {
      return err(new NotFoundError("BOQ version", uniqueVersionIds.join(", ")));
    }

    if (deletedCount !== uniqueVersionIds.length) {
      return err(
        new ValidationError("One or more selected BOQ versions could not be deleted."),
      );
    }

    return ok({ deletedCount });
  }
}
