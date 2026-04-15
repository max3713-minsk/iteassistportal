import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.1/cors"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verify auth
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const ZABBIX_URL = Deno.env.get('ZABBIX_URL')
  const ZABBIX_USER = Deno.env.get('ZABBIX_USER')
  const ZABBIX_PASSWORD = Deno.env.get('ZABBIX_PASSWORD')

  if (!ZABBIX_URL || !ZABBIX_USER || !ZABBIX_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Zabbix credentials not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const apiUrl = `${ZABBIX_URL}/api_jsonrpc.php`

  try {
    const body = await req.json()
    const { action } = body

    // Authenticate with Zabbix
    const authResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'user.login',
        params: { username: ZABBIX_USER, password: ZABBIX_PASSWORD },
        id: 1,
      }),
    })
    const authData = await authResponse.json()
    const authToken = authData.result

    if (!authToken) {
      return new Response(JSON.stringify({ error: 'Zabbix auth failed', details: authData.error }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let zabbixMethod: string
    let zabbixParams: Record<string, unknown>

    switch (action) {
      case 'getHosts':
        zabbixMethod = 'host.get'
        zabbixParams = {
          output: ['hostid', 'host', 'name', 'status', 'available', 'snmp_available'],
          selectInterfaces: ['ip', 'dns', 'port', 'type'],
          selectGroups: ['groupid', 'name'],
          sortfield: 'name',
        }
        break
      case 'getProblems':
        zabbixMethod = 'problem.get'
        zabbixParams = {
          output: 'extend',
          selectAcknowledges: 'extend',
          selectTags: 'extend',
          recent: true,
          sortfield: ['eventid'],
          sortorder: 'DESC',
          limit: 50,
        }
        break
      case 'getAlerts':
        zabbixMethod = 'trigger.get'
        zabbixParams = {
          output: ['triggerid', 'description', 'priority', 'value', 'lastchange', 'status'],
          selectHosts: ['hostid', 'name'],
          filter: { value: 1 },
          sortfield: 'priority',
          sortorder: 'DESC',
          limit: 50,
          only_true: true,
          active: true,
          expandDescription: true,
        }
        break
      case 'getHostAvailability':
        zabbixMethod = 'host.get'
        zabbixParams = {
          output: ['hostid', 'host', 'name', 'available'],
          selectInterfaces: ['ip'],
        }
        break
      default:
        // Logout
        await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', method: 'user.logout', params: [], auth: authToken, id: 99 }),
        }).then(r => r.text())
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    const dataResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: zabbixMethod,
        params: { ...zabbixParams, ...(body.params || {}) },
        auth: authToken,
        id: 2,
      }),
    })
    const data = await dataResponse.json()

    // Logout
    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'user.logout', params: [], auth: authToken, id: 99 }),
    }).then(r => r.text())

    return new Response(JSON.stringify({ result: data.result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Zabbix proxy error:', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
