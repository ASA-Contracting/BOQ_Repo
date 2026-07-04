"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import type { ProjectListItemDto } from "@/application/dto/project/projectDto";
import { ProjectList } from "@/components/project/ProjectList";
import { Button } from "@/components/ui/button";
import {
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onClose: () => void;
  projects: ProjectListItemDto[];
  canCloseProject: boolean;
  error?: string | null;
};

export function ProjectsDialog({
  open,
  onClose,
  projects,
  canCloseProject,
  error = null,
}: Props) {
  return (
    <DialogRoot open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent size="xl" className="boq-projects-dialog flex max-h-[min(88vh,760px)] max-w-3xl flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <div className="flex items-start justify-between gap-3 pr-6">
            <div>
              <DialogTitle>Projects</DialogTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Root containers for BOQs — client, status, and audit history.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/projects/new">
                <Plus className="mr-1.5 h-4 w-4" aria-hidden />
                New project
              </Link>
            </Button>
          </div>
        </DialogHeader>
        <DialogBody className="min-h-0 flex-1 overflow-auto px-0 py-0">
          <ProjectList
            embedded
            projects={projects}
            canCloseProject={canCloseProject}
            error={error}
          />
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  );
}
