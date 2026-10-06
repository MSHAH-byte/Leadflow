"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { analyzeLead, ApiError } from "@/lib/api";
import { saveAnalysisDraft } from "@/lib/analysis-draft";
import type { AnalyzeLeadRequest } from "@/lib/types";

type FieldErrors = Partial<Record<"customerName" | "inquiry", string>>;

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-danger">
      {message}
    </p>
  );
}

export function LeadForm() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [contact, setContact] = useState("");
  const [inquiry, setInquiry] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // State updates are async, so a ref blocks a double-click from firing two AI calls.
  const inFlight = useRef(false);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!customerName.trim()) errors.customerName = "Enter the customer's name.";
    if (!inquiry.trim()) errors.inquiry = "Paste or type the customer's inquiry.";
    return errors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;

    const errors = validate();
    setFieldErrors(errors);
    setSubmitError(null);
    if (Object.keys(errors).length > 0) return;

    const input: AnalyzeLeadRequest = {
      customer_name: customerName.trim(),
      contact: contact.trim() || null,
      inquiry: inquiry.trim(),
    };

    inFlight.current = true;
    setSubmitting(true);
    try {
      const { analysis } = await analyzeLead(input);
      // Held in sessionStorage only. Nothing is persisted until the user approves.
      saveAnalysisDraft({ input, analysis });
      router.push("/leads/analysis");
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "Lead analysis failed. Please review the inquiry and try again.",
      );
      inFlight.current = false;
      setSubmitting(false);
    }
    // On success the page navigates away, so the form stays locked until then.
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="customer-name">
                Customer name <span className="text-danger">*</span>
              </Label>
              <Input
                id="customer-name"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                disabled={submitting}
                required
                autoComplete="off"
                placeholder="Ahmed"
                aria-invalid={fieldErrors.customerName ? true : undefined}
                aria-describedby={fieldErrors.customerName ? "customer-name-error" : undefined}
              />
              <FieldError id="customer-name-error" message={fieldErrors.customerName} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact">
                Contact <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="contact"
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                disabled={submitting}
                autoComplete="off"
                placeholder="Email or phone"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inquiry">
              Customer inquiry <span className="text-danger">*</span>
            </Label>
            <Textarea
              id="inquiry"
              value={inquiry}
              onChange={(event) => setInquiry(event.target.value)}
              disabled={submitting}
              required
              rows={10}
              className="min-h-56 resize-y text-[0.95rem] leading-7"
              placeholder="Paste the message exactly as the customer wrote it."
              aria-invalid={fieldErrors.inquiry ? true : undefined}
              aria-describedby={fieldErrors.inquiry ? "inquiry-error" : undefined}
            />
            <FieldError id="inquiry-error" message={fieldErrors.inquiry} />
          </div>

          {submitError && (
            <div
              role="alert"
              className="rounded-md border border-danger/25 bg-danger-soft px-3.5 py-3 text-sm text-danger"
            >
              {submitError}
            </div>
          )}

          <div className="flex flex-col-reverse items-stretch gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
              {submitting
                ? "Analyzing your lead... this can take a few seconds."
                : "Nothing is saved until you review and approve the analysis."}
            </p>
            <Button type="submit" size="lg" loading={submitting}>
              {!submitting && <Sparkles aria-hidden="true" />}
              {submitting ? "Analyzing..." : "Analyze Lead"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
