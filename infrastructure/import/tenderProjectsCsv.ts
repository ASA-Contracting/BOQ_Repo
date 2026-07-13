/** Parse one CSV record line respecting quoted fields. */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  fields.push(current);
  return fields;
}

export type TenderProjectCsvRow = {
  abrdProjectId: number;
  name: string;
  owner: string;
  ownerType: string | null;
  tenderStatus: string | null;
  country: string | null;
  assignedTo: string | null;
};

export function parseTenderProjectsCsv(content: string): TenderProjectCsvRow[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) {
    return [];
  }

  const rows: TenderProjectCsvRow[] = [];

  for (let index = 1; index < lines.length; index += 1) {
    const fields = parseCsvLine(lines[index] ?? "");
    if (fields.length < 7) {
      continue;
    }

    const abrdProjectId = Number(fields[0]?.trim());
    if (!Number.isFinite(abrdProjectId) || abrdProjectId <= 0) {
      continue;
    }

    const ownerTypeRaw = fields[3]?.trim() ?? "";
    rows.push({
      abrdProjectId,
      name: fields[1]?.trim() ?? "",
      owner: fields[2]?.trim() ?? "",
      ownerType: ownerTypeRaw && ownerTypeRaw !== "-" ? ownerTypeRaw : null,
      tenderStatus: fields[4]?.trim() || null,
      country: fields[5]?.trim() || null,
      assignedTo: fields[6]?.trim() || null,
    });
  }

  return rows;
}
