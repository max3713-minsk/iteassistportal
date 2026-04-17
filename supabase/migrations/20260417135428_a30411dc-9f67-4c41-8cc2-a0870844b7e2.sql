-- Allow upsert of global item aliases (host_id IS NULL)
-- by adding a partial unique index on item_key when host_id is NULL.
CREATE UNIQUE INDEX IF NOT EXISTS item_aliases_item_key_global_uniq
ON public.item_aliases (item_key)
WHERE host_id IS NULL;