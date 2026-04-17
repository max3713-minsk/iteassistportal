import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ZABBIX_TIMEOUT = 15000;

/* ─── Simple in-memory cache ─── */
const cache = new Map<string, { data: unknown; ts: number }>();
function getCached(key: string, ttlMs: number): unknown | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < ttlMs) return entry.data;
  return null;
}
function setCache(key: string, data: unknown) {
  cache.set(key, { data, ts: Date.now() });
  // Evict old entries (max 100)
  if (cache.size > 100) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) cache.delete(oldest[0]);
  }
}

/* ─── Helpers ─── */
async function fetchWithTimeout(url: string, options: RequestInit, timeout = ZABBIX_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function jsonRpc(method: string, params: unknown, auth?: string, id = 1) {
  const body: Record<string, unknown> = { jsonrpc: "2.0", method, params, id };
  if (auth) body.auth = auth;
  return JSON.stringify(body);
}

const ok = (data: unknown) =>
  new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
const fail = (error: string, status = 500) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/* ─── Zabbix auth session (cached) ─── */
let authTokenCache: { token: string; ts: number } | null = null;
const AUTH_TTL = 5 * 60 * 1000; // 5 min

async function getAuthToken(apiUrl: string, user: string, password: string): Promise<string> {
  if (authTokenCache && Date.now() - authTokenCache.ts < AUTH_TTL) {
    return authTokenCache.token;
  }

  const res = await fetchWithTimeout(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: jsonRpc("user.login", { username: user, password }),
  });
  const data = await res.json();
  if (!data.result) throw new Error("Ошибка авторизации Zabbix");
  authTokenCache = { token: data.result, ts: Date.now() };
  return data.result;
}

/* ─── Action definitions with cache TTL ─── */
interface ActionDef {
  method: string;
  params: Record<string, unknown>;
  cacheTtl: number; // ms, 0 = no cache
}

function getActionDef(action: string, extraParams?: Record<string, unknown>): ActionDef | null {
  switch (action) {
    case "getHosts":
      return {
        method: "host.get",
        params: {
          output: ["hostid", "host", "name", "status", "available", "snmp_available"],
          selectInterfaces: ["ip", "dns", "port", "type"],
          selectGroups: ["groupid", "name"],
          sortfield: "name",
          ...extraParams,
        },
        cacheTtl: 60000,
      };
    case "getProblems":
      return {
        method: "problem.get",
        params: {
          output: "extend",
          selectAcknowledges: "extend",
          selectTags: "extend",
          recent: true,
          sortfield: ["eventid"],
          sortorder: "DESC",
          limit: 100,
          ...extraParams,
        },
        cacheTtl: 30000,
      };
    case "getAlerts":
      return {
        method: "trigger.get",
        params: {
          output: ["triggerid", "description", "priority", "value", "lastchange", "status"],
          selectHosts: ["hostid", "name"],
          filter: { value: 1 },
          sortfield: "priority",
          sortorder: "DESC",
          limit: 100,
          only_true: true,
          active: true,
          expandDescription: true,
          ...extraParams,
        },
        cacheTtl: 30000,
      };
    case "getHostAvailability":
      return {
        method: "host.get",
        params: {
          output: ["hostid", "host", "name", "available"],
          selectInterfaces: ["ip"],
          ...extraParams,
        },
        cacheTtl: 60000,
      };
    case "getItems":
      return {
        method: "item.get",
        params: {
          output: ["itemid", "name", "key_", "lastvalue", "lastclock", "units", "state", "status"],
          selectHosts: ["hostid", "name"],
          sortfield: "name",
          limit: 500,
          ...extraParams,
        },
        cacheTtl: 30000,
      };
    case "getGraphs":
      return {
        method: "graph.get",
        params: {
          output: ["graphid", "name", "width", "height"],
          selectHosts: ["hostid", "name"],
          sortfield: "name",
          ...extraParams,
        },
        cacheTtl: 60000,
      };
    case "getScripts":
      return {
        method: "script.get",
        params: {
          output: ["scriptid", "name", "command", "description", "type", "scope"],
          selectGroups: ["groupid", "name"],
          ...extraParams,
        },
        cacheTtl: 60000,
      };
    case "getHostGroups":
      return {
        method: "hostgroup.get",
        params: {
          output: ["groupid", "name"],
          sortfield: "name",
          ...extraParams,
        },
        cacheTtl: 120000,
      };
    case "getEvents":
      return {
        method: "event.get",
        params: {
          output: "extend",
          selectHosts: ["hostid", "name"],
          sortfield: ["clock"],
          sortorder: "DESC",
          limit: 200,
          ...extraParams,
        },
        cacheTtl: 30000,
      };
    case "getRecentEvents":
      return {
        method: "event.get",
        params: {
          output: ["eventid", "source", "object", "objectid", "clock", "value", "name", "severity", "acknowledged"],
          selectHosts: ["hostid", "name"],
          sortfield: ["clock"],
          sortorder: "DESC",
          limit: 10,
          value: 1,
          ...extraParams,
        },
        cacheTtl: 15000,
      };
    case "getTemplates":
      return {
        method: "template.get",
        params: {
          output: ["templateid", "host", "name", "description"],
          sortfield: "name",
          ...extraParams,
        },
        cacheTtl: 300000,
      };
    case "getHistory":
      return {
        method: "history.get",
        params: {
          output: "extend",
          history: 0,
          sortfield: "clock",
          sortorder: "DESC",
          limit: 500,
          ...extraParams,
        },
        cacheTtl: 30000,
      };
    default:
      return null;
  }
}

/* ─── Main handler ─── */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Verify user auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return fail("Unauthorized", 401);

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !user) return fail("Unauthorized", 401);

  // Get Zabbix settings
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: settings, error: settingsError } = await supabaseAdmin
    .from("zabbix_settings")
    .select("*")
    .limit(1)
    .single();

  if (settingsError || !settings) {
    return fail("Настройки Zabbix не сконфигурированы. Перейдите в Мониторинг → Настройка.");
  }
  if (!settings.is_active) {
    return fail("Подключение к Zabbix отключено в настройках.");
  }

  const ZABBIX_URL = settings.zabbix_url;
  const ZABBIX_USER = settings.zabbix_user;
  const ZABBIX_PASSWORD = settings.zabbix_password;

  if (!ZABBIX_URL || !ZABBIX_USER || !ZABBIX_PASSWORD) {
    return fail("Заполните все поля подключения к Zabbix в настройках.");
  }

  const apiUrl = `${ZABBIX_URL}/api_jsonrpc.php`;
  const headers = { "Content-Type": "application/json" };

  try {
    const body = await req.json();
    const { action, params: extraParams } = body;

    /* ─── Test Connection ─── */
    if (action === "testConnection") {
      try {
        // Step 1: apiinfo.version
        let versionRes: Response;
        try {
          versionRes = await fetchWithTimeout(apiUrl, {
            method: "POST", headers,
            body: jsonRpc("apiinfo.version", {}),
          }, 10000);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg.includes("abort") || msg.includes("Abort")) {
            return ok({ ok: false, error: "timeout", message: "Таймаут соединения (10 сек). Сервер недоступен." });
          }
          return ok({ ok: false, error: "network_error", message: `Сервер не отвечает. Проверьте VPN (BelVPN). (${msg})` });
        }

        const versionText = await versionRes.text();
        let versionData: { result?: string; error?: { message?: string } };
        try { versionData = JSON.parse(versionText); } catch {
          return ok({ ok: false, error: "invalid_url", message: "Ответ не соответствует API Zabbix. Проверьте URL." });
        }
        if (!versionData.result) {
          return ok({ ok: false, error: "invalid_url", message: "Не удалось получить версию Zabbix API." });
        }

        const zabbixVersion = versionData.result;

        // Step 2: user.login
        let loginRes: Response;
        try {
          loginRes = await fetchWithTimeout(apiUrl, {
            method: "POST", headers,
            body: jsonRpc("user.login", { username: ZABBIX_USER, password: ZABBIX_PASSWORD }),
          }, 10000);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          return ok({ ok: false, error: "network_error", message: `Ошибка сети при аутентификации: ${msg}` });
        }

        const loginData = await loginRes.json();
        if (loginData.error) {
          return ok({ ok: false, error: "auth_failed", message: `Неверные учётные данные. (${loginData.error.data || loginData.error.message})` });
        }
        if (!loginData.result) {
          return ok({ ok: false, error: "auth_failed", message: "Не удалось получить токен авторизации." });
        }

        // Step 3: logout
        try {
          const lr = await fetchWithTimeout(apiUrl, {
            method: "POST", headers,
            body: jsonRpc("user.logout", [], loginData.result),
          }, 5000);
          await lr.text();
        } catch { /* ignore */ }

        // Invalidate cached auth token since we just did a fresh login
        authTokenCache = null;

        return ok({ ok: true, data: { version: zabbixVersion }, rawLogin: loginData });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return ok({ ok: false, error: "unknown", message: `Непредвиденная ошибка: ${msg}` });
      }
    }

    /* ─── Execute Script ─── */
    if (action === "executeScript") {
      const { scriptid, hostid } = extraParams || {};
      if (!scriptid || !hostid) return fail("scriptid и hostid обязательны", 400);

      const authToken = await getAuthToken(apiUrl, ZABBIX_USER, ZABBIX_PASSWORD);
      const res = await fetchWithTimeout(apiUrl, {
        method: "POST", headers,
        body: JSON.stringify({
          jsonrpc: "2.0", method: "script.execute",
          params: { scriptid, hostid },
          auth: authToken, id: 2,
        }),
      });
      const data = await res.json();
      return ok({ result: data.result, error: data.error });
    }

    /* ─── Acknowledge Event ─── */
    if (action === "acknowledgeEvent") {
      const { eventids, message: ackMessage, ackAction } = extraParams || {};
      if (!eventids) return fail("eventids обязателен", 400);

      const authToken = await getAuthToken(apiUrl, ZABBIX_USER, ZABBIX_PASSWORD);
      const res = await fetchWithTimeout(apiUrl, {
        method: "POST", headers,
        body: JSON.stringify({
          jsonrpc: "2.0", method: "event.acknowledge",
          params: {
            eventids,
            message: ackMessage || "",
            action: ackAction || 6, // close + message
          },
          auth: authToken, id: 2,
        }),
      });
      const data = await res.json();
      return ok({ result: data.result, error: data.error });
    }

    /* ─── Get Graph Image ─── */
    if (action === "getGraphImage") {
      const { graphid, period, width, height } = extraParams || {};
      if (!graphid) return fail("graphid обязателен", 400);

      // Zabbix chart2.php requires cookie-based auth, so we return graph URL info
      return ok({
        result: {
          graphid,
          url: `${ZABBIX_URL}/chart2.php?graphid=${graphid}&period=${period || 3600}&width=${width || 900}&height=${height || 200}`,
          note: "Для доступа к графику напрямую требуется VPN и авторизация в Zabbix.",
        },
      });
    }

    /* ─── Standard cached actions ─── */
    const actionDef = getActionDef(action, extraParams);
    if (!actionDef) return fail("Unknown action", 400);

    // Check cache
    const cacheKey = `${action}:${JSON.stringify(extraParams || {})}`;
    if (actionDef.cacheTtl > 0) {
      const cached = getCached(cacheKey, actionDef.cacheTtl);
      if (cached !== null) return ok({ result: cached, cached: true });
    }

    // Get auth token (cached)
    const authToken = await getAuthToken(apiUrl, ZABBIX_USER, ZABBIX_PASSWORD);

    const dataResponse = await fetchWithTimeout(apiUrl, {
      method: "POST", headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: actionDef.method,
        params: actionDef.params,
        auth: authToken,
        id: 2,
      }),
    });
    const data = await dataResponse.json();

    if (data.error) {
      // Auth expired - retry once
      if (data.error.code === -32602 || data.error.data === "Session terminated") {
        authTokenCache = null;
        const newToken = await getAuthToken(apiUrl, ZABBIX_USER, ZABBIX_PASSWORD);
        const retryRes = await fetchWithTimeout(apiUrl, {
          method: "POST", headers,
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: actionDef.method,
            params: actionDef.params,
            auth: newToken,
            id: 3,
          }),
        });
        const retryData = await retryRes.json();
        if (retryData.error) return fail(`Zabbix API error: ${retryData.error.message || retryData.error.data}`);
        if (actionDef.cacheTtl > 0) setCache(cacheKey, retryData.result);
        return ok({ result: retryData.result });
      }
      return fail(`Zabbix API error: ${data.error.message || data.error.data}`);
    }

    // Cache result
    if (actionDef.cacheTtl > 0) setCache(cacheKey, data.result);

    return ok({ result: data.result });
  } catch (err) {
    console.error("Zabbix proxy error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return fail(msg);
  }
});
