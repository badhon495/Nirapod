"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bell, User, LogOut, Plus, Menu, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnreadCount, useNotificationSocket } from "@/hooks/useNotifications";
import type { Session } from "next-auth";

interface Props {
  session: Session | null;
}

function UnreadBadge() {
  const { data } = useUnreadCount();
  const count = data?.count ?? 0;
  if (count === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-medium text-primary-foreground" aria-hidden="true">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function NotificationBell() {
  useNotificationSocket();
  const { data } = useUnreadCount();
  const count = data?.count ?? 0;

  return (
    <Button variant="ghost" size="icon" render={<Link href="/notifications" className="relative" />} aria-label={`Notifications${count > 0 ? `, ${count} unread` : ""}`}>
      <Bell size={18} aria-hidden="true" />
      {count > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground"
          aria-hidden="true"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Button>
  );
}

export function NavActions({ session }: Props) {
  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" render={<Link href="/login" />}>
          Sign in
        </Button>
        <Button size="sm" render={<Link href="/signup" />}>
          Sign up
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" render={<Link href="/create-complaint" />} aria-label="Report new complaint" className="hidden md:flex">
        <Plus size={16} aria-hidden="true" />
        Report
      </Button>
      <NotificationBell />
      <Button variant="ghost" size="icon" render={<Link href="/profile" />} aria-label="My profile">
        <User size={18} aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => signOut({ callbackUrl: "/login" })}
        aria-label="Sign out"
      >
        <LogOut size={18} aria-hidden="true" />
      </Button>
    </div>
  );
}

export function MobileBottomNav({ session }: Props) {
  if (!session) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-background sm:hidden"
      aria-label="Mobile navigation"
    >
      <Link href="/home" className="flex flex-1 flex-col items-center py-3 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
        <Menu size={20} aria-hidden="true" />
        <span>Feed</span>
      </Link>
      <Link href="/create-complaint" className="flex flex-1 flex-col items-center py-3 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
        <Plus size={20} aria-hidden="true" />
        <span>Report</span>
      </Link>
      <Link href="/notifications" className="relative flex flex-1 flex-col items-center py-3 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
        <span className="relative inline-flex">
          <Bell size={20} aria-hidden="true" />
          <UnreadBadge />
        </span>
        <span>Alerts</span>
      </Link>
      <Link href="/livechat" className="flex flex-1 flex-col items-center py-3 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
        <MessageSquare size={20} aria-hidden="true" />
        <span>Chat</span>
      </Link>
      <Link href="/profile" className="flex flex-1 flex-col items-center py-3 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
        <User size={20} aria-hidden="true" />
        <span>Profile</span>
      </Link>
    </nav>
  );
}
