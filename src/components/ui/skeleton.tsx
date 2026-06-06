import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** "pulse" (default) or "shimmer" – traveling highlight band */
  variant?: "pulse" | "shimmer";
}

function Skeleton({ className, variant = "pulse", ...props }: SkeletonProps) {
  if (variant === "shimmer") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-md bg-muted/70 isolate",
          className,
        )}
        {...props}
      >
        <span
          aria-hidden
          className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
        />
      </div>
    );
  }
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

export { Skeleton };
