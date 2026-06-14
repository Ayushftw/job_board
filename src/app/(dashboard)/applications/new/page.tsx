"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationForm } from "@/components/applications/ApplicationForm";
import type { CreateApplicationInput } from "@/dto/application.dto";

export default function NewApplicationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CreateApplicationInput) => {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Application created!");
      router.push("/applications");
    },
    onError: () => toast.error("Failed to create application"),
  });

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>New Application</CardTitle>
        </CardHeader>
        <CardContent>
          <ApplicationForm
            onSubmit={async (data) => { await mutation.mutateAsync(data); }}
            submitLabel="Create Application"
          />
        </CardContent>
      </Card>
    </div>
  );
}
