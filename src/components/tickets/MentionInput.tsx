import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MentionUser {
  user_id: string;
  full_name: string | null;
}

interface Props {
  value: string;
  onChange: (val: string, mentions: string[]) => void;
  placeholder?: string;
  onEnter?: () => void;
  className?: string;
  rows?: number;
}

/**
 * Lightweight @mention picker for ticket comments.
 * Suggestions appear after typing "@" followed by 0+ chars (until space).
 * Returns the resolved mention user_ids alongside the text.
 */
export function MentionInput({ value, onChange, placeholder, onEnter, className, rows = 3 }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: users = [] } = useQuery<MentionUser[]>({
    queryKey: ["mention-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .eq("is_active", true)
        .order("full_name");
      return (data ?? []) as MentionUser[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const list = q
      ? users.filter((u) => (u.full_name ?? "").toLowerCase().includes(q))
      : users;
    return list.slice(0, 6);
  }, [users, query]);

  // Detect "@xxx" at end of value
  useEffect(() => {
    const m = value.match(/(^|\s)@([^\s@]*)$/);
    if (m) {
      setQuery(m[2]);
      setOpen(true);
      setActiveIdx(0);
    } else {
      setOpen(false);
    }
  }, [value]);

  function resolveMentions(text: string): string[] {
    const ids: string[] = [];
    const matches = text.match(/@([^\s@]+(?:\s[^\s@]+)?)/g) ?? [];
    for (const m of matches) {
      const name = m.slice(1).trim().toLowerCase();
      const u = users.find((x) => (x.full_name ?? "").toLowerCase() === name);
      if (u && !ids.includes(u.user_id)) ids.push(u.user_id);
    }
    return ids;
  }

  function pick(u: MentionUser) {
    const name = u.full_name?.split(/\s+/).slice(0, 2).join(" ") || "user";
    const replaced = value.replace(/(^|\s)@([^\s@]*)$/, `$1@${name} `);
    const ids = resolveMentions(replaced);
    onChange(replaced, ids);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div className="relative flex-1">
      <Textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value, resolveMentions(e.target.value))}
        placeholder={placeholder}
        className={className}
        rows={rows}
        onKeyDown={(e) => {
          if (open && filtered.length) {
            if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => (i + 1) % filtered.length); return; }
            if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => (i - 1 + filtered.length) % filtered.length); return; }
            if (e.key === "Enter" || e.key === "Tab") {
              e.preventDefault();
              pick(filtered[activeIdx]);
              return;
            }
            if (e.key === "Escape") { setOpen(false); return; }
          }
          // Submit on Ctrl/Cmd+Enter only; plain Enter inserts newline.
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !open) {
            e.preventDefault();
            onEnter?.();
          }
        }}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 bottom-full mb-1 left-0 w-72 rounded-md border bg-popover shadow-lg overflow-hidden">
          <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground border-b">
            Упомянуть
          </div>
          {filtered.map((u, i) => (
            <button
              key={u.user_id}
              onMouseDown={(e) => { e.preventDefault(); pick(u); }}
              className={cn(
                "w-full text-left px-2 py-1.5 text-sm hover:bg-muted",
                i === activeIdx && "bg-muted",
              )}
            >
              {u.full_name || u.user_id.slice(0, 8)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Render comment text with @mentions highlighted. */
export function MentionText({ text }: { text: string }) {
  const parts = text.split(/(@[^\s@]+(?:\s[^\s@]+)?)/g);
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((p, i) =>
        p.startsWith("@") ? (
          <span key={i} className="text-primary font-medium">{p}</span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  );
}