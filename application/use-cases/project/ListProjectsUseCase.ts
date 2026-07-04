import type { ListProjectsQuery } from "@/application/dto/project/projectSchema";
import type { ProjectListDto } from "@/application/dto/project/projectDto";
import { mapProjectToDetailDto } from "@/application/mappers/project/projectMapper";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { ok, type Result } from "@/domain/shared/Result";
import type { IProjectRepository } from "@/domain/project/repositories/IProjectRepository";

export type ListProjectsDependencies = {
  projectRepository: IProjectRepository;
};

export class ListProjectsUseCase
  implements IUseCase<ListProjectsQuery, ProjectListDto, DomainError>
{
  constructor(private readonly deps: ListProjectsDependencies) {}

  async execute(
    ctx: RequestContext,
    input: ListProjectsQuery,
  ): Promise<Result<ProjectListDto, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const result = await this.deps.projectRepository.list({
      page: input.page,
      pageSize: input.pageSize,
      search: input.search,
    });

    return ok({
      items: result.items.map(mapProjectToDetailDto),
      total: result.total,
      page: input.page,
      pageSize: input.pageSize,
    });
  }
}
