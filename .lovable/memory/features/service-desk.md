---
name: Service Desk & Tickets
description: Ticket classification tree, request types, SLA, status workflow matrix, Zabbix integration
type: feature
---

## Classification Tree (product_code)
- SK11: ПК «СК-11» → SCADA, OMS, DMS, ЭЖ, БД (PostgreSQL)
- RS20: ИП «РС-20» → ModelEditor, OTopology, MMPGAdapter, DataPrep, RapidBus
- HARD: Оборудование ПТК АСДУ → Сервер (Huawei), СХД (OceanStor), Коммутатор, Маршрутизатор, МСЭ
- VIRT: Платформа виртуализации → ESXi, vCenter, Kubernetes Pod
- INTEG: Интеграционные подсистемы → СУПА, ZuluGIS, АСКУЭ, АГАТ-М
- OTHER: Общесистемное ПО / АРМ → Толстые клиенты, ОС, Браузеры

## Request Types
- incident → priority from incident_category (P1-P4)
- service_request → always P4, 3 hours
- development_request → always P4, by agreement
- consultation → always P4, 2 hours

## Incident Categories → SLA
- P1 (Критический отказ) → 30 min
- P2 (Частичный отказ) → 60 min
- P3 (Сбой сервиса) → 120 min
- P4 (Некритичная ошибка) → 180 min

## Status Workflow
open → assigned (admin assigns) → in_progress (engineer accepts) → resolved (engineer) → closed (customer confirms)
open/assigned → cancelled (admin or customer withdraws)
in_progress → waiting (engineer, needs info) → in_progress (engineer resumes)
resolved → in_progress (customer returns to work)
Any active → overdue (auto, SLA exceeded)
Auto-close: resolved > 5 business days → closed

## Zabbix Webhook Mapping
Severity 5 (Disaster) → P1, Severity 4 (High) → P2, Severity 3 (Average) → P3, else → P4
Host group → product_code mapping
request_type = 'incident' always

## DB Fields (tickets table)
product_code, subcategory, request_type, incident_category
ticket_status_history table for audit trail
