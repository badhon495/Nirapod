"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
import api from "@/lib/axios";
import type { Notification } from "@/types/notification";
import type { PageResponse } from "@/types/complaint";
import { useWebSocket } from "./useWebSocket";
import { useSession } from "next-auth/react";

export const notificationKeys = {
  all: ["notifications"] as const,
  pages: () => ["notifications", "pages"] as const,
  unreadCount: () => ["notifications", "unread-count"] as const,
};

export function useNotifications() {
  return useInfiniteQuery<PageResponse<Notification>>({
    queryKey: notificationKeys.pages(),
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await api.get<PageResponse<Notification>>(
        "/api/v1/notifications",
        { params: { page: pageParam, size: 20, sort: "createdAt,desc" } }
      );
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
  });
}

export function useUnreadCount() {
  return useQuery<{ count: number }>({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const { data } = await api.get<{ count: number }>(
        "/api/v1/notifications/unread-count"
      );
      return data;
    },
    // no polling — WebSocket push triggers invalidation via useNotificationSocket
  });
}

/** Subscribe to real-time notification pushes. Call this once at layout level. */
export function useNotificationSocket() {
  const { data: session } = useSession();
  const qc = useQueryClient();

  const handleNotification = useCallback(
    (_notification: Notification) => {
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      qc.invalidateQueries({ queryKey: notificationKeys.pages() });
    },
    [qc]
  );

  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  const destination = userId ? `/user/${userId}/queue/notifications` : null;

  useWebSocket<Notification>(destination, handleNotification);
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await api.put("/api/v1/notifications/read-all");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.put(`/api/v1/notifications/${id}/read`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
