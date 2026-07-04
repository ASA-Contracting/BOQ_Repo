import { CloseProjectUseCase } from "@/application/use-cases/project/CloseProjectUseCase";
import { CreateProjectUseCase } from "@/application/use-cases/project/CreateProjectUseCase";
import { GetProjectUseCase } from "@/application/use-cases/project/GetProjectUseCase";
import { ListProjectsUseCase } from "@/application/use-cases/project/ListProjectsUseCase";
import { UpdateProjectUseCase } from "@/application/use-cases/project/UpdateProjectUseCase";
import type { IProjectRepository } from "@/domain/project/repositories/IProjectRepository";
import { DrizzleProjectRepository } from "@/infrastructure/persistence/project/DrizzleProjectRepository";

export type ProjectServices = {
  projectRepository: IProjectRepository;
  createProjectUseCase: CreateProjectUseCase;
  listProjectsUseCase: ListProjectsUseCase;
  getProjectUseCase: GetProjectUseCase;
  updateProjectUseCase: UpdateProjectUseCase;
  closeProjectUseCase: CloseProjectUseCase;
};

export function createProjectServices(): ProjectServices {
  const projectRepository = new DrizzleProjectRepository();

  return {
    projectRepository,
    createProjectUseCase: new CreateProjectUseCase({ projectRepository }),
    listProjectsUseCase: new ListProjectsUseCase({ projectRepository }),
    getProjectUseCase: new GetProjectUseCase({ projectRepository }),
    updateProjectUseCase: new UpdateProjectUseCase({ projectRepository }),
    closeProjectUseCase: new CloseProjectUseCase({ projectRepository }),
  };
}
