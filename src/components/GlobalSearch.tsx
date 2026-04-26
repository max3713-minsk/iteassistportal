import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import {
  Ticket, Server, Building2, FileArchive, ClipboardList, Users, Activity,
  Briefcase, Search, Network, BarChart3, FileSpreadsheet, BookOpen, LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

/* ─── Static modules / pages searchable from any query ─── */
const STATIC_TARGETS: { label: string; section: string; path: string; keywords: string; icon: any }[] = [
  { label: "Панель управления", section: "Дашборд", path: "/", keywords: "дашборд панель главная виджеты", icon: LayoutDashboard },
  { label: "Заявки", section: "Service Desk", path: "/tickets", keywords: "тикеты заявки support helpdesk", icon: Ticket },
  { label: "Оборудование", section: "Инфраструктура", path: "/equipment", keywords: "оборудование equipment железо", icon: Server },
  { label: "ЦОД", section: "Инфраструктура", path: "/sites", keywords: "цод дата-центр sites площадки", icon: Building2 },
  { label: "Организации", section: "Справочники", path: "/organizations", keywords: "организации компании клиенты", icon: Briefcase },
  { label: "Документы", section: "Хранилище", path: "/documents", keywords: "документы файлы договоры", icon: FileArchive },
  { label: "Протоколы ТО", section: "Обслуживание", path: "/protocols", keywords: "протоколы то maintenance", icon: ClipboardList },
  { label: "Календарь обслуживания", section: "Обслуживание", path: "/schedules", keywords: "календарь регламент schedules", icon: ClipboardList },
  { label: "Мониторинг", section: "Мониторинг", path: "/monitoring", keywords: "мониторинг zabbix хосты алерты", icon: Activity },
  { label: "Графики", section: "Мониторинг", path: "/monitoring?tab=graphs", keywords: "графики метрики charts", icon: BarChart3 },
  { label: "Подключения Zabbix", section: "Мониторинг", path: "/zabbix-connections", keywords: "zabbix подключения connections", icon: Network },
  { label: "Уведомления", section: "Личное", path: "/notifications", keywords: "уведомления notifications каналы", icon: Activity },
  { label: "Журнал аудита", section: "Администрирование", path: "/audit-log", keywords: "аудит журнал лог logs", icon: FileSpreadsheet },
  { label: "Пользователи", section: "Администрирование", path: "/users-admin", keywords: "пользователи users админ", icon: Users },
  { label: "Справка / База знаний", section: "Помощь", path: "/help-reference", keywords: "справка help knowledge база знаний тз", icon: BookOpen },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { hasModuleAccess, hasRole } = useAuth();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const debounced = useDebounced(q, 200);
  const enabled = open && debounced.trim().length >= 2;

  const { data, isFetching } = useQuery({
    queryKey: ["global-search", debounced],
    queryFn: async () => {
      const term = debounced.trim();
      const like = `%${term}%`;
      const [tickets, equipment, sites, documents, protocols, orgs, hosts, profiles, savedGraphs, tzReqs] = await Promise.all([
        hasModuleAccess("tickets")
          ? supabase.from("tickets").select("id,title,status,priority,created_at")
              .or(`title.ilike.${like},description.ilike.${like}`)
              .order("created_at", { ascending: false }).limit(8)
          : Promise.resolve({ data: [] as any[] }),
        hasModuleAccess("equipment")
          ? supabase.from("equipment").select("id,name,model,serial_number,site_id")
              .or(`name.ilike.${like},model.ilike.${like},serial_number.ilike.${like}`).limit(8)
          : Promise.resolve({ data: [] as any[] }),
        hasModuleAccess("sites")
          ? supabase.from("sites").select("id,name,city,address")
              .or(`name.ilike.${like},city.ilike.${like},address.ilike.${like}`).limit(8)
          : Promise.resolve({ data: [] as any[] }),
        hasModuleAccess("documents")
          ? supabase.from("documents").select("id,name,description,doc_category")
              .or(`name.ilike.${like},description.ilike.${like}`).limit(8)
          : Promise.resolve({ data: [] as any[] }),
        hasModuleAccess("protocols")
          ? supabase.from("maintenance_protocols").select("id,frequency,status,period_start,period_end")
              .order("created_at", { ascending: false }).limit(40)
          : Promise.resolve({ data: [] as any[] }),
        hasRole("admin")
          ? supabase.from("organizations").select("id,name,short_name,inn")
              .or(`name.ilike.${like},short_name.ilike.${like},inn.ilike.${like}`).limit(6)
          : Promise.resolve({ data: [] as any[] }),
        hasModuleAccess("monitoring")
          ? supabase.from("monitored_hosts").select("id,name,visible_name,ip_address,host_group")
              .or(`name.ilike.${like},visible_name.ilike.${like},ip_address.ilike.${like}`).limit(8)
          : Promise.resolve({ data: [] as any[] }),
        hasRole("admin") || hasRole("engineer")
          ? supabase.from("profiles").select("id,user_id,full_name,organization,phone")
              .or(`full_name.ilike.${like},organization.ilike.${like},phone.ilike.${like}`).limit(6)
          : Promise.resolve({ data: [] as any[] }),
        supabase.from("saved_graphs").select("id,name,description")
          .or(`name.ilike.${like},description.ilike.${like}`).limit(6),
        supabase.from("tz_requirements").select("id,code,title,category")
          .or(`code.ilike.${like},title.ilike.${like},category.ilike.${like}`).limit(6),
      ]);

      const protoFiltered = (protocols.data || []).filter((p: any) => {
        const t = `${p.frequency} ${p.status} ${p.period_start}`.toLowerCase();
        return t.includes(term.toLowerCase());
      }).slice(0, 6);

      const tl = term.toLowerCase();
      const modules = STATIC_TARGETS.filter(
        (m) => m.label.toLowerCase().includes(tl) || m.keywords.includes(tl) || m.section.toLowerCase().includes(tl)
      );

      return {
        tickets: tickets.data || [],
        equipment: equipment.data || [],
        sites: sites.data || [],
        documents: documents.data || [],
        protocols: protoFiltered,
        orgs: orgs.data || [],
        hosts: hosts.data || [],
        profiles: profiles.data || [],
        savedGraphs: savedGraphs.data || [],
        tzReqs: tzReqs.data || [],
        modules,
      };
    },
    enabled,
    staleTime: 30_000,
  });

  const totalCount = useMemo(() => {
    if (!data) return 0;
    return data.tickets.length + data.equipment.length + data.sites.length +
      data.documents.length + data.protocols.length + data.orgs.length +
      data.hosts.length + data.profiles.length + data.savedGraphs.length +
      data.tzReqs.length + data.modules.length;
  }, [data]);

  const go = (path: string) => { setOpen(false); setQ(""); navigate(path); };

  return (
    <>
      {/* Wide search bar trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2 w-full max-w-[320px] h-9 px-3 rounded-md border border-border bg-muted/40 hover:bg-muted/70 hover:border-primary/40 transition-colors text-left"
        aria-label="Открыть глобальный поиск"
      >
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground flex-1 truncate">
          Поиск по порталу...
        </span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 rounded border bg-background/80 px-1.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Заявки, хосты, разделы, пользователи, графики, ТЗ..."
          value={q}
          onValueChange={setQ}
        />
        <CommandList>
          {!enabled && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Введите минимум 2 символа для поиска
            </div>
          )}
          {enabled && isFetching && (
            <div className="py-6 text-center text-sm text-muted-foreground">Поиск...</div>
          )}
          {enabled && !isFetching && totalCount === 0 && (
            <CommandEmpty>Ничего не найдено</CommandEmpty>
          )}

          {data && data.modules.length > 0 && (
            <>
              <CommandGroup heading="Разделы портала">
                {data.modules.map((m) => {
                  const Icon = m.icon;
                  return (
                    <CommandItem key={`m-${m.path}`} value={`module-${m.path}-${m.label}`} onSelect={() => go(m.path)}>
                      <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="flex-1 truncate">{m.label}</span>
                      <Badge variant="outline" className="ml-2 text-[10px]">{m.section}</Badge>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {data && data.tickets.length > 0 && (
            <>
              <CommandGroup heading="Заявки">
                {data.tickets.map((t: any) => (
                  <CommandItem key={`t-${t.id}`} value={`ticket-${t.id}-${t.title}`} onSelect={() => go(`/tickets?id=${t.id}`)}>
                    <Ticket className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="flex-1 truncate">{t.title}</span>
                    <Badge variant="outline" className="ml-2 text-[10px]">{t.priority}</Badge>
                    <Badge variant="secondary" className="ml-1 text-[10px]">{t.status}</Badge>
                    <Badge variant="outline" className="ml-1 text-[10px] bg-muted/50">Service Desk</Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {data && data.equipment.length > 0 && (
            <>
              <CommandGroup heading="Оборудование">
                {data.equipment.map((e: any) => (
                  <CommandItem key={`e-${e.id}`} value={`equip-${e.id}-${e.name}`} onSelect={() => go(`/equipment?id=${e.id}`)}>
                    <Server className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="flex-1 truncate">{e.name}</span>
                    {e.model && <span className="text-xs text-muted-foreground ml-2 truncate max-w-[160px]">{e.model}</span>}
                    <Badge variant="outline" className="ml-2 text-[10px] bg-muted/50">Инфраструктура</Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {data && data.hosts.length > 0 && (
            <>
              <CommandGroup heading="Хосты мониторинга">
                {data.hosts.map((h: any) => (
                  <CommandItem key={`h-${h.id}`} value={`host-${h.id}-${h.name}`} onSelect={() => go(`/monitoring?tab=hosts&host=${h.id}`)}>
                    <Network className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="flex-1 truncate">{h.visible_name || h.name}</span>
                    {h.ip_address && <span className="text-xs text-muted-foreground ml-2 font-mono">{h.ip_address}</span>}
                    <Badge variant="outline" className="ml-2 text-[10px] bg-muted/50">Мониторинг</Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {data && data.sites.length > 0 && (
            <>
              <CommandGroup heading="ЦОД">
                {data.sites.map((s: any) => (
                  <CommandItem key={`s-${s.id}`} value={`site-${s.id}-${s.name}`} onSelect={() => go(`/sites?id=${s.id}`)}>
                    <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="flex-1 truncate">{s.name}</span>
                    {s.city && <span className="text-xs text-muted-foreground ml-2">{s.city}</span>}
                    <Badge variant="outline" className="ml-2 text-[10px] bg-muted/50">Инфраструктура</Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {data && data.documents.length > 0 && (
            <>
              <CommandGroup heading="Документы">
                {data.documents.map((d: any) => (
                  <CommandItem key={`d-${d.id}`} value={`doc-${d.id}-${d.name}`} onSelect={() => go(`/documents?id=${d.id}`)}>
                    <FileArchive className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="flex-1 truncate">{d.name}</span>
                    <Badge variant="outline" className="ml-2 text-[10px]">{d.doc_category}</Badge>
                    <Badge variant="outline" className="ml-1 text-[10px] bg-muted/50">Хранилище</Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {data && data.protocols.length > 0 && (
            <>
              <CommandGroup heading="Протоколы ТО">
                {data.protocols.map((p: any) => (
                  <CommandItem key={`p-${p.id}`} value={`proto-${p.id}`} onSelect={() => go(`/protocols?id=${p.id}`)}>
                    <ClipboardList className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="flex-1 truncate">{p.frequency} · {p.period_start}</span>
                    <Badge variant="secondary" className="ml-2 text-[10px]">{p.status}</Badge>
                    <Badge variant="outline" className="ml-1 text-[10px] bg-muted/50">Обслуживание</Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {data && data.savedGraphs.length > 0 && (
            <>
              <CommandGroup heading="Сохранённые графики">
                {data.savedGraphs.map((g: any) => (
                  <CommandItem key={`g-${g.id}`} value={`graph-${g.id}-${g.name}`} onSelect={() => go(`/monitoring?tab=graphs&graph=${g.id}`)}>
                    <BarChart3 className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="flex-1 truncate">{g.name}</span>
                    <Badge variant="outline" className="ml-2 text-[10px] bg-muted/50">Мониторинг</Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {data && data.tzReqs.length > 0 && (
            <>
              <CommandGroup heading="Требования ТЗ">
                {data.tzReqs.map((r: any) => (
                  <CommandItem key={`r-${r.id}`} value={`tz-${r.id}-${r.code}`} onSelect={() => go(`/monitoring?tab=tz`)}>
                    <ClipboardList className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="flex-1 truncate">{r.code} — {r.title}</span>
                    <Badge variant="outline" className="ml-2 text-[10px] bg-muted/50">ТЗ · {r.category || "—"}</Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {data && data.profiles.length > 0 && (
            <>
              <CommandGroup heading="Пользователи">
                {data.profiles.map((p: any) => (
                  <CommandItem key={`u-${p.id}`} value={`user-${p.id}-${p.full_name}`} onSelect={() => go(`/users-admin?user=${p.user_id}`)}>
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="flex-1 truncate">{p.full_name || "—"}</span>
                    {p.organization && <span className="text-xs text-muted-foreground ml-2 truncate max-w-[160px]">{p.organization}</span>}
                    <Badge variant="outline" className="ml-2 text-[10px] bg-muted/50">Администрирование</Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {data && data.orgs.length > 0 && (
            <CommandGroup heading="Организации">
              {data.orgs.map((o: any) => (
                <CommandItem key={`o-${o.id}`} value={`org-${o.id}-${o.name}`} onSelect={() => go(`/organizations?id=${o.id}`)}>
                  <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="flex-1 truncate">{o.name}</span>
                  {o.inn && <span className="text-xs text-muted-foreground ml-2">ИНН {o.inn}</span>}
                  <Badge variant="outline" className="ml-2 text-[10px] bg-muted/50">Справочники</Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

function useDebounced<T>(value: T, delay: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
