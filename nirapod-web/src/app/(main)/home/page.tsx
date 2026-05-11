import { Suspense } from "react";
import type { Metadata } from "next";
import { ComplaintFeed } from "@/components/complaint/ComplaintFeed";
import { ComplaintFilters } from "@/components/complaint/ComplaintFilters";
import { ComplaintCardSkeleton } from "@/components/complaint/ComplaintCard";

export const metadata: Metadata = {
  title: "Feed — Nirapod",
  description: "Browse and filter public complaints reported to authorities.",
};

function FeedSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <ComplaintCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Complaints</h1>
        <p className="text-sm text-muted-foreground">
          Public reports submitted by citizens to local authorities.
        </p>
      </div>

      <Suspense fallback={<div className="h-8 w-full rounded bg-muted animate-pulse" />}>
        <ComplaintFilters />
      </Suspense>

      <Suspense fallback={<FeedSkeleton />}>
        <ComplaintFeed />
      </Suspense>
    </div>
  );
}
