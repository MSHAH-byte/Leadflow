import Link from "next/link";
import { Plus } from "lucide-react";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="An overview of your saved, qualified leads."
        actions={
          <Link href="/leads/new" className={buttonVariants()}>
            <Plus aria-hidden="true" />
            New Lead
          </Link>
        }
      />
      <DashboardView />
    </>
  );
}
