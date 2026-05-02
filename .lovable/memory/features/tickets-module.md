---
name: Tickets Module
description: Ticket views, filters, kanban DnD permissions
type: feature
---

## Views
- List view (table with pagination 50/page) and Kanban view (DnD, 200 tickets max).
- Toggle via `ToggleGroup` in header.

## Kanban
- Columns: open, assigned, in_progress, waiting, overdue, resolved, closed.
- HTML5 drag-and-drop (no extra deps).
- Drop validates against `STATUS_TRANSITIONS` matrix + user roles + ownership.
- Invalid drop → toast "Переход недоступен".
- Successful drop: updates status, writes `ticket_status_history`, audit log.

## Extended Filters (List + Kanban)
- Search by title (ilike), Status, Priority, Product, Request type, Organization.
- "Сбросить фильтры" button when any filter active.
- Server-side filtering via Supabase query.
