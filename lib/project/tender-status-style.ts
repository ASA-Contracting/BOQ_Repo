import type { BoqLookupTone } from "@/application/dto/boq/boqLookupOptionDto";

const TENDER_STATUS_TONES: Record<string, BoqLookupTone> = {
  sent: "blue",
  lose: "red",
  "cold case": "gray",
  postponed: "orange",
  "under study": "yellow",
  new: "green",
  "done to review": "purple",
  "closed won": "green",
};

export function getTenderStatusTone(status: string | null | undefined): BoqLookupTone | null {
  if (!status?.trim()) {
    return null;
  }
  return TENDER_STATUS_TONES[status.trim().toLowerCase()] ?? "gray";
}

export function formatTenderStatusLabel(status: string | null | undefined): string {
  if (!status?.trim()) {
    return "—";
  }
  return status.trim();
}

export function formatOwnerTypeLabel(ownerType: string | null | undefined): string {
  if (!ownerType?.trim()) {
    return "—";
  }
  return ownerType.trim();
}

export function formatAssignedToLabel(assignedTo: string | null | undefined): string {
  if (!assignedTo?.trim() || assignedTo.trim().toLowerCase() === "unassigned") {
    return "Unassigned";
  }
  return assignedTo.trim();
}
