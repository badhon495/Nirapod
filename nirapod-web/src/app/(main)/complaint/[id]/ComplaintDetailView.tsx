"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, Hash, User2, AlertCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge, UrgencyBadge } from "@/components/complaint/StatusBadge";
import { PhotoGallery } from "@/components/complaint/PhotoGallery";
import { useComplaint } from "@/hooks/useComplaints";
import { useSession } from "next-auth/react";

const ComplaintMap = dynamic(
  () => import("@/components/complaint/ComplaintMap").then((m) => m.ComplaintMap),
  {
    ssr: false,
    loading: () => <div className="h-56 w-full rounded-md bg-muted animate-pulse" aria-hidden="true" />,
  }
);

const CATEGORY_LABELS: Record<string, string> = {
  POLICE: "Police",
  FIRE: "Fire Service",
  CITY: "City Corporation",
  ANIMAL: "Animal Welfare",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

interface Props {
  id: string;
}

export function ComplaintDetailView({ id }: Props) {
  const { data: complaint, isLoading, isError } = useComplaint(id);
  const { data: session } = useSession();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-1/2 rounded bg-muted animate-pulse" />
        <div className="h-4 w-full rounded bg-muted animate-pulse" />
        <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  if (isError || !complaint) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-red-200 bg-red-50 p-12 text-center">
        <AlertCircle size={40} className="text-red-500" aria-hidden="true" />
        <p className="font-medium text-red-700">Complaint not found</p>
        <Link href="/home" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Back to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/home"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
          aria-label="Back to feed"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link href="/home" className="hover:text-foreground transition-colors duration-150">Feed</Link>
          <span className="mx-1">/</span>
          <span className="text-foreground">#{complaint.trackingId}</span>
        </nav>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={complaint.status} />
          <UrgencyBadge urgency={complaint.urgency} />
          <Badge variant="outline">{CATEGORY_LABELS[complaint.category] ?? complaint.category}</Badge>
          {!complaint.isPublic && (
            <Badge variant="secondary">Private</Badge>
          )}
        </div>
        <h1 className="text-xl font-semibold leading-snug">{complaint.title}</h1>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin size={12} aria-hidden="true" />
          {complaint.area}, {complaint.district}
        </span>
        <span className="flex items-center gap-1">
          <User2 size={12} aria-hidden="true" />
          {complaint.reporterName}
        </span>
        <span className="flex items-center gap-1">
          <Calendar size={12} aria-hidden="true" />
          {formatDate(complaint.createdAt)}
        </span>
        <span className="flex items-center gap-1">
          <Hash size={12} aria-hidden="true" />
          Tracking ID: {complaint.trackingId}
        </span>
      </div>

      <Separator />

      <div className="prose prose-sm max-w-none text-sm leading-relaxed">
        {complaint.details}
      </div>

      {complaint.locationText && (
        <div className="rounded-md bg-muted p-3 text-sm">
          <span className="font-medium">Location: </span>
          {complaint.locationText}
        </div>
      )}

      {complaint.locationLat != null && complaint.locationLng != null && (
        <ComplaintMap
          lat={complaint.locationLat}
          lng={complaint.locationLng}
          locationText={complaint.locationText}
        />
      )}

      {complaint.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {complaint.tags.map((tag) => (
            <span key={tag} className="inline-block rounded-sm bg-muted px-2 py-0.5 text-xs">
              {tag}
            </span>
          ))}
        </div>
      )}

      <PhotoGallery photos={complaint.photos} />

      {complaint.authorityNote && (
        <div className="rounded-md border-l-4 border-blue-500 bg-blue-50 p-4">
          <p className="text-xs font-semibold text-blue-700 mb-1">Authority Note</p>
          <p className="text-sm text-blue-900">{complaint.authorityNote}</p>
        </div>
      )}

      {complaint.statusHistory.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3">Status History</h2>
          <ol className="space-y-3">
            {complaint.statusHistory.map((entry) => (
              <li key={entry.id} className="flex gap-3">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-muted-foreground" aria-hidden="true" />
                <div className="text-sm">
                  <span className="font-medium">{entry.oldStatus} → {entry.newStatus}</span>
                  <span className="text-muted-foreground"> · {entry.changedByName} · {formatDate(entry.createdAt)}</span>
                  {entry.note && <p className="mt-0.5 text-muted-foreground">{entry.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
