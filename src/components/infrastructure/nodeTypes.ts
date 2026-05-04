import { Server, HardDrive, Network, Router, ShieldCheck, Cloud, Database, Monitor, Wifi, Cpu, Box, Building2 } from "lucide-react";

export type NodeKind =
  | "server" | "storage" | "switch" | "router" | "firewall"
  | "cloud" | "database" | "workstation" | "ap" | "vm" | "generic" | "zone";

export const NODE_LIBRARY: { kind: NodeKind; label: string; icon: any; accent: string }[] = [
  { kind: "server",      label: "Сервер",        icon: Server,      accent: "210 80% 55%" },
  { kind: "storage",     label: "СХД",           icon: HardDrive,   accent: "260 70% 60%" },
  { kind: "switch",      label: "Коммутатор",    icon: Network,     accent: "180 65% 45%" },
  { kind: "router",      label: "Маршрутизатор", icon: Router,      accent: "30 90% 55%" },
  { kind: "firewall",    label: "Firewall",      icon: ShieldCheck, accent: "0 75% 55%" },
  { kind: "cloud",       label: "Облако / WAN",  icon: Cloud,       accent: "200 50% 60%" },
  { kind: "database",    label: "База данных",   icon: Database,    accent: "280 60% 55%" },
  { kind: "workstation", label: "АРМ",           icon: Monitor,     accent: "150 50% 50%" },
  { kind: "ap",          label: "Wi-Fi точка",   icon: Wifi,        accent: "220 70% 55%" },
  { kind: "vm",          label: "Виртуалка",     icon: Cpu,         accent: "320 60% 55%" },
  { kind: "generic",     label: "Узел",          icon: Box,         accent: "0 0% 50%" },
  { kind: "zone",        label: "Зона / ЦОД",    icon: Building2,   accent: "0 0% 60%" },
];

export const NODE_INFO: Record<NodeKind, { label: string; icon: any; accent: string }> =
  Object.fromEntries(NODE_LIBRARY.map((n) => [n.kind, n])) as any;
