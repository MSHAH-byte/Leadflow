import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  Icon: LucideIcon;
  /** Tailwind classes for the icon chip, e.g. "bg-success-soft text-success". */
  accentClassName: string;
}

export function StatCard({ label, value, Icon, accentClassName }: StatCardProps) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span
        className={cn("flex size-10 shrink-0 items-center justify-center rounded-md", accentClassName)}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      </div>
    </Card>
  );
}
