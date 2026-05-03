import { useDroppable } from "@dnd-kit/core";
import type { Job, JobStatus } from "@/store/useAppStore";
import { JobCard } from "./JobCard";
import { cn } from "@/lib/utils";

export function KanbanColumn({
  status,
  jobs,
  onCardClick,
}: {
  status: JobStatus;
  jobs: Job[];
  onCardClick: (j: Job) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-xl border bg-card/50 p-3 min-h-[60vh] transition-colors",
        isOver && "bg-primary/5 border-primary/40",
      )}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold">{status}</h3>
        <span className="text-xs text-muted-foreground rounded-full bg-muted px-2 py-0.5">
          {jobs.length}
        </span>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        {jobs.map((j) => (
          <JobCard key={j.id} job={j} onClick={() => onCardClick(j)} />
        ))}
        {jobs.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-8 border border-dashed rounded-lg">
            Drop jobs here
          </div>
        )}
      </div>
    </div>
  );
}