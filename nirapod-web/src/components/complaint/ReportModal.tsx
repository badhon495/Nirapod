"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";

const REPORT_REASONS = [
  "Spam or irrelevant content",
  "False or misleading information",
  "Offensive or inappropriate content",
  "Duplicate complaint",
  "Personal information exposed",
  "Other",
];

interface Props {
  complaintId: string;
  className?: string;
}

export function ReportModal({ complaintId, className }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const mutation = useMutation<void, Error, string>({
    mutationFn: async (selectedReason) => {
      await api.post(`/api/v1/complaints/${complaintId}/report`, {
        reason: selectedReason,
      });
    },
    onSuccess: () => {
      toast.success("Report submitted. Our team will review it.");
      setOpen(false);
      setReason("");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "Failed to submit report";
      toast.error(msg);
    },
  });

  function handleSubmit() {
    if (!reason) return;
    mutation.mutate(reason);
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={`text-muted-foreground hover:text-destructive ${className ?? ""}`}
        onClick={() => setOpen(true)}
        aria-label="Report complaint as inappropriate"
      >
        <Flag size={14} aria-hidden="true" />
        Report
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report complaint</DialogTitle>
          </DialogHeader>

          <fieldset className="space-y-2">
            <legend className="text-sm text-muted-foreground mb-3">
              Select the reason for reporting this complaint
            </legend>
            {REPORT_REASONS.map((r) => (
              <label
                key={r}
                className="flex items-center gap-2.5 cursor-pointer rounded-md border p-3 text-sm transition-colors duration-150 hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="accent-primary"
                  aria-label={r}
                />
                {r}
              </label>
            ))}
          </fieldset>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={!reason || mutation.isPending}
            >
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
