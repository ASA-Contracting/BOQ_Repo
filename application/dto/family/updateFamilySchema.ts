import { z } from "zod";

import {
  FAMILY_DESCRIPTION_MAX_LENGTH,
  FAMILY_NAME_MAX_LENGTH,
  FAMILY_REFERENCE_CODE_MAX_LENGTH,
} from "@/domain/family/constants";

export const updateFamilySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1).max(FAMILY_NAME_MAX_LENGTH).optional(),
  referenceCode: z
    .string()
    .trim()
    .max(FAMILY_REFERENCE_CODE_MAX_LENGTH)
    .nullable()
    .optional(),
  description: z
    .string()
    .trim()
    .max(FAMILY_DESCRIPTION_MAX_LENGTH)
    .nullable()
    .optional(),
  familyLevelTypeId: z.number().int().positive().optional(),
  parentId: z.number().int().positive().nullable().optional(),
});

export type UpdateFamilyInput = {
  id: number;
  name?: string;
  referenceCode?: string | null;
  description?: string | null;
  familyLevelTypeId?: number;
  parentId?: number | null;
};
