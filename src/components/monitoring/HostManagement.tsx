import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Pencil, Trash2, Loader2, Server, Monitor, HardDrive, Network, Shield, Zap, Router, Link2 } from "lucide-react";
import { HostFormDialog } from "./HostFormDialog";
import { HostWizardDialog } from "./HostWizardDialog";
import CMDBSyncDialog from "./CMDBSyncDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type MonitoredHost = {
  id: string;
  name: string;
  ip_address: string;
  device_type: string;
  protocol: string;
  port: number | null;
  snmp_community: string | null;
  credentials_login: string | null;
  credentials_password: string | null;
  site_id: string | null;
  enabled: boolean;
  zabbix_host_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const deviceTypeConfig: Record<string, { label: string; icon: typeof Server; color: string }> = {
  server: { label: "Сервер", icon: Server, color: "text-blue-500" },
  bmc: { label: "BMC / IPMI", icon: Monitor, color: "text-orange-500" },
  switch: { label: "Коммутатор", icon: Network, color: "text-green-500" },
  storage: { label: "СХД", icon: HardDrive, color: "text-purple-500" },
  firewall: { label: "Межсетевой экран", icon: Shield, color: "text-red-500" },
  ups: { label: "ИБП", icon: Zap, color: "text-yellow-500" },
  router: { label: "Маршрутизатор", icon: Router, color: "text-cyan-500" },
  other: { label: "Другое", icon: Server, color: "text-muted-foreground" },
};

export function getDeviceTypeConfig(type: string) {
  return deviceTypeConfig[type] || deviceTypeConfig.other;
}

export default function HostManagement() {
  const { toast } = useToast();
  const { isStaff } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [cmdbSyncOpen, setCmdbSyncOpen] = useState(false);
  const [editingHost, setEditingHost] = useState<MonitoredHost | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: hosts, isLoading } = useQuery({
    queryKey: ["monitored-hosts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monitored_hosts")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as MonitoredHost[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("monitored_hosts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitored-hosts"] });
      toast({ title: "Хост удалён" });
      setDeleteId(null);
    },
    onError: (err: Error) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const handleEdit = (host: MonitoredHost) => {
    setEditingHost(host);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingHost(null);
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Server className="h-4 w-4" />
          Настройка хостов мониторинга
        </CardTitle>
        {isStaff && (
          <div className="flex gap-2">
            <Button size="sm" variant="default" onClick={() => setCmdbSyncOpen(true)}>
              <Link2 className="h-4 w-4 mr-1.5" />
              Синхронизировать с CMDB
            </Button>
            <Button size="sm" variant="outline" onClick={() => setWizardOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Мастер добавления
            </Button>
            <Button size="sm" variant="ghost" onClick={handleAdd}>
              <Pencil className="h-4 w-4 mr-1.5" />
              Быстрое добавление
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !hosts || hosts.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">
            Нет настроенных хостов. Добавьте первый хост для мониторинга.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Имя</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Протокол</TableHead>
                <TableHead>Статус</TableHead>
                {isStaff && <TableHead className="text-right">Действия</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {hosts.map((host) => {
                const cfg = getDeviceTypeConfig(host.device_type);
                const Icon = cfg.icon;
                return (
                  <TableRow key={host.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                      {host.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {host.ip_address}{host.port ? `:${host.port}` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{cfg.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{host.protocol}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={host.enabled ? "default" : "outline"}>
                        {host.enabled ? "Активен" : "Отключён"}
                      </Badge>
                    </TableCell>
                    {isStaff && (
                      <TableCell className="text-right space-x-1">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(host)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(host.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <HostFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        host={editingHost}
      />

      <HostWizardDialog
        open={wizardOpen}
        onOpenChange={setWizardOpen}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить хост?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Хост будет удалён из системы мониторинга.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
