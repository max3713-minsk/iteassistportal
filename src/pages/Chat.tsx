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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AvatarHash } from "@/components/ui/avatar-hash";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, Send, MessageSquare, Loader2, Paperclip, Smile, Reply, X, FileText, Image as ImageIcon, Pencil, Trash2, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CommentBody } from "@/components/tickets/CommentBody";
import { cn } from "@/lib/utils";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

type Thread = { id: string; kind: string; title: string | null; last_message_at: string; created_by: string };
type ChatAttachment = { url: string; path: string; name: string; type: string; size: number };
type Message = {
  id: string; thread_id: string; user_id: string; content: string; created_at: string;
  parent_id?: string | null; attachments?: ChatAttachment[] | null;
};
type ProfileLite = { user_id: string; full_name: string | null };
type ParticipantProfile = ProfileLite & { avatar_path?: string | null };

export default function Chat() {
  const { threadId } = useParams<{ threadId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newOpen, setNewOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [typingIds, setTypingIds] = useState<Set<string>>(new Set());
  const presenceRef = useRef<any>(null);
  const typingTimers = useRef<Map<string, number>>(new Map());
  const lastTypingSent = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});

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

  // Participants of current thread (for names + avatars)
  const { data: participants = [] } = useQuery<ParticipantProfile[]>({
    queryKey: ["chat-thread-participants", threadId],
    enabled: !!threadId,
    queryFn: async () => {
      const { data: parts } = await supabase
        .from("chat_thread_participants").select("user_id").eq("thread_id", threadId!);
      const ids = (parts ?? []).map((p: any) => p.user_id);
      if (!ids.length) return [];
      const { data: profs } = await supabase
        .from("profiles").select("user_id, full_name, avatar_path").in("user_id", ids);
      return (profs ?? []) as unknown as ParticipantProfile[];
    },
  });
  const nameOf = (uid: string) => participants.find((p) => p.user_id === uid)?.full_name ?? "Пользователь";

  // Resolve signed avatar URLs for participants
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries: Record<string, string> = {};
      for (const p of participants) {
        if (!p.avatar_path) continue;
        const { data } = await supabase.storage.from("avatars").createSignedUrl(p.avatar_path, 60 * 60);
        if (data?.signedUrl) entries[p.user_id] = data.signedUrl;
      }
      if (!cancelled) setAvatarUrls(entries);
    })();
    return () => { cancelled = true; };
  }, [participants]);

  const currentThread = threads.find((t) => t.id === threadId);
  const canManageThread = !!currentThread && currentThread.created_by === user?.id;

  // Messages
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["chat-messages", threadId],
    enabled: !!threadId,
    queryFn: async () => {
      const { data } = await supabase
        .from("chat_messages").select("*").eq("thread_id", threadId!).order("created_at", { ascending: true });
      return (data ?? []) as unknown as Message[];
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

  // Presence + typing channel per thread
  useEffect(() => {
    if (!threadId || !user) return;
    setOnlineIds(new Set()); setTypingIds(new Set());
    const ch = supabase.channel(`chat-presence-${threadId}`, { config: { presence: { key: user.id } } });
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState() as Record<string, any[]>;
      setOnlineIds(new Set(Object.keys(state)));
    });
    ch.on("broadcast", { event: "typing" }, (payload: any) => {
      const uid = payload?.payload?.user_id as string | undefined;
      if (!uid || uid === user.id) return;
      setTypingIds((prev) => { const n = new Set(prev); n.add(uid); return n; });
      const old = typingTimers.current.get(uid);
      if (old) window.clearTimeout(old);
      const t = window.setTimeout(() => {
        setTypingIds((prev) => { const n = new Set(prev); n.delete(uid); return n; });
        typingTimers.current.delete(uid);
      }, 3500);
      typingTimers.current.set(uid, t);
    });
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") ch.track({ online_at: new Date().toISOString() });
    });
    presenceRef.current = ch;
    return () => { supabase.removeChannel(ch); presenceRef.current = null; };
  }, [threadId, user]);

  const sendTyping = () => {
    const now = Date.now();
    if (now - lastTypingSent.current < 1500) return;
    lastTypingSent.current = now;
    presenceRef.current?.send({ type: "broadcast", event: "typing", payload: { user_id: user?.id } });
  };

  const uploadFiles = async (): Promise<ChatAttachment[]> => {
    if (!pendingFiles.length || !threadId) return [];
    setUploading(true);
    const result: ChatAttachment[] = [];
    try {
      for (const f of pendingFiles) {
        const safe = f.name.replace(/[^\w.\-]+/g, "_");
        const path = `${threadId}/${crypto.randomUUID()}_${safe}`;
        const { error } = await supabase.storage.from("chat-attachments").upload(path, f, { contentType: f.type || "application/octet-stream" });
        if (error) throw error;
        const { data: signed } = await supabase.storage.from("chat-attachments").createSignedUrl(path, 60 * 60 * 24 * 365);
        result.push({ url: signed?.signedUrl ?? "", path, name: f.name, type: f.type, size: f.size });
      }
    } finally { setUploading(false); }
    return result;
  };

  const send = async () => {
    const text = draft.trim();
    if ((!text && pendingFiles.length === 0) || !threadId || !user) return;
    const atts = await uploadFiles();
    setDraft("");
    setPendingFiles([]);
    const reply = replyTo;
    setReplyTo(null);
    const { error } = await supabase.from("chat_messages").insert({
      thread_id: threadId, user_id: user.id, content: text,
      parent_id: reply?.id ?? null,
      attachments: (atts as any) ?? [],
    } as any);
    if (error) toast({ title: "Не удалось отправить", description: error.message, variant: "destructive" });
    else {
      // Fire-and-forget: уведомления участникам треда (TG / push / e-mail — через подписки).
      try {
        const recipients = participants.map((p) => p.user_id).filter((id) => id !== user.id);
        if (recipients.length) {
          const senderName = nameOf(user.id);
          const threadTitle = threads.find((t) => t.id === threadId)?.title || "Чат";
          const preview = (text || (atts.length ? `📎 ${atts.length} вложен.` : "")).slice(0, 200);
          supabase.functions.invoke("notification-dispatch", {
            body: {
              event_type: "chat.message_new",
              title: `💬 ${senderName} — ${threadTitle}`,
              body: preview,
              priority: "P4",
              target_user_ids: recipients,
              payload: {
                thread_id: threadId, sender_id: user.id, sender_name: senderName,
                thread_title: threadTitle, message_preview: preview,
              },
            },
          }).catch((e) => console.warn("chat notify failed", e));
        }
      } catch (e) { console.warn("chat notify error", e); }
    }
  };

  const insertEmoji = (emoji: any) => setDraft((d) => d + (emoji?.native ?? ""));

  const openRename = () => {
    setRenameDraft(currentThread?.title ?? "");
    setRenameOpen(true);
  };
  const saveRename = async () => {
    if (!threadId) return;
    const { error } = await supabase.from("chat_threads")
      .update({ title: renameDraft.trim() || null } as any).eq("id", threadId);
    if (error) {
      toast({ title: "Не удалось переименовать", description: error.message, variant: "destructive" });
    } else {
      setRenameOpen(false);
      qc.invalidateQueries({ queryKey: ["chat-threads", user?.id] });
    }
  };
  const confirmDelete = async () => {
    if (!threadId) return;
    const { error } = await supabase.from("chat_threads").delete().eq("id", threadId);
    if (error) {
      toast({ title: "Не удалось удалить", description: error.message, variant: "destructive" });
    } else {
      setDeleteOpen(false);
      toast({ title: "Диалог удалён" });
      qc.invalidateQueries({ queryKey: ["chat-threads", user?.id] });
      navigate("/chat", { replace: true });
    }
  };
  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) setPendingFiles((p) => [...p, ...files]);
    e.target.value = "";
  };

  const msgById = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);
  const typingNames = Array.from(typingIds).map(nameOf).filter(Boolean);

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
            {/* Header with participants & online */}
            <div className="border-b px-4 py-2 flex items-center gap-3">
              <div className="flex -space-x-2">
                {participants.slice(0, 5).map((p) => (
                  <div key={p.user_id} className="relative">
                    <AvatarHash name={p.full_name ?? "?"} src={avatarUrls[p.user_id]} size="sm" />
                    {onlineIds.has(p.user_id) && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-background" />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{currentThread?.title || "Без названия"}</p>
                <p className="text-[11px] text-muted-foreground">
                  {participants.length} участник(ов) · онлайн: {participants.filter((p) => onlineIds.has(p.user_id)).length}
                </p>
              </div>
              {canManageThread && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" title="Действия"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={openRename}><Pencil className="h-3.5 w-3.5 mr-2" />Переименовать</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onSelect={() => setDeleteOpen(true)}>
                      <Trash2 className="h-3.5 w-3.5 mr-2" />Удалить диалог
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => {
                const mine = m.user_id === user?.id;
                const parent = m.parent_id ? msgById.get(m.parent_id) : null;
                return (
                  <div key={m.id} className={cn("group flex gap-2", mine && "flex-row-reverse")}>
                    <AvatarHash name={nameOf(m.user_id)} src={avatarUrls[m.user_id]} size="sm" />
                    <div className={cn(
                      "rounded-lg px-3 py-2 max-w-[70%]",
                      mine ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}>
                      <div className="text-[10px] opacity-70 mb-0.5">
                        {nameOf(m.user_id)} · {format(new Date(m.created_at), "HH:mm", { locale: ru })}
                      </div>
                      {parent && (
                        <div className={cn(
                          "mb-1.5 text-[11px] rounded border-l-2 pl-2 py-0.5 opacity-80",
                          mine ? "border-primary-foreground/60 bg-primary-foreground/10" : "border-primary/60 bg-background/40",
                        )}>
                          <p className="font-semibold truncate">{nameOf(parent.user_id)}</p>
                          <p className="truncate">{(parent.content || "[вложение]").slice(0, 80)}</p>
                        </div>
                      )}
                      <CommentBody text={m.content} />
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="mt-1.5 space-y-1">
                          {m.attachments.map((a) => {
                            const isImg = (a.type || "").startsWith("image/");
                            return isImg ? (
                              <a key={a.path} href={a.url} target="_blank" rel="noreferrer" className="block">
                                <img src={a.url} alt={a.name} className="max-h-48 rounded border" />
                              </a>
                            ) : (
                              <a key={a.path} href={a.url} target="_blank" rel="noreferrer"
                                 className="flex items-center gap-2 text-xs underline">
                                <FileText className="h-3.5 w-3.5" />{a.name}
                                <span className="opacity-60">({(a.size / 1024).toFixed(1)} КБ)</span>
                              </a>
                            );
                          })}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setReplyTo(m)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 text-[10px] inline-flex items-center gap-0.5 hover:underline"
                      >
                        <Reply className="h-3 w-3" /> Ответить
                      </button>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">Сообщений пока нет — напишите первое.</p>
              )}
            </div>
            {typingNames.length > 0 && (
              <div className="px-4 py-1 text-[11px] text-muted-foreground italic">
                {typingNames.join(", ")} печатает…
              </div>
            )}
            <div className="border-t p-3 space-y-2">
              {replyTo && (
                <div className="flex items-start justify-between gap-2 text-xs bg-muted/60 border-l-2 border-primary px-2 py-1 rounded">
                  <div className="min-w-0">
                    <p className="font-semibold">Ответ на: {nameOf(replyTo.user_id)}</p>
                    <p className="truncate text-muted-foreground">{(replyTo.content || "[вложение]").slice(0, 120)}</p>
                  </div>
                  <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                </div>
              )}
              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {pendingFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs">
                      {f.type.startsWith("image/") ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                      <span className="max-w-[140px] truncate">{f.name}</span>
                      <button onClick={() => setPendingFiles((p) => p.filter((_, j) => j !== i))}>
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 items-end">
                <div className="flex gap-1">
                  <input ref={fileInputRef} type="file" multiple hidden onChange={onPickFiles} />
                  <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()} title="Прикрепить файл">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" type="button" title="Эмодзи"><Smile className="h-4 w-4" /></Button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start" className="p-0 border-0 w-auto">
                      <Picker data={data} onEmojiSelect={insertEmoji} locale="ru" theme="auto" previewPosition="none" />
                    </PopoverContent>
                  </Popover>
                </div>
                <Textarea
                  value={draft}
                  onChange={(e) => { setDraft(e.target.value); sendTyping(); }}
                  placeholder="Сообщение… Markdown, Ctrl+Enter — отправить"
                  rows={2}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); } }}
                />
                <Button onClick={send} disabled={(!draft.trim() && pendingFiles.length === 0) || uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <NewThreadDialog open={newOpen} onOpenChange={setNewOpen} onCreated={(id) => navigate(`/chat/${id}`)} />

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Переименовать диалог</DialogTitle></DialogHeader>
          <Input value={renameDraft} onChange={(e) => setRenameDraft(e.target.value)} placeholder="Название" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Отмена</Button>
            <Button onClick={saveRename}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить диалог?</AlertDialogTitle>
            <AlertDialogDescription>
              Будут удалены все сообщения и вложения. Действие необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
      const selectedUsers = users.filter((u) => selected.has(u.user_id));
      const defaultTitle = selectedUsers
        .map((u) => u.full_name || "Пользователь")
        .join(", ")
        .slice(0, 120);
      const finalTitle = title.trim() || defaultTitle || null;
      const { data: t, error } = await supabase.from("chat_threads").insert({
        kind: selected.size > 1 ? "group" : "direct",
        title: finalTitle,
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