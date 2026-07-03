import type { AiSuggestionDto } from "@/application/dto/workshop/categorizationDto";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/typography";

type AiSuggestionListProps = {
  suggestions: AiSuggestionDto[];
  selectedFamilyId: number | null;
  onAccept: (familyId: number) => void;
};

export function AiSuggestionList({
  suggestions,
  selectedFamilyId,
  onAccept,
}: AiSuggestionListProps) {
  if (suggestions.length === 0) {
    return (
      <Text variant="muted" size="sm">
        No AI suggestions yet. Run AI on this batch to generate proposals.
      </Text>
    );
  }

  return (
    <div className="space-y-2">
      {suggestions.map((suggestion, index) => (
        <div
          key={suggestion.id}
          className="rounded-md border border-ai-suggestion-border bg-ai-suggestion p-3"
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="ai">AI suggestion</Badge>
                <Text size="xs" variant="muted">
                  #{index + 1}
                </Text>
              </div>
              <Text weight="medium" className="mt-1 break-words">
                {suggestion.familyPath ?? "Unknown family"}
              </Text>
            </div>
            {suggestion.confidence !== null ? (
              <Text size="xs" variant="muted" className="shrink-0">
                {Math.round(suggestion.confidence * 100)}%
              </Text>
            ) : null}
          </div>
          {suggestion.rationale ? (
            <Text size="sm" variant="muted" className="mb-2">
              {suggestion.rationale}
            </Text>
          ) : null}
          <Button
            size="sm"
            variant={selectedFamilyId === suggestion.familyId ? "default" : "outline"}
            onClick={() => suggestion.familyId && onAccept(suggestion.familyId)}
          >
            Accept {index === 0 ? "(Enter)" : `(${index + 1})`}
          </Button>
        </div>
      ))}
    </div>
  );
}
