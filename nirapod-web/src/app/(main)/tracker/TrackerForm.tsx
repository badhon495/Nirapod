"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MapPin, Calendar, Hash, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { StatusBadge, UrgencyBadge } from "@/components/complaint/StatusBadge";
import { useComplaintByTrackingId } from "@/hooks/useComplaints";

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

export function TrackerForm() {
  const [inputValue, setInputValue] = useState("");
  const [trackingId, setTrackingId] = useState<number | null>(null);

  const { data: complaint, isLoading, isError } = useComplaintByTrackingId(trackingId);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(inputValue.trim(), 10);
    if (!isNaN(parsed) && parsed > 0) {
      setTrackingId(parsed);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="space-y-3">
        <div>
          <Label htmlFor="trackingId">Tracking ID</Label>
          <div className="mt-1.5 flex gap-2">
            <Input
              id="trackingId"
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter your tracking ID"
              min={1}
              className="flex-1"
              aria-describedby="trackingId-hint"
            />
            <Button type="submit" disabled={!inputValue || isLoading} className="gap-1">
              <Search size={16} aria-hidden="true" />
              {isLoading ? "Searching…" : "Search"}
            </Button>
          </div>
          <p id="trackingId-hint" className="mt-1 text-xs text-muted-foreground">
            Your tracking ID was shown when you submitted the complaint.
          </p>
        </div>
      </form>

      {isError && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={16} aria-hidden="true" />
          No complaint found for tracking ID <strong>{trackingId}</strong>. Please check the number and try again.
        </div>
      )}

      {complaint && (
        <div className="rounded-md border p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={complaint.status} />
            <UrgencyBadge urgency={complaint.urgency} />
            <span className="text-xs text-muted-foreground">
              {CATEGORY_LABELS[complaint.category] ?? complaint.category}
            </span>
          </div>

          <h2 className="font-semibold leading-snug">{complaint.title}</h2>

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin size={11} aria-hidden="true" />
              {complaint.area}, {complaint.district}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={11} aria-hidden="true" />
              {formatDate(complaint.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Hash size={11} aria-hidden="true" />
              #{complaint.trackingId}
            </span>
          </div>

          {complaint.resolvedAt && (
            <p className="text-xs text-green-700">
              Resolved on {formatDate(complaint.resolvedAt)}
            </p>
          )}

          {complaint.authorityNote && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Authority Note</p>
                <p className="text-sm">{complaint.authorityNote}</p>
              </div>
            </>
          )}

          {complaint.statusHistory.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Status Updates</p>
                <ol className="space-y-2">
                  {complaint.statusHistory.map((h) => (
                    <li key={h.id} className="flex gap-2 text-xs">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" aria-hidden="true" />
                      <span>
                        <span className="font-medium">{h.newStatus}</span>
                        <span className="text-muted-foreground"> · {formatDate(h.createdAt)}</span>
                        {h.note && <span className="block text-muted-foreground mt-0.5">{h.note}</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}

          <Button variant="outline" size="sm" asChild className="w-full">
            <Link href={`/complaint/${complaint.id}`}>View full details</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
