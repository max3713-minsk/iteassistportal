# Project Memory

## Core
- Terminology: Always use "ЦОД" (never Площадки), "Панель управления" (never Дашборд), "Протоколы" (never Отчёты).
- Tech: Supabase with RLS (Admin, Engineer, Customer). User creation via Edge Functions.
- Styling: Space Grotesk (headers), DM Sans (body). Dark theme bg `0 0% 9%`.
- Status Colors: Red (Open/Overdue), Blue (Progress), Yellow (Waiting), Green (Done), Gray (Closed - highlight row).
- Permissions: Only Customer can permanently close tickets. Admin required for User Management & Audit Log.
- Dashboard charts must use high-contrast colors, independent of the brand palette.
- CSV exports must use UTF-8 BOM for proper Excel Cyrillic support.
- Ticket statuses: open, assigned, in_progress, waiting, overdue, resolved, closed, cancelled. Strict role-based transitions.

## Memories
- [Backend & Supabase Config](mem://tech/backend-infrastructure) — RLS roles, edge functions for user creation, admin assignment
- [Brand Style & UI Themes](mem://style/branding) — Corporate colors, typography, theme-specific rules, status colors
- [Corporate Terminology](mem://domain/terminology) — Forbidden terms and their mandatory replacements
- [Service Desk & Tickets](mem://features/service-desk) — Classification tree, request types, SLA, status workflow, Zabbix mapping
- [Maintenance Protocols](mem://features/maintenance-protocols) — Protocol tabs, "On request" logic, export formats, sync
- [Maintenance Calendar](mem://features/maintenance-calendar) — Interactive calendar for scheduled tasks, stats, and color coding
- [Control Panel](mem://features/control-panel) — Widget specs, charts, SLA stats, contrasting colors
- [Equipment Lifecycle](mem://features/equipment-management) — Filters, statuses, color codes, tooltips
- [User Management](mem://features/user-management) — Granular module access, default permissions, admin-only sections
- [Documentation Module](mem://features/documentation) — File storage preview rules for PDF, DOC, Images
- [Audit Log](mem://features/audit-logging) — Log schema, filtering, CSV export with Cyrillic support
- [Help Reference](mem://features/help-reference) — ToS, SLA times, Scope of work base
- [Automated Protocols](mem://features/automated-protocols) — Maintenance schedule logic and protocol generation
- [System Integrations](mem://architecture/integration) — Zabbix, Ansible, BelVPN Gate
- [Env vars (Cloud vs Self-hosted)](mem://deployment/env-vars) — Какие переменные нужны только в docker-стенде и не должны попадать в облачный .env
