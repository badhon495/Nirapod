import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";

const AUTHORITY_ROLES = ["POLICE", "FIRE", "CITY", "ANIMAL", "ADMIN"];

export default async function PrivilegedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || !AUTHORITY_ROLES.includes(session.user?.role ?? "")) {
    redirect("/home");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
