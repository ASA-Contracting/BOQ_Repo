/**
 * Verify category-name pollution is excluded from filter, manage, and tree badges.
 */
import { getClassificationState } from "../application/classification/get-classification-state.ts";
import { collectAvailableTags, buildCategoryTreeRoot } from "../lib/category-tree-builder.ts";
import {
  buildCatalogTagContextFromState,
  filterCatalogTagRecords,
  isCatalogTagName,
  isSelfCategoryTag,
} from "../lib/category-tag-display.ts";
import { getDb, closeDb } from "../infrastructure/persistence/db.ts";
import { listSchemas } from "../infrastructure/persistence/repositories/classification/repository.ts";

const db = getDb();
const schemaId = (await listSchemas(db))[0].id;
const state = await getClassificationState(db, schemaId);
const ctx = buildCatalogTagContextFromState(state, schemaId);
const availableTags = collectAvailableTags(state, schemaId);
const catalogTags = filterCatalogTagRecords(state.tags, state, schemaId);

const badFilterTags = availableTags.filter((tag) => {
  const key = tag.name.toLowerCase();
  const nonSelfCount = ctx.nonSelfCountByTagLower.get(key) ?? 0;
  return !isCatalogTagName(
    tag.name,
    ctx.categoryNamesLower,
    nonSelfCount,
    ctx.rootCategoryNamesLower,
    ctx.categoryTokens,
  );
});

const badCatalogTags = catalogTags.filter((tag) => {
  const key = tag.name.toLowerCase();
  const nonSelfCount = ctx.nonSelfCountByTagLower.get(key) ?? 0;
  return !isCatalogTagName(
    tag.name,
    ctx.categoryNamesLower,
    nonSelfCount,
    ctx.rootCategoryNamesLower,
    ctx.categoryTokens,
  );
});

console.log("state.tags total:", state.tags.length);
console.log("catalogTags:", catalogTags.length, catalogTags.map((t) => t.name));
console.log("availableTags:", availableTags.length, availableTags.map((t) => t.name));
console.log("badFilterTags:", badFilterTags);
console.log("badCatalogTags:", badCatalogTags);

if (badFilterTags.length || badCatalogTags.length) {
  console.error("FAIL: category names leaked into tag UI");
  process.exit(1);
}

if (catalogTags.some((tag) => ["1 Gang", "1 kg", "1 Slot", "Air Cooled Chiller"].includes(tag.name))) {
  console.error("FAIL: known category-name tags still in catalog");
  process.exit(1);
}

if (availableTags.some((tag) => ["1 Gang", "1 kg", "1 Slot", "Air Cooled Chiller"].includes(tag.name))) {
  console.error("FAIL: known category-name tags still in filter");
  process.exit(1);
}

const root = buildCategoryTreeRoot({
  state,
  schemaId,
  chainSteps: [],
  search: "",
  filter: "all",
  tagFilterNames: new Set(),
  showParentContext: true,
  expandedIds: new Set(state.materials.map((m) => m.id)),
  selectedId: null,
  selectedIds: new Set(),
  inline: null,
});

const selfBadges = [];
function walk(node) {
  if (node.id !== "root" && node.tags?.length) {
    for (const badge of node.tags) {
      if (badge.parentContext || badge.overflow) continue;
      const key = badge.label.toLowerCase();
      const nonSelfCount = ctx.nonSelfCountByTagLower.get(key) ?? 0;
      if (
        isSelfCategoryTag(badge.label, node.label) ||
        !isCatalogTagName(
          badge.label,
          ctx.categoryNamesLower,
          nonSelfCount,
          ctx.rootCategoryNamesLower,
          ctx.categoryTokens,
        )
      ) {
        selfBadges.push({ id: node.id, label: node.label, tag: badge.label });
      }
    }
  }
  node.children.forEach(walk);
}
walk(root);

if (selfBadges.length) {
  console.error("FAIL: invalid tags on tree badges", selfBadges.slice(0, 10));
  process.exit(1);
}

console.log("PASS: catalog tags reconstructed correctly");
await closeDb();
