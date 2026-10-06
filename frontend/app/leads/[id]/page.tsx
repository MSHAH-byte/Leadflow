import { LeadDetail } from "@/components/leads/lead-detail";

export default async function LeadDetailPage({ params }: PageProps<"/leads/[id]">) {
  // `params` is a Promise in this Next.js version.
  const { id } = await params;
  return <LeadDetail id={id} />;
}
