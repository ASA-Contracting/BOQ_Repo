import type { ClientId } from "@/domain/client/ids";

export type Client = {
  id: ClientId;
  name: string;
  abrdOwnerId: number | null;
  externalSource: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type NewClient = {
  name: string;
  abrdOwnerId?: number | null;
  externalSource?: string;
};
