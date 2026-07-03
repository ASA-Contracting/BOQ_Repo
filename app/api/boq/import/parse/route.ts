import { NextRequest } from "next/server";

import type { ExcelPreviewDto } from "@/application/dto/workshop/categorizationDto";
import { SheetJsExcelParser } from "@/infrastructure/import/SheetJsExcelParser";
import { apiError, apiSuccess, requireAuthUserId } from "@/infrastructure/auth/api-auth";

export async function POST(request: NextRequest) {
  const userId = await requireAuthUserId();
  if (!userId) {
    return apiError("Unauthorized", 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return apiError("Excel file is required.", 400);
    }

    const sheetName = formData.get("sheetName")?.toString().trim() || undefined;
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = new SheetJsExcelParser().parse(buffer, sheetName);

    const data: ExcelPreviewDto = {
      sheetName: parsed.sheetName,
      sheetNames: parsed.sheetNames,
      headers: parsed.headers,
      rawHeaders: parsed.rawHeaders,
      columnLetters: parsed.columnLetters,
      previewRows: parsed.previewRows,
      allRows: parsed.allRows,
      totalRowCount: parsed.totalRowCount,
    };

    return apiSuccess(data, "Excel file parsed");
  } catch (error) {
    console.error(error);
    return apiError(
      error instanceof Error ? error.message : "Failed to parse Excel file",
      500,
    );
  }
}
