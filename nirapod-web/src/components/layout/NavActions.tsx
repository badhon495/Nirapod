"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bell, User, LogOut, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Session } from "next-auth";

interface Props {
  session: Session | null;
}

export function NavActions({ session }: Props) {
  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/signup">Sign up</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" asChild className="hidden md:flex">
        <Link href="/create-complaint" aria-label="Report new complaint">
          <Plus size={16} aria-hidden="true" />
          Report
        </Link>
      </Button>
      <Button variant="ghost" size="icon" asChild aria-label="Notifications">
        <Link href="/notifications">
          <Bell size={18} aria-hidden="true" />
        </Link>
      </Button>
      <Button variant="ghost" size="icon" asChild aria-label="My profile">
        <Link href="/profile">
          <User size={18} aria-hidden="true" />
        </Link>
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
      <Link href="/notifications" className="flex flex-1 flex-col items-center py-3 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
        <Bell size={20} aria-hidden="true" />
        <span>Alerts</span>
      </Link>
      <Link href="/profile" className="flex flex-1 flex-col items-center py-3 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
        <User size={20} aria-hidden="true" />
        <span>Profile</span>
      </Link>
    </nav>
  );
}
