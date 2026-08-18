"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[] | null>(
    null
  );

  function loadNotifications() {
    fetch("/api/account/notifications")
      .then((res) => res.json())
      .then((data) => setNotifications(data))
      .catch(() => setNotifications([]));
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markOneRead(id: string) {
    await fetch(`/api/account/notifications/${id}`, { method: "PUT" });
    loadNotifications();
  }

  async function markAllRead() {
    await fetch("/api/account/notifications", { method: "PUT" });
    loadNotifications();
  }

  const hasUnread = notifications?.some((n) => !n.read);

  return (
    <div className="rounded-3xl border border-neutral-200/70 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Notifications</h2>

        {hasUnread && (
          <button
            onClick={markAllRead}
            className="text-sm font-semibold text-brand-600 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications === null ? (
        <p className="text-neutral-500">Loading...</p>
      ) : notifications.length === 0 ? (
        <div className="py-10 text-center">
          <BellOff className="mx-auto h-10 w-10 text-neutral-300" />
          <p className="mt-3 text-neutral-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => !notification.read && markOneRead(notification.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
                notification.read
                  ? "border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                  : "border-brand-200 bg-brand-50 dark:border-brand-900/40 dark:bg-brand-900/10"
              )}
            >
              <Bell
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  notification.read ? "text-neutral-300" : "text-brand-600"
                )}
              />

              <div>
                <p className="text-sm text-neutral-800 dark:text-neutral-100">
                  {notification.message}
                </p>
                <p className="mt-1 text-xs text-neutral-400">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
