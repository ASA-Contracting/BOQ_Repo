import * as XLSX from 'xlsx';

export function parseSingleColumnText(text: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();

  for (const line of text.split(/\r?\n/)) {
    for (const cell of line.split('\t')) {
      const name = cell.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      names.push(name);
    }
  }

  return names;
}

export function parseSingleColumnWorkbookRows(rows: string[][]): string[] {
  const names: string[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const name = String(row[0] ?? '').trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }

  return names;
}

export async function parseSingleColumnFile(file: File): Promise<string[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv' || extension === 'txt') {
    const text = await file.text();
    return parseSingleColumnText(text);
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 }) as string[][];
  return parseSingleColumnWorkbookRows(rows);
}
