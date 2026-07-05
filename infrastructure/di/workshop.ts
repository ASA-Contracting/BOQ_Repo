import { ApproveBoqVersionUseCase } from "@/application/use-cases/workshop/ApproveBoqVersionUseCase";
import { GetCategorizationBatchContextUseCase } from "@/application/use-cases/workshop/GetCategorizationBatchContextUseCase";
import { GetWorkshopItemForReviewUseCase } from "@/application/use-cases/workshop/GetWorkshopItemForReviewUseCase";
import {
  GetNextWorkshopItemUseCase,
  GetPreviousWorkshopItemUseCase,
} from "@/application/use-cases/workshop/GetNextWorkshopItemUseCase";
import { GetNextWorkshopItemInCampaignUseCase } from "@/application/use-cases/workshop/GetNextWorkshopItemInCampaignUseCase";
import { BulkApproveSimilarUseCase } from "@/application/use-cases/workshop/BulkApproveSimilarUseCase";
import { CreateImportCampaignUseCase } from "@/application/use-cases/workshop/CreateImportCampaignUseCase";
import {
  GetImportCampaignDetailUseCase,
  ListImportCampaignsUseCase,
} from "@/application/use-cases/workshop/ListImportCampaignsUseCase";
import { ImportBoqFromExcelUseCase } from "@/application/use-cases/workshop/ImportBoqFromExcelUseCase";
import { ListPriorClassificationDecisionsUseCase } from "@/application/use-cases/workshop/ListPriorClassificationDecisionsUseCase";
import { ListRecentWorkshopBatchesUseCase } from "@/application/use-cases/workshop/ListRecentWorkshopBatchesUseCase";
import { ListSimilarWorkshopItemsUseCase } from "@/application/use-cases/workshop/ListSimilarWorkshopItemsUseCase";
import { ParseExcelUploadUseCase } from "@/application/use-cases/workshop/ParseExcelUploadUseCase";
import { ProcessImportJobsUseCase } from "@/application/use-cases/workshop/ProcessImportJobsUseCase";
import { PublishWorkshopBatchUseCase } from "@/application/use-cases/workshop/PublishWorkshopBatchUseCase";
import { SaveWorkshopItemClassificationUseCase } from "@/application/use-cases/workshop/SaveWorkshopItemClassificationUseCase";
import { SkipWorkshopItemUseCase } from "@/application/use-cases/workshop/SkipWorkshopItemUseCase";
import { ListBoqNotificationsUseCase } from "@/application/use-cases/workshop/ListBoqNotificationsUseCase";
import { ReturnBoqVersionToEngineerUseCase } from "@/application/use-cases/workshop/ReturnBoqVersionToEngineerUseCase";
import { SubmitEngineerReviewUseCase } from "@/application/use-cases/workshop/SubmitEngineerReviewUseCase";
import { UploadCampaignZipUseCase } from "@/application/use-cases/workshop/UploadCampaignZipUseCase";
import type { IBoqImportRepository } from "@/domain/boq/repositories/IBoqImportRepository";
import type { IBoqReadRepository } from "@/application/ports/IBoqReadRepository";
import type { IFamilyRepository } from "@/domain/family/repositories/IFamilyRepository";
import type { IUnitOfWork } from "@/domain/shared/persistence/IUnitOfWork";
import type { IImportCampaignRepository } from "@/domain/workshop/repositories/IImportCampaignRepository";
import type { IWorkshopBatchRepository } from "@/domain/workshop/repositories/IWorkshopBatchRepository";
import type { IWorkshopExportRepository } from "@/domain/workshop/repositories/IWorkshopExportRepository";
import type {
  IWorkshopItemRepository,
  IWorkshopReviewRepository,
} from "@/domain/workshop/repositories/IWorkshopItemRepository";
import type { IExcelParser } from "@/application/ports/IExcelParser";
import { DrizzleBoqImportRepository } from "@/infrastructure/persistence/boq/DrizzleBoqImportRepository";
import { DrizzleBoqVersionRepository } from "@/infrastructure/persistence/boq/DrizzleBoqVersionRepository";
import { DrizzleImportCampaignRepository } from "@/infrastructure/persistence/workshop/DrizzleImportCampaignRepository";
import { DrizzleWorkshopBatchRepository } from "@/infrastructure/persistence/workshop/DrizzleWorkshopBatchRepository";
import { DrizzleWorkshopExportRepository } from "@/infrastructure/persistence/workshop/DrizzleWorkshopExportRepository";
import {
  DrizzleWorkshopItemRepository,
  DrizzleWorkshopReviewRepository,
} from "@/infrastructure/persistence/workshop/DrizzleWorkshopItemRepository";
import { SheetJsExcelParser } from "@/infrastructure/import/SheetJsExcelParser";
import { ImportJobWorker } from "@/infrastructure/jobs/ImportJobWorker";

export type WorkshopServices = {
  workshopBatchRepository: IWorkshopBatchRepository;
  workshopItemRepository: IWorkshopItemRepository;
  workshopReviewRepository: IWorkshopReviewRepository;
  workshopExportRepository: IWorkshopExportRepository;
  importCampaignRepository: IImportCampaignRepository;
  boqImportRepository: IBoqImportRepository;
  excelParser: IExcelParser;
  parseExcelUploadUseCase: ParseExcelUploadUseCase;
  importBoqFromExcelUseCase: ImportBoqFromExcelUseCase;
  listRecentWorkshopBatchesUseCase: ListRecentWorkshopBatchesUseCase;
  getCategorizationBatchContextUseCase: GetCategorizationBatchContextUseCase;
  getWorkshopItemForReviewUseCase: GetWorkshopItemForReviewUseCase;
  getNextWorkshopItemUseCase: GetNextWorkshopItemUseCase;
  getPreviousWorkshopItemUseCase: GetPreviousWorkshopItemUseCase;
  getNextWorkshopItemInCampaignUseCase: GetNextWorkshopItemInCampaignUseCase;
  saveWorkshopItemClassificationUseCase: SaveWorkshopItemClassificationUseCase;
  skipWorkshopItemUseCase: SkipWorkshopItemUseCase;
  listSimilarWorkshopItemsUseCase: ListSimilarWorkshopItemsUseCase;
  listPriorClassificationDecisionsUseCase: ListPriorClassificationDecisionsUseCase;
  publishWorkshopBatchUseCase: PublishWorkshopBatchUseCase;
  bulkApproveSimilarUseCase: BulkApproveSimilarUseCase;
  createImportCampaignUseCase: CreateImportCampaignUseCase;
  uploadCampaignZipUseCase: UploadCampaignZipUseCase;
  processImportJobsUseCase: ProcessImportJobsUseCase;
  listImportCampaignsUseCase: ListImportCampaignsUseCase;
  getImportCampaignDetailUseCase: GetImportCampaignDetailUseCase;
  submitEngineerReviewUseCase: SubmitEngineerReviewUseCase;
  approveBoqVersionUseCase: ApproveBoqVersionUseCase;
  returnBoqVersionToEngineerUseCase: ReturnBoqVersionToEngineerUseCase;
  listBoqNotificationsUseCase: ListBoqNotificationsUseCase;
  importJobWorker: ImportJobWorker;
};

export type CreateWorkshopServicesInput = {
  unitOfWork: IUnitOfWork;
  familyRepository: IFamilyRepository;
  boqReadRepository: IBoqReadRepository;
};

export function createWorkshopServices(
  deps: CreateWorkshopServicesInput,
): WorkshopServices {
  const workshopBatchRepository = new DrizzleWorkshopBatchRepository();
  const workshopItemRepository = new DrizzleWorkshopItemRepository();
  const workshopReviewRepository = new DrizzleWorkshopReviewRepository();
  const workshopExportRepository = new DrizzleWorkshopExportRepository();
  const importCampaignRepository = new DrizzleImportCampaignRepository();
  const boqImportRepository = new DrizzleBoqImportRepository();
  const boqVersionRepository = new DrizzleBoqVersionRepository();
  const excelParser = new SheetJsExcelParser();

  const importBoqFromExcelUseCase = new ImportBoqFromExcelUseCase({
    boqImportRepository,
    workshopBatchRepository,
    workshopItemRepository,
    familyRepository: deps.familyRepository,
    unitOfWork: deps.unitOfWork,
  });

  const processImportJobsUseCase = new ProcessImportJobsUseCase({
    importCampaignRepository,
    excelParser,
    importBoqFromExcelUseCase,
  });

  return {
    workshopBatchRepository,
    workshopItemRepository,
    workshopReviewRepository,
    workshopExportRepository,
    importCampaignRepository,
    boqImportRepository,
    excelParser,
    parseExcelUploadUseCase: new ParseExcelUploadUseCase({ excelParser }),
    importBoqFromExcelUseCase,
    listRecentWorkshopBatchesUseCase: new ListRecentWorkshopBatchesUseCase({
      workshopBatchRepository,
    }),
    getCategorizationBatchContextUseCase: new GetCategorizationBatchContextUseCase({
      workshopBatchRepository,
      workshopItemRepository,
      boqVersionRepository,
    }),
    getWorkshopItemForReviewUseCase: new GetWorkshopItemForReviewUseCase({
      workshopBatchRepository,
      workshopItemRepository,
      workshopReviewRepository,
      familyRepository: deps.familyRepository,
    }),
    getNextWorkshopItemUseCase: new GetNextWorkshopItemUseCase({
      workshopBatchRepository,
      workshopItemRepository,
    }),
    getPreviousWorkshopItemUseCase: new GetPreviousWorkshopItemUseCase({
      workshopBatchRepository,
      workshopItemRepository,
    }),
    getNextWorkshopItemInCampaignUseCase: new GetNextWorkshopItemInCampaignUseCase({
      importCampaignRepository,
      workshopItemRepository,
    }),
    saveWorkshopItemClassificationUseCase: new SaveWorkshopItemClassificationUseCase({
      workshopBatchRepository,
      workshopItemRepository,
      workshopReviewRepository,
      unitOfWork: deps.unitOfWork,
    }),
    skipWorkshopItemUseCase: new SkipWorkshopItemUseCase({
      workshopBatchRepository,
      workshopItemRepository,
      workshopReviewRepository,
      unitOfWork: deps.unitOfWork,
    }),
    listSimilarWorkshopItemsUseCase: new ListSimilarWorkshopItemsUseCase({
      workshopItemRepository,
      familyRepository: deps.familyRepository,
    }),
    listPriorClassificationDecisionsUseCase:
      new ListPriorClassificationDecisionsUseCase({
        workshopReviewRepository,
      }),
    publishWorkshopBatchUseCase: new PublishWorkshopBatchUseCase({
      workshopBatchRepository,
      workshopItemRepository,
      workshopExportRepository,
      boqReadRepository: deps.boqReadRepository,
      unitOfWork: deps.unitOfWork,
    }),
    bulkApproveSimilarUseCase: new BulkApproveSimilarUseCase({
      workshopBatchRepository,
      workshopItemRepository,
      workshopReviewRepository,
      unitOfWork: deps.unitOfWork,
    }),
    createImportCampaignUseCase: new CreateImportCampaignUseCase({
      importCampaignRepository,
    }),
    uploadCampaignZipUseCase: new UploadCampaignZipUseCase({
      importCampaignRepository,
    }),
    processImportJobsUseCase,
    listImportCampaignsUseCase: new ListImportCampaignsUseCase({
      importCampaignRepository,
    }),
    getImportCampaignDetailUseCase: new GetImportCampaignDetailUseCase({
      importCampaignRepository,
    }),
    submitEngineerReviewUseCase: new SubmitEngineerReviewUseCase({
      workshopBatchRepository,
      workshopItemRepository,
      boqVersionRepository,
      unitOfWork: deps.unitOfWork,
    }),
    approveBoqVersionUseCase: new ApproveBoqVersionUseCase({
      workshopBatchRepository,
      boqVersionRepository,
      unitOfWork: deps.unitOfWork,
    }),
    returnBoqVersionToEngineerUseCase: new ReturnBoqVersionToEngineerUseCase({
      workshopBatchRepository,
      boqVersionRepository,
      unitOfWork: deps.unitOfWork,
    }),
    listBoqNotificationsUseCase: new ListBoqNotificationsUseCase({
      workshopBatchRepository,
    }),
    importJobWorker: new ImportJobWorker({ processImportJobsUseCase }),
  };
}
