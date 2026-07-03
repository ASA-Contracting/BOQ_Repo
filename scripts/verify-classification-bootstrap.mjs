import { getClassificationState } from "../application/classification/get-classification-state.ts";
import { collectAvailableTags, buildCategoryTreeRoot } from "../lib/category-tree-builder.ts";
import { getDb, closeDb } from "../infrastructure/persistence/db.ts";
import { listSchemas } from "../infrastructure/persistence/repositories/classification/repository.ts";

const db = getDb();
const schemas = await listSchemas(db);
console.log("schemas:", schemas.map((s) => ({ id: s.id, name: s.name })));

if (!schemas.length) {
  console.error("FAIL: no schemas — run npm run db:seed:classification");
  process.exit(1);
}

const schemaId = schemas[0].id;
const state = await getClassificationState(db, schemaId);
console.log("materials:", state.materials.length);
console.log("materialTags:", state.materialTags.length);
console.log("tagOptions:", collectAvailableTags(state, schemaId));

const root = buildCategoryTreeRoot({
  state,
  schemaId,
  chainSteps: [],
  search: "",
  filter: "all",
  tagFilterNames: new Set(),
  expandedIds: new Set(state.materials.map((m) => m.id)),
  selectedId: null,
  selectedIds: new Set(),
  inline: null,
});

const nodesWithTags = [];
function walk(node) {
  if (node.id !== "root" && node.tags?.length) {
    nodesWithTags.push({ id: node.id, label: node.label, tags: node.tags });
  }
  node.children.forEach(walk);
}
walk(root);
console.log("nodesWithTagBadges:", nodesWithTags.length, nodesWithTags.slice(0, 5));

await closeDb();
console.log("OK: classification bootstrap verified");
