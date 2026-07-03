'use client';

import '@/styles/abrd-classification-tokens.css';
import '@/styles/classification-parity.css';
import '@/styles/explorer-tree.css';
import '@/styles/classification-overrides.css';
import { CategoryWorkspace } from './components/category-workspace';

export default function ClassificationPage() {
  return (
    <div className="cls-workspace mc-root" data-theme="light">
      <CategoryWorkspace />
    </div>
  );
}
