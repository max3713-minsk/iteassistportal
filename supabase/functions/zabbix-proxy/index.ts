import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ZABBIX_TIMEOUT = 10000; // 10 seconds

async function fetchWithTimeout(url: string, options: RequestInit, timeout = ZABBIX_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function jsonRpc(method: string, params: unknown, auth?: string, id = 1) {
  const body: Record<string, unknown> = { jsonrpc: "2.0", method, params, id };
  if (auth) body.auth = auth;
  return JSON.stringify(body);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const ok = (data: unknown) =>
    new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  const fail = (error: string, status = 500) =>
    new Response(JSON.stringify({ error }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  // Verify auth
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return fail('Unauthorized', 401);

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !user) return fail('Unauthorized', 401);

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: settings, error: settingsError } = await supabaseAdmin
    .from('zabbix_settings')
    .select('*')
    .limit(1)
    .single();

  if (settingsError || !settings) {
    return fail('Настройки Zabbix не сконфигурированы. Перейдите в Мониторинг → Настройка.');
  }

  if (!settings.is_active) {
    return fail('Подключение к Zabbix отключено в настройках.');
  }

  const ZABBIX_URL = settings.zabbix_url;
  const ZABBIX_USER = settings.zabbix_user;
  const ZABBIX_PASSWORD = settings.zabbix_password;

  if (!ZABBIX_URL || !ZABBIX_USER || !ZABBIX_PASSWORD) {
    return fail('Заполните все поля подключения к Zabbix в настройках.');
  }

  const apiUrl = `${ZABBIX_URL}/api_jsonrpc.php`;
  const headers = { 'Content-Type': 'application/json' };

  try {
    const body = await req.json();
    const { action } = body;

    // --- Test Connection (special handling with structured response) ---
    if (action === 'testConnection') {
      try {
        // Step 1: apiinfo.version (no auth needed)
        let versionRes: Response;
        try {
          versionRes = await fetchWithTimeout(apiUrl, {
            method: 'POST',
            headers,
            body: jsonRpc('apiinfo.version', {}),
          });
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg.includes('abort') || msg.includes('Abort')) {
            return ok({ ok: false, error: 'timeout', message: 'Таймаут соединения (10 сек). Сервер недоступен.' });
          }
          return ok({ ok: false, error: 'network_error', message: `Сервер не отвечает. Проверьте, запущен ли VPN-туннель (BelVPN) и доступен ли адрес. (${msg})` });
        }

        const versionText = await versionRes.text();
        let versionData: { result?: string; error?: { message?: string } };
        try {
          versionData = JSON.parse(versionText);
        } catch {
          return ok({ ok: false, error: 'invalid_url', message: 'Ответ сервера не соответствует API Zabbix. Проверьте URL. Убедитесь, что путь содержит /zabbix.' });
        }

        if (!versionData.result) {
          return ok({ ok: false, error: 'invalid_url', message: 'Не удалось получить версию Zabbix API. Проверьте URL.' });
        }

        const zabbixVersion = versionData.result;

        // Step 2: user.login
        let loginRes: Response;
        try {
          loginRes = await fetchWithTimeout(apiUrl, {
            method: 'POST',
            headers,
            body: jsonRpc('user.login', { username: ZABBIX_USER, password: ZABBIX_PASSWORD }),
          });
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          return ok({ ok: false, error: 'network_error', message: `Ошибка сети при аутентификации: ${msg}` });
        }

        const loginData = await loginRes.json();

        if (loginData.error) {
          return ok({ ok: false, error: 'auth_failed', message: `Неверное имя пользователя или пароль. (${loginData.error.data || loginData.error.message})` });
        }

        if (!loginData.result) {
          return ok({ ok: false, error: 'auth_failed', message: 'Не удалось получить токен авторизации Zabbix.' });
        }

        // Step 3: logout
        try {
          const logoutRes = await fetchWithTimeout(apiUrl, {
            method: 'POST',
            headers,
            body: jsonRpc('user.logout', [], loginData.result),
          }, 5000);
          await logoutRes.text();
        } catch { /* ignore logout errors */ }

        return ok({ ok: true, data: { version: zabbixVersion }, rawLogin: loginData });

      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return ok({ ok: false, error: 'unknown', message: `Непредвиденная ошибка: ${msg}` });
      }
    }

    // --- Regular actions ---
    // Authenticate with Zabbix
    let authResponse: Response;
    try {
      authResponse = await fetchWithTimeout(apiUrl, {
        method: 'POST',
        headers,
        body: jsonRpc('user.login', { username: ZABBIX_USER, password: ZABBIX_PASSWORD }),
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return fail(`Не удалось подключиться к Zabbix: ${msg}`);
    }

    const authData = await authResponse.json();
    const authToken = authData.result;

    if (!authToken) {
      return fail(`Ошибка авторизации Zabbix. Проверьте логин/пароль в настройках.`);
    }

    let zabbixMethod: string;
    let zabbixParams: Record<string, unknown>;

    switch (action) {
      case 'getHosts':
        zabbixMethod = 'host.get';
        zabbixParams = {
          output: ['hostid', 'host', 'name', 'status', 'available', 'snmp_available'],
          selectInterfaces: ['ip', 'dns', 'port', 'type'],
          selectGroups: ['groupid', 'name'],
          sortfield: 'name',
        };
        break;
      case 'getProblems':
        zabbixMethod = 'problem.get';
        zabbixParams = {
          output: 'extend',
          selectAcknowledges: 'extend',
          selectTags: 'extend',
          recent: true,
          sortfield: ['eventid'],
          sortorder: 'DESC',
          limit: 50,
        };
        break;
      case 'getAlerts':
        zabbixMethod = 'trigger.get';
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
        };
        break;
      case 'getHostAvailability':
        zabbixMethod = 'host.get';
        zabbixParams = {
          output: ['hostid', 'host', 'name', 'available'],
          selectInterfaces: ['ip'],
        };
        break;
      default:
        await fetchWithTimeout(apiUrl, {
          method: 'POST',
          headers,
          body: jsonRpc('user.logout', [], authToken, 99),
        }, 5000).then(r => r.text()).catch(() => {});
        return fail('Unknown action', 400);
    }

    const dataResponse = await fetchWithTimeout(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: zabbixMethod,
        params: { ...zabbixParams, ...(body.params || {}) },
        auth: authToken,
        id: 2,
      }),
    });
    const data = await dataResponse.json();

    // Logout
    await fetchWithTimeout(apiUrl, {
      method: 'POST',
      headers,
      body: jsonRpc('user.logout', [], authToken, 99),
    }, 5000).then(r => r.text()).catch(() => {});

    return ok({ result: data.result });
  } catch (err) {
    console.error('Zabbix proxy error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return fail(msg);
  }
});
