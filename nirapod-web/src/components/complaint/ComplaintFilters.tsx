"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import type { ComplaintCategory, ComplaintStatus } from "@/types/complaint";

const CATEGORIES: { value: ComplaintCategory; label: string }[] = [
  { value: "POLICE", label: "Police" },
  { value: "FIRE", label: "Fire" },
  { value: "CITY", label: "City" },
  { value: "ANIMAL", label: "Animal" },
];

const STATUSES: { value: ComplaintStatus; label: string }[] = [
  { value: "UNSOLVED", label: "Unsolved" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "SOLVED", label: "Solved" },
];

export function ComplaintFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category") as ComplaintCategory | null;
  const activeStatus = searchParams.get("status") as ComplaintStatus | null;

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const toggleCategory = (cat: ComplaintCategory) =>
    setParam("category", activeCategory === cat ? null : cat);

  const toggleStatus = (status: ComplaintStatus) =>
    setParam("status", activeStatus === status ? null : status);

  const clearAll = () => {
    router.push(pathname);
  };

  const hasFilters = activeCategory || activeStatus;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-xs font-medium text-muted-foreground">Category:</span>
      {CATEGORIES.map((c) => (
        <Button
          key={c.value}
          variant={activeCategory === c.value ? "default" : "outline"}
          size="sm"
          onClick={() => toggleCategory(c.value)}
          aria-pressed={activeCategory === c.value}
          className="h-7 text-xs"
        >
          {c.label}
        </Button>
      ))}

      <span className="text-xs font-medium text-muted-foreground ml-2">Status:</span>
      {STATUSES.map((s) => (
        <Button
          key={s.value}
          variant={activeStatus === s.value ? "default" : "outline"}
          size="sm"
          onClick={() => toggleStatus(s.value)}
          aria-pressed={activeStatus === s.value}
          className="h-7 text-xs"
        >
          {s.label}
        </Button>
      ))}

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-7 text-xs text-muted-foreground"
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
