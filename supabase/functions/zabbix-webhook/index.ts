import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Webhook endpoint for Zabbix alerts.
 * Zabbix sends alerts here; if priority is P1/P2, a ticket is auto-created.
 * 
 * Expected JSON body from Zabbix Action:
 * {
 *   "host": "srv-dc1-01",
 *   "trigger": "High CPU usage on srv-dc1-01",
 *   "severity": "4",          // Zabbix severity: 0-5
 *   "status": "PROBLEM",      // PROBLEM or OK
 *   "eventid": "12345",
 *   "item_value": "95.2%"
 * }
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const body = await req.json()
    const { host, trigger, severity, status, eventid, item_value } = body

    if (!trigger || !severity) {
      return new Response(JSON.stringify({ error: 'Missing required fields: trigger, severity' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Only create tickets for PROBLEM events
    if (status === 'OK') {
      return new Response(JSON.stringify({ message: 'Recovery event, no ticket created' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const sev = parseInt(severity)
    // Only auto-create for П1 (sev >= 4) and П2 (sev === 3)
    if (sev < 3) {
      return new Response(JSON.stringify({ message: 'Low severity, no ticket created' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const ticketPriority = sev >= 4 ? 'P1' : 'P2'

    // Find admin user to assign as creator
    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (!adminRole) {
      return new Response(JSON.stringify({ error: 'No admin user found for ticket creation' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Try to match host to equipment
    let equipmentId = null
    let siteId = null
    if (host) {
      const { data: monitored } = await supabaseAdmin
        .from('monitored_hosts')
        .select('id, site_id')
        .eq('name', host)
        .limit(1)
        .single()
      
      if (monitored) {
        siteId = monitored.site_id
      }

      const { data: eq } = await supabaseAdmin
        .from('equipment')
        .select('id')
        .ilike('name', `%${host}%`)
        .limit(1)
        .single()
      
      if (eq) equipmentId = eq.id
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
      })
      .select('id')
      .single()

    if (ticketError) throw ticketError

    // Log audit
    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminRole.user_id,
      user_name: 'Zabbix Webhook',
      action: 'Автоматическое создание заявки',
      module: 'monitoring',
      entity_id: ticket.id,
      details: `Хост: ${host}, Триггер: ${trigger}, Приоритет: ${ticketPriority}`,
    })

    return new Response(JSON.stringify({ 
      success: true, 
      ticket_id: ticket.id,
      priority: ticketPriority,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Zabbix webhook error:', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
