import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Flag, MessageSquare, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export type FlagLevel = "important" | "attention" | "minor";

export const FLAG_META: Record<FlagLevel, { label: string; cls: string; dot: string }> = {
  important: { label: "Важно",           cls: "bg-red-500/15 text-red-600 border-red-500/40",       dot: "bg-red-500" },
  attention: { label: "Требует внимания", cls: "bg-yellow-500/15 text-yellow-700 border-yellow-500/40", dot: "bg-yellow-500" },
  minor:     { label: "Некритично",      cls: "bg-slate-500/15 text-slate-600 border-slate-500/40", dot: "bg-slate-400" },
};

interface Props {
  eventid?: string | null;
  triggerid?: string | null;
  host?: string | null;
  canEdit: boolean;
}

export function ProblemFlagBadge({ eventid, triggerid, host, canEdit }: Props) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [draftLevel, setDraftLevel] = useState<FlagLevel>("attention");
  const [draftComment, setDraftComment] = useState("");

  const key = ["problem-flag", eventid || "", triggerid || ""];
  const { data: flag } = useQuery({
    queryKey: key,
    enabled: !!(eventid || triggerid),
    queryFn: async () => {
      let q = supabase.from("problem_flags").select("*").limit(1);
      if (eventid) q = q.eq("eventid", eventid);
      else if (triggerid) q = q.eq("triggerid", triggerid).is("eventid", null);
      const { data } = await q.maybeSingle();
      return data as any;
    },
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Не авторизованы");
      const { data: prof } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle();
      const payload: any = {
        eventid: eventid ?? null,
        triggerid: triggerid ?? null,
        host: host ?? null,
        flag: draftLevel,
        comment: draftComment.trim() || null,
        created_by: user.id,
        created_by_name: prof?.full_name || user.email,
      };
      if (flag?.id) {
        const { error } = await supabase.from("problem_flags").update({
          flag: draftLevel,
          comment: draftComment.trim() || null,
        }).eq("id", flag.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("problem_flags").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Флаг сохранён" });
      qc.invalidateQueries({ queryKey: key });
      setOpen(false);
    },
    onError: (e: Error) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const removeMut = useMutation({
    mutationFn: async () => {
      if (!flag?.id) return;
      const { error } = await supabase.from("problem_flags").delete().eq("id", flag.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Флаг снят" });
      qc.invalidateQueries({ queryKey: key });
      setOpen(false);
    },
  });

  const handleOpen = (v: boolean) => {
    if (v) {
      setDraftLevel((flag?.flag as FlagLevel) || "attention");
      setDraftComment(flag?.comment || "");
    }
    setOpen(v);
  };

  const meta = flag ? FLAG_META[flag.flag as FlagLevel] : null;

  if (!canEdit && !flag) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        {flag ? (
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium transition hover:opacity-80",
              meta?.cls,
            )}
            title={flag.comment || meta?.label}
          >
            <span className={cn("h-2 w-2 rounded-full", meta?.dot)} />
            {meta?.label}
            {flag.comment && <MessageSquare className="h-3 w-3 opacity-70" />}
          </button>
        ) : (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground">
            <Flag className="h-3.5 w-3.5 mr-1" /> Флаг
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 z-[60]" align="start">
        <div className="space-y-3">
          <div className="text-sm font-medium">Метка проблемы</div>
          <div className="grid grid-cols-3 gap-1.5">
            {(Object.keys(FLAG_META) as FlagLevel[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => canEdit && setDraftLevel(k)}
                disabled={!canEdit}
                className={cn(
                  "rounded border px-2 py-1.5 text-xs transition",
                  draftLevel === k ? FLAG_META[k].cls : "border-border hover:bg-muted",
                )}
              >
                <span className={cn("inline-block h-2 w-2 rounded-full mr-1", FLAG_META[k].dot)} />
                {FLAG_META[k].label}
              </button>
            ))}
          </div>
          <Textarea
            value={draftComment}
            onChange={(e) => setDraftComment(e.target.value)}
            placeholder="Комментарий для коллег…"
            rows={3}
            disabled={!canEdit}
          />
          {flag && (
            <div className="text-[11px] text-muted-foreground">
              {flag.created_by_name || "—"} • {format(new Date(flag.updated_at || flag.created_at), "dd.MM.yyyy HH:mm")}
            </div>
          )}
          {canEdit && (
            <div className="flex justify-between gap-2">
              {flag ? (
                <Button variant="ghost" size="sm" onClick={() => removeMut.mutate()} disabled={removeMut.isPending}>
                  <X className="h-3.5 w-3.5 mr-1" /> Снять
                </Button>
              ) : <span />}
              <Button size="sm" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
                Сохранить
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}