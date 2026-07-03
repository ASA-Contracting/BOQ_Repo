import type { ImportBoqResultDto } from "@/application/dto/workshop/categorizationDto";
import type { ImportBoqInput } from "@/application/dto/workshop/importBoqSchema";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import { mapImportRows } from "@/application/use-cases/workshop/mapImportRows";
import { resolveFamilyHint } from "@/application/use-cases/workshop/resolveFamilyHint";
import type { IBoqImportRepository } from "@/domain/boq/repositories/IBoqImportRepository";
import type { IFamilyRepository } from "@/domain/family/repositories/IFamilyRepository";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { IUnitOfWork } from "@/domain/shared/persistence/IUnitOfWork";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { ok, err, type Result } from "@/domain/shared/Result";
import { WorkshopImportNoRowsError } from "@/domain/workshop/errors/WorkshopErrors";
import type { IWorkshopBatchRepository } from "@/domain/workshop/repositories/IWorkshopBatchRepository";
import type { IWorkshopItemRepository } from "@/domain/workshop/repositories/IWorkshopItemRepository";
import { ensureAspNetUserFromContext } from "@/infrastructure/auth/ensureAspNetUser";

export type ImportBoqFromExcelDependencies = {
  boqImportRepository: IBoqImportRepository;
  workshopBatchRepository: IWorkshopBatchRepository;
  workshopItemRepository: IWorkshopItemRepository;
  familyRepository: IFamilyRepository;
  unitOfWork: IUnitOfWork;
};

export class ImportBoqFromExcelUseCase
  implements IUseCase<ImportBoqInput, ImportBoqResultDto, DomainError>
{
  constructor(private readonly deps: ImportBoqFromExcelDependencies) {}

  async execute(
    ctx: RequestContext,
    input: ImportBoqInput,
  ): Promise<Result<ImportBoqResultDto, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const mappedLines = mapImportRows(input);
    if (mappedLines.length === 0) {
      return err(new WorkshopImportNoRowsError());
    }

    await ensureAspNetUserFromContext({
      userId: ctx.userId,
    });

    const families = await this.deps.familyRepository.findAllFlat();
    const lines = mappedLines.map((line) => ({
      rowIndex: line.rowIndex,
      description: line.description,
      unit: line.unit,
      quantity: line.quantity,
      itemNo: line.itemNo,
      isHeader: line.isHeader,
      isMeasurable: line.isMeasurable,
      contextSnapshot: line.contextSnapshot,
      originalFamilyId: resolveFamilyHint(line.familyHint, families),
    }));

    const result = await this.deps.unitOfWork.runInTransaction(async () => {
      const snapshot = await this.deps.boqImportRepository.createImportSnapshot({
        projectName: input.projectName,
        boqName: input.batchName,
        createdBy: ctx.userId,
        lines,
        projectId: input.projectId,
        boqId: input.boqId,
        client: input.client,
      });

      const batch = await this.deps.workshopBatchRepository.createBatch({
        name: input.batchName,
        description: `Imported from ${input.sheetName}`,
        scopeProjectId: snapshot.projectId as number,
        scopeBoqId: snapshot.boqId as number,
        importItemCount: snapshot.items.length,
        createdBy: ctx.userId,
        linkedBoqVersionId: snapshot.boqVersionId as number,
      });

      const importedAt = new Date();
      const familyByRowIndex = new Map(
        lines.map((line) => [line.rowIndex, line.originalFamilyId ?? null]),
      );

      await this.deps.workshopItemRepository.createWorkshopItems(
        snapshot.items.map((item) => ({
          batchId: batch.id,
          sourceBoqItemId: item.id as number,
          sourceBoqId: snapshot.boqId as number,
          sourceProjectId: snapshot.projectId as number,
          originalFamilyId: familyByRowIndex.get(item.rowIndex) ?? null,
          originalDescription: item.description,
          originalUnit: item.unit,
          originalItemNo: item.itemNo,
          originalRowIndex: item.rowIndex,
          originalIsHeader: item.isHeader,
          originalIsMeasurable: item.isMeasurable,
          contextQuantity: item.quantity,
          contextBoqVersionId: snapshot.boqVersionId as number,
          contextSnapshotJson: item.contextSnapshot
            ? JSON.stringify(item.contextSnapshot)
            : null,
          importedAt,
        })),
      );

      return {
        batchId: batch.id as number,
        boqId: Number(snapshot.boqId),
        projectId: Number(snapshot.projectId),
        itemCount: snapshot.items.length,
      };
    });

    return ok(result);
  }
}
