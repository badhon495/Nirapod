"use client";

import Link from "next/link";
import { Bell, CheckCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  useNotifications,
  useMarkAllRead,
  useMarkRead,
} from "@/hooks/useNotifications";
import type { Notification } from "@/types/notification";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

const TYPE_ICONS: Record<string, string> = {
  STATUS_UPDATE: "📋",
  NEW_COMMENT: "💬",
  FOLLOWER: "🔔",
  LOGIN_ALERT: "🔑",
};

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  const content = (
    <div
      className={`flex gap-3 rounded-lg p-3 transition-colors duration-150 ${
        notification.read ? "bg-transparent" : "bg-muted/60"
      }`}
    >
      <span className="mt-0.5 text-base shrink-0" aria-hidden="true">
        {TYPE_ICONS[notification.type] ?? "🔔"}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${notification.read ? "" : "font-medium"}`}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-1">{formatDate(notification.createdAt)}</p>
      </div>
      {!notification.read && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
      )}
    </div>
  );

  function handleClick() {
    if (!notification.read) onRead(notification.id);
  }

  if (notification.complaintId) {
    return (
      <Link
        href={`/complaint/${notification.complaintId}`}
        onClick={handleClick}
        className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={notification.title}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="w-full text-left rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={notification.title}
    >
      {content}
    </button>
  );
}

export function NotificationsView() {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNotifications();
  const markAllRead = useMarkAllRead();
  const markRead = useMarkRead();

  const notifications = data?.pages.flatMap((p) => p.content) ?? [];
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Bell size={18} aria-hidden="true" />
          Notifications
        </h1>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            aria-label="Mark all notifications as read"
          >
            <CheckCheck size={14} aria-hidden="true" />
            Mark all read
          </Button>
        )}
      </div>

      <Separator />

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertCircle size={36} className="text-red-500" aria-hidden="true" />
          <p className="text-sm text-red-600">Failed to load notifications</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <Bell size={36} aria-hidden="true" />
          <p className="text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onRead={(id) => markRead.mutate(id)}
            />
          ))}
          {hasNextPage && (
            <div className="pt-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
