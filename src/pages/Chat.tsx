import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AvatarHash } from "@/components/ui/avatar-hash";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, Send, MessageSquare, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CommentBody } from "@/components/tickets/CommentBody";
import { cn } from "@/lib/utils";

type Thread = { id: string; kind: string; title: string | null; last_message_at: string; created_by: string };
type Message = { id: string; thread_id: string; user_id: string; content: string; created_at: string };
type ProfileLite = { user_id: string; full_name: string | null };

export default function Chat() {
  const { threadId } = useParams<{ threadId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newOpen, setNewOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Threads
  const { data: threads = [] } = useQuery<Thread[]>({
    queryKey: ["chat-threads", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("chat_threads")
        .select("*")
        .order("last_message_at", { ascending: false });
      return (data ?? []) as Thread[];
    },
  });

  // Auto-select first thread if none in URL
  useEffect(() => {
    if (!threadId && threads.length > 0) navigate(`/chat/${threads[0].id}`, { replace: true });
  }, [threadId, threads, navigate]);

  // Participants of current thread (for names)
  const { data: participants = [] } = useQuery<ProfileLite[]>({
    queryKey: ["chat-thread-participants", threadId],
    enabled: !!threadId,
    queryFn: async () => {
      const { data: parts } = await supabase
        .from("chat_thread_participants").select("user_id").eq("thread_id", threadId!);
      const ids = (parts ?? []).map((p: any) => p.user_id);
      if (!ids.length) return [];
      const { data: profs } = await supabase
        .from("profiles").select("user_id, full_name").in("user_id", ids);
      return (profs ?? []) as ProfileLite[];
    },
  });
  const nameOf = (uid: string) => participants.find((p) => p.user_id === uid)?.full_name ?? "Пользователь";

  // Messages
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["chat-messages", threadId],
    enabled: !!threadId,
    queryFn: async () => {
      const { data } = await supabase
        .from("chat_messages").select("*").eq("thread_id", threadId!).order("created_at", { ascending: true });
      return (data ?? []) as Message[];
    },
  });

  // Realtime for messages of current thread + threads list
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`chat-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages" }, () => {
        qc.invalidateQueries({ queryKey: ["chat-messages", threadId] });
        qc.invalidateQueries({ queryKey: ["chat-threads", user.id] });
        qc.invalidateQueries({ queryKey: ["sidebar-unread-chat", user.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_threads" }, () => {
        qc.invalidateQueries({ queryKey: ["chat-threads", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, threadId, qc]);

  // Mark thread as read & scroll
  useEffect(() => {
    if (!threadId || !user) return;
    supabase.from("chat_thread_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("thread_id", threadId).eq("user_id", user.id)
      .then(() => qc.invalidateQueries({ queryKey: ["sidebar-unread-chat", user.id] }));
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [threadId, messages.length, user, qc]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !threadId || !user) return;
    setDraft("");
    const { error } = await supabase.from("chat_messages").insert({
      thread_id: threadId, user_id: user.id, content: text,
    } as any);
    if (error) toast({ title: "Не удалось отправить", description: error.message, variant: "destructive" });
  };

  return (
    <div className="flex gap-3 h-[calc(100vh-8rem)]">
      {/* Thread list */}
      <Card className="w-72 flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <h2 className="font-heading font-semibold text-sm">Диалоги</h2>
          <Button size="sm" variant="outline" onClick={() => setNewOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />Новый
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <EmptyState icon={MessageSquare} title="Диалогов нет" description="Создайте первый чат." className="py-6" />
          ) : threads.map((t) => (
            <button
              key={t.id}
              onClick={() => navigate(`/chat/${t.id}`)}
              className={cn(
                "w-full text-left px-3 py-2 border-b hover:bg-muted/40 transition-colors",
                threadId === t.id && "bg-primary/10",
              )}
            >
              <p className="text-sm font-medium truncate">{t.title || "Без названия"}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(t.last_message_at), "dd.MM HH:mm", { locale: ru })}
              </p>
            </button>
          ))}
        </div>
      </Card>

      {/* Conversation */}
      <Card className="flex-1 flex flex-col">
        {!threadId ? (
          <EmptyState icon={MessageSquare} title="Выберите диалог" description="…или создайте новый." className="flex-1 flex items-center justify-center" />
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => {
                const mine = m.user_id === user?.id;
                return (
                  <div key={m.id} className={cn("flex gap-2", mine && "flex-row-reverse")}>
                    <AvatarHash name={nameOf(m.user_id)} size="sm" />
                    <div className={cn(
                      "rounded-lg px-3 py-2 max-w-[70%]",
                      mine ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}>
                      <div className="text-[10px] opacity-70 mb-0.5">
                        {nameOf(m.user_id)} · {format(new Date(m.created_at), "HH:mm", { locale: ru })}
                      </div>
                      <CommentBody text={m.content} />
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">Сообщений пока нет — напишите первое.</p>
              )}
            </div>
            <div className="border-t p-3 flex gap-2 items-end">
              <Textarea
                value={draft} onChange={(e) => setDraft(e.target.value)}
                placeholder="Сообщение… Markdown, Ctrl+Enter — отправить"
                rows={2}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); } }}
              />
              <Button onClick={send} disabled={!draft.trim()}><Send className="h-4 w-4" /></Button>
            </div>
          </>
        )}
      </Card>

      <NewThreadDialog open={newOpen} onOpenChange={setNewOpen} onCreated={(id) => navigate(`/chat/${id}`)} />
    </div>
  );
}

function NewThreadDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: (id: string) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const { data: users = [] } = useQuery<ProfileLite[]>({
    queryKey: ["chat-pickable-users"],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name").eq("is_active", true).order("full_name");
      return (data ?? []).filter((p: any) => p.user_id !== user?.id) as ProfileLite[];
    },
  });

  const create = async () => {
    if (!user || selected.size === 0) return;
    setBusy(true);
    try {
      const { data: t, error } = await supabase.from("chat_threads").insert({
        kind: selected.size > 1 ? "group" : "direct",
        title: title.trim() || null,
        created_by: user.id,
      } as any).select("id").single();
      if (error) throw error;
      const ids = [user.id, ...Array.from(selected)];
      const { error: partErr } = await supabase.from("chat_thread_participants").insert(
        ids.map((uid) => ({ thread_id: t!.id, user_id: uid })) as any,
      );
      if (partErr) throw partErr;
      onCreated(t!.id);
      onOpenChange(false);
      setTitle(""); setSelected(new Set());
    } catch (e: any) {
      toast({ title: "Не удалось создать", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Новый диалог</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Название (необязательно)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="max-h-72 overflow-y-auto border rounded-md">
            {users.map((u) => (
              <label key={u.user_id} className="flex items-center gap-2 px-3 py-2 border-b last:border-0 cursor-pointer hover:bg-muted/40">
                <input type="checkbox" checked={selected.has(u.user_id)} onChange={(e) => {
                  setSelected((prev) => { const n = new Set(prev); if (e.target.checked) n.add(u.user_id); else n.delete(u.user_id); return n; });
                }} />
                <span className="text-sm">{u.full_name || u.user_id.slice(0, 8)}</span>
              </label>
            ))}
            {users.length === 0 && <p className="text-sm text-muted-foreground p-3">Нет других пользователей.</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={create} disabled={busy || selected.size === 0}>
            {busy && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}