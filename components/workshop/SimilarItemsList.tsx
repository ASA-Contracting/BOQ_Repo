import type { SimilarWorkshopItemDto } from "@/application/dto/workshop/categorizationDto";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/typography";

type SimilarItemsListProps = {
  items: SimilarWorkshopItemDto[];
  onBulkApprove?: () => void;
};

export function SimilarItemsList({ items, onBulkApprove }: SimilarItemsListProps) {
  if (items.length === 0) {
    return (
      <Text variant="muted" size="sm">
        No similar classified items in this batch yet.
      </Text>
    );
  }

  const hasPending = items.some((item) => item.finalFamilyId === null);

  return (
    <div className="space-y-2">
      {onBulkApprove && hasPending ? (
        <Button size="sm" variant="outline" onClick={onBulkApprove}>
          Apply selection to similar pending items
        </Button>
      ) : null}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="rounded-md border border-border px-3 py-2">
            <Text size="sm" className="line-clamp-2">
              {item.description ?? "—"}
            </Text>
            <Text size="xs" variant="muted">
              → {item.finalFamilyPath ?? "Pending"}
            </Text>
          </li>
        ))}
      </ul>
    </div>
  );
}
