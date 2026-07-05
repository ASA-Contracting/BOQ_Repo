import { ApproveBoqVersionFromBreakdownUseCase } from "@/application/use-cases/boq/ApproveBoqVersionFromBreakdownUseCase";
import { DeleteBoqMasterListEntriesUseCase } from "@/application/use-cases/boq/DeleteBoqMasterListEntriesUseCase";
import { DuplicateBoqVersionUseCase } from "@/application/use-cases/boq/DuplicateBoqVersionUseCase";
import { GetBoqBreakdownUseCase } from "@/application/use-cases/boq/GetBoqBreakdownUseCase";
import {
  CreateBoqLookupOptionUseCase,
  DeleteBoqLookupOptionUseCase,
  ListBoqLookupOptionsUseCase,
  ReorderBoqLookupOptionsUseCase,
  UpdateBoqLookupOptionUseCase,
} from "@/application/use-cases/boq/BoqLookupOptionUseCases";
import { ListBoqVersionsUseCase } from "@/application/use-cases/boq/ListBoqVersionsUseCase";
import { ListBoqsUseCase } from "@/application/use-cases/boq/ListBoqsUseCase";
import type { IBoqLookupOptionRepository } from "@/application/ports/IBoqLookupOptionRepository";
import type { IBoqReadRepository } from "@/application/ports/IBoqReadRepository";
import type { IBoqVersionRepository } from "@/domain/boq/repositories/IBoqVersionRepository";
import { DrizzleBoqLookupOptionRepository } from "@/infrastructure/persistence/boq/DrizzleBoqLookupOptionRepository";
import { DrizzleBoqReadRepository } from "@/infrastructure/persistence/boq/DrizzleBoqReadRepository";
import { DrizzleBoqVersionRepository } from "@/infrastructure/persistence/boq/DrizzleBoqVersionRepository";

export type BoqServices = {
  boqReadRepository: IBoqReadRepository;
  boqVersionRepository: IBoqVersionRepository;
  boqLookupOptionRepository: IBoqLookupOptionRepository;
  listBoqsUseCase: ListBoqsUseCase;
  getBoqBreakdownUseCase: GetBoqBreakdownUseCase;
  listBoqVersionsUseCase: ListBoqVersionsUseCase;
  approveBoqVersionFromBreakdownUseCase: ApproveBoqVersionFromBreakdownUseCase;
  duplicateBoqVersionUseCase: DuplicateBoqVersionUseCase;
  deleteBoqMasterListEntriesUseCase: DeleteBoqMasterListEntriesUseCase;
  listBoqLookupOptionsUseCase: ListBoqLookupOptionsUseCase;
  createBoqLookupOptionUseCase: CreateBoqLookupOptionUseCase;
  updateBoqLookupOptionUseCase: UpdateBoqLookupOptionUseCase;
  deleteBoqLookupOptionUseCase: DeleteBoqLookupOptionUseCase;
  reorderBoqLookupOptionsUseCase: ReorderBoqLookupOptionsUseCase;
};

export function createBoqServices(): BoqServices {
  const boqReadRepository = new DrizzleBoqReadRepository();
  const boqVersionRepository = new DrizzleBoqVersionRepository();
  const boqLookupOptionRepository = new DrizzleBoqLookupOptionRepository();
  const lookupDeps = { boqLookupOptionRepository };
  const versionDeps = { boqReadRepository, boqVersionRepository };

  return {
    boqReadRepository,
    boqVersionRepository,
    boqLookupOptionRepository,
    listBoqsUseCase: new ListBoqsUseCase({ boqReadRepository }),
    getBoqBreakdownUseCase: new GetBoqBreakdownUseCase({ boqReadRepository }),
    listBoqVersionsUseCase: new ListBoqVersionsUseCase({ boqReadRepository }),
    approveBoqVersionFromBreakdownUseCase: new ApproveBoqVersionFromBreakdownUseCase(versionDeps),
    duplicateBoqVersionUseCase: new DuplicateBoqVersionUseCase({ boqVersionRepository }),
    deleteBoqMasterListEntriesUseCase: new DeleteBoqMasterListEntriesUseCase({
      boqReadRepository,
    }),
    listBoqLookupOptionsUseCase: new ListBoqLookupOptionsUseCase(lookupDeps),
    createBoqLookupOptionUseCase: new CreateBoqLookupOptionUseCase(lookupDeps),
    updateBoqLookupOptionUseCase: new UpdateBoqLookupOptionUseCase(lookupDeps),
    deleteBoqLookupOptionUseCase: new DeleteBoqLookupOptionUseCase(lookupDeps),
    reorderBoqLookupOptionsUseCase: new ReorderBoqLookupOptionsUseCase(lookupDeps),
  };
}
