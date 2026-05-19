
CREATE OR REPLACE FUNCTION public.get_tables_list()
RETURNS TABLE(table_name text, columns_count bigint, total_size text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Доступ запрещён: требуется роль admin';
  END IF;

  RETURN QUERY
  SELECT
    t.tablename::text AS table_name,
    (SELECT count(*) FROM information_schema.columns c
       WHERE c.table_schema = 'public' AND c.table_name = t.tablename)::bigint AS columns_count,
    pg_size_pretty(pg_total_relation_size(format('public.%I', t.tablename)::regclass))::text AS total_size
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  ORDER BY t.tablename;
END;
$$;

REVOKE ALL ON FUNCTION public.get_tables_list() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tables_list() TO authenticated;
