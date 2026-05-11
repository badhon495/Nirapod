import { Metadata } from "next";
import { AdminAuditView } from "./AdminAuditView";

export const metadata: Metadata = { title: "Audit Log — Nirapod Admin" };

export default function AdminAuditPage() {
  return <AdminAuditView />;
}
