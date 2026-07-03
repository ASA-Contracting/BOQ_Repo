import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileSpreadsheet,
  Plus,
  Upload,
  User,
} from 'lucide-react';

import type { BoqListEntryDto, BoqWorkflowStatus } from '@/application/boq/dto';
import { ShellContent } from '@/components/shared/AppShell';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

type Props = {
  boqs: BoqListEntryDto[];
  error?: string | null;
};

const STATUS_META: Record<
  BoqWorkflowStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  complete: {
    label: 'Fully categorized',
    className: 'border-emerald-400 bg-emerald-100 text-emerald-900',
    icon: CheckCircle2,
  },
  in_progress: {
    label: 'Needs categorization',
    className: 'border-amber-400 bg-amber-100 text-amber-950',
    icon: Clock3,
  },
  empty: {
    label: 'No measurable items',
    className: 'border-slate-300 bg-slate-100 text-slate-700',
    icon: AlertCircle,
  },
};

const WORKFLOW_LABELS: Record<string, string> = {
  imported: 'Imported',
  ai_running: 'AI running',
  ready_for_engineer_review: 'Engineer review',
  awaiting_section_head: 'Awaiting section head',
  version_approved: 'Version approved',
  completed: 'Completed',
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function progressPercent(boq: BoqListEntryDto): number {
  if (boq.measurableCount === 0) return 0;
  return Math.round((boq.categorizedCount / boq.measurableCount) * 100);
}

function rowHref(boq: BoqListEntryDto): string {
  if (boq.batchId) return `/workshop/categorize/${boq.batchId}`;
  return `/boq/${boq.boqId}`;
}

export function BoqMasterList({ boqs, error = null }: Props) {
  return (
    <ShellContent className="mx-auto max-w-7xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border-2 border-indigo-300 bg-gradient-to-r from-indigo-50 to-white px-4 py-4">
        <div>
          <Text size="lg" weight="semibold" className="text-indigo-950">
            BOQ master list
          </Text>
          <Text variant="muted" size="sm" className="mt-0.5 max-w-2xl">
            Every imported bill of quantities lives here. Track project, version, workflow stage,
            and categorization progress.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="border-indigo-300 bg-white">
            <Link href="/classification">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Category builder
            </Link>
          </Button>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
            <Link href="/boq/import">
              <Upload className="mr-2 h-4 w-4" />
              Import Excel
            </Link>
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border-2 border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      ) : null}

      {boqs.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-indigo-300 bg-white px-6 py-14 text-center">
          <Text weight="semibold" className="text-indigo-950">
            No BOQs yet
          </Text>
          <Text variant="muted" size="sm" className="mt-1">
            Import an Excel BOQ — it will appear here with import date, owner, and categorization status.
          </Text>
          <Button asChild className="mt-4 bg-indigo-600 hover:bg-indigo-700">
            <Link href="/boq/import">
              <Plus className="mr-2 h-4 w-4" />
              Import BOQ
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border-2 border-slate-300 bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-indigo-200 bg-indigo-100 text-left text-[11px] font-bold uppercase tracking-wide text-indigo-950">
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">BOQ</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Workflow</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Categorization</th>
                <th className="px-4 py-3">Imported</th>
                <th className="px-4 py-3">Imported by</th>
                <th className="w-32 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {boqs.map((boq, index) => {
                const status = STATUS_META[boq.status];
                const StatusIcon = status.icon;
                const percent = progressPercent(boq);
                const workflowLabel =
                  WORKFLOW_LABELS[boq.workflowStage ?? ''] ??
                  boq.workflowStage ??
                  '—';

                return (
                  <tr
                    key={boq.id}
                    className={cn(
                      'border-b border-slate-200 align-top transition-colors hover:bg-indigo-50/40',
                      index % 2 === 1 && 'bg-slate-50/60',
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{boq.projectName}</div>
                      {boq.client ? (
                        <div className="mt-0.5 text-xs text-muted-foreground">{boq.client}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{boq.name}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {boq.itemCount} total rows · {boq.measurableCount} to categorize
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">
                      {boq.versionName ?? (boq.versionNumber ? `v${boq.versionNumber}` : '—')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        {workflowLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold',
                          status.className,
                        )}
                      >
                        <StatusIcon className="h-3.5 w-3.5" aria-hidden />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="min-w-[10rem] space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-emerald-700">{boq.categorizedCount} done</span>
                          <span className="text-rose-700">{boq.pendingCount} pending</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              boq.status === 'complete' ? 'bg-emerald-500' : 'bg-amber-500',
                            )}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-muted-foreground">{percent}% categorized</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">
                      {formatDate(boq.importedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                        <User className="h-3.5 w-3.5 text-indigo-600" aria-hidden />
                        {boq.importedByName ?? boq.importedById ?? 'Unknown'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        asChild
                        size="sm"
                        className={cn(
                          'w-full',
                          boq.status === 'in_progress'
                            ? 'bg-amber-600 hover:bg-amber-700'
                            : 'bg-indigo-600 hover:bg-indigo-700',
                        )}
                      >
                        <Link href={rowHref(boq)}>
                          {boq.batchId ? 'Categorize' : 'Open'}
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </ShellContent>
  );
}
