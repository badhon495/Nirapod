"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ComplaintDetailError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 rounded-md border border-red-200 bg-red-50 p-12 text-center">
      <AlertCircle size={40} className="text-red-500" aria-hidden="true" />
      <div>
        <p className="font-semibold text-red-700">Could not load complaint</p>
        <p className="mt-1 text-sm text-red-600">{error.message || "An unexpected error occurred."}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={reset}>
          Try again
        </Button>
        <Link href="/home" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Back to feed
        </Link>
      </div>
    </div>
  );
}
