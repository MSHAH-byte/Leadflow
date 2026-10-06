"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/state-panels";
import { LeadAnalysisView } from "@/components/leads/lead-analysis-view";
import { ResponseDraft } from "@/components/leads/response-draft";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createLead, ApiError } from "@/lib/api";
import {
  clearAnalysisDraft,
  getAnalysisDraftSnapshot,
  getServerAnalysisDraftSnapshot,
  saveAnalysisDraft,
  subscribeToAnalysisDraft,
  type AnalysisDraft,
} from "@/lib/analysis-draft";
import type { CreateLeadRequest } from "@/lib/types";

const subscribeNever = () => () => {};

function ReviewSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-5" role="status" aria-label={label}>
      <Skeleton className="h-40" />
      <div className="grid gap-5 md:grid-cols-2">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

export function AnalysisReview() {
  const router = useRouter();
  const draft = useSyncExternalStore(
    subscribeToAnalysisDraft,
    getAnalysisDraftSnapshot,
    getServerAnalysisDraftSnapshot,
  );
  // sessionStorage does not exist on the server, so wait for hydration before
  // deciding the draft is "missing" (avoids flashing the empty state).
  const hydrated = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // State updates are async, so a ref blocks a double-click from saving twice.
  const saveInFlight = useRef(false);

  if (!hydrated) return <ReviewSkeleton label="Loading analysis" />;

  // Once saved the draft is cleared; keep a placeholder up until navigation lands.
  if (saved) return <ReviewSkeleton label="Lead saved. Opening it now" />;

  if (draft === null) {
    return (
      <EmptyState
        title="No analysis to review"
        description="Analyze a customer inquiry first. Unsaved analyses live only in this browser tab."
        actionHref="/leads/new"
        actionLabel="Create New Lead"
      />
    );
  }

  const { input, analysis } = draft;

  function handleDraftChange(responseDraft: string) {
    const next: AnalysisDraft = {
      input,
      analysis: { ...analysis, response_draft: responseDraft },
    };
    // Persisted to this tab's storage so a refresh keeps the edit. Still not saved to the backend.
    saveAnalysisDraft(next);
  }

  async function handleApprove() {
    if (saveInFlight.current) return;

    // Built from the current draft at click time, so human edits are what get saved.
    const payload: CreateLeadRequest = {
      ...input,
      ...analysis,
      approved: true,
    };

    saveInFlight.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const savedLead = await createLead(payload);
      setSaved(true);
      clearAnalysisDraft();
      router.push(`/leads/${savedLead.id}`);
    } catch (error) {
      setSaveError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the lead. Please try again.",
      );
      saveInFlight.current = false;
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Review analysis"
        description="AI-generated analysis, ready for your review. Edit the response draft, then approve to save this lead."
        actions={
          <Link href="/leads/new" className={buttonVariants({ variant: "secondary" })}>
            <ArrowLeft aria-hidden="true" />
            Back to inquiry
          </Link>
        }
      />

      <LeadAnalysisView
        customerName={input.customer_name}
        contact={input.contact}
        inquiry={input.inquiry}
        analysis={analysis}
      >
        <ResponseDraft
          value={analysis.response_draft}
          onChange={handleDraftChange}
          disabled={saving}
        />

        <div className="sticky bottom-0 -mx-4 space-y-3 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          {saveError && (
            <div
              role="alert"
              className="rounded-md border border-danger/25 bg-danger-soft px-3.5 py-3 text-sm text-danger"
            >
              {saveError}
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
              {saving
                ? "Saving lead..."
                : "This lead isn't saved yet. Approving saves it exactly as shown above."}
            </p>
            <Button size="lg" onClick={handleApprove} loading={saving}>
              {!saving && <Check aria-hidden="true" />}
              {saving ? "Saving..." : "Approve & Save Lead"}
            </Button>
          </div>
        </div>
      </LeadAnalysisView>
    </>
  );
}
