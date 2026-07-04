"use client";

import type { ClassificationStateDto } from "@/application/classification/dto";
import type { LevelOrderEntity } from "@/domain/classification/entities";
import { ClassificationPageClient } from "@/app/(dashboard)/classification/classification-page-client";
import {
  DialogContent,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onClose: () => void;
  initialSchemaId: number | null;
  initialSchemas: Array<{ id: number; name: string }>;
  initialState: ClassificationStateDto | null;
  initialChainSteps: LevelOrderEntity[];
};

export function CategoryBuilderDialog({
  open,
  onClose,
  initialSchemaId,
  initialSchemas,
  initialState,
  initialChainSteps,
}: Props) {
  return (
    <DialogRoot open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        size="xl"
        className="boq-category-builder-dialog flex h-[min(92vh,920px)] w-[min(96vw,1440px)] max-w-none flex-col overflow-hidden p-0"
      >
        <DialogHeader className="shrink-0 border-b px-5 py-3.5">
          <DialogTitle>Category builder</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Maintain the MEP classification hierarchy used when categorizing BOQ lines.
          </p>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-hidden">
          <ClassificationPageClient
            initialSchemaId={initialSchemaId}
            initialSchemas={initialSchemas}
            initialState={initialState}
            initialChainSteps={initialChainSteps}
          />
        </div>
      </DialogContent>
    </DialogRoot>
  );
}
