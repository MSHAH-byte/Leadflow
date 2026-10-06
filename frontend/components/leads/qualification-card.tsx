import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import type { QualificationStatus } from "@/lib/types";

interface QualificationCardProps {
  score: number;
  status: QualificationStatus;
}

/** Clamp defensively; the contract says 0-100 but the UI should never overflow its bar. */
function clampScore(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function QualificationCard({ score, status }: QualificationCardProps) {
  const value = clampScore(score);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <CardTitle>Qualification Score</CardTitle>
        <LeadStatusBadge status={status} />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-semibold tracking-tight tabular-nums">{value}</span>
          <span className="text-sm text-muted-foreground">/ 100</span>
        </div>
        <div
          role="meter"
          aria-label="Qualification score"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          A qualification heuristic, not a conversion probability.
        </p>
      </CardContent>
    </Card>
  );
}
