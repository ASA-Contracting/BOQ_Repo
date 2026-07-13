"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import type { ClientListItemDto } from "@/application/dto/client/clientDto";
import type { ProjectListItemDto } from "@/application/dto/project/projectDto";
import { SearchSelect } from "@/components/filter-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/typography";
import { controlHeight, inputBase } from "@/lib/design/interactive";
import { cn } from "@/lib/utils";

import "@/styles/abrd-search-select.css";
import "@/styles/import-project-picker.css";

export type ProjectNameSelection = {
  name: string;
  projectId?: number;
  clientId?: number;
  client?: string;
  isNew?: boolean;
};

type PickerOption =
  | { kind: "existing"; id: number; name: string; client: string; clientId?: number | null }
  | { kind: "new"; name: string }
  | { kind: "create" };

type PickerMode = "select" | "create";

type Props = {
  id?: string;
  value: ProjectNameSelection;
  onChange: (value: ProjectNameSelection) => void;
  projects: ProjectListItemDto[];
  disabled?: boolean;
  /** When set, "Add new project" opens this callback instead of the inline create panel. */
  onRequestCreate?: (draftName: string) => void;
};

const CREATE_OPTION: PickerOption = { kind: "create" };

function toPickerOption(project: ProjectListItemDto): PickerOption {
  return {
    kind: "existing",
    id: project.id,
    name: project.name,
    client: project.client,
    clientId: project.clientId,
  };
}

function displayOption(option: PickerOption | null): string {
  if (!option) return "";
  if (option.kind === "create") {
    return "Add new project…";
  }
  if (option.kind === "new") {
    return `Create "${option.name}" on import`;
  }
  return option.client && option.client !== "TBD"
    ? `${option.name} — ${option.client}`
    : option.name;
}

function selectionFromOption(option: PickerOption): ProjectNameSelection {
  if (option.kind === "create") {
    return { name: "", isNew: true };
  }
  if (option.kind === "new") {
    return { name: option.name, isNew: true };
  }
  return {
    name: option.name,
    projectId: option.id,
    clientId: option.clientId ?? undefined,
    client: option.client,
  };
}

function optionFromSelection(
  selection: ProjectNameSelection,
  projects: ProjectListItemDto[],
  mode: PickerMode,
): PickerOption | null {
  if (mode === "create") {
    return null;
  }

  if (selection.projectId) {
    const match = projects.find((project) => project.id === selection.projectId);
    if (match) {
      return toPickerOption(match);
    }
    return {
      kind: "existing",
      id: selection.projectId,
      name: selection.name,
      client: selection.client ?? "TBD",
    };
  }

  if (selection.name.trim() && !selection.isNew) {
    return { kind: "new", name: selection.name.trim() };
  }

  return null;
}

function filterProjects(projects: ProjectListItemDto[], query: string): ProjectListItemDto[] {
  const term = query.trim().toLowerCase();
  if (!term) {
    return projects;
  }

  return projects.filter((project) => {
    const haystack = `${project.name} ${project.client}`.toLowerCase();
    return haystack.includes(term);
  });
}

type ClientPickerOption = { id: number; name: string } | { kind: "typed"; name: string };

function filterClients(clients: ClientListItemDto[], query: string): ClientListItemDto[] {
  const term = query.trim().toLowerCase();
  if (!term) {
    return clients;
  }

  return clients.filter((client) => client.name.toLowerCase().includes(term));
}

function displayClientOption(option: ClientPickerOption | null): string {
  if (!option) return "";
  return option.name;
}

function isCreateOption(option: PickerOption): boolean {
  return option.kind === "create";
}

function isSamePickerOption(left: PickerOption | null, right: PickerOption | null): boolean {
  if (left === right) return true;
  if (!left || !right) return false;
  if (left.kind !== right.kind) return false;
  if (left.kind === "create") return true;
  if (left.kind === "new" && right.kind === "new") {
    return left.name.toLowerCase() === right.name.toLowerCase();
  }
  if (left.kind === "existing" && right.kind === "existing") {
    return left.id === right.id;
  }
  return false;
}

function renderProjectOption(option: PickerOption, { isSelected }: { isSelected: boolean }) {
  if (option.kind === "create") {
    return (
      <span className="import-project-option-create">Add new project…</span>
    );
  }

  if (option.kind === "new") {
    return (
      <span className="import-project-option-text">
        <span className="import-project-option-primary">Create &ldquo;{option.name}&rdquo;</span>
        <span className="import-project-option-secondary">New project on import</span>
      </span>
    );
  }

  const sublabel =
    option.client && option.client !== "TBD" ? option.client : "Owner/Contractor TBD";

  return (
    <>
      {isSelected ? (
        <Check className="import-project-option-check" aria-hidden />
      ) : (
        <span className="import-project-option-dot" aria-hidden />
      )}
      <span className="import-project-option-text">
        <span className="import-project-option-primary">{option.name}</span>
        <span className="import-project-option-secondary">{sublabel}</span>
      </span>
    </>
  );
}

function isTypedClientOption(
  option: ClientPickerOption,
): option is { kind: "typed"; name: string } {
  return "kind" in option && option.kind === "typed";
}

export function ProjectNamePicker({
  id = "project-name",
  value,
  onChange,
  projects,
  disabled = false,
  onRequestCreate,
}: Props) {
  const useExternalCreate = Boolean(onRequestCreate);
  const [mode, setMode] = useState<PickerMode>(
    () =>
      !useExternalCreate && value.isNew && !value.projectId ? "create" : "select",
  );
  const [localProjects, setLocalProjects] = useState(projects);
  const [draftName, setDraftName] = useState(value.name);
  const [createName, setCreateName] = useState(value.name);
  const [createClient, setCreateClient] = useState(value.client ?? "");
  const [createClientId, setCreateClientId] = useState<number | undefined>(value.clientId);
  const [clientOptions, setClientOptions] = useState<ClientListItemDto[]>([]);
  const [clientDraft, setClientDraft] = useState(value.client ?? "");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  useEffect(() => {
    setDraftName(value.name);
  }, [value.name, value.projectId]);

  useEffect(() => {
    if (value.projectId) {
      setMode("select");
      return;
    }
    if (value.isNew && !onRequestCreate) {
      setMode("create");
      setCreateName(value.name);
      if (value.client) {
        setCreateClient(value.client);
        setClientDraft(value.client);
      }
      if (value.clientId) {
        setCreateClientId(value.clientId);
      }
    }
  }, [
    onRequestCreate,
    value.client,
    value.clientId,
    value.isNew,
    value.name,
    value.projectId,
  ]);

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

  const refreshProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/projects?page=1&pageSize=1500");
      const json = (await response.json()) as {
        data?: ProjectListItemDto[];
      };
      if (response.ok && Array.isArray(json.data)) {
        setLocalProjects(json.data);
      }
    } catch {
      // Keep the server-provided list when refresh fails.
    }
  }, []);

  const filteredProjects = useMemo(
    () => filterProjects(localProjects, draftName),
    [draftName, localProjects],
  );

  const selectedOption = useMemo(
    () => optionFromSelection(value, localProjects, mode),
    [localProjects, mode, value],
  );

  const filteredClients = useMemo(
    () => filterClients(clientOptions, clientDraft),
    [clientDraft, clientOptions],
  );

  const selectedClientOption = useMemo((): ClientPickerOption | null => {
    if (createClientId) {
      const match = clientOptions.find((client) => client.id === createClientId);
      if (match) {
        return { id: match.id, name: match.name };
      }
    }

    const trimmed = createClient.trim();
    return trimmed ? { kind: "typed", name: trimmed } : null;
  }, [clientOptions, createClient, createClientId]);

  const clientPickerOptions = useMemo(() => {
    const existing = filteredClients.map((client) => ({ id: client.id, name: client.name }));
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
  }, [clientDraft, filteredClients]);

  const syncClientSelection = useCallback(
    (option: ClientPickerOption | null) => {
      if (!option) {
        setCreateClient("");
        setCreateClientId(undefined);
        setClientDraft("");
        onChange({ name: createName.trim(), isNew: true });
        return;
      }

      if (isTypedClientOption(option)) {
        setCreateClient(option.name);
        setCreateClientId(undefined);
        setClientDraft(option.name);
        onChange({
          name: createName.trim(),
          isNew: true,
          client: option.name,
        });
        return;
      }

      setCreateClient(option.name);
      setCreateClientId(option.id);
      setClientDraft(option.name);
      onChange({
        name: createName.trim(),
        isNew: true,
        clientId: option.id,
        client: option.name,
      });
    },
    [createName, onChange],
  );

  const options = useMemo(() => {
    const existing = filteredProjects.map(toPickerOption);
    const term = draftName.trim();
    const next: PickerOption[] = [...existing];

    if (term) {
      const exactMatch = filteredProjects.some(
        (project) => project.name.toLowerCase() === term.toLowerCase(),
      );
      if (!exactMatch) {
        next.unshift({ kind: "new", name: term });
      }
    }

    next.push(CREATE_OPTION);
    return next;
  }, [draftName, filteredProjects]);

  const openCreatePanel = useCallback(
    (name = "") => {
      const trimmed = name.trim();
      if (onRequestCreate) {
        onRequestCreate(trimmed);
        return;
      }
      setMode("create");
      setCreateName(trimmed);
      setCreateClient("");
      setCreateClientId(undefined);
      setClientDraft("");
      setCreateError(null);
      onChange({ name: trimmed, isNew: true });
      setDraftName(trimmed);
    },
    [onChange, onRequestCreate],
  );

  const commitDraft = useCallback(
    (name: string) => {
      if (mode === "create") {
        return;
      }

      const trimmed = name.trim();
      if (!trimmed) {
        onChange({ name: "" });
        return;
      }

      const match = localProjects.find(
        (project) => project.name.toLowerCase() === trimmed.toLowerCase(),
      );
      if (match) {
        onChange({
          name: match.name,
          projectId: match.id,
          clientId: match.clientId ?? undefined,
          client: match.client,
        });
        return;
      }

      openCreatePanel(trimmed);
    },
    [localProjects, mode, onChange, openCreatePanel],
  );

  const handleCreateProject = useCallback(async () => {
    const name = createName.trim();
    const client = createClient.trim();

    if (!name || !client) {
      setCreateError("Project name and Owner/Contractor are required.");
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const response = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          createClientId
            ? { name, clientId: createClientId }
            : { name, client },
        ),
      });
      const json = (await response.json()) as {
        data?: ProjectListItemDto;
        error?: { message?: string };
      };

      if (!response.ok || !json.data) {
        setCreateError(json.error?.message ?? "Failed to create project.");
        return;
      }

      const created = json.data;
      setLocalProjects((current) =>
        [...current, created].sort((left, right) => left.name.localeCompare(right.name)),
      );
      setMode("select");
      onChange({
        name: created.name,
        projectId: created.id,
        clientId: created.clientId ?? undefined,
        client: created.client,
      });
      setDraftName(created.name);
    } catch {
      setCreateError("Failed to create project.");
    } finally {
      setCreating(false);
    }
  }, [createClient, createClientId, createName, onChange]);

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Project name</Label>

      {mode === "select" ? (
        <div
          className={cn(inputBase, controlHeight.md, "import-project-picker overflow-hidden px-0 py-0")}
          onFocus={() => {
            void refreshProjects();
          }}
          onBlur={(event) => {
            if (event.currentTarget.contains(event.relatedTarget as Node)) {
              return;
            }
            commitDraft(draftName);
          }}
          onClick={(event) => {
            if (disabled) return;
            const target = event.target as HTMLElement;
            if (target.closest(".ss-caret-trigger") || target.closest(".ss-inline-input")) {
              return;
            }
            const input = event.currentTarget.querySelector<HTMLInputElement>(".ss-inline-input");
            input?.focus();
          }}
        >
          <SearchSelect<PickerOption>
            options={options}
            value={selectedOption}
            isOptionEqual={isSamePickerOption}
            renderOption={renderProjectOption}
            onValueChange={(option) => {
              if (!option) {
                onChange({ name: "" });
                setDraftName("");
                return;
              }

              if (option.kind === "create" || option.kind === "new") {
                openCreatePanel(option.kind === "new" ? option.name : draftName);
                return;
              }

              const next = selectionFromOption(option);
              setMode("select");
              onChange(next);
              setDraftName(next.name);
            }}
            onQueryChange={setDraftName}
            displayFn={displayOption}
            getOptionClassName={(option) => (isCreateOption(option) ? "create-option" : "")}
            isPinnedOption={isCreateOption}
            placeholder="Search or select a project…"
            searchPlaceholder="Search projects…"
            noResultsText="No matching projects"
            disabled={disabled}
            className="w-full"
            overlayPanelClass="proj-filter-select-overlay import-project-picker-overlay"
          />
        </div>
      ) : (
        <div className="import-project-create-panel space-y-3 p-3">
          <div className="flex items-center justify-between gap-2">
            <Text size="sm" weight="semibold">
              New project
            </Text>
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
              disabled={disabled || creating}
              onClick={() => {
                setMode("select");
                setCreateError(null);
                onChange({ name: "" });
                setDraftName("");
              }}
            >
              Back to list
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor={`${id}-create-name`}>Project name</Label>
              <Input
                id={`${id}-create-name`}
                value={createName}
                disabled={disabled || creating}
                maxLength={150}
                onChange={(event) => {
                  const nextName = event.target.value;
                  setCreateName(nextName);
                  onChange({ name: nextName, isNew: true, client: createClient.trim() || undefined });
                }}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`${id}-create-client`}>Owner/Contractor</Label>
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
                  placeholder="Search or select Owner/Contractor…"
                  searchPlaceholder="Search clients…"
                  noResultsText="No matching Owner/Contractor"
                  disabled={disabled || creating}
                  className="w-full"
                  overlayPanelClass="proj-filter-select-overlay import-project-picker-overlay"
                />
              </div>
            </div>
          </div>

          {createError ? (
            <Text className="text-destructive text-sm">{createError}</Text>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={disabled || creating}
              onClick={() => void handleCreateProject()}
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create & select"
              )}
            </Button>
          </div>
        </div>
      )}

      <Text variant="muted" size="xs">
        {useExternalCreate
          ? "Search the master project list, or choose Add new project to open the create dialog."
          : mode === "create"
            ? "Create the project here, or go back to pick an existing one from the master list."
            : "Search the master project list, or choose Add new project from the dropdown to create one before import."}
      </Text>
    </div>
  );
}
