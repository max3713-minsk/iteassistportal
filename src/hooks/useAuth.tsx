import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "engineer" | "customer";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  profile: { full_name: string | null; organization: string | null } | null;
  modulePermissions: string[];
  loading: boolean;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  hasModuleAccess: (moduleKey: string) => boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  roles: [],
  profile: null,
  modulePermissions: [],
  loading: true,
  signOut: async () => {},
  hasRole: () => false,
  hasModuleAccess: () => false,
  isStaff: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<{ full_name: string | null; organization: string | null } | null>(null);
  const [modulePermissions, setModulePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          fetchRolesAndProfile(session.user.id);
        }, 0);
      } else {
        setRoles([]);
        setProfile(null);
        setModulePermissions([]);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRolesAndProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchRolesAndProfile(userId: string) {
    const [rolesRes, profileRes, permRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("full_name, organization").eq("user_id", userId).single(),
      supabase.from("user_module_permissions").select("module_key").eq("user_id", userId),
    ]);
    setRoles((rolesRes.data ?? []).map((r) => r.role as AppRole));
    setProfile(profileRes.data ?? null);
    setModulePermissions((permRes.data ?? []).map((p) => p.module_key));
    setLoading(false);
  }

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasRole = (role: AppRole) => roles.includes(role);
  const isStaff = hasRole("admin") || hasRole("engineer");

  // Admins always have access to everything
  // If user has no permissions set at all, they see everything (backward compat)
  const hasModuleAccess = (moduleKey: string) => {
    if (hasRole("admin")) return true;
    if (modulePermissions.length === 0) return true; // no restrictions set
    return modulePermissions.includes(moduleKey);
  };

  return (
    <AuthContext.Provider value={{ session, user, roles, profile, modulePermissions, loading, signOut, hasRole, hasModuleAccess, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
