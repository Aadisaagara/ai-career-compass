import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Briefcase } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const authReady = useAppStore((s) => s.authReady);
  const { saveProfile } = useProfile();
  const [name, setName] = useState("");
  const [resume, setResume] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authReady && !user) navigate({ to: "/auth" });
  }, [authReady, user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const p = await saveProfile({ full_name: name, master_resume_text: resume });
    setSaving(false);
    if (p) navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Briefcase className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome aboard</h1>
          <p className="text-sm text-muted-foreground">
            Tell us about yourself so we can tailor your applications.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-xl border bg-card p-5">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Master resume</Label>
            <Textarea
              rows={12}
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              required
              placeholder="Paste your full resume here…"
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Continue
          </Button>
        </form>
      </div>
    </div>
  );
}