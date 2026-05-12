import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import Link from "next/link";
import { LayoutDashboard, Users, ClipboardList, Search, Flag, BarChart2 } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/reports", label: "Reports", icon: Flag },
  { href: "/audit", label: "Audit Log", icon: ClipboardList },
  { href: "/investigate", label: "Investigate", icon: Search },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/home");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1 mx-auto w-full max-w-7xl px-4 py-6 gap-6">
        <aside className="hidden md:flex flex-col gap-1 w-44 shrink-0" aria-label="Admin navigation">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/70 transition-colors duration-150 hover:bg-muted hover:text-foreground"
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
