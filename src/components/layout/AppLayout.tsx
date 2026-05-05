import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import MobileNav from "./MobileNav";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";
import ZabbixConnectionPicker from "@/components/ZabbixConnectionPicker";

export default function AppLayout() {
  // Activates realtime browser notifications when permission is granted.
  useBrowserNotifications();
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <MobileNav />
        <div className="hidden lg:flex items-center justify-end gap-2 px-6 pt-4">
          <ZabbixConnectionPicker />
        </div>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
