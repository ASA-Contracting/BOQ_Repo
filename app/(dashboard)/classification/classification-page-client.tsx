'use client';

import '@/styles/abrd-classification-tokens.css';
import '@/styles/classification-parity.css';
import '@/styles/explorer-tree.css';
import '@/styles/classification-overrides.css';

import type { ClassificationStateDto } from '@/application/classification/dto';
import type { LevelOrderEntity } from '@/domain/classification/entities';
import { CategoryWorkspace } from './components/category-workspace';

type Props = {
  initialSchemaId: number | null;
  initialSchemas: Array<{ id: number; name: string }>;
  initialState: ClassificationStateDto | null;
  initialChainSteps: LevelOrderEntity[];
};

export function ClassificationPageClient({
  initialSchemaId,
  initialSchemas,
  initialState,
  initialChainSteps,
}: Props) {
  return (
    <div className="cls-workspace mc-root" data-theme="light">
      <CategoryWorkspace
        initialSchemaId={initialSchemaId}
        initialSchemas={initialSchemas}
        initialState={initialState}
        initialChainSteps={initialChainSteps}
      />
    </div>
  );
}
