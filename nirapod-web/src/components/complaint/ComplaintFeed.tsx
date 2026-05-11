"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ComplaintCard, ComplaintCardSkeleton } from "./ComplaintCard";
import { useComplaintFeed } from "@/hooks/useComplaints";
import type { ComplaintCategory, ComplaintStatus } from "@/types/complaint";

export function ComplaintFeed() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") as ComplaintCategory | undefined;
  const status = searchParams.get("status") as ComplaintStatus | undefined;
  const district = searchParams.get("district") ?? undefined;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useComplaintFeed({ category, status, district });

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ComplaintCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        Failed to load complaints. Please try again.
      </div>
    );
  }

  const allComplaints = data?.pages.flatMap((p) => p.content) ?? [];

  if (allComplaints.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-12 text-center text-sm text-muted-foreground">
        No complaints found for the selected filters.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {allComplaints.map((c) => (
          <ComplaintCard key={c.id} complaint={c} />
        ))}
      </div>

      <div ref={sentinelRef} className="mt-4 flex justify-center" aria-hidden="true">
        {isFetchingNextPage && (
          <Loader2 size={20} className="animate-spin text-muted-foreground" aria-label="Loading more" />
        )}
      </div>
    </>
  );
}
