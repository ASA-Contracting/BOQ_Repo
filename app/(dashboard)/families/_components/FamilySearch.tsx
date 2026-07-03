"use client";

import { useEffect, useState } from "react";

import { searchFamiliesAction } from "@/app/(dashboard)/families/actions";
import { useDebouncedValue } from "@/app/(dashboard)/families/_hooks/useDebouncedValue";
import type { FamilyListItemDto } from "@/application/dto/family/familyDto";
import { InlineError } from "@/components/ui/error-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchBox } from "@/components/ui/search-box";
import { InlineLoading } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

type FamilySearchProps = {
  selectedId: number | null;
  onQueryChange: (query: string) => void;
  onSelectResult: (familyId: number) => void;
};

export function FamilySearch({
  selectedId,
  onQueryChange,
  onSelectResult,
}: FamilySearchProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const [results, setResults] = useState<FamilyListItemDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onQueryChange(debouncedQuery);
  }, [debouncedQuery, onQueryChange]);

  useEffect(() => {
    if (debouncedQuery.length === 0) {
      return;
    }

    let cancelled = false;

    async function runSearch() {
      setIsSearching(true);
      setError(null);

      const response = await searchFamiliesAction({
        query: debouncedQuery,
        limit: 20,
      });

      if (cancelled) {
        return;
      }

      setIsSearching(false);

      if (!response.success) {
        setResults([]);
        setError(response.error.message);
        return;
      }

      setResults(response.data);
    }

    void runSearch();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const showSearchState = debouncedQuery.length > 0;
  const visibleResults = showSearchState ? results : [];
  const visibleError = showSearchState ? error : null;
  const visibleSearching = showSearchState && isSearching;

  return (
    <div className="space-y-2 border-b border-border px-[var(--space-inline)] py-3">
      <SearchBox
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by name, reference code, or description…"
        aria-label="Search families"
        onClear={() => setQuery("")}
      />

      {visibleSearching ? (
        <InlineLoading label="Searching…" />
      ) : null}

      {visibleError ? <InlineError message={visibleError} /> : null}

      {showSearchState && !visibleSearching && visibleResults.length === 0 && !visibleError ? (
        <Text variant="muted" size="sm">
          No matching families.
        </Text>
      ) : null}

      {visibleResults.length > 0 ? (
        <ScrollArea className="max-h-44 rounded-md border border-border bg-background elevation-1">
          <ul className="p-1">
            {visibleResults.map((result) => (
              <li key={result.id}>
                <button
                  type="button"
                  className={cn(
                    "focus-ring w-full rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent",
                    selectedId === result.id &&
                      "bg-accent text-accent-foreground",
                  )}
                  onClick={() => onSelectResult(result.id)}
                >
                  <span className="font-medium">{result.name}</span>
                  {result.referenceCode ? (
                    <Text variant="muted" size="xs" as="span" className="mt-0.5 block">
                      {result.referenceCode}
                    </Text>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      ) : null}
    </div>
  );
}
