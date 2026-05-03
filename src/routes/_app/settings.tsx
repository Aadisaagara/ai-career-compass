import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, loading, saveProfile } = useProfile();
  const [name, setName] = useState("");
  const [resume, setResume] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(profile?.full_name ?? "");
    setResume(profile?.master_resume_text ?? "");
  }, [profile]);

  async function save() {
    setSaving(true);
    await saveProfile({ full_name: name, master_resume_text: resume });
    setSaving(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and master resume.</p>
      </div>
      <div className="space-y-4 rounded-xl border bg-card p-4">
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
        </div>
        <div className="space-y-1.5">
          <Label>Master resume</Label>
          <Textarea
            rows={16}
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            disabled={loading}
            placeholder="Paste your full resume here…"
          />
        </div>
        <Button onClick={save} disabled={saving || loading}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save changes
        </Button>
      </div>
    </div>
  );
}