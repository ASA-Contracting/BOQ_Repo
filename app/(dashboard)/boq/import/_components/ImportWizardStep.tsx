import { Check, CircleDashed } from "lucide-react";

import { Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

type ImportWizardStepProps = {
  step: number;
  title: string;
  description?: string;
  complete?: boolean;
  tone: "sky" | "amber" | "emerald";
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

const TONE_STYLES = {
  sky: {
    section: "border-sky-400/80 bg-sky-50 shadow-md shadow-sky-100/80",
    header: "border-b border-sky-200 bg-sky-100",
    badge: "bg-sky-600 text-white",
    badgeComplete: "bg-sky-700 text-white",
    body: "bg-white",
  },
  amber: {
    section: "border-amber-400/80 bg-amber-50 shadow-md shadow-amber-100/80",
    header: "border-b border-amber-200 bg-amber-100",
    badge: "bg-amber-600 text-white",
    badgeComplete: "bg-amber-700 text-white",
    body: "bg-white",
  },
  emerald: {
    section: "border-emerald-400/80 bg-emerald-50 shadow-md shadow-emerald-100/80",
    header: "border-b border-emerald-200 bg-emerald-100",
    badge: "bg-emerald-600 text-white",
    badgeComplete: "bg-emerald-700 text-white",
    body: "bg-white",
  },
} as const;

export function ImportWizardStep({
  step,
  title,
  description,
  complete = false,
  tone,
  className,
  style,
  children,
}: ImportWizardStepProps) {
  const styles = TONE_STYLES[tone];

  return (
    <section
      style={style}
      className={cn(
        "relative isolate flex w-full shrink-0 flex-col overflow-hidden rounded-xl border-2",
        styles.section,
        className,
      )}
    >
      <header className={cn("flex items-center gap-3 px-4 py-3", styles.header)}>
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            complete ? styles.badgeComplete : styles.badge,
          )}
        >
          {complete ? <Check className="h-3.5 w-3.5" aria-hidden /> : step}
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? (
            <Text variant="muted" size="xs" className="mt-0.5">
              {description}
            </Text>
          ) : null}
        </div>
      </header>
      <div className={cn("flex min-h-0 flex-1 flex-col gap-4 px-4 py-4", styles.body)}>{children}</div>
    </section>
  );
}

const WORKSHEET_SELECT_CLASS =
  "flex h-9 w-full rounded-md border-2 border-sky-500 bg-white px-3 text-sm font-semibold text-sky-950 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-500";

export { WORKSHEET_SELECT_CLASS };

export function RequiredFieldTracker({
  fields,
  className,
}: {
  fields: Array<{
    key: string;
    label: string;
    mapped: boolean;
    columnLetter?: string;
  }>;
  className?: string;
}) {
  const mappedCount = fields.filter((field) => field.mapped).length;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <Text size="sm" weight="semibold">
          Required fields
        </Text>
        <Text variant="muted" size="xs">
          {mappedCount} of {fields.length} mapped
        </Text>
      </div>

      <div
        className={cn(
          "grid gap-2",
          fields.length >= 5 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" : "grid-cols-4",
        )}
      >
        {fields.map((field, index) => (
          <div
            key={field.key}
            className={cn(
              "rounded-lg border-2 px-3 py-2.5 transition-colors",
              field.mapped
                ? "border-emerald-500 bg-emerald-50 text-emerald-950"
                : "border-amber-500 bg-amber-50 text-foreground ring-1 ring-amber-200",
            )}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wide",
                  field.mapped ? "text-emerald-700" : "text-amber-700",
                )}
              >
                {field.mapped ? "Done" : `Need ${index + 1}`}
              </span>
              {field.mapped ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
              ) : (
                <CircleDashed className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
              )}
            </div>
            <p
              className={cn(
                "text-sm font-semibold",
                field.mapped && "text-emerald-900",
              )}
            >
              {field.label}
            </p>
            <p className="mt-1 text-xs">
              {field.mapped && field.columnLetter ? (
                <span className="text-muted-foreground">
                  Excel col <strong className="font-bold">{field.columnLetter}</strong>
                </span>
              ) : (
                <span className="font-medium text-amber-800">Select a column below</span>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
