import type { NewProject, Project } from "@/domain/project/Project";
import type { ProjectId } from "@/domain/project/ids";

export type ProjectListQuery = {
  page: number;
  pageSize: number;
  search?: string;
};

export type ProjectListResult = {
  items: Project[];
  total: number;
};

export type UpdateProjectInput = {
  name?: string;
  client?: string;
  description?: string | null;
};

export interface IProjectRepository {
  findById(id: ProjectId): Promise<Project | null>;
  list(query: ProjectListQuery): Promise<ProjectListResult>;
  create(input: NewProject): Promise<Project>;
  update(id: ProjectId, input: UpdateProjectInput): Promise<Project>;
  close(id: ProjectId): Promise<Project>;
}
