import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useJobs } from "@/hooks/useJobs";
import { useProfile } from "@/hooks/useProfile";
import { useGenerator } from "@/hooks/useGenerator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MatchScoreRing } from "@/components/generator/MatchScoreRing";
import { Sparkles, Loader2, Download, Copy } from "lucide-react";
import { toast } from "sonner";
import { exportApplicationPDF } from "@/lib/pdf";

export const Route = createFileRoute("/_app/generator")({
  validateSearch: (s: Record<string, unknown>) => ({ jobId: (s.jobId as string) ?? undefined }),
  component: GeneratorPage,
});

function GeneratorPage() {
  const { jobId } = Route.useSearch();
  const { jobs, updateJob } = useJobs();
  const { profile } = useProfile();
  const { loading, result, setResult, run } = useGenerator();
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>(jobId);
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");

  useEffect(() => {
    if (profile?.master_resume_text && !resumeText) setResumeText(profile.master_resume_text);
  }, [profile, resumeText]);

  useEffect(() => {
    if (!selectedJobId) return;
    const j = jobs.find((x) => x.id === selectedJobId);
    if (j) {
      setJobDescription(j.job_description ?? "");
      const gc = j.generated_content as { result?: typeof result } | undefined;
      if (gc?.result) setResult(gc.result);
    }
  }, [selectedJobId, jobs, setResult]);

  async function analyze() {
    if (!jobDescription.trim() || !resumeText.trim()) {
      toast.error("Add a job description and your resume first");
      return;
    }
    const r = await run({ jobDescription, resumeText });
    if (r && selectedJobId) {
      await updateJob(selectedJobId, {
        job_description: jobDescription,
        generated_content: { result: r } as never,
      });
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  function downloadPDF() {
    if (!result) return;
    const job = jobs.find((j) => j.id === selectedJobId);
    exportApplicationPDF({
      candidateName: profile?.full_name ?? "",
      companyName: job?.company_name ?? "",
      roleTitle: job?.role_title ?? "",
      coverLetter: result.coverLetter,
      tailoredSummary: result.tailoredSummary,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Generator</h1>
        <p className="text-sm text-muted-foreground">
          Tailor your resume and cover letter to a job.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div className="space-y-1.5">
            <Label>Job</Label>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a saved job (optional)" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.role_title} · {j.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Job description</Label>
            <Textarea
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Your resume</Label>
            <Textarea
              rows={10}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your master resume…"
            />
          </div>
          <Button onClick={analyze} disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Analyze & Generate
          </Button>
        </div>

        <div className="rounded-xl border bg-card p-4">
          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center text-muted-foreground">
              <Sparkles className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">Run the analysis to see your match score and tailored content.</p>
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground mt-3">Analyzing…</p>
            </div>
          )}
          {result && (
            <div className="space-y-5">
              <div className="flex items-center gap-6">
                <MatchScoreRing score={result.matchScore} />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium mb-2">Missing keywords</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingKeywords.length === 0 && (
                      <span className="text-xs text-muted-foreground">None — great alignment.</span>
                    )}
                    {result.missingKeywords.map((k) => (
                      <Badge key={k} variant="secondary">
                        {k}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Tabs defaultValue="cover">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="cover">Cover Letter</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="improvements">Improvements</TabsTrigger>
                </TabsList>
                <TabsContent value="cover" className="mt-3">
                  <ContentBlock text={result.coverLetter} onCopy={() => copy(result.coverLetter)} />
                </TabsContent>
                <TabsContent value="summary" className="mt-3">
                  <ContentBlock
                    text={result.tailoredSummary}
                    onCopy={() => copy(result.tailoredSummary)}
                  />
                </TabsContent>
                <TabsContent value="improvements" className="mt-3">
                  <ul className="space-y-2 text-sm rounded-md border bg-background p-3">
                    {result.improvements.map((i, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{i}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
              </Tabs>
              <Button variant="outline" className="w-full" onClick={downloadPDF}>
                <Download className="h-4 w-4 mr-2" /> Download PDF
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ContentBlock({ text, onCopy }: { text: string; onCopy: () => void }) {
  return (
    <div className="relative rounded-md border bg-background p-3">
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 h-7 w-7"
        onClick={onCopy}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
      <pre className="whitespace-pre-wrap text-sm font-sans pr-8">{text}</pre>
    </div>
  );
}