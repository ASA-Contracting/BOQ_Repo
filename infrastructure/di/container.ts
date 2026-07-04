import type { ILogger } from "@/application/ports/ILogger";
import { GetHealthStatusUseCase } from "@/application/use-cases/health/GetHealthStatusUseCase";
import type { IUnitOfWork } from "@/domain/shared/persistence/IUnitOfWork";
import type { IDatabaseHealthRepository } from "@/domain/shared/persistence/IDatabaseHealthRepository";
import { AuthorizationService } from "@/infrastructure/auth/authorization/AuthorizationService";
import { getAppConfig } from "@/infrastructure/config/appConfig";
import { createBoqServices, type BoqServices } from "@/infrastructure/di/boq";
import {
  createFamilyServices,
  type FamilyServices,
} from "@/infrastructure/di/family";
import {
  createProjectServices,
  type ProjectServices,
} from "@/infrastructure/di/project";
import {
  createWorkshopServices,
  type WorkshopServices,
} from "@/infrastructure/di/workshop";
import {
  createPreferencesServices,
  type PreferencesServices,
} from "@/infrastructure/di/preferences";
import {
  createUserAdminServices,
  type UserAdminServices,
} from "@/infrastructure/di/userAdmin";
import { DrizzleDatabaseHealthRepository } from "@/infrastructure/persistence/repositories/DrizzleDatabaseHealthRepository";
import { DrizzleUnitOfWork } from "@/infrastructure/persistence/unitOfWork/DrizzleUnitOfWork";
import { ConsoleLogger } from "@/infrastructure/logging/ConsoleLogger";
import { getSupabaseEnv } from "@/infrastructure/config/env";

export type AppServices = {
  logger: ILogger;
  unitOfWork: IUnitOfWork;
  databaseHealthRepository: IDatabaseHealthRepository;
  authorization: AuthorizationService;
  getHealthStatusUseCase: GetHealthStatusUseCase;
  family: FamilyServices;
  project: ProjectServices;
  boq: BoqServices;
  workshop: WorkshopServices;
  preferences: PreferencesServices;
  userAdmin: UserAdminServices;
};

let appServices: AppServices | undefined;

function isSupabaseConfigured(): boolean {
  try {
    getSupabaseEnv();
    return true;
  } catch {
    return false;
  }
}

export function createAppServices(): AppServices {
  const logger = new ConsoleLogger();
  const databaseHealthRepository = new DrizzleDatabaseHealthRepository();
  const appConfig = getAppConfig();
  const unitOfWork = new DrizzleUnitOfWork();
  const family = createFamilyServices({ unitOfWork });
  const project = createProjectServices();
  const boq = createBoqServices();

  return {
    logger,
    unitOfWork,
    databaseHealthRepository,
    authorization: new AuthorizationService(),
    getHealthStatusUseCase: new GetHealthStatusUseCase({
      databaseHealthRepository,
      isSupabaseConfigured,
      appVersion: appConfig.appVersion,
    }),
    family,
    project,
    boq,
    workshop: createWorkshopServices({
      unitOfWork,
      familyRepository: family.familyRepository,
      boqReadRepository: boq.boqReadRepository,
    }),
    preferences: createPreferencesServices(),
    userAdmin: createUserAdminServices(),
  };
}

export function getAppServices(): AppServices {
  if (!appServices) {
    appServices = createAppServices();
  }

  return appServices;
}

export function resetAppServices(): void {
  appServices = undefined;
}

export {
  resolveRequestContext,
  resolveSessionUser,
} from "@/infrastructure/auth/resolveRequestContext";

export { createCorrelationId } from "@/infrastructure/auth/correlationId";
