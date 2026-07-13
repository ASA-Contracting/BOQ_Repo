export type OwnerCatalogEntry = {
  id: number;
  name: string;
};

export interface IOwnerCatalogService {
  isConfigured(): boolean;
  fetchAllOwners(): Promise<OwnerCatalogEntry[]>;
}
