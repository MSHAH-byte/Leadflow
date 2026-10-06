import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LeadHistory } from "@/components/leads/lead-history";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Leads" };

export default function LeadHistoryPage() {
  return (
    <>
      <PageHeader
        title="Leads"
        description="Every lead you've reviewed and approved, newest first."
        actions={
          <Link href="/leads/new" className={buttonVariants()}>
            <Plus aria-hidden="true" />
            New Lead
          </Link>
        }
      />
      <LeadHistory />
    </>
  );
}
