"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ErrorState, EmptyState } from "@/components/layout/state-panels";
import { LeadTable } from "@/components/leads/lead-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getLeads } from "@/lib/api";
import type { LeadListItem, QualificationStatus } from "@/lib/types";
import { useApiResource } from "@/lib/use-api-resource";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | QualificationStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "qualified", label: "Qualified" },
  { value: "needs_information", label: "Needs Information" },
  { value: "not_qualified", label: "Not Qualified" },
];

/** Client-side search across customer, contact and project type. */
function matchesQuery(lead: LeadListItem, query: string): boolean {
  if (!query) return true;
  const haystack = [lead.customer_name, lead.contact ?? "", lead.project_type]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function HistorySkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Loading leads">
      <Skeleton className="h-10 w-full sm:w-80" />
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-14" />
      ))}
    </div>
  );
}

export function LeadHistory() {
  const { state, reload } = useApiResource(getLeads);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const leads = state.status === "success" ? state.data : null;

  // The API already returns newest first; filtering preserves that order.
  const visibleLeads = useMemo(() => {
    if (!leads) return [];
    const normalized = query.trim().toLowerCase();
    return leads.filter(
      (lead) =>
        (status === "all" || lead.qualification_status === status) &&
        matchesQuery(lead, normalized),
    );
  }, [leads, query, status]);

  if (state.status === "loading") return <HistorySkeleton />;

  if (state.status === "error") {
    return (
      <ErrorState
        title="Couldn't load your leads"
        message={state.error.message}
        onRetry={reload}
      />
    );
  }

  if (state.data.length === 0) {
    return (
      <EmptyState
        title="No saved leads found."
        description="Analyze your first inquiry to get started."
        actionHref="/leads/new"
        actionLabel="Create New Lead"
      />
    );
  }

  function clearFilters() {
    setQuery("");
    setStatus("all");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search customer, contact or project"
            aria-label="Search leads"
            className="pl-9"
          />
        </div>

        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1.5">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              aria-pressed={status === value}
              className={cn(
                "h-9 rounded-md border px-3 text-sm font-medium transition-colors",
                status === value
                  ? "border-primary/30 bg-primary-soft text-primary"
                  : "border-border bg-surface text-muted-foreground hover:bg-surface-muted hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing {visibleLeads.length} of {state.data.length}{" "}
        {state.data.length === 1 ? "lead" : "leads"}
      </p>

      {visibleLeads.length > 0 ? (
        <LeadTable leads={visibleLeads} />
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center">
          <p className="font-medium">No leads match your search.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different search term or status.
          </p>
          <Button variant="secondary" className="mt-4" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
