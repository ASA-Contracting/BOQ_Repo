import { z } from "zod";

import { ROLES } from "@/domain/shared/Role";

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const inviteUserSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  displayName: z.string().trim().min(1).max(120).optional(),
  roles: z
    .array(z.enum(ROLES))
    .min(1, "Assign at least one role.")
    .default(["viewer"]),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;

export const updateUserSchema = z.object({
  displayName: z.string().trim().min(1).max(120).nullable().optional(),
  roles: z.array(z.enum(ROLES)).min(1, "Assign at least one role.").optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
