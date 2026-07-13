import type { Client, NewClient } from "@/domain/client/Client";
import type { ClientId } from "@/domain/client/ids";

export type AbrdClientImportInput = {
  abrdOwnerId: number;
  name: string;
};

export type ClientListQuery = {
  page: number;
  pageSize: number;
  search?: string;
};

export type ClientListResult = {
  items: Client[];
  total: number;
};

export interface IClientRepository {
  findById(id: ClientId): Promise<Client | null>;
  findByAbdrOwnerId(abrdOwnerId: number): Promise<Client | null>;
  findByName(name: string): Promise<Client | null>;
  list(query: ClientListQuery): Promise<ClientListResult>;
  create(input: NewClient): Promise<Client>;
  importFromAbrd(input: AbrdClientImportInput): Promise<"imported" | "skipped">;
}
