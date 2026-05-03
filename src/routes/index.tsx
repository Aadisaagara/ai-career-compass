import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAppStore } from "@/store/useAppStore";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const authReady = useAppStore((s) => s.authReady);
  const user = useAppStore((s) => s.user);
  useEffect(() => {
    if (!authReady) return;
    navigate({ to: user ? "/dashboard" : "/auth" });
  }, [authReady, user, navigate]);
  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground text-sm">
      Loading…
    </div>
  );
}
