"use client";

import { useQuery } from "@tanstack/react-query";

export function useResumes() {
  return useQuery({
    queryKey: ["resumes"],
    queryFn: async () => {
      const res = await fetch("/api/resumes");
      if (!res.ok) throw new Error("Failed to fetch resumes");
      return res.json();
    },
  });
}
