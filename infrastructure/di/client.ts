import { ImportAbrdClientsUseCase } from "@/application/use-cases/client/ImportAbrdClientsUseCase";
import { ListClientsUseCase } from "@/application/use-cases/client/ListClientsUseCase";
import type { IOwnerCatalogService } from "@/application/ports/IOwnerCatalogService";
import { AbrdOwnerCatalogService } from "@/infrastructure/abrd/AbrdOwnerCatalogService";
import type { IClientRepository } from "@/domain/client/repositories/IClientRepository";
import { DrizzleClientRepository } from "@/infrastructure/persistence/client/DrizzleClientRepository";

export type ClientServices = {
  clientRepository: IClientRepository;
  ownerCatalogService: IOwnerCatalogService;
  listClientsUseCase: ListClientsUseCase;
  importAbrdClientsUseCase: ImportAbrdClientsUseCase;
};

export function createClientServices(): ClientServices {
  const clientRepository = new DrizzleClientRepository();
  const ownerCatalogService = new AbrdOwnerCatalogService();

  return {
    clientRepository,
    ownerCatalogService,
    listClientsUseCase: new ListClientsUseCase({ clientRepository }),
    importAbrdClientsUseCase: new ImportAbrdClientsUseCase({
      clientRepository,
      ownerCatalogService,
    }),
  };
}
