import {
  createTag,
  updateTag,
  deleteTag,
  listTags,
  bulkAssignTags,
  bulkRemoveTags,
} from "../infrastructure/persistence/repositories/classification/repository.ts";
import { listSchemas } from "../infrastructure/persistence/repositories/classification/repository.ts";
import { getClassificationState } from "../application/classification/get-classification-state.ts";
import { getDb, closeDb } from "../infrastructure/persistence/db.ts";

const db = getDb();
const stamp = `verify-${Date.now()}`;
const tagName = `tag-${stamp}`;
const tagRename = `tag-renamed-${stamp}`;
let createdTagId = null;
let nodeId = null;

try {
  const before = await listTags(db);
  console.log("listTags before:", before.length);

  const created = await createTag(db, tagName, "#22c55e");
  createdTagId = created.id;
  console.log("createTag:", { id: created.id, name: created.name, color: created.color });

  const updated = await updateTag(db, created.id, { name: tagRename, color: "#3b82f6" });
  if (!updated || updated.name !== tagRename || updated.color !== "#3b82f6") {
    throw new Error(`updateTag failed: ${JSON.stringify(updated)}`);
  }
  console.log("updateTag:", { id: updated.id, name: updated.name, color: updated.color });

  const schemas = await listSchemas(db);
  if (!schemas.length) throw new Error("No classification schema found");
  const state = await getClassificationState(db, schemas[0].id);
  const material = state.materials.find((row) => row.isActive);
  if (!material) throw new Error("No active material node to assign tag");
  nodeId = material.id;

  const assigned = await bulkAssignTags(db, [nodeId], created.id);
  console.log("bulkAssignTags:", assigned);
  if (assigned !== 1) throw new Error(`Expected 1 assignment, got ${assigned}`);

  const assignedAgain = await bulkAssignTags(db, [nodeId], created.id);
  if (assignedAgain !== 0) throw new Error(`Duplicate assign should be 0, got ${assignedAgain}`);

  await bulkRemoveTags(db, [nodeId], created.id);
  console.log("bulkRemoveTags: ok");

  await deleteTag(db, created.id);
  createdTagId = null;
  console.log("deleteTag: ok");

  const after = await listTags(db);
  if (after.some((tag) => tag.name === tagRename)) {
    throw new Error("Deleted tag still present in listTags");
  }
  console.log("listTags after:", after.length);
  console.log("PASS: tag CRUD verified");
} catch (error) {
  console.error("FAIL:", error instanceof Error ? error.message : error);
  if (createdTagId != null) {
    try {
      if (nodeId != null) await bulkRemoveTags(db, [nodeId], createdTagId);
      await deleteTag(db, createdTagId);
    } catch {
      // best-effort cleanup
    }
  }
  process.exitCode = 1;
} finally {
  await closeDb();
}
