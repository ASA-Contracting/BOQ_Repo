import type { PriorDecisionDto } from "@/application/dto/workshop/categorizationDto";
import { Text } from "@/components/ui/typography";

type PriorDecisionsListProps = {
  decisions: PriorDecisionDto[];
};

export function PriorDecisionsList({ decisions }: PriorDecisionsListProps) {
  if (decisions.length === 0) {
    return (
      <Text variant="muted" size="sm">
        No prior engineer decisions for similar descriptions.
      </Text>
    );
  }

  return (
    <ul className="space-y-2">
      {decisions.map((decision) => (
        <li key={decision.id} className="rounded-md border border-border px-3 py-2">
          <Text size="sm">
            {decision.userDisplayName ?? "Engineer"} →{" "}
            {decision.selectedFamilyName ?? "Unknown"}
          </Text>
          <Text size="xs" variant="muted" className="line-clamp-1">
            {decision.itemDescription ?? "—"}
          </Text>
        </li>
      ))}
    </ul>
  );
}
