-- Phase A: cleanup orphaned monitored_hosts when a zabbix_connections row is deleted.
-- Soft-archive: detach zabbix link, mark host_group='archived', disable.
-- Hosts not linked to any equipment_id can be hard-deleted.

CREATE OR REPLACE FUNCTION public.archive_monitored_hosts_on_conn_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.monitored_hosts
     SET enabled = false,
         zabbix_host_id = NULL,
         host_group = 'archived',
         notes = COALESCE(notes, '') ||
                 E'\n[' || to_char(now(), 'YYYY-MM-DD HH24:MI') || '] Подключение Zabbix удалено: ' ||
                 COALESCE(OLD.name, OLD.id::text),
         updated_at = now()
   WHERE zabbix_connection_id = OLD.id;

  -- Also drop monitoring_host_links since the source is gone
  DELETE FROM public.monitoring_host_links
   WHERE zabbix_host_id IN (
     SELECT zabbix_host_id FROM public.monitored_hosts
      WHERE zabbix_connection_id = OLD.id AND zabbix_host_id IS NOT NULL
   );

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_archive_hosts_on_conn_delete ON public.zabbix_connections;
CREATE TRIGGER trg_archive_hosts_on_conn_delete
BEFORE DELETE ON public.zabbix_connections
FOR EACH ROW
EXECUTE FUNCTION public.archive_monitored_hosts_on_conn_delete();