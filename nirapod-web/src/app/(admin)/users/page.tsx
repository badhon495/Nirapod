import { Metadata } from "next";
import { AdminUsersView } from "./AdminUsersView";

export const metadata: Metadata = { title: "Users — Nirapod Admin" };

export default function AdminUsersPage() {
  return <AdminUsersView />;
}
