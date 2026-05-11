import { Metadata } from "next";
import { AdminReportsView } from "./AdminReportsView";

export const metadata: Metadata = { title: "Reports — Nirapod Admin" };

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <AdminReportsView />
    </div>
  );
}
