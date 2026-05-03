import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore, type Profile } from "@/store/useAppStore";
import { toast } from "sonner";

export function useProfile() {
  const user = useAppStore((s) => s.user);
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    setLoading(true);
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) toast.error(error.message);
        setProfile((data ?? null) as Profile | null);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user, setProfile]);

  async function saveProfile(patch: Partial<Profile>) {
    if (!user) return null;
    const { data, error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, ...patch })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return null;
    }
    setProfile(data as Profile);
    toast.success("Profile saved");
    return data as Profile;
  }

  return { profile, loading, saveProfile };
}