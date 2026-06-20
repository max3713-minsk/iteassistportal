import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Webhook endpoint for Zabbix alerts.
 * Maps Zabbix severity → incident category (П1-П4).
 * Auto-fills product_code, request_type, incident_category.
 *
 * Expected JSON body:
 * {
 *   "host": "srv-dc1-01",
 *   "trigger": "High CPU usage on srv-dc1-01",
 *   "severity": "4",          // Zabbix severity: 0-5
 *   "status": "PROBLEM",      // PROBLEM or OK
 *   "eventid": "12345",
 *   "item_value": "95.2%",
 *   "host_group": "Linux servers"  // optional, for product mapping
 * }
 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const body = await req.json();
    const { host, trigger, severity, status, eventid, item_value, host_group } = body;

    if (!trigger || !severity) {
      return new Response(JSON.stringify({ error: 'Missing required fields: trigger, severity' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only create tickets for PROBLEM events
    if (status === 'OK') {
      return new Response(JSON.stringify({ message: 'Recovery event, no ticket created' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sev = parseInt(severity);
    // Only auto-create for severity >= 3 (Average and above)
    if (sev < 3) {
      return new Response(JSON.stringify({ message: 'Low severity, no ticket created' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Map Zabbix severity → incident category
    // Disaster(5) → P1, High(4) → P2, Average(3) → P3, Warning(2) → P4
    let incidentCategory: string;
    let ticketPriority: string;
    if (sev >= 5) {
      incidentCategory = 'P1';
      ticketPriority = 'P1';
    } else if (sev === 4) {
      incidentCategory = 'P2';
      ticketPriority = 'P2';
    } else if (sev === 3) {
      incidentCategory = 'P3';
      ticketPriority = 'P3';
    } else {
      incidentCategory = 'P4';
      ticketPriority = 'P4';
    }

    // Map host_group to product_code
    const groupLower = (host_group || '').toLowerCase();
    let productCode = 'HARD'; // default to hardware
    if (groupLower.includes('scada') || groupLower.includes('sk-11') || groupLower.includes('ск-11')) {
      productCode = 'SK11';
    } else if (groupLower.includes('rs-20') || groupLower.includes('рс-20') || groupLower.includes('integration')) {
      productCode = 'RS20';
    } else if (groupLower.includes('vmware') || groupLower.includes('kubernetes') || groupLower.includes('esxi')) {
      productCode = 'VIRT';
    } else if (groupLower.includes('network') || groupLower.includes('switch') || groupLower.includes('router') || groupLower.includes('firewall')) {
      productCode = 'HARD';
    }

    const SLA_MINUTES: Record<string, number> = { P1: 30, P2: 60, P3: 120, P4: 180 };
    const slaMinutes = SLA_MINUTES[ticketPriority] ?? 120;
    const slaDeadline = new Date(Date.now() + slaMinutes * 60 * 1000);

    // Find admin user to assign as creator
    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: 'No admin user found for ticket creation' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to match host to equipment/site
    let equipmentId = null;
    let siteId = null;
    if (host) {
      const { data: monitored } = await supabaseAdmin
        .from('monitored_hosts')
        .select('id, site_id')
        .eq('name', host)
        .limit(1)
        .single();

      if (monitored) siteId = monitored.site_id;

      const { data: eq } = await supabaseAdmin
        .from('equipment')
        .select('id')
        .ilike('name', `%${host}%`)
        .limit(1)
        .single();

      if (eq) equipmentId = eq.id;
    }

    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .insert({
        title: `[Zabbix] ${trigger}`,
        description: `Автоматически создана из алерта Zabbix.\n\nХост: ${host || '—'}\nТриггер: ${trigger}\nСерьёзность: ${severity} (${ticketPriority})\nЗначение: ${item_value || '—'}\nEvent ID: ${eventid || '—'}`,
        priority: ticketPriority,
        created_by: adminRole.user_id,
        status: 'open',
        equipment_id: equipmentId,
        site_id: siteId,
        sla_deadline: slaDeadline.toISOString(),
        product_code: productCode,
        request_type: 'incident',
        incident_category: incidentCategory,
      })
      .select('id')
      .single();

    if (ticketError) throw ticketError;

    // Log status history
    await supabaseAdmin.from('ticket_status_history').insert({
      ticket_id: ticket.id,
      old_status: null,
      new_status: 'open',
      changed_by: adminRole.user_id,
      changed_by_name: 'Zabbix Webhook',
      comment: `Автоматически из алерта: ${trigger}`,
    });

    // Log audit
    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminRole.user_id,
      user_name: 'Zabbix Webhook',
      action: 'Автоматическое создание заявки',
      module: 'monitoring',
      entity_id: ticket.id,
      details: `Хост: ${host}, Триггер: ${trigger}, Категория: ${incidentCategory}`,
    });

    return new Response(JSON.stringify({
      success: true,
      ticket_id: ticket.id,
      priority: ticketPriority,
      incident_category: incidentCategory,
      product_code: productCode,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Zabbix webhook error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
