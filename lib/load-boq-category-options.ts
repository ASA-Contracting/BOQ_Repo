import { getClassificationState } from "@/application/classification/get-classification-state";
import { getDb } from "@/infrastructure/persistence/db";
import {
  buildCategoryPickerOptions,
  type CategoryPickerOption,
} from "@/lib/category-picker-options";

export async function loadBoqCategoryOptions(schemaId?: number): Promise<CategoryPickerOption[]> {
  const db = getDb();
  const state = await getClassificationState(db, schemaId);
  return buildCategoryPickerOptions(
    state.materials
      .filter((material) => material.isActive)
      .map((material) => ({
        id: material.id,
        name: material.name,
        materialLevelTypeId: material.levelTypeId,
        parentId: material.parentId,
        schemaId: material.schemaId,
        isActive: material.isActive,
      })),
    state.materialTags.map((link) => ({
      materialNodeId: link.materialNodeId,
      tagName: link.tagName,
    })),
  );
}
