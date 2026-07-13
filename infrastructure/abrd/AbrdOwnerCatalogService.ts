import type {
  IOwnerCatalogService,
  OwnerCatalogEntry,
} from "@/application/ports/IOwnerCatalogService";
import { extractAbrdListItems } from "@/infrastructure/abrd/abrdResponse";
import { getAbrdEnv } from "@/infrastructure/config/env";

type AbrdOwnerResponse = {
  id: number;
  name: string;
};

export class AbrdOwnerCatalogService implements IOwnerCatalogService {
  isConfigured(): boolean {
    try {
      getAbrdEnv();
      return true;
    } catch {
      return false;
    }
  }

  async fetchAllOwners(): Promise<OwnerCatalogEntry[]> {
    const env = getAbrdEnv();

    const response = await fetch(`${env.ABRD_API_BASE_URL}/owners`, {
      headers: {
        Authorization: `Bearer ${env.ABRD_API_TOKEN}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`ABRD owner list failed (${response.status})`);
    }

    const payload = await response.json();
    const items = extractAbrdListItems<AbrdOwnerResponse>(payload);

    if (items.length === 0 && payload !== null && typeof payload === "object") {
      throw new Error("ABRD owner list returned an unexpected payload.");
    }

    return items
      .filter((item) => item.name.trim().length > 0)
      .map((item) => ({
        id: item.id,
        name: item.name.trim(),
      }));
  }
}
