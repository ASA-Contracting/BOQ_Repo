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

export type AbrdProjectImportInput = {
  abrdProjectId: number;
  name: string;
  abrdOwnerId: number | null;
  clientId: number | null;
  client: string;
};

export type TenderProjectImportInput = {
  abrdProjectId: number | null;
  name: string;
  client: string;
  clientId: number;
  ownerType: string | null;
  tenderStatus: string | null;
  country: string | null;
  assignedTo: string | null;
};

export interface IProjectRepository {
  findById(id: ProjectId): Promise<Project | null>;
  list(query: ProjectListQuery): Promise<ProjectListResult>;
  create(input: NewProject): Promise<Project>;
  update(id: ProjectId, input: UpdateProjectInput): Promise<Project>;
  close(id: ProjectId): Promise<Project>;
  importFromAbrd(input: AbrdProjectImportInput): Promise<"imported" | "skipped">;
  importFromTenderCsv(
    input: TenderProjectImportInput,
  ): Promise<"imported" | "updated" | "skipped">;
}
