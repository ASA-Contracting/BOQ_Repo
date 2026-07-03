'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  LayoutList,
  Upload,
} from 'lucide-react';

import type { BoqBreakdownDto } from '@/application/boq/dto';
import { BoqCategoryPicker } from '@/components/boq/BoqCategoryPicker';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import type { CategoryPickerOption } from '@/lib/category-picker-options';
import { cn } from '@/lib/utils';

type ApiBreakdownResponse = {
  success: boolean;
  data?: BoqBreakdownDto;
  message?: string;
};

type ApiOptionsResponse = {
  success: boolean;
  data?: { options: CategoryPickerOption[] };
  message?: string;
};

type Props = {
  boqId: number;
};

export function BoqBreakdownWorkspace({ boqId }: Props) {
  const [breakdown, setBreakdown] = useState<BoqBreakdownDto | null>(null);
  const [options, setOptions] = useState<CategoryPickerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingItemId, setSavingItemId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const breakdownRes = await fetch(`/api/boq/${boqId}`);
      const breakdownJson = (await breakdownRes.json()) as ApiBreakdownResponse;

      if (!breakdownRes.ok || !breakdownJson.success || !breakdownJson.data) {
        throw new Error(breakdownJson.message ?? 'Failed to load BOQ');
      }

      setBreakdown(breakdownJson.data);

      try {
        const optionsRes = await fetch('/api/boq/category-options');
        const optionsJson = (await optionsRes.json()) as ApiOptionsResponse;
        if (optionsRes.ok && optionsJson.success && optionsJson.data) {
          setOptions(optionsJson.data.options);
        } else {
          setOptions([]);
        }
      } catch {
        setOptions([]);
      }
    } catch (err) {
      setBreakdown(null);
      setError(err instanceof Error ? err.message : 'Failed to load BOQ');
    } finally {
      setLoading(false);
    }
  }, [boqId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateCategory = useCallback(
    async (itemId: number, materialNodeId: number | null) => {
      setSavingItemId(itemId);
      try {
        const response = await fetch(`/api/boq/items/${itemId}/category`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ materialNodeId }),
        });
        const json = (await response.json()) as { success: boolean; message?: string };
        if (!response.ok || !json.success) {
          throw new Error(json.message ?? 'Failed to save category');
        }
        setBreakdown((current) =>
          current
            ? {
                ...current,
                items: current.items.map((item) => {
                  if (item.id !== itemId) return item;
                  const option = materialNodeId
                    ? options.find((entry) => entry.id === materialNodeId)
                    : null;
                  return {
                    ...item,
                    materialNodeId,
                    categoryLabel: option?.label ?? null,
                    categoryPath: option?.path ?? null,
                  };
                }),
              }
            : current,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save category');
      } finally {
        setSavingItemId(null);
      }
    },
    [options],
  );

  const stats = useMemo(() => {
    if (!breakdown) {
      return { total: 0, sections: 0, measurable: 0, categorized: 0, pending: 0 };
    }

    const sections = breakdown.items.filter((item) => item.isHeader).length;
    const measurable = breakdown.items.filter(
      (item) => item.isMeasurable && !item.isHeader,
    );
    const categorized = measurable.filter((item) => item.materialNodeId != null).length;

    return {
      total: breakdown.items.length,
      sections,
      measurable: measurable.length,
      categorized,
      pending: measurable.length - categorized,
    };
  }, [breakdown]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-50 p-8">
        <Text variant="muted">Loading BOQ breakdown…</Text>
      </div>
    );
  }

  if (error || !breakdown) {
    return (
      <div className="space-y-4 p-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/boq">
            <LayoutList className="mr-2 h-4 w-4" />
            BOQ master list
          </Link>
        </Button>
        <Text className="text-destructive">{error ?? 'BOQ not found'}</Text>
      </div>
    );
  }

  return (
    <div className="boq-breakdown flex min-h-0 flex-1 flex-col bg-slate-100">
      <div className="border-b border-slate-300 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button asChild variant="outline" size="sm" className="border-slate-300 bg-slate-50">
              <Link href="/boq">
                <ArrowLeft className="mr-1 h-4 w-4" />
                BOQ master list
              </Link>
            </Button>
            <div className="min-w-0">
              <Text size="sm" weight="semibold" className="truncate text-slate-900">
                {breakdown.name}
              </Text>
              <Text variant="muted" size="xs">
                {breakdown.projectName}
                {breakdown.versionName ? ` · ${breakdown.versionName}` : ''}
              </Text>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/classification">Category builder</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/boq/import">
                <Upload className="mr-1 h-4 w-4" />
                Import Excel
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatChip label="Total rows" value={stats.total} tone="slate" />
          <StatChip label="Sections" value={stats.sections} tone="amber" />
          <StatChip label="Categorized" value={stats.categorized} tone="emerald" />
          <StatChip label="Needs category" value={stats.pending} tone="rose" highlight={stats.pending > 0} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="overflow-hidden rounded-xl border-2 border-slate-300 bg-white shadow-sm">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-indigo-200 bg-indigo-100 text-left text-[11px] font-bold uppercase tracking-wide text-indigo-950">
                <th className="min-w-[240px] px-3 py-2.5">Category</th>
                <th className="min-w-[90px] px-3 py-2.5">Item No.</th>
                <th className="min-w-[300px] px-3 py-2.5">Description</th>
                <th className="min-w-[72px] px-3 py-2.5">UoM</th>
                <th className="min-w-[72px] px-3 py-2.5 text-right">Qty</th>
                <th className="min-w-[72px] px-3 py-2.5 text-right">Rate</th>
                <th className="min-w-[80px] px-3 py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No rows in this BOQ.
                  </td>
                </tr>
              ) : (
                breakdown.items.map((item) => {
                  const isSection = item.isHeader;
                  const isMeasurable = item.isMeasurable && !item.isHeader;
                  const isCategorized = isMeasurable && item.materialNodeId != null;
                  const isPending = isMeasurable && item.materialNodeId == null;

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        'border-b border-slate-200',
                        isSection && 'bg-amber-50/90 font-semibold text-amber-950',
                        isCategorized && 'bg-emerald-50/40',
                        isPending && 'bg-rose-50/30',
                        !isSection && 'hover:bg-slate-50',
                      )}
                    >
                      <td className="px-2 py-2 align-middle">
                        {isSection ? (
                          <span className="inline-flex rounded-md bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                            Section
                          </span>
                        ) : isMeasurable ? (
                          <div className="space-y-1">
                            <BoqCategoryPicker
                              options={options}
                              value={item.materialNodeId}
                              disabled={savingItemId === item.id}
                              onChange={(materialNodeId) =>
                                void updateCategory(item.id, materialNodeId)
                              }
                              placeholder="Select category…"
                            />
                            {isCategorized ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" aria-hidden />
                                Categorized
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700">
                                <CircleDashed className="h-3 w-3" aria-hidden />
                                Needs category
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 align-middle font-mono text-xs">
                        {item.itemNo ?? '—'}
                      </td>
                      <td className="px-3 py-2 align-middle whitespace-pre-wrap">
                        {item.description ?? '—'}
                      </td>
                      <td className="px-3 py-2 align-middle">{item.unit ?? '—'}</td>
                      <td className="px-3 py-2 align-middle text-right tabular-nums">
                        {item.quantity ?? '—'}
                      </td>
                      <td className="px-3 py-2 align-middle text-right tabular-nums">
                        {item.rate ?? '0'}
                      </td>
                      <td className="px-3 py-2 align-middle text-right tabular-nums font-medium">
                        {item.total ?? '0'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  tone,
  highlight = false,
}: {
  label: string;
  value: number;
  tone: 'slate' | 'amber' | 'emerald' | 'rose';
  highlight?: boolean;
}) {
  const styles = {
    slate: 'border-slate-300 bg-slate-50 text-slate-800',
    amber: 'border-amber-300 bg-amber-50 text-amber-900',
    emerald: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    rose: 'border-rose-300 bg-rose-50 text-rose-900',
  } as const;

  return (
    <div
      className={cn(
        'rounded-lg border-2 px-3 py-2',
        styles[tone],
        highlight && 'ring-2 ring-rose-400/50',
      )}
    >
      <div className="text-[10px] font-bold uppercase tracking-wide opacity-80">{label}</div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
    </div>
  );
}
