import { Badge } from "@/components/ui/badge";
import type { ComplaintStatus, ComplaintUrgency } from "@/types/complaint";

const STATUS_CONFIG: Record<
  ComplaintStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  UNSOLVED: { label: "Unsolved", variant: "default" },
  IN_PROGRESS: { label: "In Progress", variant: "secondary" },
  SOLVED: { label: "Solved", variant: "outline" },
};

const URGENCY_CONFIG: Record<
  ComplaintUrgency,
  { label: string; className: string }
> = {
  LOW: { label: "Low", className: "border border-blue-500 text-blue-700 bg-blue-50" },
  MEDIUM: { label: "Medium", className: "border border-amber-500 text-amber-700 bg-amber-50" },
  HIGH: { label: "High", className: "border border-red-500 text-red-700 bg-red-50" },
};

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function UrgencyBadge({ urgency }: { urgency: ComplaintUrgency }) {
  const config = URGENCY_CONFIG[urgency];
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
