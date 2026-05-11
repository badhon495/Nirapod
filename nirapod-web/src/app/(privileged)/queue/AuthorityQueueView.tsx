"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle,
  Clock,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import api from "@/lib/axios";
import type { ComplaintSummary, ComplaintStatus, PageResponse } from "@/types/complaint";

const AUTHORITY_CATEGORY: Record<string, string> = {
  POLICE: "POLICE",
  FIRE: "FIRE",
  CITY: "CITY",
  ANIMAL: "ANIMAL",
};

const STATUS_OPTIONS: { value: ComplaintStatus; label: string }[] = [
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "SOLVED", label: "Solved" },
  { value: "UNSOLVED", label: "Revert to Unsolved" },
];

const URGENCY_COLOR: Record<string, string> = {
  HIGH: "bg-red-100 text-red-800 border-red-200",
  MEDIUM: "bg-amber-100 text-amber-800 border-amber-200",
  LOW: "bg-green-100 text-green-800 border-green-200",
};

const STATUS_COLOR: Record<string, string> = {
  UNSOLVED: "bg-slate-100 text-slate-700 border-slate-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
  SOLVED: "bg-green-100 text-green-800 border-green-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { dateStyle: "medium" });
}

function useAuthorityFeed(category: string, statusFilter: ComplaintStatus | "", page: number) {
  return useQuery<PageResponse<ComplaintSummary>>({
    queryKey: ["authority", "queue", category, statusFilter, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, size: 20, sort: "createdAt,desc" };
      if (statusFilter) params.status = statusFilter;
      // Authority users are automatically served their category feed by the backend
      const res = await api.get<PageResponse<ComplaintSummary>>("/api/v1/complaints", { params });
      return res.data;
    },
    enabled: !!category,
  });
}

function useUpdateStatus(complaintId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { status: ComplaintStatus; note?: string }>({
    mutationFn: (payload) =>
      api.put(`/api/v1/complaints/${complaintId}/status`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["authority", "queue"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });
}

function useUploadEvidence(complaintId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, File>({
    mutationFn: async (file) => {
      const form = new FormData();
      form.append("file", file);
      const { data: uploadData } = await api.post<{ publicId: string }>(
        "/api/v1/files/upload",
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return api.post(`/api/v1/complaints/${complaintId}/photos`, {
        filePublicId: uploadData.publicId,
        isEvidence: true,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["authority", "queue"] });
      toast.success("Evidence uploaded");
    },
    onError: () => toast.error("Failed to upload evidence"),
  });
}

function UpdateStatusDialog({
  complaint,
  onClose,
}: {
  complaint: ComplaintSummary;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<ComplaintStatus>(complaint.status);
  const [note, setNote] = useState("");
  const update = useUpdateStatus(complaint.id);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    update.mutate({ status, note: note.trim() || undefined }, { onSuccess: onClose });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Update status</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-sm text-muted-foreground truncate">{complaint.title}</p>
          <div className="space-y-1">
            <label htmlFor="us-status" className="text-xs font-medium">New status</label>
            <select
              id="us-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="us-note" className="text-xs font-medium">Note (optional)</label>
            <textarea
              id="us-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Add a note visible to the complainant…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={update.isPending}>Update status</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EvidenceUploadDialog({
  complaint,
  onClose,
}: {
  complaint: ComplaintSummary;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const upload = useUploadEvidence(complaint.id);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    upload.mutate(file, { onSuccess: onClose });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Upload evidence</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-sm text-muted-foreground truncate">{complaint.title}</p>
          <div className="space-y-1">
            <label htmlFor="ev-file" className="text-xs font-medium">
              Photo (JPEG, PNG, WebP — max 10 MB)
            </label>
            <input
              id="ev-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={upload.isPending || !file}>Upload evidence</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AuthorityQueueView() {
  const { data: session } = useSession();
  const role = session?.user?.role ?? "";
  const category = AUTHORITY_CATEGORY[role] ?? "";

  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "">("");
  const [updateTarget, setUpdateTarget] = useState<ComplaintSummary | null>(null);
  const [evidenceTarget, setEvidenceTarget] = useState<ComplaintSummary | null>(null);

  const { data, isLoading, isError } = useAuthorityFeed(category, statusFilter, page);

  if (!category) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center text-muted-foreground">
        <AlertCircle size={36} aria-hidden="true" />
        <p className="text-sm">No authority queue for your role ({role}).</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold">{category} Queue</h1>
          <p className="text-sm text-muted-foreground">
            Complaints assigned to {category.toLowerCase()} department
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as ComplaintStatus | ""); setPage(0); }}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="UNSOLVED">Unsolved</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="SOLVED">Solved</option>
        </select>
      </div>

      <Separator />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle size={36} className="text-red-500" aria-hidden="true" />
          <p className="text-sm text-red-600">Failed to load queue</p>
        </div>
      ) : data?.content.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <CheckCircle size={36} aria-hidden="true" />
          <p className="text-sm">Queue is empty</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {data?.content.map((complaint) => (
              <div
                key={complaint.id}
                className="rounded-lg border p-4 flex flex-col sm:flex-row sm:items-start gap-3"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/complaint/${complaint.id}`}
                      className="text-sm font-medium hover:underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      {complaint.title}
                      <ExternalLink size={11} className="inline ml-1 text-muted-foreground" aria-hidden="true" />
                    </Link>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border ${URGENCY_COLOR[complaint.urgency]}`}>
                      {complaint.urgency}
                    </span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border ${STATUS_COLOR[complaint.status]}`}>
                      {complaint.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {complaint.district}, {complaint.area}
                    {" · "}
                    <span className="font-mono">#{complaint.trackingId}</span>
                    {" · "}
                    {formatDate(complaint.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUpdateTarget(complaint)}
                    aria-label={`Update status for "${complaint.title}"`}
                  >
                    <Clock size={13} aria-hidden="true" />
                    Status
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEvidenceTarget(complaint)}
                    aria-label={`Upload evidence for "${complaint.title}"`}
                  >
                    <UploadCloud size={13} aria-hidden="true" />
                    Evidence
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 0} aria-label="Previous page">
                <ChevronLeft size={16} aria-hidden="true" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {data.totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page + 1 >= data.totalPages} aria-label="Next page">
                Next
                <ChevronRight size={16} aria-hidden="true" />
              </Button>
            </div>
          )}
        </>
      )}

      {updateTarget && (
        <UpdateStatusDialog complaint={updateTarget} onClose={() => setUpdateTarget(null)} />
      )}
      {evidenceTarget && (
        <EvidenceUploadDialog complaint={evidenceTarget} onClose={() => setEvidenceTarget(null)} />
      )}
    </div>
  );
}
