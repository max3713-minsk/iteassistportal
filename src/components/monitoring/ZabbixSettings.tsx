import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff, Wifi, Shield, Globe, Circle, RefreshCw } from "lucide-react";

type TestResult = {
  ok: boolean;
  data?: { version: string };
  error?: string;
  message?: string;
  rawLogin?: unknown;
};

export default function ZabbixSettings() {
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const queryClient = useQueryClient();

  const [url, setUrl] = useState("");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [vpnInfo, setVpnInfo] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");
  const [debugData, setDebugData] = useState<unknown>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [lastConnectedVersion, setLastConnectedVersion] = useState<string | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["zabbix-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zabbix_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      setUrl(settings.zabbix_url || "");
      setUser(settings.zabbix_user || "");
      setPassword(settings.zabbix_password || "");
      setVpnInfo(settings.vpn_info || "");
      setIsActive(settings.is_active || false);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        zabbix_url: url.replace(/\/+$/, ""),
        zabbix_user: user,
        zabbix_password: password,
        vpn_info: vpnInfo,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      };

      if (settings?.id) {
        const { error } = await supabase
          .from("zabbix_settings")
          .update(payload)
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("zabbix_settings")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zabbix-settings"] });
      toast({ title: "Настройки сохранены" });
    },
    onError: (e: Error) => {
      toast({ title: "Ошибка сохранения", description: e.message, variant: "destructive" });
    },
  });

  const testConnection = async () => {
    // Save first so edge function uses latest values
    const payload = {
      zabbix_url: url.replace(/\/+$/, ""),
      zabbix_user: user,
      zabbix_password: password,
      vpn_info: vpnInfo,
      is_active: true, // must be active to test
      updated_at: new Date().toISOString(),
    };

    try {
      if (settings?.id) {
        await supabase.from("zabbix_settings").update(payload).eq("id", settings.id);
      } else {
        await supabase.from("zabbix_settings").insert(payload);
      }
      queryClient.invalidateQueries({ queryKey: ["zabbix-settings"] });
    } catch {
      // continue with test anyway
    }

    setTestStatus("loading");
    setTestMessage("");
    setDebugData(null);

    try {
      const { data, error } = await supabase.functions.invoke("zabbix-proxy", {
        body: { action: "testConnection" },
      });

      if (error) {
        setTestStatus("error");
        const msg = typeof error === "object" && "message" in error ? (error as { message: string }).message : String(error);
        setTestMessage(`Ошибка вызова функции: ${msg}`);
        setDebugData(error);
        return;
      }

      const result = data as TestResult;
      setDebugData(result);

      if (result.ok) {
        setTestStatus("success");
        setLastConnectedVersion(result.data?.version || "unknown");
        setTestMessage(`Подключение установлено. Версия Zabbix: ${result.data?.version}`);
        toast({ title: "✅ Подключение к Zabbix установлено", description: `Версия: ${result.data?.version}` });
      } else {
        setTestStatus("error");
        setLastConnectedVersion(null);

        let userMessage = result.message || "Неизвестная ошибка";
        const errCode = result.error;

        if (errCode === "timeout") {
          userMessage = "Таймаут соединения (10 сек). Сервер недоступен. Проверьте VPN-подключение (BelVPN) и доступность адреса.";
        } else if (errCode === "network_error") {
          userMessage += " Проверьте VPN-подключение (BelVPN) и доступность адреса.";
        } else if (errCode === "auth_failed") {
          userMessage = `Неверное имя пользователя или пароль. ${result.message || ""}`;
        } else if (errCode === "invalid_url") {
          userMessage = result.message || "Неверный URL. Убедитесь, что путь содержит /zabbix.";
        }

        setTestMessage(userMessage);
        toast({ title: "❌ Ошибка подключения к Zabbix", description: userMessage, variant: "destructive" });
      }
    } catch (e: unknown) {
      setTestStatus("error");
      const msg = e instanceof Error ? e.message : String(e);
      setTestMessage(`Ошибка: ${msg}`);
      setDebugData(e);
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Только администраторы могут управлять настройками Zabbix.
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const statusIndicator = testStatus === "success"
    ? <Circle className="h-3 w-3 fill-green-500 text-green-500" />
    : testStatus === "error"
      ? <Circle className="h-3 w-3 fill-red-500 text-red-500" />
      : <Circle className="h-3 w-3 fill-muted text-muted-foreground" />;

  const statusLabel = testStatus === "success"
    ? <span className="text-xs text-green-600 dark:text-green-400">Подключено (v{lastConnectedVersion})</span>
    : testStatus === "error"
      ? <span className="text-xs text-red-600 dark:text-red-400">Не подключено</span>
      : <span className="text-xs text-muted-foreground">Не проверено</span>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle
            className="text-base flex items-center gap-2 cursor-default select-none"
            onDoubleClick={() => debugData && setShowDebug(true)}
          >
            <Globe className="h-4 w-4" />
            Подключение к Zabbix
            <span className="ml-2 flex items-center gap-1.5">
              {statusIndicator}
              {statusLabel}
            </span>
          </CardTitle>
          <CardDescription>
            Укажите адрес и учётные данные Zabbix API. Подключение будет проксироваться через серверную функцию.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zabbix-url">URL Zabbix (без /api_jsonrpc.php)</Label>
              <Input
                id="zabbix-url"
                placeholder="http://10.11.12.240/zabbix"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Пример: http://zabbix.customer.local/zabbix
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zabbix-user">Пользователь Zabbix</Label>
              <Input
                id="zabbix-user"
                placeholder="Admin"
                value={user}
                onChange={(e) => setUser(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zabbix-password">Пароль</Label>
              <div className="relative">
                <Input
                  id="zabbix-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={isActive} onCheckedChange={setIsActive} id="zabbix-active" />
              <Label htmlFor="zabbix-active">Подключение активно</Label>
              {isActive ? (
                <Badge variant="default" className="bg-green-600">Вкл</Badge>
              ) : (
                <Badge variant="secondary">Выкл</Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2 flex-wrap">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Сохранить настройки
            </Button>
            <Button
              variant="outline"
              onClick={testConnection}
              disabled={testStatus === "loading" || !url || !user || !password}
            >
              {testStatus === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Проверка...
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4 mr-2" />
                  Проверить подключение
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["zabbix"] });
                queryClient.invalidateQueries({ queryKey: ["zbx-all-templates"] });
                queryClient.invalidateQueries({ queryKey: ["zbx-host-detail"] });
                queryClient.invalidateQueries({ queryKey: ["zabbix-settings-active"] });
                toast({ title: "Синхронизация всех данных Zabbix..." });
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Синхронизировать всё с Zabbix
            </Button>
          </div>

          {testStatus !== "idle" && testStatus !== "loading" && (
            <div className={`flex items-start gap-2 text-sm p-3 rounded-md ${
              testStatus === "success"
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            }`}>
              {testStatus === "success" ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p>{testMessage}</p>
                {testStatus === "error" && debugData && (
                  <button
                    className="text-xs underline opacity-60 hover:opacity-100 mt-1"
                    onClick={() => setShowDebug(true)}
                  >
                    Показать техническую информацию
                  </button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            VPN-туннель (BelVPN)
          </CardTitle>
          <CardDescription>
            Информация о VPN-подключении к инфраструктуре заказчика.
            Туннель организуется через клиент BelVPN и шлюз на стороне заказчика.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Укажите параметры VPN-туннеля: адрес шлюза, подсети, статус подключения и т.д."
            value={vpnInfo}
            onChange={(e) => setVpnInfo(e.target.value)}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            💡 После установки VPN-туннеля укажите внутренний адрес Zabbix-сервера в поле URL выше.
            Сервер мониторинга будет доступен через зашифрованный канал BelVPN.
          </p>
        </CardContent>
      </Card>

      {/* Debug modal — double-click title or click "Показать техническую информацию" */}
      <Dialog open={showDebug} onOpenChange={setShowDebug}>
        <DialogContent className="max-w-2xl max-h-[70vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Диагностика подключения Zabbix</DialogTitle>
          </DialogHeader>
          <pre className="text-xs bg-muted p-4 rounded-md overflow-auto whitespace-pre-wrap">
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
