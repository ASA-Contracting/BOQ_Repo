import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type FamilyLevelTypeBadgeProps = {
  name: string;
  className?: string;
};

export function FamilyLevelTypeBadge({
  name,
  className,
}: FamilyLevelTypeBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-normal", className)}>
      {name}
    </Badge>
  );
}
