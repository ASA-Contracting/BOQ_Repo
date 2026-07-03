import { z } from "zod";

export const searchFamiliesSchema = z.object({
  query: z.string().trim().min(1).max(100),
  limit: z.number().int().min(1).max(50).default(20),
});

export type SearchFamiliesInput = z.infer<typeof searchFamiliesSchema>;
