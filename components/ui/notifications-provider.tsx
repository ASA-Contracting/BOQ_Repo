"use client";

import * as React from "react";

import {
  NotificationStack,
  type Notification,
  type NotificationVariant,
} from "@/components/ui/notification";

type NotificationsContextValue = {
  notify: (message: string, variant?: NotificationVariant) => void;
  dismiss: (id: string) => void;
};

const NotificationsContext =
  React.createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id),
    );
  }, []);

  const notify = React.useCallback(
    (message: string, variant: NotificationVariant = "default") => {
      const id = crypto.randomUUID();
      setNotifications((current) => [...current, { id, message, variant }]);
    },
    [],
  );

  return (
    <NotificationsContext.Provider value={{ notify, dismiss }}>
      {children}
      <NotificationStack notifications={notifications} onDismiss={dismiss} />
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const context = React.useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return context;
}
