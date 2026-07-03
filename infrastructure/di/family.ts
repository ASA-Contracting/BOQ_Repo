import { CreateFamilyUseCase } from "@/application/use-cases/family/CreateFamilyUseCase";
import { DeleteFamilyUseCase } from "@/application/use-cases/family/DeleteFamilyUseCase";
import { GetFamilyUseCase } from "@/application/use-cases/family/GetFamilyUseCase";
import { ListFamilyLevelTypesUseCase } from "@/application/use-cases/family/ListFamilyLevelTypesUseCase";
import { ListFamilyTreeUseCase } from "@/application/use-cases/family/ListFamilyTreeUseCase";
import { SearchFamiliesUseCase } from "@/application/use-cases/family/SearchFamiliesUseCase";
import { UpdateFamilyUseCase } from "@/application/use-cases/family/UpdateFamilyUseCase";
import type { IFamilyLevelTypeRepository } from "@/domain/family/repositories/IFamilyLevelTypeRepository";
import type { IFamilyRepository } from "@/domain/family/repositories/IFamilyRepository";
import type { IUnitOfWork } from "@/domain/shared/persistence/IUnitOfWork";
import { DrizzleFamilyLevelTypeRepository } from "@/infrastructure/persistence/family/DrizzleFamilyLevelTypeRepository";
import { DrizzleFamilyRepository } from "@/infrastructure/persistence/family/DrizzleFamilyRepository";

export type FamilyServices = {
  familyRepository: IFamilyRepository;
  familyLevelTypeRepository: IFamilyLevelTypeRepository;
  listFamilyTreeUseCase: ListFamilyTreeUseCase;
  searchFamiliesUseCase: SearchFamiliesUseCase;
  getFamilyUseCase: GetFamilyUseCase;
  listFamilyLevelTypesUseCase: ListFamilyLevelTypesUseCase;
  createFamilyUseCase: CreateFamilyUseCase;
  updateFamilyUseCase: UpdateFamilyUseCase;
  deleteFamilyUseCase: DeleteFamilyUseCase;
};

export type CreateFamilyServicesInput = {
  unitOfWork: IUnitOfWork;
};

export function createFamilyServices(
  deps: CreateFamilyServicesInput,
): FamilyServices {
  const familyRepository = new DrizzleFamilyRepository();
  const familyLevelTypeRepository = new DrizzleFamilyLevelTypeRepository();

  return {
    familyRepository,
    familyLevelTypeRepository,
    listFamilyTreeUseCase: new ListFamilyTreeUseCase({ familyRepository }),
    searchFamiliesUseCase: new SearchFamiliesUseCase({ familyRepository }),
    getFamilyUseCase: new GetFamilyUseCase({
      familyRepository,
      familyLevelTypeRepository,
    }),
    listFamilyLevelTypesUseCase: new ListFamilyLevelTypesUseCase({
      familyLevelTypeRepository,
    }),
    createFamilyUseCase: new CreateFamilyUseCase({
      familyRepository,
      familyLevelTypeRepository,
      unitOfWork: deps.unitOfWork,
    }),
    updateFamilyUseCase: new UpdateFamilyUseCase({
      familyRepository,
      familyLevelTypeRepository,
      unitOfWork: deps.unitOfWork,
    }),
    deleteFamilyUseCase: new DeleteFamilyUseCase({
      familyRepository,
      unitOfWork: deps.unitOfWork,
    }),
  };
}
