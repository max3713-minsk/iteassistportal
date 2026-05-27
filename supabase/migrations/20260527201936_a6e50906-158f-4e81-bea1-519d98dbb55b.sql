
-- Track which migration files have been applied
CREATE TABLE public.applied_migrations (
  filename text PRIMARY KEY,
  checksum text,
  applied_at timestamp with time zone NOT NULL DEFAULT now(),
  applied_by uuid,
  duration_ms integer,
  note text
);

GRANT SELECT ON public.applied_migrations TO authenticated;
GRANT ALL ON public.applied_migrations TO service_role;

ALTER TABLE public.applied_migrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view applied migrations"
ON public.applied_migrations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage applied migrations"
ON public.applied_migrations FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Cascade-delete an organization and ALL its related data (admin only)
CREATE OR REPLACE FUNCTION public.force_delete_organization(_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_contracts int := 0;
  c_sites int := 0;
  c_equipment int := 0;
  c_hosts int := 0;
  c_docs int := 0;
  c_schedules int := 0;
  c_protocols int := 0;
  c_schemes int := 0;
  c_maps int := 0;
  org_name text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Доступ запрещён: требуется роль admin';
  END IF;

  SELECT name INTO org_name FROM public.organizations WHERE id = _org_id;
  IF org_name IS NULL THEN
    RAISE EXCEPTION 'Организация не найдена';
  END IF;

  -- Delete dependent records in safe order
  DELETE FROM public.protocol_items pi
    USING public.maintenance_protocols mp, public.sites s
    WHERE pi.protocol_id = mp.id AND mp.site_id = s.id AND s.organization_id = _org_id;

  DELETE FROM public.maintenance_protocols mp
    USING public.sites s
    WHERE mp.site_id = s.id AND s.organization_id = _org_id
    RETURNING 1 INTO c_protocols;

  DELETE FROM public.maintenance_schedules ms
    USING public.equipment e
    WHERE ms.equipment_id = e.id AND e.organization_id = _org_id
    RETURNING 1 INTO c_schedules;

  DELETE FROM public.equipment WHERE organization_id = _org_id;
  GET DIAGNOSTICS c_equipment = ROW_COUNT;

  DELETE FROM public.monitored_hosts WHERE organization_id = _org_id;
  GET DIAGNOSTICS c_hosts = ROW_COUNT;

  DELETE FROM public.documents WHERE organization_id = _org_id;
  GET DIAGNOSTICS c_docs = ROW_COUNT;

  DELETE FROM public.contracts WHERE organization_id = _org_id;
  GET DIAGNOSTICS c_contracts = ROW_COUNT;

  DELETE FROM public.support_scheme_lines sl
    USING public.support_schemes ss
    WHERE sl.scheme_id = ss.id AND ss.organization_id = _org_id;

  DELETE FROM public.support_schemes WHERE organization_id = _org_id;
  GET DIAGNOSTICS c_schemes = ROW_COUNT;

  DELETE FROM public.infrastructure_maps WHERE organization_id = _org_id;
  GET DIAGNOSTICS c_maps = ROW_COUNT;

  DELETE FROM public.sites WHERE organization_id = _org_id;
  GET DIAGNOSTICS c_sites = ROW_COUNT;

  DELETE FROM public.organizations WHERE id = _org_id;

  RETURN jsonb_build_object(
    'organization', org_name,
    'contracts', c_contracts,
    'sites', c_sites,
    'equipment', c_equipment,
    'monitored_hosts', c_hosts,
    'documents', c_docs,
    'schedules', c_schedules,
    'protocols', c_protocols,
    'support_schemes', c_schemes,
    'infra_maps', c_maps
  );
END;
$$;

-- Preview counts of related records before forced delete
CREATE OR REPLACE FUNCTION public.preview_organization_cascade(_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Доступ запрещён: требуется роль admin';
  END IF;

  SELECT jsonb_build_object(
    'contracts',   (SELECT count(*) FROM public.contracts WHERE organization_id = _org_id),
    'sites',       (SELECT count(*) FROM public.sites WHERE organization_id = _org_id),
    'equipment',   (SELECT count(*) FROM public.equipment WHERE organization_id = _org_id),
    'monitored_hosts', (SELECT count(*) FROM public.monitored_hosts WHERE organization_id = _org_id),
    'documents',   (SELECT count(*) FROM public.documents WHERE organization_id = _org_id),
    'support_schemes', (SELECT count(*) FROM public.support_schemes WHERE organization_id = _org_id),
    'infra_maps',  (SELECT count(*) FROM public.infrastructure_maps WHERE organization_id = _org_id),
    'protocols',   (SELECT count(*) FROM public.maintenance_protocols mp JOIN public.sites s ON s.id = mp.site_id WHERE s.organization_id = _org_id),
    'schedules',   (SELECT count(*) FROM public.maintenance_schedules ms JOIN public.equipment e ON e.id = ms.equipment_id WHERE e.organization_id = _org_id)
  ) INTO result;

  RETURN result;
END;
$$;
