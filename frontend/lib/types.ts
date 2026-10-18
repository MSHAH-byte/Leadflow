/**
 * Domain and API types for LeadFlow.
 * These mirror the FastAPI contract under /api/v1 and are the single source of
 * truth for the frontend. Do not redeclare them in pages or components.
 */

export type QualificationStatus =
  | "qualified"
  | "needs_information"
  | "not_qualified";

export interface AnalyzeLeadRequest {
  customer_name: string;
  contact: string | null;
  inquiry: string;
}

/** Structured AI output returned by POST /leads/analyze (not yet saved). */
export interface LeadAnalysis {
  project_type: string;
  requirements: string[];
  qualification_status: QualificationStatus;
  /** Heuristic 0-100. Not a conversion probability. */
  qualification_score: number;
  qualification_factors: string[];
  missing_information: string[];
  suggested_questions: string[];
  response_draft: string;
}

export interface AnalyzeLeadResponse {
  analysis: LeadAnalysis;
}

/** Payload for POST /leads: the reviewed analysis plus the original input. */
export interface CreateLeadRequest extends LeadAnalysis {
  customer_name: string;
  contact: string | null;
  inquiry: string;
  approved: boolean;
}

/** Full persisted lead (GET /leads/{id}, and the POST /leads response). */
export interface LeadResponse extends CreateLeadRequest {
  id: number;
  created_at: string;
  updated_at: string;
}

/** Compact row returned by GET /leads. */
export interface LeadListItem {
  id: number;
  customer_name: string;
  contact: string | null;
  project_type: string;
  qualification_status: QualificationStatus;
  qualification_score: number;
  approved: boolean;
  created_at: string;
}

/** The health payload shape is not part of the contract, so it stays opaque. */
export type HealthResponse = Record<string, unknown>;
