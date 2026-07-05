export type CategoryBulkRow = {
  path: string[];
  tags: string[];
};

export type CategoryBulkPreview = {
  rows: CategoryBulkRow[];
  createCount: number;
  existingCount: number;
  tagCount: number;
  errors: string[];
  warnings: string[];
};

export function parseBulkLine(line: string): CategoryBulkRow {
  const path: string[] = [];
  const tags: string[] = [];
  for (const rawPart of line.split(/\/|>|\||,|\t/)) {
    const part = rawPart.trim();
    if (!part) {
      continue;
    }

    if (part.startsWith('#')) {
      const tag = part.replace(/^#+/, '').trim();
      if (tag) {
        tags.push(tag);
      }
      continue;
    }

    const tagMatches = Array.from(part.matchAll(/#([^\s#,|/>]+)/g)).map((match) => match[1]);
    tagMatches.forEach((tag) => tags.push(tag.trim()));
    const name = part.replace(/#([^\s#,|/>]+)/g, '').trim();
    if (name) {
      path.push(name);
    }
  }

  return { path, tags };
}

export function parseBulkText(text: string): CategoryBulkRow[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => !!line)
    .map((line) => parseBulkLine(line))
    .filter((row) => row.path.length > 0);
}

export function buildBulkPreview(
  text: string,
  existingPaths: Iterable<string>
): CategoryBulkPreview {
  const parsedRows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => !!line)
    .map((line) => parseBulkLine(line));
  const rows = parsedRows.filter((row) => row.path.length > 0);
  const errors: string[] = [];
  const warnings: string[] = [];
  const existingPathSet = new Set(
    Array.from(existingPaths).map((path) => path.trim().toLowerCase())
  );
  const seen = new Set<string>();
  let createCount = 0;
  let existingCount = 0;
  const tagNames = new Set<string>();
  parsedRows.forEach((row) => row.tags.forEach((tag) => tagNames.add(tag.toLowerCase())));

  rows.forEach((row, index) => {
    if (!row.path.length) {
      errors.push(`Line ${index + 1}: empty category path.`);
      return;
    }
    const normalizedPath = row.path.join(' / ').toLowerCase();
    if (seen.has(normalizedPath)) {
      errors.push(`Line ${index + 1}: duplicate category path.`);
      return;
    }
    seen.add(normalizedPath);
    if (existingPathSet.has(normalizedPath)) {
      existingCount += 1;
    } else {
      createCount += 1;
    }
  });

  return { rows, createCount, existingCount, tagCount: tagNames.size, errors, warnings };
}

import { MAX_CLASSIFICATION_SCHEMA_LEVELS } from '@/domain/classification/constants';

export function buildImportTemplateCsv(
  maxLevels = MAX_CLASSIFICATION_SCHEMA_LEVELS,
): string {
  const headers = [
    ...Array.from({ length: maxLevels }, (_item, index) => `Level ${index + 1}`),
    'Tags',
  ];
  const sample = ['HVAC', 'Air Handling Units', 'Chilled Water', '#hvac'];
  return `${headers.join(',')}\n${sample.join(',')}\n`;
}
