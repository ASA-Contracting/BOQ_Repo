import { Skeleton } from "@/components/ui/skeleton";
import { TreeSkeleton } from "@/components/ui/tree";

export function DetailSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

export { TreeSkeleton };
