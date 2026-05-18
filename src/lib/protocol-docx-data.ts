import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";

export interface SignatureInfo {
  name: string;          // ФИО
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
  };
  groups: EquipmentGroup[];
  tickets: TicketSummary[];
  ticketsMonthLabel: string;
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
    const { data } = await supabase.from("profiles").select("full_name, signature_path").eq("user_id", execUserId).maybeSingle();
    execProfile = data;
  }
  if (respUserId) {
    const { data } = await supabase.from("profiles").select("full_name, signature_path").eq("user_id", respUserId).maybeSingle();
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
    },
    groups,
    tickets,
    ticketsMonthLabel: format(reportDate, "LL.yyyy"),
    signatures: {
      executor: {
        name: (protocol as any).executor_name || execProfile?.full_name || "—",
        pngBase64: execSig,
        signedAt: (protocol as any).signed_executor_at,
      },
      responsible: {
        name: (protocol as any).responsible_name || respProfile?.full_name || "—",
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