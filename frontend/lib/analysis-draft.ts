import type { AnalyzeLeadRequest, LeadAnalysis } from "@/lib/types";

/**
 * Holds the UNSAVED analysis between /leads/new and /leads/analysis.
 *
 * sessionStorage is used on purpose: it survives a refresh of the review page,
 * is scoped to the tab, needs no dependency, and never touches the backend.
 * Every access is guarded because storage can be unavailable (private mode,
 * blocked cookies) or contain stale data from an older shape.
 *
 * The module also exposes a subscribe/getSnapshot pair so React can read the
 * draft through useSyncExternalStore instead of copying it into state in an effect.
 */
export interface AnalysisDraft {
  input: AnalyzeLeadRequest;
  analysis: LeadAnalysis;
}

const STORAGE_KEY = "leadflow:analysis-draft";

function isDraft(value: unknown): value is AnalysisDraft {
  if (typeof value !== "object" || value === null) return false;
  const { input, analysis } = value as Partial<AnalysisDraft>;
  return (
    typeof input?.customer_name === "string" &&
    typeof input?.inquiry === "string" &&
    typeof analysis?.project_type === "string" &&
    typeof analysis?.response_draft === "string" &&
    Array.isArray(analysis?.requirements)
  );
}

function parseDraft(raw: string | null): AnalysisDraft | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readRaw(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

// useSyncExternalStore requires getSnapshot to return the SAME object until the
// data changes, so the parsed draft is cached against the raw string.
let cachedRaw: string | null = null;
let cachedDraft: AnalysisDraft | null = null;

export function getAnalysisDraftSnapshot(): AnalysisDraft | null {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedDraft = parseDraft(raw);
  }
  return cachedDraft;
}

export function getServerAnalysisDraftSnapshot(): AnalysisDraft | null {
  return null;
}

export function subscribeToAnalysisDraft(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function saveAnalysisDraft(draft: AnalysisDraft): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Storage unavailable: the review page will show its "nothing to review" state.
  }
  notify();
}

export function clearAnalysisDraft(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
  notify();
}
