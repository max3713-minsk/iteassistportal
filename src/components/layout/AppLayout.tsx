import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import MobileNav from "./MobileNav";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";

export default function AppLayout() {
  // Activates realtime browser notifications when permission is granted.
  useBrowserNotifications();
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <MobileNav />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
