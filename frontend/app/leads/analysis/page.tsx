import type { Metadata } from "next";
import { AnalysisReview } from "@/components/leads/analysis-review";

export const metadata: Metadata = { title: "Review analysis" };

export default function AnalysisPage() {
  return <AnalysisReview />;
}
