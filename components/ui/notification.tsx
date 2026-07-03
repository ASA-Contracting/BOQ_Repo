"use client";

import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";
import { useEffect } from "react";

import { cn } from "@/lib/utils";

export type NotificationVariant = "default" | "success" | "error" | "warning" | "info";

export type Notification = {
  id: string;
  message: string;
  variant?: NotificationVariant;
  durationMs?: number;
};

type NotificationItemProps = {
  notification: Notification;
  onDismiss: (id: string) => void;
};

const variantStyles: Record<
  NotificationVariant,
  { icon: typeof CheckCircle2; iconClass: string; borderClass: string }
> = {
  default: {
    icon: CheckCircle2,
    iconClass: "text-foreground",
    borderClass: "border-border",
  },
  success: {
    icon: CheckCircle2,
    iconClass: "text-success",
    borderClass: "border-success/20",
  },
  error: {
    icon: AlertCircle,
    iconClass: "text-destructive",
    borderClass: "border-destructive/20",
  },
  warning: {
    icon: TriangleAlert,
    iconClass: "text-warning-foreground",
    borderClass: "border-warning/30",
  },
  info: {
    icon: Info,
    iconClass: "text-info",
    borderClass: "border-info/20",
  },
};

export function NotificationItem({
  notification,
  onDismiss,
}: NotificationItemProps) {
  const variant = notification.variant ?? "default";
  const { icon: Icon, iconClass, borderClass } = variantStyles[variant];
  const durationMs = notification.durationMs ?? 4000;

  useEffect(() => {
    const timer = window.setTimeout(
      () => onDismiss(notification.id),
      durationMs,
    );
    return () => window.clearTimeout(timer);
  }, [durationMs, notification.id, onDismiss]);

  return (
    <div
      className={cn(
        "pointer-events-auto flex min-w-[18rem] max-w-sm items-start gap-2.5 rounded-md border bg-background px-3.5 py-3 elevation-3",
        borderClass,
      )}
      role="status"
      aria-live="polite"
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconClass)} aria-hidden />
      <p className="flex-1 text-sm text-foreground">{notification.message}</p>
      <button
        type="button"
        aria-label="Dismiss notification"
        className="focus-ring rounded-sm text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => onDismiss(notification.id)}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function NotificationStack({
  notifications,
  onDismiss,
  className,
}: {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  className?: string;
}) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col gap-2",
        className,
      )}
    >
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

/** @deprecated Use NotificationStack with useNotifications instead */
export function Toast({
  message,
  onDismiss,
  durationMs = 4000,
  className,
}: {
  message: string | null;
  onDismiss: () => void;
  durationMs?: number;
  className?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <NotificationStack
      className={className}
      notifications={[
        { id: "legacy-toast", message, durationMs, variant: "success" },
      ]}
      onDismiss={() => onDismiss()}
    />
  );
}
