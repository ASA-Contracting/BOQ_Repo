import type { SavedFilterDefinition } from "@/lib/filter-engine";

export type SavedFilterDto = {
  id: number;
  pageKey: string;
  name: string;
  definition: SavedFilterDefinition;
  isFavorite: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type UpsertSavedFilterInput = {
  pageKey: string;
  name: string;
  definition: SavedFilterDefinition;
};

export type ListSavedFiltersInput = {
  pageKey: string;
};

export type DeleteSavedFilterInput = {
  id: number;
};

export type SetFavoriteSavedFilterInput = {
  id: number;
};
