import JSZip from "jszip";

export type ExtractedExcelFile = {
  fileName: string;
  base64: string;
};

const EXCEL_EXTENSIONS = [".xlsx", ".xls", ".xlsm"];

function isExcelFileName(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return EXCEL_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

export async function extractExcelFilesFromZip(zipBase64: string): Promise<ExtractedExcelFile[]> {
  const buffer = Buffer.from(zipBase64, "base64");
  const zip = await JSZip.loadAsync(buffer);
  const files: ExtractedExcelFile[] = [];

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) {
      continue;
    }

    const fileName = path.split("/").pop() ?? path;
    if (!isExcelFileName(fileName)) {
      continue;
    }

    const content = await entry.async("nodebuffer");
    files.push({
      fileName,
      base64: content.toString("base64"),
    });
  }

  return files.sort((a, b) => a.fileName.localeCompare(b.fileName));
}
