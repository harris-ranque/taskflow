"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

type NotificationType = "success" | "error" | "info";

type Notification = {
  id: string;
  message: string;
  type: NotificationType;
};

type NotifyOptions = {
  type?: NotificationType;
  durationMs?: number;
};

type NotificationsContextValue = {
  notify: (message: string, options?: NotifyOptions) => void;
};

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

function toastClasses(type: NotificationType): string {
  if (type === "success") {
    return "border-green-300 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300";
  }
  if (type === "error") {
    return "border-red-300 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300";
  }
  return "border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200";
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((message: string, options?: NotifyOptions) => {
    const id = crypto.randomUUID();
    const type = options?.type ?? "info";
    const durationMs = options?.durationMs ?? 3500;

    setNotifications((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    }, durationMs);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {notifications.map((item) => (
          <div
            className={`rounded-md border px-3 py-2 text-sm shadow-md ${toastClasses(item.type)}`}
            key={item.id}
            role="status"
          >
            {item.message}
          </div>
        ))}
      </div>
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return context;
}
