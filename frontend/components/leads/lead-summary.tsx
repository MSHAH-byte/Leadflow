import { Mail, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface LeadSummaryProps {
  customerName: string;
  contact: string | null;
  projectType: string;
  inquiry: string;
}

/** Lead identity + project classification + the original inquiry. */
export function LeadSummary({ customerName, contact, projectType, inquiry }: LeadSummaryProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Lead
            </p>
            <h2 className="mt-1 truncate text-xl font-semibold tracking-tight">{customerName}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{contact || "No contact provided"}</span>
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Project type
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium sm:justify-end">
              <Tag className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
              {projectType}
            </p>
          </div>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Original inquiry
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{inquiry}</p>
        </div>
      </CardContent>
    </Card>
  );
}
