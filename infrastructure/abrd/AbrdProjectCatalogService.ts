import type {
  IProjectCatalogService,
  ProjectCatalogEntry,
} from "@/application/ports/IProjectCatalogService";
import { getAbrdEnv } from "@/infrastructure/config/env";
import { extractAbrdListItems } from "@/infrastructure/abrd/abrdResponse";

type AbrdProjectResponse = {
  id: number;
  name: string;
  ownerName?: string | null;
  ownerId?: number | null;
  statusName?: string | null;
};

type AbrdListResponse = {
  items?: AbrdProjectResponse[];
  data?: { items?: AbrdProjectResponse[] };
};

export class AbrdProjectCatalogService implements IProjectCatalogService {
  isConfigured(): boolean {
    try {
      getAbrdEnv();
      return true;
    } catch {
      return false;
    }
  }

  async searchProjects(query: string, limit = 20): Promise<ProjectCatalogEntry[]> {
    const env = getAbrdEnv();
    const params = new URLSearchParams({
      search: query.trim(),
      pageSize: String(limit),
      pageNumber: "1",
    });

    const response = await fetch(`${env.ABRD_API_BASE_URL}/projects?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${env.ABRD_API_TOKEN}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`ABRD project search failed (${response.status})`);
    }

    const payload = (await response.json()) as AbrdListResponse | AbrdProjectResponse[];
    const items = Array.isArray(payload)
      ? payload
      : (payload.items ?? payload.data?.items ?? []);

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      client: item.ownerName ?? null,
      ownerId: item.ownerId ?? null,
      statusName: item.statusName ?? null,
    }));
  }

  async fetchAllProjects(): Promise<ProjectCatalogEntry[]> {
    const env = getAbrdEnv();
    const response = await fetch(`${env.ABRD_API_BASE_URL}/projects`, {
      headers: {
        Authorization: `Bearer ${env.ABRD_API_TOKEN}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`ABRD project list failed (${response.status})`);
    }

    const payload = await response.json();
    return extractAbrdListItems<AbrdProjectResponse>(payload).map((item) => ({
      id: item.id,
      name: item.name,
      client: item.ownerName ?? null,
      ownerId: item.ownerId ?? null,
      statusName: item.statusName ?? null,
    }));
  }
}
