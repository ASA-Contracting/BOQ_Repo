import { GetBoqBreakdownUseCase } from "@/application/use-cases/boq/GetBoqBreakdownUseCase";
import {
  CreateBoqLookupOptionUseCase,
  DeleteBoqLookupOptionUseCase,
  ListBoqLookupOptionsUseCase,
  ReorderBoqLookupOptionsUseCase,
  UpdateBoqLookupOptionUseCase,
} from "@/application/use-cases/boq/BoqLookupOptionUseCases";
import { ListBoqsUseCase } from "@/application/use-cases/boq/ListBoqsUseCase";
import type { IBoqLookupOptionRepository } from "@/application/ports/IBoqLookupOptionRepository";
import type { IBoqReadRepository } from "@/application/ports/IBoqReadRepository";
import { DrizzleBoqLookupOptionRepository } from "@/infrastructure/persistence/boq/DrizzleBoqLookupOptionRepository";
import { DrizzleBoqReadRepository } from "@/infrastructure/persistence/boq/DrizzleBoqReadRepository";

export type BoqServices = {
  boqReadRepository: IBoqReadRepository;
  boqLookupOptionRepository: IBoqLookupOptionRepository;
  listBoqsUseCase: ListBoqsUseCase;
  getBoqBreakdownUseCase: GetBoqBreakdownUseCase;
  listBoqLookupOptionsUseCase: ListBoqLookupOptionsUseCase;
  createBoqLookupOptionUseCase: CreateBoqLookupOptionUseCase;
  updateBoqLookupOptionUseCase: UpdateBoqLookupOptionUseCase;
  deleteBoqLookupOptionUseCase: DeleteBoqLookupOptionUseCase;
  reorderBoqLookupOptionsUseCase: ReorderBoqLookupOptionsUseCase;
};

export function createBoqServices(): BoqServices {
  const boqReadRepository = new DrizzleBoqReadRepository();
  const boqLookupOptionRepository = new DrizzleBoqLookupOptionRepository();
  const lookupDeps = { boqLookupOptionRepository };

  return {
    boqReadRepository,
    boqLookupOptionRepository,
    listBoqsUseCase: new ListBoqsUseCase({ boqReadRepository }),
    getBoqBreakdownUseCase: new GetBoqBreakdownUseCase({ boqReadRepository }),
    listBoqLookupOptionsUseCase: new ListBoqLookupOptionsUseCase(lookupDeps),
    createBoqLookupOptionUseCase: new CreateBoqLookupOptionUseCase(lookupDeps),
    updateBoqLookupOptionUseCase: new UpdateBoqLookupOptionUseCase(lookupDeps),
    deleteBoqLookupOptionUseCase: new DeleteBoqLookupOptionUseCase(lookupDeps),
    reorderBoqLookupOptionsUseCase: new ReorderBoqLookupOptionsUseCase(lookupDeps),
  };
}
