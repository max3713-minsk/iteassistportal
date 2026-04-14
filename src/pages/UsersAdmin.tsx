import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Users, Shield, Search, UserCog, Plus, Trash2, Building2, Phone } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { CreateUserDialog } from "@/components/users/CreateUserDialog";
import { logAudit } from "@/lib/audit";

type AppRole = "admin" | "engineer" | "customer";

const roleLabels: Record<AppRole, string> = {
  admin: "Администратор",
  engineer: "Инженер",
  customer: "Заказчик",
};

const MODULES = [
  { key: "dashboard", label: "Панель управления" },
  { key: "sites", label: "ЦОД" },
  { key: "equipment", label: "Оборудование" },
  { key: "schedules", label: "Календарь ТО" },
  { key: "protocols", label: "Протоколы" },
  { key: "tickets", label: "Заявки" },
  { key: "documents", label: "Документация" },
  { key: "help", label: "Справка" },
];
const roleBadgeVariant: Record<AppRole, "default" | "secondary" | "outline"> = {
  admin: "default",
  engineer: "secondary",
  customer: "outline",
};

interface UserProfile {
  user_id: string;
  full_name: string | null;
  organization: string | null;
  phone: string | null;
  created_at: string;
  roles: AppRole[];
}

export default function UsersAdmin() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editOrganization, setEditOrganization] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [newRole, setNewRole] = useState<AppRole | "">("");
  const [editModules, setEditModules] = useState<string[]>([]);

  const isAdmin = hasRole("admin");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, organization, phone, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;

      const { data: allRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rolesError) throw rolesError;

      const roleMap = new Map<string, AppRole[]>();
      for (const r of allRoles || []) {
        if (!roleMap.has(r.user_id)) roleMap.set(r.user_id, []);
        roleMap.get(r.user_id)!.push(r.role as AppRole);
      }

      return (profiles || []).map((p) => ({
        ...p,
        roles: roleMap.get(p.user_id) || [],
      })) as UserProfile[];
    },
  });

  const updateProfile = useMutation({
    mutationFn: async () => {
      if (!editUser) return;
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editFullName || null,
          organization: editOrganization || null,
          phone: editPhone || null,
        })
        .eq("user_id", editUser.user_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Профиль обновлён" });
    },
  });

  const addRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setNewRole("");
      toast({ title: "Роль добавлена" });
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const removeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Роль удалена" });
    },
  });

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.organization || "").toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.roles.includes(roleFilter as AppRole);
    return matchSearch && matchRole;
  });

  const openEdit = (user: UserProfile) => {
    setEditUser(user);
    setEditFullName(user.full_name || "");
    setEditOrganization(user.organization || "");
    setEditPhone(user.phone || "");
    setNewRole("");
  };

  if (!isAdmin) {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold mb-6">Пользователи</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Доступ только для администраторов</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Пользователи</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Создать пользователя
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или организации..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Все роли" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все роли</SelectItem>
            <SelectItem value="admin">Администраторы</SelectItem>
            <SelectItem value="engineer">Инженеры</SelectItem>
            <SelectItem value="customer">Заказчики</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-xs text-muted-foreground">Всего</p>
            </div>
          </CardContent>
        </Card>
        {(["admin", "engineer", "customer"] as AppRole[]).map((role) => (
          <Card key={role}>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.roles.includes(role)).length}
                </p>
                <p className="text-xs text-muted-foreground">{roleLabels[role]}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <CardContent className="py-12 text-center text-muted-foreground">Загрузка...</CardContent>
        ) : filtered.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Пользователи не найдены</p>
          </CardContent>
        ) : (
          <ScrollArea className="max-h-[calc(100vh-400px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Организация</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Роли</TableHead>
                  <TableHead className="hidden md:table-cell">Регистрация</TableHead>
                  <TableHead className="w-20">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.organization || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.phone || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {u.roles.length === 0 && (
                          <Badge variant="outline" className="text-muted-foreground">Нет роли</Badge>
                        )}
                        {u.roles.map((r) => (
                          <Badge key={r} variant={roleBadgeVariant[r]}>{roleLabels[r]}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {format(new Date(u.created_at), "dd.MM.yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)} title="Редактировать">
                        <UserCog className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редактирование пользователя</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ФИО</Label>
                <Input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Организация</Label>
                <Input value={editOrganization} onChange={(e) => setEditOrganization(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Телефон</Label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </div>

              {/* Roles */}
              <div className="space-y-2">
                <Label>Роли</Label>
                <div className="flex gap-2 flex-wrap">
                  {editUser.roles.map((r) => (
                    <Badge key={r} variant={roleBadgeVariant[r]} className="gap-1 pr-1">
                      {roleLabels[r]}
                      <button
                        onClick={() => removeRole.mutate({ userId: editUser.user_id, role: r })}
                        className="ml-1 hover:text-destructive transition-colors"
                        title="Удалить роль"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {editUser.roles.length === 0 && (
                    <span className="text-sm text-muted-foreground">Нет назначенных ролей</span>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Добавить роль..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(["admin", "engineer", "customer"] as AppRole[]).filter(
                        (r) => !editUser.roles.includes(r)
                      ).map((r) => (
                        <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant="outline"
                    disabled={!newRole || addRole.isPending}
                    onClick={() => newRole && addRole.mutate({ userId: editUser.user_id, role: newRole as AppRole })}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Отмена</Button>
            <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CreateUserDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
}
