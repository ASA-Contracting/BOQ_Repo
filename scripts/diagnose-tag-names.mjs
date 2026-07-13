/**
 * Quick probe: do polluted tag names exist as material names?
 */
import { getClassificationState } from '../application/classification/get-classification-state.ts';
import { getDb, closeDb } from '../infrastructure/persistence/db.ts';
import { listSchemas } from '../infrastructure/persistence/repositories/classification/repository.ts';
import { buildCatalogTagContextFromState, normalizeTagLabel } from '../lib/category-tag-display.ts';
import { normalizeToken } from '../domain/classification/classification-policy.ts';

const db = getDb();
const schemaId = (await listSchemas(db))[0].id;
const state = await getClassificationState(db, schemaId);
const ctx = buildCatalogTagContextFromState(state, schemaId);

const activeMaterials = state.materials.filter((m) => m.schemaId === schemaId && m.isActive);
const materialNamesLower = new Set(
  activeMaterials.map((m) => normalizeTagLabel(m.name).toLowerCase()).filter(Boolean),
);
const materialTokens = new Set(activeMaterials.map((m) => normalizeToken(m.name)).filter(Boolean));

const probes = [
  '1 Gang',
  '1 kg',
  '1 Slot',
  'Air Cooled Chiller',
  'HVAC',
  'BMS / Controls',
  'Harsh Environment / Wash Down Areas',
  'Access Control Panels',
];

for (const name of probes) {
  const key = normalizeTagLabel(name).toLowerCase();
  const token = normalizeToken(name);
  const matExact = activeMaterials.filter(
    (m) => normalizeTagLabel(m.name).toLowerCase() === key,
  );
  const matToken = activeMaterials.filter((m) => normalizeToken(m.name) === token);
  console.log(
    JSON.stringify({
      name,
      inCategorySet: ctx.categoryNamesLower.has(key),
      matExact: matExact.length,
      matToken: matToken.length,
      inMaterialNamesLower: materialNamesLower.has(key),
      inMaterialTokens: materialTokens.has(token),
      nonSelf: ctx.nonSelfCountByTagLower.get(key) ?? 0,
      isRoot: ctx.rootCategoryNamesLower.has(key),
    }),
  );
}

console.log('activeMaterials:', activeMaterials.length);
console.log('categoryNamesLower:', ctx.categoryNamesLower.size);
console.log('state.tags:', state.tags.length);

await closeDb();
