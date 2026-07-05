import { ImportWizard } from "@/app/(dashboard)/boq/import/_components/ImportWizard";

type PageProps = {
  searchParams: Promise<{
    boqId?: string;
    projectId?: string;
    projectName?: string;
    boqName?: string;
  }>;
};

export default async function BoqImportPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const boqId = Number(params.boqId);
  const projectId = Number(params.projectId);

  return (
    <ImportWizard
      initialBatchName={params.boqName ?? ""}
      initialProjectName={params.projectName ?? ""}
      initialBoqId={Number.isFinite(boqId) && boqId > 0 ? boqId : undefined}
      initialProjectId={Number.isFinite(projectId) && projectId > 0 ? projectId : undefined}
    />
  );
}
