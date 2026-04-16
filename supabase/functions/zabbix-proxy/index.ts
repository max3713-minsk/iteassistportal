import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

  // Read Zabbix settings from DB (using service role to bypass RLS for reading credentials)
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: settings, error: settingsError } = await supabaseAdmin
    .from('zabbix_settings')
    .select('*')
    .limit(1)
    .single()

  if (settingsError || !settings) {
    return new Response(JSON.stringify({ error: 'Настройки Zabbix не сконфигурированы. Перейдите в Мониторинг → Настройка.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  if (!settings.is_active) {
    return new Response(JSON.stringify({ error: 'Подключение к Zabbix отключено в настройках.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const ZABBIX_URL = settings.zabbix_url
  const ZABBIX_USER = settings.zabbix_user
  const ZABBIX_PASSWORD = settings.zabbix_password

  if (!ZABBIX_URL || !ZABBIX_USER || !ZABBIX_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Заполните все поля подключения к Zabbix в настройках.' }), {
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
      return new Response(JSON.stringify({ error: 'Ошибка авторизации Zabbix. Проверьте логин/пароль в настройках.', details: authData.error }), {
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
      case 'testConnection':
        // Just return Zabbix API version to verify connectivity
        zabbixMethod = 'apiinfo.version'
        zabbixParams = {}
        // apiinfo.version doesn't need auth, but we already have it
        const versionRes = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', method: 'apiinfo.version', params: {}, id: 3 }),
        })
        const versionData = await versionRes.json()
        // Logout
        await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', method: 'user.logout', params: [], auth: authToken, id: 99 }),
        }).then(r => r.text())
        return new Response(JSON.stringify({ result: { version: versionData.result, authenticated: true } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      default:
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
