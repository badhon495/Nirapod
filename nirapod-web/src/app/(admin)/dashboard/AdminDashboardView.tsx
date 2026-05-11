"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  AlertCircle,
  Users,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/axios";

interface AdminStats {
  totalComplaints: number;
  unsolvedComplaints: number;
  inProgressComplaints: number;
  solvedComplaints: number;
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  complaintsByCategory: Record<string, number>;
  complaintsByDistrict: Record<string, number>;
}

const CATEGORY_COLORS: Record<string, string> = {
  POLICE: "#3b82f6",
  FIRE: "#ef4444",
  CITY: "#10b981",
  ANIMAL: "#f59e0b",
};

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        <Icon size={16} aria-hidden="true" />
      </div>
      <p className="text-2xl font-semibold tabular-nums">{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function SkeletonCard() {
  return <div className="h-24 rounded-lg bg-muted animate-pulse" />;
}

export function AdminDashboardView() {
  const { data: stats, isLoading, isError } = useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const res = await api.get<AdminStats>("/api/v1/admin/stats");
      return res.data;
    },
    staleTime: 60_000,
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <AlertCircle size={36} className="text-red-500" aria-hidden="true" />
        <p className="text-sm text-red-600">Failed to load stats</p>
      </div>
    );
  }

  const categoryData = stats
    ? Object.entries(stats.complaintsByCategory).map(([name, count]) => ({
        name,
        count,
      }))
    : [];

  const districtData = stats
    ? Object.entries(stats.complaintsByDistrict)
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform overview</p>
      </div>

      <Separator />

      <section aria-label="Complaint statistics">
        <h2 className="text-sm font-medium mb-3">Complaints</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard label="Total" value={stats!.totalComplaints} icon={FileText} />
              <StatCard
                label="Unsolved"
                value={stats!.unsolvedComplaints}
                icon={XCircle}
                sub={`${Math.round((stats!.unsolvedComplaints / (stats!.totalComplaints || 1)) * 100)}%`}
              />
              <StatCard
                label="In Progress"
                value={stats!.inProgressComplaints}
                icon={Clock}
              />
              <StatCard
                label="Solved"
                value={stats!.solvedComplaints}
                icon={CheckCircle}
                sub={`${Math.round((stats!.solvedComplaints / (stats!.totalComplaints || 1)) * 100)}%`}
              />
            </>
          )}
        </div>
      </section>

      <section aria-label="User statistics">
        <h2 className="text-sm font-medium mb-3">Users</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard label="Total" value={stats!.totalUsers} icon={Users} />
              <StatCard label="Active" value={stats!.activeUsers} icon={CheckCircle} />
              <StatCard label="Pending" value={stats!.pendingUsers} icon={Clock} />
              <StatCard label="Suspended" value={stats!.suspendedUsers} icon={XCircle} />
            </>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section aria-label="Complaints by category chart">
          <h2 className="text-sm font-medium mb-3">By Category</h2>
          {isLoading ? (
            <div className="h-48 rounded-lg bg-muted animate-pulse" />
          ) : (
            <div className="rounded-lg border p-4">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={categoryData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 6 }}
                    cursor={{ fill: "var(--muted)" }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {categoryData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={CATEGORY_COLORS[entry.name] ?? "#6b7280"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section aria-label="Complaints by district chart">
          <h2 className="text-sm font-medium mb-3">Top Districts</h2>
          {isLoading ? (
            <div className="h-48 rounded-lg bg-muted animate-pulse" />
          ) : (
            <div className="rounded-lg border p-4">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={districtData}
                  layout="vertical"
                  margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
                >
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 6 }}
                    cursor={{ fill: "var(--muted)" }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
