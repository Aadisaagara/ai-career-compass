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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { MatchScoreRing } from "@/components/generator/MatchScoreRing";
import { ResumePreview } from "@/components/generator/ResumePreview";
import { PdfUpload } from "@/components/resume/PdfUpload";
import { Sparkles, Loader2, Download, Copy, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  exportApplicationPDF,
  exportTailoredResumePDF,
} from "@/lib/pdf";
import {
  fetchResumes,
  generateTailoredResume,
  type Resume,
  type TailoredResumeResponse,
} from "@/lib/api";

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

  // New state for Resume Vault integration
  const [savedResumes, setSavedResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [showPdfUpload, setShowPdfUpload] = useState(false);
  const [tailoredResume, setTailoredResume] = useState<TailoredResumeResponse | null>(null);
  const [generatingTailored, setGeneratingTailored] = useState(false);

  // Load saved resumes on mount
  useEffect(() => {
    loadSavedResumes();
  }, []);

  async function loadSavedResumes() {
    try {
      const resumes = await fetchResumes();
      setSavedResumes(resumes);
      const defaultResume = resumes.find((r) => r.is_default);
      if (defaultResume) {
        setSelectedResumeId(defaultResume.id);
        setResumeText(defaultResume.raw_text);
      }
    } catch (e) {
      // Silently fail if no resumes available
    }
  }

  // Handle resume selection from vault
  function handleSelectResume(resumeId: string) {
    setSelectedResumeId(resumeId);
    const selected = savedResumes.find((r) => r.id === resumeId);
    if (selected) {
      setResumeText(selected.raw_text);
    }
  }

  // Handle PDF upload extraction
  function handlePdfExtracted(text: string) {
    setResumeText(text);
    setShowPdfUpload(false);
    toast.success("Resume imported");
  }

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

  async function generateTailored() {
    if (!jobDescription.trim() || !resumeText.trim()) {
      toast.error("Add a job description and your resume first");
      return;
    }
    setGeneratingTailored(true);
    try {
      const response = await generateTailoredResume({
        jobDescription,
        resumeText,
        jobId: selectedJobId,
        resumeId: selectedResumeId || undefined,
        candidateName: profile?.full_name || "Candidate",
      });
      setTailoredResume(response);
      toast.success("Tailored resume generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate tailored resume");
    } finally {
      setGeneratingTailored(false);
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

  function downloadTailoredResumePDF() {
    if (!tailoredResume) return;
    const job = jobs.find((j) => j.id === selectedJobId);
    exportTailoredResumePDF(
      tailoredResume,
      profile?.full_name || "Candidate",
      job?.company_name,
    );
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

          {/* Resume Source Section */}
          <div className="space-y-2 p-3 rounded-md bg-muted/30 border border-muted">
            <h3 className="text-sm font-semibold">Resume Source</h3>

            {savedResumes.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">Select from vault</Label>
                <Select value={selectedResumeId} onValueChange={handleSelectResume}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Choose a saved resume" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedResumes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                        {r.is_default ? " (default)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!showPdfUpload && (
              <button
                onClick={() => setShowPdfUpload(true)}
                className="text-xs text-primary hover:underline"
              >
                Or upload a new PDF
              </button>
            )}

            {showPdfUpload && (
              <PdfUpload onTextExtracted={handlePdfExtracted} className="mt-2" />
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Resume text (editable)</Label>
            <Textarea
              rows={8}
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

          <Button
            onClick={generateTailored}
            disabled={generatingTailored || !jobDescription.trim() || !resumeText.trim()}
            variant="outline"
            className="w-full"
          >
            {generatingTailored ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Tailored Resume
          </Button>
        </div>

        <div className="rounded-xl border bg-card p-4">
          {!result && !loading && !tailoredResume && !generatingTailored && (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center text-muted-foreground">
              <Sparkles className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">Run the analysis to see your match score and tailored content.</p>
            </div>
          )}
          {(loading || generatingTailored) && (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground mt-3">
                {generatingTailored ? "Generating tailored resume…" : "Analyzing…"}
              </p>
            </div>
          )}
          {(result || tailoredResume) && (
            <div className="space-y-5">
              <Tabs defaultValue={tailoredResume ? "tailored" : "cover"}>
                <TabsList className={`grid w-full ${tailoredResume ? "grid-cols-4" : "grid-cols-3"}`}>
                  <TabsTrigger value="cover">Cover Letter</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="improvements">Improvements</TabsTrigger>
                  {tailoredResume && <TabsTrigger value="tailored">Tailored Resume</TabsTrigger>}
                </TabsList>

                {result && (
                  <>
                    <TabsContent value="cover" className="mt-3">
                      <div className="flex items-center gap-6 mb-4">
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
                      <ContentBlock
                        text={result.coverLetter}
                        onCopy={() => copy(result.coverLetter)}
                      />
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
                  </>
                )}

                {tailoredResume && (
                  <TabsContent value="tailored" className="mt-3 space-y-4">
                    {/* ATS Match & Keywords */}
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-primary">ATS Match Estimate: {tailoredResume.atsMatchScore}%</p>
                        <p className="text-xs text-muted-foreground mt-0.5">We've added {tailoredResume.keywordsAdded} relevant keywords from the job description.</p>
                      </div>
                      <Button onClick={downloadTailoredResumePDF} size="sm">
                        <Download className="h-4 w-4 mr-2" /> Download PDF
                      </Button>
                    </div>

                    <div className="bg-muted/30 p-2 rounded-xl overflow-hidden border">
                      <div className="max-h-[600px] overflow-y-auto custom-scrollbar p-1">
                         <ResumePreview data={tailoredResume} />
                      </div>
                    </div>
                  </TabsContent>
                )}
              </Tabs>

              {result && !tailoredResume && (
                <Button variant="outline" className="w-full" onClick={downloadPDF}>
                  <Download className="h-4 w-4 mr-2" /> Download PDF
                </Button>
              )}
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