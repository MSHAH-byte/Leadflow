import { PenLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";

interface ResponseDraftProps {
  value: string;
  /** When provided the draft is editable; otherwise it is shown read-only. */
  onChange?: (value: string) => void;
  disabled?: boolean;
}

/**
 * The most actionable output, so it gets the most visual weight. It is always
 * labelled a draft: LeadFlow never sends anything to the customer.
 */
export function ResponseDraft({ value, onChange, disabled }: ResponseDraftProps) {
  const editable = onChange !== undefined;

  return (
    <Card className="border-primary/25 ring-1 ring-primary/10">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">Response Draft</CardTitle>
          <CardDescription>
            {editable
              ? "Review and edit before saving. This is a draft and has not been sent."
              : "Saved draft. LeadFlow does not send messages."}
          </CardDescription>
        </div>
        <Badge tone="primary">
          <PenLine aria-hidden="true" />
          Draft
        </Badge>
      </CardHeader>
      <CardContent>
        {editable ? (
          <>
            <label htmlFor="response-draft" className="sr-only">
              Response draft
            </label>
            <Textarea
              id="response-draft"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              disabled={disabled}
              rows={10}
              className="min-h-52 resize-y text-[0.95rem] leading-7"
            />
          </>
        ) : (
          <p className="whitespace-pre-wrap rounded-md bg-surface-muted p-4 text-[0.95rem] leading-7">
            {value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
