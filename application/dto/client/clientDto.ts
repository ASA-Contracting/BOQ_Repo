import { z } from "zod";

import { CLIENT_NAME_MAX_LENGTH } from "@/domain/client/constants";

export type ClientListItemDto = {
  id: number;
  name: string;
  abrdOwnerId: number | null;
  externalSource: string;
};

export type ClientListDto = {
  items: ClientListItemDto[];
  total: number;
  page: number;
  pageSize: number;
};

export const listClientsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(20),
  search: z.string().trim().optional(),
});

export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>;
