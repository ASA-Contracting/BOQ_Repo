/**
 * Parses spreadsheet quantity cells into a numeric string suitable for numeric(18,2),
 * or null when the value is not a quantity (e.g. column header text "QTY").
 */
export function normalizeImportQuantity(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const withoutCommas = trimmed.replace(/,/g, '');
  const compact = withoutCommas.replace(/\s+/g, '');
  if (/^-?\d+(?:\.\d+)?$/.test(compact)) {
    return compact;
  }

  const leadingNumber = withoutCommas.match(/^-?\d+(?:\.\d+)?/);
  if (leadingNumber) {
    return leadingNumber[0];
  }

  return null;
}
