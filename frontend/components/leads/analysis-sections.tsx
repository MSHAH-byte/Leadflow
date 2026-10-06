import { CheckCircle2, CircleHelp, MessageCircleQuestion } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Shared card frame so every list section has identical spacing and headings. */
function ListCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-6">
      {items.map((item, index) => (
        <li key={`${index}-${item}`} className="flex gap-2.5">
          <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary/60" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function NoneListed({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}

export function RequirementsList({ items }: { items: string[] }) {
  return (
    <ListCard title="Requirements" description="What the customer actually stated.">
      {items.length > 0 ? (
        <BulletList items={items} />
      ) : (
        <NoneListed text="No specific requirements were stated." />
      )}
    </ListCard>
  );
}

export function QualificationFactors({ items }: { items: string[] }) {
  return (
    <ListCard title="Qualification Factors" description="What shaped the score.">
      {items.length > 0 ? (
        <BulletList items={items} />
      ) : (
        <NoneListed text="No factors were returned." />
      )}
    </ListCard>
  );
}

export function MissingInformation({ items }: { items: string[] }) {
  return (
    <ListCard title="Missing Information" description="Still needed to scope this lead.">
      {items.length > 0 ? (
        <ul className="space-y-2 text-sm leading-6">
          {items.map((item, index) => (
            <li key={`${index}-${item}`} className="flex gap-2.5">
              <CircleHelp className="mt-1 size-4 shrink-0 text-warning" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        // A complete lead gets a positive state instead of a blank card.
        <p className="flex items-center gap-2 text-sm text-success">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          Nothing missing. This inquiry has the information needed to qualify it.
        </p>
      )}
    </ListCard>
  );
}

export function SuggestedQuestions({ items }: { items: string[] }) {
  return (
    <ListCard
      title="Suggested Questions"
      description="Ideas for qualifying this prospect. Nothing has been sent."
    >
      {items.length > 0 ? (
        <ul className="space-y-2 text-sm leading-6">
          {items.map((item, index) => (
            <li key={`${index}-${item}`} className="flex gap-2.5">
              <MessageCircleQuestion
                className="mt-1 size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <NoneListed text="No follow-up questions are needed." />
      )}
    </ListCard>
  );
}
