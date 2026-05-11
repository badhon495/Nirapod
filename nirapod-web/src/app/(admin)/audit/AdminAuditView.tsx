"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, AlertCircle, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/axios";

interface AuditEntry {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  ipAddress: string | null;
  details: string | null;
  createdAt: string;
}

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "medium" });
}

function useAuditLog(userId: string, action: string, page: number) {
  return useQuery<Page<AuditEntry>>({
    queryKey: ["admin", "audit", userId, action, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, size: 50 };
      if (userId.trim()) params.userId = userId.trim();
      if (action.trim()) params.action = action.trim();
      const res = await api.get<Page<AuditEntry>>("/api/v1/admin/audit", { params });
      return res.data;
    },
  });
}

export function AdminAuditView() {
  const [page, setPage] = useState(0);
  const [userId, setUserId] = useState("");
  const [action, setAction] = useState("");
  const [appliedUserId, setAppliedUserId] = useState("");
  const [appliedAction, setAppliedAction] = useState("");

  const { data, isLoading, isError } = useAuditLog(appliedUserId, appliedAction, page);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setAppliedUserId(userId);
    setAppliedAction(action);
    setPage(0);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardList size={18} aria-hidden="true" />
        <h1 className="text-lg font-semibold">Audit Log</h1>
        {data && (
          <span className="text-sm text-muted-foreground">({data.totalElements})</span>
        )}
      </div>

      <form onSubmit={applyFilters} className="flex flex-wrap gap-2" aria-label="Filter audit log">
        <Input
          placeholder="User ID (UUID)"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="h-8 w-72 font-mono text-xs"
          aria-label="Filter by user ID"
        />
        <Input
          placeholder="Action (e.g. LOGIN)"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="h-8 w-48 text-sm"
          aria-label="Filter by action"
        />
        <Button type="submit" size="sm" variant="outline">
          <Search size={14} aria-hidden="true" />
          Filter
        </Button>
        {(appliedUserId || appliedAction) && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setUserId(""); setAction(""); setAppliedUserId(""); setAppliedAction(""); setPage(0);
            }}
          >
            Clear
          </Button>
        )}
      </form>

      <Separator />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-muted animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle size={36} className="text-red-500" aria-hidden="true" />
          <p className="text-sm text-red-600">Failed to load audit log</p>
        </div>
      ) : data?.content.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <ClipboardList size={36} aria-hidden="true" />
          <p className="text-sm">No entries found</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Time</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Action</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">User</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Entity</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">IP</th>
                </tr>
              </thead>
              <tbody>
                {data?.content.map((entry) => (
                  <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors duration-150">
                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap font-mono text-xs">
                      {formatDate(entry.createdAt)}
                    </td>
                    <td className="px-3 py-2 font-medium">{entry.action}</td>
                    <td className="px-3 py-2">
                      {entry.userName ? (
                        <span>{entry.userName}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">
                      {entry.entityType ? `${entry.entityType}` : "—"}
                      {entry.entityId && (
                        <span className="ml-1 font-mono">{entry.entityId.slice(0, 8)}…</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                      {entry.ipAddress ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(data?.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 0} aria-label="Previous page">
                <ChevronLeft size={16} aria-hidden="true" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page + 1} of {data?.totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page + 1 >= (data?.totalPages ?? 1)} aria-label="Next page">
                Next
                <ChevronRight size={16} aria-hidden="true" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
