import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Job } from "@/store/useAppStore";
import { relativeTime } from "@/lib/format";
import { Building2 } from "lucide-react";

export function JobCard({ job, onClick }: { job: Job; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
    data: { job },
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        if (isDragging) return;
        e.stopPropagation();
        onClick?.();
      }}
      className="group cursor-grab active:cursor-grabbing rounded-lg border bg-background p-3 shadow-sm hover:border-primary/50 transition-all"
    >
      <div className="flex items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm truncate">{job.role_title}</div>
          <div className="text-xs text-muted-foreground truncate">{job.company_name}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{relativeTime(job.created_at)}</span>
        <span className="rounded-full border px-2 py-0.5">{job.status}</span>
      </div>
    </div>
  );
}