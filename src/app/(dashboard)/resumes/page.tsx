"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useUploadThing } from "@/lib/uploadthing-client";
import { toast } from "sonner";
import { PARSE_STATUS_LABELS } from "@/types";
import type { ParseStatus } from "@prisma/client";

function ParsedProfileCard({ profile }: { profile: { skills: string[]; technologies: string[]; yearsOfExperience: number; summary?: string } }) {
  return (
    <div className="mt-3 space-y-2 rounded-lg bg-muted/50 p-3">
      <p className="text-xs font-medium text-muted-foreground">{profile.yearsOfExperience} years experience</p>
      {profile.summary && <p className="text-sm">{profile.summary}</p>}
      <div className="flex flex-wrap gap-1">
        {[...(profile.skills ?? []), ...(profile.technologies ?? [])].slice(0, 10).map((s: string) => (
          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
        ))}
      </div>
    </div>
  );
}

export default function ResumesPage() {
  const queryClient = useQueryClient();

  const { data: resumes, isLoading } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => {
      const res = await fetch("/api/resumes");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: (query) => {
      const data = query.state.data as Array<{ parseStatus: ParseStatus }> | undefined;
      const hasPending = data?.some((r) => r.parseStatus === "PENDING" || r.parseStatus === "PROCESSING");
      return hasPending ? 3000 : false;
    },
  });

  const { startUpload, isUploading } = useUploadThing("resumeUploader", {
    onClientUploadComplete: async (files) => {
      const file = files[0];
      if (!file) return;
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          fileUrl: file.url,
          fileKey: file.key,
        }),
      });
      if (res.ok) {
        toast.success("Resume uploaded! Parsing started...");
        queryClient.invalidateQueries({ queryKey: ["resumes"] });
      }
    },
    onUploadError: () => { toast.error("Upload failed"); },
  });

  async function handleDelete(id: string) {
    if (!confirm("Delete this resume?")) return;
    await fetch(`/api/resumes/${id}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["resumes"] });
    toast.success("Resume deleted");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Resume Manager</h1>
          <p className="text-muted-foreground">Upload and manage resume versions with AI parsing</p>
        </div>
        <Button
          disabled={isUploading}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "application/pdf";
            input.onchange = (e) => {
              const files = (e.target as HTMLInputElement).files;
              if (files) startUpload(Array.from(files));
            };
            input.click();
          }}
          className="gap-2"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload Resume
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : resumes?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No resumes uploaded yet</p>
            <p className="text-sm text-muted-foreground">Upload a PDF to start AI-powered parsing</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {resumes?.map((resume: {
            id: string;
            name: string;
            version: number;
            parseStatus: ParseStatus;
            tags: string[];
            profile?: { skills: string[]; technologies: string[]; yearsOfExperience: number; summary?: string };
          }) => (
            <Card key={resume.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base">{resume.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">Version {resume.version}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={resume.parseStatus === "DONE" ? "default" : "secondary"}>
                    {PARSE_STATUS_LABELS[resume.parseStatus]}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(resume.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(resume.parseStatus === "PENDING" || resume.parseStatus === "PROCESSING") && (
                  <div className="space-y-2">
                    <Progress value={resume.parseStatus === "PROCESSING" ? 60 : 20} />
                    <p className="text-xs text-muted-foreground">AI parsing in progress...</p>
                  </div>
                )}
                {resume.profile && <ParsedProfileCard profile={resume.profile as { skills: string[]; technologies: string[]; yearsOfExperience: number; summary?: string }} />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
