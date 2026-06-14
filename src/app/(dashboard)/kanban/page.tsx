"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/types";
import type { ApplicationStatus } from "@prisma/client";
import { toast } from "sonner";

export default function KanbanPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["applications-kanban"],
    queryFn: async () => {
      const res = await fetch("/api/applications?limit=100");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      const res = await fetch(`/api/applications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications-kanban"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  const apps = data?.items ?? [];

  const columns = APPLICATION_STATUSES.reduce(
    (acc, status) => {
      acc[status] = apps.filter((a: { status: ApplicationStatus }) => a.status === status);
      return acc;
    },
    {} as Record<ApplicationStatus, typeof apps>
  );

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as ApplicationStatus;
    const appId = result.draggableId;
    const app = apps.find((a: { id: string }) => a.id === appId);
    if (app && app.status !== newStatus) {
      statusMutation.mutate({ id: appId, status: newStatus });
    }
  }

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Kanban Board</h1>
        <p className="text-muted-foreground">Drag applications between stages</p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {APPLICATION_STATUSES.map((status) => (
            <div key={status} className="min-w-[280px] flex-shrink-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    {STATUS_LABELS[status]}
                    <span className="ml-2 text-muted-foreground">({columns[status]?.length ?? 0})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <Droppable droppableId={status}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="min-h-[200px] space-y-2">
                        {columns[status]?.map((app: { id: string; company: string; role: string; salary?: string }, index: number) => (
                          <Draggable key={app.id} draggableId={app.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={provided.draggableProps.style as React.CSSProperties}
                                className={`rounded-lg border border-border bg-background p-3 shadow-sm ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20" : ""}`}
                              >
                                <p className="font-medium text-sm">{app.company}</p>
                                <p className="text-xs text-muted-foreground">{app.role}</p>
                                {app.salary && <p className="mt-1 text-xs text-green-600">{app.salary}</p>}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
