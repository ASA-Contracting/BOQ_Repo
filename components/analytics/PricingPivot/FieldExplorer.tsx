"use client";

import { memo, useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

import { FieldItem } from "@/components/analytics/PricingPivot/FieldItem";
import {
  PIVOT_FIELD_CATEGORIES,
  fieldsByCategory,
} from "@/lib/analytics/pivot-engine";
import { cn } from "@/lib/utils";

type FieldCategoryProps = {
  categoryId: (typeof PIVOT_FIELD_CATEGORIES)[number]["id"];
  label: string;
  query: string;
  defaultOpen?: boolean;
  onOpenFilter: (fieldId: string) => void;
};

const FieldCategory = memo(function FieldCategory({
  categoryId,
  label,
  query,
  defaultOpen = true,
  onOpenFilter,
}: FieldCategoryProps) {
  const [open, setOpen] = useState(defaultOpen);
  const fields = useMemo(() => {
    const items = fieldsByCategory(categoryId);
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter(
      (field) =>
        field.label.toLowerCase().includes(normalized) ||
        field.description.toLowerCase().includes(normalized),
    );
  }, [categoryId, query]);

  if (fields.length === 0) return null;

  return (
    <section>
      <button
        type="button"
        className="pi-explorer__section-toggle"
        onClick={() => setOpen((value) => !value)}
      >
        <span>{label}</span>
        <ChevronDown
          className={cn("h-3 w-3 text-[#64748b] transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div>
          {fields.map((field) => (
            <FieldItem
              key={field.id}
              fieldId={field.id}
              onOpenFilter={() => onOpenFilter(field.id)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
});

type FieldExplorerProps = {
  onOpenFilter: (fieldId: string) => void;
};

export function FieldExplorer({ onOpenFilter }: FieldExplorerProps) {
  const [query, setQuery] = useState("");

  return (
    <aside className="pi-explorer" aria-label="Field explorer">
      <div className="pi-explorer__search-bar">
        <label className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748b]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search fields…"
            className="pi-explorer__search-input"
          />
        </label>
      </div>
      <div className="pi-explorer__scroll">
        {PIVOT_FIELD_CATEGORIES.map((category) => (
          <FieldCategory
            key={category.id}
            categoryId={category.id}
            label={category.label}
            query={query}
            onOpenFilter={onOpenFilter}
          />
        ))}
      </div>
    </aside>
  );
}
