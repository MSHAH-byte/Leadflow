import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { formatDate } from "@/lib/utils";
import type { LeadListItem } from "@/lib/types";

function ApprovalBadge({ approved }: { approved: boolean }) {
  return approved ? (
    <Badge tone="success">
      <CheckCircle2 aria-hidden="true" />
      Approved
    </Badge>
  ) : (
    <Badge>
      <Clock aria-hidden="true" />
      Not approved
    </Badge>
  );
}

/**
 * Desktop: a real table. Mobile: stacked cards, because a 7-column table is
 * unusable at phone width and horizontal scrolling hides the status.
 */
export function LeadTable({ leads }: { leads: LeadListItem[] }) {
  return (
    <>
      <Card className="hidden overflow-hidden md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Saved leads, newest first</caption>
          <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Customer</th>
              <th scope="col" className="px-4 py-3 font-medium">Project</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Score</th>
              <th scope="col" className="px-4 py-3 font-medium">Approved</th>
              <th scope="col" className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.map((lead) => (
              <tr key={lead.id} className="transition-colors hover:bg-surface-muted/60">
                <td className="max-w-56 px-4 py-3">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="block truncate font-medium text-foreground hover:text-primary"
                  >
                    {lead.customer_name}
                  </Link>
                  <span className="block truncate text-xs text-muted-foreground">
                    {lead.contact || "No contact"}
                  </span>
                </td>
                <td className="max-w-48 truncate px-4 py-3">{lead.project_type}</td>
                <td className="px-4 py-3">
                  <LeadStatusBadge status={lead.qualification_status} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{lead.qualification_score}</td>
                <td className="px-4 py-3">
                  <ApprovalBadge approved={lead.approved} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {formatDate(lead.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <ul className="space-y-3 md:hidden">
        {leads.map((lead) => (
          <li key={lead.id}>
            <Link
              href={`/leads/${lead.id}`}
              className="block rounded-lg border border-border bg-surface p-4 shadow-card transition-colors hover:bg-surface-muted/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{lead.customer_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {lead.contact || "No contact"}
                  </p>
                </div>
                <span className="text-lg font-semibold tabular-nums">
                  {lead.qualification_score}
                </span>
              </div>
              <p className="mt-2 truncate text-sm">{lead.project_type}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <LeadStatusBadge status={lead.qualification_status} />
                <ApprovalBadge approved={lead.approved} />
                <span className="text-xs text-muted-foreground">
                  {formatDate(lead.created_at)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
