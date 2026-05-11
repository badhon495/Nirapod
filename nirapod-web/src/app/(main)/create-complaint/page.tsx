import type { Metadata } from "next";
import { CreateComplaintForm } from "./CreateComplaintForm";

export const metadata: Metadata = {
  title: "Report a Complaint — Nirapod",
};

export default function CreateComplaintPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Report a Complaint</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submit your complaint to the relevant authority. Your report will be reviewed and acted upon.
        </p>
      </div>
      <CreateComplaintForm />
    </div>
  );
}
