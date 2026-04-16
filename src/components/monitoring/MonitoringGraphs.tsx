import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Cpu, Database, HardDrive, Network, Zap, Monitor } from "lucide-react";

interface Props {
  hosts: any[];
  graphs: any[];
  connectionError: boolean;
}

const presetGraphs = [
  { title: "Загрузка CPU серверов БД", desc: "Потребление ресурсов серверами PostgreSQL, Oracle", icon: Database, category: "db" },
  { title: "Использование памяти SCADA-серверами", desc: "RAM utilization серверов АСУ ТП", icon: Monitor, category: "scada" },
  { title: "Латентность СХД OceanStor", desc: "I/O latency, IOPS, throughput контроллеров Dorado", icon: HardDrive, category: "storage" },
  { title: "Состояние репликации PostgreSQL", desc: "Replication lag, WAL write/flush, streaming status", icon: Database, category: "db" },
  { title: "Количество активных сессий RDS", desc: "Active sessions, blocked queries, CPU per session", icon: Cpu, category: "rds" },
  { title: "Аппаратное здоровье серверов", desc: "Температура CPU, Fan Speed, PSU Status (iBMC)", icon: Zap, category: "hardware" },
  { title: "Сетевые устройства", desc: "Interface Status, Bandwidth, Packet Errors, OSPF/VRRP", icon: Network, category: "network" },
  { title: "Загрузка CPU/RAM серверов", desc: "CPU Utilization, Memory Available, Disk Free", icon: BarChart3, category: "general" },
];

export default function MonitoringGraphs({ hosts, graphs, connectionError }: Props) {
  const [selectedHost, setSelectedHost] = useState("all");
  const [timeRange, setTimeRange] = useState("1h");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const hostsArr = Array.isArray(hosts) ? hosts : [];

  const filteredGraphs = useMemo(() => {
    if (categoryFilter === "all") return presetGraphs;
    return presetGraphs.filter(g => g.category === categoryFilter);
  }, [categoryFilter]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <Select value={selectedHost} onValueChange={setSelectedHost}>
          <SelectTrigger className="w-[250px]"><SelectValue placeholder="Все хосты" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все хосты</SelectItem>
            {hostsArr.map((h: any) => (
              <SelectItem key={h.hostid} value={h.hostid}>{h.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Все категории" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            <SelectItem value="db">База данных</SelectItem>
            <SelectItem value="scada">SCADA</SelectItem>
            <SelectItem value="storage">СХД</SelectItem>
            <SelectItem value="hardware">Аппаратное</SelectItem>
            <SelectItem value="network">Сеть</SelectItem>
            <SelectItem value="general">Общие</SelectItem>
          </SelectContent>
        </Select>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Последний час</SelectItem>
            <SelectItem value="6h">6 часов</SelectItem>
            <SelectItem value="1d">1 день</SelectItem>
            <SelectItem value="1w">1 неделя</SelectItem>
            <SelectItem value="1m">1 месяц</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGraphs.map(({ title, desc, icon: Icon }) => (
          <Card key={title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">{desc}</p>
              <div className="bg-muted/30 rounded-lg h-44 flex items-center justify-center border border-dashed border-muted-foreground/20">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">
                    {connectionError
                      ? "Подключите Zabbix для отображения графиков"
                      : "График будет доступен при наличии данных"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            💡 Графики отображаются в реальном времени при подключении к Zabbix API.
            Для экспорта используйте кнопку «Экспорт в PNG» (доступно при наличии данных).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
