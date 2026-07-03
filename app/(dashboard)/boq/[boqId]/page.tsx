import { BoqBreakdownWorkspace } from '@/components/boq/BoqBreakdownWorkspace';

type PageProps = {
  params: Promise<{ boqId: string }>;
};

export default async function BoqBreakdownPage({ params }: PageProps) {
  const { boqId: boqIdParam } = await params;
  const boqId = Number(boqIdParam);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <BoqBreakdownWorkspace boqId={boqId} />
    </div>
  );
}
