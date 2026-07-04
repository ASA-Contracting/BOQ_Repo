import type { CreateProjectInput } from "@/application/dto/project/projectSchema";
import type { ProjectDetailDto } from "@/application/dto/project/projectDto";
import { mapProjectToDetailDto } from "@/application/mappers/project/projectMapper";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { ok, type Result } from "@/domain/shared/Result";
import {
  validateProjectClient,
  validateProjectDescription,
  validateProjectName,
} from "@/domain/project/projectValidators";
import type { IProjectRepository } from "@/domain/project/repositories/IProjectRepository";

export type CreateProjectDependencies = {
  projectRepository: IProjectRepository;
};

export class CreateProjectUseCase
  implements IUseCase<CreateProjectInput, ProjectDetailDto, DomainError>
{
  constructor(private readonly deps: CreateProjectDependencies) {}

  async execute(
    ctx: RequestContext,
    input: CreateProjectInput,
  ): Promise<Result<ProjectDetailDto, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const name = validateProjectName(input.name);
    if (!name.ok) return name;

    const client = validateProjectClient(input.client);
    if (!client.ok) return client;

    const description = validateProjectDescription(input.description);
    if (!description.ok) return description;

    const project = await this.deps.projectRepository.create({
      name: name.value,
      client: client.value,
      description: description.value,
    });

    return ok(mapProjectToDetailDto(project));
  }
}
