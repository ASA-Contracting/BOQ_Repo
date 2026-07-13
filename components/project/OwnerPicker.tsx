"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { ClientListItemDto } from "@/application/dto/client/clientDto";
import { SearchSelect } from "@/components/filter-engine";
import { Label } from "@/components/ui/label";
import { controlHeight, inputBase } from "@/lib/design/interactive";
import { cn } from "@/lib/utils";

import "@/styles/abrd-search-select.css";
import "@/styles/import-project-picker.css";

export type OwnerSelection = {
  clientId?: number;
  client: string;
};

type ClientPickerOption = { id: number; name: string } | { kind: "typed"; name: string };

type Props = {
  id?: string;
  value: OwnerSelection;
  onChange: (value: OwnerSelection) => void;
  disabled?: boolean;
  required?: boolean;
  /** When true, refreshes the owner catalog (e.g. dialog opened). */
  active?: boolean;
};

function displayClientOption(option: ClientPickerOption | null): string {
  if (!option) return "";
  return option.name;
}

function isTypedClientOption(
  option: ClientPickerOption,
): option is { kind: "typed"; name: string } {
  return "kind" in option && option.kind === "typed";
}

function renderClientOption(option: ClientPickerOption, { isSelected }: { isSelected: boolean }) {
  if (isTypedClientOption(option)) {
    return (
      <span className="import-project-option-text">
        <span className="import-project-option-primary">Add &ldquo;{option.name}&rdquo;</span>
        <span className="import-project-option-secondary">New owner</span>
      </span>
    );
  }

  return <span className="ss-item-label">{option.name}</span>;
}

export function OwnerPicker({
  id = "owner",
  value,
  onChange,
  disabled = false,
  required = false,
  active = true,
}: Props) {
  const [clientOptions, setClientOptions] = useState<ClientListItemDto[]>([]);
  const [clientDraft, setClientDraft] = useState(value.client);

  useEffect(() => {
    setClientDraft(value.client);
  }, [value.client, value.clientId]);

  const refreshClients = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/clients?page=1&pageSize=500");
      const json = (await response.json()) as {
        data?: ClientListItemDto[];
      };
      if (response.ok && Array.isArray(json.data)) {
        setClientOptions(json.data);
      }
    } catch {
      // Keep the current list when refresh fails.
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    void refreshClients();
  }, [active, refreshClients]);

  const clientPickerOptions = useMemo(() => {
    const existing = clientOptions.map((client) => ({ id: client.id, name: client.name }));
    const term = clientDraft.trim();
    const next: ClientPickerOption[] = [...existing];

    if (term) {
      const exactMatch = existing.some(
        (client) => client.name.toLowerCase() === term.toLowerCase(),
      );
      if (!exactMatch) {
        next.unshift({ kind: "typed", name: term });
      }
    }

    return next;
  }, [clientDraft, clientOptions]);

  const selectedClientOption = useMemo((): ClientPickerOption | null => {
    if (value.clientId) {
      const match = clientOptions.find((client) => client.id === value.clientId);
      if (match) {
        return { id: match.id, name: match.name };
      }
    }

    const trimmed = value.client.trim();
    return trimmed ? { kind: "typed", name: trimmed } : null;
  }, [clientOptions, value.client, value.clientId]);

  const syncClientSelection = useCallback(
    (option: ClientPickerOption | null) => {
      if (!option) {
        setClientDraft("");
        onChange({ client: "" });
        return;
      }

      if (isTypedClientOption(option)) {
        setClientDraft(option.name);
        onChange({ client: option.name });
        return;
      }

      setClientDraft(option.name);
      onChange({ clientId: option.id, client: option.name });
    },
    [onChange],
  );

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>
        Owner
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <div
        className={cn(inputBase, controlHeight.md, "import-project-picker overflow-hidden px-0 py-0")}
        onFocus={() => {
          void refreshClients();
        }}
      >
        <SearchSelect<ClientPickerOption>
          options={clientPickerOptions}
          value={selectedClientOption}
          onValueChange={syncClientSelection}
          onQueryChange={setClientDraft}
          displayFn={displayClientOption}
          renderOption={renderClientOption}
          placeholder="Search or select owner…"
          searchPlaceholder="Search owners…"
          noResultsText="No matching owners"
          disabled={disabled}
          className="w-full"
          overlayPanelClass="proj-filter-select-overlay import-project-picker-overlay"
        />
      </div>
    </div>
  );
}
