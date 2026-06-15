"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/types";
import type { ApplicationStatus } from "@prisma/client";
import { toast } from "sonner";

interface KanbanApplication {
  id: string;
  company: string;
  role: string;
  salary?: string;
  status: ApplicationStatus;
}

interface KanbanData {
  items: KanbanApplication[];
  total: number;
  page: number;
  limit: number;
}

export default function KanbanPage() {
  const queryClient = useQueryClient();
  const { data: session, status: sessionStatus } = useSession();
  const userId = session?.user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["applications-kanban", userId],
    enabled: sessionStatus === "authenticated" && !!userId,
    queryFn: async () => {
      const res = await fetch("/api/applications?limit=100", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load applications");
      return res.json() as Promise<KanbanData>;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      const res = await fetch(`/api/applications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error ?? "Failed to update status");
      }
      return payload;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["applications-kanban", userId] });
      const prev = queryClient.getQueryData<KanbanData>(["applications-kanban", userId]);
      queryClient.setQueryData<KanbanData>(["applications-kanban", userId], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((a) => (a.id === id ? { ...a, status } : a)),
        };
      });
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["applications-kanban", userId], ctx.prev);
      }
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications-kanban", userId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });

  const apps = data?.items ?? [];

  const columns = APPLICATION_STATUSES.reduce(
    (acc, status) => {
      acc[status] = apps.filter((a) => a.status === status);
      return acc;
    },
    {} as Record<ApplicationStatus, KanbanApplication[]>
  );

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as ApplicationStatus;
    const appId = result.draggableId;
    const app = apps.find((a) => a.id === appId);
    if (!APPLICATION_STATUSES.includes(newStatus)) return;
    if (app && app.status !== newStatus) {
      statusMutation.mutate({ id: appId, status: newStatus });
    }
  }

  if (sessionStatus === "loading" || isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Kanban Board</h1>
        <p className="text-muted-foreground">Drag applications between stages</p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="overflow-x-auto pb-4">
          <div className="flex w-max min-w-full gap-4">
          {APPLICATION_STATUSES.map((status) => (
            <div key={status} className="w-[280px] shrink-0">
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
                        {columns[status]?.map((app, index) => (
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
        </div>
      </DragDropContext>
    </div>
  );
}
