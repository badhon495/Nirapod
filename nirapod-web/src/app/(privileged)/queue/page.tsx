import { Metadata } from "next";
import { AuthorityQueueView } from "./AuthorityQueueView";

export const metadata: Metadata = { title: "Complaint Queue — Nirapod" };

export default function AuthorityQueuePage() {
  return <AuthorityQueueView />;
}
