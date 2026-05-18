import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plug, GitBranch, FolderArchive, Loader2, ExternalLink, Wand2, Zap } from "lucide-react";
import { previewSeafilePath } from "@/lib/seafile";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type IntegrationKey = "gitlab" | "seafile";

interface SettingRow {
  id?: string;
  key: string;
  enabled: boolean;
  config: Record<string, any>;
}

function useSetting(key: IntegrationKey) {
  const [row, setRow] = useState<SettingRow>({ key, enabled: false, config: {} });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("integration_settings").select("*").eq("key", key).maybeSingle();
      if (data) setRow(data as SettingRow);
      setLoading(false);
    })();
  }, [key]);
  return { row, setRow, loading };
}

async function saveSetting(row: SettingRow) {
  const { error } = await supabase.from("integration_settings").upsert({
    id: row.id, key: row.key, enabled: row.enabled, config: row.config,
  } as any, { onConflict: "key" });
  if (error) throw error;
}

function GitLabPanel() {
  const { row, setRow, loading } = useSetting("gitlab");
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const cfg = row.config || {};
  const updateCfg = (patch: Record<string, any>) =>
    setRow({ ...row, config: { ...cfg, ...patch } });

  const handleSave = async () => {
    setSaving(true);
    try { await saveSetting(row); toast({ title: "Настройки GitLab сохранены" }); }
    catch (e: any) { toast({ title: "Ошибка", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  if (loading) return <Loader2 className="h-5 w-5 animate-spin" />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><GitBranch className="h-4 w-4" /> GitLab</CardTitle>
            <CardDescription>Автоматическое создание задач (issues) из заявок портала</CardDescription>
          </div>
          <Switch checked={row.enabled} onCheckedChange={(v) => setRow({ ...row, enabled: v })} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Базовый URL <span className="text-destructive">*</span></Label>
            <Input placeholder="https://gitlab.local" value={cfg.base_url || ""}
              onChange={(e) => updateCfg({ base_url: e.target.value })} />
          </div>
          <div>
            <Label>Project ID или path (group/project) <span className="text-destructive">*</span></Label>
            <Input placeholder="123 или devops/infra" value={cfg.project_id || ""}
              onChange={(e) => updateCfg({ project_id: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Personal Access Token <span className="text-destructive">*</span></Label>
            <Input type="password" placeholder="glpat-..." value={cfg.token || ""}
              onChange={(e) => updateCfg({ token: e.target.value })} />
            <p className="text-xs text-muted-foreground mt-1">Минимальный scope: <code>api</code>. Создаётся в GitLab → User Settings → Access Tokens.</p>
          </div>
          <div>
            <Label>Исполнитель по умолчанию (username)</Label>
            <Input placeholder="ivanov" value={cfg.default_assignee || ""}
              onChange={(e) => updateCfg({ default_assignee: e.target.value })} />
          </div>
        </div>

        <div>
          <Label>Маппинг приоритет/категория → label GitLab (JSON)</Label>
          <Textarea rows={3} className="font-mono text-xs"
            placeholder='{"P1": "severity::critical", "P2": "severity::high"}'
            value={cfg.label_mapping ? JSON.stringify(cfg.label_mapping, null, 2) : ""}
            onChange={(e) => {
              try { updateCfg({ label_mapping: e.target.value ? JSON.parse(e.target.value) : {} }); }
              catch { /* ignore until valid */ }
            }} />
        </div>
        <div>
          <Label>Маппинг приоритет/категория → username исполнителя (JSON)</Label>
          <Textarea rows={3} className="font-mono text-xs"
            placeholder='{"P1": "oncall", "network": "netadmin"}'
            value={cfg.assignee_mapping ? JSON.stringify(cfg.assignee_mapping, null, 2) : ""}
            onChange={(e) => {
              try { updateCfg({ assignee_mapping: e.target.value ? JSON.parse(e.target.value) : {} }); }
              catch { /* ignore */ }
            }} />
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
          Сохранить
        </Button>
      </CardContent>
    </Card>
  );
}

function SeafilePanel() {
  const { row, setRow, loading } = useSetting("seafile");
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<string>("");
  const cfg = row.config || {};
  const updateCfg = (patch: Record<string, any>) => setRow({ ...row, config: { ...cfg, ...patch } });

  const DEFAULT_FOLDERS: Record<string, string> = {
    protocol: "Протоколы/{org}/{year}/{frequency_ru}/{period}",
    graph: "Графики/{org}/{year}-{month}",
    report: "Отчёты/{org}/{year}-{month}",
    document: "Документы/{org}/{category}",
    map: "Схемы/{org}",
    audit: "Аудит/{year}-{month}",
    ticket: "Обращения/{org}/{year}-{month}",
  };
  const KIND_LABELS: Record<string, string> = {
    protocol: "Протоколы ТО",
    graph: "Графики мониторинга",
    report: "Отчёты по клиентам",
    document: "Документация",
    map: "Схемы инфраструктуры",
    audit: "Журнал аудита",
    ticket: "Обращения",
  };
  const folders = { ...DEFAULT_FOLDERS, ...(cfg.folders || {}) };
  const filenamePattern: string = cfg.filename_pattern || "{date}_{name}_{user}";

  const updateFolder = (k: string, v: string) =>
    updateCfg({ folders: { ...(cfg.folders || {}), [k]: v } });

  const testPath = async (kind: string) => {
    setPreviewing(kind);
    setPreviewResult("");
    try {
      const res = await previewSeafilePath(kind as any, {
        org: "ОАО_Тест",
        category: "technical",
        frequency: "monthly",
        period: "2026-05",
        name: "пример",
      }, "preview.bin");
      setPreviewResult(`${kind}: ${res.folder}/${res.filename}`);
      toast({ title: "Превью пути", description: `${res.folder}/${res.filename}` });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setPreviewing(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try { await saveSetting(row); toast({ title: "Настройки Seafile сохранены" }); }
    catch (e: any) { toast({ title: "Ошибка", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  if (loading) return <Loader2 className="h-5 w-5 animate-spin" />;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><FolderArchive className="h-4 w-4" /> Seafile</CardTitle>
            <CardDescription>Хранилище для документов и обслуживания (вложения, протоколы)</CardDescription>
          </div>
          <Switch checked={row.enabled} onCheckedChange={(v) => setRow({ ...row, enabled: v })} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Базовый URL <span className="text-destructive">*</span></Label>
            <Input placeholder="https://seafile.local" value={cfg.base_url || ""}
              onChange={(e) => updateCfg({ base_url: e.target.value })} />
          </div>
          <div>
            <Label>Library / Repo ID <span className="text-destructive">*</span></Label>
            <Input placeholder="abc123-..." value={cfg.repo_id || ""}
              onChange={(e) => updateCfg({ repo_id: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>API Token <span className="text-destructive">*</span></Label>
            <Input type="password" placeholder="Seafile API token" value={cfg.token || ""}
              onChange={(e) => updateCfg({ token: e.target.value })} />
            <p className="text-xs text-muted-foreground mt-1">Получить: <code>POST /api2/auth-token/</code> с логином/паролем сервисного аккаунта.</p>
          </div>
          <div>
            <Label>Подкаталог по умолчанию</Label>
            <Input placeholder="/ITEAssist" value={cfg.default_subdir || "/"}
              onChange={(e) => updateCfg({ default_subdir: e.target.value })} />
          </div>
          <div>
            <Label>Корневая папка портала</Label>
            <Input placeholder="/Портал" value={cfg.root || "/"}
              onChange={(e) => updateCfg({ root: e.target.value })} />
            <p className="text-xs text-muted-foreground mt-1">Используется как префикс для всех типов контента.</p>
          </div>
        </div>

        <div className="border rounded-md p-3 space-y-3">
          <div>
            <h3 className="text-sm font-semibold mb-1">Шаблоны папок по типу контента</h3>
            <p className="text-xs text-muted-foreground">
              Доступные плейсхолдеры: <code>{"{org}"}</code> <code>{"{year}"}</code> <code>{"{month}"}</code> <code>{"{date}"}</code> <code>{"{frequency_ru}"}</code> <code>{"{period}"}</code> <code>{"{category}"}</code> <code>{"{name}"}</code> <code>{"{user}"}</code>
            </p>
          </div>
          <div className="space-y-2">
            {Object.entries(KIND_LABELS).map(([k, label]) => (
              <div key={k} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-3 text-sm">{label}</div>
                <Input
                  className="col-span-7 font-mono text-xs"
                  value={folders[k]}
                  placeholder={DEFAULT_FOLDERS[k]}
                  onChange={(e) => updateFolder(k, e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="col-span-2"
                  onClick={() => testPath(k)}
                  disabled={previewing === k || !row.enabled}
                >
                  {previewing === k ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Wand2 className="h-3 w-3 mr-1" />}
                  Тест пути
                </Button>
              </div>
            ))}
          </div>
          <div>
            <Label>Шаблон имени файла</Label>
            <Input
              className="font-mono text-xs"
              value={filenamePattern}
              placeholder="{date}_{name}_{user}"
              onChange={(e) => updateCfg({ filename_pattern: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Например <code>{"{date}_{name}_{user}"}</code> → <code>2026-05-18_1430_протокол_ivanov.docx</code>. Расширение добавляется автоматически.
            </p>
          </div>
          {previewResult && (
            <div className="text-xs font-mono p-2 bg-muted/50 rounded">{previewResult}</div>
          )}
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
          Сохранить
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Integrations() {
  const { hasRole } = useAuth();
  if (!hasRole("admin")) {
    return (
      <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
        Доступ только для администраторов
      </CardContent></Card>
    );
  }
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Plug className="h-6 w-6 text-primary" /> Внешние интеграции
        </h1>
        <p className="text-sm text-muted-foreground">
          Настройте локальные сервисы, чтобы заявки автоматически создавали задачи и отправляли вложения.
        </p>
      </div>
      <Tabs defaultValue="gitlab">
        <TabsList>
          <TabsTrigger value="gitlab"><GitBranch className="h-3.5 w-3.5 mr-1" /> GitLab</TabsTrigger>
          <TabsTrigger value="seafile"><FolderArchive className="h-3.5 w-3.5 mr-1" /> Seafile</TabsTrigger>
        </TabsList>
        <TabsContent value="gitlab" className="mt-4"><GitLabPanel /></TabsContent>
        <TabsContent value="seafile" className="mt-4"><SeafilePanel /></TabsContent>
      </Tabs>
    </div>
  );
}