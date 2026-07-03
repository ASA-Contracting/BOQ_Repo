import type { Family } from "@/domain/family/Family";
import { toFamilyId, type FamilyId } from "@/domain/family/ids";

export function resolveFamilyHint(
  hint: string | null,
  families: Family[],
): FamilyId | null {
  if (!hint) {
    return null;
  }

  const trimmed = hint.trim();
  if (!trimmed) {
    return null;
  }

  const asNumber = Number(trimmed);
  if (Number.isInteger(asNumber) && asNumber > 0) {
    const byId = families.find((family) => (family.id as number) === asNumber);
    if (byId) {
      return toFamilyId(byId.id);
    }
  }

  const normalized = trimmed.toLowerCase();
  const byName = families.find(
    (family) => family.name.trim().toLowerCase() === normalized,
  );
  if (byName) {
    return toFamilyId(byName.id);
  }

  const byCode = families.find(
    (family) => family.referenceCode?.trim().toLowerCase() === normalized,
  );
  if (byCode) {
    return toFamilyId(byCode.id);
  }

  return null;
}
