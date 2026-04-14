import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Sites from "@/pages/Sites";
import Equipment from "@/pages/Equipment";
import Tickets from "@/pages/Tickets";
import Schedules from "@/pages/Schedules";
import Protocols from "@/pages/Protocols";
import Documents from "@/pages/Documents";
import UsersAdmin from "@/pages/UsersAdmin";
import AuditLog from "@/pages/AuditLog";
import HelpReference from "@/pages/HelpReference";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  if (!session) return <Navigate to="/auth" replace />;
  return <AppLayout />;
}

function AuthRoute() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route element={<ProtectedRoutes />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/sites" element={<Sites />} />
              <Route path="/equipment" element={<Equipment />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/schedules" element={<Schedules />} />
              <Route path="/protocols" element={<Protocols />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/users" element={<UsersAdmin />} />
              <Route path="/audit" element={<AuditLog />} />
              <Route path="/help" element={<HelpReference />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
