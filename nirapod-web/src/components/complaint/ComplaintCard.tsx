import Link from "next/link";
import { MapPin, ImageIcon, Clock } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, UrgencyBadge } from "./StatusBadge";
import type { ComplaintSummary } from "@/types/complaint";

const CATEGORY_LABELS: Record<string, string> = {
  POLICE: "Police",
  FIRE: "Fire Service",
  CITY: "City Corporation",
  ANIMAL: "Animal Welfare",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface Props {
  complaint: ComplaintSummary;
}

export function ComplaintCard({ complaint }: Props) {
  return (
    <Link href={`/complaint/${complaint.id}`} className="block group">
      <Card className="transition-shadow duration-150 group-hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold leading-snug line-clamp-2 flex-1">
              {complaint.title}
            </h3>
            <StatusBadge status={complaint.status} />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <Badge variant="outline" className="text-xs">
              {CATEGORY_LABELS[complaint.category] ?? complaint.category}
            </Badge>
            <UrgencyBadge urgency={complaint.urgency} />
          </div>
        </CardHeader>

        <CardContent className="pb-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={12} aria-hidden="true" />
            <span>{complaint.area}, {complaint.district}</span>
          </div>

          {complaint.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {complaint.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="inline-block rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
              {complaint.tags.length > 4 && (
                <span className="text-xs text-muted-foreground">
                  +{complaint.tags.length - 4}
                </span>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0 justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock size={11} aria-hidden="true" />
            {formatDate(complaint.createdAt)}
          </span>
          {complaint.photoCount > 0 && (
            <span className="flex items-center gap-1">
              <ImageIcon size={11} aria-hidden="true" />
              {complaint.photoCount}
            </span>
          )}
          <span>#{complaint.trackingId}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}

export function ComplaintCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
        <div className="h-3 w-1/3 rounded bg-muted animate-pulse mt-2" />
      </CardHeader>
      <CardContent className="pb-2">
        <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
      </CardContent>
      <CardFooter className="pt-0">
        <div className="h-3 w-1/4 rounded bg-muted animate-pulse" />
      </CardFooter>
    </Card>
  );
}
