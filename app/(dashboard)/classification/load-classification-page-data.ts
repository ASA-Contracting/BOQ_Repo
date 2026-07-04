import { getClassificationState } from '@/application/classification/get-classification-state';
import { getLevelMapsBySchemaId } from '@/application/classification/save-schema-hierarchy';
import type { ClassificationStateDto } from '@/application/classification/dto';
import type { LevelOrderEntity } from '@/domain/classification/entities';
import { getDb, resetDbAfterError } from '@/infrastructure/persistence/db';
import { listSchemas } from '@/infrastructure/persistence/repositories/classification/repository';

const SERVER_STATE_TIMEOUT_MS = 20000;

type PageData = {
  initialSchemaId: number | null;
  initialSchemas: Array<{ id: number; name: string }>;
  initialState: ClassificationStateDto | null;
  initialChainSteps: LevelOrderEntity[];
};

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function loadClassificationPageData(): Promise<PageData> {
  const db = getDb();
  const schemas = await listSchemas(db);
  const initialSchemas = schemas.map((schema) => ({ id: schema.id, name: schema.name }));
  const initialSchemaId = initialSchemas[0]?.id ?? null;

  if (!initialSchemaId) {
    return {
      initialSchemaId: null,
      initialSchemas: [],
      initialState: null,
      initialChainSteps: [],
    };
  }

  const initialState = await withTimeout(
    getClassificationState(db, initialSchemaId, { lite: true }),
    SERVER_STATE_TIMEOUT_MS,
  );

  if (!initialState) {
    return {
      initialSchemaId,
      initialSchemas,
      initialState: null,
      initialChainSteps: [],
    };
  }

  const levelMaps = await getLevelMapsBySchemaId(db, initialSchemaId);
  const initialChainSteps = levelMaps
    .sort((a, b) => a.levelOrder - b.levelOrder)
    .map((map) => ({
      levelTypeId: map.levelTypeId,
      order: map.levelOrder,
      isRequired: map.isRequired ?? true,
    }));

  return {
    initialSchemaId,
    initialSchemas,
    initialState,
    initialChainSteps,
  };
}

function emptyPageData(): PageData {
  return {
    initialSchemaId: null,
    initialSchemas: [],
    initialState: null,
    initialChainSteps: [],
  };
}

export async function loadClassificationPageDataWithTimeout(): Promise<PageData> {
  try {
    return await loadClassificationPageData();
  } catch (error) {
    resetDbAfterError(error);
    console.error('Classification page load failed:', error);
    return emptyPageData();
  }
}
