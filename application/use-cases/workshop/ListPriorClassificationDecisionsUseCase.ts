import type { PriorDecisionDto } from "@/application/dto/workshop/categorizationDto";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { ok, type Result } from "@/domain/shared/Result";
import type { IWorkshopReviewRepository } from "@/domain/workshop/repositories/IWorkshopItemRepository";

export type ListPriorClassificationDecisionsInput = {
  description: string;
  limit?: number;
};

export class ListPriorClassificationDecisionsUseCase
  implements
    IUseCase<ListPriorClassificationDecisionsInput, PriorDecisionDto[], DomainError>
{
  constructor(
    private readonly deps: {
      workshopReviewRepository: IWorkshopReviewRepository;
    },
  ) {}

  async execute(
    ctx: RequestContext,
    input: ListPriorClassificationDecisionsInput,
  ): Promise<Result<PriorDecisionDto[], DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const decisions = await this.deps.workshopReviewRepository.listPriorDecisions(
      input.description,
      input.limit ?? 5,
    );

    return ok(
      decisions.map((decision) => ({
        id: decision.id,
        selectedFamilyId: decision.selectedFamilyId as number | null,
        selectedFamilyName: decision.selectedFamilyName,
        userDisplayName: decision.userDisplayName,
        createdAt: decision.createdAt.toISOString(),
        itemDescription: decision.itemDescription,
      })),
    );
  }
}
