import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Building2, Server, CalendarCheck, Ticket, Users, LogOut, ClipboardList, FileArchive, ScrollText,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import BrandLogo from "@/components/BrandLogo";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Панель управления" },
  { to: "/sites", icon: Building2, label: "ЦОД" },
  { to: "/equipment", icon: Server, label: "Оборудование" },
  { to: "/schedules", icon: CalendarCheck, label: "Календарь ТО" },
  { to: "/protocols", icon: ClipboardList, label: "Протоколы" },
  { to: "/tickets", icon: Ticket, label: "Заявки" },
  { to: "/documents", icon: FileArchive, label: "Документация" },
  { to: "/users", icon: Users, label: "Пользователи" },
  { to: "/audit", icon: ScrollText, label: "Журнал событий" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { signOut } = useAuth();

  return (
    <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b bg-card">
      <div className="flex items-center gap-2">
        <BrandLogo className="h-7 w-auto" />
        <span className="font-heading font-semibold text-sm">ITE Assist Portal</span>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {open && (
        <div className="absolute top-14 left-0 right-0 z-50 bg-card border-b shadow-lg p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm",
                pathname === item.to ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 mt-2" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Выйти
          </Button>
        </div>
      )}
    </header>
  );
}
