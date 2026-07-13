export type ProjectCatalogEntry = {
  id: number;
  name: string;
  client: string | null;
  ownerId: number | null;
  statusName: string | null;
};

export interface IProjectCatalogService {
  isConfigured(): boolean;
  searchProjects(query: string, limit?: number): Promise<ProjectCatalogEntry[]>;
  fetchAllProjects(): Promise<ProjectCatalogEntry[]>;
}
