"use client";

import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useFollowStatus, useToggleFollow } from "@/hooks/useFollow";

interface Props {
  complaintId: string;
  className?: string;
}

export function FollowButton({ complaintId, className }: Props) {
  const { data, isLoading } = useFollowStatus(complaintId);
  const toggle = useToggleFollow(complaintId);

  function handleToggle() {
    if (data === undefined) return;
    toggle.mutate(data.following, {
      onError: () => toast.error("Failed to update follow status"),
    });
  }

  if (isLoading || data === undefined) {
    return (
      <div className={`h-9 w-28 rounded-md bg-muted animate-pulse ${className ?? ""}`} aria-hidden="true" />
    );
  }

  return (
    <Button
      variant={data.following ? "secondary" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={toggle.isPending}
      className={className}
      aria-label={data.following ? "Unfollow complaint" : "Follow complaint"}
      aria-pressed={data.following}
    >
      {data.following ? (
        <BellOff size={14} aria-hidden="true" />
      ) : (
        <Bell size={14} aria-hidden="true" />
      )}
      {data.following ? "Following" : "Follow"}
      {data.followerCount > 0 && (
        <span className="ml-1 text-xs text-muted-foreground">
          {data.followerCount}
        </span>
      )}
    </Button>
  );
}
