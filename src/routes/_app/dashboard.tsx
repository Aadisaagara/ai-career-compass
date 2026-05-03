import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useJobs } from "@/hooks/useJobs";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import type { Job, JobStatus } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

const STATUSES: JobStatus[] = ["Saved", "Applied", "Interview", "Offer"];

function DashboardPage() {
  const { jobs, loading, createJob, updateJob, deleteJob } = useJobs();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ company_name: "", role_title: "", job_description: "" });
  const [selected, setSelected] = useState<Job | null>(null);

  const grouped = useMemo(() => {
    const m: Record<JobStatus, Job[]> = { Saved: [], Applied: [], Interview: [], Offer: [] };
    jobs.forEach((j) => m[j.status as JobStatus]?.push(j));
    return m;
  }, [jobs]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function onDragEnd(e: DragEndEvent) {
    const job = e.active.data.current?.job as Job | undefined;
    const over = e.over?.id as JobStatus | undefined;
    if (!job || !over || job.status === over) return;
    updateJob(job.id, { status: over });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const j = await createJob(form);
    setCreating(false);
    if (j) {
      setOpen(false);
      setForm({ company_name: "", role_title: "", job_description: "" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Job Board</h1>
          <p className="text-sm text-muted-foreground">Track applications across stages.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" /> Add Job
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a job</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Input
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Input
                  value={form.role_title}
                  onChange={(e) => setForm({ ...form, role_title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Job description (optional)</Label>
                <Textarea
                  rows={6}
                  value={form.job_description}
                  onChange={(e) => setForm({ ...form, job_description: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUSES.map((s) => (
            <Skeleton key={s} className="h-[60vh]" />
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATUSES.map((s) => (
              <KanbanColumn
                key={s}
                status={s}
                jobs={grouped[s]}
                onCardClick={(j) => setSelected(j)}
              />
            ))}
          </div>
        </DndContext>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selected?.role_title} · {selected?.company_name}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">Status: {selected.status}</div>
              <div className="space-y-1.5">
                <Label>Job description</Label>
                <Textarea
                  rows={8}
                  defaultValue={selected.job_description ?? ""}
                  onBlur={(e) =>
                    e.target.value !== (selected.job_description ?? "") &&
                    updateJob(selected.id, { job_description: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-between pt-2">
                <Button
                  variant="destructive"
                  onClick={async () => {
                    const ok = await deleteJob(selected.id);
                    if (ok) setSelected(null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
                <Button
                  onClick={() => {
                    const j = selected;
                    setSelected(null);
                    navigate({ to: "/generator", search: { jobId: j.id } as never });
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-1" /> Tailor with AI
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}