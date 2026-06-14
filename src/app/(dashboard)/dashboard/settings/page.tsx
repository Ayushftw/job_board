"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Copy } from "lucide-react";

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: metrics } = useQuery({
    queryKey: ["metrics"],
    queryFn: async () => {
      const res = await fetch("/api/metrics");
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (body: { publicProfile?: boolean; username?: string }) => {
      const res = await fetch("/api/metrics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
      toast.success("Settings updated");
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and API access</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Public Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              defaultValue={metrics?.username ?? ""}
              onBlur={(e) => mutation.mutate({ username: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="public">Enable public profile</Label>
            <Switch
              id="public"
              checked={metrics?.publicProfile ?? false}
              onCheckedChange={(v) => mutation.mutate({ publicProfile: v })}
            />
          </div>
          {metrics?.username && metrics?.publicProfile && (
            <p className="text-sm text-muted-foreground">
              Your profile: /u/{metrics.username}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Chrome Extension API Key</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use this key in the JobTrackr Chrome extension to import LinkedIn jobs.
          </p>
          <div className="flex gap-2">
            <Input readOnly value={metrics?.apiKey ?? ""} className="font-mono text-xs" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(metrics?.apiKey ?? "");
                toast.success("Copied!");
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Usage Metrics</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Applications", value: metrics?.totalApplications ?? 0 },
              { label: "Resumes Parsed", value: metrics?.totalResumes ?? 0 },
              { label: "AI Requests", value: metrics?.totalAIRequests ?? 0 },
              { label: "Match Analyses", value: metrics?.totalMatchAnalyses ?? 0 },
            ].map((m) => (
              <div key={m.label}>
                <p className="text-2xl font-bold">{m.value}</p>
                <p className="text-sm text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
