import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { ok, type Result } from "@/domain/shared/Result";
import type {
  IWorkshopBatchRepository,
  PendingSectionHeadBatchDto,
} from "@/domain/workshop/repositories/IWorkshopBatchRepository";

export type ListBoqNotificationsInput = {
  limit?: number;
};

export type ListBoqNotificationsDependencies = {
  workshopBatchRepository: IWorkshopBatchRepository;
};

export class ListBoqNotificationsUseCase
  implements
    IUseCase<ListBoqNotificationsInput, PendingSectionHeadBatchDto[], DomainError>
{
  constructor(private readonly deps: ListBoqNotificationsDependencies) {}

  async execute(
    ctx: RequestContext,
    input: ListBoqNotificationsInput,
  ): Promise<Result<PendingSectionHeadBatchDto[], DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const rows = await this.deps.workshopBatchRepository.listAwaitingSectionHead(
      input.limit ?? 20,
    );
    return ok(rows);
  }
}
