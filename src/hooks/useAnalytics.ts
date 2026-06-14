"use client";

import { useQuery } from "@tanstack/react-query";

export function useAnalytics(full = false) {
  return useQuery({
    queryKey: full ? ["analytics-full"] : ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch(full ? "/api/analytics?full=true" : "/api/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });
}
