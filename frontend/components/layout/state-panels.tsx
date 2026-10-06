import Link from "next/link";
import { CircleAlert, Inbox, type LucideIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PanelProps {
  title: string;
  description?: string;
  Icon: LucideIcon;
  iconClassName: string;
  children?: React.ReactNode;
}

function Panel({ title, description, Icon, iconClassName, children }: PanelProps) {
  return (
    <Card className="flex flex-col items-center px-6 py-12 text-center">
      <span className={`mb-4 flex size-11 items-center justify-center rounded-full ${iconClassName}`}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      )}
      {children && <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>}
    </Card>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}

/** Intentional empty state with an optional call to action. */
export function EmptyState({ title, description, actionHref, actionLabel }: EmptyStateProps) {
  return (
    <Panel
      title={title}
      description={description}
      Icon={Inbox}
      iconClassName="bg-primary-soft text-primary"
    >
      {actionHref && actionLabel && (
        <Link href={actionHref} className={buttonVariants()}>
          {actionLabel}
        </Link>
      )}
    </Panel>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  backHref?: string;
  backLabel?: string;
}

/** Shown for network, 4xx and 5xx failures. `message` must already be user-safe. */
export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  backHref,
  backLabel,
}: ErrorStateProps) {
  return (
    <div role="alert">
      <Panel
        title={title}
        description={message}
        Icon={CircleAlert}
        iconClassName="bg-danger-soft text-danger"
      >
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        )}
        {backHref && backLabel && (
          <Link href={backHref} className={buttonVariants({ variant: "ghost" })}>
            {backLabel}
          </Link>
        )}
      </Panel>
    </div>
  );
}
