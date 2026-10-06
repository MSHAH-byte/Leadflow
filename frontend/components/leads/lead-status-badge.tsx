import { CheckCircle2, CircleAlert, CircleX, type LucideIcon } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { QualificationStatus } from "@/lib/types";

interface StatusPresentation {
  label: string;
  tone: NonNullable<BadgeProps["tone"]>;
  Icon: LucideIcon;
}

/** Single source of truth for how each status looks, shared by every screen. */
export const STATUS_PRESENTATION: Record<QualificationStatus, StatusPresentation> = {
  qualified: { label: "Qualified", tone: "success", Icon: CheckCircle2 },
  needs_information: { label: "Needs Information", tone: "warning", Icon: CircleAlert },
  not_qualified: { label: "Not Qualified", tone: "danger", Icon: CircleX },
};

/** Status is always conveyed by label and icon, never by color alone. */
export function LeadStatusBadge({ status }: { status: QualificationStatus }) {
  const presentation = STATUS_PRESENTATION[status];
  // Guard against a value outside the contract rather than crashing the page.
  if (!presentation) return <Badge>{status}</Badge>;
  const { label, tone, Icon } = presentation;
  return (
    <Badge tone={tone}>
      <Icon aria-hidden="true" />
      {label}
    </Badge>
  );
}
