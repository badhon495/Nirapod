import { Metadata } from "next";
import { AdminInvestigateView } from "./AdminInvestigateView";

export const metadata: Metadata = { title: "Investigate — Nirapod Admin" };

export default function AdminInvestigatePage() {
  return <AdminInvestigateView />;
}
