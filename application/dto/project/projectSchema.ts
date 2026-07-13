import { z } from "zod";

import {
  PROJECT_CLIENT_MAX_LENGTH,
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
} from "@/domain/project/constants";

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(PROJECT_NAME_MAX_LENGTH),
  client: z.string().trim().min(1).max(PROJECT_CLIENT_MAX_LENGTH).optional(),
  clientId: z.number().int().positive().optional(),
  description: z
    .string()
    .trim()
    .max(PROJECT_DESCRIPTION_MAX_LENGTH)
    .nullable()
    .optional(),
  ownerType: z.string().trim().max(50).nullable().optional(),
  tenderStatus: z.string().trim().max(50).nullable().optional(),
  country: z.string().trim().max(100).nullable().optional(),
  assignedTo: z.string().trim().max(150).nullable().optional(),
}).refine((value) => value.clientId != null || Boolean(value.client?.trim()), {
  message: "Client or clientId is required.",
  path: ["client"],
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(PROJECT_NAME_MAX_LENGTH).optional(),
  client: z.string().trim().min(1).max(PROJECT_CLIENT_MAX_LENGTH).optional(),
  description: z
    .string()
    .trim()
    .max(PROJECT_DESCRIPTION_MAX_LENGTH)
    .nullable()
    .optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const listProjectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});

export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
