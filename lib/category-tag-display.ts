/**
 * Tags vs category names in the classification tree.
 *
 * Imports often create tag records whose names match category nodes (e.g. "1 Gang",
 * "Air Cooled Chiller"). Those are categories, not filterable/manageable tags.
 *
 * A catalog tag is valid when:
 * - it does not match any active category name (literal or normalized token), and
 *   has at least one non-self assignment; OR
 * - it matches a category name but is widely assigned across nodes (discipline
 *   labels like HVAC, Electrical, BMS / Controls).
 */
import type { ClassificationStateDto } from '@/application/classification/dto';
import { normalizeToken } from '@/domain/classification/classification-policy';
import type { TagRecord } from '@/lib/tag-colors';

/** Minimum non-self assignments for a category-name tag to count as a discipline label. */
export const MIN_CROSS_CATEGORY_TAG_ASSIGNMENTS = 2;

export function normalizeTagLabel(raw: string): string {
  return String(raw ?? '')
    .trim()
    .replace(/^#+/, '');
}

export function isSelfCategoryTag(tagName: string, categoryName: string): boolean {
  const tag = normalizeTagLabel(tagName).toLowerCase();
  const name = normalizeTagLabel(categoryName).toLowerCase();
  return !!tag && !!name && tag === name;
}

export function normalizeTagNames(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    const tag = normalizeTagLabel(raw);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(tag);
  }
  return result;
}

export function buildActiveNodeNameById(
  materials: Array<{ id: number; name: string; schemaId: number; isActive: boolean }>,
  schemaId: number,
): Map<number, string> {
  const map = new Map<number, string>();
  for (const material of materials) {
    if (material.schemaId !== schemaId || !material.isActive) continue;
    map.set(material.id, material.name);
  }
  return map;
}

export function buildCategoryNamesLower(
  materials: Array<{ id: number; name: string; schemaId: number; isActive: boolean }>,
  schemaId: number,
): Set<string> {
  const names = new Set<string>();
  for (const material of materials) {
    if (material.schemaId !== schemaId || !material.isActive) continue;
    const key = normalizeTagLabel(material.name).toLowerCase();
    if (key) names.add(key);
  }
  return names;
}

export function buildRootCategoryNamesLower(
  materials: Array<{ id: number; name: string; schemaId: number; isActive: boolean; parentId?: number | null }>,
  schemaId: number,
): Set<string> {
  const names = new Set<string>();
  for (const material of materials) {
    if (material.schemaId !== schemaId || !material.isActive || material.parentId != null) continue;
    const key = normalizeTagLabel(material.name).toLowerCase();
    if (key) names.add(key);
  }
  return names;
}

export function buildCategoryTokens(
  materials: Array<{ id: number; name: string; schemaId: number; isActive: boolean }>,
  schemaId: number,
): Set<string> {
  const tokens = new Set<string>();
  for (const material of materials) {
    if (material.schemaId !== schemaId || !material.isActive) continue;
    const token = normalizeToken(material.name);
    if (token) tokens.add(token);
  }
  return tokens;
}

export function matchesCategoryName(
  tagName: string,
  categoryNamesLower: ReadonlySet<string>,
  categoryTokens: ReadonlySet<string>,
): boolean {
  const key = normalizeTagLabel(tagName).toLowerCase();
  const token = normalizeToken(tagName);
  return (!!key && categoryNamesLower.has(key)) || (!!token && categoryTokens.has(token));
}

export function isCategoryNodeName(
  tagName: string,
  categoryNamesLower: ReadonlySet<string>,
): boolean {
  const key = normalizeTagLabel(tagName).toLowerCase();
  return !!key && categoryNamesLower.has(key);
}

export function countNonSelfAssignmentsForTag(
  tagName: string,
  materialTags: Array<{ materialNodeId: number; tagName: string }>,
  nodeNameById: ReadonlyMap<number, string>,
): number {
  const key = normalizeTagLabel(tagName).toLowerCase();
  let count = 0;
  for (const link of materialTags) {
    if (normalizeTagLabel(link.tagName).toLowerCase() !== key) continue;
    const nodeName = nodeNameById.get(link.materialNodeId);
    if (!nodeName) continue;
    if (isSelfCategoryTag(link.tagName, nodeName)) continue;
    count += 1;
  }
  return count;
}

export function isCatalogTagName(
  tagName: string,
  categoryNamesLower: ReadonlySet<string>,
  nonSelfAssignmentCount: number,
  rootCategoryNamesLower?: ReadonlySet<string>,
  categoryTokens?: ReadonlySet<string>,
): boolean {
  const matchesCategory = categoryTokens
    ? matchesCategoryName(tagName, categoryNamesLower, categoryTokens)
    : categoryNamesLower.has(normalizeTagLabel(tagName).toLowerCase());

  if (matchesCategory) {
    return nonSelfAssignmentCount >= MIN_CROSS_CATEGORY_TAG_ASSIGNMENTS;
  }
  return nonSelfAssignmentCount >= 1;
}

export type CatalogTagContext = {
  categoryNamesLower: Set<string>;
  categoryTokens: Set<string>;
  rootCategoryNamesLower: Set<string>;
  nodeNameById: Map<number, string>;
  nonSelfCountByTagLower: Map<string, number>;
};

export function buildCatalogTagContext(
  materials: Array<{ id: number; name: string; schemaId: number; isActive: boolean; parentId?: number | null }>,
  materialTags: Array<{ materialNodeId: number; tagName: string }>,
  schemaId: number,
): CatalogTagContext {
  const categoryNamesLower = buildCategoryNamesLower(materials, schemaId);
  const categoryTokens = buildCategoryTokens(materials, schemaId);
  const rootCategoryNamesLower = buildRootCategoryNamesLower(materials, schemaId);
  const nodeNameById = buildActiveNodeNameById(materials, schemaId);
  const nonSelfCountByTagLower = new Map<string, number>();

  for (const link of materialTags) {
    const nodeName = nodeNameById.get(link.materialNodeId);
    if (!nodeName || isSelfCategoryTag(link.tagName, nodeName)) continue;
    const key = normalizeTagLabel(link.tagName).toLowerCase();
    if (!key) continue;
    nonSelfCountByTagLower.set(key, (nonSelfCountByTagLower.get(key) ?? 0) + 1);
  }

  return {
    categoryNamesLower,
    categoryTokens,
    rootCategoryNamesLower,
    nodeNameById,
    nonSelfCountByTagLower,
  };
}

export function buildCatalogTagContextFromState(
  state: ClassificationStateDto,
  schemaId: number,
): CatalogTagContext {
  return buildCatalogTagContext(state.materials, state.materialTags, schemaId);
}

export function isCatalogTagRecord(
  tag: Pick<TagRecord, 'name'>,
  ctx: CatalogTagContext,
): boolean {
  const key = normalizeTagLabel(tag.name).toLowerCase();
  const nonSelfCount = ctx.nonSelfCountByTagLower.get(key) ?? 0;
  return isCatalogTagName(
    tag.name,
    ctx.categoryNamesLower,
    nonSelfCount,
    ctx.rootCategoryNamesLower,
    ctx.categoryTokens,
  );
}

export function filterCatalogTagRecords(
  tags: TagRecord[],
  state: ClassificationStateDto,
  schemaId: number,
): TagRecord[] {
  const ctx = buildCatalogTagContextFromState(state, schemaId);
  return tags.filter((tag) => isCatalogTagRecord(tag, ctx));
}

export function isAssignableMaterialTag(
  tagName: string,
  materialNodeId: number,
  nodeNameById: ReadonlyMap<number, string>,
  categoryNamesLower?: ReadonlySet<string>,
  nonSelfCountByTagLower?: ReadonlyMap<string, number>,
  rootCategoryNamesLower?: ReadonlySet<string>,
  categoryTokens?: ReadonlySet<string>,
): boolean {
  const nodeName = nodeNameById.get(materialNodeId);
  if (!nodeName) return false;
  if (isSelfCategoryTag(tagName, nodeName)) return false;
  if (categoryNamesLower && nonSelfCountByTagLower) {
    const key = normalizeTagLabel(tagName).toLowerCase();
    const nonSelfCount = nonSelfCountByTagLower.get(key) ?? 0;
    return isCatalogTagName(
      tagName,
      categoryNamesLower,
      nonSelfCount,
      rootCategoryNamesLower,
      categoryTokens,
    );
  }
  return true;
}

export function filterDirectTagsForNode(tags: string[], nodeName: string): string[] {
  return normalizeTagNames(tags).filter((tag) => !isSelfCategoryTag(tag, nodeName));
}

export function filterInheritedTagsForNode(
  rows: Array<{ tag: string; sourceLabel: string }>,
  nodeName: string,
  categoryNamesLower?: ReadonlySet<string>,
  nonSelfCountByTagLower?: ReadonlyMap<string, number>,
  rootCategoryNamesLower?: ReadonlySet<string>,
  categoryTokens?: ReadonlySet<string>,
): Array<{ tag: string; sourceLabel: string }> {
  const seen = new Set<string>();
  const result: Array<{ tag: string; sourceLabel: string }> = [];
  for (const row of rows) {
    const tag = normalizeTagLabel(row.tag);
    if (!tag) continue;
    if (isSelfCategoryTag(tag, nodeName)) continue;
    if (isSelfCategoryTag(tag, row.sourceLabel)) continue;
    if (categoryNamesLower && nonSelfCountByTagLower) {
      const key = tag.toLowerCase();
      const nonSelfCount = nonSelfCountByTagLower.get(key) ?? 0;
      if (
        !isCatalogTagName(
          tag,
          categoryNamesLower,
          nonSelfCount,
          rootCategoryNamesLower,
          categoryTokens,
        )
      ) {
        continue;
      }
    }
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ tag, sourceLabel: row.sourceLabel });
  }
  return result;
}
