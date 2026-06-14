"use client";

import Link from "next/link";
import type { Application, ApplicationStatus } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/applications/StatusBadge";
import { formatRelativeTime } from "@/lib/utils";
import { Building2, ExternalLink } from "lucide-react";

export function ApplicationCard({ application }: { application: Application }) {
  return (
    <Link href={`/applications/${application.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">{application.company}</p>
              <p className="text-sm text-muted-foreground">{application.role}</p>
              <p className="text-xs text-muted-foreground">
                Applied {formatRelativeTime(application.appliedAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {application.salary && (
              <span className="text-sm font-medium text-green-600">{application.salary}</span>
            )}
            <StatusBadge status={application.status as ApplicationStatus} />
            {application.jobUrl && (
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
