import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { LeadForm } from "@/components/leads/lead-form";

export const metadata: Metadata = { title: "New Lead" };

export default function NewLeadPage() {
  return (
    <>
      <PageHeader
        title="New Lead"
        description="Paste a customer inquiry. LeadFlow extracts the details, scores the lead and drafts a reply for you to review."
      />
      <LeadForm />
    </>
  );
}
