import type { ProjectDetailDto } from "@/application/dto/project/projectDto";
import type { Project } from "@/domain/project/Project";

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export function mapProjectToDetailDto(project: Project): ProjectDetailDto {
  return {
    id: project.id as number,
    name: project.name,
    description: project.description,
    client: project.client,
    status: project.status,
    abrdProjectId: project.abrdProjectId,
    externalSource: project.externalSource,
    createdAt: toIsoString(project.createdAt),
    updatedAt: toIsoString(project.updatedAt),
  };
}
