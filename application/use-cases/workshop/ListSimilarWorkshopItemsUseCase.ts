import type { SimilarWorkshopItemDto } from "@/application/dto/workshop/categorizationDto";
import { buildFamilyPathMap, resolveFamilyPath } from "@/application/mappers/workshop/familyPathMapper";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { IFamilyRepository } from "@/domain/family/repositories/IFamilyRepository";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { ok, type Result } from "@/domain/shared/Result";
import { toWorkshopBatchId, toWorkshopItemId } from "@/domain/workshop/ids";
import type { IWorkshopItemRepository } from "@/domain/workshop/repositories/IWorkshopItemRepository";

export type ListSimilarWorkshopItemsInput = {
  batchId: number;
  itemId: number;
  description: string;
  limit?: number;
};

export class ListSimilarWorkshopItemsUseCase
  implements IUseCase<ListSimilarWorkshopItemsInput, SimilarWorkshopItemDto[], DomainError>
{
  constructor(
    private readonly deps: {
      workshopItemRepository: IWorkshopItemRepository;
      familyRepository: IFamilyRepository;
    },
  ) {}

  async execute(
    ctx: RequestContext,
    input: ListSimilarWorkshopItemsInput,
  ): Promise<Result<SimilarWorkshopItemDto[], DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const [similarItems, families] = await Promise.all([
      this.deps.workshopItemRepository.listSimilarItems(
        toWorkshopBatchId(input.batchId),
        input.description,
        toWorkshopItemId(input.itemId),
        input.limit ?? 5,
      ),
      this.deps.familyRepository.findAllFlat(),
    ]);

    const pathMap = buildFamilyPathMap(families);

    return ok(
      similarItems.map((item) => ({
        id: item.id as number,
        description: item.description,
        finalFamilyId: item.finalFamilyId as number | null,
        finalFamilyPath: resolveFamilyPath(pathMap, item.finalFamilyId),
      })),
    );
  }
}
