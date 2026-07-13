import type {
  ClientListDto,
  ListClientsQuery,
} from "@/application/dto/client/clientDto";
import { mapClientToListItemDto } from "@/application/mappers/client/clientMapper";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { IClientRepository } from "@/domain/client/repositories/IClientRepository";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { ok, type Result } from "@/domain/shared/Result";

export type ListClientsDependencies = {
  clientRepository: IClientRepository;
};

export class ListClientsUseCase implements IUseCase<ListClientsQuery, ClientListDto, DomainError> {
  constructor(private readonly deps: ListClientsDependencies) {}

  async execute(
    ctx: RequestContext,
    input: ListClientsQuery,
  ): Promise<Result<ClientListDto, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const result = await this.deps.clientRepository.list({
      page: input.page,
      pageSize: input.pageSize,
      search: input.search,
    });

    return ok({
      items: result.items.map(mapClientToListItemDto),
      total: result.total,
      page: input.page,
      pageSize: input.pageSize,
    });
  }
}
