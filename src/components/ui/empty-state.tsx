import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: {
    label: string;
    onClick?: () => void;
    icon?: LucideIcon;
  };
  secondary?: React.ReactNode;
  className?: string;
  /** Optional decorative SVG illustration above the icon. */
  illustration?: React.ReactNode;
}

/**
 * Friendly empty state with optional illustration, gradient halo and CTA.
 * Use everywhere instead of "Нет данных".
 */
export function EmptyState({
  icon: Icon, title, description, action, secondary, illustration, className,
}: EmptyStateProps) {
  const ActionIcon = action?.icon;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-dashed bg-card",
        "flex flex-col items-center justify-center text-center p-10 md:p-14 gap-4",
        className,
      )}
    >
      <div className="absolute inset-x-0 -top-24 h-48 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        {illustration ?? (
          Icon && (
            <div className="rounded-full bg-primary/10 ring-8 ring-primary/5 p-4">
              <Icon className="h-8 w-8 text-primary" strokeWidth={1.5} />
            </div>
          )
        )}
        <div className="space-y-1.5 max-w-md">
          <h3 className="font-heading text-lg font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && (
          <div className="flex items-center gap-2 mt-2">
            <Button onClick={action.onClick} className="gap-2">
              {ActionIcon && <ActionIcon className="h-4 w-4" />}
              {action.label}
            </Button>
            {secondary}
          </div>
        )}
      </div>
    </div>
  );
}