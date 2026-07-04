import type { ProjectDetailDto } from "@/application/dto/project/projectDto";
import { mapProjectToDetailDto } from "@/application/mappers/project/projectMapper";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { authorizeCloseProject } from "@/application/use-cases/project/authorizeCloseProject";
import {
  ProjectAlreadyClosedError,
  ProjectNotFoundError,
} from "@/domain/project/errors/ProjectErrors";
import { toProjectId } from "@/domain/project/ids";
import type { IProjectRepository } from "@/domain/project/repositories/IProjectRepository";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";

export type CloseProjectInput = {
  projectId: number;
};

export type CloseProjectDependencies = {
  projectRepository: IProjectRepository;
};

export class CloseProjectUseCase
  implements IUseCase<CloseProjectInput, ProjectDetailDto, DomainError>
{
  constructor(private readonly deps: CloseProjectDependencies) {}

  async execute(
    ctx: RequestContext,
    input: CloseProjectInput,
  ): Promise<Result<ProjectDetailDto, DomainError>> {
    const auth = authorizeCloseProject(ctx);
    if (!auth.ok) {
      return auth;
    }

    const projectId = toProjectId(input.projectId);
    const existing = await this.deps.projectRepository.findById(projectId);
    if (!existing) {
      return err(new ProjectNotFoundError(projectId));
    }

    if (existing.status === "closed") {
      return err(new ProjectAlreadyClosedError(projectId));
    }

    const project = await this.deps.projectRepository.close(projectId);
    return ok(mapProjectToDetailDto(project));
  }
}
