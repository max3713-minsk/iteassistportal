-- Restrict SELECT on monitored_hosts to staff (admins/engineers) so that
-- device credentials (snmp_community, credentials_login, credentials_password)
-- are not visible to customer-role authenticated users.
DROP POLICY IF EXISTS "Authenticated can view monitored hosts" ON public.monitored_hosts;

CREATE POLICY "Staff can view monitored hosts"
  ON public.monitored_hosts
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'engineer'::app_role)
  );