"use client";

import { useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/layout/state-panels";
import { LeadAnalysisView } from "@/components/leads/lead-analysis-view";
import { ResponseDraft } from "@/components/leads/response-draft";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getLead } from "@/lib/api";
import { useApiResource } from "@/lib/use-api-resource";
import { formatDateTime } from "@/lib/utils";

function DetailSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading lead">
      <Skeleton className="h-40" />
      <div className="grid gap-5 md:grid-cols-2">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}

export function LeadDetail({ id }: { id: string }) {
  // Stable reference so the request only re-runs when the id changes.
  const fetchLead = useCallback(() => getLead(id), [id]);
  const { state, reload } = useApiResource(fetchLead);

  if (state.status === "loading") return <DetailSkeleton />;

  if (state.status === "error") {
    const { error } = state;
    return error.isNotFound ? (
      <ErrorState
        title="Lead not found."
        message="This lead doesn't exist or may have been removed."
        backHref="/leads/history"
        backLabel="Back to leads"
      />
    ) : (
      <ErrorState
        title="Couldn't load this lead"
        message={error.message}
        onRetry={reload}
        backHref="/leads/history"
        backLabel="Back to leads"
      />
    );
  }

  const lead = state.data;

  return (
    <>
      <PageHeader
        title={`Lead #${lead.id}`}
        description="Saved lead. This is the approved version."
        actions={
          <Link href="/leads/history" className={buttonVariants({ variant: "secondary" })}>
            <ArrowLeft aria-hidden="true" />
            Back to leads
          </Link>
        }
      />

      <LeadAnalysisView
        customerName={lead.customer_name}
        contact={lead.contact}
        inquiry={lead.inquiry}
        analysis={lead}
      >
        <ResponseDraft value={lead.response_draft} />

        <Card>
          <CardContent className="p-5">
            <dl className="grid gap-4 sm:grid-cols-3">
              <MetaItem label="Approval">
                {lead.approved ? (
                  <Badge tone="success">
                    <CheckCircle2 aria-hidden="true" />
                    Approved
                  </Badge>
                ) : (
                  <Badge>
                    <Clock aria-hidden="true" />
                    Not approved
                  </Badge>
                )}
              </MetaItem>
              <MetaItem label="Created">{formatDateTime(lead.created_at)}</MetaItem>
              <MetaItem label="Updated">{formatDateTime(lead.updated_at)}</MetaItem>
            </dl>
          </CardContent>
        </Card>
      </LeadAnalysisView>
    </>
  );
}
