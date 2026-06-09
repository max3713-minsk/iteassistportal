ALTER TABLE public.maintenance_tasks
  ADD COLUMN IF NOT EXISTS metric_bindings jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.maintenance_tasks.metric_bindings IS
'Массив привязок Zabbix-метрик к пункту регламента. Элемент: {hostid,host_name,itemid,item_key,item_name,units,time_range,aggregation,chart_type}';