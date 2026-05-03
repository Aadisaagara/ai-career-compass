import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Sidebar, MobileNav } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const authReady = useAppStore((s) => s.authReady);

  useEffect(() => {
    if (authReady && !user) navigate({ to: "/auth" });
  }, [authReady, user, navigate]);

  if (!authReady || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  );
}