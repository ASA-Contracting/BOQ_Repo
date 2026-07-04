type SettingIdentity = {
  id?: number | null;
  name?: string | null;
  customLabel?: string | null;
};

export type BoqSettingsConflict = {
  field: "name" | "customLabel";
  message: string;
};

function normalizeLookupText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function sameItem(left: unknown, right: unknown): boolean {
  if (left == null || right == null) return false;
  return Number(left) === Number(right);
}

export function findBoqSettingsConflict(
  items: SettingIdentity[],
  draft: SettingIdentity,
): BoqSettingsConflict | null {
  const draftName = normalizeLookupText(draft.name);
  const draftCustomLabel = normalizeLookupText(draft.customLabel);

  for (const item of items ?? []) {
    if (sameItem(item?.id, draft.id)) continue;

    const otherName = normalizeLookupText(item?.name);
    const otherCustomLabel = normalizeLookupText(item?.customLabel);

    if (draftName && otherName && draftName === otherName) {
      return { field: "name", message: "Name already exists" };
    }
    if (draftName && otherCustomLabel && draftName === otherCustomLabel) {
      return { field: "name", message: "Name conflicts with an existing custom label" };
    }
    if (!draftCustomLabel) continue;
    if (otherName && draftCustomLabel === otherName) {
      return { field: "customLabel", message: "Custom label conflicts with an existing name" };
    }
    if (otherCustomLabel && draftCustomLabel === otherCustomLabel) {
      return { field: "customLabel", message: "Custom label already exists" };
    }
  }

  return null;
}
