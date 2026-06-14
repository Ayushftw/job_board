"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Trophy, TrendingUp } from "lucide-react";

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["public-profile", username],
    queryFn: async () => {
      const res = await fetch(`/api/public/${username}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  if (isLoading) return <Skeleton className="mx-auto mt-20 h-96 max-w-2xl" />;
  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Profile not found or is private</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="mx-auto max-w-2xl space-y-6 px-4 animate-fade-in">
        <div className="text-center">
          {profile.image ? (
            <img src={profile.image} alt="" className="mx-auto h-20 w-20 rounded-full" />
          ) : (
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              {profile.name?.[0]?.toUpperCase()}
            </div>
          )}
          <h1 className="mt-4 text-2xl font-bold">{profile.name}</h1>
          <p className="text-muted-foreground">@{profile.username}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Applications", value: profile.stats.totalApplications, icon: Briefcase },
            { label: "Interviews", value: profile.stats.interviews, icon: TrendingUp },
            { label: "Offers", value: profile.stats.offers, icon: Trophy },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <s.icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {profile.summary && (
          <Card>
            <CardHeader><CardTitle>About</CardTitle></CardHeader>
            <CardContent><p className="text-sm">{profile.summary}</p></CardContent>
          </Card>
        )}

        {(profile.skills?.length > 0 || profile.technologies?.length > 0) && (
          <Card>
            <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[...(profile.skills ?? []), ...(profile.technologies ?? [])].map((s: string) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          {profile.stats.responseRate}% response rate · Powered by JobTrackr
        </p>
      </div>
    </div>
  );
}
