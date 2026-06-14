import type { ApplicationStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS, STATUS_LABELS } from "@/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <Badge variant="outline" className={cn("border-0 font-medium", STATUS_COLORS[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
