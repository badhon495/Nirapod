"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MapPin, AlertCircle, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/axios";

interface AnalyticsDataPoint {
  district: string;
  category: string;
  count: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  POLICE: "#3b82f6",
  FIRE: "#ef4444",
  CITY: "#10b981",
  ANIMAL: "#f59e0b",
};

const CATEGORIES = ["POLICE", "FIRE", "CITY", "ANIMAL"] as const;

// Default: last 30 days
function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 16),
    to: to.toISOString().slice(0, 16),
  };
}

function toISOParam(localDatetime: string) {
  return new Date(localDatetime).toISOString();
}

interface DistrictRow {
  district: string;
  POLICE: number;
  FIRE: number;
  CITY: number;
  ANIMAL: number;
  total: number;
}

function aggregate(data: AnalyticsDataPoint[]): DistrictRow[] {
  const map = new Map<string, DistrictRow>();
  for (const point of data) {
    if (!map.has(point.district)) {
      map.set(point.district, { district: point.district, POLICE: 0, FIRE: 0, CITY: 0, ANIMAL: 0, total: 0 });
    }
    const row = map.get(point.district)!;
    if (point.category in row) {
      (row as unknown as Record<string, number>)[point.category] += point.count;
    }
    row.total += point.count;
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

// --- Leaflet choropleth map ---

interface MapProps {
  rows: DistrictRow[];
}

function DistrictMap({ rows }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const [mapError, setMapError] = useState(false);

  const maxTotal = Math.max(...rows.map((r) => r.total), 1);

  const getColor = useCallback(
    (total: number) => {
      const ratio = total / maxTotal;
      if (ratio === 0) return "#f1f5f9";
      if (ratio < 0.2) return "#bfdbfe";
      if (ratio < 0.4) return "#93c5fd";
      if (ratio < 0.6) return "#60a5fa";
      if (ratio < 0.8) return "#3b82f6";
      return "#1d4ed8";
    },
    [maxTotal],
  );

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    let cancelled = false;

    Promise.all([
      import("leaflet"),
      fetch(
        "https://raw.githubusercontent.com/fahimk/bangladesh-geojson/master/divisions/districts.json",
      ).then((r) => {
        if (!r.ok) throw new Error("GeoJSON fetch failed");
        return r.json();
      }),
    ])
      .then(([L, geojson]) => {
        if (cancelled || !containerRef.current) return;

        delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;

        const map = L.map(containerRef.current!, {
          zoomControl: true,
          scrollWheelZoom: false,
          attributionControl: true,
        });
        mapRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 18,
        }).addTo(map);

        const districtTotals = new Map<string, number>(
          rows.map((r) => [r.district.toLowerCase(), r.total]),
        );

        L.geoJSON(geojson, {
          style: (feature) => {
            const name: string =
              feature?.properties?.NAME_2 ??
              feature?.properties?.name ??
              feature?.properties?.district ??
              "";
            const total = districtTotals.get(name.toLowerCase()) ?? 0;
            return {
              fillColor: getColor(total),
              fillOpacity: 0.75,
              color: "#94a3b8",
              weight: 1,
            };
          },
          onEachFeature: (feature, layer) => {
            const name: string =
              feature?.properties?.NAME_2 ??
              feature?.properties?.name ??
              feature?.properties?.district ??
              "Unknown";
            const matched = rows.find(
              (r) => r.district.toLowerCase() === name.toLowerCase(),
            );
            const total = matched?.total ?? 0;
            layer.bindTooltip(
              `<strong>${name}</strong><br/>` +
                `Total: ${total}<br/>` +
                CATEGORIES.map(
                  (c) => `${c}: ${(matched as unknown as Record<string, number>)?.[c] ?? 0}`,
                ).join("<br/>"),
              { sticky: true },
            );
          },
        }).addTo(map);

        map.fitBounds(
          L.geoJSON(geojson).getBounds(),
          { padding: [8, 8] },
        );
      })
      .catch(() => {
        if (!cancelled) setMapError(true);
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  if (mapError) return null;

  return (
    <>
      {/* Leaflet CSS — loaded once */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div
        ref={containerRef}
        className="h-[480px] w-full rounded-lg border overflow-hidden"
        role="img"
        aria-label="District complaint map"
      />
      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground items-center">
        <span>Intensity:</span>
        {["Low", "", "", "", "High"].map((label, i) => (
          <span key={i} className="flex items-center gap-1">
            <span
              className="inline-block h-3 w-5 rounded-sm"
              style={{
                background: ["#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#1d4ed8"][i],
              }}
            />
            {label}
          </span>
        ))}
      </div>
    </>
  );
}

// --- Chart view ---

function DistrictBarChart({ rows }: { rows: DistrictRow[] }) {
  const top = rows.slice(0, 15);
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={top} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="district" tick={{ fontSize: 11 }} width={90} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} cursor={{ fill: "var(--muted)" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {CATEGORIES.map((cat) => (
          <Bar key={cat} dataKey={cat} stackId="a" fill={CATEGORY_COLORS[cat]} radius={[0, 4, 4, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// --- Main view ---

type ViewMode = "map" | "chart" | "table";

export function AdminAnalyticsView() {
  const defaults = defaultRange();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [appliedFrom, setAppliedFrom] = useState(defaults.from);
  const [appliedTo, setAppliedTo] = useState(defaults.to);
  const [view, setView] = useState<ViewMode>("map");

  const { data, isLoading, isError } = useQuery<AnalyticsDataPoint[]>({
    queryKey: ["admin", "analytics", appliedFrom, appliedTo],
    queryFn: async () => {
      const res = await api.get<AnalyticsDataPoint[]>("/api/v1/admin/analytics", {
        params: {
          from: toISOParam(appliedFrom),
          to: toISOParam(appliedTo),
        },
      });
      return res.data;
    },
    staleTime: 60_000,
  });

  function applyFilter(e: React.FormEvent) {
    e.preventDefault();
    setAppliedFrom(from);
    setAppliedTo(to);
  }

  const rows = data ? aggregate(data) : [];
  const isEmpty = !isLoading && !isError && rows.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Complaint distribution by district and category
        </p>
      </div>

      <form onSubmit={applyFilter} className="flex flex-wrap items-end gap-4" aria-label="Date range filter">
        <div className="space-y-1">
          <Label htmlFor="analytics-from" className="text-xs">From</Label>
          <Input
            id="analytics-from"
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-8 text-sm w-52"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="analytics-to" className="text-xs">To</Label>
          <Input
            id="analytics-to"
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 text-sm w-52"
          />
        </div>
        <Button type="submit" size="sm" variant="outline">Apply</Button>
      </form>

      <div className="flex gap-2" role="group" aria-label="View mode">
        {([["map", "Map", MapPin], ["chart", "Chart", BarChart2], ["table", "Table", null]] as const).map(
          ([mode, label, Icon]) => (
            <Button
              key={mode}
              size="sm"
              variant={view === mode ? "default" : "outline"}
              onClick={() => setView(mode)}
            >
              {Icon && <Icon size={13} aria-hidden="true" />}
              {label}
            </Button>
          ),
        )}
      </div>

      <Separator />

      {isLoading && (
        <div className="space-y-3">
          <div className="h-8 w-48 rounded bg-muted animate-pulse" />
          <div className="h-[400px] rounded-lg bg-muted animate-pulse" />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <AlertCircle size={36} className="text-red-500" aria-hidden="true" />
          <p className="text-sm text-red-600">Failed to load analytics data</p>
        </div>
      )}

      {isEmpty && (
        <div className="flex flex-col items-center gap-3 py-24 text-center text-muted-foreground">
          <BarChart2 size={36} aria-hidden="true" />
          <p className="text-sm">No complaints in this date range</p>
        </div>
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <>
          {view === "map" && (
            <section aria-label="Complaint district map">
              <DistrictMap rows={rows} />
            </section>
          )}

          {view === "chart" && (
            <section aria-label="Complaint district bar chart">
              <p className="text-xs text-muted-foreground mb-3">Top 15 districts by complaint volume</p>
              <div className="rounded-lg border p-4">
                <DistrictBarChart rows={rows} />
              </div>
            </section>
          )}

          {view === "table" && (
            <section aria-label="Complaint district table">
              <div className="rounded-lg border overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">District</th>
                      {CATEGORIES.map((c) => (
                        <th key={c} className="px-3 py-2 text-right font-medium" style={{ color: CATEGORY_COLORS[c] }}>
                          {c}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.district} className="border-b last:border-0 hover:bg-muted/20 transition-colors duration-150">
                        <td className="px-3 py-2 font-medium">{row.district}</td>
                        {CATEGORIES.map((c) => (
                          <td key={c} className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                            {(row as unknown as Record<string, number>)[c] || 0}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-right tabular-nums font-semibold">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
