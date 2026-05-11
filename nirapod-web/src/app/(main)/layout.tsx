import { auth } from "@/auth";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/NavActions";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 pb-24 sm:pb-6">
        {children}
      </main>
      <MobileBottomNav session={session} />
    </div>
  );
}
