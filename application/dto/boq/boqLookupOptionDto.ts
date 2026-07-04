import { z } from "zod";

export const BOQ_LOOKUP_CATEGORIES = ["discipline"] as const;

export type BoqLookupCategory = (typeof BOQ_LOOKUP_CATEGORIES)[number];

export const BOQ_LOOKUP_TONES = [
  "green",
  "yellow",
  "red",
  "blue",
  "purple",
  "teal",
  "orange",
  "gray",
] as const;

export type BoqLookupTone = (typeof BOQ_LOOKUP_TONES)[number];

export const BOQ_LOOKUP_PRESET_CUSTOM_HEX = [
  "#84c718",
  "#10b981",
  "#22c55e",
  "#84cc16",
  "#eab308",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
  "#14b8a6",
  "#94a3b8",
  "#d946ef",
  "#f97316",
  "#0ea5e9",
] as const;

export type BoqLookupOptionDto = {
  id: number;
  category: BoqLookupCategory;
  name: string;
  customLabel: string | null;
  tone: BoqLookupTone | null;
  customHex: string | null;
  sortOrder: number;
};

const lookupCategorySchema = z.enum(BOQ_LOOKUP_CATEGORIES);
const lookupToneSchema = z.enum(BOQ_LOOKUP_TONES);

const customHexSchema = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Invalid hex color")
  .optional()
  .nullable();

export const listBoqLookupOptionsSchema = z.object({
  category: lookupCategorySchema,
});

export const createBoqLookupOptionSchema = z.object({
  category: lookupCategorySchema,
  name: z.string().trim().min(1).max(150),
  customLabel: z.string().trim().max(100).optional().nullable(),
  tone: lookupToneSchema.optional().nullable(),
  customHex: customHexSchema,
  sortOrder: z.number().int().min(0).optional(),
});

export const updateBoqLookupOptionSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1).max(150),
  customLabel: z.string().trim().max(100).optional().nullable(),
  tone: lookupToneSchema.optional().nullable(),
  customHex: customHexSchema,
  sortOrder: z.number().int().min(0).optional(),
});

export const deleteBoqLookupOptionSchema = z.object({
  id: z.number().int().positive(),
});

export const reorderBoqLookupOptionsSchema = z.object({
  category: lookupCategorySchema,
  orderedIds: z.array(z.number().int().positive()).min(1),
});

export type ListBoqLookupOptionsInput = z.infer<typeof listBoqLookupOptionsSchema>;
export type CreateBoqLookupOptionInput = z.infer<typeof createBoqLookupOptionSchema>;
export type UpdateBoqLookupOptionInput = z.infer<typeof updateBoqLookupOptionSchema>;
export type DeleteBoqLookupOptionInput = z.infer<typeof deleteBoqLookupOptionSchema>;
export type ReorderBoqLookupOptionsInput = z.infer<typeof reorderBoqLookupOptionsSchema>;

export function getBoqSettingsAddButtonLabel(category: BoqLookupCategory): string {
  switch (category) {
    case "discipline":
      return "Create New Discipline";
  }
}

export function getBoqSettingsFirstColumnLabel(category: BoqLookupCategory): string {
  switch (category) {
    case "discipline":
      return "Discipline";
  }
}

export function getBoqSettingsTabLabel(category: BoqLookupCategory): string {
  switch (category) {
    case "discipline":
      return "Discipline";
  }
}
