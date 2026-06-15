"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ExternalLink, Mail, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/applications/StatusBadge";
import { OutreachModal } from "@/components/applications/OutreachModal";
import type { ApplicationStatus } from "@prisma/client";
import { toast } from "sonner";

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [outreachOpen, setOutreachOpen] = useState(false);

  const { data: app, isLoading } = useQuery({
    queryKey: ["application", id],
    queryFn: async () => {
      const res = await fetch(`/api/applications/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  async function handleMarkApplied() {
    const res = await fetch(`/api/applications/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: "APPLIED" }),
    });
    if (res.ok) {
      toast.success("Marked as applied");
      queryClient.invalidateQueries({ queryKey: ["application", id] });
      queryClient.invalidateQueries({ queryKey: ["applications-kanban"] });
    } else {
      toast.error("Failed to update status");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this application?")) return;
    const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      router.push("/applications");
    }
  }

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!app) return <p>Application not found</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link href="/applications" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setOutreachOpen(true)}>
            <Mail className="mr-2 h-4 w-4" />
            Send Outreach
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{app.company}</h1>
          <p className="text-lg text-muted-foreground">{app.role}</p>
        </div>
        <StatusBadge status={app.status as ApplicationStatus} />
      </div>

      {app.status !== "APPLIED" && (
        <div className="flex items-center justify-between rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Haven&apos;t applied yet? Mark this job once you&apos;ve submitted your application.
          </p>
          <Button size="sm" onClick={handleMarkApplied}>
            Mark as Applied
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {app.salary && (
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Salary</p><p className="font-medium">{app.salary}</p></CardContent></Card>
        )}
        {app.location && (
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Location</p><p className="font-medium">{app.location}</p></CardContent></Card>
        )}
        {app.recruiterName && (
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Recruiter</p><p className="font-medium">{app.recruiterName}</p></CardContent></Card>
        )}
        {app.recruiterEmail && (
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Recruiter Email</p><p className="font-medium">{app.recruiterEmail}</p></CardContent></Card>
        )}
        {app.jobUrl && (
          <Card><CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Job URL</p>
            <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
              View posting <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent></Card>
        )}
      </div>

      {app.jobDescription && (
        <Card>
          <CardHeader><CardTitle>Job Description</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-sm">{app.jobDescription}</p></CardContent>
        </Card>
      )}

      {app.notes && (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-sm">{app.notes}</p></CardContent>
        </Card>
      )}

      {app.interviews?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Interview Timeline</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {app.interviews.map((i: { id: string; stage: string; scheduledAt?: string; outcome?: string }) => (
              <div key={i.id} className="flex items-center justify-between border-l-2 border-primary pl-4">
                <div>
                  <p className="font-medium">{i.stage}</p>
                  {i.scheduledAt && <p className="text-sm text-muted-foreground">{new Date(i.scheduledAt).toLocaleDateString()}</p>}
                </div>
                {i.outcome && <span className="text-sm">{i.outcome}</span>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <OutreachModal
        open={outreachOpen}
        onOpenChange={setOutreachOpen}
        applicationId={id}
        company={app.company}
        role={app.role}
        recruiterName={app.recruiterName}
        recruiterEmail={app.recruiterEmail}
        jobDescription={app.jobDescription}
        onSent={() => queryClient.invalidateQueries({ queryKey: ["application", id] })}
      />
    </div>
  );
}
