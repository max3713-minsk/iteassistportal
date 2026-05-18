import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Server, CalendarCheck, Ticket, Users, LogOut, UserCircle,
  ClipboardList, FileArchive, ScrollText, HelpCircle, Activity, Bell, Briefcase,
  Plug, ChevronDown, ChevronRight, Network, ShieldAlert, DoorOpen, ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/ThemeToggle";
import BrandLogo from "@/components/BrandLogo";
import { GlobalSearch } from "@/components/GlobalSearch";
import KillSwitch, { useLogoKillTrigger } from "@/components/KillSwitch";
import { ShiftHandoverDialog } from "@/components/ShiftHandoverDialog";
import { AvatarHash } from "@/components/ui/avatar-hash";

type NavItem = {
  to: string;
  icon: any;
  label: string;
  roles: string[];
  moduleKey: string;
  badgeKey?: "tickets" | "notifications";
};

const sections: { id: string; title: string; adminOnly?: boolean; items: NavItem[] }[] = [
  {
    id: "workspace",
    title: "Рабочее место",
    items: [
      { to: "/", icon: LayoutDashboard, label: "Панель управления", roles: [], moduleKey: "dashboard" },
      { to: "/tickets", icon: Ticket, label: "Заявки", roles: [], moduleKey: "tickets", badgeKey: "tickets" },
      { to: "/notifications", icon: Bell, label: "Уведомления", roles: [], moduleKey: "notifications", badgeKey: "notifications" },
    ],
  },
  {
    id: "objects",
    title: "Объекты",
    items: [
      { to: "/equipment", icon: Server, label: "Оборудование", roles: [], moduleKey: "equipment" },
    ],
  },
  {
    id: "service",
    title: "Обслуживание",
    items: [
      { to: "/work-scope", icon: ListChecks, label: "Регламент работ", roles: [], moduleKey: "protocols" },
      { to: "/protocols", icon: ClipboardList, label: "Протоколы", roles: [], moduleKey: "protocols" },
      { to: "/schedules", icon: CalendarCheck, label: "Календарь ТО", roles: [], moduleKey: "schedules" },
      { to: "/documents", icon: FileArchive, label: "Документация", roles: [], moduleKey: "documents" },
    ],
  },
  {
    id: "monitoring",
    title: "Мониторинг",
    items: [
      { to: "/monitoring", icon: Activity, label: "Мониторинг", roles: [], moduleKey: "monitoring" },
      { to: "/infrastructure-maps", icon: Network, label: "Карта инфраструктуры", roles: [], moduleKey: "monitoring" },
    ],
  },
  {
    id: "help",
    title: "Справка",
    items: [
      { to: "/help", icon: HelpCircle, label: "Справка", roles: [], moduleKey: "help" },
    ],
  },
  {
    id: "admin",
    title: "Администрирование",
    adminOnly: true,
    items: [
      { to: "/organizations", icon: Briefcase, label: "Организации и Договоры", roles: ["admin"], moduleKey: "organizations" },
      { to: "/connections", icon: Plug, label: "Подключения", roles: ["admin"], moduleKey: "integrations" },
      { to: "/users", icon: Users, label: "Пользователи", roles: ["admin"], moduleKey: "users" },
      { to: "/audit", icon: ScrollText, label: "Журнал событий", roles: ["admin"], moduleKey: "audit" },
      { to: "/system-reset", icon: ShieldAlert, label: "Сервисные операции", roles: ["admin"], moduleKey: "audit" },
    ],
  },
];

const ADMIN_OPEN_KEY = "sidebar.adminSection.open";

export default function AppSidebar() {
  const { pathname } = useLocation();
  const { user, profile, signOut, hasRole, hasModuleAccess, roles } = useAuth();
  const kill = useLogoKillTrigger();

  const [adminOpen, setAdminOpen] = useState<boolean>(() => {
    const v = typeof window !== "undefined" ? localStorage.getItem(ADMIN_OPEN_KEY) : null;
    return v === "1";
  });
  const [handoverOpen, setHandoverOpen] = useState(false);
  useEffect(() => {
    localStorage.setItem(ADMIN_OPEN_KEY, adminOpen ? "1" : "0");
  }, [adminOpen]);

  // Unread notifications count
  const { data: unreadNotifs = 0 } = useQuery({
    queryKey: ["sidebar-unread-notifications", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("notification_log")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });

  // Active tickets assigned to current staff (or created by customer)
  const { data: ticketsBadge = 0 } = useQuery({
    queryKey: ["sidebar-tickets-badge", user?.id, roles],
    queryFn: async () => {
      if (!user) return 0;
      const isStaff = hasRole("admin") || hasRole("engineer");
      let q = supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "overdue"]);
      if (isStaff) q = q.eq("assigned_to", user.id);
      else q = q.eq("created_by", user.id);
      const { count } = await q;
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });

  // Zabbix indicator
  const { data: zabbixActive } = useQuery({
    queryKey: ["sidebar-zabbix-status"],
    queryFn: async () => {
      const { data } = await supabase
        .from("zabbix_connections")
        .select("id")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      return !!data;
    },
    refetchInterval: 60_000,
  });

  const visibleSection = (section: typeof sections[number]) => {
    if (section.adminOnly && !hasRole("admin")) return null;
    const visible = section.items.filter((item) => {
      if (item.roles.length > 0 && !item.roles.some((r) => hasRole(r as any))) return false;
      if (!hasModuleAccess(item.moduleKey)) return false;
      return true;
    });
    if (visible.length === 0) return null;
    return { ...section, items: visible };
  };

  const renderItem = (item: NavItem) => {
    const isActive = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
    const badgeValue =
      item.badgeKey === "notifications" ? unreadNotifs :
      item.badgeKey === "tickets" ? ticketsBadge : 0;
    return (
      <Link
        key={item.to}
        to={item.to}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
          isActive
            ? "bg-sidebar-primary/15 text-sidebar-primary font-medium"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        {badgeValue > 0 && (
          <Badge className="h-5 px-1.5 text-[10px] bg-destructive text-destructive-foreground hover:bg-destructive">
            {badgeValue > 99 ? "99+" : badgeValue}
          </Badge>
        )}
      </Link>
    );
  };

  const sectionLabelClass = "text-[10px] uppercase tracking-widest text-sidebar-foreground/30 px-3 mt-4 mb-1 font-medium";

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border min-h-screen">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-sidebar-border">
        <button
          type="button"
          aria-label="Logo"
          onClick={kill.onLogoClick}
          className="focus:outline-none cursor-pointer"
          tabIndex={-1}
        >
          <BrandLogo className="h-9 w-auto" />
        </button>
        <div className="min-w-0">
          <h1 className="font-heading text-sm font-semibold text-sidebar-primary-foreground leading-tight">ITE Assist Portal</h1>
          <p className="text-[11px] text-sidebar-foreground/50 truncate">Innotech Engineering</p>
        </div>
      </div>

      <div className="px-3 pt-3">
        <GlobalSearch />
      </div>

      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {sections.map((rawSection) => {
          const section = visibleSection(rawSection);
          if (!section) return null;

          if (section.adminOnly) {
            return (
              <div key={section.id}>
                <button
                  type="button"
                  onClick={() => setAdminOpen((v) => !v)}
                  className={cn(sectionLabelClass, "flex items-center gap-1 w-full hover:text-sidebar-foreground/60 transition-colors")}
                >
                  {adminOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  {section.title}
                </button>
                {adminOpen && (
                  <div className="space-y-1 mt-1">
                    {section.items.map(renderItem)}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={section.id}>
              <div className={sectionLabelClass}>{section.title}</div>
              <div className="space-y-1">
                {section.items.map(renderItem)}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Zabbix indicator */}
      <div className="px-3">
        <div className="text-[11px] flex items-center gap-1.5 px-3 py-1.5 text-sidebar-foreground/40">
          <span className={cn(
            "h-1.5 w-1.5 rounded-full",
            zabbixActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40",
          )} />
          Zabbix: {zabbixActive ? "онлайн" : "не настроен"}
        </div>
      </div>

      <div className="px-3 py-3 border-t border-sidebar-border">
        {(hasRole("admin") || hasRole("engineer")) && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 mb-2"
            onClick={() => setHandoverOpen(true)}
          >
            <DoorOpen className="h-4 w-4" />Сдать смену
          </Button>
        )}
        <div className="px-3 py-2 mb-2 flex items-center justify-between gap-2">
          <NavLink to="/profile" className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity" title="Мой профиль">
            <AvatarHash name={profile?.full_name ?? user?.email} email={user?.email} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground/90 truncate">{profile?.full_name ?? user?.email ?? "—"}</p>
              <p className="text-xs text-sidebar-foreground/50 capitalize">{roles[0] ?? "user"}</p>
            </div>
          </NavLink>
          <ThemeToggle className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50" />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 mb-1"
          asChild
        >
          <NavLink to="/profile">
            <UserCircle className="h-4 w-4" />
            Мой профиль
          </NavLink>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </Button>
      </div>
      <KillSwitch open={kill.open} onOpenChange={kill.setOpen} />
      <ShiftHandoverDialog open={handoverOpen} onOpenChange={setHandoverOpen} />
    </aside>
  );
}
