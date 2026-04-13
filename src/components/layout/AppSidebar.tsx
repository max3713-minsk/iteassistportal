import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Building2,
  Server,
  CalendarCheck,
  Ticket,
  Users,
  LogOut,
  Shield,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Дашборд", roles: [] },
  { to: "/sites", icon: Building2, label: "Площадки", roles: [] },
  { to: "/equipment", icon: Server, label: "Оборудование", roles: [] },
  { to: "/schedules", icon: CalendarCheck, label: "Календарь ТО", roles: [] },
  { to: "/protocols", icon: ClipboardList, label: "Протоколы", roles: [] },
  { to: "/tickets", icon: Ticket, label: "Заявки", roles: [] },
  { to: "/users", icon: Users, label: "Пользователи", roles: ["admin"] },
];

export default function AppSidebar() {
  const { pathname } = useLocation();
  const { profile, signOut, hasRole, roles } = useAuth();

  const visibleItems = navItems.filter(
    (item) => item.roles.length === 0 || item.roles.some((r) => hasRole(r as any))
  );

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border min-h-screen">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <Shield className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="font-heading text-base font-semibold text-sidebar-primary-foreground">InfraSupport</h1>
          <p className="text-xs text-sidebar-foreground/60">Техподдержка</p>
        </div>
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
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-medium text-sidebar-foreground/90 truncate">{profile?.full_name ?? "—"}</p>
          <p className="text-xs text-sidebar-foreground/50 capitalize">{roles[0] ?? "user"}</p>
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
    </aside>
  );
}
