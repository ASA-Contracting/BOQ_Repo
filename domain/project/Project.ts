import type { ProjectStatus } from "@/domain/project/ProjectStatus";
import type { ProjectId } from "@/domain/project/ids";

export type Project = {
  id: ProjectId;
  name: string;
  description: string | null;
  client: string;
  status: ProjectStatus;
  abrdProjectId: number | null;
  externalSource: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type NewProject = {
  name: string;
  description?: string | null;
  client: string;
  abrdProjectId?: number | null;
  externalSource?: string;
};
