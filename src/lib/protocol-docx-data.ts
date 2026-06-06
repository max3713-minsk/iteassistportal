import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { getProblemHint, SEVERITY_RU } from "@/lib/problem-recommendations";
import { invokeZabbix } from "@/lib/zabbix-invoke";

export interface SignatureInfo {
  name: string;          // ФИО
  position?: string | null; // должность (если указана в профиле)
  pngBase64?: string;    // факсимиле
  signedAt?: string | null;
}

export interface TicketSummary {
  number: string;
  title: string;
  status: string;
  priority: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface EquipmentUnit {
  name: string;
  model: string | null;
  serial: string | null;
  siteName: string | null;
  items: {
    taskTitle: string;
    status: string;
    notes: string | null;
    completedAt: string | null;
  }[];
}

export interface EquipmentGroup {
  categoryName: string;
  units: EquipmentUnit[];
}

export interface ActiveProblem {
  severity: string;        // human label
  severityCode: string;    // raw 0..5
  host: string;
  name: string;
  since: string | null;    // ISO
  description: string;     // brief
  recommendation: string;  // hint
}

export interface ProtocolDocxData {
  header: {
    title: string;          // "Протокол выполнения регламентных работ"
    customerName: string;   // Заказчик (юр. имя)
    executorName: string;   // Исполнитель
    objectName: string;     // ЦОД (sites.name)
    frequencyLabel: string;
    periodStart: string;
    periodEnd: string;
    reportDate: string;     // dd.MM.yyyy
    contractNumber?: string | null;
    statusLabel?: string;   // Выполнено / В работе / ...
  };
  groups: EquipmentGroup[];
  tickets: TicketSummary[];
  ticketsMonthLabel: string;
  activeProblems: ActiveProblem[];
  signatures: {
    executor: SignatureInfo;
    responsible: SignatureInfo;
  };
  exportMeta: {
    exportedAt: string;     // ISO
    exportedByName: string;
    exportedByLogin: string;
  };
  graphs?: { name: string; pngBase64: string; widthPx: number; heightPx: number }[];
  notes?: string | null;
}

async function signatureToBase64(path: string | null | undefined): Promise<string | undefined> {
  if (!path) return undefined;
  try {
    const { data, error } = await supabase.storage.from("signatures").createSignedUrl(path, 120);
    if (error || !data?.signedUrl) return undefined;
    const res = await fetch(data.signedUrl);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

const frequencyRu: Record<string, string> = {
  daily: "Ежедневные работы",
  weekly: "Еженедельные работы",
  monthly: "Ежемесячные работы",
  quarterly: "Квартальные работы",
  semi_annual: "Полугодовые работы",
  annual: "Годовые работы",
  on_request: "Работы по заявке",
};

export async function fetchProtocolDocxData(protocolId: string): Promise<ProtocolDocxData> {
  const { data: protocol, error: pErr } = await supabase
    .from("maintenance_protocols")
    .select(`*, sites(name, organization)`)
    .eq("id", protocolId)
    .single();
  if (pErr || !protocol) throw new Error(pErr?.message || "Протокол не найден");

  // Customer org: by customer_org_id (preferred) or by sites.organization (text name)
  let customerOrg: any = null;
  const customerOrgId = (protocol as any).customer_org_id;
  if (customerOrgId) {
    const { data } = await supabase
      .from("organizations")
      .select("id, name, legal_full_name, executor_default")
      .eq("id", customerOrgId).maybeSingle();
    customerOrg = data;
  } else if ((protocol as any).sites?.organization) {
    const { data } = await supabase
      .from("organizations")
      .select("id, name, legal_full_name, executor_default")
      .eq("name", (protocol as any).sites.organization).maybeSingle();
    customerOrg = data;
  }

  let executorOrg: any = null;
  if ((protocol as any).executor_org_id) {
    const { data } = await supabase
      .from("organizations")
      .select("name, legal_full_name, executor_default")
      .eq("id", (protocol as any).executor_org_id).maybeSingle();
    executorOrg = data;
  }

  let contract: any = null;
  if ((protocol as any).contract_id) {
    const { data } = await supabase
      .from("contracts")
      .select("contract_number, executor_org_name")
      .eq("id", (protocol as any).contract_id).maybeSingle();
    contract = data;
  }

  const { data: itemsRaw } = await supabase
    .from("protocol_items")
    .select(
      `*, equipment(name, model, serial_number, category_id, sites(name), equipment_categories(name)), 
       maintenance_tasks(title)`
    )
    .eq("protocol_id", protocolId);

  const items = itemsRaw ?? [];

  // Group by category → equipment unit
  const catMap = new Map<string, Map<string, EquipmentUnit>>();
  for (const it of items as any[]) {
    const snap = it.equipment_snapshot || {};
    const eq = it.equipment || {};
    const catName = eq.equipment_categories?.name || snap.category || "Прочее";
    const eqKey = it.equipment_id || `${eq.name}-${eq.serial_number}`;
    const eqUnit: EquipmentUnit = {
      name: eq.name || snap.name || "—",
      model: eq.model || snap.model || null,
      serial: eq.serial_number || snap.serial || null,
      siteName: eq.sites?.name || (protocol as any).sites?.name || null,
      items: [],
    };
    if (!catMap.has(catName)) catMap.set(catName, new Map());
    const unitMap = catMap.get(catName)!;
    if (!unitMap.has(eqKey)) unitMap.set(eqKey, eqUnit);
    unitMap.get(eqKey)!.items.push({
      taskTitle: it.maintenance_tasks?.title ?? "Задача",
      status: it.status ?? "pending",
      notes: it.notes,
      completedAt: it.completed_at,
    });
  }
  const groups: EquipmentGroup[] = Array.from(catMap.entries())
    .map(([categoryName, unitMap]) => ({
      categoryName,
      units: Array.from(unitMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName));

  // Tickets for the report month
  const reportDateStr = (protocol as any).report_date || (protocol as any).period_end || (protocol as any).period_start;
  const reportDate = reportDateStr ? new Date(reportDateStr) : new Date();
  const monthStart = startOfMonth(reportDate).toISOString();
  const monthEnd = endOfMonth(reportDate).toISOString();
  let tickets: TicketSummary[] = [];
  const orgIdForTickets = customerOrg?.id || (protocol as any).customer_org_id;
  if (orgIdForTickets) {
    const { data: trows } = await supabase
      .from("tickets")
      .select("id, title, status, priority, created_at, resolved_at")
      .eq("organization_id", orgIdForTickets)
      .gte("created_at", monthStart)
      .lte("created_at", monthEnd)
      .order("created_at", { ascending: true });
    tickets = (trows ?? []).map((t: any) => ({
      number: String(t.id).slice(0, 8),
      title: t.title,
      status: t.status,
      priority: t.priority,
      createdAt: t.created_at,
      resolvedAt: t.resolved_at,
    }));
  }

  // Signatures
  let execProfile: any = null;
  let respProfile: any = null;
  const execUserId = (protocol as any).executor_signature_user_id || (protocol as any).executor_user_id || (protocol as any).completed_by;
  const respUserId = (protocol as any).responsible_signature_user_id || (protocol as any).responsible_user_id;
  if (execUserId) {
    const { data } = await supabase.from("profiles").select("full_name, signature_path, position").eq("user_id", execUserId).maybeSingle();
    execProfile = data;
  }
  if (respUserId) {
    const { data } = await supabase.from("profiles").select("full_name, signature_path, position").eq("user_id", respUserId).maybeSingle();
    respProfile = data;
  }

  const [execSig, respSig] = await Promise.all([
    signatureToBase64(execProfile?.signature_path),
    signatureToBase64(respProfile?.signature_path),
  ]);

  // Current user (exporter)
  const { data: { user } } = await supabase.auth.getUser();
  const exporterEmail = user?.email ?? "—";
  let exporterName = exporterEmail;
  if (user) {
    const { data: me } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle();
    if (me?.full_name) exporterName = me.full_name;
  }

  const customerName =
    customerOrg?.legal_full_name || customerOrg?.name || (protocol as any).sites?.organization || "—";
  const executorName =
    executorOrg?.legal_full_name ||
    executorOrg?.name ||
    contract?.executor_org_name ||
    customerOrg?.executor_default ||
    "—";

  // Active monitoring problems for the site, excluding dismissed (user-level mute)
  const activeProblems: ActiveProblem[] = [];
  try {
    const siteId = (protocol as any).site_id;
    if (siteId) {
      const { data: hosts } = await supabase
        .from("monitored_hosts")
        .select("zabbix_host_id, visible_name, name")
        .eq("site_id", siteId)
        .not("zabbix_host_id", "is", null);
      const hostIds = (hosts ?? []).map((h: any) => h.zabbix_host_id).filter(Boolean);
      if (hostIds.length > 0) {
        const nameByHostId = new Map<string, string>(
          (hosts ?? []).map((h: any) => [h.zabbix_host_id, h.visible_name || h.name || h.zabbix_host_id]),
        );
        const { data: dismissed } = await supabase
          .from("dismissed_alerts").select("eventid").eq("user_id", user?.id ?? "");
        const dismissedSet = new Set((dismissed ?? []).map((d: any) => String(d.eventid)));
        const resp: any = await invokeZabbix({
          body: { action: "getProblems", params: { hostids: hostIds, recent: true } },
        });
        const list: any[] = resp?.data?.result ?? resp?.data ?? [];
        const arr = Array.isArray(list) ? list : [];
        for (const p of arr) {
          if (dismissedSet.has(String(p.eventid))) continue;
          const text = String(p.name || p.description || "");
          const hint = getProblemHint(text);
          const hostKey = (p.hosts?.[0]?.hostid) || (Array.isArray(p.hostids) ? p.hostids[0] : null);
          activeProblems.push({
            severityCode: String(p.severity ?? "0"),
            severity: SEVERITY_RU[String(p.severity ?? "0")] || "—",
            host: (hostKey && nameByHostId.get(String(hostKey))) || p.hosts?.[0]?.name || "—",
            name: text || "—",
            since: p.clock ? new Date(Number(p.clock) * 1000).toISOString() : null,
            description: hint.description,
            recommendation: hint.recommendation,
          });
        }
        activeProblems.sort((a, b) => Number(b.severityCode) - Number(a.severityCode));
      }
    }
  } catch (e) {
    console.warn("activeProblems fetch failed", e);
  }

  const statusLabelMap: Record<string, string> = {
    pending: "Ожидает",
    in_progress: "В работе",
    completed: "Выполнено",
    overdue: "Просрочен",
  };

  return {
    header: {
      title: "Протокол выполнения регламентных работ",
      customerName,
      executorName,
      objectName: (protocol as any).sites?.name ?? "—",
      frequencyLabel: frequencyRu[(protocol as any).frequency] || (protocol as any).frequency,
      periodStart: (protocol as any).period_start,
      periodEnd: (protocol as any).period_end,
      reportDate: format(reportDate, "dd.MM.yyyy"),
      contractNumber: contract?.contract_number ?? null,
      statusLabel: statusLabelMap[(protocol as any).status] || (protocol as any).status,
    },
    groups,
    tickets,
    ticketsMonthLabel: format(reportDate, "LL.yyyy"),
    activeProblems,
    signatures: {
      executor: {
        name: (protocol as any).executor_name || execProfile?.full_name || "—",
        position: execProfile?.position ?? null,
        pngBase64: execSig,
        signedAt: (protocol as any).signed_executor_at,
      },
      responsible: {
        name: (protocol as any).responsible_name || respProfile?.full_name || "—",
        position: respProfile?.position ?? null,
        pngBase64: respSig,
        signedAt: (protocol as any).signed_responsible_at,
      },
    },
    exportMeta: {
      exportedAt: new Date().toISOString(),
      exportedByName: exporterName,
      exportedByLogin: exporterEmail,
    },
    notes: (protocol as any).notes,
  };
}