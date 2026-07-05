import type { Permission } from "@/domain/shared/Permission";
import type { Role } from "@/domain/shared/Role";

export const PERMISSION_LABELS: Record<
  Permission,
  { label: string; description: string }
> = {
  view_production: {
    label: "View production",
    description: "Read projects, BOQs, and production data.",
  },
  publish_production: {
    label: "Publish to production",
    description: "Write approved Family assignments to production BOQ lines.",
  },
  close_project: {
    label: "Close project",
    description: "Mark projects as closed.",
  },
  workshop_import: {
    label: "Import to Workshop",
    description: "Import BOQ files and create Workshop batches.",
  },
  workshop_review: {
    label: "Workshop review",
    description: "Review and edit lines in the Workshop.",
  },
  workshop_categorization_approval: {
    label: "Approve categorization",
    description: "Approve Family categorization inside the Workshop.",
  },
  family_admin: {
    label: "Manage Families",
    description: "Create, edit, and delete Family records.",
  },
  user_admin: {
    label: "User administration",
    description: "Invite users and manage roles.",
  },
  audit_archival: {
    label: "Audit archival",
    description: "Archive audit records.",
  },
  view_reports: {
    label: "View reports",
    description: "Access read-only dashboards and exports.",
  },
};

export const ROLE_LABELS: Record<
  Role,
  { label: string; description: string }
> = {
  system_administrator: {
    label: "System Administrator",
    description: "Platform administration, users, Families, publish, and audit.",
  },
  general_manager: {
    label: "General Manager",
    description: "Upload BOQs, approve versions, publish, close projects, and reporting.",
  },
  technical_office_manager: {
    label: "Technical Office Manager",
    description: "Upload BOQs, approve versions, publish, and reporting.",
  },
  estimator: {
    label: "Estimator",
    description: "Upload BOQs, classify lines in draft, and submit for approval — no publish.",
  },
  viewer: {
    label: "Viewer",
    description: "Read-only access to production and reports.",
  },
};

export function formatRoleLabel(role: Role): string {
  return ROLE_LABELS[role].label;
}

export function formatPermissionLabel(permission: Permission): string {
  return PERMISSION_LABELS[permission].label;
}
