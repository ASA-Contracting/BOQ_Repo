import type { ExcelPreviewDto } from "@/application/dto/workshop/categorizationDto";
import type { ParseExcelInput } from "@/application/dto/workshop/importBoqSchema";
import type { IExcelParser } from "@/application/ports/IExcelParser";
import type { IUseCase } from "@/application/use-cases/IUseCase";
import { requireAuthenticatedUser } from "@/application/use-cases/family/authorizeFamilyAdmin";
import type { DomainError } from "@/domain/shared/errors/DomainError";
import type { RequestContext } from "@/domain/shared/RequestContext";
import { ok, type Result } from "@/domain/shared/Result";

export type ParseExcelUploadDependencies = {
  excelParser: IExcelParser;
};

export class ParseExcelUploadUseCase
  implements IUseCase<ParseExcelInput, ExcelPreviewDto, DomainError>
{
  constructor(private readonly deps: ParseExcelUploadDependencies) {}

  async execute(
    ctx: RequestContext,
    input: ParseExcelInput,
  ): Promise<Result<ExcelPreviewDto, DomainError>> {
    const auth = requireAuthenticatedUser(ctx);
    if (!auth.ok) {
      return auth;
    }

    const buffer = Buffer.from(input.fileBase64, "base64");
    const parsed = this.deps.excelParser.parse(buffer, input.sheetName);

    return ok({
      sheetName: parsed.sheetName,
      sheetNames: parsed.sheetNames,
      headers: parsed.headers,
      rawHeaders: parsed.rawHeaders,
      columnLetters: parsed.columnLetters,
      previewRows: parsed.previewRows,
      allRows: parsed.allRows,
      totalRowCount: parsed.totalRowCount,
    });
  }
}
