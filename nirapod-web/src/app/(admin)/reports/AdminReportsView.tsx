"use client";

import Link from "next/link";
import { useState } from "react";
import { Flag, Trash2, ExternalLink, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import api from "@/lib/axios";

interface ReportItem {
  id: string;
  complaintId: string;
  complaintTitle: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  createdAt: string;
}

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function useReports(page: number) {
  return useQuery<Page<ReportItem>>({
    queryKey: ["admin", "reports", page],
    queryFn: async () => {
      const res = await api.get<Page<ReportItem>>("/api/v1/admin/reports", {
        params: { page, size: 20, sort: "createdAt,desc" },
      });
      return res.data;
    },
  });
}

function useDismiss() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (reportId) => {
      await api.delete(`/api/v1/admin/reports/${reportId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reports"] });
      toast.success("Report dismissed");
    },
    onError: () => toast.error("Failed to dismiss report"),
  });
}

function ReportRow({ report, onDismiss }: { report: ReportItem; onDismiss: (id: string) => void }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 rounded-lg border p-4">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start gap-2 flex-wrap">
          <Link
            href={`/complaint/${report.complaintId}`}
            className="text-sm font-medium hover:underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            aria-label={`View complaint: ${report.complaintTitle}`}
          >
            {report.complaintTitle}
            <ExternalLink size={12} className="inline ml-1 text-muted-foreground" aria-hidden="true" />
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          Reported by <span className="font-medium text-foreground">{report.reporterName}</span>
          {" · "}
          {formatDate(report.createdAt)}
        </p>
        <p className="text-xs">
          <span className="text-muted-foreground">Reason: </span>
          {report.reason}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onDismiss(report.id)}
        aria-label={`Dismiss report for complaint "${report.complaintTitle}"`}
        className="shrink-0 text-muted-foreground hover:text-destructive hover:border-destructive transition-colors duration-150"
      >
        <Trash2 size={14} aria-hidden="true" />
        Dismiss
      </Button>
    </div>
  );
}

export function AdminReportsView() {
  const [page, setPage] = useState(0);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const { data, isLoading, isError } = useReports(page);
  const dismiss = useDismiss();

  const pendingReport = data?.content.find((r) => r.id === confirmId);

  function handleDismissConfirm() {
    if (!confirmId) return;
    dismiss.mutate(confirmId, { onSettled: () => setConfirmId(null) });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Flag size={18} aria-hidden="true" />
          Complaint Reports
          {data && (
            <span className="text-sm font-normal text-muted-foreground">
              ({data.totalElements})
            </span>
          )}
        </h1>
      </div>

      <Separator />

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle size={36} className="text-red-500" aria-hidden="true" />
          <p className="text-sm text-red-600">Failed to load reports</p>
        </div>
      ) : data?.content.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <Flag size={36} aria-hidden="true" />
          <p className="text-sm">No reports to review</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data?.content.map((r) => (
              <ReportRow key={r.id} report={r} onDismiss={setConfirmId} />
            ))}
          </div>

          {(data?.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} aria-hidden="true" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {data?.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page + 1 >= (data?.totalPages ?? 1)}
                aria-label="Next page"
              >
                Next
                <ChevronRight size={16} aria-hidden="true" />
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={!!confirmId} onOpenChange={(open) => !open && setConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dismiss report</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Dismiss the report for{" "}
            <span className="font-medium text-foreground">
              &ldquo;{pendingReport?.complaintTitle}&rdquo;
            </span>
            ? The complaint stays visible — only this report entry is removed.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDismissConfirm}
              disabled={dismiss.isPending}
            >
              Dismiss report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
