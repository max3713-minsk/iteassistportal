import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK = ["👍", "🎉", "🚀", "🔥", "👀", "✅", "❌", "❓"];

interface Props {
  commentId: string;
}

export function CommentReactions({ commentId }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: rows = [] } = useQuery({
    queryKey: ["comment-reactions", commentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("ticket_comment_reactions")
        .select("emoji, user_id")
        .eq("comment_id", commentId);
      return data ?? [];
    },
  });

  const grouped = rows.reduce<Record<string, { count: number; mine: boolean; users: string[] }>>(
    (acc, r: any) => {
      const g = acc[r.emoji] ?? { count: 0, mine: false, users: [] };
      g.count++;
      if (r.user_id === user?.id) g.mine = true;
      g.users.push(r.user_id);
      acc[r.emoji] = g;
      return acc;
    },
    {},
  );

  async function toggle(emoji: string) {
    if (!user) return;
    const mine = grouped[emoji]?.mine;
    if (mine) {
      await supabase
        .from("ticket_comment_reactions")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id)
        .eq("emoji", emoji);
    } else {
      await supabase.from("ticket_comment_reactions").insert({
        comment_id: commentId,
        user_id: user.id,
        emoji,
      });
    }
    qc.invalidateQueries({ queryKey: ["comment-reactions", commentId] });
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap items-center gap-1 mt-2">
        {Object.entries(grouped).map(([emoji, g]) => (
          <Tooltip key={emoji}>
            <TooltipTrigger asChild>
              <button
                onClick={() => toggle(emoji)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
                  g.mine
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-muted/30 hover:bg-muted",
                )}
              >
                <span>{emoji}</span>
                <span className="tabular-nums">{g.count}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {g.mine ? "Убрать реакцию" : "Добавить реакцию"}
            </TooltipContent>
          </Tooltip>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <SmilePlus className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-8 gap-1">
              {QUICK.map((e) => (
                <button
                  key={e}
                  onClick={() => toggle(e)}
                  className="h-7 w-7 rounded hover:bg-muted text-base"
                >
                  {e}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </TooltipProvider>
  );
}