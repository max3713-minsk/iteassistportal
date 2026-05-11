import { cn } from "@/lib/utils";
import { hashGradient, getInitials } from "@/lib/hash-color";

interface AvatarHashProps {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<AvatarHashProps["size"]>, string> = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-20 w-20 text-xl",
};

/**
 * Avatar with deterministic gradient background derived from name (or email).
 * Falls back to initials when no `src` is provided.
 */
export function AvatarHash({ name, email, src, size = "md", className }: AvatarHashProps) {
  const seed = (name || email || "?").trim();
  const initials = getInitials(name || email);
  const bg = hashGradient(seed);

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0 select-none ring-1 ring-black/5 overflow-hidden",
        SIZE_CLASS[size],
        className,
      )}
      style={src ? undefined : { background: bg }}
      title={name || email || undefined}
    >
      {src ? (
        <img src={src} alt={seed} className="h-full w-full object-cover" />
      ) : (
        <span className="leading-none tracking-tight">{initials}</span>
      )}
    </div>
  );
}