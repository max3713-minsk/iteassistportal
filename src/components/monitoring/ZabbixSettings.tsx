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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff, Wifi, Shield, Globe } from "lucide-react";

export default function ZabbixSettings() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [url, setUrl] = useState("");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [vpnInfo, setVpnInfo] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");

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
    setTestStatus("loading");
    setTestMessage("");
    try {
      const { data, error } = await supabase.functions.invoke("zabbix-proxy", {
        body: { action: "testConnection" },
      });
      if (error) throw error;
      if (data?.result?.authenticated) {
        setTestStatus("success");
        setTestMessage(`Подключено. Zabbix версия: ${data.result.version}`);
      } else if (data?.error) {
        setTestStatus("error");
        setTestMessage(data.error);
      }
    } catch (e: any) {
      setTestStatus("error");
      const msg = typeof e === "object" && e?.message ? e.message : String(e);
      setTestMessage(msg);
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Подключение к Zabbix
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

          <div className="flex gap-2 pt-2">
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
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wifi className="h-4 w-4 mr-2" />
              )}
              Проверить подключение
            </Button>
          </div>

          {testStatus !== "idle" && testStatus !== "loading" && (
            <div className={`flex items-center gap-2 text-sm p-3 rounded-md ${
              testStatus === "success"
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            }`}>
              {testStatus === "success" ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 flex-shrink-0" />
              )}
              {testMessage}
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
    </div>
  );
}
