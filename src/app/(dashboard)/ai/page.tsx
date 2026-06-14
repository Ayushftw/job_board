"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { MESSAGE_TYPE_LABELS } from "@/types";

export default function AIPage() {
  const [selectedResume, setSelectedResume] = useState("");
  const [selectedApp, setSelectedApp] = useState("");
  const [matchResult, setMatchResult] = useState<{ score: number; matchedSkills: string[]; missingSkills: string[]; recommendations: string[] } | null>(null);
  const [interviewPrep, setInterviewPrep] = useState<{ questions: Array<{ type: string; question: string; tip: string }>; roadmap: string[] } | null>(null);
  const [messageType, setMessageType] = useState("FOLLOW_UP");
  const [messageContext, setMessageContext] = useState("");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: resumes } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => {
      const res = await fetch("/api/resumes");
      return res.json();
    },
  });

  const { data: apps } = useQuery({
    queryKey: ["applications-ai"],
    queryFn: async () => {
      const res = await fetch("/api/applications?limit=50");
      return res.json();
    },
  });

  async function runMatchScore() {
    if (!selectedResume || !selectedApp) {
      toast.error("Select a resume and application");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/ai/match-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeId: selectedResume, applicationId: selectedApp }),
    });
    setLoading(false);
    if (res.ok) {
      setMatchResult(await res.json());
    } else {
      toast.error("Match analysis failed");
    }
  }

  async function runInterviewPrep() {
    if (!selectedApp) return toast.error("Select an application");
    setLoading(true);
    const res = await fetch("/api/ai/interview-prep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: selectedApp }),
    });
    setLoading(false);
    if (res.ok) setInterviewPrep(await res.json());
    else toast.error("Interview prep failed");
  }

  async function generateMessage() {
    if (!messageContext) return toast.error("Provide context");
    setLoading(true);
    setGeneratedMessage("");
    const res = await fetch("/api/ai/generate-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: messageType, context: messageContext, applicationId: selectedApp || undefined }),
    });
    setLoading(false);
    if (res.ok && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value);
        setGeneratedMessage(text);
      }
    } else {
      toast.error("Message generation failed");
    }
  }

  const parsedResumes = resumes?.filter((r: { parseStatus: string }) => r.parseStatus === "DONE") ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">AI Tools</h1>
        <p className="text-muted-foreground">Match scoring, interview prep, and message generation</p>
      </div>

      <Tabs defaultValue="match">
        <TabsList>
          <TabsTrigger value="match">Match Score</TabsTrigger>
          <TabsTrigger value="interview">Interview Prep</TabsTrigger>
          <TabsTrigger value="message">Message Generator</TabsTrigger>
        </TabsList>

        <TabsContent value="match" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Resume-Job Match Engine</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Resume</Label>
                  <Select value={selectedResume} onValueChange={setSelectedResume}>
                    <SelectTrigger><SelectValue placeholder="Select parsed resume" /></SelectTrigger>
                    <SelectContent>
                      {parsedResumes.map((r: { id: string; name: string }) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Application</Label>
                  <Select value={selectedApp} onValueChange={setSelectedApp}>
                    <SelectTrigger><SelectValue placeholder="Select application" /></SelectTrigger>
                    <SelectContent>
                      {apps?.items?.map((a: { id: string; company: string; role: string }) => (
                        <SelectItem key={a.id} value={a.id}>{a.company} — {a.role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={runMatchScore} disabled={loading}>Analyze Match</Button>
              {matchResult && (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold">{matchResult.score}%</span>
                    <Progress value={matchResult.score} className="flex-1" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Matched Skills</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {matchResult.matchedSkills.map((s) => <Badge key={s} variant="default">{s}</Badge>)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Missing Skills</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {matchResult.missingSkills.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
                    </div>
                  </div>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {matchResult.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interview">
          <Card>
            <CardHeader><CardTitle>Interview Preparation</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Application</Label>
                <Select value={selectedApp} onValueChange={setSelectedApp}>
                  <SelectTrigger><SelectValue placeholder="Select application" /></SelectTrigger>
                  <SelectContent>
                    {apps?.items?.map((a: { id: string; company: string; role: string }) => (
                      <SelectItem key={a.id} value={a.id}>{a.company} — {a.role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={runInterviewPrep} disabled={loading}>Generate Prep</Button>
              {loading && <Skeleton className="h-32" />}
              {interviewPrep && (
                <div className="space-y-4">
                  {interviewPrep.questions.map((q, i) => (
                    <div key={i} className="rounded-lg border p-3">
                      <Badge variant="secondary" className="mb-2">{q.type}</Badge>
                      <p className="font-medium">{q.question}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{q.tip}</p>
                    </div>
                  ))}
                  <div>
                    <p className="font-medium">Study Roadmap</p>
                    <ol className="mt-2 list-decimal pl-5 text-sm text-muted-foreground">
                      {interviewPrep.roadmap.map((step, i) => <li key={i}>{step}</li>)}
                    </ol>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="message">
          <Card>
            <CardHeader><CardTitle>AI Message Generator</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Message Type</Label>
                <Select value={messageType} onValueChange={setMessageType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(MESSAGE_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Context</Label>
                <Textarea
                  rows={4}
                  placeholder="Describe the situation, company, role, and any details..."
                  value={messageContext}
                  onChange={(e) => setMessageContext(e.target.value)}
                />
              </div>
              <Button onClick={generateMessage} disabled={loading}>Generate Message</Button>
              {generatedMessage && (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="whitespace-pre-wrap text-sm">{generatedMessage}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
