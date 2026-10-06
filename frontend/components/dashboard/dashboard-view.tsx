"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert, CircleX, Users } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { ErrorState, EmptyState } from "@/components/layout/state-panels";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getLeads } from "@/lib/api";
import type { LeadListItem } from "@/lib/types";
import { useApiResource } from "@/lib/use-api-resource";
import { formatDate } from "@/lib/utils";

const RECENT_LEAD_LIMIT = 5;

function countByStatus(leads: LeadListItem[], status: LeadListItem["qualification_status"]) {
  return leads.filter((lead) => lead.qualification_status === status).length;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

export function DashboardView() {
  const { state, reload } = useApiResource(getLeads);

  if (state.status === "loading") return <DashboardSkeleton />;

  if (state.status === "error") {
    return (
      <ErrorState
        title="Couldn't load your dashboard"
        message={state.error.message}
        onRetry={reload}
      />
    );
  }

  const leads = state.data;

  if (leads.length === 0) {
    return (
      <EmptyState
        title="No leads yet."
        description="Turn your first customer inquiry into an actionable lead."
        actionHref="/leads/new"
        actionLabel="Create New Lead"
      />
    );
  }

  // The API returns newest first, so the head of the list is the most recent.
  const recent = leads.slice(0, RECENT_LEAD_LIMIT);

  return (
    <div className="space-y-6">
      <section aria-label="Lead totals" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Leads"
          value={leads.length}
          Icon={Users}
          accentClassName="bg-primary-soft text-primary"
        />
        <StatCard
          label="Qualified"
          value={countByStatus(leads, "qualified")}
          Icon={CheckCircle2}
          accentClassName="bg-success-soft text-success"
        />
        <StatCard
          label="Needs Information"
          value={countByStatus(leads, "needs_information")}
          Icon={CircleAlert}
          accentClassName="bg-warning-soft text-warning"
        />
        <StatCard
          label="Not Qualified"
          value={countByStatus(leads, "not_qualified")}
          Icon={CircleX}
          accentClassName="bg-danger-soft text-danger"
        />
      </section>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 pb-2">
          <CardTitle>Recent leads</CardTitle>
          <Link href="/leads/history" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            View all
            <ArrowRight aria-hidden="true" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {recent.map((lead) => (
              <li key={lead.id}>
                <Link
                  href={`/leads/${lead.id}`}
                  className="flex flex-col gap-2 px-5 py-3.5 transition-colors hover:bg-surface-muted/60 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{lead.customer_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {lead.project_type} · {formatDate(lead.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <LeadStatusBadge status={lead.qualification_status} />
                    <span className="w-8 text-right text-sm font-semibold tabular-nums">
                      {lead.qualification_score}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
