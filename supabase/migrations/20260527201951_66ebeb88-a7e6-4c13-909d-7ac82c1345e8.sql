
REVOKE EXECUTE ON FUNCTION public.force_delete_organization(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.preview_organization_cascade(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.force_delete_organization(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.preview_organization_cascade(uuid) TO authenticated;
