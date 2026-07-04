import type {
  DeleteSavedFilterInput,
  ListSavedFiltersInput,
  SavedFilterDto,
  SetFavoriteSavedFilterInput,
  UpsertSavedFilterInput,
} from "@/application/dto/preferences/savedFilterDto";

export interface ISavedFilterRepository {
  listByUserAndPage(userId: string, input: ListSavedFiltersInput): Promise<SavedFilterDto[]>;
  upsert(userId: string, input: UpsertSavedFilterInput): Promise<SavedFilterDto>;
  delete(userId: string, input: DeleteSavedFilterInput): Promise<void>;
  setFavorite(userId: string, input: SetFavoriteSavedFilterInput): Promise<SavedFilterDto>;
}
