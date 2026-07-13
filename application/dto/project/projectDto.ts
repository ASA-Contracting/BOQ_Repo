import type { ProjectStatus } from "@/domain/project/ProjectStatus";

export type ProjectDetailDto = {
  id: number;
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
  createdAt: string | null;
  updatedAt: string | null;
};

export type ProjectListItemDto = ProjectDetailDto;

export type ProjectListDto = {
  items: ProjectListItemDto[];
  total: number;
  page: number;
  pageSize: number;
};
