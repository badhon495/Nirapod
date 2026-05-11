import { Suspense } from "react";
import type { Metadata } from "next";
import { ComplaintDetailView } from "./ComplaintDetailView";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Complaint — Nirapod`,
    description: `View complaint details and status updates.`,
  };
}

export default async function ComplaintDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-6 w-1/2 rounded bg-muted animate-pulse" />
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
        </div>
      }
    >
      <ComplaintDetailView id={id} />
    </Suspense>
  );
}
