import type { Metadata } from "next";
import { TrackerForm } from "./TrackerForm";

export const metadata: Metadata = {
  title: "Track Complaint — Nirapod",
  description: "Enter your complaint tracking ID to check its status.",
};

export default function TrackerPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Track Your Complaint</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the tracking ID you received when you submitted your complaint.
        </p>
      </div>
      <TrackerForm />
    </div>
  );
}
