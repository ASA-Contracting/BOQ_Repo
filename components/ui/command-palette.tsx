"use client";

import { Search } from "lucide-react";
import * as React from "react";

import {
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

export type CommandItem = {
  id: string;
  label: string;
  group?: string;
  keywords?: string[];
  icon?: React.ReactNode;
  onSelect: () => void;
};

export type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  placeholder?: string;
  emptyMessage?: string;
  title?: string;
  description?: string;
};

export function CommandPalette({
  open,
  onOpenChange,
  items,
  placeholder = "Type a command or search…",
  emptyMessage = "No commands found.",
  title = "Command palette",
  description = "Search and run commands",
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return items;
    }
    return items.filter((item) => {
      const haystack = [item.label, ...(item.keywords ?? [])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [items, query]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const groups = React.useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const key = item.group ?? "Commands";
      const group = map.get(key) ?? [];
      group.push(item);
      map.set(key, group);
    }
    return map;
  }, [filtered]);

  const flatItems = filtered;

  const runActive = React.useCallback(() => {
    const item = flatItems[activeIndex];
    if (!item) {
      return;
    }
    item.onSelect();
    onOpenChange(false);
  }, [activeIndex, flatItems, onOpenChange]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, flatItems.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      runActive();
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="overflow-hidden p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            type="search"
            role="combobox"
            aria-expanded
            aria-controls="command-palette-list"
            aria-activedescendant={
              flatItems[activeIndex]
                ? `command-item-${flatItems[activeIndex].id}`
                : undefined
            }
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="focus-ring h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          <Kbd>Esc</Kbd>
        </div>
        <DialogBody className="max-h-80 overflow-y-auto p-0">
          <div ref={listRef} id="command-palette-list" role="listbox">
            {flatItems.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </p>
            ) : (
              Array.from(groups.entries()).map(([group, groupItems]) => (
                <div key={group} role="presentation">
                  <p className="px-3 py-1.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    {group}
                  </p>
                  {groupItems.map((item) => {
                    const index = flatItems.indexOf(item);
                    const isActive = index === activeIndex;
                    return (
                      <button
                        key={item.id}
                        id={`command-item-${item.id}`}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        className={cn(
                          "focus-ring flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                          isActive && "bg-accent text-accent-foreground",
                        )}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => {
                          item.onSelect();
                          onOpenChange(false);
                        }}
                      >
                        {item.icon ? (
                          <span className="text-muted-foreground">{item.icon}</span>
                        ) : null}
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  );
}

export function useCommandPalette(): {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
} {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    open,
    setOpen,
    toggle: () => setOpen((value) => !value),
  };
}
