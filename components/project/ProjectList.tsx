"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, Plus } from "lucide-react";

import { closeProjectAction } from "@/app/(dashboard)/projects/actions";
import type { ProjectListItemDto } from "@/application/dto/project/projectDto";
import { ShellContent } from "@/components/shared/AppShell";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

type Props = {
  projects: ProjectListItemDto[];
  canCloseProject: boolean;
  error?: string | null;
  embedded?: boolean;
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ProjectList({
  projects,
  canCloseProject,
  error = null,
  embedded = false,
}: Props) {
  const router = useRouter();
  const [closingId, setClosingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleClose(projectId: number, projectName: string) {
    if (
      !window.confirm(
        `Close project "${projectName}"? Closed projects remain searchable but cannot be edited.`,
      )
    ) {
      return;
    }

    setClosingId(projectId);
    setActionError(null);
    const result = await closeProjectAction(projectId);
    setClosingId(null);

    if (!result.success) {
      setActionError(result.error.message);
      return;
    }

    router.refresh();
  }

  const table = (
    <>
      {error ? (
        <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {actionError}
        </div>
      ) : null}

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-14 text-center">
          <Text weight="semibold">No projects yet</Text>
          <Text variant="muted" size="sm" className="mt-1">
            Create a project before importing BOQs, or import will create one automatically.
          </Text>
          <Button asChild className="mt-4">
            <Link href="/projects/new">Create project</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-[11px] font-bold uppercase tracking-wide">
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="w-36 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {projects.map((project, index) => (
                <tr
                  key={project.id}
                  className={cn(
                    "border-b align-top",
                    index % 2 === 1 && "bg-muted/20",
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold">{project.name}</div>
                    {project.description ? (
                      <div className="mt-0.5 text-xs text-muted-foreground">{project.description}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{project.client}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                        project.status === "closed"
                          ? "border-slate-300 bg-slate-100 text-slate-700"
                          : "border-emerald-300 bg-emerald-50 text-emerald-800",
                      )}
                    >
                      {project.status === "closed" ? "Closed" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{formatDate(project.createdAt)}</td>
                  <td className="px-4 py-3">
                    {project.status === "active" && canCloseProject ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={closingId === project.id}
                        onClick={() => void handleClose(project.id, project.name)}
                      >
                        <Lock className="mr-1 h-3.5 w-3.5" />
                        Close
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  if (embedded) {
    return <div className="project-list project-list--embedded px-5 pb-5">{table}</div>;
  }

  return (
    <ShellContent className="mx-auto max-w-7xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Text size="lg" weight="semibold">
            Projects
          </Text>
          <Text variant="muted" size="sm" className="mt-0.5">
            Root containers for BOQs — client, status, and audit history.
          </Text>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New project
          </Link>
        </Button>
      </div>

      {table}
    </ShellContent>
  );
}
