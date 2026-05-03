import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/useAppStore";

let initialized = false;

export function useAuthInit() {
  const setAuth = useAppStore((s) => s.setAuth);
  const setAuthReady = useAppStore((s) => s.setAuthReady);

  useEffect(() => {
    if (initialized) return;
    initialized = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(session?.user ?? null, session ?? null);
    });

    supabase.auth.getSession().then(({ data }) => {
      setAuth(data.session?.user ?? null, data.session ?? null);
      setAuthReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, [setAuth, setAuthReady]);
}

export function useAuth() {
  const user = useAppStore((s) => s.user);
  const session = useAppStore((s) => s.session);
  const authReady = useAppStore((s) => s.authReady);
  return { user, session, authReady };
}