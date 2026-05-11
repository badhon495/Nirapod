import { Metadata } from "next";
import { NotificationsView } from "./NotificationsView";

export const metadata: Metadata = { title: "Notifications — Nirapod" };

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <NotificationsView />
    </div>
  );
}
