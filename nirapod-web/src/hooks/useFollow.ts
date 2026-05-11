"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { FollowStatus } from "@/types/notification";

export const followKeys = {
  status: (complaintId: string) => ["follow", complaintId] as const,
};

export function useFollowStatus(complaintId: string, enabled = true) {
  return useQuery<FollowStatus>({
    queryKey: followKeys.status(complaintId),
    queryFn: async () => {
      const { data } = await api.get<FollowStatus>(
        `/api/v1/complaints/${complaintId}/follow`
      );
      return data;
    },
    enabled,
  });
}

export function useToggleFollow(complaintId: string) {
  const qc = useQueryClient();
  return useMutation<FollowStatus, Error, boolean>({
    mutationFn: async (currentlyFollowing) => {
      if (currentlyFollowing) {
        const { data } = await api.delete<FollowStatus>(
          `/api/v1/complaints/${complaintId}/follow`
        );
        return data;
      } else {
        const { data } = await api.post<FollowStatus>(
          `/api/v1/complaints/${complaintId}/follow`
        );
        return data;
      }
    },
    onMutate: async (currentlyFollowing) => {
      await qc.cancelQueries({ queryKey: followKeys.status(complaintId) });
      const previous = qc.getQueryData<FollowStatus>(followKeys.status(complaintId));
      qc.setQueryData<FollowStatus>(followKeys.status(complaintId), (old) =>
        old
          ? {
              following: !currentlyFollowing,
              followerCount: old.followerCount + (currentlyFollowing ? -1 : 1),
            }
          : old
      );
      return { previous };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.previous) {
        qc.setQueryData(followKeys.status(complaintId), ctx.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: followKeys.status(complaintId) });
    },
  });
}
