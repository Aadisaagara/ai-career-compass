import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchResumes,
  saveResume,
  setDefaultResume,
  deleteResume,
  type Resume,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PdfUpload } from "@/components/resume/PdfUpload";
import { Loader2, Trash2, Star, Loader } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/resumes")({
  component: ResumeVaultPage,
});

interface UploadFormState {
  name: string;
  text: string;
  isDefault: boolean;
}

function ResumeVaultPage() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [form, setForm] = useState<UploadFormState>({
    name: "",
    text: "",
    isDefault: false,
  });

  useEffect(() => {
    loadResumes();
  }, [user]);

  async function loadResumes() {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchResumes();
      setResumes(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load resumes");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveResume() {
    if (!form.name.trim() || !form.text.trim()) {
      toast.error("Please enter a resume name and text");
      return;
    }

    setUploading(true);
    try {
      const newResume = await saveResume({
        name: form.name,
        raw_text: form.text,
        is_default: form.isDefault,
      });
      setResumes((prev) => {
        if (form.isDefault) {
          return [newResume, ...prev.map((r) => ({ ...r, is_default: false }))];
        }
        return [newResume, ...prev];
      });
      setForm({ name: "", text: "", isDefault: false });
      toast.success("Resume saved successfully");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save resume");
    } finally {
      setUploading(false);
    }
  }

  async function handleSetDefault(resumeId: string) {
    try {
      const updated = await setDefaultResume(resumeId);
      setResumes((prev) =>
        prev.map((r) => ({
          ...r,
          is_default: r.id === updated.id,
        }))
      );
      toast.success("Default resume updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    }
  }

  async function handleDelete(resumeId: string) {
    setDeleting(resumeId);
    try {
      await deleteResume(resumeId);
      setResumes((prev) => prev.filter((r) => r.id !== resumeId));
      toast.success("Resume deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  const charCount = form.text.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Resume Vault</h1>
        <p className="text-sm text-muted-foreground">
          Save and manage multiple versions of your resume.
        </p>
      </div>

      {/* Upload Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Upload New Resume</h2>

          <div className="space-y-1.5">
            <Label>Resume Name</Label>
            <Input
              placeholder="e.g., Software Engineer Resume v2"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            />
          </div>

          <Tabs defaultValue="upload">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload PDF</TabsTrigger>
              <TabsTrigger value="paste">Paste Text</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-3">
              <PdfUpload
                onTextExtracted={(text) =>
                  setForm((s) => ({ ...s, text }))
                }
              />
            </TabsContent>

            <TabsContent value="paste" className="mt-3">
              <Label>Resume Text</Label>
              <Textarea
                rows={10}
                placeholder="Paste your resume text here…"
                value={form.text}
                onChange={(e) => setForm((s) => ({ ...s, text: e.target.value }))}
                className="mt-2"
              />
              {form.text && (
                <p className="text-xs text-muted-foreground mt-2">
                  {form.text.length.toLocaleString()} characters
                </p>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm((s) => ({ ...s, isDefault: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Set as default resume</span>
            </label>
          </div>

          <Button
            onClick={handleSaveResume}
            disabled={uploading || !form.name || !form.text}
            className="w-full"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Save Resume
          </Button>
        </div>
      </Card>

      {/* Saved Resumes Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Saved Resumes</h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border bg-card p-4 h-40 animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No resumes saved yet. Upload your first resume above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resumes.map((resume) => (
              <Card key={resume.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{resume.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {resume.raw_text.length.toLocaleString()} characters
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(resume.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {resume.is_default && (
                    <Badge variant="secondary" className="shrink-0">
                      Default
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  {!resume.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(resume.id)}
                      className="flex-1 text-xs"
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Set Default
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>Delete resume</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{resume.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                      <div className="flex gap-2 justify-end">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(resume.id)}
                          disabled={deleting === resume.id}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {deleting === resume.id ? (
                            <Loader className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Delete
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
