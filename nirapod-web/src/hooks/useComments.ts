"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Comment, CommentCreatePayload } from "@/types/comment";
import type { PageResponse } from "@/types/complaint";

export const commentKeys = {
  all: (complaintId: string) => ["comments", complaintId] as const,
  pages: (complaintId: string) => ["comments", complaintId, "pages"] as const,
};

export function useComments(complaintId: string) {
  return useInfiniteQuery<PageResponse<Comment>>({
    queryKey: commentKeys.pages(complaintId),
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await api.get<PageResponse<Comment>>(
        `/api/v1/complaints/${complaintId}/comments`,
        { params: { page: pageParam, size: 20, sort: "createdAt,asc" } }
      );
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
  });
}

export function useAddComment(complaintId: string) {
  const qc = useQueryClient();
  return useMutation<Comment, Error, CommentCreatePayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<Comment>(
        `/api/v1/complaints/${complaintId}/comments`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentKeys.pages(complaintId) });
    },
  });
}

export function useUpdateComment(complaintId: string, commentId: string) {
  const qc = useQueryClient();
  return useMutation<Comment, Error, CommentCreatePayload>({
    mutationFn: async (payload) => {
      const { data } = await api.put<Comment>(
        `/api/v1/complaints/${complaintId}/comments/${commentId}`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentKeys.pages(complaintId) });
    },
  });
}

export function useDeleteComment(complaintId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (commentId) => {
      await api.delete(`/api/v1/complaints/${complaintId}/comments/${commentId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentKeys.pages(complaintId) });
    },
  });
}
