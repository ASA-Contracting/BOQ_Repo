"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { BoqListEntryDto } from "@/application/boq/dto";
import type { ProjectListItemDto } from "@/application/dto/project/projectDto";
import { BoqMasterList } from "@/components/boq/BoqMasterList";
import { ProjectsDialog } from "@/components/boq/ProjectsDialog";

type Props = {
  boqs: BoqListEntryDto[];
  boqsError?: string | null;
  projects: ProjectListItemDto[];
  canCloseProject: boolean;
  projectsError?: string | null;
};

export function BoqMasterListPage({
  boqs,
  boqsError = null,
  projects,
  canCloseProject,
  projectsError = null,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projectsOpen, setProjectsOpen] = useState(
    () => searchParams.get("projects") === "1",
  );

  const syncProjectsUrl = useCallback(
    (open: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      if (open) {
        params.set("projects", "1");
      } else {
        params.delete("projects");
      }
      const query = params.toString();
      router.replace(query ? `/boq?${query}` : "/boq", { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <>
      <BoqMasterList
        boqs={boqs}
        error={boqsError}
        onOpenProjects={() => {
          setProjectsOpen(true);
          syncProjectsUrl(true);
        }}
      />

      <ProjectsDialog
        open={projectsOpen}
        onClose={() => {
          setProjectsOpen(false);
          syncProjectsUrl(false);
        }}
        projects={projects}
        canCloseProject={canCloseProject}
        error={projectsError}
      />
    </>
  );
}
