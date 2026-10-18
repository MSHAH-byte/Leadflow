import type {
  AnalyzeLeadRequest,
  AnalyzeLeadResponse,
  CreateLeadRequest,
  HealthResponse,
  LeadListItem,
  LeadResponse,
} from "@/lib/types";

/** Error carrying an HTTP status (0 = network failure) and a message safe to show users. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

const NETWORK_MESSAGE =
  "Unable to connect to the LeadFlow API. Please make sure the backend is running.";
const SERVER_MESSAGE = "The LeadFlow API ran into a problem. Please try again.";
const UNEXPECTED_MESSAGE = "The LeadFlow API returned an unexpected response.";

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new ApiError(
      0,
      "NEXT_PUBLIC_API_URL is not set. Copy .env.example to .env.local and restart the dev server.",
    );
  }
  return url.replace(/\/+$/, "");
}

/** Pull a short, human-readable message out of a FastAPI error body when it is a plain string. */
async function readDetail(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json();
    if (typeof body === "object" && body !== null && "detail" in body) {
      const { detail } = body as { detail: unknown };
      if (typeof detail === "string") return detail;
    }
  } catch {
    // Non-JSON error body: fall through to the generic message.
  }
  return null;
}

/**
 * Single choke point for HTTP. `clientErrorMessage` is shown for 4xx responses
 * that carry no usable detail; 5xx responses always get a generic message so
 * backend internals never reach the UI.
 */
async function request<T>(
  path: string,
  options: { method?: "GET" | "POST"; body?: unknown; clientErrorMessage: string },
): Promise<T> {
  const { method = "GET", body, clientErrorMessage } = options;

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, NETWORK_MESSAGE);
  }

  if (!response.ok) {
    if (response.status === 404) throw new ApiError(404, "Lead not found.");
    if (response.status >= 500) throw new ApiError(response.status, SERVER_MESSAGE);
    const detail = await readDetail(response);
    throw new ApiError(response.status, detail ?? clientErrorMessage);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(response.status, UNEXPECTED_MESSAGE);
  }
}

export function healthCheck(): Promise<HealthResponse> {
  return request<HealthResponse>("/health", {
    clientErrorMessage: "Health check failed.",
  });
}

/** Runs the AI workflow. Does NOT persist anything. */
export async function analyzeLead(
  payload: AnalyzeLeadRequest,
): Promise<AnalyzeLeadResponse> {
  const result = await request<AnalyzeLeadResponse>("/leads/analyze", {
    method: "POST",
    body: payload,
    clientErrorMessage: "Lead analysis failed. Please review the inquiry and try again.",
  });
  if (!result?.analysis) throw new ApiError(200, UNEXPECTED_MESSAGE);
  return result;
}

export function getLeads(): Promise<LeadListItem[]> {
  return request<LeadListItem[]>("/leads", {
    clientErrorMessage: "Unable to load leads.",
  });
}

export function getLead(id: number | string): Promise<LeadResponse> {
  return request<LeadResponse>(`/leads/${encodeURIComponent(String(id))}`, {
    clientErrorMessage: "Unable to load this lead.",
  });
}

/** Persists a reviewed lead. Never triggers the AI workflow. */
export async function createLead(payload: CreateLeadRequest): Promise<LeadResponse> {
  const saved = await request<LeadResponse>("/leads", {
    method: "POST",
    body: payload,
    clientErrorMessage: "Unable to save the lead. Please try again.",
  });
  if (typeof saved?.id !== "number") throw new ApiError(201, UNEXPECTED_MESSAGE);
  return saved;
}
