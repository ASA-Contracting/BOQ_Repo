"use client";

import dynamic from "next/dynamic";

import type { ProjectListItemDto } from "@/application/dto/project/projectDto";
import { Text } from "@/components/ui/typography";

const ImportWizard = dynamic(
  () =>
    import("@/app/(dashboard)/boq/import/_components/ImportWizard").then((m) => ({
      default: m.ImportWizard,
    })),
  {
    loading: () => (
      <div className="flex h-full items-center justify-center p-8">
        <Text variant="muted" size="sm">
          Loading import wizard…
        </Text>
      </div>
    ),
    ssr: false,
  },
);

type ImportWizardLoaderProps = {
  initialBatchName: string;
  initialProjectName: string;
  initialBoqId?: number;
  initialProjectId?: number;
  projects: ProjectListItemDto[];
};

export function ImportWizardLoader(props: ImportWizardLoaderProps) {
  return <ImportWizard {...props} />;
}
