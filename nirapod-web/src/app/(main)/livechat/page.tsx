import type { Metadata } from "next";
import LiveChatView from "./LiveChatView";

export const metadata: Metadata = {
  title: "Live Chat | Nirapod",
};

export default function LiveChatPage() {
  return <LiveChatView />;
}
