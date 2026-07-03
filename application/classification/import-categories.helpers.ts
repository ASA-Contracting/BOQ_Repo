import { normalizeToken } from '@/domain/classification/classification-policy';

export function buildImportPathKey(path: string[]): string {
  return path.map((segment) => normalizeToken(segment)).join('>');
}
