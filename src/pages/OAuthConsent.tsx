import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Narrow local wrapper — supabase.auth.oauth is beta and may miss types.
type OAuthNs = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};
const oauth = (supabase.auth as any).oauth as OAuthNs;

function safeNext(): string {
  const path = window.location.pathname + window.location.search;
  return path.startsWith("/") ? path : "/";
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("Отсутствует authorization_id");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        window.location.href = "/auth?next=" + encodeURIComponent(safeNext());
        return;
      }
      if (!oauth?.getAuthorizationDetails) {
        return setError("OAuth сервер не настроен в этом клиенте Supabase.");
      }
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => { active = false; };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) { setBusy(false); return setError(error.message); }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); return setError("Сервер авторизации не вернул redirect."); }
    window.location.href = target;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md"><CardContent className="py-6 text-sm text-destructive">{error}</CardContent></Card>
      </div>
    );
  }
  if (!details) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Загрузка…</div>;
  }

  const clientName = details.client?.name ?? details.client?.client_name ?? "внешнее приложение";
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Подключить «{clientName}»?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            «{clientName}» получит доступ к порталу от вашего имени. Все запросы будут ограничены вашими правами (RLS).
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" disabled={busy} onClick={() => decide(false)}>Отклонить</Button>
            <Button disabled={busy} onClick={() => decide(true)}>Разрешить</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}