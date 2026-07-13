import type { ProjectStatus } from "@/domain/project/ProjectStatus";
import type { ProjectId } from "@/domain/project/ids";

export type Project = {
  id: ProjectId;
  name: string;
  description: string | null;
  client: string;
  clientId: number | null;
  tenderStatus: string | null;
  country: string | null;
  assignedTo: string | null;
  ownerType: string | null;
  status: ProjectStatus;
  abrdProjectId: number | null;
  externalSource: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type NewProject = {
  name: string;
  description?: string | null;
  client?: string;
  clientId?: number | null;
  tenderStatus?: string | null;
  country?: string | null;
  assignedTo?: string | null;
  ownerType?: string | null;
  abrdProjectId?: number | null;
  externalSource?: string;
};
