import Link from "next/link";
import { auth } from "@/auth";
import { NavActions } from "./NavActions";
import { Bell, Shield } from "lucide-react";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link
          href="/home"
          className="flex items-center gap-2 font-semibold text-base"
          aria-label="Nirapod home"
        >
          <Shield size={20} aria-hidden="true" />
          Nirapod
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm" aria-label="Main navigation">
          <Link href="/home" className="text-foreground/70 transition-colors duration-150 hover:text-foreground">
            Feed
          </Link>
          <Link href="/tracker" className="text-foreground/70 transition-colors duration-150 hover:text-foreground">
            Track
          </Link>
          {session && (
            <Link href="/create-complaint" className="text-foreground/70 transition-colors duration-150 hover:text-foreground">
              Report
            </Link>
          )}
        </nav>

        <NavActions session={session} />
      </div>
    </header>
  );
}
