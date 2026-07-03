import { DetailSkeleton, TreeSkeleton } from "@/app/(dashboard)/families/_components/LoadingState";
import { Panel, PanelBody } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { SplitPane } from "@/components/ui/split-pane";
import { TableToolbar } from "@/components/ui/table-toolbar";

export default function FamiliesLoading() {
  const leftPanel = (
    <Panel padding={false} className="h-full border-0 shadow-none">
      <div className="border-b border-border px-[var(--space-inline)] py-3">
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="border-b border-border px-[var(--space-inline)] py-3">
        <Skeleton className="h-4 w-24" />
      </div>
      <PanelBody>
        <TreeSkeleton />
      </PanelBody>
    </Panel>
  );

  const rightPanel = (
    <Panel padding className="h-full border-0 shadow-none">
      <DetailSkeleton />
    </Panel>
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <TableToolbar className="px-[var(--space-inline)]">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-28" />
        </div>
      </TableToolbar>
      <div className="hidden min-h-0 flex-1 p-[var(--space-shell)] pt-0 lg:flex">
        <SplitPane
          className="flex-1"
          left={leftPanel}
          right={rightPanel}
          defaultLeftPercent={35}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-[var(--space-shell)] lg:hidden">
        <Panel padding={false} className="min-h-[40vh] flex-1">
          {leftPanel}
        </Panel>
        <Panel padding={false} className="min-h-[40vh] flex-1">
          {rightPanel}
        </Panel>
      </div>
    </div>
  );
}
