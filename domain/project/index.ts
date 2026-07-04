export type { Project, NewProject } from "@/domain/project/Project";
export type { ProjectStatus } from "@/domain/project/ProjectStatus";
export { PROJECT_STATUSES, isProjectStatus } from "@/domain/project/ProjectStatus";
export { toProjectId, type ProjectId } from "@/domain/project/ids";
export {
  ProjectNotFoundError,
  ProjectClosedError,
  ProjectAlreadyClosedError,
} from "@/domain/project/errors/ProjectErrors";
export type {
  IProjectRepository,
  ProjectListQuery,
  ProjectListResult,
  UpdateProjectInput,
} from "@/domain/project/repositories/IProjectRepository";
