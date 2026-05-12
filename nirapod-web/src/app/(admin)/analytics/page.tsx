import { Metadata } from "next";
import { AdminAnalyticsView } from "./AdminAnalyticsView";

export const metadata: Metadata = { title: "Analytics — Nirapod Admin" };

export default function AdminAnalyticsPage() {
  return <AdminAnalyticsView />;
}
