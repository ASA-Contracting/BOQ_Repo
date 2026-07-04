import type { ProjectDetailDto } from "@/application/dto/project/projectDto";
import { mapProjectToDetailDto } from "@/application/mappers/project/projectMapper";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import { ProjectNotFoundError } from "@/domain/project/errors/ProjectErrors";
import { toProjectId } from "@/domain/project/ids";
import type { IProjectRepository } from "@/domain/project/repositories/IProjectRepository";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";

export type GetProjectInput = {
  projectId: number;
};

export type GetProjectDependencies = {
  projectRepository: IProjectRepository;
};

export class GetProjectUseCase
  implements IUseCase<GetProjectInput, ProjectDetailDto, DomainError>
{
  constructor(private readonly deps: GetProjectDependencies) {}

  async execute(
    ctx: RequestContext,
    input: GetProjectInput,
  ): Promise<Result<ProjectDetailDto, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const projectId = toProjectId(input.projectId);
    const project = await this.deps.projectRepository.findById(projectId);
    if (!project) {
      return err(new ProjectNotFoundError(projectId));
    }

    return ok(mapProjectToDetailDto(project));
  }
}
