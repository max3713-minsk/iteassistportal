import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_COLORS,
  REQUEST_TYPE_LABELS,
  getAvailableTransitions,
  type AppRole,
} from "@/lib/ticket-categories";
import { PRODUCTS } from "@/lib/ticket-categories";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Clock, MessageSquare, History, AlertTriangle, GitBranch, FolderArchive, ExternalLink, Loader2, Lock, Sparkles, RefreshCw, CheckSquare, Square, Inbox } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { SLATimer } from "@/components/tickets/SLATimer";
import { cn } from "@/lib/utils";
import { EquipmentSummary } from "@/components/tickets/EquipmentSummary";
import { AIAnalysisTab } from "@/components/tickets/AIAnalysisTab";
import { TicketLinks } from "@/components/tickets/TicketLinks";
import { MentionInput, MentionText } from "@/components/tickets/MentionInput";
import { CommentReactions } from "@/components/tickets/CommentReactions";
import { EmptyState } from "@/components/ui/empty-state";

interface Props {
  ticket: any;
  onClose: () => void;
}

export function TicketDetailDialog({ ticket, onClose }: Props) {
  const { user, roles, isStaff, hasRole } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [comment, setComment] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const [isInternal, setIsInternal] = useState(false);
  const [transitionComment, setTransitionComment] = useState("");
  const [pendingTransition, setPendingTransition] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [gitlabBusy, setGitlabBusy] = useState(false);
  const [seafileBusy, setSeafileBusy] = useState(false);

  const isOwner = ticket.created_by === user?.id;
  const userRoles = roles as AppRole[];

  const transitions = getAvailableTransitions(ticket.status, userRoles, isOwner);

  // Comments
  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ["ticket-comments", ticket.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("ticket_comments")
        .select("*, profiles:user_id(full_name)")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  // Status history
  const { data: statusHistory = [] } = useQuery({
    queryKey: ["ticket-status-history", ticket.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("ticket_status_history")
        .select("*")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as any[];
    },
  });

  // GitLab link for this ticket
  const { data: gitlabLink, refetch: refetchGitlab } = useQuery({
    queryKey: ["gitlab-link", ticket.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("gitlab_ticket_links")
        .select("*")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const handleCreateGitlabIssue = async () => {
    setGitlabBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("gitlab-create-issue", {
        body: {
          ticket_id: ticket.id,
          title: ticket.title,
          description: ticket.description || "",
          priority: ticket.priority,
          request_type: ticket.request_type,
          subcategory: ticket.subcategory,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Issue создан", description: `GitLab issue #${data.issue_iid}` });
      refetchGitlab();
    } catch (e: any) {
      toast({ title: "Ошибка GitLab", description: e.message, variant: "destructive" });
    } finally { setGitlabBusy(false); }
  };

  const handleSeafileUpload = async (file: File) => {
    setSeafileBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("subdir", `/tickets/${ticket.id}`);
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seafile-upload`;
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: fd,
      });
      const result = await r.json();
      if (!r.ok || result.error) throw new Error(result.error || `HTTP ${r.status}`);
      toast({ title: "Файл загружен в Seafile", description: file.name });
    } catch (e: any) {
      toast({ title: "Ошибка Seafile", description: e.message, variant: "destructive" });
    } finally { setSeafileBusy(false); }
  };

  // Engineers for assignment — only admin & engineer roles
  const { data: profiles = [] } = useQuery({
    queryKey: ["engineer-profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, user_roles!inner(role)")
        .in("user_roles.role", ["admin", "engineer"]);
      return data ?? [];
    },
    enabled: hasRole("admin"),
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      if (!comment.trim()) return;
      const internal = isStaff ? isInternal : false;
      const { error } = await supabase.from("ticket_comments").insert({
        ticket_id: ticket.id,
        user_id: user!.id,
        content: comment.trim(),
        is_internal: internal,
        mentions,
      });
      if (error) throw error;
      await logAudit({ action: "Добавление комментария", module: "tickets", entityId: ticket.id });

      const { data: authorProfile } = await supabase
        .from("profiles").select("full_name").eq("user_id", user!.id).single();
      const productName = PRODUCTS.find((p) => p.code === ticket.product_code)?.name ?? ticket.product_code;
      const url = `${window.location.origin}/tickets?id=${ticket.id}`;
      notify({
        event_type: internal ? "ticket.comment_internal" : "ticket.comment_added",
        priority: ticket.priority,
        title: ticket.title,
        body: comment.trim().slice(0, 600),
        payload: {
          ticket_id: ticket.id,
          created_by: ticket.created_by,
          assigned_to: ticket.assigned_to,
          priority: ticket.priority,
          request_type: ticket.request_type,
          request_type_label: REQUEST_TYPE_LABELS[ticket.request_type] || ticket.request_type,
          product_code: ticket.product_code,
          product_name: productName,
          subcategory: ticket.subcategory,
          site_id: ticket.site_id,
          site_name: ticket.sites?.name,
          equipment_name: ticket.equipment?.name,
          status: ticket.status,
          status_label: STATUS_LABELS[ticket.status] || ticket.status,
          is_internal: internal,
          author_id: user!.id,
          author_name: authorProfile?.full_name || user!.email,
          comment_text: comment.trim(),
          url,
        },
      });

      // Notify mentioned users
      if (mentions.length) {
        notify({
          event_type: "ticket.mention",
          priority: ticket.priority,
          title: `Вас упомянули: ${ticket.title}`,
          body: comment.trim().slice(0, 400),
          payload: {
            ticket_id: ticket.id,
            author_id: user!.id,
            author_name: authorProfile?.full_name || user!.email,
            url,
          },
          target_user_ids: mentions,
        });
      }
    },
    onSuccess: () => {
      setComment("");
      setMentions([]);
      setIsInternal(false);
      refetchComments();
      toast({ title: "Комментарий добавлен" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ newStatus, assignedTo }: { newStatus: string; assignedTo?: string }) => {
      const payload: any = { status: newStatus };
      if (newStatus === "resolved" || newStatus === "closed") payload.resolved_at = new Date().toISOString();
      if (assignedTo) payload.assigned_to = assignedTo;

      const { error } = await supabase.from("tickets").update(payload).eq("id", ticket.id);
      if (error) throw error;

      // Close linked protocols
      if (newStatus === "closed" || newStatus === "resolved") {
        const { data: linked } = await supabase
          .from("maintenance_protocols")
          .select("id")
          .eq("ticket_id", ticket.id)
          .neq("status", "completed");
        if (linked?.length) {
          for (const p of linked) {
            await supabase.from("maintenance_protocols").update({
              status: "completed",
              completed_at: new Date().toISOString(),
              completed_by: user!.id,
            }).eq("id", p.id);
          }
        }
      }

      // Log status change
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user!.id)
        .single();

      await supabase.from("ticket_status_history").insert({
        ticket_id: ticket.id,
        old_status: ticket.status,
        new_status: newStatus,
        changed_by: user!.id,
        changed_by_name: profile?.full_name || user!.email,
        comment: transitionComment || null,
      } as any);

      await logAudit({
        action: `Смена статуса → ${STATUS_LABELS[newStatus]}`,
        module: "tickets",
        entityId: ticket.id,
        details: transitionComment || ticket.title,
      });

      // Notifications
      const productName = PRODUCTS.find((p) => p.code === ticket.product_code)?.name ?? ticket.product_code;
      const assignedId = assignedTo ?? ticket.assigned_to ?? null;
      let assignedName: string | null = null;
      if (assignedId) {
        const { data: ap } = await supabase.from("profiles").select("full_name").eq("user_id", assignedId).single();
        assignedName = ap?.full_name ?? null;
      }
      const { data: creatorProfile } = await supabase
        .from("profiles").select("full_name").eq("user_id", ticket.created_by).single();
      const url = `${window.location.origin}/tickets?id=${ticket.id}`;
      const basePayload = {
        ticket_id: ticket.id,
        created_by: ticket.created_by,
        created_by_name: creatorProfile?.full_name ?? null,
        assigned_to: assignedId,
        assigned_to_name: assignedName,
        priority: ticket.priority,
        request_type: ticket.request_type,
        request_type_label: REQUEST_TYPE_LABELS[ticket.request_type] || ticket.request_type,
        product_code: ticket.product_code,
        product_name: productName,
        subcategory: ticket.subcategory,
        site_id: ticket.site_id,
        site_name: ticket.sites?.name,
        equipment_name: ticket.equipment?.name,
        status: newStatus,
        status_label: STATUS_LABELS[newStatus] || newStatus,
        old_status: ticket.status,
        old_status_label: STATUS_LABELS[ticket.status] || ticket.status,
        changed_by_name: profile?.full_name || user!.email,
        transition_comment: transitionComment || null,
        url,
      };
      notify({
        event_type: "ticket.status_changed",
        priority: ticket.priority,
        title: ticket.title,
        body: transitionComment || undefined,
        payload: basePayload,
      });
      if (newStatus === "resolved") {
        notify({ event_type: "ticket.resolved", priority: ticket.priority, title: ticket.title, body: transitionComment || undefined, payload: basePayload });
      }
      if (newStatus === "closed") {
        notify({ event_type: "ticket.closed", priority: ticket.priority, title: ticket.title, body: transitionComment || undefined, payload: basePayload });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      qc.invalidateQueries({ queryKey: ["open-tickets-count"] });
      qc.invalidateQueries({ queryKey: ["protocols"] });
      qc.invalidateQueries({ queryKey: ["ticket-status-history", ticket.id] });
      setPendingTransition(null);
      setTransitionComment("");
      onClose();
      toast({ title: "Статус обновлён" });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (assignedTo: string) => {
      const { error } = await supabase
        .from("tickets")
        .update({ assigned_to: assignedTo, status: "assigned" } as any)
        .eq("id", ticket.id);
      if (error) throw error;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user!.id)
        .single();

      const { data: assignedProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", assignedTo)
        .single();

      await supabase.from("ticket_status_history").insert({
        ticket_id: ticket.id,
        old_status: ticket.status,
        new_status: "assigned",
        changed_by: user!.id,
        changed_by_name: profile?.full_name || user!.email,
        comment: `Назначен: ${assignedProfile?.full_name || assignedTo}`,
      } as any);

      await logAudit({
        action: "Назначение инженера",
        module: "tickets",
        entityId: ticket.id,
        details: `→ ${assignedProfile?.full_name}`,
      });

      // Notifications: assigned + status_changed
      const productName = PRODUCTS.find((p) => p.code === ticket.product_code)?.name ?? ticket.product_code;
      const { data: creatorProfile } = await supabase
        .from("profiles").select("full_name").eq("user_id", ticket.created_by).single();
      const url = `${window.location.origin}/tickets?id=${ticket.id}`;
      const payload = {
        ticket_id: ticket.id,
        created_by: ticket.created_by,
        created_by_name: creatorProfile?.full_name ?? null,
        assigned_to: assignedTo,
        assigned_to_name: assignedProfile?.full_name ?? null,
        priority: ticket.priority,
        request_type: ticket.request_type,
        request_type_label: REQUEST_TYPE_LABELS[ticket.request_type] || ticket.request_type,
        product_code: ticket.product_code,
        product_name: productName,
        subcategory: ticket.subcategory,
        site_id: ticket.site_id,
        site_name: ticket.sites?.name,
        equipment_name: ticket.equipment?.name,
        status: "assigned",
        status_label: "Назначена",
        old_status: ticket.status,
        old_status_label: STATUS_LABELS[ticket.status] || ticket.status,
        changed_by_name: profile?.full_name || user!.email,
        url,
      };
      notify({
        event_type: "ticket.assigned",
        priority: ticket.priority,
        title: ticket.title,
        body: `Вам назначена заявка. Исполнитель: ${assignedProfile?.full_name || ""}`.trim(),
        payload,
        target_user_ids: [assignedTo],
      });
      notify({
        event_type: "ticket.status_changed",
        priority: ticket.priority,
        title: ticket.title,
        payload,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      qc.invalidateQueries({ queryKey: ["ticket-status-history", ticket.id] });
      onClose();
      toast({ title: "Инженер назначен, статус → Назначена" });
    },
  });

  const product = PRODUCTS.find((p) => p.code === ticket.product_code);
  const slaExpired = ticket.sla_deadline && new Date(ticket.sla_deadline) < new Date() && !["closed", "cancelled", "resolved"].includes(ticket.status);

  const assignedProfile = profiles.find((p: any) => p.user_id === ticket.assigned_to);

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge className={PRIORITY_COLORS[ticket.priority]}>{ticket.priority}</Badge>
            <Badge className={STATUS_COLORS[ticket.status]}>{STATUS_LABELS[ticket.status]}</Badge>
            {ticket.request_type && (
              <Badge variant="outline">{REQUEST_TYPE_LABELS[ticket.request_type] || ticket.request_type}</Badge>
            )}
            {slaExpired && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> SLA просрочен
              </Badge>
            )}
          </div>
          <DialogTitle className="text-lg">{ticket.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap gap-2 text-xs">
            {product && <span>Продукт: {product.name}</span>}
            {ticket.subcategory && <span>• {ticket.subcategory}</span>}
            {ticket.sites?.name && <span>• ЦОД: {ticket.sites.name}</span>}
            {ticket.equipment?.name && <span>• {ticket.equipment.name}</span>}
            <span>• {format(new Date(ticket.created_at), "dd.MM.yyyy HH:mm")}</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-2">
          <TabsList className={cn("grid w-full", isStaff && ticket.request_type === "incident" ? "grid-cols-4" : "grid-cols-3")}>
            <TabsTrigger value="info">Информация</TabsTrigger>
            <TabsTrigger value="comments">
              Комментарии ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="history">История</TabsTrigger>
            {isStaff && ticket.request_type === "incident" && (
              <TabsTrigger value="ai" className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />ИИ-анализ
              </TabsTrigger>
            )}
          </TabsList>

          {/* Info tab */}
          <TabsContent value="info" className="space-y-4 mt-4">
            {ticket.description && (
              <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap">
                {ticket.description}
              </div>
            )}

            {ticket.equipment_id && <EquipmentSummary equipmentId={ticket.equipment_id} />}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Приоритет:</span>{" "}
                <Badge className={PRIORITY_COLORS[ticket.priority]}>{ticket.priority}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Статус:</span>{" "}
                <Badge className={STATUS_COLORS[ticket.status]}>{STATUS_LABELS[ticket.status]}</Badge>
              </div>
              {ticket.sla_deadline && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">SLA:</span>{" "}
                  <span className={slaExpired ? "text-destructive font-medium" : ""}>
                    {format(new Date(ticket.sla_deadline), "dd.MM.yyyy HH:mm")}
                  </span>
                  <SLATimer deadline={ticket.sla_deadline} status={ticket.status} />
                </div>
              )}
              {assignedProfile && (
                <div>
                  <span className="text-muted-foreground">Исполнитель:</span>{" "}
                  {assignedProfile.full_name}
                </div>
              )}
              {ticket.incident_category && (
                <div>
                  <span className="text-muted-foreground">Категория:</span>{" "}
                  {ticket.incident_category}
                </div>
              )}
              {ticket.resolved_at && (
                <div>
                  <span className="text-muted-foreground">Решена:</span>{" "}
                  {format(new Date(ticket.resolved_at), "dd.MM.yyyy HH:mm")}
                </div>
              )}
            </div>

            {/* Assignment (admin only, when status is open) */}
            {hasRole("admin") && (ticket.status === "open" || ticket.status === "overdue") && (
              <div className="border rounded-lg p-3 space-y-2">
                <Label className="text-sm font-medium">Назначить инженера</Label>
                <div className="flex gap-2">
                  <Select onValueChange={(v) => assignMutation.mutate(v)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Выберите инженера" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((p: any) => (
                        <SelectItem key={p.user_id} value={p.user_id}>
                          {p.full_name ?? p.user_id.slice(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Status transitions */}
            {transitions.length > 0 && (
              <div className="border rounded-lg p-3 space-y-2">
                <Label className="text-sm font-medium">Действия</Label>
                {pendingTransition ? (
                  <div className="space-y-2">
                    <Textarea
                      value={transitionComment}
                      onChange={(e) => setTransitionComment(e.target.value)}
                      placeholder="Комментарий к переходу..."
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          statusMutation.mutate({ newStatus: pendingTransition })
                        }
                        disabled={statusMutation.isPending}
                      >
                        Подтвердить
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPendingTransition(null);
                          setTransitionComment("");
                        }}
                      >
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {transitions
                      .filter((t) => t.to !== "assigned") // assigned handled via dropdown above
                      .map((t) => (
                        <Button
                          key={t.to}
                          size="sm"
                          variant={t.to === "cancelled" ? "destructive" : "outline"}
                          onClick={() => {
                            if (t.to === "cancelled") {
                              setConfirmCancel(true);
                            } else if (t.requireComment) {
                              setPendingTransition(t.to);
                            } else {
                              statusMutation.mutate({ newStatus: t.to });
                            }
                          }}
                          disabled={statusMutation.isPending}
                        >
                          {t.label}
                        </Button>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* External integrations (staff only) */}
            {isStaff && (
              <div className="border rounded-lg p-3 space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <GitBranch className="h-4 w-4" /> Внешние интеграции
                </Label>

                {/* GitLab */}
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm">
                    <p className="font-medium flex items-center gap-1.5">
                      <GitBranch className="h-3.5 w-3.5" /> GitLab Issue
                    </p>
                    {gitlabLink ? (
                      <a href={gitlabLink.issue_url} target="_blank" rel="noreferrer"
                         className="text-xs text-primary hover:underline flex items-center gap-1">
                        #{gitlabLink.issue_iid} ({gitlabLink.issue_state}) <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <p className="text-xs text-muted-foreground">Не создан</p>
                    )}
                  </div>
                  {!gitlabLink && (
                    <Button size="sm" variant="outline" onClick={handleCreateGitlabIssue} disabled={gitlabBusy}>
                      {gitlabBusy ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <GitBranch className="h-3.5 w-3.5 mr-1" />}
                      Создать issue
                    </Button>
                  )}
                </div>

                {/* Seafile */}
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm">
                    <p className="font-medium flex items-center gap-1.5">
                      <FolderArchive className="h-3.5 w-3.5" /> Seafile вложение
                    </p>
                    <p className="text-xs text-muted-foreground">Загружается в /tickets/{ticket.id.slice(0, 8)}</p>
                  </div>
                  <label>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleSeafileUpload(f);
                        e.target.value = "";
                      }}
                    />
                    <Button size="sm" variant="outline" disabled={seafileBusy} asChild>
                      <span>
                        {seafileBusy ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <FolderArchive className="h-3.5 w-3.5 mr-1" />}
                        Загрузить файл
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Comments tab */}
          <TabsContent value="comments" className="space-y-3 mt-4">
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {comments
                .filter((c: any) => isStaff || !c.is_internal)
                .map((c: any) => (
                  <div
                    key={c.id}
                    className={cn(
                      "rounded-lg p-3 text-sm",
                      c.is_internal ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-muted/30",
                    )}
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-medium flex items-center gap-1.5">
                        {c.is_internal && <Lock className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />}
                        {c.profiles?.full_name ?? "Пользователь"}
                        {c.is_internal && (
                          <span className="text-[10px] uppercase tracking-wider text-yellow-700 dark:text-yellow-400 ml-1">
                            внутренняя
                          </span>
                        )}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {format(new Date(c.created_at), "dd.MM HH:mm", { locale: ru })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{c.content}</p>
                  </div>
                ))}
              {comments.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">Комментариев пока нет</p>
              )}
            </div>
            {!["closed", "cancelled"].includes(ticket.status) && (
              <div className="space-y-2">
                {isStaff && (
                  <div className="flex items-center gap-2 px-1">
                    <Switch id="ticket-internal-toggle" checked={isInternal} onCheckedChange={setIsInternal} />
                    <label htmlFor="ticket-internal-toggle" className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer">
                      <Lock className="h-3 w-3" /> Внутренняя заметка (только для сотрудников)
                    </label>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={isInternal ? "Внутренняя заметка..." : "Напишите комментарий..."}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && commentMutation.mutate()}
                  />
                  <Button
                    size="sm"
                    onClick={() => commentMutation.mutate()}
                    disabled={!comment.trim() || commentMutation.isPending}
                  >
                    Отправить
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* History tab */}
          <TabsContent value="history" className="mt-4">
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {statusHistory.map((h: any) => (
                <div key={h.id} className="flex items-start gap-3 text-sm border-l-2 border-muted pl-3 py-1">
                  <History className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      {h.old_status && (
                        <>
                          <Badge variant="outline" className="text-xs">
                            {STATUS_LABELS[h.old_status] || h.old_status}
                          </Badge>
                          <span className="text-muted-foreground">→</span>
                        </>
                      )}
                      <Badge className={`text-xs ${STATUS_COLORS[h.new_status] || ""}`}>
                        {STATUS_LABELS[h.new_status] || h.new_status}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground text-xs mt-0.5">
                      {h.changed_by_name} •{" "}
                      {format(new Date(h.created_at), "dd.MM.yyyy HH:mm", { locale: ru })}
                    </div>
                    {h.comment && <p className="text-xs mt-1">{h.comment}</p>}
                  </div>
                </div>
              ))}
              {statusHistory.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">Нет записей</p>
              )}
            </div>
          </TabsContent>

          {isStaff && ticket.request_type === "incident" && (
            <TabsContent value="ai" className="mt-0">
              <AIAnalysisTab ticketId={ticket.id} />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отменить заявку?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите отменить заявку «{ticket.title}»? Это действие зафиксируется в истории.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Нет</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmCancel(false);
                statusMutation.mutate({ newStatus: "cancelled" });
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Да, отменить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
