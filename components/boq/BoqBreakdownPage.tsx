"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { BoqBreakdownDto } from "@/application/boq/dto";
import type { ClassificationStateDto } from "@/application/classification/dto";
import type { LevelOrderEntity } from "@/domain/classification/entities";
import { BoqBreakdownWorkspace } from "@/components/boq/BoqBreakdownWorkspace";
import { CategoryBuilderDialog } from "@/components/boq/CategoryBuilderDialog";
import { ShellContent } from "@/components/shared/AppShell";
import type { CategoryPickerOption } from "@/lib/category-picker-options";

import "@/styles/boq-breakdown-page.css";

type ClassificationData = {
  initialSchemaId: number | null;
  initialSchemas: Array<{ id: number; name: string }>;
  initialState: ClassificationStateDto | null;
  initialChainSteps: LevelOrderEntity[];
};

type Props = {
  breakdown: BoqBreakdownDto;
  categoryOptions: CategoryPickerOption[];
  classification: ClassificationData;
};

export function BoqBreakdownPage({
  breakdown,
  categoryOptions,
  classification,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categoryBuilderOpen, setCategoryBuilderOpen] = useState(
    () => searchParams.get("categoryBuilder") === "1",
  );

  const syncCategoryBuilderUrl = useCallback(
    (open: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      if (open) {
        params.set("categoryBuilder", "1");
      } else {
        params.delete("categoryBuilder");
      }
      const query = params.toString();
      router.replace(query ? `/boq/${breakdown.id}?${query}` : `/boq/${breakdown.id}`, {
        scroll: false,
      });
    },
    [breakdown.id, router, searchParams],
  );

  return (
    <ShellContent flush className="boq-breakdown-page">
      <BoqBreakdownWorkspace
        breakdown={breakdown}
        categoryOptions={categoryOptions}
        onOpenCategoryBuilder={() => {
          setCategoryBuilderOpen(true);
          syncCategoryBuilderUrl(true);
        }}
      />

      <CategoryBuilderDialog
        open={categoryBuilderOpen}
        onClose={() => {
          setCategoryBuilderOpen(false);
          syncCategoryBuilderUrl(false);
        }}
        {...classification}
      />
    </ShellContent>
  );
}
