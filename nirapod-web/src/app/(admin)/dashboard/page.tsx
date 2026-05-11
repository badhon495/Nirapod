import { Metadata } from "next";
import { AdminDashboardView } from "./AdminDashboardView";

export const metadata: Metadata = { title: "Dashboard — Nirapod Admin" };

export default function AdminDashboardPage() {
  return <AdminDashboardView />;
}
