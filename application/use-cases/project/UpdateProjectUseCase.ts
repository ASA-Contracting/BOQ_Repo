import type { UpdateProjectInput } from "@/application/dto/project/projectSchema";
import type { ProjectDetailDto } from "@/application/dto/project/projectDto";
import { mapProjectToDetailDto } from "@/application/mappers/project/projectMapper";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import {
  ProjectClosedError,
  ProjectNotFoundError,
} from "@/domain/project/errors/ProjectErrors";
import { toProjectId } from "@/domain/project/ids";
import {
  validateProjectClient,
  validateProjectDescription,
  validateProjectName,
} from "@/domain/project/projectValidators";
import type { IProjectRepository } from "@/domain/project/repositories/IProjectRepository";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { err, ok, type Result } from "@/domain/shared/Result";

export type UpdateProjectCommand = UpdateProjectInput & {
  projectId: number;
};

export type UpdateProjectDependencies = {
  projectRepository: IProjectRepository;
};

export class UpdateProjectUseCase
  implements IUseCase<UpdateProjectCommand, ProjectDetailDto, DomainError>
{
  constructor(private readonly deps: UpdateProjectDependencies) {}

  async execute(
    ctx: RequestContext,
    input: UpdateProjectCommand,
  ): Promise<Result<ProjectDetailDto, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const projectId = toProjectId(input.projectId);
    const existing = await this.deps.projectRepository.findById(projectId);
    if (!existing) {
      return err(new ProjectNotFoundError(projectId));
    }

    if (existing.status === "closed") {
      return err(new ProjectClosedError(projectId));
    }

    const updates: {
      name?: string;
      client?: string;
      description?: string | null;
    } = {};

    if (input.name !== undefined) {
      const name = validateProjectName(input.name);
      if (!name.ok) return name;
      updates.name = name.value;
    }

    if (input.client !== undefined) {
      const client = validateProjectClient(input.client);
      if (!client.ok) return client;
      updates.client = client.value;
    }

    if (input.description !== undefined) {
      const description = validateProjectDescription(input.description);
      if (!description.ok) return description;
      updates.description = description.value;
    }

    const project = await this.deps.projectRepository.update(projectId, updates);
    return ok(mapProjectToDetailDto(project));
  }
}
