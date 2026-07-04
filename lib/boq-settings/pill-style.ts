import type { CSSProperties } from "react";

import type { BoqLookupTone } from "@/application/dto/boq/boqLookupOptionDto";
import { BOQ_LOOKUP_TONES } from "@/application/dto/boq/boqLookupOptionDto";

type PillStyleVars = CSSProperties & {
  "--boq-pill-fg"?: string;
  "--boq-pill-border"?: string;
  "--boq-pill-bg"?: string;
};

/** ABRD tender-project pill tone palette — see app-theme-system.css */
const TONE_COLORS: Record<BoqLookupTone, string> = {
  green: "rgb(168 202 119)",
  yellow: "rgb(224 185 94)",
  red: "rgb(223 126 120)",
  blue: "rgb(126 163 232)",
  purple: "rgb(176 141 228)",
  teal: "rgb(137 196 191)",
  orange: "rgb(214 157 104)",
  gray: "rgb(202 207 214)",
};

function normalizeTone(value: string | null | undefined): BoqLookupTone | null {
  if (!value) return null;
  const key = value.trim().toLowerCase();
  if (key === "grey") return "gray";
  return (BOQ_LOOKUP_TONES as readonly string[]).includes(key) ? (key as BoqLookupTone) : null;
}

function normalizeHex(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;
  const hex = raw.startsWith("#") ? raw : `#${raw}`;
  return /^#([0-9a-fA-F]{3}){1,2}$/.test(hex) ? hex.toLowerCase() : null;
}

/** Mirrors ABRD getTenderProjectPillStyle — greyed surface + tone foreground. */
export function getBoqLookupPillStyle(
  tone?: string | null,
  customHex?: string | null,
): PillStyleVars {
  const normalizedCustomHex = normalizeHex(customHex);
  if (normalizedCustomHex) {
    return {
      "--boq-pill-fg": normalizedCustomHex,
      "--boq-pill-border": `color-mix(in oklab, ${normalizedCustomHex} 22%, transparent)`,
      "--boq-pill-bg": `color-mix(in oklab, ${normalizedCustomHex} 10%, var(--boq-pill-surface-base))`,
    };
  }

  const normalizedTone = normalizeTone(tone);
  if (!normalizedTone) {
    return {};
  }

  if (normalizedTone === "gray") {
    return {
      "--boq-pill-fg": TONE_COLORS.gray,
      "--boq-pill-border": "var(--boq-pill-border-base)",
      "--boq-pill-bg": "var(--boq-pill-surface-base)",
    };
  }

  return {
    "--boq-pill-fg": TONE_COLORS[normalizedTone],
  };
}

export function hasBoqLookupPillTone(tone?: string | null, customHex?: string | null): boolean {
  if (normalizeHex(customHex)) return true;
  const normalizedTone = normalizeTone(tone);
  return normalizedTone != null && normalizedTone !== "gray";
}

export function getTonePreviewColor(
  tone: BoqLookupTone | "" | null,
  customHex: string,
  mode: "preset" | "custom",
): string {
  if (mode === "custom") {
    return normalizeHex(customHex) ?? "transparent";
  }
  const normalized = normalizeTone(tone);
  if (!normalized) return "transparent";
  return TONE_COLORS[normalized];
}

export function getToneDotClassName(tone: BoqLookupTone | "" | null): string {
  const normalized = normalizeTone(tone);
  if (!normalized) return "none";
  return `tone-${normalized}`;
}
