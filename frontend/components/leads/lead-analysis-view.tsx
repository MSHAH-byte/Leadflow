import {
  MissingInformation,
  QualificationFactors,
  RequirementsList,
  SuggestedQuestions,
} from "@/components/leads/analysis-sections";
import { LeadSummary } from "@/components/leads/lead-summary";
import { QualificationCard } from "@/components/leads/qualification-card";
import type { LeadAnalysis } from "@/lib/types";

interface LeadAnalysisViewProps {
  customerName: string;
  contact: string | null;
  inquiry: string;
  analysis: LeadAnalysis;
  /** Rendered last: the editable draft on review, the read-only draft on detail. */
  children: React.ReactNode;
}

/**
 * The analysis layout shared by the unsaved review page and the saved detail
 * page, so both read in the same order: identity, qualification, gaps, draft.
 */
export function LeadAnalysisView({
  customerName,
  contact,
  inquiry,
  analysis,
  children,
}: LeadAnalysisViewProps) {
  return (
    <div className="space-y-5">
      <LeadSummary
        customerName={customerName}
        contact={contact}
        projectType={analysis.project_type}
        inquiry={inquiry}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <QualificationCard
          score={analysis.qualification_score}
          status={analysis.qualification_status}
        />
        <RequirementsList items={analysis.requirements} />
        <QualificationFactors items={analysis.qualification_factors} />
        <MissingInformation items={analysis.missing_information} />
      </div>

      <SuggestedQuestions items={analysis.suggested_questions} />

      {children}
    </div>
  );
}
