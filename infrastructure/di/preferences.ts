import { DrizzleSavedFilterRepository } from "@/infrastructure/persistence/preferences/DrizzleSavedFilterRepository";
import {
  DeleteSavedFilterUseCase,
  ListSavedFiltersUseCase,
  SetFavoriteSavedFilterUseCase,
  UpsertSavedFilterUseCase,
} from "@/application/use-cases/preferences/SavedFilterUseCases";

export type PreferencesServices = {
  savedFilterRepository: DrizzleSavedFilterRepository;
  listSavedFiltersUseCase: ListSavedFiltersUseCase;
  upsertSavedFilterUseCase: UpsertSavedFilterUseCase;
  deleteSavedFilterUseCase: DeleteSavedFilterUseCase;
  setFavoriteSavedFilterUseCase: SetFavoriteSavedFilterUseCase;
};

export function createPreferencesServices(): PreferencesServices {
  const savedFilterRepository = new DrizzleSavedFilterRepository();

  return {
    savedFilterRepository,
    listSavedFiltersUseCase: new ListSavedFiltersUseCase({ savedFilterRepository }),
    upsertSavedFilterUseCase: new UpsertSavedFilterUseCase({ savedFilterRepository }),
    deleteSavedFilterUseCase: new DeleteSavedFilterUseCase({ savedFilterRepository }),
    setFavoriteSavedFilterUseCase: new SetFavoriteSavedFilterUseCase({ savedFilterRepository }),
  };
}
