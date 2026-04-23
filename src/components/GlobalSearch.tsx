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
  Briefcase, Search,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Глобальный поиск (Cmd/Ctrl+K).
 * Ищет по тикетам, оборудованию, ЦОДам, документам, протоколам и организациям.
 * Соблюдает RLS — отдает только то, что пользователь имеет право видеть.
 */
export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { hasModuleAccess, hasRole } = useAuth();

  // Hotkey: Cmd+K / Ctrl+K
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
      const [tickets, equipment, sites, documents, protocols, orgs] = await Promise.all([
        hasModuleAccess("tickets")
          ? supabase.from("tickets")
              .select("id,title,status,priority,created_at")
              .or(`title.ilike.${like},description.ilike.${like}`)
              .order("created_at", { ascending: false })
              .limit(8)
          : Promise.resolve({ data: [] as any[] }),
        hasModuleAccess("equipment")
          ? supabase.from("equipment")
              .select("id,name,model,serial_number,site_id")
              .or(`name.ilike.${like},model.ilike.${like},serial_number.ilike.${like}`)
              .limit(8)
          : Promise.resolve({ data: [] as any[] }),
        hasModuleAccess("sites")
          ? supabase.from("sites")
              .select("id,name,city,address")
              .or(`name.ilike.${like},city.ilike.${like},address.ilike.${like}`)
              .limit(8)
          : Promise.resolve({ data: [] as any[] }),
        hasModuleAccess("documents")
          ? supabase.from("documents")
              .select("id,name,description,doc_category")
              .or(`name.ilike.${like},description.ilike.${like}`)
              .limit(8)
          : Promise.resolve({ data: [] as any[] }),
        hasModuleAccess("protocols")
          ? supabase.from("maintenance_protocols")
              .select("id,frequency,status,period_start,period_end")
              .order("created_at", { ascending: false })
              .limit(40)
          : Promise.resolve({ data: [] as any[] }),
        hasRole("admin")
          ? supabase.from("organizations")
              .select("id,name,short_name,inn")
              .or(`name.ilike.${like},short_name.ilike.${like},inn.ilike.${like}`)
              .limit(6)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      // protocols фильтруем на клиенте (нет текстовых полей)
      const protoFiltered = (protocols.data || []).filter((p: any) => {
        const t = `${p.frequency} ${p.status} ${p.period_start}`.toLowerCase();
        return t.includes(term.toLowerCase());
      }).slice(0, 6);
      return {
        tickets: tickets.data || [],
        equipment: equipment.data || [],
        sites: sites.data || [],
        documents: documents.data || [],
        protocols: protoFiltered,
        orgs: orgs.data || [],
      };
    },
    enabled,
    staleTime: 30_000,
  });

  const totalCount = useMemo(() => {
    if (!data) return 0;
    return data.tickets.length + data.equipment.length + data.sites.length +
      data.documents.length + data.protocols.length + data.orgs.length;
  }, [data]);

  const go = (path: string) => {
    setOpen(false);
    setQ("");
    navigate(path);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 text-muted-foreground"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Поиск...</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Искать тикеты, оборудование, ЦОД, документы..."
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

          {data && data.tickets.length > 0 && (
            <>
              <CommandGroup heading="Заявки">
                {data.tickets.map((t: any) => (
                  <CommandItem
                    key={`t-${t.id}`}
                    value={`ticket-${t.id}-${t.title}`}
                    onSelect={() => go(`/tickets?id=${t.id}`)}
                  >
                    <Ticket className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="flex-1 truncate">{t.title}</span>
                    <Badge variant="outline" className="ml-2 text-[10px]">{t.priority}</Badge>
                    <Badge variant="secondary" className="ml-1 text-[10px]">{t.status}</Badge>
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
                  <CommandItem
                    key={`e-${e.id}`}
                    value={`equip-${e.id}-${e.name}`}
                    onSelect={() => go(`/equipment?id=${e.id}`)}
                  >
                    <Server className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="flex-1 truncate">{e.name}</span>
                    {e.model && <span className="text-xs text-muted-foreground ml-2 truncate max-w-[160px]">{e.model}</span>}
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
                  <CommandItem
                    key={`s-${s.id}`}
                    value={`site-${s.id}-${s.name}`}
                    onSelect={() => go(`/sites?id=${s.id}`)}
                  >
                    <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="flex-1 truncate">{s.name}</span>
                    {s.city && <span className="text-xs text-muted-foreground ml-2">{s.city}</span>}
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
                  <CommandItem
                    key={`d-${d.id}`}
                    value={`doc-${d.id}-${d.name}`}
                    onSelect={() => go(`/documents?id=${d.id}`)}
                  >
                    <FileArchive className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="flex-1 truncate">{d.name}</span>
                    <Badge variant="outline" className="ml-2 text-[10px]">{d.doc_category}</Badge>
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
                  <CommandItem
                    key={`p-${p.id}`}
                    value={`proto-${p.id}`}
                    onSelect={() => go(`/protocols?id=${p.id}`)}
                  >
                    <ClipboardList className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="flex-1 truncate">{p.frequency} · {p.period_start}</span>
                    <Badge variant="secondary" className="ml-2 text-[10px]">{p.status}</Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {data && data.orgs.length > 0 && (
            <CommandGroup heading="Организации">
              {data.orgs.map((o: any) => (
                <CommandItem
                  key={`o-${o.id}`}
                  value={`org-${o.id}-${o.name}`}
                  onSelect={() => go(`/organizations?id=${o.id}`)}
                >
                  <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="flex-1 truncate">{o.name}</span>
                  {o.inn && <span className="text-xs text-muted-foreground ml-2">ИНН {o.inn}</span>}
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