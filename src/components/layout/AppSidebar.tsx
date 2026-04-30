import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Building2, Server, CalendarCheck, Ticket, Users, LogOut, ClipboardList, FileArchive, ScrollText, HelpCircle, Activity, Bell, Briefcase, Plug, CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import BrandLogo from "@/components/BrandLogo";
import { GlobalSearch } from "@/components/GlobalSearch";
import KillSwitch, { useLogoKillTrigger } from "@/components/KillSwitch";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Панель управления", roles: [], moduleKey: "dashboard" },
  { to: "/sites", icon: Building2, label: "ЦОД", roles: [], moduleKey: "sites" },
  { to: "/equipment", icon: Server, label: "Оборудование", roles: [], moduleKey: "equipment" },
  { to: "/schedules", icon: CalendarCheck, label: "Календарь ТО", roles: [], moduleKey: "schedules" },
  { to: "/holidays", icon: CalendarDays, label: "Праздники (РБ)", roles: ["admin"], moduleKey: "holidays" },
  { to: "/protocols", icon: ClipboardList, label: "Протоколы", roles: [], moduleKey: "protocols" },
  { to: "/tickets", icon: Ticket, label: "Заявки", roles: [], moduleKey: "tickets" },
  { to: "/documents", icon: FileArchive, label: "Документация", roles: [], moduleKey: "documents" },
  { to: "/monitoring", icon: Activity, label: "Мониторинг", roles: [], moduleKey: "monitoring" },
  { to: "/organizations", icon: Briefcase, label: "Организации и Договоры", roles: ["admin"], moduleKey: "organizations" },
  { to: "/zabbix-connections", icon: Plug, label: "Подключения Zabbix", roles: ["admin"], moduleKey: "zabbix" },
  { to: "/integrations", icon: Plug, label: "Интеграции (GitLab/Seafile)", roles: ["admin"], moduleKey: "integrations" },
  { to: "/users", icon: Users, label: "Пользователи", roles: ["admin"], moduleKey: "users" },
  { to: "/audit", icon: ScrollText, label: "Журнал событий", roles: ["admin"], moduleKey: "audit" },
  { to: "/notifications", icon: Bell, label: "Уведомления", roles: [], moduleKey: "notifications" },
  { to: "/help", icon: HelpCircle, label: "Справка", roles: [], moduleKey: "help" },
];

export default function AppSidebar() {
  const { pathname } = useLocation();
  const { profile, signOut, hasRole, hasModuleAccess, roles } = useAuth();
  const kill = useLogoKillTrigger();

  const visibleItems = navItems.filter((item) => {
    // Role-based filter (admin-only items)
    if (item.roles.length > 0 && !item.roles.some((r) => hasRole(r as any))) return false;
    // Module permission filter
    if (!hasModuleAccess(item.moduleKey)) return false;
    return true;
  });

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

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-sidebar-primary/15 text-sidebar-primary font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="px-3 py-2 mb-2 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground/90 truncate">{profile?.full_name ?? "—"}</p>
            <p className="text-xs text-sidebar-foreground/50 capitalize">{roles[0] ?? "user"}</p>
          </div>
          <ThemeToggle className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50" />
        </div>
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
    </aside>
  );
}
