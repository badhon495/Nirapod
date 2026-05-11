"use client";

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import api from "@/lib/axios";
import type {
  ComplaintDetail,
  ComplaintSummary,
  ComplaintCreatePayload,
  ComplaintFeedParams,
  PageResponse,
} from "@/types/complaint";
import type { ComplaintStatus } from "@/types/complaint";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const complaintKeys = {
  all: ["complaints"] as const,
  feed: (params: ComplaintFeedParams) => ["complaints", "feed", params] as const,
  detail: (id: string) => ["complaints", "detail", id] as const,
  tracking: (trackingId: number) => ["complaints", "track", trackingId] as const,
  userComplaints: (userId: string) => ["complaints", "user", userId] as const,
  my: () => ["complaints", "my"] as const,
};

// ─── Feed (infinite scroll) ───────────────────────────────────────────────────

export function useComplaintFeed(params: Omit<ComplaintFeedParams, "page">) {
  return useInfiniteQuery<PageResponse<ComplaintSummary>>({
    queryKey: complaintKeys.feed(params),
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await api.get<PageResponse<ComplaintSummary>>(
        "/api/v1/complaints",
        {
          params: {
            ...params,
            page: pageParam,
            size: params.size ?? 20,
            sort: params.sort ?? "createdAt,desc",
          },
        }
      );
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.last ? undefined : last.number + 1,
  });
}

// ─── Complaint detail ─────────────────────────────────────────────────────────

export function useComplaint(id: string) {
  return useQuery<ComplaintDetail>({
    queryKey: complaintKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<ComplaintDetail>(`/api/v1/complaints/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// ─── Tracking (public) ────────────────────────────────────────────────────────

export function useComplaintByTrackingId(trackingId: number | null) {
  return useQuery<ComplaintDetail>({
    queryKey: complaintKeys.tracking(trackingId ?? 0),
    queryFn: async () => {
      const { data } = await api.get<ComplaintDetail>(
        `/api/v1/complaints/track/${trackingId}`
      );
      return data;
    },
    enabled: !!trackingId,
  });
}

// ─── User complaints ──────────────────────────────────────────────────────────

export function useMyComplaints(page = 0, size = 20) {
  return useQuery<PageResponse<ComplaintSummary>>({
    queryKey: [...complaintKeys.my(), page],
    queryFn: async () => {
      const { data } = await api.get<PageResponse<ComplaintSummary>>(
        "/api/v1/complaints/my",
        { params: { page, size, sort: "createdAt,desc" } }
      );
      return data;
    },
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export function useCreateComplaint() {
  const qc = useQueryClient();
  return useMutation<ComplaintDetail, Error, ComplaintCreatePayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ComplaintDetail>(
        "/api/v1/complaints",
        payload
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: complaintKeys.all });
    },
  });
}

// ─── Status update ────────────────────────────────────────────────────────────

export function useUpdateComplaintStatus(id: string) {
  const qc = useQueryClient();
  return useMutation<
    ComplaintDetail,
    Error,
    { status: ComplaintStatus; note?: string }
  >({
    mutationFn: async (payload) => {
      const { data } = await api.put<ComplaintDetail>(
        `/api/v1/complaints/${id}/status`,
        payload
      );
      return data;
    },
    onSuccess: (updated) => {
      qc.setQueryData(complaintKeys.detail(id), updated);
      qc.invalidateQueries({ queryKey: complaintKeys.all });
    },
  });
}

// ─── Authority note ───────────────────────────────────────────────────────────

export function useUpdateAuthorityNote(id: string) {
  const qc = useQueryClient();
  return useMutation<ComplaintDetail, Error, { note: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.put<ComplaintDetail>(
        `/api/v1/complaints/${id}/note`,
        payload
      );
      return data;
    },
    onSuccess: (updated) => {
      qc.setQueryData(complaintKeys.detail(id), updated);
    },
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function useDeleteComplaint() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/api/v1/complaints/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: complaintKeys.all });
    },
  });
}
