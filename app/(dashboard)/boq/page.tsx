import { BoqMasterList } from '@/components/boq/BoqMasterList';
import { DrizzleBoqReadRepository } from '@/infrastructure/persistence/boq/DrizzleBoqReadRepository';

export default async function BoqPage() {
  let boqs: Awaited<ReturnType<DrizzleBoqReadRepository['listBoqs']>> = [];
  let error: string | null = null;

  try {
    const repo = new DrizzleBoqReadRepository();
    boqs = await repo.listBoqs();
  } catch (err) {
    console.error(err);
    error = err instanceof Error ? err.message : 'Failed to load BOQs';
  }

  return <BoqMasterList boqs={boqs} error={error} />;
}
