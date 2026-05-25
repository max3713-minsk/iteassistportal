--
-- PostgreSQL database dump
--

-- Dumped from database version 15.1 (Ubuntu 15.1-1.pgdg20.04+1)
-- Dumped by pg_dump version 15.6 (Ubuntu 15.6-1.pgdg20.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- Name: pgsodium; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA pgsodium;


ALTER SCHEMA pgsodium OWNER TO supabase_admin;

--
-- Name: pgsodium; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgsodium WITH SCHEMA pgsodium;


--
-- Name: EXTENSION pgsodium; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgsodium IS 'Pgsodium is a modern cryptography library for Postgres.';


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: pgjwt; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgjwt WITH SCHEMA extensions;


--
-- Name: EXTENSION pgjwt; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgjwt IS 'JSON Web Token API for Postgresql';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: app_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'engineer',
    'customer'
);


ALTER TYPE public.app_role OWNER TO postgres;

--
-- Name: device_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.device_type AS ENUM (
    'server',
    'bmc',
    'switch',
    'storage',
    'firewall',
    'ups',
    'router',
    'other'
);


ALTER TYPE public.device_type OWNER TO postgres;

--
-- Name: maintenance_frequency; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.maintenance_frequency AS ENUM (
    'daily',
    'weekly',
    'monthly',
    'quarterly',
    'semi_annual',
    'on_request'
);


ALTER TYPE public.maintenance_frequency OWNER TO postgres;

--
-- Name: monitoring_protocol; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.monitoring_protocol AS ENUM (
    'SNMP',
    'IPMI',
    'SSH',
    'HTTP',
    'HTTPS',
    'Agent'
);


ALTER TYPE public.monitoring_protocol OWNER TO postgres;

--
-- Name: protocol_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.protocol_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'overdue'
);


ALTER TYPE public.protocol_status OWNER TO postgres;

--
-- Name: ticket_link_kind; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ticket_link_kind AS ENUM (
    'related',
    'duplicate',
    'parent',
    'child',
    'blocks',
    'blocked_by'
);


ALTER TYPE public.ticket_link_kind OWNER TO postgres;

--
-- Name: ticket_priority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ticket_priority AS ENUM (
    'P1',
    'P2',
    'P3',
    'P4'
);


ALTER TYPE public.ticket_priority OWNER TO postgres;

--
-- Name: ticket_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ticket_status AS ENUM (
    'open',
    'in_progress',
    'waiting',
    'overdue',
    'resolved',
    'closed',
    'assigned',
    'cancelled'
);


ALTER TYPE public.ticket_status OWNER TO postgres;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: postgres
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO postgres;

--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: postgres
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: postgres
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
    ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

    ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
    ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

    REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
    REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

    GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO postgres;

--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: postgres
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: postgres
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RAISE WARNING 'PgBouncer auth request: %', p_usename;

    RETURN QUERY
    SELECT usename::TEXT, passwd::TEXT FROM pg_catalog.pg_shadow
    WHERE usename = p_usename;
END;
$$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO postgres;

--
-- Name: archive_monitored_hosts_on_conn_delete(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.archive_monitored_hosts_on_conn_delete() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


ALTER FUNCTION public.archive_monitored_hosts_on_conn_delete() OWNER TO postgres;

--
-- Name: get_tables_list(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_tables_list() RETURNS TABLE(table_name text, columns_count bigint, total_size text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
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


ALTER FUNCTION public.get_tables_list() OWNER TO postgres;

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  has_admin boolean;
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

  -- Bootstrap: if there is no admin in the system yet, promote this user to admin
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO has_admin;
  IF NOT has_admin THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;


ALTER FUNCTION public.has_role(_user_id uuid, _role public.app_role) OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text) OWNER TO supabase_storage_admin;

--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
  v_order_by text;
  v_sort_order text;
begin
  case
    when sortcolumn = 'name' then
      v_order_by = 'name';
    when sortcolumn = 'updated_at' then
      v_order_by = 'updated_at';
    when sortcolumn = 'created_at' then
      v_order_by = 'created_at';
    when sortcolumn = 'last_accessed_at' then
      v_order_by = 'last_accessed_at';
    else
      v_order_by = 'name';
  end case;

  case
    when sortorder = 'asc' then
      v_sort_order = 'asc';
    when sortorder = 'desc' then
      v_sort_order = 'desc';
    else
      v_sort_order = 'asc';
  end case;

  v_order_by = v_order_by || ' ' || v_sort_order;

  return query execute
    'with folders as (
       select path_tokens[$1] as folder
       from storage.objects
         where objects.name ilike $2 || $3 || ''%''
           and bucket_id = $4
           and array_length(objects.path_tokens, 1) <> $1
       group by folder
       order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

--
-- Name: secrets_encrypt_secret_secret(); Type: FUNCTION; Schema: vault; Owner: supabase_admin
--

CREATE FUNCTION vault.secrets_encrypt_secret_secret() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
		BEGIN
		        new.secret = CASE WHEN new.secret IS NULL THEN NULL ELSE
			CASE WHEN new.key_id IS NULL THEN NULL ELSE pg_catalog.encode(
			  pgsodium.crypto_aead_det_encrypt(
				pg_catalog.convert_to(new.secret, 'utf8'),
				pg_catalog.convert_to((new.id::text || new.description::text || new.created_at::text || new.updated_at::text)::text, 'utf8'),
				new.key_id::uuid,
				new.nonce
			  ),
				'base64') END END;
		RETURN new;
		END;
		$$;


ALTER FUNCTION vault.secrets_encrypt_secret_secret() OWNER TO supabase_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    from_ip_address inet,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255) DEFAULT 'authenticated'::character varying,
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: alert_thresholds; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alert_thresholds (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_key text NOT NULL,
    host_id uuid,
    zabbix_host_id text,
    display_name text,
    warning_value numeric,
    critical_value numeric,
    comparison text DEFAULT '>'::text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    auto_create_ticket boolean DEFAULT false NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    CONSTRAINT alert_thresholds_comparison_check CHECK ((comparison = ANY (ARRAY['>'::text, '<'::text, '>='::text, '<='::text, '='::text, '!='::text])))
);


ALTER TABLE public.alert_thresholds OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    user_name text,
    action text NOT NULL,
    module text NOT NULL,
    entity_id text,
    details text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    organization text,
    target_user_id uuid
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: automation_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.automation_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    script_id text,
    script_name text NOT NULL,
    host_id text,
    host_name text,
    result text,
    status text DEFAULT 'running'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.automation_logs OWNER TO postgres;

--
-- Name: contracts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contracts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    contract_number text NOT NULL,
    title text,
    start_date date NOT NULL,
    end_date date,
    scan_path text,
    scan_name text,
    is_active boolean DEFAULT true NOT NULL,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    executor_org_name text
);


ALTER TABLE public.contracts OWNER TO postgres;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    file_path text NOT NULL,
    file_type text,
    file_size bigint,
    organization text NOT NULL,
    site_id uuid,
    uploaded_by uuid,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid,
    doc_category text DEFAULT 'technical'::text NOT NULL
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: equipment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.equipment (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    category_id uuid,
    name text NOT NULL,
    model text,
    serial_number text,
    os_info text,
    quantity integer DEFAULT 1,
    description text,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid,
    warranty_until date,
    warranty_provider text
);


ALTER TABLE public.equipment OWNER TO postgres;

--
-- Name: equipment_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.equipment_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    icon text
);


ALTER TABLE public.equipment_categories OWNER TO postgres;

--
-- Name: factory_reset_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.factory_reset_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    requested_by uuid NOT NULL,
    requested_by_email text,
    reason text,
    status text DEFAULT 'pending'::text NOT NULL,
    approved_by uuid,
    approved_by_email text,
    approved_at timestamp with time zone,
    executed_at timestamp with time zone,
    rejected_reason text,
    expires_at timestamp with time zone DEFAULT (now() + '24:00:00'::interval) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.factory_reset_requests OWNER TO postgres;

--
-- Name: gitlab_ticket_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gitlab_ticket_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    project_id text NOT NULL,
    issue_iid integer NOT NULL,
    issue_url text NOT NULL,
    issue_state text DEFAULT 'opened'::text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.gitlab_ticket_links OWNER TO postgres;

--
-- Name: holidays; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.holidays (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date date NOT NULL,
    name text NOT NULL,
    day_type text DEFAULT 'holiday'::text NOT NULL,
    source text DEFAULT 'manual'::text NOT NULL,
    country_code text DEFAULT 'BY'::text NOT NULL,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.holidays OWNER TO postgres;

--
-- Name: infrastructure_map_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.infrastructure_map_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    map_id uuid NOT NULL,
    version_number integer NOT NULL,
    data jsonb DEFAULT '{"edges": [], "nodes": []}'::jsonb NOT NULL,
    comment text,
    created_by uuid,
    created_by_name text,
    node_count integer DEFAULT 0 NOT NULL,
    edge_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.infrastructure_map_versions OWNER TO postgres;

--
-- Name: infrastructure_maps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.infrastructure_maps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    data jsonb DEFAULT '{"edges": [], "nodes": []}'::jsonb NOT NULL,
    organization_id uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.infrastructure_maps OWNER TO postgres;

--
-- Name: integration_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.integration_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.integration_settings OWNER TO postgres;

--
-- Name: item_aliases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.item_aliases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    host_id uuid,
    zabbix_host_id text,
    item_key text NOT NULL,
    display_name text NOT NULL,
    description text,
    category text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.item_aliases OWNER TO postgres;

--
-- Name: maintenance_protocols; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_protocols (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    frequency public.maintenance_frequency NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    status public.protocol_status DEFAULT 'pending'::public.protocol_status NOT NULL,
    created_by uuid,
    completed_by uuid,
    completed_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    ticket_id uuid,
    contract_id uuid,
    template_id uuid,
    executor_user_id uuid,
    executor_name text,
    responsible_user_id uuid,
    responsible_name text,
    signed_executor_at timestamp with time zone,
    signed_responsible_at timestamp with time zone,
    report_date date,
    customer_org_id uuid,
    executor_org_id uuid,
    header_snapshot jsonb,
    executor_signature_user_id uuid,
    responsible_signature_user_id uuid
);


ALTER TABLE public.maintenance_protocols OWNER TO postgres;

--
-- Name: maintenance_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    equipment_id uuid NOT NULL,
    task_id uuid NOT NULL,
    next_due_date date NOT NULL,
    last_completed_date date,
    assigned_to uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.maintenance_schedules OWNER TO postgres;

--
-- Name: maintenance_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid,
    title text NOT NULL,
    description text,
    frequency public.maintenance_frequency NOT NULL,
    is_automatable boolean DEFAULT false,
    automation_script text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    site_id uuid,
    equipment_id uuid,
    organization_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    is_system boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 100 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.maintenance_tasks OWNER TO postgres;

--
-- Name: metric_translations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.metric_translations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key_pattern text NOT NULL,
    match_type text DEFAULT 'exact'::text NOT NULL,
    display_name_ru text NOT NULL,
    description_ru text,
    category text,
    priority integer DEFAULT 100 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.metric_translations OWNER TO postgres;

--
-- Name: monitored_hosts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.monitored_hosts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    ip_address text NOT NULL,
    device_type public.device_type DEFAULT 'server'::public.device_type NOT NULL,
    protocol public.monitoring_protocol DEFAULT 'Agent'::public.monitoring_protocol NOT NULL,
    port integer,
    snmp_community text,
    credentials_login text,
    credentials_password text,
    site_id uuid,
    enabled boolean DEFAULT true NOT NULL,
    zabbix_host_id text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    visible_name text,
    host_group text,
    protocols_config jsonb DEFAULT '{}'::jsonb,
    templates jsonb DEFAULT '[]'::jsonb,
    organization_id uuid,
    zabbix_connection_id uuid
);


ALTER TABLE public.monitored_hosts OWNER TO postgres;

--
-- Name: monitoring_host_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.monitoring_host_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    zabbix_host_id text NOT NULL,
    equipment_id uuid NOT NULL,
    host_name text NOT NULL,
    auto_matched boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);


ALTER TABLE public.monitoring_host_links OWNER TO postgres;

--
-- Name: notification_channels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_channels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    channel_type text NOT NULL,
    name text NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    last_test_at timestamp with time zone,
    last_test_status text,
    last_test_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notification_channels_channel_type_check CHECK ((channel_type = ANY (ARRAY['telegram'::text, 'mattermost'::text, 'email'::text, 'smtp'::text, 'sms'::text, 'mts_sms'::text, 'a1_sms'::text, 'web_push'::text, 'webhook'::text])))
);


ALTER TABLE public.notification_channels OWNER TO postgres;

--
-- Name: notification_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    channel_id uuid,
    channel_type text NOT NULL,
    event_type text NOT NULL,
    priority text,
    title text,
    body text,
    payload jsonb,
    status text DEFAULT 'pending'::text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    error text,
    http_status integer,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    CONSTRAINT notification_log_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text, 'skipped'::text])))
);


ALTER TABLE public.notification_log OWNER TO postgres;

--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_preferences (
    user_id uuid NOT NULL,
    delivery_mode text DEFAULT 'instant'::text NOT NULL,
    dnd_enabled boolean DEFAULT false NOT NULL,
    quiet_hours_enabled boolean DEFAULT false NOT NULL,
    quiet_hours_start time without time zone,
    quiet_hours_end time without time zone,
    quiet_days jsonb DEFAULT '[]'::jsonb NOT NULL,
    quiet_bypass_critical boolean DEFAULT true NOT NULL,
    digest_schedule text DEFAULT 'daily_09'::text NOT NULL,
    timezone text DEFAULT 'Europe/Minsk'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notification_preferences_delivery_mode_check CHECK ((delivery_mode = ANY (ARRAY['instant'::text, 'digest'::text, 'instant_critical_digest_rest'::text])))
);


ALTER TABLE public.notification_preferences OWNER TO postgres;

--
-- Name: notification_queue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    event_type text NOT NULL,
    priority text,
    title text NOT NULL,
    body text,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    scheduled_for timestamp with time zone DEFAULT now() NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'queued'::text NOT NULL,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notification_queue_status_check CHECK ((status = ANY (ARRAY['queued'::text, 'processing'::text, 'done'::text, 'failed'::text, 'cancelled'::text])))
);


ALTER TABLE public.notification_queue OWNER TO postgres;

--
-- Name: notification_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    event_type text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    min_priority text,
    channel_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    filters jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notification_subscriptions OWNER TO postgres;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    short_name text,
    inn text,
    address text,
    contact_email text,
    contact_phone text,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    legal_full_name text,
    executor_default text
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text,
    phone text,
    organization text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    signature_path text,
    "position" text
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Name: protocol_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.protocol_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    protocol_id uuid NOT NULL,
    schedule_id uuid,
    equipment_id uuid NOT NULL,
    task_id uuid NOT NULL,
    status text DEFAULT 'pending'::text,
    result text,
    notes text,
    completed_by uuid,
    completed_at timestamp with time zone,
    auto_result jsonb,
    equipment_snapshot jsonb
);


ALTER TABLE public.protocol_items OWNER TO postgres;

--
-- Name: protocol_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.protocol_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    frequency public.maintenance_frequency,
    site_id uuid,
    organization_id uuid,
    contract_id uuid,
    description text,
    default_executor_id uuid,
    default_responsible_id uuid,
    signatory_executor_label text DEFAULT 'Исполнитель'::text,
    signatory_responsible_label text DEFAULT 'Ответственный'::text,
    template_file_path text,
    template_file_name text,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.protocol_templates OWNER TO postgres;

--
-- Name: saved_graphs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.saved_graphs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    host_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    item_keys jsonb DEFAULT '[]'::jsonb NOT NULL,
    chart_type text DEFAULT 'line'::text NOT NULL,
    time_range text DEFAULT '1h'::text NOT NULL,
    aggregation text DEFAULT 'avg'::text,
    is_template boolean DEFAULT false NOT NULL,
    is_shared boolean DEFAULT false NOT NULL,
    tz_requirement_codes jsonb DEFAULT '[]'::jsonb,
    config jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT saved_graphs_aggregation_check CHECK ((aggregation = ANY (ARRAY['avg'::text, 'min'::text, 'max'::text, 'sum'::text, 'last'::text]))),
    CONSTRAINT saved_graphs_chart_type_check CHECK ((chart_type = ANY (ARRAY['line'::text, 'bar'::text, 'area'::text])))
);


ALTER TABLE public.saved_graphs OWNER TO postgres;

--
-- Name: sites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    address text,
    city text,
    organization text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid
);


ALTER TABLE public.sites OWNER TO postgres;

--
-- Name: support_scheme_lines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_scheme_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    scheme_id uuid NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    line_number text,
    line_name text NOT NULL,
    description text,
    primary_engineer_name text,
    primary_engineer_phone text,
    fallback_engineer_name text,
    fallback_engineer_phone text,
    color text DEFAULT 'primary'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.support_scheme_lines OWNER TO postgres;

--
-- Name: support_schemes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_schemes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    title text DEFAULT 'Схема технической поддержки'::text NOT NULL,
    subtitle text,
    hotline_city text,
    hotline_mobile text,
    ivr_business_hours text DEFAULT '08:00 — 17:00'::text,
    ivr_after_hours text DEFAULT '17:00 — 08:00, выходные и праздники'::text,
    sla_note text,
    customer_responsible_name text,
    customer_responsible_phone text,
    customer_responsible_role text DEFAULT 'Ответственное лицо от Заказчика'::text,
    contractor_responsible_name text,
    contractor_responsible_phone text,
    contractor_responsible_role text DEFAULT 'Ответственное лицо от Исполнителя'::text,
    escalation_name text,
    escalation_phone text,
    escalation_role text DEFAULT 'Старший дежурный (эскалация)'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.support_schemes OWNER TO postgres;

--
-- Name: system_kill_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_kill_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    triggered_by uuid,
    triggered_email text,
    status text NOT NULL,
    details text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.system_kill_log OWNER TO postgres;

--
-- Name: ticket_ai_analyses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_ai_analyses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    analysis jsonb NOT NULL,
    model text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ticket_ai_analyses OWNER TO postgres;

--
-- Name: ticket_comment_reactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_comment_reactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    comment_id uuid NOT NULL,
    user_id uuid NOT NULL,
    emoji text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ticket_comment_reactions OWNER TO postgres;

--
-- Name: ticket_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    is_internal boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    mentions uuid[] DEFAULT '{}'::uuid[] NOT NULL
);


ALTER TABLE public.ticket_comments OWNER TO postgres;

--
-- Name: ticket_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_ticket_id uuid NOT NULL,
    target_ticket_id uuid NOT NULL,
    kind public.ticket_link_kind DEFAULT 'related'::public.ticket_link_kind NOT NULL,
    note text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ticket_links_check CHECK ((source_ticket_id <> target_ticket_id))
);


ALTER TABLE public.ticket_links OWNER TO postgres;

--
-- Name: ticket_status_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    old_status text,
    new_status text NOT NULL,
    changed_by uuid NOT NULL,
    changed_by_name text,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ticket_status_history OWNER TO postgres;

--
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid,
    equipment_id uuid,
    title text NOT NULL,
    description text,
    priority public.ticket_priority DEFAULT 'P3'::public.ticket_priority NOT NULL,
    status public.ticket_status DEFAULT 'open'::public.ticket_status NOT NULL,
    created_by uuid NOT NULL,
    assigned_to uuid,
    resolved_at timestamp with time zone,
    sla_deadline timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    first_response_at timestamp with time zone,
    product_code text,
    subcategory text,
    request_type text DEFAULT 'incident'::text,
    incident_category text,
    organization_id uuid
);


ALTER TABLE public.tickets OWNER TO postgres;

--
-- Name: tz_coverage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tz_coverage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    requirement_id uuid NOT NULL,
    host_id uuid,
    status text DEFAULT 'none'::text NOT NULL,
    related_items jsonb DEFAULT '[]'::jsonb,
    notes text,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tz_coverage OWNER TO postgres;

--
-- Name: tz_requirements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tz_requirements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    title text NOT NULL,
    category text,
    check_type text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tz_requirements OWNER TO postgres;

--
-- Name: user_dashboard_widgets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_dashboard_widgets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    widget_type text NOT NULL,
    title text NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_dashboard_widgets OWNER TO postgres;

--
-- Name: user_favorite_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_favorite_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    zabbix_host_id text NOT NULL,
    host_name text NOT NULL,
    itemid text NOT NULL,
    item_key text NOT NULL,
    item_name text NOT NULL,
    units text,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_favorite_metrics OWNER TO postgres;

--
-- Name: user_metric_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_metric_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    display_language text DEFAULT 'translated'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_metric_preferences OWNER TO postgres;

--
-- Name: user_module_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_module_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    module_key text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_module_permissions OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: zabbix_connections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.zabbix_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    name text NOT NULL,
    zabbix_url text NOT NULL,
    zabbix_user text NOT NULL,
    zabbix_password text NOT NULL,
    vpn_info text,
    is_active boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);


ALTER TABLE public.zabbix_connections OWNER TO postgres;

--
-- Name: zabbix_template_library; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.zabbix_template_library (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    source text DEFAULT 'local'::text NOT NULL,
    source_url text,
    category text,
    description text,
    yaml_content text,
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    imported_from text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.zabbix_template_library OWNER TO postgres;

--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- Name: decrypted_secrets; Type: VIEW; Schema: vault; Owner: supabase_admin
--

CREATE VIEW vault.decrypted_secrets AS
 SELECT secrets.id,
    secrets.name,
    secrets.description,
    secrets.secret,
        CASE
            WHEN (secrets.secret IS NULL) THEN NULL::text
            ELSE
            CASE
                WHEN (secrets.key_id IS NULL) THEN NULL::text
                ELSE convert_from(pgsodium.crypto_aead_det_decrypt(decode(secrets.secret, 'base64'::text), convert_to(((((secrets.id)::text || secrets.description) || (secrets.created_at)::text) || (secrets.updated_at)::text), 'utf8'::name), secrets.key_id, secrets.nonce), 'utf8'::name)
            END
        END AS decrypted_secret,
    secrets.key_id,
    secrets.nonce,
    secrets.created_at,
    secrets.updated_at
   FROM vault.secrets;


ALTER TABLE vault.decrypted_secrets OWNER TO supabase_admin;

--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
00000000-0000-0000-0000-000000000000	8318aba2-f9f4-4c4a-8604-340b512d85b9	{"action":"user_signedup","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}	2026-05-20 07:07:45.02041+00	
00000000-0000-0000-0000-000000000000	2690aca0-4cc6-4ec0-a84f-e40002b05099	{"action":"login","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-20 07:07:45.027796+00	
00000000-0000-0000-0000-000000000000	dcd061d6-27b0-4495-81d3-53d5e557b527	{"action":"token_refreshed","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-20 08:52:29.37833+00	
00000000-0000-0000-0000-000000000000	1af9dbc6-daad-4126-a763-23fde66a3759	{"action":"token_revoked","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-20 08:52:29.379557+00	
00000000-0000-0000-0000-000000000000	9f5112bb-0531-4f0e-b0d6-1da4246d39a6	{"action":"logout","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account"}	2026-05-20 08:52:47.268752+00	
00000000-0000-0000-0000-000000000000	9349d232-9265-4703-8599-19d31f463f3a	{"action":"login","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-20 10:19:10.473343+00	
00000000-0000-0000-0000-000000000000	ab357f23-eb34-4981-8894-76de8540c1c8	{"action":"login","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-20 10:44:47.460713+00	
00000000-0000-0000-0000-000000000000	f035bc09-488a-4154-9e5e-808c50334d67	{"action":"user_signedup","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}	2026-05-20 11:24:49.28741+00	
00000000-0000-0000-0000-000000000000	b780793a-dc8a-42a6-a51d-bc86afe8265a	{"action":"login","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-20 11:24:49.310055+00	
00000000-0000-0000-0000-000000000000	2538e21a-cb7b-4858-8100-741c121a253d	{"action":"token_refreshed","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-20 11:44:25.960032+00	
00000000-0000-0000-0000-000000000000	81cee6a6-d67e-4405-a653-8b79e455193b	{"action":"token_revoked","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-20 11:44:25.960785+00	
00000000-0000-0000-0000-000000000000	25791495-3513-48c7-8141-1cf0950b5422	{"action":"logout","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account"}	2026-05-20 11:44:36.003562+00	
00000000-0000-0000-0000-000000000000	501ba8e3-8263-419e-ab5a-1a065a27f82a	{"action":"login","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-20 11:44:44.70306+00	
00000000-0000-0000-0000-000000000000	a50758ea-2ef2-4144-b7e1-e721067a59ed	{"action":"logout","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account"}	2026-05-20 11:47:23.764798+00	
00000000-0000-0000-0000-000000000000	7b3b1072-531a-4a28-af68-4e7645de8d3e	{"action":"login","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-20 11:47:47.034196+00	
00000000-0000-0000-0000-000000000000	5be2e0d6-2bea-44b1-8374-389c3464a542	{"action":"logout","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account"}	2026-05-20 12:37:09.575656+00	
00000000-0000-0000-0000-000000000000	3c3494a9-a036-409e-a319-d15a7965a0bc	{"action":"login","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-20 12:37:32.512318+00	
00000000-0000-0000-0000-000000000000	660edc5d-41f7-45e4-aaa7-6645caab6419	{"action":"token_refreshed","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-20 13:17:46.472488+00	
00000000-0000-0000-0000-000000000000	ab282a5e-7db7-43af-bdb7-883319e67142	{"action":"token_revoked","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-20 13:17:46.473147+00	
00000000-0000-0000-0000-000000000000	6482ce06-73df-481c-878f-e82de3e87ce6	{"action":"token_refreshed","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-20 14:21:58.730945+00	
00000000-0000-0000-0000-000000000000	d2da1d26-d1b3-41b2-8270-63c84533b804	{"action":"token_revoked","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-20 14:21:58.731738+00	
00000000-0000-0000-0000-000000000000	5d7385ac-41e2-41d0-ab14-2fa86bbed23b	{"action":"logout","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account"}	2026-05-20 14:22:00.614878+00	
00000000-0000-0000-0000-000000000000	fc2f0496-4842-4217-8a1b-6727007f6bda	{"action":"login","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-20 14:22:21.966663+00	
00000000-0000-0000-0000-000000000000	863d3dc2-36cc-442b-a497-50d927205cb2	{"action":"logout","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account"}	2026-05-20 14:22:58.474623+00	
00000000-0000-0000-0000-000000000000	e053ba43-8ca0-4301-a9ee-8f813b22eeef	{"action":"login","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-20 14:25:29.225692+00	
00000000-0000-0000-0000-000000000000	398ad9bf-1e50-48a1-866d-409ea5818ba3	{"action":"logout","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account"}	2026-05-20 14:31:28.913093+00	
00000000-0000-0000-0000-000000000000	a4b67da8-af8c-416f-bb93-5f486b120fce	{"action":"login","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-20 14:31:43.257384+00	
00000000-0000-0000-0000-000000000000	41e89e69-84cc-43de-bfca-b12f60356b9b	{"action":"logout","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account"}	2026-05-20 14:38:19.190911+00	
00000000-0000-0000-0000-000000000000	7547f612-14a2-4f23-8df2-2a4427efba24	{"action":"login","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-20 14:39:37.474159+00	
00000000-0000-0000-0000-000000000000	355ed572-fab1-4c8d-b77e-4a1c487af101	{"action":"logout","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account"}	2026-05-20 14:48:33.174814+00	
00000000-0000-0000-0000-000000000000	10833e66-05f9-41a2-984e-876caf2fb1ab	{"action":"user_signedup","actor_id":"6612e16b-ba9f-49cf-9ed2-184cf00dde2c","actor_name":"Розганова Алина Валерьевна","actor_username":"rav@iteng.by","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}	2026-05-20 14:49:04.849138+00	
00000000-0000-0000-0000-000000000000	c268606a-4f9c-407d-82dc-6c75fa4766cc	{"action":"login","actor_id":"6612e16b-ba9f-49cf-9ed2-184cf00dde2c","actor_name":"Розганова Алина Валерьевна","actor_username":"rav@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-20 14:49:04.851311+00	
00000000-0000-0000-0000-000000000000	b1748320-5403-4384-8b76-1183b14a36d6	{"action":"logout","actor_id":"6612e16b-ba9f-49cf-9ed2-184cf00dde2c","actor_name":"Розганова Алина Валерьевна","actor_username":"rav@iteng.by","actor_via_sso":false,"log_type":"account"}	2026-05-20 14:49:30.987551+00	
00000000-0000-0000-0000-000000000000	cc25dc84-3ce4-4ab5-a5ae-06012b4b1411	{"action":"token_refreshed","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-21 05:26:19.821688+00	
00000000-0000-0000-0000-000000000000	659a366f-180a-49f0-84a1-4d5e40102135	{"action":"token_revoked","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-21 05:26:19.822432+00	
00000000-0000-0000-0000-000000000000	6eb1bb4b-0770-491a-8bba-f0041462dd97	{"action":"login","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-21 07:14:25.386515+00	
00000000-0000-0000-0000-000000000000	15186f27-ced6-422d-8719-974b91ecf861	{"action":"logout","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account"}	2026-05-21 07:26:52.218456+00	
00000000-0000-0000-0000-000000000000	72a948ae-57be-467b-9e8e-fd7eb3cc33b5	{"action":"login","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-21 07:27:07.116842+00	
00000000-0000-0000-0000-000000000000	38775509-277c-4b59-bf77-c22f34a4a31a	{"action":"token_refreshed","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-21 08:58:21.704903+00	
00000000-0000-0000-0000-000000000000	bfdf7f10-4249-462d-8fc3-db4a4bf72e15	{"action":"token_revoked","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-21 08:58:21.747869+00	
00000000-0000-0000-0000-000000000000	764c7f6c-0576-429b-b5fc-1c91094c43e7	{"action":"logout","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account"}	2026-05-21 08:58:28.553963+00	
00000000-0000-0000-0000-000000000000	f263cbea-8209-4027-bce8-11a6f78c56b9	{"action":"login","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-21 08:58:42.207967+00	
00000000-0000-0000-0000-000000000000	3405c25a-b08c-45c4-b818-6d3d833c50b4	{"action":"token_refreshed","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-21 08:59:13.326347+00	
00000000-0000-0000-0000-000000000000	63c705da-8349-4e70-8ee9-4768872e7306	{"action":"token_revoked","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-21 08:59:13.327048+00	
00000000-0000-0000-0000-000000000000	820874ec-d919-4cae-94a7-4369fde70025	{"action":"logout","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"account"}	2026-05-21 09:00:21.700954+00	
00000000-0000-0000-0000-000000000000	698c74a9-4f64-47af-a623-975ee28d5be2	{"action":"login","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-21 09:00:36.409326+00	
00000000-0000-0000-0000-000000000000	c01a3cb5-daed-4174-867a-eba59cadd455	{"action":"token_refreshed","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-21 09:57:07.978634+00	
00000000-0000-0000-0000-000000000000	6fa48a96-365f-467e-9ea1-9d033d1b8f67	{"action":"token_revoked","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-21 09:57:07.979551+00	
00000000-0000-0000-0000-000000000000	f1d46b0f-a777-44a2-9f16-dc4324f498db	{"action":"token_refreshed","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-21 11:36:43.104084+00	
00000000-0000-0000-0000-000000000000	1f32b6af-a334-4ffd-9383-5e424acf4491	{"action":"token_revoked","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-21 11:36:43.104965+00	
00000000-0000-0000-0000-000000000000	058f31ec-06b9-4784-834e-06869965e6e5	{"action":"token_refreshed","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-21 11:57:42.970607+00	
00000000-0000-0000-0000-000000000000	28f766b7-a008-423a-b8c9-98213f53d5d9	{"action":"token_revoked","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-21 11:57:42.971317+00	
00000000-0000-0000-0000-000000000000	877e140c-1802-447d-bb7c-0007adb2caaa	{"action":"token_refreshed","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-21 12:56:12.312193+00	
00000000-0000-0000-0000-000000000000	2398ce32-23be-4f74-bbb8-45a5b88bbf95	{"action":"token_revoked","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-21 12:56:12.332116+00	
00000000-0000-0000-0000-000000000000	43ae2de9-0254-4b25-8f94-1fe079ea4ba0	{"action":"token_refreshed","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-21 13:21:05.138806+00	
00000000-0000-0000-0000-000000000000	f1434230-71ab-406c-a70c-d42495b0f8e6	{"action":"token_revoked","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-21 13:21:05.139436+00	
00000000-0000-0000-0000-000000000000	265bb084-c005-409b-b4ee-0c3e172a00f1	{"action":"logout","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account"}	2026-05-21 13:21:27.098202+00	
00000000-0000-0000-0000-000000000000	a5472c83-4153-491f-a0bb-9531fd151cab	{"action":"login","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-21 13:21:36.448407+00	
00000000-0000-0000-0000-000000000000	a3349b6d-d711-4fc8-a8b6-294bad9b1662	{"action":"user_modified","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"user","traits":{"user_email":"saa@iteng.by","user_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","user_phone":""}}	2026-05-21 13:39:30.910043+00	
00000000-0000-0000-0000-000000000000	6b470250-3a36-4628-a6a4-e3f0503455e4	{"action":"token_refreshed","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-21 13:54:44.948427+00	
00000000-0000-0000-0000-000000000000	0a969204-db96-4b35-b3a8-343a9539ba45	{"action":"token_revoked","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-21 13:54:44.949209+00	
00000000-0000-0000-0000-000000000000	3a66df32-8992-4b6d-9765-4646a0f8915a	{"action":"user_modified","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"user","traits":{"user_email":"saa@iteng.by","user_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","user_phone":""}}	2026-05-21 14:12:27.883437+00	
00000000-0000-0000-0000-000000000000	3da0b429-d7d7-4ecb-ba5c-e3e2030bbb7c	{"action":"token_refreshed","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-21 14:20:50.214078+00	
00000000-0000-0000-0000-000000000000	8cab315b-1a2f-4545-be86-567dc9776adc	{"action":"token_revoked","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-21 14:20:50.215202+00	
00000000-0000-0000-0000-000000000000	fe2b2e12-2ef4-4fb9-bb78-bae63e7a60b8	{"action":"token_refreshed","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-21 15:21:48.529188+00	
00000000-0000-0000-0000-000000000000	e830a37b-8ceb-4088-87e5-c59c39a1304a	{"action":"token_revoked","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-21 15:21:48.529893+00	
00000000-0000-0000-0000-000000000000	e4dbe17c-71a6-47cf-ae77-a6a62f8aabbf	{"action":"token_refreshed","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 05:28:57.388042+00	
00000000-0000-0000-0000-000000000000	2ec864c6-a784-475d-9ecf-88e4689bfbb8	{"action":"token_revoked","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 05:28:57.421716+00	
00000000-0000-0000-0000-000000000000	8315a8c1-ed5c-41fd-9672-3ace08aab92d	{"action":"token_refreshed","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 06:44:16.363625+00	
00000000-0000-0000-0000-000000000000	a8a3c20f-4d69-4080-98cb-5e360b9c7b97	{"action":"token_revoked","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 06:44:16.364392+00	
00000000-0000-0000-0000-000000000000	25832c2f-5382-4254-9aaa-93e7833fa8c0	{"action":"token_refreshed","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 07:34:18.202428+00	
00000000-0000-0000-0000-000000000000	b4ba7b01-8b7d-435c-a0ac-a0186109d5b8	{"action":"token_revoked","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 07:34:18.203154+00	
00000000-0000-0000-0000-000000000000	a7daa3a8-5d04-49d0-bdf8-059a29f4a166	{"action":"token_refreshed","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 07:52:14.337851+00	
00000000-0000-0000-0000-000000000000	3bb73af7-1977-4c4e-8b9d-48a10bca0ea7	{"action":"token_revoked","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 07:52:14.338521+00	
00000000-0000-0000-0000-000000000000	a9bac84e-35fb-4c90-a519-2de8c96baff1	{"action":"login","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-22 09:40:01.366649+00	
00000000-0000-0000-0000-000000000000	c1edec84-cfdb-4fc2-bb0d-45940b40846f	{"action":"login","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-22 09:40:20.74681+00	
00000000-0000-0000-0000-000000000000	f8071c62-adb5-4eac-b497-b03ed8615b1c	{"action":"login","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-22 09:42:43.647563+00	
00000000-0000-0000-0000-000000000000	f470da65-16d8-4484-9b72-a582de8b0284	{"action":"logout","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account"}	2026-05-22 09:44:07.22158+00	
00000000-0000-0000-0000-000000000000	b5ec08d2-b9ea-4740-ba25-dd46a8b3665b	{"action":"login","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-22 09:44:16.019499+00	
00000000-0000-0000-0000-000000000000	e74a65d2-d706-4bef-94dc-e47a38ca745f	{"action":"login","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-22 09:46:06.566757+00	
00000000-0000-0000-0000-000000000000	763f1568-1e19-40de-a13d-c8a8bc8bd661	{"action":"login","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-22 09:48:12.09557+00	
00000000-0000-0000-0000-000000000000	f7363d96-0508-4e12-a732-1581fe7bc7e0	{"action":"logout","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account"}	2026-05-22 09:50:58.161117+00	
00000000-0000-0000-0000-000000000000	4bfac166-2141-4d39-a5a2-4572a3ac026f	{"action":"login","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-22 09:51:07.1603+00	
00000000-0000-0000-0000-000000000000	5c8d6f88-c1ad-4816-8902-b129f90539ca	{"action":"token_refreshed","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 09:55:44.376075+00	
00000000-0000-0000-0000-000000000000	2f8c24ba-95dc-4932-8df9-6b97647d12bc	{"action":"token_revoked","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 09:55:44.377181+00	
00000000-0000-0000-0000-000000000000	68cc0e5a-dac0-4c28-9616-dea75b7cf828	{"action":"token_refreshed","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 12:24:01.167708+00	
00000000-0000-0000-0000-000000000000	87ab6373-a163-499b-affb-56b6781b9c07	{"action":"token_revoked","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 12:24:01.168531+00	
00000000-0000-0000-0000-000000000000	9376887e-d382-4158-9944-15756b2b47b6	{"action":"token_refreshed","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 12:29:16.971248+00	
00000000-0000-0000-0000-000000000000	e717746a-8183-4fef-a666-1e95fc31dd9d	{"action":"token_revoked","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 12:29:16.971972+00	
00000000-0000-0000-0000-000000000000	31404848-2b12-4f8e-8d42-cf347743bfed	{"action":"user_modified","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"user","traits":{"user_email":"rav@iteng.by","user_id":"6612e16b-ba9f-49cf-9ed2-184cf00dde2c","user_phone":""}}	2026-05-22 12:30:49.778394+00	
00000000-0000-0000-0000-000000000000	228a1197-fc18-469e-b1b5-57454f920e1d	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"a.o.pstyga@brestenergo.by","user_id":"106f5240-7827-4b2d-8069-76e4cd762d81","user_phone":""}}	2026-05-22 12:39:51.929193+00	
00000000-0000-0000-0000-000000000000	7ccf0133-63fc-4e73-a81c-d6dcd8ffb1c2	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"a.o.pstyga@brestenergo.by","user_id":"1e6603b9-b9d4-446f-98b3-6b12331d2dfa","user_phone":""}}	2026-05-22 12:42:03.853172+00	
00000000-0000-0000-0000-000000000000	e9afc07a-9770-4942-aaa2-97f564598c16	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"test@test.by","user_id":"9e3ad838-7d2d-4ea9-a5fa-af4b64af6b2c","user_phone":""}}	2026-05-22 12:43:33.25663+00	
00000000-0000-0000-0000-000000000000	21383bf9-3e00-4a70-89f3-853d37a324bc	{"action":"user_modified","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"user","traits":{"user_email":"test@test.by","user_id":"9e3ad838-7d2d-4ea9-a5fa-af4b64af6b2c","user_phone":""}}	2026-05-22 12:48:20.917161+00	
00000000-0000-0000-0000-000000000000	3c9392ae-1e88-41bd-8ce5-d426aa92163f	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"a.o.pstyga@brestenergo.by","user_id":"246300c2-d349-4c98-9a1e-88fc1a3901ed","user_phone":""}}	2026-05-22 12:49:10.412073+00	
00000000-0000-0000-0000-000000000000	7dd7c5da-4c09-4136-a311-8e9a9dbef41a	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"a.o.pstyga@brestenergo.by","user_id":"9233c31a-6cc8-4ec0-90c8-3aaedf88e7ef","user_phone":""}}	2026-05-22 12:52:15.495431+00	
00000000-0000-0000-0000-000000000000	2efb693a-9c42-4069-9a7e-c14f6713829a	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"test@test.by","user_id":"9e3ad838-7d2d-4ea9-a5fa-af4b64af6b2c","user_phone":""}}	2026-05-22 12:53:21.187857+00	
00000000-0000-0000-0000-000000000000	8ba99167-663d-461d-8cb5-1188e2f5860c	{"action":"user_recovery_requested","actor_id":"9233c31a-6cc8-4ec0-90c8-3aaedf88e7ef","actor_name":"Пстыга Анатолий Олегович","actor_username":"a.o.pstyga@brestenergo.by","actor_via_sso":false,"log_type":"user"}	2026-05-22 12:55:09.703313+00	
00000000-0000-0000-0000-000000000000	c85a14a9-b60e-4ea6-ace3-cf1e938933ac	{"action":"user_recovery_requested","actor_id":"9233c31a-6cc8-4ec0-90c8-3aaedf88e7ef","actor_name":"Пстыга Анатолий Олегович","actor_username":"a.o.pstyga@brestenergo.by","actor_via_sso":false,"log_type":"user"}	2026-05-22 12:58:46.36576+00	
00000000-0000-0000-0000-000000000000	79c8d643-68e6-410b-8383-379613faad21	{"action":"token_refreshed","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 13:22:25.351452+00	
00000000-0000-0000-0000-000000000000	461b5683-fc53-4377-852d-1230728f29fb	{"action":"token_revoked","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 13:22:25.352723+00	
00000000-0000-0000-0000-000000000000	466901b7-a62c-4284-8abb-3a46ce962110	{"action":"token_refreshed","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 13:34:00.086218+00	
00000000-0000-0000-0000-000000000000	ea3af13e-7465-4978-a20e-7437b3e00b17	{"action":"token_revoked","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 13:34:00.097922+00	
00000000-0000-0000-0000-000000000000	ea2dbec2-b3b9-4bcd-8c9d-ee4fd82669ff	{"action":"token_refreshed","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 14:20:35.904305+00	
00000000-0000-0000-0000-000000000000	8f1e95a2-27ee-40e9-b96e-13e7dd69ab01	{"action":"token_revoked","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 14:20:35.905935+00	
00000000-0000-0000-0000-000000000000	96400032-03c5-453a-9206-818daf29ecfb	{"action":"token_refreshed","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 17:42:58.229613+00	
00000000-0000-0000-0000-000000000000	7bf7ab58-dcb3-468b-8322-eb84fcae07ac	{"action":"token_revoked","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 17:42:58.244252+00	
00000000-0000-0000-0000-000000000000	957a0b30-29fc-4bef-891a-0e1f8e0bc6fe	{"action":"login","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-22 18:11:05.952355+00	
00000000-0000-0000-0000-000000000000	b477d005-839e-4b2c-a88d-195c9512e3cc	{"action":"token_refreshed","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 19:42:31.220412+00	
00000000-0000-0000-0000-000000000000	f0042c4c-a466-4a2a-8d6a-c22baab62000	{"action":"token_revoked","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 19:42:31.228223+00	
00000000-0000-0000-0000-000000000000	a2f6d9f6-f3b6-4c56-9dad-d3177f1546ec	{"action":"token_refreshed","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 20:42:36.951156+00	
00000000-0000-0000-0000-000000000000	84a4fa0d-4050-422d-8f1c-1ac4fad4102b	{"action":"token_revoked","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 20:42:36.958976+00	
00000000-0000-0000-0000-000000000000	d7de57ee-3899-4444-9a16-dfd35e458a9b	{"action":"login","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-05-22 20:42:58.275404+00	
00000000-0000-0000-0000-000000000000	baad7cd2-72a1-4ccf-957d-9f764a7bd70a	{"action":"token_refreshed","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 21:41:27.537226+00	
00000000-0000-0000-0000-000000000000	a728b492-dba7-4d4e-ba6a-244779878a28	{"action":"token_revoked","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-22 21:41:27.538051+00	
00000000-0000-0000-0000-000000000000	3a4cdf12-f0a5-46ee-ab1e-8bacc6c63374	{"action":"token_refreshed","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-23 09:18:02.129179+00	
00000000-0000-0000-0000-000000000000	2647fd3a-4411-408e-a5a0-d690a86da88a	{"action":"token_revoked","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-23 09:18:02.129939+00	
00000000-0000-0000-0000-000000000000	965bba00-6060-481c-932d-8cf4444a31dc	{"action":"token_refreshed","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-23 09:28:23.955202+00	
00000000-0000-0000-0000-000000000000	a9386998-20e2-40dc-a2c8-b2b17f29ddb0	{"action":"token_revoked","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-23 09:28:23.986526+00	
00000000-0000-0000-0000-000000000000	06a1ecbc-90b2-42aa-936f-c54f526b6e4c	{"action":"token_refreshed","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-23 10:49:07.00641+00	
00000000-0000-0000-0000-000000000000	a4a45dc9-12ed-4c9a-916d-ee595fb46da1	{"action":"token_revoked","actor_id":"04eaa7fe-2753-42a7-b335-7ffe6be31c09","actor_name":"Соловьев Алексей Александрович","actor_username":"saa@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-23 10:49:07.007225+00	
00000000-0000-0000-0000-000000000000	1e689df4-751e-4889-9651-523ff0897981	{"action":"token_refreshed","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-23 11:27:16.154259+00	
00000000-0000-0000-0000-000000000000	1d7e453e-198e-4983-9051-6219d7191cac	{"action":"token_revoked","actor_id":"393ee63e-3282-4e05-bd99-dc01241e84e2","actor_name":"Шантыко Максим Геннадьевич","actor_username":"mg@iteng.by","actor_via_sso":false,"log_type":"token"}	2026-05-23 11:27:16.15533+00	
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
393ee63e-3282-4e05-bd99-dc01241e84e2	393ee63e-3282-4e05-bd99-dc01241e84e2	{"sub": "393ee63e-3282-4e05-bd99-dc01241e84e2", "email": "mg@iteng.by", "email_verified": false, "phone_verified": false}	email	2026-05-20 07:07:45.018998+00	2026-05-20 07:07:45.019084+00	2026-05-20 07:07:45.019084+00	da6e24c3-db54-416b-ae78-a798b844c591
04eaa7fe-2753-42a7-b335-7ffe6be31c09	04eaa7fe-2753-42a7-b335-7ffe6be31c09	{"sub": "04eaa7fe-2753-42a7-b335-7ffe6be31c09", "email": "saa@iteng.by", "email_verified": false, "phone_verified": false}	email	2026-05-20 11:24:49.26577+00	2026-05-20 11:24:49.285731+00	2026-05-20 11:24:49.285731+00	c11ac497-ce47-4c3e-94fc-f2494a627295
6612e16b-ba9f-49cf-9ed2-184cf00dde2c	6612e16b-ba9f-49cf-9ed2-184cf00dde2c	{"sub": "6612e16b-ba9f-49cf-9ed2-184cf00dde2c", "email": "rav@iteng.by", "email_verified": false, "phone_verified": false}	email	2026-05-20 14:49:04.84814+00	2026-05-20 14:49:04.848196+00	2026-05-20 14:49:04.848196+00	2684b241-766a-4348-9533-d7af09fec9a1
9233c31a-6cc8-4ec0-90c8-3aaedf88e7ef	9233c31a-6cc8-4ec0-90c8-3aaedf88e7ef	{"sub": "9233c31a-6cc8-4ec0-90c8-3aaedf88e7ef", "email": "a.o.pstyga@brestenergo.by", "email_verified": false, "phone_verified": false}	email	2026-05-22 12:52:15.494148+00	2026-05-22 12:52:15.494222+00	2026-05-22 12:52:15.494222+00	7c22927b-261f-4cc0-96be-614436fa10e6
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
19e5c929-555e-454b-86d1-863dafa3c110	2026-05-21 09:00:36.412644+00	2026-05-21 09:00:36.412644+00	password	70dfc0c2-729e-40e8-a58b-7963f3ea2cf6
6989b7da-ef48-4252-968c-0e772274324a	2026-05-22 09:51:07.163518+00	2026-05-22 09:51:07.163518+00	password	e176ab4d-8a3a-458e-ac01-91fc5931463b
ef9f3cb4-7c2f-4cd6-98c3-e011d80c6bbd	2026-05-22 18:11:05.980074+00	2026-05-22 18:11:05.980074+00	password	38ee3ac5-52e9-4791-9b7f-9d5652dc255d
ddc3539f-77bc-4fe2-b077-0a125c0b1768	2026-05-22 20:42:58.295701+00	2026-05-22 20:42:58.295701+00	password	1a9d0054-b9a8-4891-9aca-e29a47cbfd9f
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
00000000-0000-0000-0000-000000000000	35	5XymK0-madGECyBiwz7PJw	04eaa7fe-2753-42a7-b335-7ffe6be31c09	t	2026-05-22 07:34:18.204158+00	2026-05-22 09:55:44.377716+00	eQ62-ozx_Ia86L4SOLFI3w	19e5c929-555e-454b-86d1-863dafa3c110
00000000-0000-0000-0000-000000000000	43	oiNjMcY7F3KexsLozR_5Uw	393ee63e-3282-4e05-bd99-dc01241e84e2	t	2026-05-22 09:51:07.162252+00	2026-05-22 12:24:01.169166+00	\N	6989b7da-ef48-4252-968c-0e772274324a
00000000-0000-0000-0000-000000000000	44	etVVhp2l-n7qmS31kw-gaA	04eaa7fe-2753-42a7-b335-7ffe6be31c09	t	2026-05-22 09:55:44.378511+00	2026-05-22 12:29:16.97275+00	5XymK0-madGECyBiwz7PJw	19e5c929-555e-454b-86d1-863dafa3c110
00000000-0000-0000-0000-000000000000	45	9330tGrWpNlTaT7Givfg8A	393ee63e-3282-4e05-bd99-dc01241e84e2	t	2026-05-22 12:24:01.169566+00	2026-05-22 13:22:25.353311+00	oiNjMcY7F3KexsLozR_5Uw	6989b7da-ef48-4252-968c-0e772274324a
00000000-0000-0000-0000-000000000000	46	VZzlCKlD1zQwC4BdUd-P8A	04eaa7fe-2753-42a7-b335-7ffe6be31c09	t	2026-05-22 12:29:16.974984+00	2026-05-22 13:34:00.098825+00	etVVhp2l-n7qmS31kw-gaA	19e5c929-555e-454b-86d1-863dafa3c110
00000000-0000-0000-0000-000000000000	47	xeA8fqHnPitxD5YpMYcf-A	393ee63e-3282-4e05-bd99-dc01241e84e2	t	2026-05-22 13:22:25.354159+00	2026-05-22 14:20:35.90652+00	9330tGrWpNlTaT7Givfg8A	6989b7da-ef48-4252-968c-0e772274324a
00000000-0000-0000-0000-000000000000	49	iaH92CZHbJsjIZbDWz8NQg	393ee63e-3282-4e05-bd99-dc01241e84e2	t	2026-05-22 14:20:35.907709+00	2026-05-22 17:42:58.245253+00	xeA8fqHnPitxD5YpMYcf-A	6989b7da-ef48-4252-968c-0e772274324a
00000000-0000-0000-0000-000000000000	50	z8BTlye34BlWPk44arc1lQ	393ee63e-3282-4e05-bd99-dc01241e84e2	f	2026-05-22 17:42:58.246458+00	2026-05-22 17:42:58.246458+00	iaH92CZHbJsjIZbDWz8NQg	6989b7da-ef48-4252-968c-0e772274324a
00000000-0000-0000-0000-000000000000	51	1yv_sx8QkICKabhroaHJhQ	393ee63e-3282-4e05-bd99-dc01241e84e2	t	2026-05-22 18:11:05.971521+00	2026-05-22 19:42:31.229049+00	\N	ef9f3cb4-7c2f-4cd6-98c3-e011d80c6bbd
00000000-0000-0000-0000-000000000000	52	eATCwfO2tk9LuxhKdJLUDg	393ee63e-3282-4e05-bd99-dc01241e84e2	t	2026-05-22 19:42:31.229664+00	2026-05-22 20:42:36.95982+00	1yv_sx8QkICKabhroaHJhQ	ef9f3cb4-7c2f-4cd6-98c3-e011d80c6bbd
00000000-0000-0000-0000-000000000000	53	SaDTwbwwxDIeq9pFXieqXw	393ee63e-3282-4e05-bd99-dc01241e84e2	f	2026-05-22 20:42:36.968048+00	2026-05-22 20:42:36.968048+00	eATCwfO2tk9LuxhKdJLUDg	ef9f3cb4-7c2f-4cd6-98c3-e011d80c6bbd
00000000-0000-0000-0000-000000000000	54	v1yr28VIXySi___v6xy4iA	393ee63e-3282-4e05-bd99-dc01241e84e2	t	2026-05-22 20:42:58.287682+00	2026-05-22 21:41:27.538591+00	\N	ddc3539f-77bc-4fe2-b077-0a125c0b1768
00000000-0000-0000-0000-000000000000	55	YfOKk4I79ZLExpCnbCM6AQ	393ee63e-3282-4e05-bd99-dc01241e84e2	t	2026-05-22 21:41:27.539066+00	2026-05-23 09:18:02.130551+00	v1yr28VIXySi___v6xy4iA	ddc3539f-77bc-4fe2-b077-0a125c0b1768
00000000-0000-0000-0000-000000000000	48	HZLB0RT11fHvrva31aFpBw	04eaa7fe-2753-42a7-b335-7ffe6be31c09	t	2026-05-22 13:34:00.099451+00	2026-05-23 09:28:23.987729+00	VZzlCKlD1zQwC4BdUd-P8A	19e5c929-555e-454b-86d1-863dafa3c110
00000000-0000-0000-0000-000000000000	57	YnilHG0RAaLkjMKb1ISQRw	04eaa7fe-2753-42a7-b335-7ffe6be31c09	t	2026-05-23 09:28:23.988903+00	2026-05-23 10:49:07.007816+00	HZLB0RT11fHvrva31aFpBw	19e5c929-555e-454b-86d1-863dafa3c110
00000000-0000-0000-0000-000000000000	58	9wPcbaVR61uncXvRA1s1Ww	04eaa7fe-2753-42a7-b335-7ffe6be31c09	f	2026-05-23 10:49:07.008329+00	2026-05-23 10:49:07.008329+00	YnilHG0RAaLkjMKb1ISQRw	19e5c929-555e-454b-86d1-863dafa3c110
00000000-0000-0000-0000-000000000000	56	0nsmossLvO0kJ_kwNhvHlA	393ee63e-3282-4e05-bd99-dc01241e84e2	t	2026-05-23 09:18:02.131062+00	2026-05-23 11:27:16.15589+00	YfOKk4I79ZLExpCnbCM6AQ	ddc3539f-77bc-4fe2-b077-0a125c0b1768
00000000-0000-0000-0000-000000000000	59	jfJR5HkxtNbAONIJG8i3ng	393ee63e-3282-4e05-bd99-dc01241e84e2	f	2026-05-23 11:27:16.156846+00	2026-05-23 11:27:16.156846+00	0nsmossLvO0kJ_kwNhvHlA	ddc3539f-77bc-4fe2-b077-0a125c0b1768
00000000-0000-0000-0000-000000000000	23	jBVcI2uF3whjpotvKszohw	04eaa7fe-2753-42a7-b335-7ffe6be31c09	t	2026-05-21 09:00:36.411165+00	2026-05-21 11:57:42.971876+00	\N	19e5c929-555e-454b-86d1-863dafa3c110
00000000-0000-0000-0000-000000000000	26	Nirj_9uMbx2bgdqHpn486A	04eaa7fe-2753-42a7-b335-7ffe6be31c09	t	2026-05-21 11:57:42.972312+00	2026-05-21 12:56:12.332875+00	jBVcI2uF3whjpotvKszohw	19e5c929-555e-454b-86d1-863dafa3c110
00000000-0000-0000-0000-000000000000	27	-R3W3u66JPU9TEGw7qY6Gw	04eaa7fe-2753-42a7-b335-7ffe6be31c09	t	2026-05-21 12:56:12.333427+00	2026-05-21 13:54:44.949765+00	Nirj_9uMbx2bgdqHpn486A	19e5c929-555e-454b-86d1-863dafa3c110
00000000-0000-0000-0000-000000000000	30	rzp_u5cp5XEandyLjh9LUQ	04eaa7fe-2753-42a7-b335-7ffe6be31c09	t	2026-05-21 13:54:44.950149+00	2026-05-22 05:28:57.422527+00	-R3W3u66JPU9TEGw7qY6Gw	19e5c929-555e-454b-86d1-863dafa3c110
00000000-0000-0000-0000-000000000000	33	eQ62-ozx_Ia86L4SOLFI3w	04eaa7fe-2753-42a7-b335-7ffe6be31c09	t	2026-05-22 05:28:57.423755+00	2026-05-22 07:34:18.203681+00	rzp_u5cp5XEandyLjh9LUQ	19e5c929-555e-454b-86d1-863dafa3c110
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, from_ip_address, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag) FROM stdin;
6989b7da-ef48-4252-968c-0e772274324a	393ee63e-3282-4e05-bd99-dc01241e84e2	2026-05-22 09:51:07.161196+00	2026-05-22 17:42:58.26404+00	\N	aal1	\N	2026-05-22 17:42:58.26394	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	172.18.0.7	\N
ef9f3cb4-7c2f-4cd6-98c3-e011d80c6bbd	393ee63e-3282-4e05-bd99-dc01241e84e2	2026-05-22 18:11:05.953199+00	2026-05-22 20:42:36.971041+00	\N	aal1	\N	2026-05-22 20:42:36.970943	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	172.18.0.7	\N
19e5c929-555e-454b-86d1-863dafa3c110	04eaa7fe-2753-42a7-b335-7ffe6be31c09	2026-05-21 09:00:36.410259+00	2026-05-23 10:49:07.01046+00	\N	aal1	\N	2026-05-23 10:49:07.010388	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	172.18.0.7	\N
ddc3539f-77bc-4fe2-b077-0a125c0b1768	393ee63e-3282-4e05-bd99-dc01241e84e2	2026-05-22 20:42:58.286611+00	2026-05-23 11:27:16.159734+00	\N	aal1	\N	2026-05-23 11:27:16.159642	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	172.18.0.7	\N
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at) FROM stdin;
00000000-0000-0000-0000-000000000000	6612e16b-ba9f-49cf-9ed2-184cf00dde2c		authenticated	rav@iteng.by	$2a$10$hrV8OL8uyJH96fq5WM4TKOA8C8ANbbLX8fft9cshZO/eeCvFxV0Cm	2026-05-20 14:49:04.849611+00	\N		\N		\N			\N	2026-05-20 14:49:04.851787+00	{"provider": "email", "providers": ["email"]}	{"full_name": "Розганова Алина Валерьевна"}	\N	2026-05-20 14:49:04.813546+00	2026-05-22 12:30:49.762937+00	\N	\N			\N		0	\N		\N	f	\N
00000000-0000-0000-0000-000000000000	9233c31a-6cc8-4ec0-90c8-3aaedf88e7ef			a.o.pstyga@brestenergo.by	$2a$06$fdpnWHD0J7mbJ5/xt1OXDu5taeJ5gPnvkDXFkd9jF4lubMUmTR9V2	2026-05-22 12:52:15.496612+00	\N		\N	2a9e4a3e712d7da8baf40f555c2e6b0dde6f1ac3d67510e05bc334a0	2026-05-22 12:58:46.365545+00			\N	\N	{"provider": "email", "providers": ["email"]}	{"phone": "", "position": "Директор", "full_name": "Пстыга Анатолий Олегович", "organization": "Филиал \\"Энерготелеком\\" РУП \\"Брестэнерго\\""}	\N	2026-05-22 12:52:15.492276+00	2026-05-22 12:58:46.366588+00	\N	\N			\N		0	\N		\N	f	\N
00000000-0000-0000-0000-000000000000	04eaa7fe-2753-42a7-b335-7ffe6be31c09		authenticated	saa@iteng.by	$2a$10$6GrKkcqwnn3cy3MAKlHv4uQxyAg/709M2FPp2VK9T82EcOabBiBjO	2026-05-20 11:24:49.288122+00	\N		\N		\N			\N	2026-05-21 09:00:36.410181+00	{"provider": "email", "providers": ["email"]}	{"full_name": "Соловьев Алексей Александрович"}	\N	2026-05-20 11:24:49.165373+00	2026-05-23 10:49:07.009274+00	\N	\N			\N		0	\N		\N	f	\N
00000000-0000-0000-0000-000000000000	393ee63e-3282-4e05-bd99-dc01241e84e2		authenticated	mg@iteng.by	$2a$10$cHzdW3MSmotb9JsHKC0dvewMaAR5cxvXNjIw5ld2cLBmQ2YXysS56	2026-05-20 07:07:45.026051+00	\N		\N		\N			\N	2026-05-22 20:42:58.286503+00	{"provider": "email", "providers": ["email"]}	{"full_name": "Шантыко Максим Геннадьевич"}	\N	2026-05-20 07:07:44.85858+00	2026-05-23 11:27:16.158271+00	\N	\N			\N		0	\N		\N	f	\N
\.


--
-- Data for Name: key; Type: TABLE DATA; Schema: pgsodium; Owner: supabase_admin
--

COPY pgsodium.key (id, status, created, expires, key_type, key_id, key_context, name, associated_data, raw_key, raw_key_nonce, parent_key, comment, user_data) FROM stdin;
\.


--
-- Data for Name: alert_thresholds; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alert_thresholds (id, item_key, host_id, zabbix_host_id, display_name, warning_value, critical_value, comparison, enabled, auto_create_ticket, notes, created_at, updated_at, created_by) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, user_name, action, module, entity_id, details, created_at, organization, target_user_id) FROM stdin;
cb327eaf-3504-4860-9b33-e34f19036b4c	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Редактирование пользователя	users	04eaa7fe-2753-42a7-b335-7ffe6be31c09	ФИО: Соловьев Алексей Александрович, Роли: admin	2026-05-21 08:58:48.923085+00	ООО "ИнноТех Инжиниринг"	\N
b76f47b0-d894-4389-8bd8-6f29a621be69	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Редактирование пользователя	users	04eaa7fe-2753-42a7-b335-7ffe6be31c09	ФИО: Соловьев Алексей Александрович, Роли: admin	2026-05-21 08:59:37.569494+00	ООО "ИнноТех Инжиниринг"	\N
5fa4d4c7-d681-4ac4-b93b-77ca67356e98	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Редактирование пользователя	users	04eaa7fe-2753-42a7-b335-7ffe6be31c09	ФИО: Соловьев Алексей Александрович, Роли: engineer	2026-05-21 09:24:30.66965+00	ООО "ИнноТех Инжиниринг"	\N
24b56331-9eb5-4aca-9058-260c8620a97c	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Редактирование пользователя	users	04eaa7fe-2753-42a7-b335-7ffe6be31c09	ФИО: Соловьев Алексей Александрович, Роли: admin	2026-05-21 09:25:39.198421+00	ООО "ИнноТех Инжиниринг"	\N
f592127c-0c08-42c8-9817-f4aafbcee2ce	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Редактирование пользователя	users	04eaa7fe-2753-42a7-b335-7ffe6be31c09	ФИО: Соловьев Алексей Александрович, Роли: admin	2026-05-21 09:37:03.50565+00	ООО "ИнноТех Инжиниринг"	\N
187e86a5-aca7-4400-978f-5d35728cfa88	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Редактирование пользователя	users	04eaa7fe-2753-42a7-b335-7ffe6be31c09	ФИО: Соловьев Алексей Александрович, Роли: admin	2026-05-21 09:38:08.417885+00	ООО "ИнноТех Инжиниринг"	\N
b14afbde-6e3e-42e4-91e4-ccd91104a939	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Редактирование пользователя	users	04eaa7fe-2753-42a7-b335-7ffe6be31c09	ФИО: Соловьев Алексей Александрович, Роли: admin	2026-05-21 09:39:07.272044+00	ООО "ИнноТех Инжиниринг"	\N
5e1476cb-5c09-4286-848b-0315051e46bb	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Редактирование пользователя	users	04eaa7fe-2753-42a7-b335-7ffe6be31c09	ФИО: Соловьев Алексей Александрович, Роли: admin	2026-05-21 12:15:39.458639+00	ООО "ИнноТех Инжиниринг"	\N
ce22b2eb-1ffe-4344-8da0-58ad195a1934	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Редактирование пользователя	users	04eaa7fe-2753-42a7-b335-7ffe6be31c09	ФИО: Соловьев Алексей Александрович, Роли: admin	2026-05-21 13:21:09.796337+00	ООО "ИнноТех Инжиниринг"	\N
60074b08-866a-427a-87f5-0b56d5651f50	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Редактирование пользователя	users	04eaa7fe-2753-42a7-b335-7ffe6be31c09	ФИО: Соловьев Алексей Александрович, Роли: admin	2026-05-21 13:21:24.696985+00	ООО "ИнноТех Инжиниринг"	\N
422d87bd-3978-423d-977f-47f5edecdf74	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Редактирование пользователя	users	04eaa7fe-2753-42a7-b335-7ffe6be31c09	ФИО: Соловьев Алексей Александрович, Роли: admin	2026-05-21 13:21:41.320163+00	ООО "ИнноТех Инжиниринг"	\N
ac5efcfa-5135-421f-86c5-ded52e82a0e5	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Редактирование пользователя	users	04eaa7fe-2753-42a7-b335-7ffe6be31c09	ФИО: Соловьев Алексей Александрович, Роли: admin	2026-05-21 13:23:04.334744+00	ООО "ИнноТех Инжиниринг"	\N
38652c1d-1c7e-4baf-87e0-6ead726a5bb7	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Редактирование пользователя	users	04eaa7fe-2753-42a7-b335-7ffe6be31c09	ФИО: Соловьев Алексей Александрович, Роли: admin	2026-05-21 13:27:45.136881+00	ООО "ИнноТех Инжиниринг"	\N
a42eb00a-6375-436b-9244-e3beb12f12be	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Редактирование пользователя	users	04eaa7fe-2753-42a7-b335-7ffe6be31c09	ФИО: Соловьев Алексей Александрович, Роли: admin	2026-05-21 13:39:31.006819+00	ООО "ИнноТех Инжиниринг"	\N
33ccf1e9-b730-484b-b8fc-044b9f2d5f50	04eaa7fe-2753-42a7-b335-7ffe6be31c09	Соловьев Алексей Александрович	Создана схема: тест	infrastructure_maps	840ca01d-3878-40d4-ba71-2ffbf0c29c52	\N	2026-05-21 13:41:44.569824+00	ООО "ИнноТех Инжиниринг"	\N
9aa43c4c-67e9-4f17-b824-d594bbb785b1	04eaa7fe-2753-42a7-b335-7ffe6be31c09	Соловьев Алексей Александрович	Редактирование пользователя	users	04eaa7fe-2753-42a7-b335-7ffe6be31c09	ФИО: Соловьев Алексей Александрович, Роли: admin	2026-05-21 14:12:27.918922+00	ООО "ИнноТех Инжиниринг"	\N
9e53417e-723c-4a9e-b479-d95fc200c662	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Привязка алерта к заявке	monitoring	32931	ticket=2f24110b-9d6f-4a4b-9fb2-c4f0bdc33938; eventid=32931	2026-05-22 10:18:48.669177+00	ООО "ИнноТех Инжиниринг"	\N
0ec5c4fd-df4a-48b3-9404-583fafb890f1	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Создание заявки из мониторинга	monitoring	2f24110b-9d6f-4a4b-9fb2-c4f0bdc33938	VMware Hypervisor: The 791102f5-3473-8e14-ed11-3b968c4ebd15 health is Red	2026-05-22 10:18:48.726685+00	ООО "ИнноТех Инжиниринг"	\N
c90b32c7-0215-4921-a2f7-de012c21e33b	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Смена статуса → Отменена	tickets	2f24110b-9d6f-4a4b-9fb2-c4f0bdc33938	[Мониторинг] VMware Hypervisor: The 791102f5-3473-8e14-ed11-3b968c4ebd15 health is Red	2026-05-22 10:19:16.837332+00	ООО "ИнноТех Инжиниринг"	\N
17b87986-2e4a-433d-ad1b-0ccba2751e5c	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Создана схема: ПТК БРЕСТ	infrastructure_maps	318df3bb-df93-4503-99fd-a886a5d93991	\N	2026-05-22 10:21:56.413982+00	ООО "ИнноТех Инжиниринг"	\N
60747218-4158-4a60-a611-61e0307a3434	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Редактирование пользователя	users	6612e16b-ba9f-49cf-9ed2-184cf00dde2c	ФИО: Розганова Алина Валерьевна, Роли: engineer	2026-05-22 12:30:49.837499+00	ООО "ИнноТех Инжиниринг"	\N
72815ba5-6aac-4f94-9d78-8cdff2c867a0	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Редактирование пользователя	users	1e6603b9-b9d4-446f-98b3-6b12331d2dfa	ФИО: Пстыга Анатолий Олегович, Роли: customer	2026-05-22 12:42:35.713487+00	ООО "ИнноТех Инжиниринг"	\N
63268a09-dff4-40ef-85ad-eba2e91a281f	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Редактирование пользователя	users	9e3ad838-7d2d-4ea9-a5fa-af4b64af6b2c	ФИО: test, Роли: customer	2026-05-22 12:48:20.98058+00	ООО "ИнноТех Инжиниринг"	\N
14c37d2e-299c-41b1-b52a-0e82b0df98af	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Создание пользователя	users	\N	Email: a.o.pstyga@brestenergo.by, Роли: customer	2026-05-22 12:52:15.533272+00	ООО "ИнноТех Инжиниринг"	\N
ae701710-a2d8-4e03-af9e-1670f1a025d1	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Удаление пользователя	users	9e3ad838-7d2d-4ea9-a5fa-af4b64af6b2c	test	2026-05-22 12:53:21.218185+00	ООО "ИнноТех Инжиниринг"	\N
401005fb-8219-427d-b925-8da309829303	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Сброс пароля	users	9233c31a-6cc8-4ec0-90c8-3aaedf88e7ef	Пстыга Анатолий Олегович	2026-05-22 12:55:09.737213+00	ООО "ИнноТех Инжиниринг"	\N
4b631274-b892-491b-a3e9-f25af45bd544	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Синхронизация CMDB с Zabbix	monitoring	\N	Создано/обновлено связей: 13	2026-05-22 14:20:13.584241+00	ООО "ИнноТех Инжиниринг"	\N
05f2e39e-90cf-477f-930f-c8a53af4c487	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Синхронизация CMDB с Zabbix	monitoring	\N	Создано/обновлено связей: 3	2026-05-22 14:20:29.971858+00	ООО "ИнноТех Инжиниринг"	\N
348e2b20-4833-4fe8-8b84-7d0ca51eb55e	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Импорт состава работ (255)	work-scope	\N	\N	2026-05-22 14:24:03.427398+00	ООО "ИнноТех Инжиниринг"	\N
381d2e98-062b-4084-aca1-55185708b924	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Массовое удаление протоколов (2)	protocols	\N	fcbc9f7e-b56d-4afd-bd76-581d01af6c95, a96894e7-78c1-4691-98c5-cea872dc6176	2026-05-22 14:24:38.262662+00	ООО "ИнноТех Инжиниринг"	\N
9544d499-9edd-4f43-80f6-4f362710175d	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Создание договора	contracts	\N	б/н	2026-05-22 14:44:55.838775+00	ООО "ИнноТех Инжиниринг"	\N
ffb2f114-4a2e-4ae1-ad91-085cc9aad7b4	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Изменение договора	contracts	\N	б/н	2026-05-22 20:38:30.011072+00	ООО "ИнноТех Инжиниринг"	\N
33d0ce19-cea6-4df7-9138-6bf4a7c244c6	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Массовая отправка протоколов в облако (0/2)	protocols	\N	2fee15ed-84fb-408f-aaed-bd798a1dae92, 9e12c170-6bd0-4603-80ea-ca888fa43a0e	2026-05-22 20:47:53.72792+00	ООО "ИнноТех Инжиниринг"	\N
ef1b6a43-0bbb-4b6d-ba06-5c07bc49b429	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Массовая отправка протоколов в облако (0/2)	protocols	\N	2fee15ed-84fb-408f-aaed-bd798a1dae92, 9e12c170-6bd0-4603-80ea-ca888fa43a0e	2026-05-22 20:48:03.729471+00	ООО "ИнноТех Инжиниринг"	\N
ad457124-fab7-4066-bc87-7463d741c668	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Массовая отправка протоколов в облако (0/4)	protocols	\N	2fee15ed-84fb-408f-aaed-bd798a1dae92, 9e12c170-6bd0-4603-80ea-ca888fa43a0e, 7a574174-0c82-4101-9059-59d8c605395c, 40a18a3a-66e2-43ef-aae1-e49b82e25f24	2026-05-22 21:06:42.264933+00	ООО "ИнноТех Инжиниринг"	\N
6d8c5c7f-ab04-40ea-a3be-19f5096bdd90	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Массовая отправка протоколов в облако (0/4)	protocols	\N	2fee15ed-84fb-408f-aaed-bd798a1dae92, 9e12c170-6bd0-4603-80ea-ca888fa43a0e, 7a574174-0c82-4101-9059-59d8c605395c, 40a18a3a-66e2-43ef-aae1-e49b82e25f24	2026-05-22 21:07:19.292254+00	ООО "ИнноТех Инжиниринг"	\N
366c6d9f-e63d-411a-867e-09d7a0252383	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Массовая отправка протоколов в облако (0/4)	protocols	\N	2fee15ed-84fb-408f-aaed-bd798a1dae92, 9e12c170-6bd0-4603-80ea-ca888fa43a0e, 7a574174-0c82-4101-9059-59d8c605395c, 40a18a3a-66e2-43ef-aae1-e49b82e25f24	2026-05-22 21:11:44.80375+00	ООО "ИнноТех Инжиниринг"	\N
b74bc39b-0469-48f5-b0c0-a98ff08df169	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Массовая отправка протоколов в облако (0/4)	protocols	\N	2fee15ed-84fb-408f-aaed-bd798a1dae92, 9e12c170-6bd0-4603-80ea-ca888fa43a0e, 7a574174-0c82-4101-9059-59d8c605395c, 40a18a3a-66e2-43ef-aae1-e49b82e25f24	2026-05-22 21:16:26.650908+00	ООО "ИнноТех Инжиниринг"	\N
af60e18c-8c4a-41ea-9bd0-3a15aad72a65	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Выгружено в Seafile: protocol	seafile	\N	/SD Brest/ПТК АСДТУ Брест/ИнноТех Инжиниринг/Протоколы/2026/05/Ежемесячные/2026-05-22/2026-05-22_2125_test_protocol_mg.txt	2026-05-22 21:25:31.553972+00	Тест_интеграции	\N
c8033c18-217b-4a72-a02d-ca2eb5de01ed	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Выгружено в Seafile: protocol	seafile	\N	/SD Brest/ПТК АСДТУ Брест/ИнноТех Инжиниринг/Протоколы/2026/05/Ежедневные/2026-05-22/2026-05-22_2126_Протокол_Ежедневно_РУП _Брестэнерго__2026-05-22_mg.docx	2026-05-22 21:26:20.282703+00	\N	\N
ebb4970c-52ea-4962-9a43-004e192daa84	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Выгружено в Seafile: protocol	seafile	\N	/SD Brest/ПТК АСДТУ Брест/ИнноТех Инжиниринг/Протоколы/2026/05/Ежедневные/2026-05-22/2026-05-22_2126_Протокол_Ежедневно_Филиал _Энерготелеком__2026-05-22_mg.docx	2026-05-22 21:26:21.550887+00	\N	\N
6ed78ddc-8ada-44f1-95a2-816811845617	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Выгружено в Seafile: protocol	seafile	\N	/SD Brest/ПТК АСДТУ Брест/ИнноТех Инжиниринг/Протоколы/2026/05/Ежедневные/2026-05-22/2026-05-22_2126_Протокол_Ежедневно_РУП _Брестэнерго__2026-05-21_mg.docx	2026-05-22 21:26:22.282115+00	\N	\N
dd1c5520-9426-42ec-894d-a323570db81d	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Выгружено в Seafile: protocol	seafile	\N	/SD Brest/ПТК АСДТУ Брест/ИнноТех Инжиниринг/Протоколы/2026/05/Ежедневные/2026-05-22/2026-05-22_2126_Протокол_Ежедневно_Филиал _Энерготелеком__2026-05-21_mg.docx	2026-05-22 21:26:23.06166+00	\N	\N
3cd39be5-1d90-4368-a0c6-004ca938ff7b	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Массовая отправка протоколов в облако (4/4)	protocols	\N	2fee15ed-84fb-408f-aaed-bd798a1dae92, 9e12c170-6bd0-4603-80ea-ca888fa43a0e, 7a574174-0c82-4101-9059-59d8c605395c, 40a18a3a-66e2-43ef-aae1-e49b82e25f24	2026-05-22 21:26:23.117541+00	ООО "ИнноТех Инжиниринг"	\N
6991dda9-c0fe-498a-9600-7f9e9b291edf	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	Массовое завершение протоколов (4)	protocols	\N	2fee15ed-84fb-408f-aaed-bd798a1dae92, 9e12c170-6bd0-4603-80ea-ca888fa43a0e, 7a574174-0c82-4101-9059-59d8c605395c, 40a18a3a-66e2-43ef-aae1-e49b82e25f24	2026-05-22 21:26:32.1322+00	ООО "ИнноТех Инжиниринг"	\N
\.


--
-- Data for Name: automation_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.automation_logs (id, user_id, script_id, script_name, host_id, host_name, result, status, created_at) FROM stdin;
a25d7298-080d-4fb0-b101-46478f6148c6	393ee63e-3282-4e05-bd99-dc01241e84e2	1	Ping	10738	10.70.1.10	\N	running	2026-05-22 10:13:44.54551+00
\.


--
-- Data for Name: contracts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contracts (id, organization_id, contract_number, title, start_date, end_date, scan_path, scan_name, is_active, notes, created_by, created_at, updated_at, executor_org_name) FROM stdin;
73fff483-8257-4780-9b6d-5ed739135e3a	cf0cefb9-7892-4d29-8f42-764c19512092	б/н	Техническое сопровождение ПТК АСДТУ	2026-05-01	2027-04-30	\N	\N	t	\N	393ee63e-3282-4e05-bd99-dc01241e84e2	2026-05-22 14:44:55.748293+00	2026-05-22 20:43:35.816946+00	\N
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, name, file_path, file_type, file_size, organization, site_id, uploaded_by, description, created_at, updated_at, organization_id, doc_category) FROM stdin;
\.


--
-- Data for Name: equipment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.equipment (id, site_id, category_id, name, model, serial_number, os_info, quantity, description, status, created_at, updated_at, organization_id, warranty_until, warranty_provider) FROM stdin;
808f9f99-6a43-4114-804d-6104d63222fd	aabafe11-24b9-41f6-9480-5c2873e21c7d	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	SRV2_ET	Huawei FusionServer 1288H V6\t	2106195VJRXEP1000002	VMware ESXi 8.0.1	1	\N	active	2026-05-22 12:33:30.489781+00	2026-05-22 12:33:30.489781+00	\N	\N	\N
73400575-bed3-4ac9-9051-91f8fc4742df	aabafe11-24b9-41f6-9480-5c2873e21c7d	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	SRV1_ET	Huawei FusionServer 1288H V6 	2106195VJRXEP1000001	VMware ESXi 8.0.1	1	\N	active	2026-05-21 14:04:21.856772+00	2026-05-22 12:33:43.006613+00	\N	\N	\N
9076480a-0f0d-4416-a19b-a08de87dac89	aabafe11-24b9-41f6-9480-5c2873e21c7d	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	SRV3_ET	Huawei FusionServer 1288H V6	2106195VJRXEP1000003	VMware ESXi 8.0.1	1	\N	active	2026-05-22 12:35:11.697781+00	2026-05-22 12:35:11.697781+00	\N	\N	\N
d5db9148-6244-4e30-b070-120a43bfbb99	532e5161-d889-4e48-9aed-81fa29f401d0	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	SRV1_RUP	Huawei FusionServer 1288H V6	2106195VJRXEP1000006	VMware ESXi 8.0.1 	1	\N	active	2026-05-22 12:36:21.854263+00	2026-05-22 12:36:21.854263+00	\N	\N	\N
4bf14c86-9d37-4778-8173-a50bef1b57d2	532e5161-d889-4e48-9aed-81fa29f401d0	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	SRV2_RUP	Huawei FusionServer 1288H V6	2106195VJRXEP1000004	VMware ESXi 8.0.1 	1	\N	active	2026-05-22 12:37:29.210334+00	2026-05-22 12:37:29.210334+00	\N	\N	\N
69de0c07-8930-42ab-93be-e6b07bd51131	532e5161-d889-4e48-9aed-81fa29f401d0	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	SRV3_RUP	Huawei FusionServer 1288H V6	2106195VJRXEP1000005	VMware ESXi 8.0.1	1	\N	active	2026-05-22 12:39:23.916375+00	2026-05-22 12:39:23.916375+00	\N	\N	\N
04e1ca08-058b-4fd0-8e9e-dbea47b0d723	aabafe11-24b9-41f6-9480-5c2873e21c7d	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	SRK	Huawei 5288 V5	2106195VJTXEP1000001\t	Windows Server 2022	1	\N	active	2026-05-22 12:44:24.744246+00	2026-05-22 12:44:24.744246+00	\N	\N	\N
4af950f1-4fd1-4851-951a-6a626a8d8879	aabafe11-24b9-41f6-9480-5c2873e21c7d	67b1d024-bd1a-47b9-b3a1-ea9f8e9482c3	AR1_ET	Huawei AR6280	2102115641DMN3000114	V300R021C00SPC200	1	\N	active	2026-05-22 12:52:54.958246+00	2026-05-22 12:52:54.958246+00	\N	\N	\N
48f5f549-650a-439c-b25b-b04bc000d11b	aabafe11-24b9-41f6-9480-5c2873e21c7d	67b1d024-bd1a-47b9-b3a1-ea9f8e9482c3	AR2_ET	Huawei AR6280	2102115641DMN3000194	V300R021C00SPC200	1	\N	active	2026-05-22 12:55:07.113922+00	2026-05-22 12:55:07.113922+00	\N	\N	\N
63171dcb-e633-49a5-b02e-639280fe490d	532e5161-d889-4e48-9aed-81fa29f401d0	67b1d024-bd1a-47b9-b3a1-ea9f8e9482c3	AR1_RUP	Huawei AR6280	2102115641DMN2900046	V300R021C00SPC200	1	\N	active	2026-05-22 12:56:23.931247+00	2026-05-22 12:56:23.931247+00	\N	\N	\N
c3361316-4327-48ca-b590-3cc7cdd47cc8	532e5161-d889-4e48-9aed-81fa29f401d0	67b1d024-bd1a-47b9-b3a1-ea9f8e9482c3	AR2_RUP	Huawei AR6280	2102115641DMM4000394	V300R021C00SPC200	1	\N	active	2026-05-22 12:57:57.320121+00	2026-05-22 12:57:57.320121+00	\N	\N	\N
90c3e300-e026-49ff-b7c3-c238c4397d23	aabafe11-24b9-41f6-9480-5c2873e21c7d	67b1d024-bd1a-47b9-b3a1-ea9f8e9482c3	SW1_ET	Huawei CE6863E-48S6CQ	1022B5956979	V200R021C10SPC600	1	\N	active	2026-05-22 13:02:57.422169+00	2026-05-22 13:02:57.422169+00	\N	\N	\N
0cd036c2-2097-4e64-a021-894fcbbf49e4	aabafe11-24b9-41f6-9480-5c2873e21c7d	67b1d024-bd1a-47b9-b3a1-ea9f8e9482c3	SW2_ET	Huawei CE6863E-48S6CQ	1022A6841016	V200R021C10SPC600	1	\N	active	2026-05-22 13:04:36.891697+00	2026-05-22 13:04:36.891697+00	\N	\N	\N
2c483c84-1085-449f-90d3-680062e0c07a	532e5161-d889-4e48-9aed-81fa29f401d0	67b1d024-bd1a-47b9-b3a1-ea9f8e9482c3	SW1_RUP	Huawei CE6863E-48S6CQ	1022A6841088	V200R021C10SPC600	1	\N	active	2026-05-22 13:05:55.355077+00	2026-05-22 13:05:55.355077+00	\N	\N	\N
19503862-917e-4322-a676-5fdb902138fa	532e5161-d889-4e48-9aed-81fa29f401d0	67b1d024-bd1a-47b9-b3a1-ea9f8e9482c3	SW2_RUP	Huawei CE6863E-48S6CQ	1022A6841050	V200R021C10SPC600	1	\N	active	2026-05-22 13:06:53.055951+00	2026-05-22 13:06:53.055951+00	\N	\N	\N
9ab6979d-9fa4-4163-b50e-d35cdc8643c4	aabafe11-24b9-41f6-9480-5c2873e21c7d	67b1d024-bd1a-47b9-b3a1-ea9f8e9482c3	SW_MGMNT_ET	Huawei S5735-L24T4S	\N	\N	1	\N	active	2026-05-22 13:09:13.999594+00	2026-05-22 13:09:13.999594+00	\N	\N	\N
3a6e4427-eb06-419e-828a-9655456e15e9	532e5161-d889-4e48-9aed-81fa29f401d0	67b1d024-bd1a-47b9-b3a1-ea9f8e9482c3	SW_MGMNT_RUP	Huawei S5735-L24T4S	\N	\N	1	\N	active	2026-05-22 13:09:43.924053+00	2026-05-22 13:09:43.924053+00	\N	\N	\N
09251a77-561b-4447-ab7d-49b2608bcc75	aabafe11-24b9-41f6-9480-5c2873e21c7d	e19a6825-ea2f-4703-9299-e9c17e49a0a2	USG_T_ET	Huawei USG6620E-AC	102180143262	V600R007C20SPC600	1	\N	active	2026-05-22 13:13:16.256371+00	2026-05-22 13:13:16.256371+00	\N	\N	\N
b0271606-1ece-4e3a-84e5-4ddee9316d2d	aabafe11-24b9-41f6-9480-5c2873e21c7d	e19a6825-ea2f-4703-9299-e9c17e49a0a2	USG_K_ET	Huawei USG6620E-AC	102315565266	V600R007C20SPC600	1	\N	active	2026-05-22 13:14:53.731529+00	2026-05-22 13:14:53.731529+00	\N	\N	\N
1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	532e5161-d889-4e48-9aed-81fa29f401d0	e19a6825-ea2f-4703-9299-e9c17e49a0a2	USG_T_RUP	Huawei USG6620E-AC	102315565267	V600R007C20SPC600	1	\N	active	2026-05-22 13:16:49.041899+00	2026-05-22 13:16:49.041899+00	\N	\N	\N
72b7c008-d486-47fa-b773-7371b385334c	532e5161-d889-4e48-9aed-81fa29f401d0	e19a6825-ea2f-4703-9299-e9c17e49a0a2	USG_K_RUP	Huawei USG6620E-AC	102315565268	V600R007C20SPC600	1	\N	active	2026-05-22 13:18:29.505265+00	2026-05-22 13:18:29.505265+00	\N	\N	\N
\.


--
-- Data for Name: equipment_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.equipment_categories (id, name, description, icon) FROM stdin;
f700d981-f93f-41f4-af99-78d7cce1a352	ИБП	Источники бесперебойного питания	BatteryCharging
1296e530-0ff0-4fb0-b953-f78590135735	Кондиционеры	Прецизионные кондиционеры и системы охлаждения	Wind
74ba9faf-b9bc-4584-a703-29ec8215c639	Дизель-генераторные установки	ДГУ резервного электропитания	Fuel
0160807a-6715-49e1-aaea-b9eef51e2311	СХД	Системы хранения данных	HardDrive
5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Серверы	Физические и кластерные серверы	Server
67b1d024-bd1a-47b9-b3a1-ea9f8e9482c3	Сетевое оборудование	Коммутаторы, маршрутизаторы	Network
e19a6825-ea2f-4703-9299-e9c17e49a0a2	Межсетевые экраны	FW, IPS, шлюзы безопасности	ShieldCheck
a8942b7f-5c08-4f34-b0a6-288c4ee7ba23	Виртуализация	Гипервизоры, кластеры виртуализации	Boxes
84c01096-6572-4d52-9d13-b92035b7eaac	Резервное копирование	Системы СРК и репликации	DatabaseBackup
2d06fd38-d51e-40a2-bf3e-9bb24aca39da	Мониторинг	Серверы и агенты мониторинга	Activity
4a15def5-c269-4984-b51f-f7dbb1cd7ca1	Системы пожаротушения	Газовое/порошковое пожаротушение	Flame
4afb7319-12de-42a2-9d73-df203369a2af	СКС и щитовые	Структурированные кабельные системы и силовые щиты	CableIcon
\.


--
-- Data for Name: factory_reset_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.factory_reset_requests (id, requested_by, requested_by_email, reason, status, approved_by, approved_by_email, approved_at, executed_at, rejected_reason, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: gitlab_ticket_links; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gitlab_ticket_links (id, ticket_id, project_id, issue_iid, issue_url, issue_state, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: holidays; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.holidays (id, date, name, day_type, source, country_code, notes, created_by, created_at, updated_at) FROM stdin;
bc23ef87-6fc9-4222-a56b-60ae6f4f232e	2026-01-01	New Year's Day	workday	nager.date	BY	\N	\N	2026-05-22 14:43:04.609345+00	2026-05-22 18:38:19.104098+00
7833a165-7db4-464f-a991-11084ecb6acc	2026-01-02	New Year's Day	workday	nager.date	BY	\N	\N	2026-05-22 14:43:04.621628+00	2026-05-22 18:38:19.150059+00
78791370-c74a-409c-ae8e-ab630ae463fe	2026-01-07	Christmas Day (Orthodox)	workday	nager.date	BY	\N	\N	2026-05-22 14:43:04.634701+00	2026-05-22 18:38:19.159739+00
2224ffd4-a69f-47da-b23b-5b7dab30a837	2026-03-08	International Women's Day	workday	nager.date	BY	\N	\N	2026-05-22 14:43:04.645837+00	2026-05-22 18:38:19.186452+00
2602c708-d204-487a-afd2-d41cc4833d95	2026-04-21	Commemoration Day	workday	nager.date	BY	\N	\N	2026-05-22 14:43:04.656585+00	2026-05-22 18:38:19.195397+00
c9ab84f1-fa0b-4b88-8552-d8f06e6664c6	2026-05-01	Labour Day	workday	nager.date	BY	\N	\N	2026-05-22 14:43:04.665993+00	2026-05-22 18:38:19.23047+00
e89e0793-d635-4a01-bf89-d929f44fcd13	2026-05-09	Victory Day	workday	nager.date	BY	\N	\N	2026-05-22 14:43:04.705035+00	2026-05-22 18:38:19.238692+00
be696a07-2015-4825-845c-814f0422a8ad	2026-07-03	Independence Day	workday	nager.date	BY	\N	\N	2026-05-22 14:43:04.733521+00	2026-05-22 18:38:19.246766+00
5f46269e-106c-4f03-9c8a-26471853a812	2026-11-07	October Revolution Day	workday	nager.date	BY	\N	\N	2026-05-22 14:43:04.740555+00	2026-05-22 18:38:19.281504+00
706e9332-5c8a-4f5c-b476-fdfcdbbd5f96	2026-12-25	Catholic Christmas Day	workday	nager.date	BY	\N	\N	2026-05-22 14:43:04.74811+00	2026-05-22 18:38:19.289239+00
16b4ebb0-b57c-4ebb-bd3c-bbe95ea08f9d	2027-01-01	New Year's Day	workday	nager.date	BY	\N	\N	2026-05-22 14:43:04.757785+00	2026-05-22 18:38:19.318173+00
23df1b57-c002-44c6-a75f-b6ad37aad437	2027-01-02	New Year's Day	workday	nager.date	BY	\N	\N	2026-05-22 14:43:04.765099+00	2026-05-22 18:38:19.330208+00
e464eba6-94fc-481e-b200-9a00c085442c	2027-01-07	Christmas Day (Orthodox)	workday	nager.date	BY	\N	\N	2026-05-22 14:43:04.772375+00	2026-05-22 18:38:19.362041+00
a93e7cce-e02c-41a7-9345-ae09390385f1	2027-03-08	International Women's Day	workday	nager.date	BY	\N	\N	2026-05-22 14:43:04.779772+00	2026-05-22 18:38:19.369727+00
4e838c49-841a-4e75-a837-9c79d9c642a4	2027-05-01	Labour Day	workday	nager.date	BY	\N	\N	2026-05-22 14:43:04.786572+00	2026-05-22 18:38:19.388144+00
060686d2-eb2b-4126-bb32-3158623ae377	2027-05-09	Victory Day	workday	nager.date	BY	\N	\N	2026-05-22 14:43:04.803042+00	2026-05-22 18:38:19.39465+00
63860862-4be2-4e4e-a947-3f33130e3044	2027-05-11	Commemoration Day	workday	nager.date	BY	\N	\N	2026-05-22 14:43:04.810045+00	2026-05-22 18:38:19.406637+00
d807e504-8c18-40ec-8d91-165b28b9f736	2027-07-03	Independence Day	workday	nager.date	BY	\N	\N	2026-05-22 14:43:04.817666+00	2026-05-22 18:38:19.423892+00
c3c94e7d-2740-4438-945f-904880c23017	2027-11-07	October Revolution Day	workday	nager.date	BY	\N	\N	2026-05-22 14:43:04.824312+00	2026-05-22 18:38:19.430952+00
bee456ce-1f10-4dce-9209-a241d2340f8b	2027-12-25	Catholic Christmas Day	workday	nager.date	BY	\N	\N	2026-05-22 14:43:04.831019+00	2026-05-22 18:38:19.442632+00
\.


--
-- Data for Name: infrastructure_map_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.infrastructure_map_versions (id, map_id, version_number, data, comment, created_by, created_by_name, node_count, edge_count, created_at) FROM stdin;
\.


--
-- Data for Name: infrastructure_maps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.infrastructure_maps (id, name, description, data, organization_id, created_by, created_at, updated_at) FROM stdin;
318df3bb-df93-4503-99fd-a886a5d93991	ПТК БРЕСТ		{"edges": [], "nodes": []}	\N	393ee63e-3282-4e05-bd99-dc01241e84e2	2026-05-22 10:21:56.374485+00	2026-05-22 10:21:56.374485+00
\.


--
-- Data for Name: integration_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.integration_settings (id, key, config, enabled, updated_by, created_at, updated_at) FROM stdin;
a13b1d0a-3b91-4c06-8eb1-1b1ef3efcf07	seafile	{"root": "/SD Brest/ПТК АСДТУ Брест/ИнноТех Инжиниринг", "token": "f5568eeecd534964b2202aa085d2c7366db1fd3c", "folders": {"protocol": "Протоколы/{year}/{month}/{frequency_ru}/{period}"}, "repo_id": "de20bae3-7c63-4143-9dda-bc12501ffe20", "base_url": "https://cloud.intechs.by/", "default_subdir": "/SD Brest/ПТК АСДТУ Брест/ИнноТех Инжиниринг"}	t	\N	2026-05-22 20:47:00.32883+00	2026-05-22 21:06:19.503516+00
\.


--
-- Data for Name: item_aliases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.item_aliases (id, host_id, zabbix_host_id, item_key, display_name, description, category, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: maintenance_protocols; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenance_protocols (id, site_id, frequency, period_start, period_end, status, created_by, completed_by, completed_at, notes, created_at, updated_at, ticket_id, contract_id, template_id, executor_user_id, executor_name, responsible_user_id, responsible_name, signed_executor_at, signed_responsible_at, report_date, customer_org_id, executor_org_id, header_snapshot, executor_signature_user_id, responsible_signature_user_id) FROM stdin;
40a18a3a-66e2-43ef-aae1-e49b82e25f24	aabafe11-24b9-41f6-9480-5c2873e21c7d	daily	2026-05-21	2026-05-21	completed	04eaa7fe-2753-42a7-b335-7ffe6be31c09	393ee63e-3282-4e05-bd99-dc01241e84e2	2026-05-22 21:26:30.963+00	\N	2026-05-21 13:46:27.884242+00	2026-05-22 21:26:32.058741+00	\N	\N	\N	04eaa7fe-2753-42a7-b335-7ffe6be31c09	Соловьев Алексей Александрович	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	\N	\N	\N	\N	\N	\N	04eaa7fe-2753-42a7-b335-7ffe6be31c09	393ee63e-3282-4e05-bd99-dc01241e84e2
7a574174-0c82-4101-9059-59d8c605395c	532e5161-d889-4e48-9aed-81fa29f401d0	daily	2026-05-21	2026-05-21	completed	04eaa7fe-2753-42a7-b335-7ffe6be31c09	393ee63e-3282-4e05-bd99-dc01241e84e2	2026-05-22 21:26:30.963+00	\N	2026-05-21 13:46:27.920952+00	2026-05-22 21:26:32.058741+00	\N	\N	\N	04eaa7fe-2753-42a7-b335-7ffe6be31c09	Соловьев Алексей Александрович	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	\N	\N	\N	\N	\N	\N	04eaa7fe-2753-42a7-b335-7ffe6be31c09	393ee63e-3282-4e05-bd99-dc01241e84e2
9e12c170-6bd0-4603-80ea-ca888fa43a0e	aabafe11-24b9-41f6-9480-5c2873e21c7d	daily	2026-05-22	2026-05-22	completed	393ee63e-3282-4e05-bd99-dc01241e84e2	393ee63e-3282-4e05-bd99-dc01241e84e2	2026-05-22 21:26:30.963+00	\N	2026-05-22 14:33:29.890282+00	2026-05-22 21:26:32.058741+00	\N	\N	\N	04eaa7fe-2753-42a7-b335-7ffe6be31c09	Соловьев Алексей Александрович	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	\N	\N	\N	\N	\N	\N	04eaa7fe-2753-42a7-b335-7ffe6be31c09	393ee63e-3282-4e05-bd99-dc01241e84e2
2fee15ed-84fb-408f-aaed-bd798a1dae92	532e5161-d889-4e48-9aed-81fa29f401d0	daily	2026-05-22	2026-05-22	completed	393ee63e-3282-4e05-bd99-dc01241e84e2	393ee63e-3282-4e05-bd99-dc01241e84e2	2026-05-22 21:26:30.963+00	\N	2026-05-22 14:33:30.19908+00	2026-05-22 21:26:32.058741+00	\N	\N	\N	04eaa7fe-2753-42a7-b335-7ffe6be31c09	Соловьев Алексей Александрович	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	\N	\N	\N	\N	\N	\N	04eaa7fe-2753-42a7-b335-7ffe6be31c09	393ee63e-3282-4e05-bd99-dc01241e84e2
\.


--
-- Data for Name: maintenance_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenance_schedules (id, equipment_id, task_id, next_due_date, last_completed_date, assigned_to, created_at) FROM stdin;
\.


--
-- Data for Name: maintenance_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenance_tasks (id, category_id, title, description, frequency, is_automatable, automation_script, created_at, site_id, equipment_id, organization_id, is_active, is_system, sort_order, updated_at) FROM stdin;
e0bb9c84-3747-49e0-9baa-6483be3b91a9	\N	DE. RapidBus — актуализация сигналов телеметрии	DE. RapidBus. Актуализация наборов сигналов телеметрии на приём/выдачу от смежных РУП-облэнерго	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
fccf8375-1545-4907-a726-182a9eb6ddaf	\N	DE. Загрузка координат объектов	DE. Формирование координат объектов в модели ПТК АСДТУ. Загрузка координат.	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
4978a152-9334-4654-8b1a-173d17492ee9	\N	DE. Информационный лифт — актуализация проектов	DE. Информационный лифт. Актуализация проектов преобразования для запуска задач информационного лифта	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
6c09294c-f219-4652-be6e-90e1747cfb5c	\N	DE. Информационный лифт — загрузка изменений	DE. Информационный лифт. Анализ и загрузка в рабочую модель изменений объектов от смежных РУП-облэнерго	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
42d9e9a7-587f-4195-935e-b277234fa2a4	\N	DE. Информационный лифт — настройка ответственности	DE. Информационный лифт. Настройка ответственности за моделирование и заинтересованности в объектах смежных энергосистем	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
2e293a56-acae-4679-881f-7afec1fa83ed	\N	DE. Настройка категорий записей ЭЖ	DE. Настройка категорий записей и создание шаблонов записей ЭЖ	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
08676143-693c-4ae5-8c89-ee88b1ae8f1a	\N	DE. Настройка ролей и маршрутов заявок	DE. Настройка ролей пользователей в отношении работы с заявками. Настройка типовых маршрутов заявок	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
0d5329fc-12f4-4f9a-b487-9c735022a0ca	\N	DE. Описание аналоговых и дискретных телепараметров	DE. Описание аналоговых и дискретных телепараметров с привязкой к модели электрической сети и удалённым источникам телеинформации	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
3cc68e5c-b698-43d5-a2c6-fb5710b9737b	\N	DE. Описание балансовой принадлежности	DE. Описание балансовой принадлежности оборудования	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
fd2b22ff-5ef1-4987-a5ed-62c3ff33a60b	\N	DE. Описание зон ответственности	DE. Описание зон ответственности для оборудования РУП "Брестэнерго"	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
3a914fa9-ba6d-48e9-a691-366b47279824	\N	DE. Описание зон управления оперативного персонала	DE. Описание зон управления оперативного персонала, с учётом описания пограничного оборудования	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
3a5a3bdc-5cf3-4d07-a90b-7e36416c3288	\N	DE. Описание команд телеуправления	DE. Описание команд телеуправления. Описание дискретных значений с источником значения "оператор" для нетелемеханизированных КА	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
c590119c-c5ea-4b50-9fce-b51b4a9dacf2	\N	DE. Описание оборудования и электрических связей	Data Engineering. Описание оборудования и электрических связей. Создание схем ТП/РП/ПС	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
bf64da24-e380-4fd8-8398-760000fd29e4	\N	DE. Описание пользователей и прав в модели	DE. Описание пользователей и их прав в информационной модели	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
3bf451cb-53b1-473a-bffd-3eb49215fbee	\N	DE. Описание сети обмена информацией	DE. Описание сети обмена информацией	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
77f78f69-8034-4815-8f6f-383cb0189ba8	\N	DE. Описание типовых бланков переключений	DE. Описание типовых бланков переключений. Создание шаблонов ключевых операций	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
f81d9874-9f0e-4164-b904-7bc9d33d09a1	\N	DE. Описание электрических характеристик	DE. Описание электрических характеристик оборудования на основе паспортных данных	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
5e1f6947-826a-4bb0-b1aa-7a70cb965368	\N	DE. Пределы контроля напряжения	DE. Пределы контроля напряжения	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
c43eee0a-92d9-41b8-8df3-3d7ddbf56a76	\N	DE. Пределы контроля токовой нагрузки	DE. Пределы контроля токовой нагрузки	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
55afaa14-374e-49dc-bc78-e71b78dc8b04	\N	DE. Создание сигналов из АСКУЭ	DE. Создание сигналов телеизмерений на основании данных из системы АСКУЭ (для точек технического учёта)	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
5e718937-f576-4d56-946b-89faf5e5334e	\N	DE. Создание схем сетей	DE. Создание схем сетей, в том числе для работы на средствах отображения информации коллективного пользования	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
2de87aa1-335a-4698-9cd4-d3212d871926	\N	DE. Формирование координат из внешних систем	DE. Формирование координат объектов модели из внешних систем	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
a742f69c-8244-4c99-bb18-c561a450cfa3	\N	Актуализация данных контрольный замер	Актуализация данных в подсистеме контрольный замер	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
d6d704f2-3134-4d81-b36d-e49061cae126	\N	Актуализация данных о пользователях	Актуализация данных о пользователях: должности, права, организация, подразделение	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
dc5b842d-42bc-4a2c-bbb4-0698dbc114ea	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Актуализация документации	Актуализация документации (схемы, IP-адреса, креды и т.д.)	monthly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
83fdfee8-69eb-450e-a1dc-27136d5e1e77	\N	Актуализация конвейеров операций	Внесение изменений и актуализация конвейеров операций для обработки сообщений	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
4c4ff812-25c8-4e65-86b3-c2130253f8df	\N	Актуализация прав пользователей	Актуализация прав и информации о пользователе: организация, подразделение, должность	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
04a93f6d-ab25-45ac-a1f2-2a766ac9c0d1	\N	Актуализация справочников оборудования	Актуализация справочников по оборудованию	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
9af10ca2-bb0d-4a9c-a94d-fa35528c670b	\N	Актуализация сценариев JournalBus	Актуализация сценариев работы сервисов JournalBus (RapidBus)	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
b830d419-4404-4446-bb61-b6ad87bd31f7	\N	Актуализация сценариев MeasBus	Актуализация сценариев работы сервисов MeasBus (RapidBus)	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
54de01b5-6711-4e2f-b4e5-83b8a658c1ea	\N	Анализ деградации производительности	Анализ деградации производительности	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
83edb828-b64a-4fd9-bbea-08f919024623	0160807a-6715-49e1-aaea-b9eef51e2311	Анализ загрузки пулов	Анализ загрузки пулов хранения, latency, IOPS	weekly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
2bbf52cf-3942-43da-9e74-1ccab5d8f5b7	\N	Анализ логирования HTTP-запросов	Анализ логирования HTTP-запросов, ошибок, отказов	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
7e72c804-939e-4279-a058-80a48ead0e1e	0160807a-6715-49e1-aaea-b9eef51e2311	Анализ логов событий СХД	Анализ логов событий (деградация RAID, failover)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
1746d077-50f9-4e2d-82be-2523cb6b249c	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Анализ отчётов CPU/RAM/DISK	Сбор и анализ отчётов по CPU/RAM/DISK из vCenter (нагрузка, пики, тенденции)	weekly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
ff084417-9995-4d11-a3c9-6033614acfeb	\N	Апгрейд бэкап-сервера	Проведение апгрейдов аппаратной части с проведением стресс-теста	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
f5235fa0-9d4c-49b4-9572-9ce325bc831d	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Апгрейд серверов	Проведение апгрейдов аппаратной части с проведением стресс-теста	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
6c1faf4b-5455-4f1e-9dd4-a52392010f57	0160807a-6715-49e1-aaea-b9eef51e2311	Апгрейд СХД	Проведение апгрейдов аппаратной части с проведением стресс-теста	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
40fed8d4-2408-4e91-998d-04548cf33cf1	\N	Архивирование журналов	Хранение и архивирование журналов в соответствии с политикой	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
994c66a3-7a5f-4398-b58b-c6e7005476c4	\N	Аудит информационного обмена РС-20	Аудит и мониторинг информационного обмена сервисов компонентов РС-20	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
df7f131c-ad24-413e-8640-dac8493be026	\N	Аудит сервисов ПТК на ВМ	Аудит работы и корректности запуска на ВМ сервисов ПТК (СК-11)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
eca4dc1e-49d0-4ce2-9b72-be775c3ae149	\N	Бэкап и восстановление etcd	Бэкап и восстановление etcd	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
d032c4c3-1bb0-43e3-878c-c5c5f7238324	e19a6825-ea2f-4703-9299-e9c17e49a0a2	Бэкап конфигурации МСЭ	Резервное копирование конфигурации и security policy	monthly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
0ed8bcf0-e1f3-473f-b183-7f0fe773b79b	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Бэкап настроек хоста	Создание бэкап-файла настроек хоста (BIOS, ESXi)	monthly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
609bab0d-72bd-4ee9-80fd-3f4d1db92bed	\N	Ведение журналов событий терминального доступа	Ведение журналов событий, проверка служб терминального доступа	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
011aa579-858b-4fec-a3cb-bed8bdd9f82d	\N	Ведение и анализ журналов СК-11	Ведение и анализ системных и пользовательских журналов	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
8a2d8daa-1687-4d8d-b54d-7864bd8d7887	\N	Выгрузка логов по инцидентам	Выгрузка логов по инцидентам	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
a0498893-beb3-4500-adcc-f56270dab200	\N	Выполнение VACUUM, ANALYZE, бэкапы	Выполнение регламентных процедур: VACUUM, ANALYZE, бэкапы, очистка архивов	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
8c16dfa4-433d-44fb-aa00-82b12b83febc	\N	Диагностика ошибок и перезапуск при сбоях	Диагностика ошибок и перезапуск при сбоях	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
f0e29cf3-85c5-4f2a-8f68-6c3c6bd32e55	\N	Добавление новых видов местоположений VTM	Добавление новых видов местоположений (VTM) в БД платформы	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
c071fc1e-af9a-490b-bcdf-af80b46d511c	\N	Ежедневный мониторинг ресурсов ПТК	Ежедневный мониторинг ресурсов (CPU, RAM, Disk, Network)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
57fd4ed6-1e50-4070-8de3-c92de1dc4ddf	\N	Заведение пользователей в AD	Заведение новых пользователей в AD и привязка к ролям в ПТК	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
d7466c7f-713c-4d58-8c59-5452d42d7f8c	\N	Заведение пользователей в AD (детально)	Заведение пользователей в AD	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
cd4d281e-4edf-4f95-b254-cf2123e888be	\N	Заведение пользователей в ПТК СК11/РС20	Заведение пользователей и описание прав в ПТК (СК11/РС20)	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
5db7430d-36db-4445-adde-57b5cb3f1531	\N	Заведение пользователей и настройка RDP	Заведение новых пользователей и настройка доступа через RDP	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
d290922b-7560-4e82-a277-9128908c8af2	\N	Замена элементов S5735	Замена отказавших SFP модулей/патч-кордов/блоков питания	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
c5b69a85-ded7-4839-916d-a06d6dee6502	\N	Замена элементов коммутатора ядра	Замена отказавших SFP модулей/патч-кордов/блоков питания	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
223aeebc-f9a8-4e81-a864-39e87771f8ff	\N	Замена элементов маршрутизатора	Замена отказавших SFP модулей/патч-кордов/блоков питания	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
1868376b-9acf-44ff-9c36-722ecf540cd2	\N	Изменение VLAN/VRF S5735	Изменение топологии VLAN или настройка новых VRF	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
a7434bd8-5d03-4f2e-9931-b68a56d6f8e2	\N	Изменение VLAN/VRF коммутатора ядра	Изменение топологии VLAN или настройка новых VRF	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
b567b30f-679a-4280-b7a2-b505b52e3b03	\N	Изменение настроек маршрутизатора	Изменение настроек при изменении топологии	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
0d758bb3-4ace-469e-b347-574e487b949e	\N	Инсталляция клиентского ПО	Инсталяция нового клиентского ПО (Толстые клиенты, АРМ ОВБ)	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
e1a82738-48f0-4d7a-b8f5-ae552d02eece	\N	Инсталляция клиентского ПО (пользователям)	Инсталяция нового клиентского ПО (Толстые клиенты, АРМ ОВБ) для пользователей	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
46c90232-8f81-49a5-84e3-5eada2ab01e3	\N	Командное управление сервисами СК	Командное управление сервисами СК (запуск/остановка/перезапуск)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
45d8f683-07a9-45c7-a3b0-13aff1ad5c51	\N	Консультации по бэкап-серверу	Оказание консультаций по вопросам эксплуатации сервера	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
224abab8-bdd8-4ae4-8f7d-6eeb9eb5ac50	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Консультации по серверам	Оказание консультаций по вопросам эксплуатации серверов	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
7702248c-fde2-4c04-85ed-edfc71357938	0160807a-6715-49e1-aaea-b9eef51e2311	Консультации по СХД	Оказание консультаций по вопросам эксплуатации СХД	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
440a77f7-4e37-4367-b159-d72cc06f54da	\N	Консультации по устранению неисправностей	Консультации по устранению неисправностей в случае невозможности устранить дистанционно	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
78a320a0-31c8-4145-9b65-d1b8ee4fc8f7	\N	Контроль Агентов на станциях и серверах	Контроль запуска и состояния Агентов на рабочих станциях и серверных узлах	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
812f8dcd-a92b-46dc-b9ec-18b272872999	\N	Контроль доступности серверов SCADA/EMS/Web/СУБД	Контроль доступности серверов SCADA/EMS, Web и СУБД	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
ec95e8fd-2203-46f6-b941-0e19cb62d92f	\N	Контроль загрузки CPU, памяти, файловых систем	Контроль загрузки процессора, памяти, файловых систем на ВМ Astra Linux	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
cf1ead87-bc0e-4710-8356-8791329f48d1	\N	Контроль потребления ресурсов службами	Контроль потребления ресурсов отдельными службами	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
cdd2f7af-be6e-457a-a465-13900fd2449b	\N	Контроль размеров баз и WAL-журналов	Контроль размеров баз, таблиц и WAL-журналов	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
e48c91a4-3b94-463c-8977-5e35344d1315	\N	Контроль состояния терминальных серверов	Контроль состояния терминальных серверов Windows Server	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
ee38dee8-cd1e-4ee0-bac4-5b115ced845c	\N	Корректировка области контроля	Корректировка области контроля РУП "Брестэнерго" и филиалов электрических сетей	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
8fa621a8-6eca-477e-9445-ba48ed975be5	\N	Корректировка профиля ЦМП	Корректировка и актуализация профиля ЦМП и профилей информационного обмена	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
367f086f-4157-49c5-a776-89e86176f823	\N	Массовые операции по обновлению и перезапуску	Массовые операции по обновлению и перезапуску	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
23a4dd58-3f33-400f-b5b5-10c6c46b9c06	\N	Минорные обновления SofIT-SCADA-Plus	Выполнение минорных обновлений ПК SofIT-SCADA-Plus (ЦППС)	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
81af9c2e-f599-47e5-8b27-b29b5cc577cd	\N	Мониторинг IPMI	Мониторинг состояния по IPMI (температура, питание, вентиляторы, аппаратные алерты)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
e01773e0-ebb9-471a-be8c-98f2951a1454	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Мониторинг VM и хостов через vCenter	Мониторинг производительности VM и хостов через vCenter	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
72ed8bbc-c906-462b-91ae-5c8e602a9581	\N	Мониторинг логов коммутатора ядра	Мониторинг логов событий (display logbuffer)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
f5fcaeab-8802-4e50-b73d-4a057431d3fd	\N	Мониторинг подов и namespace	Мониторинг подов и namespace	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
7c2ee432-f7a2-468a-91a4-d6da3a69ee91	\N	Мониторинг работоспособности толстых клиентов	Мониторинг работоспособности толстых клиентов	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
56e7195e-9d95-41eb-b776-924d6ead8b45	\N	Мониторинг репликации PostgreSQL	Мониторинг репликации (если включена), переключение мастера при отказе	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
cc4e1923-cc71-4714-8566-d52993e25c5d	\N	Назначение ролей в SCADA/EMS/Web/PostgreSQL	Назначение ролей в SCADA/EMS, Web-интерфейсах и PostgreSQL	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
eb0f8771-4b08-45a8-875b-464c5d9bb05a	\N	Настройка Журнала дефектов	Настройка функций журнала "Журнал дефектов"	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
6eef3ef0-1888-41ec-814e-d1fbe7b4c5fc	\N	Настройка Журнала обращений абонентов	Настройка функций журнала "Журнал обращений абонентов"	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
a7232adf-1d19-45ce-80e7-6c876be3ceb1	\N	Настройка Журнала техн. распоряжений	Настройка функций журнала "Журнал технических и административных распоряжений"	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
e5f5bc61-2e1a-4c5b-b5fb-891859edb488	\N	Настройка Журнала уведомлений абонентов	Настройка функций журнала "Журнал уведомлений абонентов"	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
8fb694bf-3b64-4dd2-ae84-766a81f9602a	\N	Настройка зон ответственности	Настройка зон ответственности и настройка технологического управления/ведения	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
01fa2de5-95b1-48e3-905f-dd574bca2d3d	\N	Настройка Нарядов-допусков	Настройка функций журнала "Ведение нарядов-допусков и распоряжений"	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
1205e115-9d7e-463f-941c-174997a3f652	\N	Настройка Оперативного журнала	Настройка функций журнала "Оперативный журнал"	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
5223ebdb-1de7-46fa-b254-8635d9813059	\N	Настройка передачи данных о потреблении	Настройка передачи данных о потреблении электрической энергии	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
1c165b8d-15af-46e9-aafd-07ec6bb32143	\N	Настройка расчётов ТКЗ	Настройка расчётов ТКЗ, проверок оборудования на стойкость к ТКЗ, отключающей способности КА, определения места повреждения	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
c20cfddc-5efb-48cd-8b7e-e369dfe47a93	\N	Настройка системы OMS	Настройка функций системы планирования и выполнения переключений (OMS)	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
ec151a25-440b-4bb8-951a-60f8fa5c42aa	\N	Настройка служб автозапуска и таймеров	Настройка служб автозапуска, таймеров (systemd)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
1c0d74fb-1997-46a7-b219-526c3745a498	\N	Настройка Управления заявками	Настройка функций журнала "Управление заявками"	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
85cba0bd-a6f7-44cd-a686-1568c1d6fbb6	\N	Настройка установившегося режима	Настройка установившегося режима, оценки состояния на участке сети. Подготовка базовых моделей для анализа надёжности (n-1)	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
51320ebd-728d-41e1-9699-45788a43ecbd	\N	Обновление Helm-чартов	Обновление Helm-чартов и rollout новых версий сервисов	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
e4bfe8b5-c3a4-4e61-9abe-65e0b88c21f5	\N	Обновление jsonata-преобразования	Обновление jsonata-преобразования	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
da45e836-2b9c-4a32-9d06-26a8b43118a0	\N	Обновление атрибутного состава СУПА_АСДУ	Обновление атрибутного состава СУПА_АСДУ (маппинг классов, атрибутов, типов данных)	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
bb3df5a0-98ad-41ca-a1f5-e7dfd20e7ddb	\N	Обновление компонентов кластера K8s	Обновление компонентов кластера: kube-apiserver, kubelet, etcd	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
da0c7d0b-840b-427b-8b7c-84efc9be33ad	\N	Обновление конфигурации и параметров обмена	Обновление конфигурации и параметров обмена	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
94cd0fb9-ff2f-4f6d-94f5-bd58dce68395	\N	Обновление ПО бэкапа	Установка обновлений ПО резервного копирования	monthly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
1d915093-a1ee-46ab-9a65-63578496c820	\N	Обновление прошивок S5735	Проверка наличия и установка актуальных прошивок	monthly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
e0d78691-f227-463d-9625-2d4017d00ea6	\N	Обновление прошивок коммутатора ядра	Проверка и установка обновлений прошивок	monthly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
44271559-f1cb-4bf5-a9f6-d7612753294a	\N	Обновление прошивок маршрутизатора	Установка обновлений прошивок	monthly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
47a51de8-c155-417f-8fe0-565d33e90333	\N	Обновление системных пакетов APT	Обновление системных пакетов (APT), при необходимости — с предварительным тестированием	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
4aa53d35-04bd-4aea-ab45-6d99e8c22e14	\N	Обновление системы и критических компонентов WS	Обновление системы и критических компонентов Windows Server	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
fc66d752-b89b-4891-b8ea-21c4286b3929	\N	Обновления безопасности CentOS	Установка обновлений безопасности через yum (без обновлений ядра)	monthly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
81479afb-a8cb-4ae9-8645-7010d923b3e1	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Обновления безопасности ESXi	Установка критических обновлений безопасности ESXi	monthly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
53fb83dc-83ad-4436-b5fd-d5c3a0d29352	\N	Обработка данных о пользователях	Обработка данных о пользователях: должности, права, организация, подразделение	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
f184d7b1-6000-4a67-8864-98d225cd45db	\N	Обработка/дозапрос данных об управлении	Обработка/дозапрос данных об управлении/ведении	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
db552fa7-40d4-4f8b-ae35-535d9a38f422	\N	Оповещения при пороговых значениях	Оповещения при достижении пороговых значений	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
59703fc1-3792-4e00-ba45-d2612bdf9cd2	\N	Отслеживание ресурсов серверных узлов	Отслеживание использования CPU, RAM, дискового пространства на узлах	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
8e796b75-8fc5-4570-a7f6-3b18b2f64d3d	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Отчёт за период (PDF)	Формирование и передача заказчику подробного отчёта за период обслуживания	monthly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
22b262b0-9cca-423a-a6a2-ca116caf2f80	0160807a-6715-49e1-aaea-b9eef51e2311	Отчёт СХД для заказчика	Формирование отчёта для заказчика	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
c768a363-a74b-4cd6-b7e2-04a1e7591121	\N	Очистка временных файлов и логов	Очистка временных файлов, логов	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
b5815e5d-6eeb-410a-af73-abb40e08c9b6	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Очистка журналов iBMC	Очистка журналов iBMC после выгрузки логов	monthly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
cb1dbca0-737b-4b24-a6a6-66bc68058d20	\N	Очистка логов S5735	Очистка логов после выгрузки	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
6debbac9-c4cf-4c3f-8f5f-5eb22a4d42ab	\N	Очистка логов коммутатора ядра	Очистка логов после выгрузки	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
189fdc7d-a544-4483-bbf0-95966cb913bf	\N	Очистка логов маршрутизатора	Очистка логов после выгрузки	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
2aad1258-74a4-4e9d-8d06-4e2c145a65c8	e19a6825-ea2f-4703-9299-e9c17e49a0a2	Очистка логов МСЭ	Очистка логов после выгрузки	monthly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
4e576c2f-4b0f-4d0f-a8fb-496465ebc218	\N	Очистка старых логов кворума	Очистка старых логов (logrotate, rm old logs)	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
fbc7622d-d6df-4d05-8ff6-46299d5f1a40	\N	Перенос VM кворума	Перенос VM на другой хост	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
63f16202-ed97-4982-87d8-1e10f241aff6	\N	Перенос данных при сбое	Перенос данных на альтернативное хранилище в случае сбоя	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
874840e0-debf-4213-bd7f-e700f822257b	0160807a-6715-49e1-aaea-b9eef51e2311	Перепланирование пула хранения	Добавление новых LUN и хост-групп	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
64e956a4-be13-4d6f-8e83-56ac4198c130	\N	Плановый перезапуск сервисов	Плановый перезапуск сервисов (по согласованию)	monthly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
21f9f74b-d38a-49ea-9f0a-5ff062ad9a25	\N	Поддержка архивных экземпляров БД	Поддержка архивных экземпляров баз данных (db-his)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
4d2275e3-0590-4352-9bc4-42738e2fa3e3	\N	Поддержка управления лицензиями RDS	Поддержка управления лицензиями RDS (при наличии)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
45ccc5b1-83ee-4990-b248-71593dd0b926	\N	Поток координат СУПА-ZuluGIS	Информационный поток о координатах опор и ПС между СУПА, ПТК АСДТУ и ZuluGIS	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
e316c245-f577-4926-93fe-9480cc6989a8	\N	Поток оборудования СУПА-АСДТУ	Информационный поток по контейнерам оборудования между СУПА и ПТК АСДТУ	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
87b83845-612c-4845-8b87-812cb057f11b	\N	Поток учёта ПО Счётчик-АГАТ-АСДТУ	Информационный поток данных точек учёта и приборов учёта между ПО Счетчик, АГАТ-М и ПТК АСДТУ	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
67b86d78-9220-49d3-b09d-59046b7c4f83	\N	Потоковое тестирование интеграции	Проведение потокового тестирования (проверка корректности передачи данных между системами)	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
8f0844ab-cade-4aa7-af50-acf8b8ac8392	\N	Проверка CPU/RAM S5735	Проверка загрузки CPU и памяти	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
2f5c71f2-622b-4d6e-b887-8a8661d3ba9c	\N	Проверка CPU/RAM кворума	Проверка загрузки CPU и памяти (top / free -m)	weekly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
c8ab532b-2912-4ba1-bf23-5b6a9675e891	\N	Проверка CPU/RAM коммутатора ядра	Проверка нагрузки CPU и памяти	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
a6bb2a07-c44e-4fee-8b04-624ec4fbf63a	\N	Проверка CPU/RAM маршрутизатора	Проверка загрузки CPU и памяти	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
f6f96670-c693-47ec-96dd-0d65cc2fac0d	e19a6825-ea2f-4703-9299-e9c17e49a0a2	Проверка CPU/RAM/сессий МСЭ	Проверка загрузки CPU, памяти и сессий	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
77bbb08a-9670-4adf-939b-a0dcd37c9c1b	0160807a-6715-49e1-aaea-b9eef51e2311	Проверка HyperMetro Pair	Проверка статуса HyperMetro Pair (отсутствие split-brain)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
5fdeb460-b383-4596-8173-8fe391e7edce	0160807a-6715-49e1-aaea-b9eef51e2311	Проверка iSCSI портов	Проверка статуса iSCSI портов	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
f044296b-1afd-46da-8edb-711c68aba7a4	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Проверка LACP	Проверка функциональности LACP	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
9b4da2fa-11a6-4303-be2b-5776a6dc3ecd	0160807a-6715-49e1-aaea-b9eef51e2311	Проверка LUN и хост-коннектов	Проверка доступности LUN и хост-коннектов	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
4b9b4058-c33c-4b40-95e5-1f899b7698c1	\N	Проверка MAC таблицы	Проверка таблицы MAC адресов на избыточность, дубли и петли	weekly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
906f4775-acf7-4644-b2dc-dc45934ba02d	\N	Проверка MAC-адресов S5735	Проверка таблицы MAC-адресов (поиск неизвестных устройств)	weekly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
1a1bd840-6ad4-402a-9750-11b3b5c0786f	0160807a-6715-49e1-aaea-b9eef51e2311	Проверка Multipath на хостах	Проверка настроек Multipath на хостах (балансировка трафика)	monthly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
63c6ca5c-4c35-4f17-a374-abc34c6766b3	\N	Проверка NTP кворума	Проверка корректности временной зоны и синхронизации NTP	weekly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
fe7bc2c6-3f89-4e0f-9eb5-03d1408a0507	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Проверка NTP синхронизации	Проверка синхронизации времени хостов (NTP)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
e7d6645c-bf43-48b2-96d1-a4e2489a1e31	\N	Проверка OSPF соседей	Проверка соседей и состояния маршрутов в OSPF	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
ee5f2798-ae12-4a1c-813b-187f99e153f6	e19a6825-ea2f-4703-9299-e9c17e49a0a2	Проверка OSPF/VRRP МСЭ	Проверка OSPF/VRRP состояний	weekly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
fa1204e3-a999-45e2-84f1-557c14347cb1	\N	Проверка PSU бэкап-сервера	Проверка работоспособности обоих блоков питания (PSU)	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
fc3640bb-3056-492c-a0bf-616ca1d36c31	\N	Проверка PSU и SFP+ коммутатора ядра	Проверка резервных блоков питания и состояния портов SFP+	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
3ec306ac-bb24-49b7-8c28-9674c8b4f0bf	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Проверка RAID-массивов	Проверка целостности RAID-массивов через Huawei RAID CLI/WebGUI	weekly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
cbe5729c-fff2-4eb5-aea3-9711c0868ee1	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Проверка S.M.A.R.T. дисков	Проверка статуса S.M.A.R.T. системных дисков. Прогнозирование замен	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
0a918532-cd1a-4030-80de-06c1737001dc	\N	Проверка SMART дисков бэкап-сервера	Проверка SMART-параметров всех дисков (wear level, bad sectors)	weekly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
975a504a-b40b-44db-b4e9-6e93e0f50c5e	\N	Проверка uplink и istack	Проверка состояния uplink-портов и istack	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
ef8febe1-5242-4a4c-89ae-402cad6c7a58	e19a6825-ea2f-4703-9299-e9c17e49a0a2	Проверка user access МСЭ	Перепроверка настроек user access (администраторы, роли)	weekly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
2871cbf8-9c44-424e-bc90-c848d59c4872	e19a6825-ea2f-4703-9299-e9c17e49a0a2	Проверка питания и кабелей МСЭ	Проверка питания, кабелей и портов	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
9b1180f3-8170-40e9-a21d-f082cb480b1f	\N	Проверка аплинков к СХД/серверам	Проверка состояния аплинков к СХД, серверам, межсетевым экранам	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
00b0a790-0689-46da-925d-48d9d4f1821c	\N	Проверка безопасности S5735	Проверка журналов безопасности: попытки несанкционированного доступа	weekly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
d4a6f534-b6a5-4ae8-a06d-b7f3a6d0984b	\N	Проверка безопасности маршрутизатора	Проверка логов безопасности: попытки входа, неуспешная аутентификация	weekly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
55563828-0f0b-4b0c-b95d-acbb8f83ae6f	\N	Проверка динамической маршрутизации	Проверка состояния протоколов динамической маршрутизации (OSPF)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
3bfc5834-eaba-4c3d-b82e-f2a74eb30dca	\N	Проверка доступности кворума	Проверка доступности по ping и ssh	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
335dc9f5-ee0d-4ea3-9d32-78b49c554073	\N	Проверка доступности сервера бэкапа	Проверка доступности сервера в сети (ping, RDP) для агентов КиберБэкап	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
3de55700-3af8-4f44-9edb-653db4c4b70c	e19a6825-ea2f-4703-9299-e9c17e49a0a2	Проверка доступности узлов кластера МСЭ	Проверка доступности обоих узлов кластера по SNMP и Ping	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
90e72c62-d36e-4561-9c1e-765c7504eb73	\N	Проверка доступности устройств через S5735	Проверка доступности ключевых устройств (BMC серверов, IPMI, кворум)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
77dbd755-b2cf-4662-9f79-9d75b9efa46c	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Проверка доступности хостов	Проверка доступности хостов через ping и ssh	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
e72d81ff-eae7-4d6d-bc8e-8fe53798cea9	\N	Проверка журналов systemd кворума	Проверка журналов systemd и cron	weekly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
cce27dbe-160a-4844-b83a-cb5715812517	\N	Проверка журналов ошибок ПТК	Проверка журналов ошибок	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
d09c84a2-42f7-4426-8d44-e295b8be8d90	\N	Проверка загрузки портов	Проверка загрузки портов (interface traffic statistics)	monthly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
257b0f05-b370-4607-8ce6-84aec9080d49	\N	Проверка и перезапуск web-сервисов	Проверка и перезапуск web-сервисов	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
40cd9142-c1c4-4969-9fd0-ba27e1553ba2	\N	Проверка и перезапуск сервисов ПТК	Проверка и перезапуск сервисов ПТК (scada, postgres, web и др.)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
04cf7aec-891f-4e11-9f9d-519d018a6fec	\N	Проверка интерфейсов маршрутизатора	Проверка интерфейсов на ошибки и сбои линков	weekly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
7e0a2438-8c89-41fb-a9b8-ed5042927c85	\N	Проверка кабелей бэкап-сервера	Проверка всех кабелей питания и интерфейсных кабелей	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
e12b40d5-5c7c-4442-a09e-c068cc86b917	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Проверка кворума и кластера	Проверка целостности кворума и связности кластера (HA, DRS)	weekly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
b27a7401-ec11-43be-8ecc-565bdbdf1c80	0160807a-6715-49e1-aaea-b9eef51e2311	Проверка контроллеров и дисков	Проверка статуса контроллеров и дисков через веб-интерфейс и CLI	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
3326319a-a343-4ba3-9a5b-2adf2a66c746	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Проверка лицензий VMware	Проверка актуальности лицензий VMware	monthly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
4843f275-7fd4-4535-af72-3c7ae687ea3a	\N	Проверка лицензий и места	Проверка актуальности лицензий и планирование свободного места	monthly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
3b9212c5-4025-4b18-8bb7-ed02011acd4c	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Проверка логов ESXi	Проверка логов системных ошибок гипервизора VMware ESXi (hardware events)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
2e1b030d-b55d-46df-a3be-404bb7a368cf	\N	Проверка логов S5735	Проверка логов (display logbuffer)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
13b241b5-e959-48b8-b741-86d932fb1e7c	\N	Проверка логов Windows	Проверка логов Windows (Журнал событий: System, Application)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
b0e855bf-75d3-45b9-af72-cc7a1754aed8	e19a6825-ea2f-4703-9299-e9c17e49a0a2	Проверка логов безопасности МСЭ	Проверка логов безопасности (severity major)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
3f3a4628-3be8-4cef-8480-46d2fb99c9f9	\N	Проверка логов бэкапа	Проверка логов успешного завершения задач бэкапа	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
b4f32f00-af34-4e60-ace0-f37843d5f2ab	\N	Проверка логов кворума	Проверка логов /var/log/messages и логов кворума	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
41b19327-d33c-45fa-bc37-b0346414a85b	\N	Проверка логов маршрутизатора	Проверка логов маршрутизатора (display logbuffer)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
a2f740a5-867d-40c4-9dee-9ef96886554c	\N	Проверка места на диске кворума	Проверка места на системном диске (df -h) на предмет переполнения	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
4effead1-9f24-4e2e-a33f-fdb64a8bf370	0160807a-6715-49e1-aaea-b9eef51e2311	Проверка мультипассов	Проверка мультипассов и отказоустойчивости на серверах (multipath)	weekly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
eebdc4eb-df2c-4064-9875-5d0267660480	\N	Проверка наличия актуальных бэкапов	Проверка наличия актуальных бэкапов	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
0ad998fb-11eb-4afd-96dd-a5f3d4caf9e1	\N	Проверка настроек стека	Проверка согласованности настроек стека (priority, domain id, link-delay)	monthly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
623a3649-d979-460e-89d5-d6c146d01187	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Проверка ОЗУ и кабельменеджмента	Проверка фиксации планок ОЗУ, внутрикорпусного кабельменеджмента	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
74cfa40f-550d-42b9-ad18-8bba436c2820	\N	Проверка питания и кабелей маршрутизатора	Проверка питания, кабелей и резервных БП	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
ae7485ed-99ac-4877-a4e9-bc8eec213300	\N	Проверка планов бэкапов	Проверка планов и расписания бэкапов	weekly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
60202ee0-3b3f-470a-b5e1-8fba007dc963	\N	Проверка портов и SFP S5735	Визуальная проверка портов и SFP	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
9d710531-240d-4c93-a8b4-285c57001c93	\N	Проверка портов коммутатора ядра	Проверка физического состояния портов	weekly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
f95c92cc-fde9-46df-b86f-6222f0dc0a11	\N	Проверка пропускной способности	Проверка пропускной способности интерфейсов (traffic statistics)	monthly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
e2bf2145-1132-4817-9acf-9e155b0cd7a9	e19a6825-ea2f-4703-9299-e9c17e49a0a2	Проверка резервных PSU МСЭ	Проверка резервных блоков питания	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
dff31d86-d6ab-4125-9e24-2205029a8379	\N	Проверка свободного места	Проверка свободного места на целевых томах хранения	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
48e071b5-3332-4582-948b-bffc48d3ca9c	\N	Проверка связи кворума с СХД	Проверка доступности с него обеих СХД по IPMI	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
ce5811e7-b6bb-4a33-953a-194b7a294da3	\N	Проверка сервисов через CLI и агенты	Проверка состояния сервисов через CLI и удалённые агенты	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
46ee7d3c-a17e-4dac-812a-22f4ac7d6edc	e19a6825-ea2f-4703-9299-e9c17e49a0a2	Проверка сессий и интерфейсов МСЭ	Проверка количества активных сессий и загрузки интерфейсов	weekly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
84591874-cb5c-4e37-b908-f2b1efb043a2	\N	Проверка сетевого взаимодействия агентов	Проверка логов сетевого взаимодействия агентов и сервера	monthly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
fb660454-871c-4436-ab39-6a61f64e044b	\N	Проверка системных журналов	Проверка системных журналов (journalctl, syslog, dmesg)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
582e915f-9b54-411e-b3c6-49135130ded1	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Проверка слотов и PSU	Проверка всех слотов, блоков питания (отключение одного PSU), состояния шкафа	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
9cbaea41-b097-468b-a55d-1b60d825ab04	\N	Проверка служб КиберБэкап	Проверка состояния служб КиберБэкап (Management Service, Agent Service и др.)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
4be05588-7ad7-4cec-9f5d-112bcaecdd21	\N	Проверка службы кворума	Проверка состояния службы кворума (systemctl status quorum-service)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
be2fd2b2-0039-4e17-b2b1-9f3e2fc33c6b	\N	Проверка соединения с сервером управления	Проверка соединения с сервером управления	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
f120e862-68f0-40eb-a84a-b6927ce51a90	\N	Проверка состояния кластера PostgreSQL	Ежедневная проверка состояния кластера PostgreSQL	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
d28459b3-7fc0-44ed-bc18-6bd79a3a2b0b	e19a6825-ea2f-4703-9299-e9c17e49a0a2	Проверка состояния кластера МСЭ	Проверка состояния кластера (display hrp state)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
b5547bbf-ab34-4882-9846-fba230b69a7b	\N	Проверка состояния нод Kubernetes	Проверка состояния нод (kubectl get nodes, describe node)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
707c6d78-6d9f-47dd-8186-917ec255ffb2	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Проверка статуса через iBMC	Проверка температуры, питания, вентиляторов, событий через iBMC	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
264c7e4d-cba6-4ec5-8cfd-0a9859c64c14	\N	Проверка таблиц маршрутизации и NAT	Проверка таблиц маршрутизации и NAT	weekly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
125e4cf2-46e4-4d20-9fb5-09a7482f5fdf	0160807a-6715-49e1-aaea-b9eef51e2311	Проверка температуры и питания СХД	Проверка температуры, питания, состояния вентиляторов в Device Manager	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
d77fe616-4dcf-4849-9030-57297344d923	\N	Протяжка кабелей S5735	Проверка и протяжка кабелей	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
62982141-0323-420a-a6fa-b80b62df24ae	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Протяжка кабелей в шкафу	Проверка и протяжка кабелей питания и сетевых кабелей внутри шкафа	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
e1c55811-877d-44ab-a45b-1a695afe04a7	\N	Протяжка кабелей коммутатора ядра	Проверка и протяжка оптических и медных кабелей	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
17cde66f-5f37-4584-b536-839c182c1216	0160807a-6715-49e1-aaea-b9eef51e2311	Протяжка кабелей СХД	Проверка и протяжка кабелей	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
64c1aa57-1dbf-4e8c-83cd-2325b8ba0e13	\N	Работа с профилями и группами пользователей	Работа с профилями и группами пользователей	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
f711067b-79af-4f48-9880-bb663b9b86d8	\N	Редактирование частных профилей СУПА	Редактирование частных профилей согласно обновлённым форматам сообщений json из СУПА	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
176da871-9614-4b4b-8f25-5fd2afbf2783	\N	Сохранение конфигурации S5735	Сохранение текущей конфигурации	weekly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
0ced0ba6-ff9b-4353-8b11-4771481b33a6	\N	Сохранение конфигурации коммутатора ядра	Сохранение текущей конфигурации	weekly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
c2e9a9e3-6bde-4ef8-99e5-b773994520eb	\N	Сохранение конфигурации маршрутизатора	Сохранение текущей конфигурации	weekly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
e39d9753-e75f-4cec-9c96-048714a35730	\N	Тест OSPF failover	Проверка работоспособности отказоустойчивости (OSPF failover)	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
3a490567-e469-4636-af6c-ca65a5b5dca3	\N	Тест кворума при остановке СХД	Проверка работоспособности кворум-сервиса при остановке одной из СХД	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
24da51a9-1040-46e2-8e73-8f19415e35dd	0160807a-6715-49e1-aaea-b9eef51e2311	Тест отказоустойчивости контроллеров	Ручное переключение контроллеров	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
10bc3886-03a8-4bd9-9161-44f0145b7787	e19a6825-ea2f-4703-9299-e9c17e49a0a2	Тест отказоустойчивости МСЭ	Принудительное переключение кластера	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
db349776-031f-422e-94eb-0baf3b200061	\N	Тест отказоустойчивости стека	Перезагрузка одного из членов стека	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
2c9d0db2-83b8-4340-bba1-12ad1acebcda	\N	Тестирование API и интерфейсов	Тестирование функциональности API и пользовательских интерфейсов	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
b076b343-196e-448a-b343-fc2ce697c3bb	0160807a-6715-49e1-aaea-b9eef51e2311	Тестирование HyperMetro failover	Тестирование HyperMetro failover вручную (отключение master СХД)	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
509b8eb6-4223-4e79-8eae-58e028be2c05	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Тестирование vMotion	Тестирование функциональности vMotion	weekly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
399d8ca8-a0a7-468e-a6e1-34371104d1c9	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Тестирование отказоустойчивости кластера	Тестирование отказоустойчивости кластера	monthly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
27fff880-cdd4-41a5-ae66-2e76ab81afdb	\N	Тестовое восстановление	Проведение тестового восстановления отдельного файла или VM	monthly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
a6f2d7cd-6907-4439-a604-4ef9d8f7c357	\N	ТМ. Выверка телеметрической информации	ТМ. Выверка телеметрической информации в СК-11, мозаичный щит и ПК SofIT-SCADA-Plus	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
131ed0bf-6599-49ce-bd64-5e5b88095c4d	\N	ТМ. Инсталляция коммуникационного процессора	ТМ (Telemetry) Инсталляция коммуникационного процессора СК-11	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
27465eeb-14bd-46b8-8ffa-d7e100542a4c	\N	ТМ. Настройка интеграции КП и серверов SCADA	ТМ. Настройка интеграции коммуникационного процессора и серверов SCADA	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
c7f85881-382a-48fc-a68b-550de689188f	\N	ТМ. Настройка передачи данных на мозаичные щиты	ТМ. Настройка передачи данных телеметрии на контроллеры мозаичных щитов	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
e04b4a8b-3f59-49bb-ba80-9ac3cbc91e6f	\N	ТМ. Настройка подсистемы «Обмен данными»	ТМ. Настройка подсистемы «Обмен данными»	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
363d5d13-157d-4bd8-9483-c04771251b45	\N	ТМ. Настройка сигнальной системы	ТМ. Настройка сигнальной системы (сводки событий)	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
e3d3df86-6a34-4e19-998f-49102b699b5f	\N	ТМ. Настройка смежных приёмо-передающих устройств	ТМ. Настройка смежных существующих приёмо-передающих устройств для передачи информации в СК-11	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
e97eda45-248c-4602-8e3d-06715ffd9643	\N	ТМ. Проверка телеуправления	ТМ. Проверка телеуправления	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
1e2790c4-765c-43fa-805b-f61a5a3d246b	\N	Удаление неактуальных пользователей	Удаление неактуальных пользователей, передача прав	on_request	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
ea8bd191-46fd-4e86-ae8d-b3f7354e6c2c	\N	Управление группами пользователей и политиками	Управление группами пользователей, политиками безопасности	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
a419c96c-bb0f-4973-9598-49e88ab2cfa0	\N	Управление запусками и статусами pod	Управление запусками, перезапусками, статусами pod'ов	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
5b76ebc3-05b5-4008-9e8a-8e91866c4536	\N	Управление настройками логирования СК-11	Поддержка управления настройками логирования, уровней ошибок	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
4b42d2d7-df7a-425d-b753-5d83c3103d65	\N	Управление состоянием узлов СК	Управление состоянием узлов (перевод в активный/резервный режим)	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
96347f98-91c7-4fec-bc21-be300e60ba28	\N	Управление узлами PC-20.DataPrep	Управление состоянием узлов PC-20.DataPrep	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
60b0cf22-6574-4d36-b521-7b1725bca50f	\N	Управление узлами PC-20.MMPGAdapter	Управление состоянием узлов PC-20.MMPGAdapter	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
a7f68e92-8192-4183-912b-8af85c4d13ee	\N	Управление узлами PC-20.ModelEditor	Управление состоянием узлов PC-20.ModelEditor	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
65718161-113b-4d95-9df4-f0405428a823	\N	Управление узлами PC-20.OTopology	Управление состоянием узлов PC-20.OTopology	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
f291c7cd-cfea-47e1-a384-b4ecdef4f4da	\N	Управление узлами PC-20.Platform	Управление состоянием узлов PC-20.Platform	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
4bdbacae-0dfe-461c-806c-33dea9154f3b	0160807a-6715-49e1-aaea-b9eef51e2311	Установка патчей СХД	Установка патчей микрокода и ПО управления	monthly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
96a66cc1-f80a-47ad-a643-0b946cffa02e	\N	Устранение зависших сессий	Устранение зависших сессий, освобождение ресурсов	daily	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
a31d46a6-4e18-47b4-87c3-b8d976d9399f	5ac55584-66f8-47c0-b7fa-f0c1488ac5b6	Физическая чистка сервера	Продувка компрессором с очисткой фильтров без остановки техпроцесса	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
973048d1-8c0c-4ae9-b554-0e8bc8059193	\N	Чистка сервера бэкапа	Физическая чистка сервера (продувка компрессором с очисткой фильтров)	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
231cb2d9-4276-499f-9d96-bab806df5d96	0160807a-6715-49e1-aaea-b9eef51e2311	Чистка СХД и проверка SFP	Очистка от пыли, проверка SFP, патчкордов	semi_annual	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
1286cb74-e0cc-446f-92ab-8d33bf816a17	0160807a-6715-49e1-aaea-b9eef51e2311	Экспорт конфигурации СХД	Экспорт и архивирование конфигурации системы	monthly	f	\N	2026-05-22 14:24:03.321404+00	\N	\N	\N	t	f	100	2026-05-22 14:24:03.321404+00
\.


--
-- Data for Name: metric_translations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.metric_translations (id, key_pattern, match_type, display_name_ru, description_ru, category, priority, created_at, updated_at) FROM stdin;
33ba0d94-6210-4916-ba4b-b4977f641d6a	system.cpu.util	exact	Загрузка процессора	\N	Процессор	10	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
9f97ea69-dc3b-4d49-8c9b-cd4c3e4c8926	system.cpu.load[all,avg1]	exact	Средняя нагрузка CPU (1 мин)	\N	Процессор	10	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
2aab8d79-1789-44de-9123-9d3865154c05	system.cpu.load[all,avg5]	exact	Средняя нагрузка CPU (5 мин)	\N	Процессор	10	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
276fa452-31fa-442b-884d-c1a97be7683b	system.cpu.load[all,avg15]	exact	Средняя нагрузка CPU (15 мин)	\N	Процессор	10	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
98d7261d-6372-4463-8574-42a77811a119	system.cpu.num	exact	Число ядер процессора	\N	Процессор	10	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
d316ffe8-6c52-48ad-bc3f-3ca2228ee0f6	system.cpu.intr	exact	Прерывания процессора	\N	Процессор	10	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
b7a58b81-5323-49b5-bf08-841ca80c971a	system.cpu.switches	exact	Переключения контекста CPU	\N	Процессор	10	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
b6533d6d-4d2a-4b50-96b5-5c81afb4f4bb	vm.memory.size[available]	exact	Доступная оперативная память	\N	Память	10	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
13989aef-f99d-427b-aafb-e8768cbea958	vm.memory.size[total]	exact	Всего оперативной памяти	\N	Память	10	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
ef59d32d-4305-4e07-8f01-23cd3d0b0417	vm.memory.size[used]	exact	Используемая оперативная память	\N	Память	10	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
7859db40-d927-4101-bf20-ec2a99ccde78	vm.memory.size[free]	exact	Свободная оперативная память	\N	Память	10	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
ed7245ad-8ed4-48cb-a737-1281e04f0bba	vm.memory.utilization	exact	Использование памяти, %	\N	Память	10	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
e9fe17c5-106b-46bd-b5a0-c188ed0562af	system.swap.size[,free]	exact	Свободно в файле подкачки	\N	Память	10	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
3fa6b8ef-a5ba-4f5f-8533-66d7f50f8f45	system.swap.size[,pfree]	exact	Свободно в файле подкачки, %	\N	Память	10	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
1cb5ddc9-6d58-49cc-9d94-cea6714c56ef	vfs.fs.size[%,total]	like	Объём файловой системы	\N	Диски	20	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
01f4eb38-a18a-4011-9207-a36a08f181ff	vfs.fs.size[%,used]	like	Занято на диске	\N	Диски	20	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
0bd23cc5-eafb-4ed5-91da-657392d5e7ce	vfs.fs.size[%,free]	like	Свободно на диске	\N	Диски	20	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
89287112-4d68-48c4-aadd-a4630f13feac	vfs.fs.size[%,pfree]	like	Свободно на диске, %	\N	Диски	20	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
060f8901-ac6f-4e2e-8d21-2cc605e75205	vfs.fs.size[%,pused]	like	Занято на диске, %	\N	Диски	20	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
c98d8237-61f7-47c0-b2b4-cfbc953bc5ca	vfs.fs.inode[%,pfree]	like	Свободно inode, %	\N	Диски	20	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
80a65260-9f99-4df8-9bea-8bbd5f7647cf	vfs.dev.read.rate[%]	like	Скорость чтения с диска	\N	Диски	20	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
5d8f74a4-1750-47b7-b52e-55ca7bd34448	vfs.dev.write.rate[%]	like	Скорость записи на диск	\N	Диски	20	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
2e0d7551-8237-432f-8d2c-4846fa1c3dea	vfs.dev.read.await[%]	like	Время ожидания чтения	\N	Диски	20	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
27447827-f426-4712-a487-4cbdfd0a6a84	vfs.dev.write.await[%]	like	Время ожидания записи	\N	Диски	20	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
c2c4a81a-af8f-4424-b672-c316d2f5dd61	vfs.dev.util[%]	like	Утилизация диска, %	\N	Диски	20	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
359507b1-7e23-458c-85ec-27a206dc557b	vmware.vm.vfs.dev.read[%]	like	Скорость чтения с диска (ВМ)	\N	Диски	15	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
ff3263ef-ba6e-45a7-a439-4e8d66cb0213	vmware.vm.vfs.dev.write[%]	like	Скорость записи на диск (ВМ)	\N	Диски	15	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
36b9c3df-9d0a-47f7-91a2-f869bcfa24ac	vmware.vm.storage.readoio[%]	like	Невыполненные запросы чтения	\N	Диски	15	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
4d7c2738-0bab-4009-a6bf-6a39635fc53b	vmware.vm.storage.writeoio[%]	like	Невыполненные запросы записи	\N	Диски	15	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
f95edd74-ef5e-4b93-b75b-b7d61751780b	vmware.vm.cpu.usage[%]	like	Использование CPU (ВМ)	\N	Процессор	15	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
02da9103-46fa-4fb0-a679-c7eb717b469d	vmware.vm.memory.size[%]	like	Память (ВМ)	\N	Память	15	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
d116e2fb-a482-4b83-94d3-70b6db8ba324	net.if.in[%]	like	Входящий трафик	\N	Сеть	20	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
00d4427c-e7e4-4c72-9b3a-632e873b26c2	net.if.out[%]	like	Исходящий трафик	\N	Сеть	20	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
a5071312-4ecd-457e-952f-b3cf0514867f	net.if.in.errors[%]	like	Ошибки приёма	\N	Сеть	20	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
46938158-3458-43aa-95ea-14966e2974ce	net.if.out.errors[%]	like	Ошибки передачи	\N	Сеть	20	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
b9e38693-352b-4997-abf0-1b84f84c73f3	net.if.in.discards[%]	like	Отброшено пакетов на приём	\N	Сеть	20	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
e588c3ca-8574-4924-a82a-8f3aeb8f3ced	net.if.out.discards[%]	like	Отброшено пакетов на передачу	\N	Сеть	20	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
7edd8d92-b391-47af-880f-a58ce5aceb93	net.if.status[%]	like	Статус интерфейса	\N	Сеть	20	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
a43acdea-b8e2-4611-801d-f97aeb5d7f7d	net.tcp.service[%]	like	Доступность TCP-сервиса	\N	Сеть	20	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
d36cabbe-868f-49ef-8ec0-765ae1265530	icmpping	exact	Доступность по ICMP (пинг)	\N	Сеть	10	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
01e6415a-39aa-48fb-9306-4e340431b730	icmppingloss	exact	Потери ICMP-пакетов, %	\N	Сеть	10	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
829f300e-6230-4620-9d84-3ada009ff6cf	icmppingsec	exact	Время отклика ICMP	\N	Сеть	10	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
1e4d1be8-59a0-4536-9df0-47872b5a362b	agent.ping	exact	Доступность Zabbix-агента	\N	Сеть	10	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
d22706a4-614d-47b4-bc34-2f832e70f9ad	system.uptime	exact	Время работы системы	\N	Состояние компонентов	10	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
2f3157cc-e6ce-4922-b602-3fea8f417f71	system.uname	exact	Информация о системе	\N	Состояние компонентов	10	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
806c4702-6846-4dc4-93ab-d05b95b40d72	system.hostname	exact	Имя хоста	\N	Состояние компонентов	10	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
4b8309df-dd9d-49ce-9ecd-29354cf5140d	system.localtime	exact	Локальное время системы	\N	Состояние компонентов	10	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
9a2076fc-1871-4b68-811c-257e9937b026	system.users.num	exact	Число активных пользователей	\N	Состояние компонентов	10	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
a2dad330-27eb-4087-b6d6-65d083c4064f	proc.num[]	exact	Количество процессов	\N	Состояние компонентов	10	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
29bdf4d6-1b01-4ba0-a33d-b58749fa1e6c	sensor[%temp%]	like	Температурный датчик	\N	Температура	30	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
779dca10-3834-4b6f-a649-331bd2245a3e	sensor[%fan%]	like	Вентилятор	\N	Вентиляторы	30	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
7dd33035-98f0-4bad-a5bc-7931c1d181ac	sensor[%volt%]	like	Датчик напряжения	\N	Напряжения	30	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
c0d1e51d-7744-4e18-85f7-4b04705a2704	ipmi.sensor[%]	like	IPMI-датчик	\N	Состояние компонентов	30	2026-05-20 06:59:56.570675+00	2026-05-20 06:59:56.570675+00
6ae16d72-0d51-4341-87b6-b9c8ae3d5056	system.cpu.util	exact	Загрузка процессора	\N	Процессор	10	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
950ad2a8-50e1-4527-b501-bea828289a91	system.cpu.load[all,avg1]	exact	Средняя нагрузка CPU (1 мин)	\N	Процессор	10	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
d208b644-8069-42d3-a64f-4464205c1d8a	system.cpu.load[all,avg5]	exact	Средняя нагрузка CPU (5 мин)	\N	Процессор	10	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
74f736be-dfc0-45b0-9673-2d06eca43db5	system.cpu.load[all,avg15]	exact	Средняя нагрузка CPU (15 мин)	\N	Процессор	10	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
e63c7bff-af49-4370-8084-07bae540b743	system.cpu.num	exact	Число ядер процессора	\N	Процессор	10	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
ad69921a-a50a-469c-80df-0ecfe0febc8a	system.cpu.intr	exact	Прерывания процессора	\N	Процессор	10	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
41f46b91-3ada-4ec6-ae71-1bf3c25b9d16	system.cpu.switches	exact	Переключения контекста CPU	\N	Процессор	10	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
6b1deb44-e191-429b-b004-17802f00c94d	vm.memory.size[available]	exact	Доступная оперативная память	\N	Память	10	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
4515c44c-2c72-4067-bfc5-f903d39ce515	vm.memory.size[total]	exact	Всего оперативной памяти	\N	Память	10	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
f206afe9-e47b-4902-91bb-3cd1598bc056	vm.memory.size[used]	exact	Используемая оперативная память	\N	Память	10	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
c06533b2-ac3f-4015-b928-2cedb3f8337f	vm.memory.size[free]	exact	Свободная оперативная память	\N	Память	10	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
f678f34e-c040-4469-97ee-29bebdcdb597	vm.memory.utilization	exact	Использование памяти, %	\N	Память	10	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
10669f41-6dc6-439e-b423-b885363fc040	system.swap.size[,free]	exact	Свободно в файле подкачки	\N	Память	10	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
7c6937cb-03e9-479b-afc4-27b2384bf6b4	system.swap.size[,pfree]	exact	Свободно в файле подкачки, %	\N	Память	10	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
91e53c4f-cefe-412c-a3a1-a16568a46f74	vfs.fs.size[%,total]	like	Объём файловой системы	\N	Диски	20	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
c5ebbe10-c7a8-49f4-a92d-15eeb9c0b752	vfs.fs.size[%,used]	like	Занято на диске	\N	Диски	20	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
e63f833a-a3bf-43c1-a0c3-bd10a856862c	vfs.fs.size[%,free]	like	Свободно на диске	\N	Диски	20	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
6a816dd7-89c7-4523-805d-4517cf2ce576	vfs.fs.size[%,pfree]	like	Свободно на диске, %	\N	Диски	20	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
3888268f-dbc2-4954-a449-49040dc17ea3	vfs.fs.size[%,pused]	like	Занято на диске, %	\N	Диски	20	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
c9870689-6d0b-4287-bd73-a2c67fb0f7d7	vfs.fs.inode[%,pfree]	like	Свободно inode, %	\N	Диски	20	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
1ba4581a-110b-47cc-b57b-c750f36f85b2	vfs.dev.read.rate[%]	like	Скорость чтения с диска	\N	Диски	20	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
9047846c-3b67-426a-b2de-336c47ac03a7	vfs.dev.write.rate[%]	like	Скорость записи на диск	\N	Диски	20	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
3da09ace-c0d1-41ef-a59b-89c7070307c3	vfs.dev.read.await[%]	like	Время ожидания чтения	\N	Диски	20	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
ddf6c581-52d0-4175-adfb-50ae27fbbf31	vfs.dev.write.await[%]	like	Время ожидания записи	\N	Диски	20	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
fbc83fbf-15c7-4dbe-bc9e-9c02b7c1a0b6	vfs.dev.util[%]	like	Утилизация диска, %	\N	Диски	20	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
413cee97-4359-4b66-a413-851091832951	vmware.vm.vfs.dev.read[%]	like	Скорость чтения с диска (ВМ)	\N	Диски	15	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
e60c8eea-7971-4a52-b66e-fbede0bd7610	vmware.vm.vfs.dev.write[%]	like	Скорость записи на диск (ВМ)	\N	Диски	15	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
2f17d9ea-966b-47eb-84e3-3e1c509639f3	vmware.vm.storage.readoio[%]	like	Невыполненные запросы чтения	\N	Диски	15	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
44119f94-c8d7-4acd-98d3-2d0f105ace0d	vmware.vm.storage.writeoio[%]	like	Невыполненные запросы записи	\N	Диски	15	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
ea2abc88-fb1f-481a-98b9-509e54f8e70a	vmware.vm.cpu.usage[%]	like	Использование CPU (ВМ)	\N	Процессор	15	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
90ada73b-3744-4647-958c-2f6a4000bbe9	vmware.vm.memory.size[%]	like	Память (ВМ)	\N	Память	15	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
e3f56a7a-0280-4b88-95e5-f88949282bb3	net.if.in[%]	like	Входящий трафик	\N	Сеть	20	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
4eae98aa-cd95-4488-970d-f4346afcc31e	net.if.out[%]	like	Исходящий трафик	\N	Сеть	20	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
fa2bafb5-1c18-4df5-8b2f-0d2c116645b5	net.if.in.errors[%]	like	Ошибки приёма	\N	Сеть	20	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
79483c15-bfb9-4860-83fe-360884ac5982	net.if.out.errors[%]	like	Ошибки передачи	\N	Сеть	20	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
86f616ea-8dc5-4bd1-b3e5-e1c7284b6ef4	net.if.in.discards[%]	like	Отброшено пакетов на приём	\N	Сеть	20	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
3f3dfa9d-32bc-435a-81c0-a4d6beae8ad6	net.if.out.discards[%]	like	Отброшено пакетов на передачу	\N	Сеть	20	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
fcac40a5-86f5-401f-ae23-b9d146f0fd1f	net.if.status[%]	like	Статус интерфейса	\N	Сеть	20	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
ddbfb259-3092-4ce0-ab52-c89e44be91d3	net.tcp.service[%]	like	Доступность TCP-сервиса	\N	Сеть	20	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
b30c24be-a90a-4812-a617-73e6cba02123	icmpping	exact	Доступность по ICMP (пинг)	\N	Сеть	10	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
10e56849-4634-43dd-8795-6b3c7c32c4a9	icmppingloss	exact	Потери ICMP-пакетов, %	\N	Сеть	10	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
1acbabb4-546c-4101-9c05-d457666f6b29	icmppingsec	exact	Время отклика ICMP	\N	Сеть	10	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
838de67f-24fb-4a50-b463-df5841db59fd	agent.ping	exact	Доступность Zabbix-агента	\N	Сеть	10	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
6adbd154-35f0-4304-b640-04f208058ca2	system.uptime	exact	Время работы системы	\N	Состояние компонентов	10	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
42c6589d-e9cc-47ed-8a2d-a33e1da04a81	system.uname	exact	Информация о системе	\N	Состояние компонентов	10	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
553854e1-3310-4ce2-93c8-f3d87ebfbf6e	system.hostname	exact	Имя хоста	\N	Состояние компонентов	10	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
ab1abc25-e1b7-496f-988d-6d81b9655dca	system.localtime	exact	Локальное время системы	\N	Состояние компонентов	10	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
8d9b898f-02f7-4aa3-b3a1-12cf28475e53	system.users.num	exact	Число активных пользователей	\N	Состояние компонентов	10	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
5358e136-6820-4df8-b7e9-69be73ce93de	proc.num[]	exact	Количество процессов	\N	Состояние компонентов	10	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
24b05b71-157e-44a3-84e6-f58a22b820af	sensor[%temp%]	like	Температурный датчик	\N	Температура	30	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
e3ce8af6-50a2-4753-9b5e-d280a80acc09	sensor[%fan%]	like	Вентилятор	\N	Вентиляторы	30	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
f3f17019-8cdd-4b6a-a99a-cd1d143751c0	sensor[%volt%]	like	Датчик напряжения	\N	Напряжения	30	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
90a54956-0421-4f0a-9ae0-949f445e63b5	ipmi.sensor[%]	like	IPMI-датчик	\N	Состояние компонентов	30	2026-05-20 07:05:30.425557+00	2026-05-20 07:05:30.425557+00
67e9b6ac-f92a-4c74-9bc2-e1352cdfa1d0	system.cpu.util	exact	Загрузка процессора	\N	Процессор	10	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
620fff82-0550-409b-8276-32060aa974f6	system.cpu.load[all,avg1]	exact	Средняя нагрузка CPU (1 мин)	\N	Процессор	10	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
cacb01bc-3ac7-447a-b490-97b01512ad9d	system.cpu.load[all,avg5]	exact	Средняя нагрузка CPU (5 мин)	\N	Процессор	10	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
0d250bd1-ea1b-41c5-bc71-c5306375199e	system.cpu.load[all,avg15]	exact	Средняя нагрузка CPU (15 мин)	\N	Процессор	10	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
010aae10-e768-4daf-8205-54eab34c7d2a	system.cpu.num	exact	Число ядер процессора	\N	Процессор	10	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
a652940a-1107-42bc-8bb5-df2f8f6f6c6e	system.cpu.intr	exact	Прерывания процессора	\N	Процессор	10	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
7eb2cf69-6b54-4180-8f0e-179310963166	system.cpu.switches	exact	Переключения контекста CPU	\N	Процессор	10	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
c58eb6b8-0c33-4cd7-9460-fe8cd6c9d71d	vm.memory.size[available]	exact	Доступная оперативная память	\N	Память	10	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
37724035-5e74-416d-99a7-4438078ab2d5	vm.memory.size[total]	exact	Всего оперативной памяти	\N	Память	10	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
255bc72f-0c81-495b-b284-0033880efd3a	vm.memory.size[used]	exact	Используемая оперативная память	\N	Память	10	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
88d3d488-435d-487c-8236-614af921569e	vm.memory.size[free]	exact	Свободная оперативная память	\N	Память	10	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
597f18d2-9670-4ca4-9a8b-530297572484	vm.memory.utilization	exact	Использование памяти, %	\N	Память	10	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
e2459869-f3f8-4540-842a-7493886e381f	system.swap.size[,free]	exact	Свободно в файле подкачки	\N	Память	10	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
64d27b9b-14e0-4a5e-86ca-aa4cadad23b1	system.swap.size[,pfree]	exact	Свободно в файле подкачки, %	\N	Память	10	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
71bcebb5-3597-4ee5-a846-9b1c643be725	vfs.fs.size[%,total]	like	Объём файловой системы	\N	Диски	20	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
0cc7be3a-1f30-4712-939b-4c3c06be0536	vfs.fs.size[%,used]	like	Занято на диске	\N	Диски	20	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
678c2648-a3dd-4531-a29f-a1c1b8710b8d	vfs.fs.size[%,free]	like	Свободно на диске	\N	Диски	20	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
83699c14-d194-4299-87c3-ce846e3017df	vfs.fs.size[%,pfree]	like	Свободно на диске, %	\N	Диски	20	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
0e89af47-1cc4-40fc-b853-aed54ba4056a	vfs.fs.size[%,pused]	like	Занято на диске, %	\N	Диски	20	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
283a787f-83a4-43e6-8765-b2b698dc6345	vfs.fs.inode[%,pfree]	like	Свободно inode, %	\N	Диски	20	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
ec115def-1cdc-444f-bcc9-7e3b53df3338	vfs.dev.read.rate[%]	like	Скорость чтения с диска	\N	Диски	20	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
9a8b1033-5ed8-4172-b56d-d9326572b701	vfs.dev.write.rate[%]	like	Скорость записи на диск	\N	Диски	20	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
d8ae701f-ac8b-4495-992c-09da29b0a72a	vfs.dev.read.await[%]	like	Время ожидания чтения	\N	Диски	20	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
cdbd00d8-639a-4f2a-815e-09889fa55d38	vfs.dev.write.await[%]	like	Время ожидания записи	\N	Диски	20	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
38580205-ec36-4672-8cea-e558505eded1	vfs.dev.util[%]	like	Утилизация диска, %	\N	Диски	20	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
da4635ff-2e52-44cc-ad2d-5ae02a91f291	vmware.vm.vfs.dev.read[%]	like	Скорость чтения с диска (ВМ)	\N	Диски	15	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
e8cca840-faab-4aba-9899-f6e986a9140c	vmware.vm.vfs.dev.write[%]	like	Скорость записи на диск (ВМ)	\N	Диски	15	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
013b0c82-13d3-49bc-92aa-fc282937b517	vmware.vm.storage.readoio[%]	like	Невыполненные запросы чтения	\N	Диски	15	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
6167ff98-b087-4e82-9347-3940828bbbd3	vmware.vm.storage.writeoio[%]	like	Невыполненные запросы записи	\N	Диски	15	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
34a7b34e-7733-4c2f-abd4-7293b736cfe9	vmware.vm.cpu.usage[%]	like	Использование CPU (ВМ)	\N	Процессор	15	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
760c07b2-280c-4443-b5f6-bc1fe267e157	vmware.vm.memory.size[%]	like	Память (ВМ)	\N	Память	15	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
de73b992-add2-4803-819d-aa1b8a6c6fd6	net.if.in[%]	like	Входящий трафик	\N	Сеть	20	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
979c9065-6c55-48e5-bbba-e2d820d1bba8	net.if.out[%]	like	Исходящий трафик	\N	Сеть	20	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
c04b983b-5591-4d56-8745-27b517d0f040	net.if.in.errors[%]	like	Ошибки приёма	\N	Сеть	20	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
e1fe9352-f345-4bfe-ac45-146dc08c86c9	net.if.out.errors[%]	like	Ошибки передачи	\N	Сеть	20	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
fa18bfc7-09cb-4923-8266-438e57676748	net.if.in.discards[%]	like	Отброшено пакетов на приём	\N	Сеть	20	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
899580cb-5e61-4ecd-a104-a9b0aa5d60df	net.if.out.discards[%]	like	Отброшено пакетов на передачу	\N	Сеть	20	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
20b79d55-9e53-4b19-a7cd-3ae7fdbe8ad7	net.if.status[%]	like	Статус интерфейса	\N	Сеть	20	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
f7d2519c-d497-4185-a6ca-4644fc4d7378	net.tcp.service[%]	like	Доступность TCP-сервиса	\N	Сеть	20	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
2f59c456-b504-4b18-bc49-4b16b85d171d	icmpping	exact	Доступность по ICMP (пинг)	\N	Сеть	10	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
bf705c5b-ef4b-46b9-84dc-1b552326d10e	icmppingloss	exact	Потери ICMP-пакетов, %	\N	Сеть	10	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
8d017e30-78ba-4882-b1c7-b96ff725d01b	icmppingsec	exact	Время отклика ICMP	\N	Сеть	10	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
73b929fd-eda0-4a2d-b5ce-54cc182b39c3	agent.ping	exact	Доступность Zabbix-агента	\N	Сеть	10	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
36834f15-875c-459f-88fc-05235e0d0f0e	system.uptime	exact	Время работы системы	\N	Состояние компонентов	10	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
0dce8867-5993-4250-9c14-1447bc0a1525	system.uname	exact	Информация о системе	\N	Состояние компонентов	10	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
baa164ea-5ecc-4ed3-8c58-c491baba3f3f	system.hostname	exact	Имя хоста	\N	Состояние компонентов	10	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
55d2006d-3e2a-43bc-a429-d7b068ce719b	system.localtime	exact	Локальное время системы	\N	Состояние компонентов	10	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
6d3bb055-eb12-4c28-8609-2e11bf53112a	system.hostname	exact	Имя хоста	\N	Состояние компонентов	10	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
37cdb211-2695-4962-be33-85693ec5c9c3	system.users.num	exact	Число активных пользователей	\N	Состояние компонентов	10	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
5a4beace-c72c-4a2f-b7c8-30b62e3c6092	proc.num[]	exact	Количество процессов	\N	Состояние компонентов	10	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
dd03cfd6-b70d-47eb-bbe1-5344642c989b	sensor[%temp%]	like	Температурный датчик	\N	Температура	30	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
88938a4f-8ce2-4b70-9e63-f0ef77213028	sensor[%fan%]	like	Вентилятор	\N	Вентиляторы	30	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
781309b3-c61d-4e2c-9d4b-b37b2787725e	sensor[%volt%]	like	Датчик напряжения	\N	Напряжения	30	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
feccaa09-c5fb-4bd0-a605-d38d3e4ad153	ipmi.sensor[%]	like	IPMI-датчик	\N	Состояние компонентов	30	2026-05-20 09:34:29.276856+00	2026-05-20 09:34:29.276856+00
4aafcd98-5390-4f4a-b1eb-589a1a4f6125	system.cpu.util	exact	Загрузка процессора	\N	Процессор	10	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
c0d0055d-b106-46cd-aafa-8cd40ba1a6b8	system.cpu.load[all,avg1]	exact	Средняя нагрузка CPU (1 мин)	\N	Процессор	10	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
264dbff6-522e-43fe-b6da-4d9f1c64f6cb	system.cpu.load[all,avg5]	exact	Средняя нагрузка CPU (5 мин)	\N	Процессор	10	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
d77cb54d-7aa7-47b4-8ebc-9bc597fa2bc1	system.cpu.load[all,avg15]	exact	Средняя нагрузка CPU (15 мин)	\N	Процессор	10	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
0b1fa39d-1792-4878-9ea3-d1c33e11b551	system.cpu.num	exact	Число ядер процессора	\N	Процессор	10	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
05e01059-3fe8-4bed-8d2a-c4ba94031b89	system.cpu.intr	exact	Прерывания процессора	\N	Процессор	10	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
21bde21b-11a7-4947-b054-ad4b715e8638	system.cpu.switches	exact	Переключения контекста CPU	\N	Процессор	10	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
726630c9-28f1-49f4-afbe-0c70eefa75cf	vm.memory.size[available]	exact	Доступная оперативная память	\N	Память	10	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
98ab0a53-5d56-4794-8ab2-0b919d50a6bd	vm.memory.size[total]	exact	Всего оперативной памяти	\N	Память	10	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
5a3a62ee-3e01-4616-8beb-2d57cac1e85d	vm.memory.size[used]	exact	Используемая оперативная память	\N	Память	10	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
7b27a715-a161-4a47-b438-c18e66379c9a	vm.memory.size[free]	exact	Свободная оперативная память	\N	Память	10	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
4d4da3dd-b54f-45c6-a78d-c1902766e84f	vm.memory.utilization	exact	Использование памяти, %	\N	Память	10	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
d9d2c784-94f4-4b03-bf44-4d5b2029ac16	system.swap.size[,free]	exact	Свободно в файле подкачки	\N	Память	10	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
0abb88a0-4475-4fba-9d24-c35a9c08b7b4	system.swap.size[,pfree]	exact	Свободно в файле подкачки, %	\N	Память	10	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
878449c2-3a59-4b2d-841f-d814da4a5d2d	vfs.fs.size[%,total]	like	Объём файловой системы	\N	Диски	20	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
1505a3c9-6600-41e7-bf1a-a44076bc88d4	vfs.fs.size[%,used]	like	Занято на диске	\N	Диски	20	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
aab4a364-ba36-4751-9380-eed0148c4327	vfs.fs.size[%,free]	like	Свободно на диске	\N	Диски	20	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
f6b4bcbd-ac0a-4273-bb64-e44fc89e6d69	vfs.fs.size[%,pfree]	like	Свободно на диске, %	\N	Диски	20	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
ac0b9085-551b-4fba-8ccd-ed488d26b5cf	vfs.fs.size[%,pused]	like	Занято на диске, %	\N	Диски	20	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
70ac3d07-38b9-4e61-b6f4-568e39b1998f	vfs.fs.inode[%,pfree]	like	Свободно inode, %	\N	Диски	20	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
15a6e2a9-ab69-4f9d-9012-e5e5dc3ec844	vfs.dev.read.rate[%]	like	Скорость чтения с диска	\N	Диски	20	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
4203cafd-36ec-4141-84cf-61f1c1091717	vfs.dev.write.rate[%]	like	Скорость записи на диск	\N	Диски	20	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
b4e55aca-2174-4865-9d41-441da82f6b96	vfs.dev.read.await[%]	like	Время ожидания чтения	\N	Диски	20	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
aa59266e-997b-4dc7-af1c-c3b6cabfd372	vfs.dev.write.await[%]	like	Время ожидания записи	\N	Диски	20	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
bdd63ffa-2e34-4f75-8fb7-5ceedb4f854a	vfs.dev.util[%]	like	Утилизация диска, %	\N	Диски	20	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
e737fccd-0aed-4c3b-9341-f0ff0ff11902	vmware.vm.vfs.dev.read[%]	like	Скорость чтения с диска (ВМ)	\N	Диски	15	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
5b2e076d-1898-4a22-b3f7-5b9cd3e878a7	vmware.vm.vfs.dev.write[%]	like	Скорость записи на диск (ВМ)	\N	Диски	15	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
f93263c7-f0db-4503-9e31-967eb0d56620	vmware.vm.storage.readoio[%]	like	Невыполненные запросы чтения	\N	Диски	15	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
bd8f28b3-ff9e-4d63-9925-c932a025acdd	vmware.vm.storage.writeoio[%]	like	Невыполненные запросы записи	\N	Диски	15	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
05cf51eb-ebc0-42a0-90c4-5a9b63f967b0	vmware.vm.cpu.usage[%]	like	Использование CPU (ВМ)	\N	Процессор	15	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
8f5e92ba-bfa0-47c7-8813-44f415ea4440	vmware.vm.memory.size[%]	like	Память (ВМ)	\N	Память	15	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
42d8a01e-e4c6-40c2-a8c7-73bcd99a2a7a	net.if.in[%]	like	Входящий трафик	\N	Сеть	20	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
4088c8c2-5fa3-4956-9d1c-67458a33cddf	net.if.out[%]	like	Исходящий трафик	\N	Сеть	20	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
be6aa134-2422-45b3-94db-8bff5d68256c	net.if.in.errors[%]	like	Ошибки приёма	\N	Сеть	20	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
8b4d6900-f39b-43bf-9e9d-8ce8391dceef	net.if.out.errors[%]	like	Ошибки передачи	\N	Сеть	20	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
e780e3de-74e7-4a5e-b79a-af7abee2b82e	net.if.in.discards[%]	like	Отброшено пакетов на приём	\N	Сеть	20	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
e309a73f-37a7-4109-9e2c-10d16a430bdf	net.if.out.discards[%]	like	Отброшено пакетов на передачу	\N	Сеть	20	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
15f07484-99c8-492a-8123-f086ac314f64	net.if.status[%]	like	Статус интерфейса	\N	Сеть	20	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
a98abd89-6643-4cc5-9941-4d89fa21e1ba	net.tcp.service[%]	like	Доступность TCP-сервиса	\N	Сеть	20	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
b7e427f1-2d21-4492-be4d-eab8cf859f24	icmpping	exact	Доступность по ICMP (пинг)	\N	Сеть	10	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
9ed37ab2-c45a-4e18-9a00-51fa2be49497	icmppingloss	exact	Потери ICMP-пакетов, %	\N	Сеть	10	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
1beb338f-974f-4da9-9c00-90498e929570	icmppingsec	exact	Время отклика ICMP	\N	Сеть	10	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
0e5a2d10-7e03-4374-ace3-5b1246dc6ace	agent.ping	exact	Доступность Zabbix-агента	\N	Сеть	10	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
69d662fd-2e46-4d44-a3cb-61228ea64f1b	system.uptime	exact	Время работы системы	\N	Состояние компонентов	10	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
ff4bbf7e-e82a-415c-8b82-93094b190dc4	system.uname	exact	Информация о системе	\N	Состояние компонентов	10	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
64cb34fd-fdbf-4bc3-869e-418d05fc7083	system.localtime	exact	Локальное время системы	\N	Состояние компонентов	10	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
1a945315-f46a-434f-927f-560d68f17329	system.users.num	exact	Число активных пользователей	\N	Состояние компонентов	10	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
64088360-60e6-404b-8e44-6d69d15dd019	proc.num[]	exact	Количество процессов	\N	Состояние компонентов	10	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
65030bc1-08b1-4bc3-83df-aaa0e913c124	sensor[%temp%]	like	Температурный датчик	\N	Температура	30	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
3836c58d-cd99-41c0-a2ca-de6eaf18d8a5	sensor[%fan%]	like	Вентилятор	\N	Вентиляторы	30	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
ce3ecdb3-5e2e-49e2-800f-0b0828b5b947	sensor[%volt%]	like	Датчик напряжения	\N	Напряжения	30	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
a4a2fbed-f8f8-44cf-ba8f-2385126482e2	ipmi.sensor[%]	like	IPMI-датчик	\N	Состояние компонентов	30	2026-05-20 14:36:44.726255+00	2026-05-20 14:36:44.726255+00
\.


--
-- Data for Name: monitored_hosts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.monitored_hosts (id, name, ip_address, device_type, protocol, port, snmp_community, credentials_login, credentials_password, site_id, enabled, zabbix_host_id, notes, created_at, updated_at, visible_name, host_group, protocols_config, templates, organization_id, zabbix_connection_id) FROM stdin;
\.


--
-- Data for Name: monitoring_host_links; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.monitoring_host_links (id, zabbix_host_id, equipment_id, host_name, auto_matched, created_at, updated_at, created_by) FROM stdin;
ceaec643-b96a-44b1-bd02-8c69cd90b3ad	10725	4af950f1-4fd1-4851-951a-6a626a8d8879	AR1_ET__SNMP	t	2026-05-22 14:20:13.484072+00	2026-05-22 14:20:13.484072+00	\N
bcbff9e8-7583-4021-8629-ee23dda6e616	10727	63171dcb-e633-49a5-b02e-639280fe490d	AR1_RUP__SNMP	t	2026-05-22 14:20:13.484072+00	2026-05-22 14:20:13.484072+00	\N
827edefb-ff6b-4205-9d2c-abf45ea38c74	10726	48f5f549-650a-439c-b25b-b04bc000d11b	AR2_ET__SNMP	t	2026-05-22 14:20:13.484072+00	2026-05-22 14:20:13.484072+00	\N
d8d3beca-5851-48c6-bfdb-a6ff0e98a844	10728	c3361316-4327-48ca-b590-3cc7cdd47cc8	AR2_RUP__SNMP	t	2026-05-22 14:20:13.484072+00	2026-05-22 14:20:13.484072+00	\N
835206ea-aa01-41d7-bca2-8e55f11ed749	10723	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	SRK	t	2026-05-22 14:20:13.484072+00	2026-05-22 14:20:13.484072+00	\N
1a61b7d9-f81e-462f-ba21-f0b2683c70ad	10720	d5db9148-6244-4e30-b070-120a43bfbb99	SRV1_RUP	t	2026-05-22 14:20:13.484072+00	2026-05-22 14:20:13.484072+00	\N
e2d29dd1-ce6f-4716-a0b7-feff163a30e5	10721	4bf14c86-9d37-4778-8173-a50bef1b57d2	SRV2_RUP	t	2026-05-22 14:20:13.484072+00	2026-05-22 14:20:13.484072+00	\N
caa3b7ba-6c9d-4b63-8d43-40d7c23fe427	10722	69de0c07-8930-42ab-93be-e6b07bd51131	SRV3_RUP	t	2026-05-22 14:20:13.484072+00	2026-05-22 14:20:13.484072+00	\N
c1127dc4-00d9-49f6-b8a4-6a78887ecd30	10717	90c3e300-e026-49ff-b7c3-c238c4397d23	SW1_ET__SNMP	t	2026-05-22 14:20:13.484072+00	2026-05-22 14:20:13.484072+00	\N
22bede7f-35df-4b1e-b3a0-a968ac70743e	10724	2c483c84-1085-449f-90d3-680062e0c07a	SW1_RUP__SNMP	t	2026-05-22 14:20:13.484072+00	2026-05-22 14:20:13.484072+00	\N
712c37d5-5be1-43e6-9242-7ab3974276d4	10740	73400575-bed3-4ac9-9051-91f8fc4742df	10.70.1.1	f	2026-05-22 14:20:13.484072+00	2026-05-22 14:20:29.941334+00	\N
a11f5fed-df53-41ea-b187-ec34aeaaafa4	10738	808f9f99-6a43-4114-804d-6104d63222fd	10.70.1.10	f	2026-05-22 14:20:13.484072+00	2026-05-22 14:20:29.941334+00	\N
6aaba1ad-234e-450e-9b5c-a422de909330	10742	9076480a-0f0d-4416-a19b-a08de87dac89	10.70.1.11	f	2026-05-22 14:20:13.484072+00	2026-05-22 14:20:29.941334+00	\N
\.


--
-- Data for Name: notification_channels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_channels (id, user_id, channel_type, name, config, enabled, verified, last_test_at, last_test_status, last_test_error, created_at, updated_at) FROM stdin;
acdb8947-98a5-4295-8a02-60b707aadbf0	393ee63e-3282-4e05-bd99-dc01241e84e2	telegram	ITE_Support	{"chat_id": "741607760", "bot_token": "8525782216:AAHMnasj-rzgdQjKFDBn_ns-Y2XEyauOpiY"}	t	t	2026-05-23 11:33:23.11+00	success	\N	2026-05-22 21:29:11.13219+00	2026-05-23 11:33:23.112453+00
\.


--
-- Data for Name: notification_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_log (id, user_id, channel_id, channel_type, event_type, priority, title, body, payload, status, attempts, error, http_status, sent_at, created_at, is_read) FROM stdin;
\.


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_preferences (user_id, delivery_mode, dnd_enabled, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, quiet_days, quiet_bypass_critical, digest_schedule, timezone, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notification_queue; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_queue (id, user_id, event_type, priority, title, body, payload, scheduled_for, attempts, status, last_error, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notification_subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_subscriptions (id, user_id, event_type, enabled, min_priority, channel_ids, filters, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organizations (id, name, short_name, inn, address, contact_email, contact_phone, notes, is_active, created_at, updated_at, legal_full_name, executor_default) FROM stdin;
cf0cefb9-7892-4d29-8f42-764c19512092	РУП "Брестэнерго"	Брестэнерго	200050653	224030 г. Брест, ул.Воровского, 13/1	box@brestenergo.by	8 (0162) 21 84 90		t	2026-05-20 06:59:56.843531+00	2026-05-21 09:48:50.971682+00	Республиканское унитарное предприятие "Брестэнерго"	ООО "ИнноТех Инжиниринг"
29b5d0ab-24c3-44ff-9a9c-963d3a82113e	Филиал "Энерготелеком" РУП "Брестэнерго"	\N	\N	\N	\N	\N	\N	t	2026-05-22 12:49:10.43654+00	2026-05-22 12:49:10.43654+00	\N	\N
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profiles (id, user_id, full_name, phone, organization, created_at, updated_at, is_active, signature_path, "position") FROM stdin;
5ec12baf-ef17-477a-bbe3-1b14d4c40c0e	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	+375297754529	ООО "ИнноТех Инжиниринг"	2026-05-20 07:07:44.840145+00	2026-05-21 07:28:04.865676+00	t	393ee63e-3282-4e05-bd99-dc01241e84e2/signature.png	заместитель директора
93f89c00-15ed-4fc8-8dcd-ab00cd6ba7b7	04eaa7fe-2753-42a7-b335-7ffe6be31c09	Соловьев Алексей Александрович	\N	ООО "ИнноТех Инжиниринг"	2026-05-20 11:24:49.143767+00	2026-05-21 14:12:27.875261+00	t	\N	ведущий инженер
40960822-486a-4513-bcfe-b9c8385015e3	6612e16b-ba9f-49cf-9ed2-184cf00dde2c	Розганова Алина Валерьевна	\N	ООО "ИнноТех Инжиниринг"	2026-05-20 14:49:04.813063+00	2026-05-22 12:30:49.755245+00	t	\N	\N
e74696b3-150a-4362-aa22-aef58fc8cb08	9233c31a-6cc8-4ec0-90c8-3aaedf88e7ef	Пстыга Анатолий Олегович	\N	Филиал "Энерготелеком" РУП "Брестэнерго"	2026-05-22 12:52:15.491792+00	2026-05-22 12:52:15.501262+00	t	\N	Директор
\.


--
-- Data for Name: protocol_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.protocol_items (id, protocol_id, schedule_id, equipment_id, task_id, status, result, notes, completed_by, completed_at, auto_result, equipment_snapshot) FROM stdin;
eb6d10cd-6720-42a6-924b-9da5feda3202	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	54de01b5-6711-4e2f-b4e5-83b8a658c1ea	pending	\N	\N	\N	\N	\N	\N
d0244708-ea65-48e9-afa2-539648013327	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	2bbf52cf-3942-43da-9e74-1ccab5d8f5b7	pending	\N	\N	\N	\N	\N	\N
ee3f045e-0ef9-4809-bae6-a6787b500af6	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	40fed8d4-2408-4e91-998d-04548cf33cf1	pending	\N	\N	\N	\N	\N	\N
b405f20e-d0d3-4443-9a3b-45dbd9a4f4ec	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	df7f131c-ad24-413e-8640-dac8493be026	pending	\N	\N	\N	\N	\N	\N
58134c23-9028-4d90-8188-30c42e0d6502	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	609bab0d-72bd-4ee9-80fd-3f4d1db92bed	pending	\N	\N	\N	\N	\N	\N
146ea255-49e2-4003-ab55-e5100724b4e6	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	011aa579-858b-4fec-a3cb-bed8bdd9f82d	pending	\N	\N	\N	\N	\N	\N
09d6fade-c9d4-4bd0-a57d-2b5fe8917571	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	8a2d8daa-1687-4d8d-b54d-7864bd8d7887	pending	\N	\N	\N	\N	\N	\N
1f3a6d2c-0898-486f-aeab-bf05ffc795f3	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	a0498893-beb3-4500-adcc-f56270dab200	pending	\N	\N	\N	\N	\N	\N
8637835d-ed3f-4ce4-bcee-434398361ea7	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	8c16dfa4-433d-44fb-aa00-82b12b83febc	pending	\N	\N	\N	\N	\N	\N
8f58337f-44be-473e-bde1-7c15572b4c17	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	c071fc1e-af9a-490b-bcdf-af80b46d511c	pending	\N	\N	\N	\N	\N	\N
24e6f851-1d12-4868-8a46-5664b8905b61	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	46c90232-8f81-49a5-84e3-5eada2ab01e3	pending	\N	\N	\N	\N	\N	\N
cc269a51-6cdd-493c-a8e0-0644c462c8ed	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	812f8dcd-a92b-46dc-b9ec-18b272872999	pending	\N	\N	\N	\N	\N	\N
4ce29033-7b02-4460-98d9-139b937292ca	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	ec95e8fd-2203-46f6-b941-0e19cb62d92f	pending	\N	\N	\N	\N	\N	\N
fef46526-67fb-4207-ae7c-d4213314ee94	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	cf1ead87-bc0e-4710-8356-8791329f48d1	pending	\N	\N	\N	\N	\N	\N
1f14aed2-4208-4d0a-b812-b1e8d857a2d2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	cdd2f7af-be6e-457a-a465-13900fd2449b	pending	\N	\N	\N	\N	\N	\N
3f93df3c-a08c-438b-acfc-7e1fd21f826f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	e48c91a4-3b94-463c-8977-5e35344d1315	pending	\N	\N	\N	\N	\N	\N
18074e95-8582-45ef-bb97-ea7a429c0a8a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	81af9c2e-f599-47e5-8b27-b29b5cc577cd	pending	\N	\N	\N	\N	\N	\N
62c5a504-42c6-4cfa-96ab-2f0290bbed5d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	e01773e0-ebb9-471a-be8c-98f2951a1454	pending	\N	\N	\N	\N	\N	\N
12b764f6-5b51-477f-9293-10b398f5f2d3	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	72ed8bbc-c906-462b-91ae-5c8e602a9581	pending	\N	\N	\N	\N	\N	\N
7cb4e448-9d53-462f-a9f7-6851b05fcbc2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	f5fcaeab-8802-4e50-b73d-4a057431d3fd	pending	\N	\N	\N	\N	\N	\N
ae8f3f26-db0a-40fa-aba0-6432ac984b0c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	7c2ee432-f7a2-468a-91a4-d6da3a69ee91	pending	\N	\N	\N	\N	\N	\N
22bd0b6c-4f54-4d42-a19d-f5386e4050a7	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	56e7195e-9d95-41eb-b776-924d6ead8b45	pending	\N	\N	\N	\N	\N	\N
54bcadbb-3f60-402e-9fb5-1dcbf2a3695c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	ec151a25-440b-4bb8-951a-60f8fa5c42aa	pending	\N	\N	\N	\N	\N	\N
f597eda9-1c5f-4294-be1b-e86c384e1232	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	db552fa7-40d4-4f8b-ae35-535d9a38f422	pending	\N	\N	\N	\N	\N	\N
457f4ac4-f927-42d3-9a9b-67e324aaac43	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	59703fc1-3792-4e00-ba45-d2612bdf9cd2	pending	\N	\N	\N	\N	\N	\N
92c2b206-ecb5-485d-a4ee-78bd4b871ad6	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	c768a363-a74b-4cd6-b7e2-04a1e7591121	pending	\N	\N	\N	\N	\N	\N
f6e9248a-57b9-4081-b7e1-5236445a773b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	21f9f74b-d38a-49ea-9f0a-5ff062ad9a25	pending	\N	\N	\N	\N	\N	\N
5658f648-8dd9-44a3-b18b-47cb8c933e75	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	4d2275e3-0590-4352-9bc4-42738e2fa3e3	pending	\N	\N	\N	\N	\N	\N
4649296c-51ed-4067-bdda-cad39d856a42	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	8f0844ab-cade-4aa7-af50-acf8b8ac8392	pending	\N	\N	\N	\N	\N	\N
1f98f6e6-cc2e-49fa-b74d-556c1fb761ef	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	c8ab532b-2912-4ba1-bf23-5b6a9675e891	pending	\N	\N	\N	\N	\N	\N
a214e59d-7b5d-4611-9e55-e586b21b1596	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	a6bb2a07-c44e-4fee-8b04-624ec4fbf63a	pending	\N	\N	\N	\N	\N	\N
e9396fbd-8490-456a-a21c-714858b86a03	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	fe7bc2c6-3f89-4e0f-9eb5-03d1408a0507	pending	\N	\N	\N	\N	\N	\N
2806519d-803a-4ea8-b0e8-7d50ada28921	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	e7d6645c-bf43-48b2-96d1-a4e2489a1e31	pending	\N	\N	\N	\N	\N	\N
1cb9b598-dd0c-42d5-8e1e-af9a17098931	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	cbe5729c-fff2-4eb5-aea3-9711c0868ee1	pending	\N	\N	\N	\N	\N	\N
4cf5d2ee-56c4-4d15-80b6-0c5da26f9e2e	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	975a504a-b40b-44db-b4e9-6e93e0f50c5e	pending	\N	\N	\N	\N	\N	\N
92d0c44f-8064-40b6-b7d2-6e780e4371ef	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	9b1180f3-8170-40e9-a21d-f082cb480b1f	pending	\N	\N	\N	\N	\N	\N
a18b9a67-2353-4b0c-904f-c6765aacb878	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	55563828-0f0b-4b0c-b95d-acbb8f83ae6f	pending	\N	\N	\N	\N	\N	\N
e5e91b23-dfaf-48f7-898d-de0ac212f77f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	3bfc5834-eaba-4c3d-b82e-f2a74eb30dca	pending	\N	\N	\N	\N	\N	\N
6e1102fc-b7ff-4c77-927c-2194f74e9ba7	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	335dc9f5-ee0d-4ea3-9d32-78b49c554073	pending	\N	\N	\N	\N	\N	\N
c59f8be2-3053-4bf0-b6fd-42fd69cce2f8	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	90e72c62-d36e-4561-9c1e-765c7504eb73	pending	\N	\N	\N	\N	\N	\N
c9fea7ce-716f-4fa0-8c01-963c10571bd1	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	77dbd755-b2cf-4662-9f79-9d75b9efa46c	pending	\N	\N	\N	\N	\N	\N
9a4e6795-b5de-47cd-aad6-8f66ee9d78e5	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	cce27dbe-160a-4844-b83a-cb5715812517	pending	\N	\N	\N	\N	\N	\N
7c34591b-aacf-4a49-a16a-b57b48b00e5b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	257b0f05-b370-4607-8ce6-84aec9080d49	pending	\N	\N	\N	\N	\N	\N
f35cd66d-ee4b-4a8d-9a44-03f7bd3774bf	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	40cd9142-c1c4-4969-9fd0-ba27e1553ba2	pending	\N	\N	\N	\N	\N	\N
8d6a1848-444e-4b42-8c64-e32db1138e04	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	3b9212c5-4025-4b18-8bb7-ed02011acd4c	pending	\N	\N	\N	\N	\N	\N
b5699a88-e266-4484-8460-99d293fe40a9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	2e1b030d-b55d-46df-a3be-404bb7a368cf	pending	\N	\N	\N	\N	\N	\N
18c8df6f-d3fc-4e26-ad55-eb404701fe72	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	13b241b5-e959-48b8-b741-86d932fb1e7c	pending	\N	\N	\N	\N	\N	\N
7b8fd7ee-ca26-4b51-acda-9cb1142b9672	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	3f3a4628-3be8-4cef-8480-46d2fb99c9f9	pending	\N	\N	\N	\N	\N	\N
e6e18dc0-3879-4074-9b33-7f7f35272736	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	b4f32f00-af34-4e60-ace0-f37843d5f2ab	pending	\N	\N	\N	\N	\N	\N
0617a047-dedf-4504-b8a3-596923bdf84b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	41b19327-d33c-45fa-bc37-b0346414a85b	pending	\N	\N	\N	\N	\N	\N
f76d3ea7-f1df-48fb-ac45-0e1f7805aaf2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	a2f740a5-867d-40c4-9dee-9ef96886554c	pending	\N	\N	\N	\N	\N	\N
1d7fc245-528d-4c4a-9a9f-8ad690cf42b8	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	eebdc4eb-df2c-4064-9875-5d0267660480	pending	\N	\N	\N	\N	\N	\N
481d4f59-d8ee-44ea-a10d-17f36b5b30bc	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	dff31d86-d6ab-4125-9e24-2205029a8379	pending	\N	\N	\N	\N	\N	\N
41cf3280-9eb4-4113-91ab-ded44d050861	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	48e071b5-3332-4582-948b-bffc48d3ca9c	pending	\N	\N	\N	\N	\N	\N
845f9518-38e1-4f10-b337-2bce7a1899a0	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	ce5811e7-b6bb-4a33-953a-194b7a294da3	pending	\N	\N	\N	\N	\N	\N
7ca0acbe-f8eb-4464-bf47-12b9923c096c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	fb660454-871c-4436-ab39-6a61f64e044b	pending	\N	\N	\N	\N	\N	\N
5b62b4e6-0539-49dc-9982-fef566409c46	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	9cbaea41-b097-468b-a55d-1b60d825ab04	pending	\N	\N	\N	\N	\N	\N
7f7fd75c-fab4-4be9-b6dd-547ba153cdf4	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	4be05588-7ad7-4cec-9f5d-112bcaecdd21	pending	\N	\N	\N	\N	\N	\N
a06b5d0e-fa7b-48d1-9bb2-4702bd5d100e	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	be2fd2b2-0039-4e17-b2b1-9f3e2fc33c6b	pending	\N	\N	\N	\N	\N	\N
d37c8e06-6b6d-4ee7-8038-608b51d8adcc	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	f120e862-68f0-40eb-a84a-b6927ce51a90	pending	\N	\N	\N	\N	\N	\N
212e1482-9d99-429a-bd5f-b8a0f4a65e01	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	b5547bbf-ab34-4882-9846-fba230b69a7b	pending	\N	\N	\N	\N	\N	\N
08a14cd8-b188-42d6-b28c-5df74a5a86c6	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	707c6d78-6d9f-47dd-8186-917ec255ffb2	pending	\N	\N	\N	\N	\N	\N
baf6a13f-8794-4fe2-bf04-70b1af2cee80	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	64c1aa57-1dbf-4e8c-83cd-2325b8ba0e13	pending	\N	\N	\N	\N	\N	\N
fa31c3b9-9844-4d4e-91c7-bfa9102abbb6	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	2c9d0db2-83b8-4340-bba1-12ad1acebcda	pending	\N	\N	\N	\N	\N	\N
056fe49f-d5fb-449e-8cf9-d8d788d2c6c0	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	ea8bd191-46fd-4e86-ae8d-b3f7354e6c2c	pending	\N	\N	\N	\N	\N	\N
6d90de62-d4c9-465a-a3ff-cd5daa9e5745	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	a419c96c-bb0f-4973-9598-49e88ab2cfa0	pending	\N	\N	\N	\N	\N	\N
a761c97d-533b-4ba3-aff8-8d79a25991d2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	5b76ebc3-05b5-4008-9e8a-8e91866c4536	pending	\N	\N	\N	\N	\N	\N
ff531e11-6e53-4710-b334-9027f50daa34	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	4b42d2d7-df7a-425d-b753-5d83c3103d65	pending	\N	\N	\N	\N	\N	\N
8d601dd3-f3da-45d8-9baa-8235b3297fe0	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	96347f98-91c7-4fec-bc21-be300e60ba28	pending	\N	\N	\N	\N	\N	\N
59668531-fe2c-4ec3-b36c-d90fce10dd73	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	60b0cf22-6574-4d36-b521-7b1725bca50f	pending	\N	\N	\N	\N	\N	\N
97e59e07-bacb-4010-8417-312e069572f9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	a7f68e92-8192-4183-912b-8af85c4d13ee	pending	\N	\N	\N	\N	\N	\N
5582ae33-27d5-4cde-a290-61e2a7ccd74c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	65718161-113b-4d95-9df4-f0405428a823	pending	\N	\N	\N	\N	\N	\N
e0202b18-beba-4a1b-94ff-f94a17dcc2b5	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	f291c7cd-cfea-47e1-a384-b4ecdef4f4da	pending	\N	\N	\N	\N	\N	\N
b0a3ca25-753b-412e-9c94-ef2effdcc9a4	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	808f9f99-6a43-4114-804d-6104d63222fd	96a66cc1-f80a-47ad-a643-0b946cffa02e	pending	\N	\N	\N	\N	\N	\N
4199840c-7129-4f84-ba5f-033cd0f29d5a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	54de01b5-6711-4e2f-b4e5-83b8a658c1ea	pending	\N	\N	\N	\N	\N	\N
07e856fc-e605-42b2-ae20-0a33b524b00a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	2bbf52cf-3942-43da-9e74-1ccab5d8f5b7	pending	\N	\N	\N	\N	\N	\N
5886be7a-d0e9-47ee-b571-32c30bc96991	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	40fed8d4-2408-4e91-998d-04548cf33cf1	pending	\N	\N	\N	\N	\N	\N
6654a7d5-418b-4e16-be46-5a2dec94e7c3	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	df7f131c-ad24-413e-8640-dac8493be026	pending	\N	\N	\N	\N	\N	\N
86f24a13-243c-4b36-a30d-add9776b61f0	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	609bab0d-72bd-4ee9-80fd-3f4d1db92bed	pending	\N	\N	\N	\N	\N	\N
19b83d2a-508b-40db-a97c-6bf3bc802ad2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	011aa579-858b-4fec-a3cb-bed8bdd9f82d	pending	\N	\N	\N	\N	\N	\N
26b48d95-67f6-4d7c-9aec-d68ba0eeb6c7	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	8a2d8daa-1687-4d8d-b54d-7864bd8d7887	pending	\N	\N	\N	\N	\N	\N
b0422369-c3cd-4849-b79f-d60e0e533136	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	a0498893-beb3-4500-adcc-f56270dab200	pending	\N	\N	\N	\N	\N	\N
8cb88000-0424-41c9-88e0-e738ba304ae5	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	8c16dfa4-433d-44fb-aa00-82b12b83febc	pending	\N	\N	\N	\N	\N	\N
34820d90-85cb-4f8d-97ae-80c659a1d7df	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	c071fc1e-af9a-490b-bcdf-af80b46d511c	pending	\N	\N	\N	\N	\N	\N
d3a1f89d-58f2-456d-93dd-39655509daa2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	46c90232-8f81-49a5-84e3-5eada2ab01e3	pending	\N	\N	\N	\N	\N	\N
9aa3b8eb-e697-4978-83e4-c550653dbb4f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	812f8dcd-a92b-46dc-b9ec-18b272872999	pending	\N	\N	\N	\N	\N	\N
d8dce058-be60-4ef0-bc6b-06f2f3144d15	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	ec95e8fd-2203-46f6-b941-0e19cb62d92f	pending	\N	\N	\N	\N	\N	\N
778d4e8d-f4b3-415d-9548-e4906f45cc75	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	cf1ead87-bc0e-4710-8356-8791329f48d1	pending	\N	\N	\N	\N	\N	\N
f766c0cd-0d71-43da-9a1c-5cfc6c621c64	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	cdd2f7af-be6e-457a-a465-13900fd2449b	pending	\N	\N	\N	\N	\N	\N
316cf49d-3ed7-44ba-942c-98ee765e00ef	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	e48c91a4-3b94-463c-8977-5e35344d1315	pending	\N	\N	\N	\N	\N	\N
c80ac8ab-6b60-44fd-ab27-f8fa8a3a475f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	81af9c2e-f599-47e5-8b27-b29b5cc577cd	pending	\N	\N	\N	\N	\N	\N
4f98f6fd-ba37-4b73-9dd0-2047c0470dff	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	e01773e0-ebb9-471a-be8c-98f2951a1454	pending	\N	\N	\N	\N	\N	\N
27afe799-9799-4b66-a8d1-ccf7a901501a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	72ed8bbc-c906-462b-91ae-5c8e602a9581	pending	\N	\N	\N	\N	\N	\N
8242e345-740a-424a-9288-b490d6f8e603	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	f5fcaeab-8802-4e50-b73d-4a057431d3fd	pending	\N	\N	\N	\N	\N	\N
23a781ac-8735-46d3-b1ab-8a7bd44e2fd1	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	7c2ee432-f7a2-468a-91a4-d6da3a69ee91	pending	\N	\N	\N	\N	\N	\N
8f74eb8f-d7bb-4e95-b32b-1c0d9a008116	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	56e7195e-9d95-41eb-b776-924d6ead8b45	pending	\N	\N	\N	\N	\N	\N
21f8ae23-9bba-4e6e-8d55-ec19db0207e9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	ec151a25-440b-4bb8-951a-60f8fa5c42aa	pending	\N	\N	\N	\N	\N	\N
804b6748-4eea-4f0c-b2ff-5d551f7f5d0f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	db552fa7-40d4-4f8b-ae35-535d9a38f422	pending	\N	\N	\N	\N	\N	\N
9e9a3d66-7109-4ede-ba27-4f0895a2d4a1	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	59703fc1-3792-4e00-ba45-d2612bdf9cd2	pending	\N	\N	\N	\N	\N	\N
721c4710-6614-4b19-b334-93dd9e69fd11	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	c768a363-a74b-4cd6-b7e2-04a1e7591121	pending	\N	\N	\N	\N	\N	\N
f74829ed-a245-45ce-90a4-6e5b1478745c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	21f9f74b-d38a-49ea-9f0a-5ff062ad9a25	pending	\N	\N	\N	\N	\N	\N
4bc1db62-6432-45f4-90af-cce4e64e902f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	4d2275e3-0590-4352-9bc4-42738e2fa3e3	pending	\N	\N	\N	\N	\N	\N
7afb7576-fb82-48ee-b6f5-519ddecba4bd	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	8f0844ab-cade-4aa7-af50-acf8b8ac8392	pending	\N	\N	\N	\N	\N	\N
dbc0d7f7-8ce7-49d8-8250-c509ed5df371	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	c8ab532b-2912-4ba1-bf23-5b6a9675e891	pending	\N	\N	\N	\N	\N	\N
b5dc15ef-0f9f-4f37-983b-93ca90372a1f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	a6bb2a07-c44e-4fee-8b04-624ec4fbf63a	pending	\N	\N	\N	\N	\N	\N
d061e916-46b8-47a9-a7fe-897a262ea46b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	fe7bc2c6-3f89-4e0f-9eb5-03d1408a0507	pending	\N	\N	\N	\N	\N	\N
12d09aa0-59f7-4874-8dfe-9c10d3b1b4dd	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	e7d6645c-bf43-48b2-96d1-a4e2489a1e31	pending	\N	\N	\N	\N	\N	\N
92f6bea4-31be-43ce-8383-df4e95d2bdbc	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	cbe5729c-fff2-4eb5-aea3-9711c0868ee1	pending	\N	\N	\N	\N	\N	\N
2204135e-39dc-48e6-b15a-9887afec3428	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	975a504a-b40b-44db-b4e9-6e93e0f50c5e	pending	\N	\N	\N	\N	\N	\N
27d64f8a-d14c-4513-bbd9-be5c4295ab53	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	9b1180f3-8170-40e9-a21d-f082cb480b1f	pending	\N	\N	\N	\N	\N	\N
47e31126-440e-4714-8f2b-ffcacdc9a5d0	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	55563828-0f0b-4b0c-b95d-acbb8f83ae6f	pending	\N	\N	\N	\N	\N	\N
2419a86c-3974-467b-a723-f556ef2f3e4d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	3bfc5834-eaba-4c3d-b82e-f2a74eb30dca	pending	\N	\N	\N	\N	\N	\N
38a94dac-e63e-424d-a0e5-1f11bffd724a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	335dc9f5-ee0d-4ea3-9d32-78b49c554073	pending	\N	\N	\N	\N	\N	\N
3a0eafca-e4da-408f-89a2-a25e567014d9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	90e72c62-d36e-4561-9c1e-765c7504eb73	pending	\N	\N	\N	\N	\N	\N
43c29a6d-6167-4d5c-a93c-ca27c9aac8bb	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	77dbd755-b2cf-4662-9f79-9d75b9efa46c	pending	\N	\N	\N	\N	\N	\N
d8540d20-647d-4d32-a34d-5a404e2a0872	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	cce27dbe-160a-4844-b83a-cb5715812517	pending	\N	\N	\N	\N	\N	\N
28dbf6c8-96f3-41d3-a819-377da01105db	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	257b0f05-b370-4607-8ce6-84aec9080d49	pending	\N	\N	\N	\N	\N	\N
baf1c7e1-3f22-4286-acd2-17b07510a5ea	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	40cd9142-c1c4-4969-9fd0-ba27e1553ba2	pending	\N	\N	\N	\N	\N	\N
ae939a94-bc76-4e9d-b646-64bd3358ef4a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	3b9212c5-4025-4b18-8bb7-ed02011acd4c	pending	\N	\N	\N	\N	\N	\N
0c4a97f7-d0eb-468b-880b-4a82cf1bcfe7	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	2e1b030d-b55d-46df-a3be-404bb7a368cf	pending	\N	\N	\N	\N	\N	\N
6edda8ef-a022-4f40-854d-9d3e37a9cd9a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	13b241b5-e959-48b8-b741-86d932fb1e7c	pending	\N	\N	\N	\N	\N	\N
030cb845-c245-48b6-867e-47f44feee112	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	3f3a4628-3be8-4cef-8480-46d2fb99c9f9	pending	\N	\N	\N	\N	\N	\N
c2f347c6-7dd4-46be-aa8a-dd10c3a9f18d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	b4f32f00-af34-4e60-ace0-f37843d5f2ab	pending	\N	\N	\N	\N	\N	\N
3a41794e-26a7-4e37-bec1-6694d8782ad3	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	41b19327-d33c-45fa-bc37-b0346414a85b	pending	\N	\N	\N	\N	\N	\N
1eda2fe1-1315-43ac-b5f2-8af84236cb3c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	a2f740a5-867d-40c4-9dee-9ef96886554c	pending	\N	\N	\N	\N	\N	\N
badf8f0e-12cb-4515-91c7-f1f147b99ff2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	eebdc4eb-df2c-4064-9875-5d0267660480	pending	\N	\N	\N	\N	\N	\N
6ded6b76-9d30-4707-a340-7e6c644b3130	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	dff31d86-d6ab-4125-9e24-2205029a8379	pending	\N	\N	\N	\N	\N	\N
04d95987-71bc-4e17-a7e4-91eee41ca450	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	48e071b5-3332-4582-948b-bffc48d3ca9c	pending	\N	\N	\N	\N	\N	\N
6794e5f2-bbe2-496d-b33e-9b0b441ef21b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	ce5811e7-b6bb-4a33-953a-194b7a294da3	pending	\N	\N	\N	\N	\N	\N
0de051b3-19fd-45ce-8a93-01d020871ded	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	fb660454-871c-4436-ab39-6a61f64e044b	pending	\N	\N	\N	\N	\N	\N
7760b746-7602-452d-a8e1-3eec60a91b87	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	9cbaea41-b097-468b-a55d-1b60d825ab04	pending	\N	\N	\N	\N	\N	\N
ac4aa431-9be2-4e3b-a3d6-ebc605eb2dfd	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	4be05588-7ad7-4cec-9f5d-112bcaecdd21	pending	\N	\N	\N	\N	\N	\N
457115eb-8e46-4d58-beec-af1598783efc	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	be2fd2b2-0039-4e17-b2b1-9f3e2fc33c6b	pending	\N	\N	\N	\N	\N	\N
8b53fcae-607b-4145-8ad4-a291681841cc	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	f120e862-68f0-40eb-a84a-b6927ce51a90	pending	\N	\N	\N	\N	\N	\N
fbcae5e4-03af-4575-8118-28d98fe91045	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	b5547bbf-ab34-4882-9846-fba230b69a7b	pending	\N	\N	\N	\N	\N	\N
4c12f057-0021-42b9-96d5-3ccb6bc67890	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	707c6d78-6d9f-47dd-8186-917ec255ffb2	pending	\N	\N	\N	\N	\N	\N
277ed16f-326e-429c-bf62-d7117ab524e2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	64c1aa57-1dbf-4e8c-83cd-2325b8ba0e13	pending	\N	\N	\N	\N	\N	\N
76a34562-2f3c-4fed-ad8a-305040207108	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	2c9d0db2-83b8-4340-bba1-12ad1acebcda	pending	\N	\N	\N	\N	\N	\N
cee8fea5-db9f-4479-abda-4961741d8fee	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	ea8bd191-46fd-4e86-ae8d-b3f7354e6c2c	pending	\N	\N	\N	\N	\N	\N
dd508bd3-7e16-49d7-8ec6-15139d4842bc	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	a419c96c-bb0f-4973-9598-49e88ab2cfa0	pending	\N	\N	\N	\N	\N	\N
c5a6226e-4dda-4de5-8e4e-f6b56f0ef65d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	5b76ebc3-05b5-4008-9e8a-8e91866c4536	pending	\N	\N	\N	\N	\N	\N
768aa0fb-4295-4fb3-8404-45b125f0ab5e	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	4b42d2d7-df7a-425d-b753-5d83c3103d65	pending	\N	\N	\N	\N	\N	\N
9791ec2d-bee6-4ab4-9851-7d6ed833cd67	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	96347f98-91c7-4fec-bc21-be300e60ba28	pending	\N	\N	\N	\N	\N	\N
5944acdb-d31f-48ac-9f0a-c2bf2d129beb	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	60b0cf22-6574-4d36-b521-7b1725bca50f	pending	\N	\N	\N	\N	\N	\N
7415fb80-d762-4f9b-b0f4-df13c7204ed2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	a7f68e92-8192-4183-912b-8af85c4d13ee	pending	\N	\N	\N	\N	\N	\N
600919ec-5da2-4344-8a23-ed4ee3c99620	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	65718161-113b-4d95-9df4-f0405428a823	pending	\N	\N	\N	\N	\N	\N
43859086-d248-4ec8-b6ee-fd96681a7b97	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	f291c7cd-cfea-47e1-a384-b4ecdef4f4da	pending	\N	\N	\N	\N	\N	\N
18f9b34d-b359-4029-8458-79709987967a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	73400575-bed3-4ac9-9051-91f8fc4742df	96a66cc1-f80a-47ad-a643-0b946cffa02e	pending	\N	\N	\N	\N	\N	\N
aea4cc96-4edd-4dbf-8224-806aba54f4b5	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	54de01b5-6711-4e2f-b4e5-83b8a658c1ea	pending	\N	\N	\N	\N	\N	\N
8e637fe4-be02-4b0c-a496-e7ef946e0b54	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	2bbf52cf-3942-43da-9e74-1ccab5d8f5b7	pending	\N	\N	\N	\N	\N	\N
a9c9dfe6-8b81-4dc2-b6f0-ce2d15f7e811	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	40fed8d4-2408-4e91-998d-04548cf33cf1	pending	\N	\N	\N	\N	\N	\N
1604b756-d66c-4ae5-8087-6b4c97ad59b0	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	df7f131c-ad24-413e-8640-dac8493be026	pending	\N	\N	\N	\N	\N	\N
c4353826-9261-4c12-be74-eeac9426dcb9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	609bab0d-72bd-4ee9-80fd-3f4d1db92bed	pending	\N	\N	\N	\N	\N	\N
6d022a2e-71c9-484b-b405-d81f2ad44fdb	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	011aa579-858b-4fec-a3cb-bed8bdd9f82d	pending	\N	\N	\N	\N	\N	\N
58c1c1d9-6dd0-458f-901f-a0e4508fb236	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	8a2d8daa-1687-4d8d-b54d-7864bd8d7887	pending	\N	\N	\N	\N	\N	\N
05d381c5-60e9-4bea-9795-77091ad6c06e	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	a0498893-beb3-4500-adcc-f56270dab200	pending	\N	\N	\N	\N	\N	\N
83819f16-5ca6-4233-96c0-7cc09c452c19	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	8c16dfa4-433d-44fb-aa00-82b12b83febc	pending	\N	\N	\N	\N	\N	\N
decb6511-434e-4535-9ebb-4bd22b11cc41	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	c071fc1e-af9a-490b-bcdf-af80b46d511c	pending	\N	\N	\N	\N	\N	\N
b94bd9c0-8b62-48fb-b5de-8bf4446c2706	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	46c90232-8f81-49a5-84e3-5eada2ab01e3	pending	\N	\N	\N	\N	\N	\N
30730381-7cb8-498c-879b-11ea3881e7d4	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	812f8dcd-a92b-46dc-b9ec-18b272872999	pending	\N	\N	\N	\N	\N	\N
99168cae-18f6-475e-92c0-a0c2c30359df	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	ec95e8fd-2203-46f6-b941-0e19cb62d92f	pending	\N	\N	\N	\N	\N	\N
8af34efe-a9a4-4cbd-93e0-7bc4678a762f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	cf1ead87-bc0e-4710-8356-8791329f48d1	pending	\N	\N	\N	\N	\N	\N
884ce763-c86d-4a7f-941f-25b440f0b7ad	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	cdd2f7af-be6e-457a-a465-13900fd2449b	pending	\N	\N	\N	\N	\N	\N
47e9c96d-ef5c-4eb3-b056-4886c2b7ba0b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	e48c91a4-3b94-463c-8977-5e35344d1315	pending	\N	\N	\N	\N	\N	\N
7428926a-7838-4c91-9b6b-28537c96b1da	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	81af9c2e-f599-47e5-8b27-b29b5cc577cd	pending	\N	\N	\N	\N	\N	\N
afc070ee-af11-4ac9-be21-2a0a073ecffb	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	e01773e0-ebb9-471a-be8c-98f2951a1454	pending	\N	\N	\N	\N	\N	\N
356dbde6-3c66-48ed-b732-62b432f65260	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	72ed8bbc-c906-462b-91ae-5c8e602a9581	pending	\N	\N	\N	\N	\N	\N
4fceb40d-c0e3-4e35-b763-9567ab81f77f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	f5fcaeab-8802-4e50-b73d-4a057431d3fd	pending	\N	\N	\N	\N	\N	\N
e64ae39e-48b3-4f1a-8a09-cfa174f5cdde	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	7c2ee432-f7a2-468a-91a4-d6da3a69ee91	pending	\N	\N	\N	\N	\N	\N
c01ca93c-331c-4735-9704-f19b88b87052	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	56e7195e-9d95-41eb-b776-924d6ead8b45	pending	\N	\N	\N	\N	\N	\N
a0562405-ea17-474e-bb3f-7ec16ae23578	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	ec151a25-440b-4bb8-951a-60f8fa5c42aa	pending	\N	\N	\N	\N	\N	\N
ca28d105-0d8c-4ba4-9803-3a2d80e0d245	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	db552fa7-40d4-4f8b-ae35-535d9a38f422	pending	\N	\N	\N	\N	\N	\N
4577a846-49c3-4463-b421-697128d2be15	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	59703fc1-3792-4e00-ba45-d2612bdf9cd2	pending	\N	\N	\N	\N	\N	\N
bbfd78e3-de06-4c3a-8468-1e3a4da00fa8	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	c768a363-a74b-4cd6-b7e2-04a1e7591121	pending	\N	\N	\N	\N	\N	\N
0726e285-eb2c-40ec-bf87-59db4ab4086f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	21f9f74b-d38a-49ea-9f0a-5ff062ad9a25	pending	\N	\N	\N	\N	\N	\N
0ad98bc4-1f67-4469-832a-0356a5470907	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	4d2275e3-0590-4352-9bc4-42738e2fa3e3	pending	\N	\N	\N	\N	\N	\N
365b299f-d9c8-446e-988a-88abed8788ca	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	8f0844ab-cade-4aa7-af50-acf8b8ac8392	pending	\N	\N	\N	\N	\N	\N
8c84808a-efc0-4719-a410-006311544805	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	c8ab532b-2912-4ba1-bf23-5b6a9675e891	pending	\N	\N	\N	\N	\N	\N
e54d2df3-5382-4758-a2a1-17e4eeeec81f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	a6bb2a07-c44e-4fee-8b04-624ec4fbf63a	pending	\N	\N	\N	\N	\N	\N
92ae6da0-8780-4e73-8b33-c20b78caf08d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	fe7bc2c6-3f89-4e0f-9eb5-03d1408a0507	pending	\N	\N	\N	\N	\N	\N
6644829a-eeba-4eae-ae1d-3784340d3369	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	e7d6645c-bf43-48b2-96d1-a4e2489a1e31	pending	\N	\N	\N	\N	\N	\N
ef9b2a2e-da53-4c6c-8fb8-abd319bcf0a5	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	cbe5729c-fff2-4eb5-aea3-9711c0868ee1	pending	\N	\N	\N	\N	\N	\N
0a078365-7f06-4509-bb6b-0ba595418792	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	975a504a-b40b-44db-b4e9-6e93e0f50c5e	pending	\N	\N	\N	\N	\N	\N
02db4fd7-4cf5-40bd-9892-224f8a044385	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	9b1180f3-8170-40e9-a21d-f082cb480b1f	pending	\N	\N	\N	\N	\N	\N
d24ec315-dc0a-49ad-9614-fea1e0d45b01	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	55563828-0f0b-4b0c-b95d-acbb8f83ae6f	pending	\N	\N	\N	\N	\N	\N
d7c0651d-f6e7-41c6-b6e7-73546012dea0	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	3bfc5834-eaba-4c3d-b82e-f2a74eb30dca	pending	\N	\N	\N	\N	\N	\N
811f1bb0-c412-4aa2-8060-85b95d3ae895	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	335dc9f5-ee0d-4ea3-9d32-78b49c554073	pending	\N	\N	\N	\N	\N	\N
7d9ed7d1-3c9c-422d-88e9-570d2db88f04	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	90e72c62-d36e-4561-9c1e-765c7504eb73	pending	\N	\N	\N	\N	\N	\N
56e664d4-b469-4179-9ee2-3a1351dab7c3	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	77dbd755-b2cf-4662-9f79-9d75b9efa46c	pending	\N	\N	\N	\N	\N	\N
87fadf3e-f82e-4452-b80e-492f556da9f9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	cce27dbe-160a-4844-b83a-cb5715812517	pending	\N	\N	\N	\N	\N	\N
0d3bc178-55f7-4bab-97c1-885a43b03530	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	257b0f05-b370-4607-8ce6-84aec9080d49	pending	\N	\N	\N	\N	\N	\N
9d85e02d-9339-464a-aaab-1dd05dcdf15c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	40cd9142-c1c4-4969-9fd0-ba27e1553ba2	pending	\N	\N	\N	\N	\N	\N
bb41099e-eae7-4cda-829c-db3b988fde3b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	3b9212c5-4025-4b18-8bb7-ed02011acd4c	pending	\N	\N	\N	\N	\N	\N
bf4e4e18-4c2a-453d-a7e7-e78001483594	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	2e1b030d-b55d-46df-a3be-404bb7a368cf	pending	\N	\N	\N	\N	\N	\N
5cc71175-7ed1-49d9-84e6-a017fbc93d4b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	13b241b5-e959-48b8-b741-86d932fb1e7c	pending	\N	\N	\N	\N	\N	\N
fc6efc07-cd82-45ab-9ae2-e868e74a1f9a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	3f3a4628-3be8-4cef-8480-46d2fb99c9f9	pending	\N	\N	\N	\N	\N	\N
1615d401-24ff-417a-8ee2-fb1016ad76ec	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	b4f32f00-af34-4e60-ace0-f37843d5f2ab	pending	\N	\N	\N	\N	\N	\N
c1413fc7-cc22-4330-b43e-28bf088efa49	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	41b19327-d33c-45fa-bc37-b0346414a85b	pending	\N	\N	\N	\N	\N	\N
7bf0ebb7-34dc-4215-a071-8b20ecb22c63	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	a2f740a5-867d-40c4-9dee-9ef96886554c	pending	\N	\N	\N	\N	\N	\N
ba86cb09-6a2c-4005-a78b-cebca84b7a90	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	eebdc4eb-df2c-4064-9875-5d0267660480	pending	\N	\N	\N	\N	\N	\N
25151954-64c0-466d-a0d5-771a19e640d4	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	dff31d86-d6ab-4125-9e24-2205029a8379	pending	\N	\N	\N	\N	\N	\N
e55ae5ff-5653-49a2-a45e-25e6694782fc	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	48e071b5-3332-4582-948b-bffc48d3ca9c	pending	\N	\N	\N	\N	\N	\N
46b43e37-c5fe-4486-a167-3e8f808b7a09	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	ce5811e7-b6bb-4a33-953a-194b7a294da3	pending	\N	\N	\N	\N	\N	\N
d9bd77bc-d01b-44c5-968c-a93d79c9ce50	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	fb660454-871c-4436-ab39-6a61f64e044b	pending	\N	\N	\N	\N	\N	\N
4953114c-a9c1-41f0-8982-aaf8e57117af	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	9cbaea41-b097-468b-a55d-1b60d825ab04	pending	\N	\N	\N	\N	\N	\N
559a3ec8-5556-47b5-9995-7a85a738fa9a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	4be05588-7ad7-4cec-9f5d-112bcaecdd21	pending	\N	\N	\N	\N	\N	\N
8cd223bf-0d54-4f5a-a83e-e98ae8be576a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	be2fd2b2-0039-4e17-b2b1-9f3e2fc33c6b	pending	\N	\N	\N	\N	\N	\N
f771961e-cb37-400e-9db8-eef2edc607e5	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	f120e862-68f0-40eb-a84a-b6927ce51a90	pending	\N	\N	\N	\N	\N	\N
9c202a6f-cdd7-4083-aa26-04981a94574f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	b5547bbf-ab34-4882-9846-fba230b69a7b	pending	\N	\N	\N	\N	\N	\N
d6a71ca6-9766-409a-b35c-662a6153d407	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	707c6d78-6d9f-47dd-8186-917ec255ffb2	pending	\N	\N	\N	\N	\N	\N
15011d53-336a-49d6-b254-caa551dc0376	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	64c1aa57-1dbf-4e8c-83cd-2325b8ba0e13	pending	\N	\N	\N	\N	\N	\N
ccccfe86-f371-4ddc-bdbe-9185a5483313	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	2c9d0db2-83b8-4340-bba1-12ad1acebcda	pending	\N	\N	\N	\N	\N	\N
fcc4ab4b-3c41-4fa8-96af-e7bc0c92ec99	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	ea8bd191-46fd-4e86-ae8d-b3f7354e6c2c	pending	\N	\N	\N	\N	\N	\N
9ca5fad0-b891-459b-95be-6314c473689b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	a419c96c-bb0f-4973-9598-49e88ab2cfa0	pending	\N	\N	\N	\N	\N	\N
f32bf49f-6def-4f28-a326-edd2ec440c4b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	5b76ebc3-05b5-4008-9e8a-8e91866c4536	pending	\N	\N	\N	\N	\N	\N
93432c2b-5bfb-452d-bb37-f457cbc5eee5	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	4b42d2d7-df7a-425d-b753-5d83c3103d65	pending	\N	\N	\N	\N	\N	\N
0af94e5b-7ac8-4587-bf08-d898d1749117	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	96347f98-91c7-4fec-bc21-be300e60ba28	pending	\N	\N	\N	\N	\N	\N
10348a31-7d56-4ee8-9d7e-b1e06c57735a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	60b0cf22-6574-4d36-b521-7b1725bca50f	pending	\N	\N	\N	\N	\N	\N
86047c4f-364d-4efb-9eee-a91a989d2052	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	a7f68e92-8192-4183-912b-8af85c4d13ee	pending	\N	\N	\N	\N	\N	\N
8908a7aa-570d-4b27-9fd6-8a1be228d32a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	65718161-113b-4d95-9df4-f0405428a823	pending	\N	\N	\N	\N	\N	\N
0aea39cd-d5c6-4352-a43a-715ba576f600	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	f291c7cd-cfea-47e1-a384-b4ecdef4f4da	pending	\N	\N	\N	\N	\N	\N
c023e20c-3ca8-403a-b08b-6bdf2db8d520	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9076480a-0f0d-4416-a19b-a08de87dac89	96a66cc1-f80a-47ad-a643-0b946cffa02e	pending	\N	\N	\N	\N	\N	\N
debd0779-7139-46cd-bd95-b7a2c17164df	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	54de01b5-6711-4e2f-b4e5-83b8a658c1ea	pending	\N	\N	\N	\N	\N	\N
e183b515-e8ea-44b4-bc1f-b861e38c7f4a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	2bbf52cf-3942-43da-9e74-1ccab5d8f5b7	pending	\N	\N	\N	\N	\N	\N
9d8fd132-0618-41a5-8cc8-0d1e80c9246b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	40fed8d4-2408-4e91-998d-04548cf33cf1	pending	\N	\N	\N	\N	\N	\N
f73f6360-3586-4397-bbf9-e791ca68554c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	df7f131c-ad24-413e-8640-dac8493be026	pending	\N	\N	\N	\N	\N	\N
f2bbd90b-87b4-494b-9972-c75de1213d94	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	609bab0d-72bd-4ee9-80fd-3f4d1db92bed	pending	\N	\N	\N	\N	\N	\N
20b4ae15-8443-466c-ac31-ae463ef9ba49	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	011aa579-858b-4fec-a3cb-bed8bdd9f82d	pending	\N	\N	\N	\N	\N	\N
06129a00-980f-4c7e-b971-d8c019bcf56d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	8a2d8daa-1687-4d8d-b54d-7864bd8d7887	pending	\N	\N	\N	\N	\N	\N
056d96d7-cc60-4b53-8d60-5c3984b7c710	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	a0498893-beb3-4500-adcc-f56270dab200	pending	\N	\N	\N	\N	\N	\N
192db04c-e4f4-4b71-b6ff-c42e74388634	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	8c16dfa4-433d-44fb-aa00-82b12b83febc	pending	\N	\N	\N	\N	\N	\N
201855f9-d818-4f28-b2bb-78a963b6fe57	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	c071fc1e-af9a-490b-bcdf-af80b46d511c	pending	\N	\N	\N	\N	\N	\N
433d7486-f47f-4ded-bc24-0bd50c160d7e	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	46c90232-8f81-49a5-84e3-5eada2ab01e3	pending	\N	\N	\N	\N	\N	\N
5eed4443-2cbb-42f4-b9c0-4985219158b9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	812f8dcd-a92b-46dc-b9ec-18b272872999	pending	\N	\N	\N	\N	\N	\N
0bd417e9-261f-4758-9c1c-e32b2f553aed	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	ec95e8fd-2203-46f6-b941-0e19cb62d92f	pending	\N	\N	\N	\N	\N	\N
f39a8f94-3150-463f-9e33-0c0cdf2a4d6b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	cf1ead87-bc0e-4710-8356-8791329f48d1	pending	\N	\N	\N	\N	\N	\N
1057c6bf-aeb6-4b9c-b121-3fdec6bbac78	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	cdd2f7af-be6e-457a-a465-13900fd2449b	pending	\N	\N	\N	\N	\N	\N
4c966759-934d-45fa-80fb-f64290dc8ff0	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	e48c91a4-3b94-463c-8977-5e35344d1315	pending	\N	\N	\N	\N	\N	\N
1cf71dac-663c-4a16-abe8-b1d77ede322b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	81af9c2e-f599-47e5-8b27-b29b5cc577cd	pending	\N	\N	\N	\N	\N	\N
529f613c-76ef-4231-8477-a94b44bb1dc5	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	e01773e0-ebb9-471a-be8c-98f2951a1454	pending	\N	\N	\N	\N	\N	\N
580d3122-9d82-4438-9749-4957f98b7c1a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	72ed8bbc-c906-462b-91ae-5c8e602a9581	pending	\N	\N	\N	\N	\N	\N
e420825e-861a-40a6-8374-9e3860ba11fb	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	f5fcaeab-8802-4e50-b73d-4a057431d3fd	pending	\N	\N	\N	\N	\N	\N
af65c6d5-6952-4c50-99de-d9ce713928ea	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	7c2ee432-f7a2-468a-91a4-d6da3a69ee91	pending	\N	\N	\N	\N	\N	\N
1a03a0b3-cbcf-43cb-a90f-0f597908e810	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	56e7195e-9d95-41eb-b776-924d6ead8b45	pending	\N	\N	\N	\N	\N	\N
4322e354-a666-4fc6-a88b-f9cfea82365b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	ec151a25-440b-4bb8-951a-60f8fa5c42aa	pending	\N	\N	\N	\N	\N	\N
35b4baaa-09b8-417d-8707-0829638d5ad0	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	db552fa7-40d4-4f8b-ae35-535d9a38f422	pending	\N	\N	\N	\N	\N	\N
6c8d5066-1d06-4544-a4c5-e33bec1d13f0	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	59703fc1-3792-4e00-ba45-d2612bdf9cd2	pending	\N	\N	\N	\N	\N	\N
d9f3eae7-dc4f-4cb2-8104-084a7dafcfe0	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	c768a363-a74b-4cd6-b7e2-04a1e7591121	pending	\N	\N	\N	\N	\N	\N
3337c491-37b6-49a3-b8a2-028a56a96e1a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	21f9f74b-d38a-49ea-9f0a-5ff062ad9a25	pending	\N	\N	\N	\N	\N	\N
844bcb2c-76d8-4799-b05b-1937f7b0a6bc	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	4d2275e3-0590-4352-9bc4-42738e2fa3e3	pending	\N	\N	\N	\N	\N	\N
aa9ae578-d69b-41b6-a5a8-bdce59c03c96	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	8f0844ab-cade-4aa7-af50-acf8b8ac8392	pending	\N	\N	\N	\N	\N	\N
8e483729-24c9-477b-b580-66710d11b04b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	c8ab532b-2912-4ba1-bf23-5b6a9675e891	pending	\N	\N	\N	\N	\N	\N
90dc0462-cf57-4f01-9063-9e7042a2aefe	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	a6bb2a07-c44e-4fee-8b04-624ec4fbf63a	pending	\N	\N	\N	\N	\N	\N
7e2d63a8-fe9c-414e-b284-b74603f8d9a2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	fe7bc2c6-3f89-4e0f-9eb5-03d1408a0507	pending	\N	\N	\N	\N	\N	\N
028af940-5b7e-4c14-a1bf-75b5e3a02c8c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	e7d6645c-bf43-48b2-96d1-a4e2489a1e31	pending	\N	\N	\N	\N	\N	\N
96e82a8d-bd38-4bff-9368-edb56dd38c97	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	cbe5729c-fff2-4eb5-aea3-9711c0868ee1	pending	\N	\N	\N	\N	\N	\N
61cbbda7-9576-4a8b-911c-659e87ab4844	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	975a504a-b40b-44db-b4e9-6e93e0f50c5e	pending	\N	\N	\N	\N	\N	\N
59819417-2f45-40f4-9bc1-8984a04b1cc2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	9b1180f3-8170-40e9-a21d-f082cb480b1f	pending	\N	\N	\N	\N	\N	\N
d388c3a1-c765-4c55-81e8-6213a9d8101c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	55563828-0f0b-4b0c-b95d-acbb8f83ae6f	pending	\N	\N	\N	\N	\N	\N
62a2c7cb-e477-4ac9-afef-5c1a4ebd7c57	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	3bfc5834-eaba-4c3d-b82e-f2a74eb30dca	pending	\N	\N	\N	\N	\N	\N
00ffd7a0-d25e-4538-ad7a-4b91164798b2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	335dc9f5-ee0d-4ea3-9d32-78b49c554073	pending	\N	\N	\N	\N	\N	\N
28b12350-3fcc-40c7-abe3-d2b0b6f99961	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	90e72c62-d36e-4561-9c1e-765c7504eb73	pending	\N	\N	\N	\N	\N	\N
d9e958a4-4413-4fda-bf8b-16ace5fa86f9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	77dbd755-b2cf-4662-9f79-9d75b9efa46c	pending	\N	\N	\N	\N	\N	\N
026862f8-5121-4b50-9a05-81c8d8342567	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	cce27dbe-160a-4844-b83a-cb5715812517	pending	\N	\N	\N	\N	\N	\N
9b0aacd2-21a5-476e-8f15-a3e7d8a00494	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	257b0f05-b370-4607-8ce6-84aec9080d49	pending	\N	\N	\N	\N	\N	\N
90fb467d-6511-432c-b4a4-6a9fcb5f4feb	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	40cd9142-c1c4-4969-9fd0-ba27e1553ba2	pending	\N	\N	\N	\N	\N	\N
d5e86904-6d6e-47e3-94aa-a763891f668a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	3b9212c5-4025-4b18-8bb7-ed02011acd4c	pending	\N	\N	\N	\N	\N	\N
d7a15844-ef3c-4e65-9612-9b1856051897	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	2e1b030d-b55d-46df-a3be-404bb7a368cf	pending	\N	\N	\N	\N	\N	\N
e4fdf6c1-6138-4e5c-aa10-c5ab369e390a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	13b241b5-e959-48b8-b741-86d932fb1e7c	pending	\N	\N	\N	\N	\N	\N
1885fa70-835e-4c1a-be85-cfaa663ecf2f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	3f3a4628-3be8-4cef-8480-46d2fb99c9f9	pending	\N	\N	\N	\N	\N	\N
4674bb48-41ea-4173-ab91-be773b4a95fb	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	b4f32f00-af34-4e60-ace0-f37843d5f2ab	pending	\N	\N	\N	\N	\N	\N
bc73f6e6-f1d5-409f-a655-2aabeac6e8c8	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	41b19327-d33c-45fa-bc37-b0346414a85b	pending	\N	\N	\N	\N	\N	\N
fb9fb2ef-ed63-4ec1-a918-f0d45f7e0320	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	a2f740a5-867d-40c4-9dee-9ef96886554c	pending	\N	\N	\N	\N	\N	\N
b01461f4-a454-4d11-ac65-cbcffb0074b5	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	eebdc4eb-df2c-4064-9875-5d0267660480	pending	\N	\N	\N	\N	\N	\N
ce026894-b426-42ad-b4c0-5014489b9617	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	dff31d86-d6ab-4125-9e24-2205029a8379	pending	\N	\N	\N	\N	\N	\N
434ace9c-9b7e-4b2c-8ce1-9b689b482a69	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	48e071b5-3332-4582-948b-bffc48d3ca9c	pending	\N	\N	\N	\N	\N	\N
dffd2b5d-e559-40cf-8aec-436b1978b7e3	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	ce5811e7-b6bb-4a33-953a-194b7a294da3	pending	\N	\N	\N	\N	\N	\N
540f5bc7-3c39-4aeb-bff2-42a43ae05b32	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	fb660454-871c-4436-ab39-6a61f64e044b	pending	\N	\N	\N	\N	\N	\N
2ace2b1a-1383-46d8-8ebd-db16a8ecedcf	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	9cbaea41-b097-468b-a55d-1b60d825ab04	pending	\N	\N	\N	\N	\N	\N
62c47185-e098-4d5e-9119-3e2f431415cd	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	4be05588-7ad7-4cec-9f5d-112bcaecdd21	pending	\N	\N	\N	\N	\N	\N
97984a4f-d0a9-43ef-b99f-d0523b291e7d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	be2fd2b2-0039-4e17-b2b1-9f3e2fc33c6b	pending	\N	\N	\N	\N	\N	\N
b4b081bf-a5a3-4b9d-ac65-5eca567446c9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	f120e862-68f0-40eb-a84a-b6927ce51a90	pending	\N	\N	\N	\N	\N	\N
070a0751-2985-406e-8bbd-90ba6e37eee9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	b5547bbf-ab34-4882-9846-fba230b69a7b	pending	\N	\N	\N	\N	\N	\N
8be2166c-593a-49e6-8fde-e172274fdbe7	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	707c6d78-6d9f-47dd-8186-917ec255ffb2	pending	\N	\N	\N	\N	\N	\N
e5849a82-4b04-40b8-88b0-d213869c2f15	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	64c1aa57-1dbf-4e8c-83cd-2325b8ba0e13	pending	\N	\N	\N	\N	\N	\N
677fb7f8-05e3-42fd-b326-8fc95b3a6bb6	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	2c9d0db2-83b8-4340-bba1-12ad1acebcda	pending	\N	\N	\N	\N	\N	\N
1e0b9182-0f13-483f-99eb-2b35e630322b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	ea8bd191-46fd-4e86-ae8d-b3f7354e6c2c	pending	\N	\N	\N	\N	\N	\N
ce8acfa9-7363-4e65-9728-409d14c8f07c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	a419c96c-bb0f-4973-9598-49e88ab2cfa0	pending	\N	\N	\N	\N	\N	\N
20185b07-a89d-4110-8c0f-d660497054b7	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	5b76ebc3-05b5-4008-9e8a-8e91866c4536	pending	\N	\N	\N	\N	\N	\N
c2997cb6-5037-4c3d-942b-0c2f2d6c63d4	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	4b42d2d7-df7a-425d-b753-5d83c3103d65	pending	\N	\N	\N	\N	\N	\N
03c3732f-c4c9-4be2-935d-be46da6b5582	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	96347f98-91c7-4fec-bc21-be300e60ba28	pending	\N	\N	\N	\N	\N	\N
60587ce5-f34d-42ca-8bad-b14018301c04	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	60b0cf22-6574-4d36-b521-7b1725bca50f	pending	\N	\N	\N	\N	\N	\N
ed08e15b-ee73-474e-a5d3-509ad9ca2e26	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	a7f68e92-8192-4183-912b-8af85c4d13ee	pending	\N	\N	\N	\N	\N	\N
6341c34f-cee5-4f3f-976c-3c1fd0f36675	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	65718161-113b-4d95-9df4-f0405428a823	pending	\N	\N	\N	\N	\N	\N
c086becf-1599-4021-8cfc-e94a2e21335e	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	f291c7cd-cfea-47e1-a384-b4ecdef4f4da	pending	\N	\N	\N	\N	\N	\N
79bec0a1-9504-41c3-84c0-f6dae964ae93	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	04e1ca08-058b-4fd0-8e9e-dbea47b0d723	96a66cc1-f80a-47ad-a643-0b946cffa02e	pending	\N	\N	\N	\N	\N	\N
a76bf312-a0e8-4254-86c8-1f8d72f26dc5	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	54de01b5-6711-4e2f-b4e5-83b8a658c1ea	pending	\N	\N	\N	\N	\N	\N
a72f782d-bba4-4941-8def-e01121bc1fde	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	2bbf52cf-3942-43da-9e74-1ccab5d8f5b7	pending	\N	\N	\N	\N	\N	\N
6cd8cc94-83be-4db9-9864-91410142061b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	40fed8d4-2408-4e91-998d-04548cf33cf1	pending	\N	\N	\N	\N	\N	\N
e4f7147b-f586-4c21-b88e-7764818c0da2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	df7f131c-ad24-413e-8640-dac8493be026	pending	\N	\N	\N	\N	\N	\N
bbee0d43-11e6-4163-97c6-9d747b57e852	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	609bab0d-72bd-4ee9-80fd-3f4d1db92bed	pending	\N	\N	\N	\N	\N	\N
18fb304a-53f7-45f2-a8f2-52f3537db617	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	011aa579-858b-4fec-a3cb-bed8bdd9f82d	pending	\N	\N	\N	\N	\N	\N
655d2fd3-1959-4d2d-9712-c8006fecf4d2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	8a2d8daa-1687-4d8d-b54d-7864bd8d7887	pending	\N	\N	\N	\N	\N	\N
94fdfd80-c0f1-4b9d-8604-fd8b8b0f90fc	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	a0498893-beb3-4500-adcc-f56270dab200	pending	\N	\N	\N	\N	\N	\N
32013e89-412d-450c-aece-a925ab822c81	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	8c16dfa4-433d-44fb-aa00-82b12b83febc	pending	\N	\N	\N	\N	\N	\N
e6e7ff30-5722-45b3-a437-9d6999b2eb01	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	c071fc1e-af9a-490b-bcdf-af80b46d511c	pending	\N	\N	\N	\N	\N	\N
8c7eb763-b818-428f-8b85-9f0409f93935	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	46c90232-8f81-49a5-84e3-5eada2ab01e3	pending	\N	\N	\N	\N	\N	\N
a41bac95-60bd-4030-b4c5-d6d5c15edeb9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	812f8dcd-a92b-46dc-b9ec-18b272872999	pending	\N	\N	\N	\N	\N	\N
22040b65-dd4a-4e34-b296-122f24247f9c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	ec95e8fd-2203-46f6-b941-0e19cb62d92f	pending	\N	\N	\N	\N	\N	\N
ba880300-1f58-40ce-9c6d-c80baadcaab5	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	cf1ead87-bc0e-4710-8356-8791329f48d1	pending	\N	\N	\N	\N	\N	\N
227bd464-bcd3-4533-af41-12a24ec61fb7	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	cdd2f7af-be6e-457a-a465-13900fd2449b	pending	\N	\N	\N	\N	\N	\N
6ccfa201-2dc6-4fe6-a219-4829382a53e4	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	e48c91a4-3b94-463c-8977-5e35344d1315	pending	\N	\N	\N	\N	\N	\N
b592eafc-df35-4098-8c84-95ec998b4bc1	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	81af9c2e-f599-47e5-8b27-b29b5cc577cd	pending	\N	\N	\N	\N	\N	\N
f10cbc9b-7dff-488e-aede-102bfbf24ba9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	72ed8bbc-c906-462b-91ae-5c8e602a9581	pending	\N	\N	\N	\N	\N	\N
9c761ab6-e744-4c59-850e-691f8c575487	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	f5fcaeab-8802-4e50-b73d-4a057431d3fd	pending	\N	\N	\N	\N	\N	\N
0d132b85-dfef-4daf-aeac-7751dff0a1d5	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	7c2ee432-f7a2-468a-91a4-d6da3a69ee91	pending	\N	\N	\N	\N	\N	\N
09eb5c13-6252-4340-9017-02db008c0c32	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	56e7195e-9d95-41eb-b776-924d6ead8b45	pending	\N	\N	\N	\N	\N	\N
c4d029ec-650f-4089-8dfa-a1a91a5d96f7	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	ec151a25-440b-4bb8-951a-60f8fa5c42aa	pending	\N	\N	\N	\N	\N	\N
279c4a41-104e-4eb0-82e3-e2e47643e5bc	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	db552fa7-40d4-4f8b-ae35-535d9a38f422	pending	\N	\N	\N	\N	\N	\N
bde66957-c035-4167-b469-ca38d1fec2cd	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	59703fc1-3792-4e00-ba45-d2612bdf9cd2	pending	\N	\N	\N	\N	\N	\N
9be9deda-6429-4024-9f02-d4b8d69a9346	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	c768a363-a74b-4cd6-b7e2-04a1e7591121	pending	\N	\N	\N	\N	\N	\N
5e03ce6d-a82a-4656-ab37-fea0a716d3c2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	21f9f74b-d38a-49ea-9f0a-5ff062ad9a25	pending	\N	\N	\N	\N	\N	\N
1cd52f42-bdc4-446c-8878-aac3feb0365e	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	4d2275e3-0590-4352-9bc4-42738e2fa3e3	pending	\N	\N	\N	\N	\N	\N
04c832d7-f5cd-4ac2-89f4-ce6a90006160	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	8f0844ab-cade-4aa7-af50-acf8b8ac8392	pending	\N	\N	\N	\N	\N	\N
3eec877f-da9e-4ab0-9eda-8d7b92094dd7	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	c8ab532b-2912-4ba1-bf23-5b6a9675e891	pending	\N	\N	\N	\N	\N	\N
eb2911c9-a622-4ee5-8e75-ce7d82647c4c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	a6bb2a07-c44e-4fee-8b04-624ec4fbf63a	pending	\N	\N	\N	\N	\N	\N
99169f71-9807-40ea-8e7f-cf9f18b4971d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	e7d6645c-bf43-48b2-96d1-a4e2489a1e31	pending	\N	\N	\N	\N	\N	\N
b10595b3-f07a-47aa-8fb8-f5f83bae2087	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	975a504a-b40b-44db-b4e9-6e93e0f50c5e	pending	\N	\N	\N	\N	\N	\N
3a923f5d-2bdc-4d4d-8a82-ca2867bb7aeb	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	9b1180f3-8170-40e9-a21d-f082cb480b1f	pending	\N	\N	\N	\N	\N	\N
420f7a1e-a52e-4c36-ae74-d91c8a9e67a8	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	55563828-0f0b-4b0c-b95d-acbb8f83ae6f	pending	\N	\N	\N	\N	\N	\N
63321c3f-7750-4bb3-9f13-6c5704cd2ace	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	3bfc5834-eaba-4c3d-b82e-f2a74eb30dca	pending	\N	\N	\N	\N	\N	\N
5cb04ee2-b3a4-4c1c-a973-e8a8b175dc66	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	335dc9f5-ee0d-4ea3-9d32-78b49c554073	pending	\N	\N	\N	\N	\N	\N
f164e6a6-d0cd-4d35-b4c7-a045836216c4	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	90e72c62-d36e-4561-9c1e-765c7504eb73	pending	\N	\N	\N	\N	\N	\N
3c8574dd-d20f-4cb5-8575-7c7e82467c73	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	cce27dbe-160a-4844-b83a-cb5715812517	pending	\N	\N	\N	\N	\N	\N
ad523275-38fb-42ad-925b-eafc308b82d4	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	257b0f05-b370-4607-8ce6-84aec9080d49	pending	\N	\N	\N	\N	\N	\N
9a9acb89-813a-4d19-928e-ef74c1a67f85	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	40cd9142-c1c4-4969-9fd0-ba27e1553ba2	pending	\N	\N	\N	\N	\N	\N
f6a25482-852c-413f-a6bc-8616d3f88d0a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	2e1b030d-b55d-46df-a3be-404bb7a368cf	pending	\N	\N	\N	\N	\N	\N
39402cc9-c3f1-4a30-b737-fd5ec997c028	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	13b241b5-e959-48b8-b741-86d932fb1e7c	pending	\N	\N	\N	\N	\N	\N
7644da66-a433-4543-912b-dbdc815d8ada	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	3f3a4628-3be8-4cef-8480-46d2fb99c9f9	pending	\N	\N	\N	\N	\N	\N
08458347-5895-4b0d-bf1d-da4e104f12a0	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	b4f32f00-af34-4e60-ace0-f37843d5f2ab	pending	\N	\N	\N	\N	\N	\N
f3d7a6df-07e8-43e3-80e2-a47c2bc852c0	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	41b19327-d33c-45fa-bc37-b0346414a85b	pending	\N	\N	\N	\N	\N	\N
7a0f2c47-ea4f-4d0b-9b23-4fa2efe2cec9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	a2f740a5-867d-40c4-9dee-9ef96886554c	pending	\N	\N	\N	\N	\N	\N
f67443ed-0b6e-41b6-b8e6-5478f1f4b496	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	eebdc4eb-df2c-4064-9875-5d0267660480	pending	\N	\N	\N	\N	\N	\N
3ea47bf6-efed-49ba-bb6b-808d867edec9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	dff31d86-d6ab-4125-9e24-2205029a8379	pending	\N	\N	\N	\N	\N	\N
24df5856-d24d-475b-bd60-242d914780ad	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	48e071b5-3332-4582-948b-bffc48d3ca9c	pending	\N	\N	\N	\N	\N	\N
7d89a03f-8fe0-4a69-845d-3407c7a80e37	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	ce5811e7-b6bb-4a33-953a-194b7a294da3	pending	\N	\N	\N	\N	\N	\N
b7d31ec0-27ca-4cfc-901e-d4a36b6049b3	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	fb660454-871c-4436-ab39-6a61f64e044b	pending	\N	\N	\N	\N	\N	\N
cfbee17e-8d0c-45f2-9d1c-05f101d8e9c2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	9cbaea41-b097-468b-a55d-1b60d825ab04	pending	\N	\N	\N	\N	\N	\N
4e98e8de-2ea8-4332-a454-27cf3fa3515e	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	4be05588-7ad7-4cec-9f5d-112bcaecdd21	pending	\N	\N	\N	\N	\N	\N
90de5615-5446-4595-a68c-42a0cb909e9c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	be2fd2b2-0039-4e17-b2b1-9f3e2fc33c6b	pending	\N	\N	\N	\N	\N	\N
68fcd2b8-bf6f-47b0-a925-5b79db61fc1f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	f120e862-68f0-40eb-a84a-b6927ce51a90	pending	\N	\N	\N	\N	\N	\N
8e85a83a-c856-4e84-93e3-ea252a150347	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	b5547bbf-ab34-4882-9846-fba230b69a7b	pending	\N	\N	\N	\N	\N	\N
64643495-908f-471a-ad36-a40ea95b16bc	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	64c1aa57-1dbf-4e8c-83cd-2325b8ba0e13	pending	\N	\N	\N	\N	\N	\N
c73c0bab-050d-47db-96be-3769dcdd64e1	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	2c9d0db2-83b8-4340-bba1-12ad1acebcda	pending	\N	\N	\N	\N	\N	\N
3c3b00de-4414-4699-9b1e-b319413e3ed2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	ea8bd191-46fd-4e86-ae8d-b3f7354e6c2c	pending	\N	\N	\N	\N	\N	\N
77bbdba9-a464-4a51-8be4-c92476fbf7e9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	a419c96c-bb0f-4973-9598-49e88ab2cfa0	pending	\N	\N	\N	\N	\N	\N
22629a83-c0ac-413f-afea-d3db752f53bd	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	5b76ebc3-05b5-4008-9e8a-8e91866c4536	pending	\N	\N	\N	\N	\N	\N
b3dfc879-85b6-4191-8991-bfecee211433	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	4b42d2d7-df7a-425d-b753-5d83c3103d65	pending	\N	\N	\N	\N	\N	\N
d1d3efbb-d28a-441b-8b54-b5c1e3f13d1d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	96347f98-91c7-4fec-bc21-be300e60ba28	pending	\N	\N	\N	\N	\N	\N
697b835f-7910-405c-9884-e4fee12e3170	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	60b0cf22-6574-4d36-b521-7b1725bca50f	pending	\N	\N	\N	\N	\N	\N
e313d59a-89e7-4e21-bf5b-bdcff6f86773	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	a7f68e92-8192-4183-912b-8af85c4d13ee	pending	\N	\N	\N	\N	\N	\N
2fa25db1-8e8d-4dc9-b1ad-0f86a810b99b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	65718161-113b-4d95-9df4-f0405428a823	pending	\N	\N	\N	\N	\N	\N
2f8454aa-01c9-41d6-8b1d-68d51a2e656e	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	f291c7cd-cfea-47e1-a384-b4ecdef4f4da	pending	\N	\N	\N	\N	\N	\N
d39745de-a69d-456d-971f-c4cfb8bfb9d9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	4af950f1-4fd1-4851-951a-6a626a8d8879	96a66cc1-f80a-47ad-a643-0b946cffa02e	pending	\N	\N	\N	\N	\N	\N
dd52ebeb-709f-4155-b8b1-c3dfe762f4be	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	54de01b5-6711-4e2f-b4e5-83b8a658c1ea	pending	\N	\N	\N	\N	\N	\N
38a22aa8-2ed3-405c-9918-64d6d2dbbdac	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	2bbf52cf-3942-43da-9e74-1ccab5d8f5b7	pending	\N	\N	\N	\N	\N	\N
906243ee-6627-42e7-820d-272178bf5e5a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	40fed8d4-2408-4e91-998d-04548cf33cf1	pending	\N	\N	\N	\N	\N	\N
39a02495-5d70-4497-a5d3-e06eee737fb2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	df7f131c-ad24-413e-8640-dac8493be026	pending	\N	\N	\N	\N	\N	\N
c2be2c9d-1179-4264-80e6-36979401c9a3	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	609bab0d-72bd-4ee9-80fd-3f4d1db92bed	pending	\N	\N	\N	\N	\N	\N
c662d069-6a56-4527-b8af-7ae96556efad	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	011aa579-858b-4fec-a3cb-bed8bdd9f82d	pending	\N	\N	\N	\N	\N	\N
40ef0dd7-d145-482c-931f-fe2013a9048a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	8a2d8daa-1687-4d8d-b54d-7864bd8d7887	pending	\N	\N	\N	\N	\N	\N
6975d27f-2021-4ce9-91c7-64d6c78744b4	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	a0498893-beb3-4500-adcc-f56270dab200	pending	\N	\N	\N	\N	\N	\N
a1aa77ed-afe7-4f27-a8c9-e84a24b7a092	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	8c16dfa4-433d-44fb-aa00-82b12b83febc	pending	\N	\N	\N	\N	\N	\N
219e2532-a064-492e-86fc-43586a694aac	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	c071fc1e-af9a-490b-bcdf-af80b46d511c	pending	\N	\N	\N	\N	\N	\N
91d71c1d-fe58-4c0c-8145-88e77351a1e8	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	46c90232-8f81-49a5-84e3-5eada2ab01e3	pending	\N	\N	\N	\N	\N	\N
ef8f0c73-efaf-432d-b7d8-db600afb38b6	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	812f8dcd-a92b-46dc-b9ec-18b272872999	pending	\N	\N	\N	\N	\N	\N
8b35db4f-88cc-461d-b3eb-1edc6813a794	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	ec95e8fd-2203-46f6-b941-0e19cb62d92f	pending	\N	\N	\N	\N	\N	\N
d1a0f2a2-6d61-4fe3-81ec-9cd1aca471c3	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	cf1ead87-bc0e-4710-8356-8791329f48d1	pending	\N	\N	\N	\N	\N	\N
cd35a6e0-f27d-42c9-8f9a-1d635d0c3a78	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	cdd2f7af-be6e-457a-a465-13900fd2449b	pending	\N	\N	\N	\N	\N	\N
86433693-1724-440a-99fd-8cdf3ccac2ff	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	e48c91a4-3b94-463c-8977-5e35344d1315	pending	\N	\N	\N	\N	\N	\N
221f923b-3962-4ea6-bc26-43d41cd4c8f7	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	81af9c2e-f599-47e5-8b27-b29b5cc577cd	pending	\N	\N	\N	\N	\N	\N
a54beb8a-2a79-4fa0-a231-4bf14c1e5845	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	72ed8bbc-c906-462b-91ae-5c8e602a9581	pending	\N	\N	\N	\N	\N	\N
1cab4af6-1c62-4cf0-943e-feb5ecbcaacd	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	f5fcaeab-8802-4e50-b73d-4a057431d3fd	pending	\N	\N	\N	\N	\N	\N
0b419021-e45d-46ff-8a79-49ddfa56a23f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	7c2ee432-f7a2-468a-91a4-d6da3a69ee91	pending	\N	\N	\N	\N	\N	\N
9d05aa76-d7cf-4d94-8a0a-898a3bb4ef4c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	56e7195e-9d95-41eb-b776-924d6ead8b45	pending	\N	\N	\N	\N	\N	\N
77286eba-cfe5-4d30-8b5a-e02872ff371b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	ec151a25-440b-4bb8-951a-60f8fa5c42aa	pending	\N	\N	\N	\N	\N	\N
eccf845f-4868-40d4-b730-f1c04ddd45d6	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	db552fa7-40d4-4f8b-ae35-535d9a38f422	pending	\N	\N	\N	\N	\N	\N
dcd223d8-8f11-429b-81da-47d30b120660	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	59703fc1-3792-4e00-ba45-d2612bdf9cd2	pending	\N	\N	\N	\N	\N	\N
b611b5cd-555c-4331-9f50-cf6c6901cb7a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	c768a363-a74b-4cd6-b7e2-04a1e7591121	pending	\N	\N	\N	\N	\N	\N
6673cd36-51a7-48f8-b158-e8a15d5e4437	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	21f9f74b-d38a-49ea-9f0a-5ff062ad9a25	pending	\N	\N	\N	\N	\N	\N
dd12d3eb-1acc-4976-aaaa-3cd65978e4d8	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	4d2275e3-0590-4352-9bc4-42738e2fa3e3	pending	\N	\N	\N	\N	\N	\N
b6239250-7157-442f-b5f1-04bb0544b0c8	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	8f0844ab-cade-4aa7-af50-acf8b8ac8392	pending	\N	\N	\N	\N	\N	\N
f9e945d2-e246-4cfd-bd4f-f042acd1558c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	c8ab532b-2912-4ba1-bf23-5b6a9675e891	pending	\N	\N	\N	\N	\N	\N
8cf5cdc9-464e-4b51-879d-8ae3049db1a7	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	a6bb2a07-c44e-4fee-8b04-624ec4fbf63a	pending	\N	\N	\N	\N	\N	\N
eaa606a2-21b4-4bbb-960d-d16fe0dc0646	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	e7d6645c-bf43-48b2-96d1-a4e2489a1e31	pending	\N	\N	\N	\N	\N	\N
624b25e9-619b-4860-b26e-e0e82c1c94b1	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	975a504a-b40b-44db-b4e9-6e93e0f50c5e	pending	\N	\N	\N	\N	\N	\N
03507ac8-a21e-4eb7-9c0f-8f8688e0cc49	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	9b1180f3-8170-40e9-a21d-f082cb480b1f	pending	\N	\N	\N	\N	\N	\N
e86b2ebc-1b56-4333-8066-4707f15544cb	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	55563828-0f0b-4b0c-b95d-acbb8f83ae6f	pending	\N	\N	\N	\N	\N	\N
027b8982-9c5f-4304-99b8-bd3248a29c96	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	3bfc5834-eaba-4c3d-b82e-f2a74eb30dca	pending	\N	\N	\N	\N	\N	\N
898322f8-e143-4386-8c7d-3caf23739976	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	335dc9f5-ee0d-4ea3-9d32-78b49c554073	pending	\N	\N	\N	\N	\N	\N
48756131-bb99-4d80-a1a4-e225f2600a5b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	90e72c62-d36e-4561-9c1e-765c7504eb73	pending	\N	\N	\N	\N	\N	\N
d855a0d3-39bf-483f-a3ce-4e67d877740c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	cce27dbe-160a-4844-b83a-cb5715812517	pending	\N	\N	\N	\N	\N	\N
440d03ed-0d76-474d-b32c-d7640f49f5b2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	257b0f05-b370-4607-8ce6-84aec9080d49	pending	\N	\N	\N	\N	\N	\N
34b46b9e-3ea5-4f95-8acb-6ce157d948f9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	40cd9142-c1c4-4969-9fd0-ba27e1553ba2	pending	\N	\N	\N	\N	\N	\N
520a91d9-aa05-4a87-9303-ff7dfe62a204	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	2e1b030d-b55d-46df-a3be-404bb7a368cf	pending	\N	\N	\N	\N	\N	\N
af826e4c-8bb2-4b54-ab4b-9a5458fe6911	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	13b241b5-e959-48b8-b741-86d932fb1e7c	pending	\N	\N	\N	\N	\N	\N
602b07a9-ca19-4338-b5af-968caf0abd52	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	3f3a4628-3be8-4cef-8480-46d2fb99c9f9	pending	\N	\N	\N	\N	\N	\N
9462fdae-6fde-40aa-b5dc-c65329cdf945	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	b4f32f00-af34-4e60-ace0-f37843d5f2ab	pending	\N	\N	\N	\N	\N	\N
9a80d58e-eb3f-429d-b72b-5ed90f63cdf2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	41b19327-d33c-45fa-bc37-b0346414a85b	pending	\N	\N	\N	\N	\N	\N
59d985f7-b472-4123-a891-eb142f637434	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	a2f740a5-867d-40c4-9dee-9ef96886554c	pending	\N	\N	\N	\N	\N	\N
750967ca-17f1-4f5e-a320-be2d855a4d99	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	eebdc4eb-df2c-4064-9875-5d0267660480	pending	\N	\N	\N	\N	\N	\N
7139ceeb-c74a-476e-bbe5-d825ea274101	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	dff31d86-d6ab-4125-9e24-2205029a8379	pending	\N	\N	\N	\N	\N	\N
b5312491-4711-445c-b982-d2843d30e72e	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	48e071b5-3332-4582-948b-bffc48d3ca9c	pending	\N	\N	\N	\N	\N	\N
bce44387-c0ca-4cf9-b1b5-7d3eddf681e4	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	ce5811e7-b6bb-4a33-953a-194b7a294da3	pending	\N	\N	\N	\N	\N	\N
47e89215-5532-43d1-b2b6-84c19937702b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	fb660454-871c-4436-ab39-6a61f64e044b	pending	\N	\N	\N	\N	\N	\N
de7ec24f-af4d-4148-8e13-25c09c37711a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	9cbaea41-b097-468b-a55d-1b60d825ab04	pending	\N	\N	\N	\N	\N	\N
944ea34c-699d-452e-baf7-dbbaa5666e06	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	4be05588-7ad7-4cec-9f5d-112bcaecdd21	pending	\N	\N	\N	\N	\N	\N
c4e87bd5-9a36-480d-89ce-68f021669d1f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	be2fd2b2-0039-4e17-b2b1-9f3e2fc33c6b	pending	\N	\N	\N	\N	\N	\N
f92a7d23-523e-43db-ad76-26c598eebd2a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	f120e862-68f0-40eb-a84a-b6927ce51a90	pending	\N	\N	\N	\N	\N	\N
23492104-0c98-413a-b635-f4a763b54662	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	b5547bbf-ab34-4882-9846-fba230b69a7b	pending	\N	\N	\N	\N	\N	\N
1fe74216-17c7-45e6-ae83-2400d481a139	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	64c1aa57-1dbf-4e8c-83cd-2325b8ba0e13	pending	\N	\N	\N	\N	\N	\N
71a4a1f3-5316-4bf6-9a74-e0fa5bf0b873	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	2c9d0db2-83b8-4340-bba1-12ad1acebcda	pending	\N	\N	\N	\N	\N	\N
da09b906-a267-4c72-a233-36e118cc57c9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	ea8bd191-46fd-4e86-ae8d-b3f7354e6c2c	pending	\N	\N	\N	\N	\N	\N
41998abc-2589-4a80-bd92-e6685a2cec72	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	a419c96c-bb0f-4973-9598-49e88ab2cfa0	pending	\N	\N	\N	\N	\N	\N
b41ed5b6-ee1b-47b3-9d26-83284803d999	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	5b76ebc3-05b5-4008-9e8a-8e91866c4536	pending	\N	\N	\N	\N	\N	\N
b1abf597-0b42-4f61-b468-f890c1708961	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	4b42d2d7-df7a-425d-b753-5d83c3103d65	pending	\N	\N	\N	\N	\N	\N
28f64faf-24a6-4299-81c9-1eecb1df3a8d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	96347f98-91c7-4fec-bc21-be300e60ba28	pending	\N	\N	\N	\N	\N	\N
a0fb0a15-5734-4210-846e-dd97f5533671	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	60b0cf22-6574-4d36-b521-7b1725bca50f	pending	\N	\N	\N	\N	\N	\N
4b4aef48-098c-4df0-bab5-9b8a6ef1bf52	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	a7f68e92-8192-4183-912b-8af85c4d13ee	pending	\N	\N	\N	\N	\N	\N
f8e3434f-d9a9-4318-97b9-8d1861012ac0	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	65718161-113b-4d95-9df4-f0405428a823	pending	\N	\N	\N	\N	\N	\N
5be11a3d-d00f-45a8-b573-fe161e45d9f7	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	f291c7cd-cfea-47e1-a384-b4ecdef4f4da	pending	\N	\N	\N	\N	\N	\N
53cccfff-c630-4022-a07c-a2f3c39b44fb	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	48f5f549-650a-439c-b25b-b04bc000d11b	96a66cc1-f80a-47ad-a643-0b946cffa02e	pending	\N	\N	\N	\N	\N	\N
861679e8-6498-40ec-8ea2-f0e38accc299	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	54de01b5-6711-4e2f-b4e5-83b8a658c1ea	pending	\N	\N	\N	\N	\N	\N
cf9fe5dc-8af2-4337-9eb7-02fad67bce86	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	2bbf52cf-3942-43da-9e74-1ccab5d8f5b7	pending	\N	\N	\N	\N	\N	\N
5fd0c7e2-7bdb-468b-a99c-998a42abe6ad	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	40fed8d4-2408-4e91-998d-04548cf33cf1	pending	\N	\N	\N	\N	\N	\N
9fe03b89-9518-4d61-9caa-ce444ecb9e21	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	df7f131c-ad24-413e-8640-dac8493be026	pending	\N	\N	\N	\N	\N	\N
5119b459-8ce2-4f9b-84b8-a0d0cbbafd72	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	609bab0d-72bd-4ee9-80fd-3f4d1db92bed	pending	\N	\N	\N	\N	\N	\N
7a3148ad-ff31-40a8-aae3-c5779ce1a80d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	011aa579-858b-4fec-a3cb-bed8bdd9f82d	pending	\N	\N	\N	\N	\N	\N
ff5e4ef1-3f74-43e8-b482-e9bd31ba7234	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	8a2d8daa-1687-4d8d-b54d-7864bd8d7887	pending	\N	\N	\N	\N	\N	\N
6b5ce219-dccf-4e35-a239-b8e2df0bab85	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	a0498893-beb3-4500-adcc-f56270dab200	pending	\N	\N	\N	\N	\N	\N
2bf5f5ff-172d-432a-bfe8-00454c9d56b3	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	8c16dfa4-433d-44fb-aa00-82b12b83febc	pending	\N	\N	\N	\N	\N	\N
b9df2397-76f7-4f38-99a6-7aa1a5fb9a6a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	c071fc1e-af9a-490b-bcdf-af80b46d511c	pending	\N	\N	\N	\N	\N	\N
45df4e4a-3db1-4215-95b8-4f4427b816f4	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	46c90232-8f81-49a5-84e3-5eada2ab01e3	pending	\N	\N	\N	\N	\N	\N
8b5e8dac-d66a-4e59-81e8-91bf93bd14dd	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	812f8dcd-a92b-46dc-b9ec-18b272872999	pending	\N	\N	\N	\N	\N	\N
f11a980c-1c7d-4885-9cba-549552534cfd	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	ec95e8fd-2203-46f6-b941-0e19cb62d92f	pending	\N	\N	\N	\N	\N	\N
bf3a5e73-463d-4d78-a677-339041a90f11	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	cf1ead87-bc0e-4710-8356-8791329f48d1	pending	\N	\N	\N	\N	\N	\N
36cf6ce3-6c6d-4f23-a5de-7a22bb4cc7a8	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	cdd2f7af-be6e-457a-a465-13900fd2449b	pending	\N	\N	\N	\N	\N	\N
6b7a83ad-a9f6-4e3a-9436-caac0eea3356	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	e48c91a4-3b94-463c-8977-5e35344d1315	pending	\N	\N	\N	\N	\N	\N
23f83d2e-0ce0-43f7-9d47-8b3281bd5dd1	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	81af9c2e-f599-47e5-8b27-b29b5cc577cd	pending	\N	\N	\N	\N	\N	\N
847b306b-a041-4247-82de-3366a2e67019	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	72ed8bbc-c906-462b-91ae-5c8e602a9581	pending	\N	\N	\N	\N	\N	\N
9b83460d-3be0-4e9f-9cac-7162b00d6b97	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	f5fcaeab-8802-4e50-b73d-4a057431d3fd	pending	\N	\N	\N	\N	\N	\N
1f3b9812-04b1-406b-9e69-07b876f60231	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	7c2ee432-f7a2-468a-91a4-d6da3a69ee91	pending	\N	\N	\N	\N	\N	\N
84de66d7-fd3f-4d21-a6b7-63aa379f76c0	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	56e7195e-9d95-41eb-b776-924d6ead8b45	pending	\N	\N	\N	\N	\N	\N
0a351e90-ddc7-46a1-8363-ddd755f9740a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	ec151a25-440b-4bb8-951a-60f8fa5c42aa	pending	\N	\N	\N	\N	\N	\N
6811ed08-8dcc-4ed1-b992-f2e1c55b4715	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	db552fa7-40d4-4f8b-ae35-535d9a38f422	pending	\N	\N	\N	\N	\N	\N
e67cdfdd-0336-42f0-a654-bff0dd65810c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	59703fc1-3792-4e00-ba45-d2612bdf9cd2	pending	\N	\N	\N	\N	\N	\N
cf63aa44-1d5d-4fed-8c47-ac16efba5110	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	c768a363-a74b-4cd6-b7e2-04a1e7591121	pending	\N	\N	\N	\N	\N	\N
d236f8ca-6aba-4d94-8278-b11bc28688b9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	21f9f74b-d38a-49ea-9f0a-5ff062ad9a25	pending	\N	\N	\N	\N	\N	\N
5c9524a8-292e-47ae-8ff9-13b355ddb464	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	4d2275e3-0590-4352-9bc4-42738e2fa3e3	pending	\N	\N	\N	\N	\N	\N
32747d7d-2b9d-499d-8b7d-bd3d48548d24	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	8f0844ab-cade-4aa7-af50-acf8b8ac8392	pending	\N	\N	\N	\N	\N	\N
339acf2c-eb26-4a32-bd76-5455291803c8	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	c8ab532b-2912-4ba1-bf23-5b6a9675e891	pending	\N	\N	\N	\N	\N	\N
1381c043-149f-499d-93ab-641f3ef08c2d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	a6bb2a07-c44e-4fee-8b04-624ec4fbf63a	pending	\N	\N	\N	\N	\N	\N
cd309ee7-0131-4e8a-bd8a-ad8490b781c0	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	e7d6645c-bf43-48b2-96d1-a4e2489a1e31	pending	\N	\N	\N	\N	\N	\N
76a7124c-ca8d-4e50-9bb0-6c64a1b3fa34	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	975a504a-b40b-44db-b4e9-6e93e0f50c5e	pending	\N	\N	\N	\N	\N	\N
0f0b7c20-89a7-4047-94d7-df6e7d283972	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	9b1180f3-8170-40e9-a21d-f082cb480b1f	pending	\N	\N	\N	\N	\N	\N
9bde4a55-142e-4de8-8eb3-9e5a5e6a80de	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	55563828-0f0b-4b0c-b95d-acbb8f83ae6f	pending	\N	\N	\N	\N	\N	\N
c902a0cc-e313-4055-8b4d-321b158d5b75	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	3bfc5834-eaba-4c3d-b82e-f2a74eb30dca	pending	\N	\N	\N	\N	\N	\N
388c8172-c83b-4b51-a32e-66928bd9b432	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	335dc9f5-ee0d-4ea3-9d32-78b49c554073	pending	\N	\N	\N	\N	\N	\N
8e1d375e-778c-4465-a160-6f048fa3801c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	90e72c62-d36e-4561-9c1e-765c7504eb73	pending	\N	\N	\N	\N	\N	\N
78675f85-f272-4ccf-a3a4-2a61d9171841	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	cce27dbe-160a-4844-b83a-cb5715812517	pending	\N	\N	\N	\N	\N	\N
16fb04c3-4a43-4c6a-979d-aebabde23b34	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	257b0f05-b370-4607-8ce6-84aec9080d49	pending	\N	\N	\N	\N	\N	\N
a61c4e35-9b47-4531-bfb5-31195a135975	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	40cd9142-c1c4-4969-9fd0-ba27e1553ba2	pending	\N	\N	\N	\N	\N	\N
8705a28d-845d-48f0-8577-7b56db219380	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	2e1b030d-b55d-46df-a3be-404bb7a368cf	pending	\N	\N	\N	\N	\N	\N
4c69b8b4-aa76-4c23-a5b1-821952683905	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	13b241b5-e959-48b8-b741-86d932fb1e7c	pending	\N	\N	\N	\N	\N	\N
836aa37d-1a92-4d14-accf-cb30002e2ca4	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	3f3a4628-3be8-4cef-8480-46d2fb99c9f9	pending	\N	\N	\N	\N	\N	\N
4e298406-47a1-476b-a852-738eaf257b96	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	b4f32f00-af34-4e60-ace0-f37843d5f2ab	pending	\N	\N	\N	\N	\N	\N
29681dda-6534-4e8f-a89c-5a5924edda7b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	41b19327-d33c-45fa-bc37-b0346414a85b	pending	\N	\N	\N	\N	\N	\N
9d713e0c-ce38-4e6d-9b01-699f31d1bc47	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	a2f740a5-867d-40c4-9dee-9ef96886554c	pending	\N	\N	\N	\N	\N	\N
f71067a8-bf86-4670-b16b-54036471a0e6	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	eebdc4eb-df2c-4064-9875-5d0267660480	pending	\N	\N	\N	\N	\N	\N
0b3a7735-e4df-4d6b-a429-72d8328663a3	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	dff31d86-d6ab-4125-9e24-2205029a8379	pending	\N	\N	\N	\N	\N	\N
99c1bd0c-24e3-40c9-813a-9e50ee4a63ff	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	48e071b5-3332-4582-948b-bffc48d3ca9c	pending	\N	\N	\N	\N	\N	\N
61a9b526-aefe-4020-8907-561aeacc184c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	ce5811e7-b6bb-4a33-953a-194b7a294da3	pending	\N	\N	\N	\N	\N	\N
0a8a4825-d68a-4cd4-b5c8-6aa29ea5c84c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	fb660454-871c-4436-ab39-6a61f64e044b	pending	\N	\N	\N	\N	\N	\N
e6f75ad0-8a1d-48ce-9a2f-263325790bf5	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	9cbaea41-b097-468b-a55d-1b60d825ab04	pending	\N	\N	\N	\N	\N	\N
039b91c1-29b7-4287-9b2e-2eeeebbd946a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	4be05588-7ad7-4cec-9f5d-112bcaecdd21	pending	\N	\N	\N	\N	\N	\N
9666df82-2326-45ca-a652-5a78c3563e84	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	be2fd2b2-0039-4e17-b2b1-9f3e2fc33c6b	pending	\N	\N	\N	\N	\N	\N
0ba9ef63-0f2c-472a-88e0-f1bc497fd0ac	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	f120e862-68f0-40eb-a84a-b6927ce51a90	pending	\N	\N	\N	\N	\N	\N
82e6b715-439b-439d-9f5b-e1335e334f3a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	b5547bbf-ab34-4882-9846-fba230b69a7b	pending	\N	\N	\N	\N	\N	\N
e4d4de5a-2509-49ad-b87f-e26ea686dd4f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	64c1aa57-1dbf-4e8c-83cd-2325b8ba0e13	pending	\N	\N	\N	\N	\N	\N
0ca873f4-feff-41d9-9c3d-4e68102e049c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	2c9d0db2-83b8-4340-bba1-12ad1acebcda	pending	\N	\N	\N	\N	\N	\N
36a68e0d-e69a-4f77-ab54-8b1462b05f28	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	ea8bd191-46fd-4e86-ae8d-b3f7354e6c2c	pending	\N	\N	\N	\N	\N	\N
4e9ffb06-43bb-4e5f-afa4-8a07833602dc	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	a419c96c-bb0f-4973-9598-49e88ab2cfa0	pending	\N	\N	\N	\N	\N	\N
f1c5c487-693b-4f8d-a1f3-e06ffb6f7718	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	5b76ebc3-05b5-4008-9e8a-8e91866c4536	pending	\N	\N	\N	\N	\N	\N
ce1ae960-cade-4896-895b-971b617047d2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	4b42d2d7-df7a-425d-b753-5d83c3103d65	pending	\N	\N	\N	\N	\N	\N
d215bdc0-6d68-4bff-a0d0-e14c68404e59	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	96347f98-91c7-4fec-bc21-be300e60ba28	pending	\N	\N	\N	\N	\N	\N
1251f264-e444-4df8-8062-cfd58f999265	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	60b0cf22-6574-4d36-b521-7b1725bca50f	pending	\N	\N	\N	\N	\N	\N
9165c436-507f-4cbc-9ada-2fafb3a465b5	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	a7f68e92-8192-4183-912b-8af85c4d13ee	pending	\N	\N	\N	\N	\N	\N
0cff2cc8-8d4d-49fd-8e9d-260bb92fedab	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	65718161-113b-4d95-9df4-f0405428a823	pending	\N	\N	\N	\N	\N	\N
b6f3345f-b339-4155-9dd4-567beb46459c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	f291c7cd-cfea-47e1-a384-b4ecdef4f4da	pending	\N	\N	\N	\N	\N	\N
5c95f19b-d419-43a4-b7a0-d731f5823ccf	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	90c3e300-e026-49ff-b7c3-c238c4397d23	96a66cc1-f80a-47ad-a643-0b946cffa02e	pending	\N	\N	\N	\N	\N	\N
33e9d411-82f3-4dfc-9b9a-857b556e3ca2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	54de01b5-6711-4e2f-b4e5-83b8a658c1ea	pending	\N	\N	\N	\N	\N	\N
d92c7aea-f993-4b03-9d95-60ea15fef391	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	2bbf52cf-3942-43da-9e74-1ccab5d8f5b7	pending	\N	\N	\N	\N	\N	\N
08550120-53e1-43b7-9803-01de181e4f94	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	40fed8d4-2408-4e91-998d-04548cf33cf1	pending	\N	\N	\N	\N	\N	\N
a0eafc33-8cc8-448f-8333-a50438fcf13a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	df7f131c-ad24-413e-8640-dac8493be026	pending	\N	\N	\N	\N	\N	\N
cc24c96f-8980-4f3f-acce-186e3315c81f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	609bab0d-72bd-4ee9-80fd-3f4d1db92bed	pending	\N	\N	\N	\N	\N	\N
36221ff0-abfe-4add-a530-ce9107a4c476	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	011aa579-858b-4fec-a3cb-bed8bdd9f82d	pending	\N	\N	\N	\N	\N	\N
ddd2de36-f383-402c-90a8-0713eb7543b3	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	8a2d8daa-1687-4d8d-b54d-7864bd8d7887	pending	\N	\N	\N	\N	\N	\N
18fd0435-5abc-4e54-ae22-def09f0efa83	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	a0498893-beb3-4500-adcc-f56270dab200	pending	\N	\N	\N	\N	\N	\N
452f3617-50e1-4fdb-bd43-bbd00542c7b3	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	8c16dfa4-433d-44fb-aa00-82b12b83febc	pending	\N	\N	\N	\N	\N	\N
607356fe-11bb-4367-812f-8f29b8d72ca2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	c071fc1e-af9a-490b-bcdf-af80b46d511c	pending	\N	\N	\N	\N	\N	\N
0db4b878-1fd9-4997-b704-ea6779f67d55	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	46c90232-8f81-49a5-84e3-5eada2ab01e3	pending	\N	\N	\N	\N	\N	\N
ae2b33e7-6012-4218-a973-94f1652ab007	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	812f8dcd-a92b-46dc-b9ec-18b272872999	pending	\N	\N	\N	\N	\N	\N
7f6e091c-a7dc-4b13-93bf-82b9cef21840	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	ec95e8fd-2203-46f6-b941-0e19cb62d92f	pending	\N	\N	\N	\N	\N	\N
f825c8c3-1bbe-4bfc-8d11-78df2fee941c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	cf1ead87-bc0e-4710-8356-8791329f48d1	pending	\N	\N	\N	\N	\N	\N
69923a7b-6ba7-4a3e-ac4e-50880b7ad9e9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	cdd2f7af-be6e-457a-a465-13900fd2449b	pending	\N	\N	\N	\N	\N	\N
8b9b7650-2d40-40c2-ad68-8bdba98e2433	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	e48c91a4-3b94-463c-8977-5e35344d1315	pending	\N	\N	\N	\N	\N	\N
896831ed-e558-42a5-9e6e-8868710e5f02	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	81af9c2e-f599-47e5-8b27-b29b5cc577cd	pending	\N	\N	\N	\N	\N	\N
309bc212-61fb-4283-a598-7609dbf00f41	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	72ed8bbc-c906-462b-91ae-5c8e602a9581	pending	\N	\N	\N	\N	\N	\N
27bc4a1e-960e-4d9e-a457-63ad1ed68a55	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	f5fcaeab-8802-4e50-b73d-4a057431d3fd	pending	\N	\N	\N	\N	\N	\N
306ef9ec-aa30-4d42-9eec-ded16e8301c1	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	7c2ee432-f7a2-468a-91a4-d6da3a69ee91	pending	\N	\N	\N	\N	\N	\N
1e344777-1c74-4605-a0c6-dbff9d5eb852	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	56e7195e-9d95-41eb-b776-924d6ead8b45	pending	\N	\N	\N	\N	\N	\N
b3c0e0e2-d454-4a6b-9eec-5534c9605594	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	ec151a25-440b-4bb8-951a-60f8fa5c42aa	pending	\N	\N	\N	\N	\N	\N
ca22133e-c1fd-437a-811a-ee8f9b7e00d0	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	db552fa7-40d4-4f8b-ae35-535d9a38f422	pending	\N	\N	\N	\N	\N	\N
204b0530-2e7e-4668-b4ac-f27bfbd4e75d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	59703fc1-3792-4e00-ba45-d2612bdf9cd2	pending	\N	\N	\N	\N	\N	\N
c0b0ac8d-0aee-441d-89ec-64c86b7dfcd8	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	c768a363-a74b-4cd6-b7e2-04a1e7591121	pending	\N	\N	\N	\N	\N	\N
bb6284cd-a55e-4c70-9131-707069c8ebe7	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	21f9f74b-d38a-49ea-9f0a-5ff062ad9a25	pending	\N	\N	\N	\N	\N	\N
fc7f2410-da83-44a3-bc47-bb73e716e32c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	4d2275e3-0590-4352-9bc4-42738e2fa3e3	pending	\N	\N	\N	\N	\N	\N
2cd1fcf8-c920-4504-842d-765adeb2a73d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	8f0844ab-cade-4aa7-af50-acf8b8ac8392	pending	\N	\N	\N	\N	\N	\N
61cace84-9fa4-402c-a8b9-c2d3298b4187	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	c8ab532b-2912-4ba1-bf23-5b6a9675e891	pending	\N	\N	\N	\N	\N	\N
4967a594-da54-40a8-b4ec-19a7d77d526c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	a6bb2a07-c44e-4fee-8b04-624ec4fbf63a	pending	\N	\N	\N	\N	\N	\N
1b46c6d9-89d8-4e44-9c5b-ae316acfdd9c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	e7d6645c-bf43-48b2-96d1-a4e2489a1e31	pending	\N	\N	\N	\N	\N	\N
ec595905-d059-4609-a3bc-b36db0abc7ff	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	975a504a-b40b-44db-b4e9-6e93e0f50c5e	pending	\N	\N	\N	\N	\N	\N
0ce7869c-03f5-4b98-b2a4-2efd1895b1c0	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	9b1180f3-8170-40e9-a21d-f082cb480b1f	pending	\N	\N	\N	\N	\N	\N
9b95549c-6d15-4046-b0a0-c89b8fd8a730	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	55563828-0f0b-4b0c-b95d-acbb8f83ae6f	pending	\N	\N	\N	\N	\N	\N
7e969a51-a3fd-4ce5-8359-f1f18f48c7f0	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	3bfc5834-eaba-4c3d-b82e-f2a74eb30dca	pending	\N	\N	\N	\N	\N	\N
938913dc-e1c5-4dc6-91f2-2d4293568f78	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	335dc9f5-ee0d-4ea3-9d32-78b49c554073	pending	\N	\N	\N	\N	\N	\N
17fe5119-cac5-49e6-88a5-a9ddd335ea90	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	90e72c62-d36e-4561-9c1e-765c7504eb73	pending	\N	\N	\N	\N	\N	\N
568921ba-cdf0-4a91-92a4-1a28d052a8de	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	cce27dbe-160a-4844-b83a-cb5715812517	pending	\N	\N	\N	\N	\N	\N
b843e150-26b9-459d-a40c-a9ca16eb8ab2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	257b0f05-b370-4607-8ce6-84aec9080d49	pending	\N	\N	\N	\N	\N	\N
c670c5e3-1a9d-4e53-a300-866d75861296	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	40cd9142-c1c4-4969-9fd0-ba27e1553ba2	pending	\N	\N	\N	\N	\N	\N
fd562f89-32c3-4cc7-9ebd-8cb2e841d698	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	2e1b030d-b55d-46df-a3be-404bb7a368cf	pending	\N	\N	\N	\N	\N	\N
4cd5a7cc-1ec4-4776-b5c5-885ad41fd566	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	13b241b5-e959-48b8-b741-86d932fb1e7c	pending	\N	\N	\N	\N	\N	\N
7c75688c-ef25-4032-80e7-3a4578b2b179	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	3f3a4628-3be8-4cef-8480-46d2fb99c9f9	pending	\N	\N	\N	\N	\N	\N
eb0c7e5e-efa6-4a19-8204-5371657ffc35	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	b4f32f00-af34-4e60-ace0-f37843d5f2ab	pending	\N	\N	\N	\N	\N	\N
d857222f-d340-49ea-a3d5-ea58d6e07343	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	41b19327-d33c-45fa-bc37-b0346414a85b	pending	\N	\N	\N	\N	\N	\N
629579f9-cd31-4678-a3a1-d09460a6db1b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	a2f740a5-867d-40c4-9dee-9ef96886554c	pending	\N	\N	\N	\N	\N	\N
fcdce3d6-d43a-4f49-973c-8f1abc45b70a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	eebdc4eb-df2c-4064-9875-5d0267660480	pending	\N	\N	\N	\N	\N	\N
c36497fa-dd11-4547-a14a-7c5dcf4a7897	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	dff31d86-d6ab-4125-9e24-2205029a8379	pending	\N	\N	\N	\N	\N	\N
21aa4c78-73ad-4682-945d-8f9ea011b6b5	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	48e071b5-3332-4582-948b-bffc48d3ca9c	pending	\N	\N	\N	\N	\N	\N
bb413030-4d8a-410d-bbe2-94f2317da8f6	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	ce5811e7-b6bb-4a33-953a-194b7a294da3	pending	\N	\N	\N	\N	\N	\N
0faeb51a-7c98-45b2-8a3e-440535a6e754	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	fb660454-871c-4436-ab39-6a61f64e044b	pending	\N	\N	\N	\N	\N	\N
60b4ff79-1024-4c61-8fb6-e1ec1fe48fbd	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	9cbaea41-b097-468b-a55d-1b60d825ab04	pending	\N	\N	\N	\N	\N	\N
54dede0f-1186-44cd-9d99-16e418baec3a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	4be05588-7ad7-4cec-9f5d-112bcaecdd21	pending	\N	\N	\N	\N	\N	\N
caf9c8ae-f6f0-493d-8ad3-8caf7f852a70	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	be2fd2b2-0039-4e17-b2b1-9f3e2fc33c6b	pending	\N	\N	\N	\N	\N	\N
a461d948-52a9-446d-9fcf-4c09a3b646fc	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	f120e862-68f0-40eb-a84a-b6927ce51a90	pending	\N	\N	\N	\N	\N	\N
9baade24-b095-4802-87ac-b0fed2eed4ac	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	b5547bbf-ab34-4882-9846-fba230b69a7b	pending	\N	\N	\N	\N	\N	\N
2adaaa31-4b0f-418f-a8fc-7fd2e28683dc	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	64c1aa57-1dbf-4e8c-83cd-2325b8ba0e13	pending	\N	\N	\N	\N	\N	\N
1cfdad33-765b-4170-a1c9-6810cc5bd004	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	2c9d0db2-83b8-4340-bba1-12ad1acebcda	pending	\N	\N	\N	\N	\N	\N
90f9db08-7893-4486-9c1d-16a417d6537d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	ea8bd191-46fd-4e86-ae8d-b3f7354e6c2c	pending	\N	\N	\N	\N	\N	\N
b3341a56-bfc7-4920-9b2e-d645003e1f23	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	a419c96c-bb0f-4973-9598-49e88ab2cfa0	pending	\N	\N	\N	\N	\N	\N
efef10fd-d711-40a8-9097-221e9aa12091	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	5b76ebc3-05b5-4008-9e8a-8e91866c4536	pending	\N	\N	\N	\N	\N	\N
fddbc535-2336-4b58-bfdf-b6e271f8087c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	4b42d2d7-df7a-425d-b753-5d83c3103d65	pending	\N	\N	\N	\N	\N	\N
7abebe17-d780-4de5-ae88-603ee4e16c4f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	96347f98-91c7-4fec-bc21-be300e60ba28	pending	\N	\N	\N	\N	\N	\N
e9b7ee36-76df-45c3-98da-8543e1d2b828	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	60b0cf22-6574-4d36-b521-7b1725bca50f	pending	\N	\N	\N	\N	\N	\N
105340cd-7e6e-4b68-82c5-005b03c5eb50	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	a7f68e92-8192-4183-912b-8af85c4d13ee	pending	\N	\N	\N	\N	\N	\N
ebe57454-52e0-4a5d-bbf5-2af190a2cb7d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	65718161-113b-4d95-9df4-f0405428a823	pending	\N	\N	\N	\N	\N	\N
6fa3db0b-8cfe-4f77-ba2f-51b22531d4f1	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	f291c7cd-cfea-47e1-a384-b4ecdef4f4da	pending	\N	\N	\N	\N	\N	\N
ad37d2eb-4b2c-4a73-a58b-cb654650846f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	0cd036c2-2097-4e64-a021-894fcbbf49e4	96a66cc1-f80a-47ad-a643-0b946cffa02e	pending	\N	\N	\N	\N	\N	\N
0050c2fe-f6b0-40b7-b94a-ac4669df5c4d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	54de01b5-6711-4e2f-b4e5-83b8a658c1ea	pending	\N	\N	\N	\N	\N	\N
a19050a3-2915-4222-95ea-4e9e60ba3050	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	2bbf52cf-3942-43da-9e74-1ccab5d8f5b7	pending	\N	\N	\N	\N	\N	\N
c17ae09c-6024-4c7e-9be6-1299aa6ffbcc	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	40fed8d4-2408-4e91-998d-04548cf33cf1	pending	\N	\N	\N	\N	\N	\N
1a2104f1-2aa6-463e-ac11-1e458f96ac4c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	df7f131c-ad24-413e-8640-dac8493be026	pending	\N	\N	\N	\N	\N	\N
8a176374-8571-4ee6-8306-a5cf26021d4f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	609bab0d-72bd-4ee9-80fd-3f4d1db92bed	pending	\N	\N	\N	\N	\N	\N
27d24918-1b3a-429a-8a01-f55d9265a2b9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	011aa579-858b-4fec-a3cb-bed8bdd9f82d	pending	\N	\N	\N	\N	\N	\N
48cf5e7e-b62f-4bd6-a5c9-19c972a36e24	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	8a2d8daa-1687-4d8d-b54d-7864bd8d7887	pending	\N	\N	\N	\N	\N	\N
33cec3b1-2f94-4616-a4a8-4452cb12b940	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	a0498893-beb3-4500-adcc-f56270dab200	pending	\N	\N	\N	\N	\N	\N
4ee86273-3a35-4abd-a14a-5a0bd329952f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	8c16dfa4-433d-44fb-aa00-82b12b83febc	pending	\N	\N	\N	\N	\N	\N
2451fd1b-bd5c-42b1-a851-15ba946f9c01	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	c071fc1e-af9a-490b-bcdf-af80b46d511c	pending	\N	\N	\N	\N	\N	\N
52d0d5ad-d915-4442-a70c-81cd4ba042ba	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	46c90232-8f81-49a5-84e3-5eada2ab01e3	pending	\N	\N	\N	\N	\N	\N
c188b1df-907b-4c63-bca7-a50c4fa0f683	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	812f8dcd-a92b-46dc-b9ec-18b272872999	pending	\N	\N	\N	\N	\N	\N
9d08e1ae-a5d6-438a-a04c-995050f76071	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	ec95e8fd-2203-46f6-b941-0e19cb62d92f	pending	\N	\N	\N	\N	\N	\N
7dd47a80-5fad-488f-8e3d-5a7c41a77cfc	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	cf1ead87-bc0e-4710-8356-8791329f48d1	pending	\N	\N	\N	\N	\N	\N
ac7eb6ca-67cf-402b-90c1-c1786971c2a7	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	cdd2f7af-be6e-457a-a465-13900fd2449b	pending	\N	\N	\N	\N	\N	\N
7724c390-82e3-4c57-81f8-5c09cd44a288	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	e48c91a4-3b94-463c-8977-5e35344d1315	pending	\N	\N	\N	\N	\N	\N
6b767f28-cce5-46d3-aa66-47667b84993a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	81af9c2e-f599-47e5-8b27-b29b5cc577cd	pending	\N	\N	\N	\N	\N	\N
a1e1b16e-67ce-4986-954f-c4961aa7e6ce	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	72ed8bbc-c906-462b-91ae-5c8e602a9581	pending	\N	\N	\N	\N	\N	\N
f03ad5f8-d880-4497-b37a-6512b7c2823e	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	f5fcaeab-8802-4e50-b73d-4a057431d3fd	pending	\N	\N	\N	\N	\N	\N
5113a58e-9d94-41a7-bdbb-fe0bd2e86200	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	7c2ee432-f7a2-468a-91a4-d6da3a69ee91	pending	\N	\N	\N	\N	\N	\N
1a04bf02-5f15-4cb2-96e5-83530d209d92	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	56e7195e-9d95-41eb-b776-924d6ead8b45	pending	\N	\N	\N	\N	\N	\N
4d75a24d-8d85-4e72-847f-75fed725ceac	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	ec151a25-440b-4bb8-951a-60f8fa5c42aa	pending	\N	\N	\N	\N	\N	\N
3a1b2b55-c831-4ffb-b32f-8fd7abd05199	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	db552fa7-40d4-4f8b-ae35-535d9a38f422	pending	\N	\N	\N	\N	\N	\N
25684232-2446-433f-94a7-c6c99cce2df1	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	59703fc1-3792-4e00-ba45-d2612bdf9cd2	pending	\N	\N	\N	\N	\N	\N
4485fa40-a501-41a4-b389-8e2737eee096	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	c768a363-a74b-4cd6-b7e2-04a1e7591121	pending	\N	\N	\N	\N	\N	\N
e380567f-a52a-4aaa-96c8-b951b6ddda5b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	21f9f74b-d38a-49ea-9f0a-5ff062ad9a25	pending	\N	\N	\N	\N	\N	\N
d09b97c9-d3c1-4186-8c40-cc28ad4cb42e	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	4d2275e3-0590-4352-9bc4-42738e2fa3e3	pending	\N	\N	\N	\N	\N	\N
1028e711-3789-44db-adbb-c97334d3d4f5	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	8f0844ab-cade-4aa7-af50-acf8b8ac8392	pending	\N	\N	\N	\N	\N	\N
ee0aec88-410d-46d8-8ac2-513fa05c8b74	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	c8ab532b-2912-4ba1-bf23-5b6a9675e891	pending	\N	\N	\N	\N	\N	\N
8eb857a1-caa6-4748-a35a-145d8c9770be	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	a6bb2a07-c44e-4fee-8b04-624ec4fbf63a	pending	\N	\N	\N	\N	\N	\N
a1e7395a-44bd-45b0-838d-70f2a2e859b6	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	e7d6645c-bf43-48b2-96d1-a4e2489a1e31	pending	\N	\N	\N	\N	\N	\N
0cd9fec7-9593-4eda-ba15-b2116037cb56	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	975a504a-b40b-44db-b4e9-6e93e0f50c5e	pending	\N	\N	\N	\N	\N	\N
f5329dec-16f0-4b0d-9f32-f24c6802319a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	9b1180f3-8170-40e9-a21d-f082cb480b1f	pending	\N	\N	\N	\N	\N	\N
ee4bfee0-0eca-492f-8c78-90fad8e89123	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	55563828-0f0b-4b0c-b95d-acbb8f83ae6f	pending	\N	\N	\N	\N	\N	\N
ee3a6582-439f-4a72-8c08-67eddc3195e8	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	3bfc5834-eaba-4c3d-b82e-f2a74eb30dca	pending	\N	\N	\N	\N	\N	\N
e8d8f381-d3c6-4d20-8fe9-7872ff397bcd	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	335dc9f5-ee0d-4ea3-9d32-78b49c554073	pending	\N	\N	\N	\N	\N	\N
dc7e24ec-f581-4345-805f-e58f4702c670	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	90e72c62-d36e-4561-9c1e-765c7504eb73	pending	\N	\N	\N	\N	\N	\N
c32d0ee3-5e2e-4dd8-bd20-6a6d735d3613	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	cce27dbe-160a-4844-b83a-cb5715812517	pending	\N	\N	\N	\N	\N	\N
9f1a1d5e-5ed4-4e74-ae0f-4e8c69473782	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	257b0f05-b370-4607-8ce6-84aec9080d49	pending	\N	\N	\N	\N	\N	\N
cfb4345e-17f7-413b-af59-3a556db30152	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	40cd9142-c1c4-4969-9fd0-ba27e1553ba2	pending	\N	\N	\N	\N	\N	\N
0c9bb9d0-6250-4feb-8693-eb882486d8e8	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	2e1b030d-b55d-46df-a3be-404bb7a368cf	pending	\N	\N	\N	\N	\N	\N
1ec1c8a6-9967-49e6-9da9-cb7d68fa84bd	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	13b241b5-e959-48b8-b741-86d932fb1e7c	pending	\N	\N	\N	\N	\N	\N
3dec4c83-5a25-4d9b-b876-a2a83e3a2ed1	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	3f3a4628-3be8-4cef-8480-46d2fb99c9f9	pending	\N	\N	\N	\N	\N	\N
81110514-ebb5-477b-b044-3c558a24ec0a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	b4f32f00-af34-4e60-ace0-f37843d5f2ab	pending	\N	\N	\N	\N	\N	\N
89151c1b-e99d-4652-a50f-7985ffb8e474	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	41b19327-d33c-45fa-bc37-b0346414a85b	pending	\N	\N	\N	\N	\N	\N
0dbac58f-96d7-4874-b2b7-85b1cf687679	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	a2f740a5-867d-40c4-9dee-9ef96886554c	pending	\N	\N	\N	\N	\N	\N
40c66510-4e0a-4907-8fc3-dfaecddfa59d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	eebdc4eb-df2c-4064-9875-5d0267660480	pending	\N	\N	\N	\N	\N	\N
5cc085c3-b263-4a23-b76b-4ab86bfd0a32	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	dff31d86-d6ab-4125-9e24-2205029a8379	pending	\N	\N	\N	\N	\N	\N
50eee57d-0f9f-4afd-83f0-ddb6d56772f5	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	48e071b5-3332-4582-948b-bffc48d3ca9c	pending	\N	\N	\N	\N	\N	\N
b1d532fb-e09d-4367-8775-3832f541f3ce	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	ce5811e7-b6bb-4a33-953a-194b7a294da3	pending	\N	\N	\N	\N	\N	\N
9f2c50d5-7266-4c8b-a6a3-46cb9e9296cb	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	fb660454-871c-4436-ab39-6a61f64e044b	pending	\N	\N	\N	\N	\N	\N
6798d05b-a28c-4c5a-94fd-c1c0c1a79292	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	9cbaea41-b097-468b-a55d-1b60d825ab04	pending	\N	\N	\N	\N	\N	\N
3fcb1705-70da-4f12-8507-ecc502361cc6	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	4be05588-7ad7-4cec-9f5d-112bcaecdd21	pending	\N	\N	\N	\N	\N	\N
7f115ab4-708a-4a50-858c-3896caef297b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	be2fd2b2-0039-4e17-b2b1-9f3e2fc33c6b	pending	\N	\N	\N	\N	\N	\N
b6bee46c-e8ae-4ac4-a4ee-518a839ed310	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	f120e862-68f0-40eb-a84a-b6927ce51a90	pending	\N	\N	\N	\N	\N	\N
14041100-322e-4d4e-a93b-73cbc4fd925a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	b5547bbf-ab34-4882-9846-fba230b69a7b	pending	\N	\N	\N	\N	\N	\N
58d56cd0-c4ab-4d91-a3d2-30fd78d03948	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	64c1aa57-1dbf-4e8c-83cd-2325b8ba0e13	pending	\N	\N	\N	\N	\N	\N
6e5a1ed8-8ab8-479b-a03c-34825dd9405f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	2c9d0db2-83b8-4340-bba1-12ad1acebcda	pending	\N	\N	\N	\N	\N	\N
f89df05c-4240-4a1f-bf6f-64be4cefbd67	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	ea8bd191-46fd-4e86-ae8d-b3f7354e6c2c	pending	\N	\N	\N	\N	\N	\N
a05c5def-8d9c-44dd-9d3d-d3ab40f04890	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	a419c96c-bb0f-4973-9598-49e88ab2cfa0	pending	\N	\N	\N	\N	\N	\N
67e68644-503a-4065-90da-cce9a46549b5	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	5b76ebc3-05b5-4008-9e8a-8e91866c4536	pending	\N	\N	\N	\N	\N	\N
d27bee6b-1b74-44e0-ae2f-3de5da19b569	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	4b42d2d7-df7a-425d-b753-5d83c3103d65	pending	\N	\N	\N	\N	\N	\N
c77af22a-a29a-4f78-9876-e9275761d0a8	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	96347f98-91c7-4fec-bc21-be300e60ba28	pending	\N	\N	\N	\N	\N	\N
fe6c3dfb-867e-484c-a802-8609605815b4	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	60b0cf22-6574-4d36-b521-7b1725bca50f	pending	\N	\N	\N	\N	\N	\N
73c66a01-99ac-4391-aa4b-3849bfee436a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	a7f68e92-8192-4183-912b-8af85c4d13ee	pending	\N	\N	\N	\N	\N	\N
7beb5694-be06-42be-a906-9863b449309f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	65718161-113b-4d95-9df4-f0405428a823	pending	\N	\N	\N	\N	\N	\N
654a0823-9efa-4900-a0ab-7ef5c55aa34b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	f291c7cd-cfea-47e1-a384-b4ecdef4f4da	pending	\N	\N	\N	\N	\N	\N
a2970545-41bd-48a2-a329-3e7d81a4859c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	9ab6979d-9fa4-4163-b50e-d35cdc8643c4	96a66cc1-f80a-47ad-a643-0b946cffa02e	pending	\N	\N	\N	\N	\N	\N
f50ff1dc-c5c9-449a-b760-a9eef5a4ac13	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	54de01b5-6711-4e2f-b4e5-83b8a658c1ea	pending	\N	\N	\N	\N	\N	\N
0d42c759-a525-48d1-8108-df6c5acd210d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	2bbf52cf-3942-43da-9e74-1ccab5d8f5b7	pending	\N	\N	\N	\N	\N	\N
05eb917e-47f5-4905-9635-01c7b7c7a604	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	40fed8d4-2408-4e91-998d-04548cf33cf1	pending	\N	\N	\N	\N	\N	\N
2c582208-644b-4281-8f1b-c0b81e27622a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	df7f131c-ad24-413e-8640-dac8493be026	pending	\N	\N	\N	\N	\N	\N
bc1dab8c-7570-4940-a243-26b5ac28f78e	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	609bab0d-72bd-4ee9-80fd-3f4d1db92bed	pending	\N	\N	\N	\N	\N	\N
0ca1da0f-fd95-45e3-aa12-b8262a9a1f44	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	011aa579-858b-4fec-a3cb-bed8bdd9f82d	pending	\N	\N	\N	\N	\N	\N
506f73e3-8a66-4739-89c5-331737f95965	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	8a2d8daa-1687-4d8d-b54d-7864bd8d7887	pending	\N	\N	\N	\N	\N	\N
0ac143de-2ab0-4fa5-9960-c6aeeaab40ca	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	a0498893-beb3-4500-adcc-f56270dab200	pending	\N	\N	\N	\N	\N	\N
82d5ad2e-6ac9-44c1-b99e-f0160ff54ddc	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	8c16dfa4-433d-44fb-aa00-82b12b83febc	pending	\N	\N	\N	\N	\N	\N
a100edaa-5b70-40dd-9ec0-532d855e60fd	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	c071fc1e-af9a-490b-bcdf-af80b46d511c	pending	\N	\N	\N	\N	\N	\N
e431342a-0f05-4a63-b8ac-d75b764b2624	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	46c90232-8f81-49a5-84e3-5eada2ab01e3	pending	\N	\N	\N	\N	\N	\N
502b0dc0-866a-4ec9-be36-983e87774731	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	812f8dcd-a92b-46dc-b9ec-18b272872999	pending	\N	\N	\N	\N	\N	\N
30412c06-3537-4603-af17-557a6423e7e0	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	ec95e8fd-2203-46f6-b941-0e19cb62d92f	pending	\N	\N	\N	\N	\N	\N
a9af86d8-7f38-4d83-b7ab-24e3f66f7833	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	cf1ead87-bc0e-4710-8356-8791329f48d1	pending	\N	\N	\N	\N	\N	\N
b05e118b-b7cb-416b-96d2-cb8ccee8b4e3	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	cdd2f7af-be6e-457a-a465-13900fd2449b	pending	\N	\N	\N	\N	\N	\N
7516006e-ecb1-4436-bed6-704fdfd534de	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	e48c91a4-3b94-463c-8977-5e35344d1315	pending	\N	\N	\N	\N	\N	\N
1d6fe935-4cb0-4819-8134-5ab60f98036c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	81af9c2e-f599-47e5-8b27-b29b5cc577cd	pending	\N	\N	\N	\N	\N	\N
a6e749c2-b9d7-4051-b07e-875caf42554c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	72ed8bbc-c906-462b-91ae-5c8e602a9581	pending	\N	\N	\N	\N	\N	\N
dc791b01-c97f-4705-a34f-94c43d2a58c8	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	f5fcaeab-8802-4e50-b73d-4a057431d3fd	pending	\N	\N	\N	\N	\N	\N
b75f7dc6-3fb9-4442-a4f8-1d7b3d85aea5	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	7c2ee432-f7a2-468a-91a4-d6da3a69ee91	pending	\N	\N	\N	\N	\N	\N
427d842f-14e8-4adc-aadd-57376cf8eaa8	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	56e7195e-9d95-41eb-b776-924d6ead8b45	pending	\N	\N	\N	\N	\N	\N
51b5a311-0bca-4584-a0f4-5f55f9d5e350	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	ec151a25-440b-4bb8-951a-60f8fa5c42aa	pending	\N	\N	\N	\N	\N	\N
2da95bdc-3a0f-4c78-916e-e3d179e077d7	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	db552fa7-40d4-4f8b-ae35-535d9a38f422	pending	\N	\N	\N	\N	\N	\N
02dc7f2f-f300-4441-a033-c4d7f10f3701	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	59703fc1-3792-4e00-ba45-d2612bdf9cd2	pending	\N	\N	\N	\N	\N	\N
54c9390f-28bc-44ab-a619-5bb6e6bedbb2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	c768a363-a74b-4cd6-b7e2-04a1e7591121	pending	\N	\N	\N	\N	\N	\N
33184ae9-8bd6-42e6-9526-04cfe5183b77	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	21f9f74b-d38a-49ea-9f0a-5ff062ad9a25	pending	\N	\N	\N	\N	\N	\N
b841ee4c-c0e7-4e0c-818a-8b617c6819ad	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	4d2275e3-0590-4352-9bc4-42738e2fa3e3	pending	\N	\N	\N	\N	\N	\N
5faf79e6-ade2-48ad-9176-94a5ef1f9521	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	8f0844ab-cade-4aa7-af50-acf8b8ac8392	pending	\N	\N	\N	\N	\N	\N
526e3383-e8e6-4abd-bb26-d3e35d22d512	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	c8ab532b-2912-4ba1-bf23-5b6a9675e891	pending	\N	\N	\N	\N	\N	\N
91ddaaf0-575f-4332-9373-68a4a075abcd	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	a6bb2a07-c44e-4fee-8b04-624ec4fbf63a	pending	\N	\N	\N	\N	\N	\N
b02c4274-5c69-4564-8252-9084baed548c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	f6f96670-c693-47ec-96dd-0d65cc2fac0d	pending	\N	\N	\N	\N	\N	\N
86204176-f475-47bc-b19a-5cb138454507	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	e7d6645c-bf43-48b2-96d1-a4e2489a1e31	pending	\N	\N	\N	\N	\N	\N
195af21b-6f00-4d27-b9c4-452462eb6eda	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	975a504a-b40b-44db-b4e9-6e93e0f50c5e	pending	\N	\N	\N	\N	\N	\N
ed0b722a-19ce-41de-91cf-8f7d2694446e	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	9b1180f3-8170-40e9-a21d-f082cb480b1f	pending	\N	\N	\N	\N	\N	\N
d9036064-b17c-4956-aed2-a7cd4c98f934	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	55563828-0f0b-4b0c-b95d-acbb8f83ae6f	pending	\N	\N	\N	\N	\N	\N
dda45520-aa7a-4fc1-8c96-de1fc14c9a8b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	3bfc5834-eaba-4c3d-b82e-f2a74eb30dca	pending	\N	\N	\N	\N	\N	\N
03ef8d1d-b3ed-447b-9e30-46f8612379b0	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	335dc9f5-ee0d-4ea3-9d32-78b49c554073	pending	\N	\N	\N	\N	\N	\N
7c8686ef-d422-4e2d-8a22-80888db1914e	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	3de55700-3af8-4f44-9edb-653db4c4b70c	pending	\N	\N	\N	\N	\N	\N
aec872a6-8dd4-454d-9671-de770af891cd	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	90e72c62-d36e-4561-9c1e-765c7504eb73	pending	\N	\N	\N	\N	\N	\N
0b285b5a-b7ae-4612-ad30-9c6e27be4574	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	cce27dbe-160a-4844-b83a-cb5715812517	pending	\N	\N	\N	\N	\N	\N
c3916f34-ddca-408f-8147-34523205a8f7	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	257b0f05-b370-4607-8ce6-84aec9080d49	pending	\N	\N	\N	\N	\N	\N
c6caf42e-d479-4489-b1b1-80b2d8246c39	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	40cd9142-c1c4-4969-9fd0-ba27e1553ba2	pending	\N	\N	\N	\N	\N	\N
b46a9195-6f38-4b7a-b491-7a9346852a28	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	2e1b030d-b55d-46df-a3be-404bb7a368cf	pending	\N	\N	\N	\N	\N	\N
e50f7f8b-6875-42e0-8cb6-b15039013087	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	13b241b5-e959-48b8-b741-86d932fb1e7c	pending	\N	\N	\N	\N	\N	\N
398b9106-8e96-4ead-a458-67a8e4d16e21	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	b0e855bf-75d3-45b9-af72-cc7a1754aed8	pending	\N	\N	\N	\N	\N	\N
de5a9a94-1a08-4743-b7fe-f1c51b56ae80	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	3f3a4628-3be8-4cef-8480-46d2fb99c9f9	pending	\N	\N	\N	\N	\N	\N
af0f1cb5-ae65-4bd1-95bb-6dde4c1d6264	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	b4f32f00-af34-4e60-ace0-f37843d5f2ab	pending	\N	\N	\N	\N	\N	\N
015839e1-a15d-4dd4-942f-a8888a3a4245	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	41b19327-d33c-45fa-bc37-b0346414a85b	pending	\N	\N	\N	\N	\N	\N
3e75c496-33b8-438b-ac9e-a7577dedc76e	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	a2f740a5-867d-40c4-9dee-9ef96886554c	pending	\N	\N	\N	\N	\N	\N
4e1e20bb-9db0-4a6d-b72c-4af15f4471aa	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	eebdc4eb-df2c-4064-9875-5d0267660480	pending	\N	\N	\N	\N	\N	\N
cbf6ce81-1230-4f3c-a6cf-193b24a7e476	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	dff31d86-d6ab-4125-9e24-2205029a8379	pending	\N	\N	\N	\N	\N	\N
d0029046-3248-42d4-8690-1616b4c32bda	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	48e071b5-3332-4582-948b-bffc48d3ca9c	pending	\N	\N	\N	\N	\N	\N
6a5b0603-55be-4f87-a7ce-53403337b312	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	ce5811e7-b6bb-4a33-953a-194b7a294da3	pending	\N	\N	\N	\N	\N	\N
38888c2d-f361-4b22-99cb-f8a863d3be62	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	fb660454-871c-4436-ab39-6a61f64e044b	pending	\N	\N	\N	\N	\N	\N
1bd78f53-5a10-4239-ab62-29715d5a9dd2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	9cbaea41-b097-468b-a55d-1b60d825ab04	pending	\N	\N	\N	\N	\N	\N
00b78c8e-b1a6-4093-bf79-77ab0b6c4f7d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	4be05588-7ad7-4cec-9f5d-112bcaecdd21	pending	\N	\N	\N	\N	\N	\N
3e5aecac-a84b-4c3a-9ccb-3b6c4c523bc2	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	be2fd2b2-0039-4e17-b2b1-9f3e2fc33c6b	pending	\N	\N	\N	\N	\N	\N
bc902705-780d-4bd1-86a5-13292c3d77a3	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	f120e862-68f0-40eb-a84a-b6927ce51a90	pending	\N	\N	\N	\N	\N	\N
b2a766fe-9037-41d4-9fc5-b0d938bdf4d9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	d28459b3-7fc0-44ed-bc18-6bd79a3a2b0b	pending	\N	\N	\N	\N	\N	\N
f8d2dcfe-5828-408d-969b-ba3185f333c9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	b5547bbf-ab34-4882-9846-fba230b69a7b	pending	\N	\N	\N	\N	\N	\N
a5c044f1-ea05-4a70-8b1a-00fe7cce1de4	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	64c1aa57-1dbf-4e8c-83cd-2325b8ba0e13	pending	\N	\N	\N	\N	\N	\N
95aab3b9-d04d-4040-8d9f-26ea90f311ab	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	2c9d0db2-83b8-4340-bba1-12ad1acebcda	pending	\N	\N	\N	\N	\N	\N
89446e97-9fa3-422b-8338-197af3fe70d1	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	ea8bd191-46fd-4e86-ae8d-b3f7354e6c2c	pending	\N	\N	\N	\N	\N	\N
6e6d03f0-fea5-4977-9882-58509d8d0451	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	a419c96c-bb0f-4973-9598-49e88ab2cfa0	pending	\N	\N	\N	\N	\N	\N
fc5082e2-5bb3-4d35-b37a-43b219ee5b6c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	5b76ebc3-05b5-4008-9e8a-8e91866c4536	pending	\N	\N	\N	\N	\N	\N
95e3462b-f902-4e10-aeea-ba5cccaf873f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	4b42d2d7-df7a-425d-b753-5d83c3103d65	pending	\N	\N	\N	\N	\N	\N
af7dcd21-b6ae-44b9-9bfe-c24314393ea7	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	96347f98-91c7-4fec-bc21-be300e60ba28	pending	\N	\N	\N	\N	\N	\N
5b4c01f4-1671-4679-9c66-20d944a5ef6d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	60b0cf22-6574-4d36-b521-7b1725bca50f	pending	\N	\N	\N	\N	\N	\N
45896750-8266-4bb3-a521-44b93a9e1edb	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	a7f68e92-8192-4183-912b-8af85c4d13ee	pending	\N	\N	\N	\N	\N	\N
c5de9337-a832-4812-a716-c09c14566a8a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	65718161-113b-4d95-9df4-f0405428a823	pending	\N	\N	\N	\N	\N	\N
4d53410e-dbd4-4af1-9d63-2d3875b7d9ae	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	f291c7cd-cfea-47e1-a384-b4ecdef4f4da	pending	\N	\N	\N	\N	\N	\N
54488b20-8020-4823-8f80-dcea4a816c2c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	09251a77-561b-4447-ab7d-49b2608bcc75	96a66cc1-f80a-47ad-a643-0b946cffa02e	pending	\N	\N	\N	\N	\N	\N
c2423824-f7e8-47c7-ad76-a8f5f4db822d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	54de01b5-6711-4e2f-b4e5-83b8a658c1ea	pending	\N	\N	\N	\N	\N	\N
e89de19e-6014-465a-a799-9a4d0fadc4fa	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	2bbf52cf-3942-43da-9e74-1ccab5d8f5b7	pending	\N	\N	\N	\N	\N	\N
635d98af-0faa-4b4e-a829-5bd0adb7732b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	40fed8d4-2408-4e91-998d-04548cf33cf1	pending	\N	\N	\N	\N	\N	\N
57edc962-0497-4016-aac4-858a8a2f73b9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	df7f131c-ad24-413e-8640-dac8493be026	pending	\N	\N	\N	\N	\N	\N
64600ed1-d523-42f0-b2f9-dd8d656c7aa7	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	609bab0d-72bd-4ee9-80fd-3f4d1db92bed	pending	\N	\N	\N	\N	\N	\N
ce4231c1-85ee-4c44-ae37-8d72baa62999	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	011aa579-858b-4fec-a3cb-bed8bdd9f82d	pending	\N	\N	\N	\N	\N	\N
479b24d3-4a21-44aa-9404-a3d040ec960f	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	8a2d8daa-1687-4d8d-b54d-7864bd8d7887	pending	\N	\N	\N	\N	\N	\N
46e5c5f7-77d0-4182-81e8-9d3d6b4b0cd4	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	a0498893-beb3-4500-adcc-f56270dab200	pending	\N	\N	\N	\N	\N	\N
b346047f-844d-45fa-a2e9-5eab752a7e98	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	8c16dfa4-433d-44fb-aa00-82b12b83febc	pending	\N	\N	\N	\N	\N	\N
e5308ba5-2b60-45d1-a242-5d3ce4e033e9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	c071fc1e-af9a-490b-bcdf-af80b46d511c	pending	\N	\N	\N	\N	\N	\N
9e813200-710e-47cd-a1b6-c891ff047966	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	46c90232-8f81-49a5-84e3-5eada2ab01e3	pending	\N	\N	\N	\N	\N	\N
75e29dab-c05e-4c1f-aadd-ae23afec3174	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	812f8dcd-a92b-46dc-b9ec-18b272872999	pending	\N	\N	\N	\N	\N	\N
f7741608-0917-4c21-abe0-9b01f5bee0de	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	ec95e8fd-2203-46f6-b941-0e19cb62d92f	pending	\N	\N	\N	\N	\N	\N
df6c2d74-f57d-47b8-8adc-91256746cd07	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	cf1ead87-bc0e-4710-8356-8791329f48d1	pending	\N	\N	\N	\N	\N	\N
14165c99-f36a-4a6c-bd5f-1eb8bb26722a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	cdd2f7af-be6e-457a-a465-13900fd2449b	pending	\N	\N	\N	\N	\N	\N
0ea1f8b4-780e-4063-a008-2c0547e4bb82	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	e48c91a4-3b94-463c-8977-5e35344d1315	pending	\N	\N	\N	\N	\N	\N
20f86bcd-31c0-458e-8e14-27a703469491	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	81af9c2e-f599-47e5-8b27-b29b5cc577cd	pending	\N	\N	\N	\N	\N	\N
13cf3e99-d830-46d1-9ecf-588c5c6f90b1	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	72ed8bbc-c906-462b-91ae-5c8e602a9581	pending	\N	\N	\N	\N	\N	\N
57431123-cf83-487e-90ec-2d998ff59804	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	f5fcaeab-8802-4e50-b73d-4a057431d3fd	pending	\N	\N	\N	\N	\N	\N
240bffb3-80fc-4565-91c4-2d8295f0003d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	7c2ee432-f7a2-468a-91a4-d6da3a69ee91	pending	\N	\N	\N	\N	\N	\N
522531d0-1760-4040-8be9-dbd878ae83a9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	56e7195e-9d95-41eb-b776-924d6ead8b45	pending	\N	\N	\N	\N	\N	\N
1e18dbe2-08c1-4bee-aa66-b963d52c5921	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	ec151a25-440b-4bb8-951a-60f8fa5c42aa	pending	\N	\N	\N	\N	\N	\N
fd7cc889-fe15-4065-980f-0f06e4b44da0	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	db552fa7-40d4-4f8b-ae35-535d9a38f422	pending	\N	\N	\N	\N	\N	\N
e8c76f8c-dda5-4a94-bb88-586c9644b0a1	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	59703fc1-3792-4e00-ba45-d2612bdf9cd2	pending	\N	\N	\N	\N	\N	\N
ccc97c17-665e-4fd0-9903-e0dd0583e69b	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	c768a363-a74b-4cd6-b7e2-04a1e7591121	pending	\N	\N	\N	\N	\N	\N
e3cf821b-07ea-4adb-8c8b-b3191785bb62	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	21f9f74b-d38a-49ea-9f0a-5ff062ad9a25	pending	\N	\N	\N	\N	\N	\N
f5dad7b6-0a47-49aa-9fc5-c7290aae69d7	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	4d2275e3-0590-4352-9bc4-42738e2fa3e3	pending	\N	\N	\N	\N	\N	\N
0a7c0540-460e-47df-810a-dbe733a4e57d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	8f0844ab-cade-4aa7-af50-acf8b8ac8392	pending	\N	\N	\N	\N	\N	\N
dcbd8a0a-6798-4f88-ba92-a3a45976163c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	c8ab532b-2912-4ba1-bf23-5b6a9675e891	pending	\N	\N	\N	\N	\N	\N
93fd555f-9243-407b-ada8-240459c17a5e	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	a6bb2a07-c44e-4fee-8b04-624ec4fbf63a	pending	\N	\N	\N	\N	\N	\N
346cc7f9-25c3-4289-9234-5c6d72616309	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	f6f96670-c693-47ec-96dd-0d65cc2fac0d	pending	\N	\N	\N	\N	\N	\N
0f1a6f0f-6e7f-4224-b6ea-485c3309b10d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	e7d6645c-bf43-48b2-96d1-a4e2489a1e31	pending	\N	\N	\N	\N	\N	\N
ed28a6bf-ddfb-4fa6-aa34-db2503484916	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	975a504a-b40b-44db-b4e9-6e93e0f50c5e	pending	\N	\N	\N	\N	\N	\N
de18cc6a-2f3b-434d-9e55-5f46b1357b6a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	9b1180f3-8170-40e9-a21d-f082cb480b1f	pending	\N	\N	\N	\N	\N	\N
5ace17e8-8f75-4ffb-81f9-a628aaf7962c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	55563828-0f0b-4b0c-b95d-acbb8f83ae6f	pending	\N	\N	\N	\N	\N	\N
cfb03bcb-b3a8-4a96-aea4-825d0345c44d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	3bfc5834-eaba-4c3d-b82e-f2a74eb30dca	pending	\N	\N	\N	\N	\N	\N
e54f42be-cbe1-42ec-a1bb-00b8d717cc47	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	335dc9f5-ee0d-4ea3-9d32-78b49c554073	pending	\N	\N	\N	\N	\N	\N
cd448f6d-8cac-44fe-b340-e4876496de35	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	3de55700-3af8-4f44-9edb-653db4c4b70c	pending	\N	\N	\N	\N	\N	\N
f44be9b6-4a7f-4cbf-88ff-c7171be9daf1	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	90e72c62-d36e-4561-9c1e-765c7504eb73	pending	\N	\N	\N	\N	\N	\N
42d40cd5-2ca4-4ae7-910a-4c59742d5593	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	cce27dbe-160a-4844-b83a-cb5715812517	pending	\N	\N	\N	\N	\N	\N
f7d51692-a540-4839-abd6-b638d4793e2e	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	257b0f05-b370-4607-8ce6-84aec9080d49	pending	\N	\N	\N	\N	\N	\N
40ab0455-be6e-481d-b0c2-3028e10e2ac8	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	40cd9142-c1c4-4969-9fd0-ba27e1553ba2	pending	\N	\N	\N	\N	\N	\N
2cb81016-8a61-4398-87f9-35e0c85c2437	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	2e1b030d-b55d-46df-a3be-404bb7a368cf	pending	\N	\N	\N	\N	\N	\N
d3b09414-01b4-4914-acbc-43bffc4e3065	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	13b241b5-e959-48b8-b741-86d932fb1e7c	pending	\N	\N	\N	\N	\N	\N
475a14b6-e853-498c-a7b3-5266e78a761e	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	b0e855bf-75d3-45b9-af72-cc7a1754aed8	pending	\N	\N	\N	\N	\N	\N
59690835-50a0-49e8-b258-bacd00e5a163	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	3f3a4628-3be8-4cef-8480-46d2fb99c9f9	pending	\N	\N	\N	\N	\N	\N
77d9b015-3364-45cc-b890-1eb8d883bf05	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	b4f32f00-af34-4e60-ace0-f37843d5f2ab	pending	\N	\N	\N	\N	\N	\N
fb663754-8424-45ef-8a86-55b629c8d851	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	41b19327-d33c-45fa-bc37-b0346414a85b	pending	\N	\N	\N	\N	\N	\N
fe2c3e80-10fe-4983-a3ea-fd9e174a9797	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	a2f740a5-867d-40c4-9dee-9ef96886554c	pending	\N	\N	\N	\N	\N	\N
52593451-ac24-4fe3-b862-5b61b65452e8	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	eebdc4eb-df2c-4064-9875-5d0267660480	pending	\N	\N	\N	\N	\N	\N
a14e6879-c02a-409d-b38c-0bb3722db571	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	dff31d86-d6ab-4125-9e24-2205029a8379	pending	\N	\N	\N	\N	\N	\N
2f3341cd-ba5a-4bc1-9990-94805260bf66	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	48e071b5-3332-4582-948b-bffc48d3ca9c	pending	\N	\N	\N	\N	\N	\N
86367d76-eff4-4981-9d7e-ef24d1130fc6	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	ce5811e7-b6bb-4a33-953a-194b7a294da3	pending	\N	\N	\N	\N	\N	\N
5729a6ec-8747-49b5-becb-564514b03bea	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	fb660454-871c-4436-ab39-6a61f64e044b	pending	\N	\N	\N	\N	\N	\N
4f87d74c-3f0d-4830-a8ff-c9515873bccb	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	9cbaea41-b097-468b-a55d-1b60d825ab04	pending	\N	\N	\N	\N	\N	\N
403a1d33-6f3f-4ff5-9ce7-71a8c1542364	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	4be05588-7ad7-4cec-9f5d-112bcaecdd21	pending	\N	\N	\N	\N	\N	\N
17914549-55e3-4a53-b0c8-1f044e14e013	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	be2fd2b2-0039-4e17-b2b1-9f3e2fc33c6b	pending	\N	\N	\N	\N	\N	\N
233bf4b8-90fc-43eb-98a4-cc93f0bd015a	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	f120e862-68f0-40eb-a84a-b6927ce51a90	pending	\N	\N	\N	\N	\N	\N
f71d2d9d-c612-4f69-bba7-c04a63b53dd3	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	d28459b3-7fc0-44ed-bc18-6bd79a3a2b0b	pending	\N	\N	\N	\N	\N	\N
dc0a4914-551c-4139-96cd-701f2119ab52	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	b5547bbf-ab34-4882-9846-fba230b69a7b	pending	\N	\N	\N	\N	\N	\N
b640230f-9ef2-4c22-84dc-08a0c3b46e63	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	64c1aa57-1dbf-4e8c-83cd-2325b8ba0e13	pending	\N	\N	\N	\N	\N	\N
500ed85c-8624-4b55-a695-e9b20e177925	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	2c9d0db2-83b8-4340-bba1-12ad1acebcda	pending	\N	\N	\N	\N	\N	\N
f891063b-b7bd-427a-a4dd-74973fd15fbc	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	ea8bd191-46fd-4e86-ae8d-b3f7354e6c2c	pending	\N	\N	\N	\N	\N	\N
63c5915e-5e25-49b7-a48b-1f16a65a3ca9	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	a419c96c-bb0f-4973-9598-49e88ab2cfa0	pending	\N	\N	\N	\N	\N	\N
6083898b-7d28-4efd-b8ba-f81b2d27b562	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	5b76ebc3-05b5-4008-9e8a-8e91866c4536	pending	\N	\N	\N	\N	\N	\N
87d3cf48-dd82-4427-a2f1-d4f4b098c165	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	4b42d2d7-df7a-425d-b753-5d83c3103d65	pending	\N	\N	\N	\N	\N	\N
c7a0c2b6-50a9-4f69-96e6-a6a0f537780c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	96347f98-91c7-4fec-bc21-be300e60ba28	pending	\N	\N	\N	\N	\N	\N
d642ed85-8719-4c4d-a8da-55f19f0da60d	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	60b0cf22-6574-4d36-b521-7b1725bca50f	pending	\N	\N	\N	\N	\N	\N
49861a48-29f3-4895-a196-d2143f1cea72	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	a7f68e92-8192-4183-912b-8af85c4d13ee	pending	\N	\N	\N	\N	\N	\N
6ddd599b-0c14-492f-9f89-e555b9f5570c	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	65718161-113b-4d95-9df4-f0405428a823	pending	\N	\N	\N	\N	\N	\N
7b77f85f-ac81-471d-8d5b-663cc17e1ea8	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	f291c7cd-cfea-47e1-a384-b4ecdef4f4da	pending	\N	\N	\N	\N	\N	\N
2aebf6b7-fec7-47d4-82f2-3560a06dfde5	9e12c170-6bd0-4603-80ea-ca888fa43a0e	\N	b0271606-1ece-4e3a-84e5-4ddee9316d2d	96a66cc1-f80a-47ad-a643-0b946cffa02e	pending	\N	\N	\N	\N	\N	\N
48f6270b-82e9-4121-89e0-e07fdb361fef	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	54de01b5-6711-4e2f-b4e5-83b8a658c1ea	pending	\N	\N	\N	\N	\N	\N
37249eda-7f3b-4ad7-81b1-804531c569cf	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	2bbf52cf-3942-43da-9e74-1ccab5d8f5b7	pending	\N	\N	\N	\N	\N	\N
93b3e341-2bbc-4f3b-ac9a-9bc3830c4a6f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	40fed8d4-2408-4e91-998d-04548cf33cf1	pending	\N	\N	\N	\N	\N	\N
62c7c62d-02a5-4e50-b5f3-023f82aa135e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	df7f131c-ad24-413e-8640-dac8493be026	pending	\N	\N	\N	\N	\N	\N
0e62bb63-2c9a-42c7-a69c-f0af3f7cfedd	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	609bab0d-72bd-4ee9-80fd-3f4d1db92bed	pending	\N	\N	\N	\N	\N	\N
41996804-8a24-4377-875e-e63c10f05cc1	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	011aa579-858b-4fec-a3cb-bed8bdd9f82d	pending	\N	\N	\N	\N	\N	\N
29b660bd-fd77-40c2-a876-b865a6cab027	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	8a2d8daa-1687-4d8d-b54d-7864bd8d7887	pending	\N	\N	\N	\N	\N	\N
276dcd1c-716d-42b9-9a4b-058bcb056c28	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	a0498893-beb3-4500-adcc-f56270dab200	pending	\N	\N	\N	\N	\N	\N
164a2d2a-ec13-4daa-95d1-fa51fe83616d	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	8c16dfa4-433d-44fb-aa00-82b12b83febc	pending	\N	\N	\N	\N	\N	\N
3e54a9ab-d95a-432d-b10b-87acf7fe78f2	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	c071fc1e-af9a-490b-bcdf-af80b46d511c	pending	\N	\N	\N	\N	\N	\N
7de53120-83f9-48d1-8369-e0bbac656538	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	46c90232-8f81-49a5-84e3-5eada2ab01e3	pending	\N	\N	\N	\N	\N	\N
db2d0e7a-ba2b-465b-9d98-1aee234c593e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	812f8dcd-a92b-46dc-b9ec-18b272872999	pending	\N	\N	\N	\N	\N	\N
333736d4-5500-4281-8686-eafb0f1ab2d8	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	ec95e8fd-2203-46f6-b941-0e19cb62d92f	pending	\N	\N	\N	\N	\N	\N
63a6f4fb-bf5f-450e-b293-c174f04567c6	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	cf1ead87-bc0e-4710-8356-8791329f48d1	pending	\N	\N	\N	\N	\N	\N
bcbc29ee-e49a-4bc9-a4b2-99f18c42ad1e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	cdd2f7af-be6e-457a-a465-13900fd2449b	pending	\N	\N	\N	\N	\N	\N
03cef063-2ac8-42b3-bd74-384f8b5d8980	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	e48c91a4-3b94-463c-8977-5e35344d1315	pending	\N	\N	\N	\N	\N	\N
76329bff-6e75-44cd-856c-3f2b19291a1f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	81af9c2e-f599-47e5-8b27-b29b5cc577cd	pending	\N	\N	\N	\N	\N	\N
64947c3a-5f73-4cdb-bd5b-c427a41f1568	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	e01773e0-ebb9-471a-be8c-98f2951a1454	pending	\N	\N	\N	\N	\N	\N
9d11d662-69e6-4be7-8ec7-9239fa0ae100	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	72ed8bbc-c906-462b-91ae-5c8e602a9581	pending	\N	\N	\N	\N	\N	\N
eddbe065-4255-4b7a-ab2d-049c520cf380	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	f5fcaeab-8802-4e50-b73d-4a057431d3fd	pending	\N	\N	\N	\N	\N	\N
1b609456-b952-4e6b-b2a1-646e017b7508	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	7c2ee432-f7a2-468a-91a4-d6da3a69ee91	pending	\N	\N	\N	\N	\N	\N
b8ccafa7-e71e-41df-b415-8b4e6ac82475	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	56e7195e-9d95-41eb-b776-924d6ead8b45	pending	\N	\N	\N	\N	\N	\N
fb09e119-1baf-4540-b651-a5b1f967bf63	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	ec151a25-440b-4bb8-951a-60f8fa5c42aa	pending	\N	\N	\N	\N	\N	\N
b0652730-f073-461d-b01e-787d7dbeb7b8	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	db552fa7-40d4-4f8b-ae35-535d9a38f422	pending	\N	\N	\N	\N	\N	\N
f863b9ec-e981-4703-bb18-ffbbd9806246	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	59703fc1-3792-4e00-ba45-d2612bdf9cd2	pending	\N	\N	\N	\N	\N	\N
56b0379b-f400-4297-aa7d-0e1c8c2ae863	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	c768a363-a74b-4cd6-b7e2-04a1e7591121	pending	\N	\N	\N	\N	\N	\N
5deb174d-fcd7-48fa-9ff5-e1a33cf08669	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	21f9f74b-d38a-49ea-9f0a-5ff062ad9a25	pending	\N	\N	\N	\N	\N	\N
a864ddc4-2917-47e6-ac57-5d6c2739964c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	4d2275e3-0590-4352-9bc4-42738e2fa3e3	pending	\N	\N	\N	\N	\N	\N
391b4444-ce90-4ee0-8640-5ec5598e8405	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	8f0844ab-cade-4aa7-af50-acf8b8ac8392	pending	\N	\N	\N	\N	\N	\N
c7f8a7d0-4b25-4011-ab91-a5b6656e5655	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	c8ab532b-2912-4ba1-bf23-5b6a9675e891	pending	\N	\N	\N	\N	\N	\N
6c2137a6-f72d-43e6-b896-6eb782930f9a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	a6bb2a07-c44e-4fee-8b04-624ec4fbf63a	pending	\N	\N	\N	\N	\N	\N
c9849789-14be-4875-85d0-cbb596beb415	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	fe7bc2c6-3f89-4e0f-9eb5-03d1408a0507	pending	\N	\N	\N	\N	\N	\N
a939aedb-f2f5-4c51-a75a-d7403e90739e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	e7d6645c-bf43-48b2-96d1-a4e2489a1e31	pending	\N	\N	\N	\N	\N	\N
162536e5-0c61-44c8-a72d-ef059a1bf558	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	cbe5729c-fff2-4eb5-aea3-9711c0868ee1	pending	\N	\N	\N	\N	\N	\N
f79f9e74-b730-452c-a479-bccbfb2f7e01	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	975a504a-b40b-44db-b4e9-6e93e0f50c5e	pending	\N	\N	\N	\N	\N	\N
35246a19-4d0a-49b4-97b2-05b74185372c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	9b1180f3-8170-40e9-a21d-f082cb480b1f	pending	\N	\N	\N	\N	\N	\N
af4623e3-2212-4e34-9b29-3ede7419f158	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	55563828-0f0b-4b0c-b95d-acbb8f83ae6f	pending	\N	\N	\N	\N	\N	\N
7a897aaa-2701-48e0-8d07-a40ab464d887	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	3bfc5834-eaba-4c3d-b82e-f2a74eb30dca	pending	\N	\N	\N	\N	\N	\N
7845e98a-b704-4672-9409-784c409888dd	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	335dc9f5-ee0d-4ea3-9d32-78b49c554073	pending	\N	\N	\N	\N	\N	\N
0423a472-227f-436f-8f41-01e11bf8f241	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	90e72c62-d36e-4561-9c1e-765c7504eb73	pending	\N	\N	\N	\N	\N	\N
7a618c33-651f-4073-a745-f37d878ea2ec	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	77dbd755-b2cf-4662-9f79-9d75b9efa46c	pending	\N	\N	\N	\N	\N	\N
dd599572-86a3-4bbe-8dc3-fe794c2014a7	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	cce27dbe-160a-4844-b83a-cb5715812517	pending	\N	\N	\N	\N	\N	\N
931e0e17-246b-4ed6-9014-79fa0944cbca	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	257b0f05-b370-4607-8ce6-84aec9080d49	pending	\N	\N	\N	\N	\N	\N
85c8d376-cbcb-4328-8a26-ed132b160c0b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	40cd9142-c1c4-4969-9fd0-ba27e1553ba2	pending	\N	\N	\N	\N	\N	\N
8c293af6-1f91-4ac8-a5ca-8fd18c32287c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	3b9212c5-4025-4b18-8bb7-ed02011acd4c	pending	\N	\N	\N	\N	\N	\N
0bc9cb19-4cba-46e6-8844-3cf2dfd2f613	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	2e1b030d-b55d-46df-a3be-404bb7a368cf	pending	\N	\N	\N	\N	\N	\N
0e3262d0-ab8a-42de-b466-3913eab56873	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	13b241b5-e959-48b8-b741-86d932fb1e7c	pending	\N	\N	\N	\N	\N	\N
d44c42cc-5bd7-421b-87e1-a4e4852eefb0	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	3f3a4628-3be8-4cef-8480-46d2fb99c9f9	pending	\N	\N	\N	\N	\N	\N
53676c84-d11e-419d-81fd-94b9cae2ea45	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	b4f32f00-af34-4e60-ace0-f37843d5f2ab	pending	\N	\N	\N	\N	\N	\N
307bfad1-5b1e-4cb4-b6dd-6ae9f4cafedd	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	41b19327-d33c-45fa-bc37-b0346414a85b	pending	\N	\N	\N	\N	\N	\N
75789df1-95f9-45ca-94b0-4a6e72d64f83	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	a2f740a5-867d-40c4-9dee-9ef96886554c	pending	\N	\N	\N	\N	\N	\N
53d69bf7-075f-44ad-874c-26401ebea1b6	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	eebdc4eb-df2c-4064-9875-5d0267660480	pending	\N	\N	\N	\N	\N	\N
74d440d0-4772-4b97-abff-ed0389afb74f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	dff31d86-d6ab-4125-9e24-2205029a8379	pending	\N	\N	\N	\N	\N	\N
8cadff21-a751-4613-bb68-c8b664b6744b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	48e071b5-3332-4582-948b-bffc48d3ca9c	pending	\N	\N	\N	\N	\N	\N
bba3e670-d90f-4879-b81e-e91b7c000d2a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	ce5811e7-b6bb-4a33-953a-194b7a294da3	pending	\N	\N	\N	\N	\N	\N
2fe4f51d-19c4-44fa-8e3f-cdc0962e80dc	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	fb660454-871c-4436-ab39-6a61f64e044b	pending	\N	\N	\N	\N	\N	\N
fbc884ff-2a84-4b5b-a858-b53e6df6b30f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	9cbaea41-b097-468b-a55d-1b60d825ab04	pending	\N	\N	\N	\N	\N	\N
89d6b62a-b40f-4e3d-b922-b7ec15fce107	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	4be05588-7ad7-4cec-9f5d-112bcaecdd21	pending	\N	\N	\N	\N	\N	\N
b57acf89-be2d-441e-9b8e-7a4c8d75f91e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	be2fd2b2-0039-4e17-b2b1-9f3e2fc33c6b	pending	\N	\N	\N	\N	\N	\N
ced7ce53-0ae2-4a52-a5bf-636863f98a5c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	f120e862-68f0-40eb-a84a-b6927ce51a90	pending	\N	\N	\N	\N	\N	\N
6cc839c8-1ee4-41b9-8b2e-627fda6f31c4	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	b5547bbf-ab34-4882-9846-fba230b69a7b	pending	\N	\N	\N	\N	\N	\N
b463de80-f4fb-4ae7-8f95-5224883e39f7	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	707c6d78-6d9f-47dd-8186-917ec255ffb2	pending	\N	\N	\N	\N	\N	\N
cdc30797-6441-45ce-9ecb-9b164275151d	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	64c1aa57-1dbf-4e8c-83cd-2325b8ba0e13	pending	\N	\N	\N	\N	\N	\N
b621054d-1655-4933-848d-72ecbb6e4449	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	2c9d0db2-83b8-4340-bba1-12ad1acebcda	pending	\N	\N	\N	\N	\N	\N
8146d999-c185-498a-a2d1-99081742a0a5	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	ea8bd191-46fd-4e86-ae8d-b3f7354e6c2c	pending	\N	\N	\N	\N	\N	\N
a56f0951-a7fe-4817-8e89-1c0015bacb45	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	a419c96c-bb0f-4973-9598-49e88ab2cfa0	pending	\N	\N	\N	\N	\N	\N
0375893e-ba84-49f6-a12f-b8cfae56db0c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	5b76ebc3-05b5-4008-9e8a-8e91866c4536	pending	\N	\N	\N	\N	\N	\N
8a008e9f-a1aa-476f-a365-1377ee2d183d	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	4b42d2d7-df7a-425d-b753-5d83c3103d65	pending	\N	\N	\N	\N	\N	\N
c449b456-a655-469a-a41b-1eda190ba32d	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	96347f98-91c7-4fec-bc21-be300e60ba28	pending	\N	\N	\N	\N	\N	\N
4d00c3e3-dc51-4154-a1f0-f6587bb54e92	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	60b0cf22-6574-4d36-b521-7b1725bca50f	pending	\N	\N	\N	\N	\N	\N
9d1457b4-d469-41ac-916f-f13db2dba4db	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	a7f68e92-8192-4183-912b-8af85c4d13ee	pending	\N	\N	\N	\N	\N	\N
8a95ad83-e942-4e73-818f-2858fb17b3de	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	65718161-113b-4d95-9df4-f0405428a823	pending	\N	\N	\N	\N	\N	\N
05bb6448-83c7-4388-9467-127add214a56	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	f291c7cd-cfea-47e1-a384-b4ecdef4f4da	pending	\N	\N	\N	\N	\N	\N
991787d8-db4c-4820-a597-82df073a739f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	d5db9148-6244-4e30-b070-120a43bfbb99	96a66cc1-f80a-47ad-a643-0b946cffa02e	pending	\N	\N	\N	\N	\N	\N
eb36d8fc-5e4b-4fcc-adaa-c2c8b02ada6a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	54de01b5-6711-4e2f-b4e5-83b8a658c1ea	pending	\N	\N	\N	\N	\N	\N
8fd59362-db02-44e7-83a7-74ca3f456e54	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	2bbf52cf-3942-43da-9e74-1ccab5d8f5b7	pending	\N	\N	\N	\N	\N	\N
a9d43789-8e96-45fb-947d-f175809bbf9f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	40fed8d4-2408-4e91-998d-04548cf33cf1	pending	\N	\N	\N	\N	\N	\N
9136643c-a675-4f9e-9653-d99750f33da1	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	df7f131c-ad24-413e-8640-dac8493be026	pending	\N	\N	\N	\N	\N	\N
e064103a-349a-4373-bacd-c936abbe5e39	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	609bab0d-72bd-4ee9-80fd-3f4d1db92bed	pending	\N	\N	\N	\N	\N	\N
2dc04c33-1e77-471f-9166-a5f7a97f8264	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	011aa579-858b-4fec-a3cb-bed8bdd9f82d	pending	\N	\N	\N	\N	\N	\N
2530c3d1-d539-47b4-8146-7f9236f54ab1	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	8a2d8daa-1687-4d8d-b54d-7864bd8d7887	pending	\N	\N	\N	\N	\N	\N
6be96052-5bb8-47ff-89bb-ab85d0f7408d	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	a0498893-beb3-4500-adcc-f56270dab200	pending	\N	\N	\N	\N	\N	\N
f714650a-4ebf-498a-880a-4e6af7745708	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	8c16dfa4-433d-44fb-aa00-82b12b83febc	pending	\N	\N	\N	\N	\N	\N
9bfd2751-e5c4-421e-ada5-864bac3f613f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	c071fc1e-af9a-490b-bcdf-af80b46d511c	pending	\N	\N	\N	\N	\N	\N
3d52b5d7-6d4d-4c39-a5a2-439d92b1549f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	46c90232-8f81-49a5-84e3-5eada2ab01e3	pending	\N	\N	\N	\N	\N	\N
906b0eb2-72b2-417c-ac5b-8aae0edd690e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	812f8dcd-a92b-46dc-b9ec-18b272872999	pending	\N	\N	\N	\N	\N	\N
6a034ef2-82ee-446e-a0ad-55b514ad9b31	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	ec95e8fd-2203-46f6-b941-0e19cb62d92f	pending	\N	\N	\N	\N	\N	\N
8f1c2893-4819-4e5e-b7b3-e180ea3a0b96	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	cf1ead87-bc0e-4710-8356-8791329f48d1	pending	\N	\N	\N	\N	\N	\N
59720e2c-80c3-473a-8cc7-ad7e825f8314	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	cdd2f7af-be6e-457a-a465-13900fd2449b	pending	\N	\N	\N	\N	\N	\N
a09de6c0-a330-434b-be14-09790d7e0bac	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	e48c91a4-3b94-463c-8977-5e35344d1315	pending	\N	\N	\N	\N	\N	\N
ade523c4-ab1d-4e24-8449-b38398c7f1d5	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	81af9c2e-f599-47e5-8b27-b29b5cc577cd	pending	\N	\N	\N	\N	\N	\N
023354b5-d7f7-4c01-b2c1-0ecbf3ada72b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	e01773e0-ebb9-471a-be8c-98f2951a1454	pending	\N	\N	\N	\N	\N	\N
2c597114-9308-4305-9040-4790326d94d2	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	72ed8bbc-c906-462b-91ae-5c8e602a9581	pending	\N	\N	\N	\N	\N	\N
55cea9ed-2cad-4960-bce0-e24de4283ce9	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	f5fcaeab-8802-4e50-b73d-4a057431d3fd	pending	\N	\N	\N	\N	\N	\N
d71e5311-d9f0-4497-8450-d55df85dd57c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	7c2ee432-f7a2-468a-91a4-d6da3a69ee91	pending	\N	\N	\N	\N	\N	\N
0860482c-16b1-4736-adeb-2b307add1a73	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	56e7195e-9d95-41eb-b776-924d6ead8b45	pending	\N	\N	\N	\N	\N	\N
4b517818-367e-45d1-b35d-f5b5ae4cbdd2	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	ec151a25-440b-4bb8-951a-60f8fa5c42aa	pending	\N	\N	\N	\N	\N	\N
a7502013-030e-44ed-aa3b-94df4e55d354	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	db552fa7-40d4-4f8b-ae35-535d9a38f422	pending	\N	\N	\N	\N	\N	\N
3d61c844-5d3e-426d-bb76-6307fdecc150	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	59703fc1-3792-4e00-ba45-d2612bdf9cd2	pending	\N	\N	\N	\N	\N	\N
a5bdefd9-4aa2-4666-86eb-f8ab00c23452	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	c768a363-a74b-4cd6-b7e2-04a1e7591121	pending	\N	\N	\N	\N	\N	\N
90de855b-2de3-4351-8e9c-3c2864292eb0	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	21f9f74b-d38a-49ea-9f0a-5ff062ad9a25	pending	\N	\N	\N	\N	\N	\N
19df44d3-3095-4d97-9e18-76792dea44ef	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	4d2275e3-0590-4352-9bc4-42738e2fa3e3	pending	\N	\N	\N	\N	\N	\N
d8ebfb5e-87f2-49a4-9f67-d187e303eb08	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	8f0844ab-cade-4aa7-af50-acf8b8ac8392	pending	\N	\N	\N	\N	\N	\N
45596985-5655-4e09-8678-779f37d0b9e4	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	c8ab532b-2912-4ba1-bf23-5b6a9675e891	pending	\N	\N	\N	\N	\N	\N
3af2a754-fd58-4c85-9e31-9998ce715a93	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	a6bb2a07-c44e-4fee-8b04-624ec4fbf63a	pending	\N	\N	\N	\N	\N	\N
30303ee9-221d-4227-861a-cb83376eea17	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	fe7bc2c6-3f89-4e0f-9eb5-03d1408a0507	pending	\N	\N	\N	\N	\N	\N
85f7ef2f-c3ef-43f6-94a2-3a4670a2ea33	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	e7d6645c-bf43-48b2-96d1-a4e2489a1e31	pending	\N	\N	\N	\N	\N	\N
594e6232-fef1-49c5-93ef-81c01f4fa555	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	cbe5729c-fff2-4eb5-aea3-9711c0868ee1	pending	\N	\N	\N	\N	\N	\N
fb4bd04a-c94d-4141-8b71-18c7e29bff22	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	975a504a-b40b-44db-b4e9-6e93e0f50c5e	pending	\N	\N	\N	\N	\N	\N
02f96dcb-4d32-47f6-b417-b2c8c7435f05	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	9b1180f3-8170-40e9-a21d-f082cb480b1f	pending	\N	\N	\N	\N	\N	\N
f7e737fb-613b-4514-bdcb-53163e90a172	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	55563828-0f0b-4b0c-b95d-acbb8f83ae6f	pending	\N	\N	\N	\N	\N	\N
c5cfa467-a821-4a66-bb11-ed33270d6a4d	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	3bfc5834-eaba-4c3d-b82e-f2a74eb30dca	pending	\N	\N	\N	\N	\N	\N
c8acc6e8-acbf-48fb-9f7e-b31529ff685e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	335dc9f5-ee0d-4ea3-9d32-78b49c554073	pending	\N	\N	\N	\N	\N	\N
bd419873-00ea-48bd-a660-a6a931706e47	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	90e72c62-d36e-4561-9c1e-765c7504eb73	pending	\N	\N	\N	\N	\N	\N
4547835f-2d99-408a-aa36-35d039107696	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	77dbd755-b2cf-4662-9f79-9d75b9efa46c	pending	\N	\N	\N	\N	\N	\N
54042fca-4aa8-4ab8-b8dc-68f5e2d4e2ab	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	cce27dbe-160a-4844-b83a-cb5715812517	pending	\N	\N	\N	\N	\N	\N
2e83eb56-2f47-4c69-8bdd-d568f641ce43	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	257b0f05-b370-4607-8ce6-84aec9080d49	pending	\N	\N	\N	\N	\N	\N
533aacf6-1ccb-4170-8d3a-e57c2d38227d	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	40cd9142-c1c4-4969-9fd0-ba27e1553ba2	pending	\N	\N	\N	\N	\N	\N
2b8a8588-01f3-420a-a8f1-414951bc90ff	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	3b9212c5-4025-4b18-8bb7-ed02011acd4c	pending	\N	\N	\N	\N	\N	\N
7fef40f0-e1b6-4430-adf9-c59bdeec4efa	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	2e1b030d-b55d-46df-a3be-404bb7a368cf	pending	\N	\N	\N	\N	\N	\N
8c0ffb8d-fb31-4488-997f-80994e9c61fc	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	13b241b5-e959-48b8-b741-86d932fb1e7c	pending	\N	\N	\N	\N	\N	\N
835e58e9-cd0b-45ec-9d21-ac8769d57a46	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	3f3a4628-3be8-4cef-8480-46d2fb99c9f9	pending	\N	\N	\N	\N	\N	\N
1d075c0e-be5f-4380-9bad-eca86204a7e5	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	b4f32f00-af34-4e60-ace0-f37843d5f2ab	pending	\N	\N	\N	\N	\N	\N
043533ad-0785-4bfa-b5a7-ff1935f0d40c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	41b19327-d33c-45fa-bc37-b0346414a85b	pending	\N	\N	\N	\N	\N	\N
3f716006-9add-4f23-b79f-ddd46707b1d1	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	a2f740a5-867d-40c4-9dee-9ef96886554c	pending	\N	\N	\N	\N	\N	\N
a6e298d1-f367-4487-af5d-82fb93da4230	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	eebdc4eb-df2c-4064-9875-5d0267660480	pending	\N	\N	\N	\N	\N	\N
a4301d36-e352-461f-b8e3-be9f97f3c801	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	dff31d86-d6ab-4125-9e24-2205029a8379	pending	\N	\N	\N	\N	\N	\N
d11ce43b-bb61-4a50-a9c2-85c5b5f35adf	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	48e071b5-3332-4582-948b-bffc48d3ca9c	pending	\N	\N	\N	\N	\N	\N
b318d5ab-b764-4873-8329-c81077fabbc2	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	ce5811e7-b6bb-4a33-953a-194b7a294da3	pending	\N	\N	\N	\N	\N	\N
00046eca-7809-4337-a0a2-d4e2596643b0	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	fb660454-871c-4436-ab39-6a61f64e044b	pending	\N	\N	\N	\N	\N	\N
4b184650-ea3b-48ce-9e20-29496c116403	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	9cbaea41-b097-468b-a55d-1b60d825ab04	pending	\N	\N	\N	\N	\N	\N
6d6db67c-4b72-475f-b82e-9a4b8cb3699f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	4be05588-7ad7-4cec-9f5d-112bcaecdd21	pending	\N	\N	\N	\N	\N	\N
041e8a64-a948-49b2-a174-5b09ff0a54a3	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	be2fd2b2-0039-4e17-b2b1-9f3e2fc33c6b	pending	\N	\N	\N	\N	\N	\N
3e74419a-0c91-4143-9a6b-54b2980fe031	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	f120e862-68f0-40eb-a84a-b6927ce51a90	pending	\N	\N	\N	\N	\N	\N
e5211cfc-b8ae-4b09-89ff-dca2bb9c2a31	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	b5547bbf-ab34-4882-9846-fba230b69a7b	pending	\N	\N	\N	\N	\N	\N
8bf651ab-358e-476d-baab-4e734befba85	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	707c6d78-6d9f-47dd-8186-917ec255ffb2	pending	\N	\N	\N	\N	\N	\N
c2e0187a-7dd8-41bf-9473-cfee7b240c6f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	64c1aa57-1dbf-4e8c-83cd-2325b8ba0e13	pending	\N	\N	\N	\N	\N	\N
30cceea6-0404-425c-add2-b49c0048af71	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	2c9d0db2-83b8-4340-bba1-12ad1acebcda	pending	\N	\N	\N	\N	\N	\N
86b0667b-1fd5-4c27-b6fb-d50bce9bd473	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	ea8bd191-46fd-4e86-ae8d-b3f7354e6c2c	pending	\N	\N	\N	\N	\N	\N
15a3f2a9-8073-46f5-a755-866c01557704	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	a419c96c-bb0f-4973-9598-49e88ab2cfa0	pending	\N	\N	\N	\N	\N	\N
aea3744d-9aac-42b9-927d-b44ff4a46d36	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	5b76ebc3-05b5-4008-9e8a-8e91866c4536	pending	\N	\N	\N	\N	\N	\N
557c2cdc-d35a-4221-8893-ba3df3e652c7	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	4b42d2d7-df7a-425d-b753-5d83c3103d65	pending	\N	\N	\N	\N	\N	\N
c9269d4c-a1eb-4e45-99de-f52cbb6c8aa5	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	96347f98-91c7-4fec-bc21-be300e60ba28	pending	\N	\N	\N	\N	\N	\N
3a4d9c42-60b2-418b-99b3-11b44049865b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	60b0cf22-6574-4d36-b521-7b1725bca50f	pending	\N	\N	\N	\N	\N	\N
4204ed2a-73d4-4657-ae17-c6ceac4aa52c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	a7f68e92-8192-4183-912b-8af85c4d13ee	pending	\N	\N	\N	\N	\N	\N
49e4d9fb-a795-49aa-82c1-d1542f3556d8	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	65718161-113b-4d95-9df4-f0405428a823	pending	\N	\N	\N	\N	\N	\N
d0154a27-7145-4d84-81bb-237b6df46eec	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	f291c7cd-cfea-47e1-a384-b4ecdef4f4da	pending	\N	\N	\N	\N	\N	\N
ec548c2f-819f-4331-a3ef-6dfa2bb32365	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	4bf14c86-9d37-4778-8173-a50bef1b57d2	96a66cc1-f80a-47ad-a643-0b946cffa02e	pending	\N	\N	\N	\N	\N	\N
35a8b528-d63d-4a1a-b303-54fe49243d48	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	54de01b5-6711-4e2f-b4e5-83b8a658c1ea	pending	\N	\N	\N	\N	\N	\N
0c647065-9c2e-43e8-8cd4-0d4b079422cf	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	2bbf52cf-3942-43da-9e74-1ccab5d8f5b7	pending	\N	\N	\N	\N	\N	\N
7ae7cc6d-66f7-4f1f-bd71-64cc232ae9aa	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	40fed8d4-2408-4e91-998d-04548cf33cf1	pending	\N	\N	\N	\N	\N	\N
3d7a38f9-7da6-4f67-a0a3-6099ae0932c3	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	df7f131c-ad24-413e-8640-dac8493be026	pending	\N	\N	\N	\N	\N	\N
d3d3f1c2-3cbc-47cf-9e3b-63c979df8a4a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	609bab0d-72bd-4ee9-80fd-3f4d1db92bed	pending	\N	\N	\N	\N	\N	\N
22ad06ae-11b6-484f-b9d2-4366466e1ac5	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	011aa579-858b-4fec-a3cb-bed8bdd9f82d	pending	\N	\N	\N	\N	\N	\N
bed1a940-7ffb-4d0b-934b-cf501c0f6e55	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	8a2d8daa-1687-4d8d-b54d-7864bd8d7887	pending	\N	\N	\N	\N	\N	\N
3ffd42b1-166a-4389-bcb5-e9d8cd275d5b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	a0498893-beb3-4500-adcc-f56270dab200	pending	\N	\N	\N	\N	\N	\N
931df234-3475-44dc-8e8b-8c1700c11e63	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	8c16dfa4-433d-44fb-aa00-82b12b83febc	pending	\N	\N	\N	\N	\N	\N
1b304202-526b-4e72-9bac-387c03ac28f4	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	c071fc1e-af9a-490b-bcdf-af80b46d511c	pending	\N	\N	\N	\N	\N	\N
196eb6dd-2297-4393-bf73-30bcbc4fb94a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	46c90232-8f81-49a5-84e3-5eada2ab01e3	pending	\N	\N	\N	\N	\N	\N
42da9c6d-f8b8-41b0-8255-d52966142991	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	812f8dcd-a92b-46dc-b9ec-18b272872999	pending	\N	\N	\N	\N	\N	\N
1afe7f10-bfd1-4a4f-86a9-a1777f022586	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	ec95e8fd-2203-46f6-b941-0e19cb62d92f	pending	\N	\N	\N	\N	\N	\N
3e273eb3-2395-4573-9710-b6e81bc20259	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	cf1ead87-bc0e-4710-8356-8791329f48d1	pending	\N	\N	\N	\N	\N	\N
4c08d239-f7c3-4393-b01e-f29e03120354	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	cdd2f7af-be6e-457a-a465-13900fd2449b	pending	\N	\N	\N	\N	\N	\N
d04bc5fb-fc35-4380-b1f9-c933672459b5	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	e48c91a4-3b94-463c-8977-5e35344d1315	pending	\N	\N	\N	\N	\N	\N
56772ed4-2852-4a23-8b53-87a8ab50280b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	81af9c2e-f599-47e5-8b27-b29b5cc577cd	pending	\N	\N	\N	\N	\N	\N
39671116-6f16-4550-8744-2c94c4c8a13d	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	e01773e0-ebb9-471a-be8c-98f2951a1454	pending	\N	\N	\N	\N	\N	\N
2a816884-9c74-404b-b04e-95bd0de7c508	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	72ed8bbc-c906-462b-91ae-5c8e602a9581	pending	\N	\N	\N	\N	\N	\N
068a0469-3a6e-4094-9c3e-cef0448cc163	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	f5fcaeab-8802-4e50-b73d-4a057431d3fd	pending	\N	\N	\N	\N	\N	\N
076412cf-c944-439c-aab4-445967a0dd0d	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	7c2ee432-f7a2-468a-91a4-d6da3a69ee91	pending	\N	\N	\N	\N	\N	\N
604c63c6-d4e8-40b6-baa9-2bfa08e2bbd0	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	56e7195e-9d95-41eb-b776-924d6ead8b45	pending	\N	\N	\N	\N	\N	\N
029c9e3a-2fd1-405f-b91a-8ab91f44a020	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	ec151a25-440b-4bb8-951a-60f8fa5c42aa	pending	\N	\N	\N	\N	\N	\N
e8c653f3-6ff3-4915-957a-de9f9ff0a5fb	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	db552fa7-40d4-4f8b-ae35-535d9a38f422	pending	\N	\N	\N	\N	\N	\N
d9cf2b99-6de5-4912-aa44-f50774f87ec4	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	59703fc1-3792-4e00-ba45-d2612bdf9cd2	pending	\N	\N	\N	\N	\N	\N
902d25fd-678c-4a72-8769-4c15a1fc6a84	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	c768a363-a74b-4cd6-b7e2-04a1e7591121	pending	\N	\N	\N	\N	\N	\N
fbaad38e-c474-4fba-bdb4-ad51fceb56c9	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	21f9f74b-d38a-49ea-9f0a-5ff062ad9a25	pending	\N	\N	\N	\N	\N	\N
04353747-4b97-484f-9469-2b1f0dc68333	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	4d2275e3-0590-4352-9bc4-42738e2fa3e3	pending	\N	\N	\N	\N	\N	\N
2394c9a8-9d1b-40f0-8a3e-bf19a7f67771	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	8f0844ab-cade-4aa7-af50-acf8b8ac8392	pending	\N	\N	\N	\N	\N	\N
e0eba7f3-0f5b-45da-a93a-8c8632f9a249	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	c8ab532b-2912-4ba1-bf23-5b6a9675e891	pending	\N	\N	\N	\N	\N	\N
4464f201-6693-44d6-8b2f-9e3402a81247	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	a6bb2a07-c44e-4fee-8b04-624ec4fbf63a	pending	\N	\N	\N	\N	\N	\N
3e25179c-0d59-44f3-a687-daedfd054c21	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	fe7bc2c6-3f89-4e0f-9eb5-03d1408a0507	pending	\N	\N	\N	\N	\N	\N
606c4f8c-228a-441e-a774-bdf6ee7dbf7f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	e7d6645c-bf43-48b2-96d1-a4e2489a1e31	pending	\N	\N	\N	\N	\N	\N
67789bd2-2c11-4c13-a567-e4a7f503154f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	cbe5729c-fff2-4eb5-aea3-9711c0868ee1	pending	\N	\N	\N	\N	\N	\N
e2d1211c-f5f1-4a52-85a8-2ea59e5b0ea2	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	975a504a-b40b-44db-b4e9-6e93e0f50c5e	pending	\N	\N	\N	\N	\N	\N
e0889385-6cf5-43c7-9a66-6b80a7129620	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	9b1180f3-8170-40e9-a21d-f082cb480b1f	pending	\N	\N	\N	\N	\N	\N
a847509e-ad4a-41c2-a07d-7a4b94abb6ab	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	55563828-0f0b-4b0c-b95d-acbb8f83ae6f	pending	\N	\N	\N	\N	\N	\N
e6c56e7f-20d9-4e56-a281-3de53c457b0e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	3bfc5834-eaba-4c3d-b82e-f2a74eb30dca	pending	\N	\N	\N	\N	\N	\N
ffa5d443-1c19-4a4b-8b5b-7657244daf8f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	335dc9f5-ee0d-4ea3-9d32-78b49c554073	pending	\N	\N	\N	\N	\N	\N
8f48c576-99d1-4d30-af9f-7ce87a0c9089	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	90e72c62-d36e-4561-9c1e-765c7504eb73	pending	\N	\N	\N	\N	\N	\N
5b0defe6-bd9b-418f-ac61-6b31aaa7b8a4	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	77dbd755-b2cf-4662-9f79-9d75b9efa46c	pending	\N	\N	\N	\N	\N	\N
1ad9c8fd-c66e-4837-9757-f4180eac0f6b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	cce27dbe-160a-4844-b83a-cb5715812517	pending	\N	\N	\N	\N	\N	\N
c3217c7f-f6ee-40ef-9e7c-04c945cc4e8c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	257b0f05-b370-4607-8ce6-84aec9080d49	pending	\N	\N	\N	\N	\N	\N
470b7fb4-9f64-44a2-bf8a-1e5e126237c2	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	40cd9142-c1c4-4969-9fd0-ba27e1553ba2	pending	\N	\N	\N	\N	\N	\N
aabc565b-60ba-4a89-ac45-692cae86a5cb	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	3b9212c5-4025-4b18-8bb7-ed02011acd4c	pending	\N	\N	\N	\N	\N	\N
6c0827f7-c448-4d09-adbc-f95f29596073	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	2e1b030d-b55d-46df-a3be-404bb7a368cf	pending	\N	\N	\N	\N	\N	\N
3b5fb898-3d92-49cd-82a6-00d38756503f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	13b241b5-e959-48b8-b741-86d932fb1e7c	pending	\N	\N	\N	\N	\N	\N
c67bd118-4fd7-4806-b1a2-9bca63911429	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	3f3a4628-3be8-4cef-8480-46d2fb99c9f9	pending	\N	\N	\N	\N	\N	\N
55346993-2aa2-493e-9f0e-4a0a1d2d5afd	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	b4f32f00-af34-4e60-ace0-f37843d5f2ab	pending	\N	\N	\N	\N	\N	\N
1c9d056d-2b36-4498-aac0-9f2a5c5ffe8e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	41b19327-d33c-45fa-bc37-b0346414a85b	pending	\N	\N	\N	\N	\N	\N
1c3308c3-2b6f-4b60-9c5e-68d1b776e360	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	a2f740a5-867d-40c4-9dee-9ef96886554c	pending	\N	\N	\N	\N	\N	\N
f1c0fcb6-0c0d-49e7-8736-98ce7f57b1f8	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	eebdc4eb-df2c-4064-9875-5d0267660480	pending	\N	\N	\N	\N	\N	\N
9a79a2f4-1a87-42ca-ae60-d43d3e1664e6	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	dff31d86-d6ab-4125-9e24-2205029a8379	pending	\N	\N	\N	\N	\N	\N
2913b29a-dc1c-489b-8e43-fa78468e0282	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	48e071b5-3332-4582-948b-bffc48d3ca9c	pending	\N	\N	\N	\N	\N	\N
b1c3a3d8-5295-4fec-aa6e-c397b6530e5b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	ce5811e7-b6bb-4a33-953a-194b7a294da3	pending	\N	\N	\N	\N	\N	\N
3373cdfb-470c-438a-9430-afb86b232a26	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	fb660454-871c-4436-ab39-6a61f64e044b	pending	\N	\N	\N	\N	\N	\N
9820f15e-4100-4a90-b432-c614346c6e1f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	9cbaea41-b097-468b-a55d-1b60d825ab04	pending	\N	\N	\N	\N	\N	\N
187a0608-1671-4da7-af8e-b3cd72dddeec	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	4be05588-7ad7-4cec-9f5d-112bcaecdd21	pending	\N	\N	\N	\N	\N	\N
c499b94d-47ad-4004-b3bc-5a774424c438	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	be2fd2b2-0039-4e17-b2b1-9f3e2fc33c6b	pending	\N	\N	\N	\N	\N	\N
20a79820-f4ff-450d-86d2-b89621780c02	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	f120e862-68f0-40eb-a84a-b6927ce51a90	pending	\N	\N	\N	\N	\N	\N
00681297-214e-43aa-9ef7-7632106a880b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	b5547bbf-ab34-4882-9846-fba230b69a7b	pending	\N	\N	\N	\N	\N	\N
91db1fae-e740-4519-9ef6-b4b32acd0171	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	707c6d78-6d9f-47dd-8186-917ec255ffb2	pending	\N	\N	\N	\N	\N	\N
12ffc25b-2577-4390-837a-e08dd383e44e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	64c1aa57-1dbf-4e8c-83cd-2325b8ba0e13	pending	\N	\N	\N	\N	\N	\N
468929bd-4fed-4c9a-870f-ff5f30a3c6fe	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	2c9d0db2-83b8-4340-bba1-12ad1acebcda	pending	\N	\N	\N	\N	\N	\N
c67f23fa-9f33-49e1-bf31-a14d1c312af3	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	ea8bd191-46fd-4e86-ae8d-b3f7354e6c2c	pending	\N	\N	\N	\N	\N	\N
327827ae-417c-41b0-9e07-6c98dca6ed59	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	a419c96c-bb0f-4973-9598-49e88ab2cfa0	pending	\N	\N	\N	\N	\N	\N
4488ba40-a4c3-4e22-8eba-8da29263649a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	5b76ebc3-05b5-4008-9e8a-8e91866c4536	pending	\N	\N	\N	\N	\N	\N
2a80c1a5-2d53-480a-81fd-5bf7e41b1118	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	4b42d2d7-df7a-425d-b753-5d83c3103d65	pending	\N	\N	\N	\N	\N	\N
48c667de-e4ca-4e33-be2c-7db9c25dbc26	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	96347f98-91c7-4fec-bc21-be300e60ba28	pending	\N	\N	\N	\N	\N	\N
dbb9c919-a597-434a-92fe-b06355f0997c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	60b0cf22-6574-4d36-b521-7b1725bca50f	pending	\N	\N	\N	\N	\N	\N
ace36c2b-9301-497f-921e-bd0dad5a6d39	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	a7f68e92-8192-4183-912b-8af85c4d13ee	pending	\N	\N	\N	\N	\N	\N
f888427d-1cee-4adf-be18-5bfa3f95e871	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	65718161-113b-4d95-9df4-f0405428a823	pending	\N	\N	\N	\N	\N	\N
407e9a6e-f7c9-4270-a3db-946b67ac0ea4	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	f291c7cd-cfea-47e1-a384-b4ecdef4f4da	pending	\N	\N	\N	\N	\N	\N
04f8e083-958f-4221-8e3b-922622263689	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	69de0c07-8930-42ab-93be-e6b07bd51131	96a66cc1-f80a-47ad-a643-0b946cffa02e	pending	\N	\N	\N	\N	\N	\N
9195d4f1-7708-41ee-bcaa-c9af5dfec91a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	54de01b5-6711-4e2f-b4e5-83b8a658c1ea	pending	\N	\N	\N	\N	\N	\N
e2cf07e5-bcaa-4811-9d83-f2f9017ddfd0	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	2bbf52cf-3942-43da-9e74-1ccab5d8f5b7	pending	\N	\N	\N	\N	\N	\N
9f2ad821-eda5-49fc-999d-5d779872e1cf	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	40fed8d4-2408-4e91-998d-04548cf33cf1	pending	\N	\N	\N	\N	\N	\N
ebacdb6f-4ec2-4bb7-9833-2881ef37ed68	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	df7f131c-ad24-413e-8640-dac8493be026	pending	\N	\N	\N	\N	\N	\N
4f368b9d-6c43-4aff-ac51-3a277efa51e5	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	609bab0d-72bd-4ee9-80fd-3f4d1db92bed	pending	\N	\N	\N	\N	\N	\N
9febbea5-9699-4986-b7e3-e78381813372	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	011aa579-858b-4fec-a3cb-bed8bdd9f82d	pending	\N	\N	\N	\N	\N	\N
1a07ef7d-0359-4ee9-98e2-877ae8537bad	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	8a2d8daa-1687-4d8d-b54d-7864bd8d7887	pending	\N	\N	\N	\N	\N	\N
21dd3c7c-d99b-428e-a9d4-50972ab6deca	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	a0498893-beb3-4500-adcc-f56270dab200	pending	\N	\N	\N	\N	\N	\N
bb2dbee4-e9ba-4070-8e04-5441d53bba3f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	8c16dfa4-433d-44fb-aa00-82b12b83febc	pending	\N	\N	\N	\N	\N	\N
439e52c7-20e6-4d02-8730-3a6718f723f4	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	c071fc1e-af9a-490b-bcdf-af80b46d511c	pending	\N	\N	\N	\N	\N	\N
5ba162cd-91de-47d5-9b1a-9e33a323d4e9	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	46c90232-8f81-49a5-84e3-5eada2ab01e3	pending	\N	\N	\N	\N	\N	\N
c2333954-d030-4796-b2e8-fd17285f2f9c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	812f8dcd-a92b-46dc-b9ec-18b272872999	pending	\N	\N	\N	\N	\N	\N
1e6be052-2583-47c4-82d9-a5f2849096b5	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	ec95e8fd-2203-46f6-b941-0e19cb62d92f	pending	\N	\N	\N	\N	\N	\N
fd80c128-c218-460d-882f-c7c6cb487d8e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	cf1ead87-bc0e-4710-8356-8791329f48d1	pending	\N	\N	\N	\N	\N	\N
3afb076b-0e68-4574-b07e-e79dbad6fd1c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	cdd2f7af-be6e-457a-a465-13900fd2449b	pending	\N	\N	\N	\N	\N	\N
f242295f-5633-43d0-9c90-c3b8017da806	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	e48c91a4-3b94-463c-8977-5e35344d1315	pending	\N	\N	\N	\N	\N	\N
004073a2-8623-4b31-84df-006d8bfbf53f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	81af9c2e-f599-47e5-8b27-b29b5cc577cd	pending	\N	\N	\N	\N	\N	\N
e0abef53-d18a-4732-be15-6a1300d4a89f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	72ed8bbc-c906-462b-91ae-5c8e602a9581	pending	\N	\N	\N	\N	\N	\N
5781e1a9-f470-4b7f-b399-0bf20c987279	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	f5fcaeab-8802-4e50-b73d-4a057431d3fd	pending	\N	\N	\N	\N	\N	\N
5810b47a-a859-4b89-8a54-c0707261187b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	7c2ee432-f7a2-468a-91a4-d6da3a69ee91	pending	\N	\N	\N	\N	\N	\N
897b62bd-8222-47ff-bac7-eb4d45ad5b17	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	56e7195e-9d95-41eb-b776-924d6ead8b45	pending	\N	\N	\N	\N	\N	\N
016ff33d-c35b-4e0f-8137-4b5e30fe8aa3	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	ec151a25-440b-4bb8-951a-60f8fa5c42aa	pending	\N	\N	\N	\N	\N	\N
c27ce7a1-a87c-4a3e-824a-e63e7b52a8b3	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	db552fa7-40d4-4f8b-ae35-535d9a38f422	pending	\N	\N	\N	\N	\N	\N
23755034-486a-47c8-86c7-2a84699c0d7c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	59703fc1-3792-4e00-ba45-d2612bdf9cd2	pending	\N	\N	\N	\N	\N	\N
2cae4858-6d46-4850-a398-eba0d6607a13	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	c768a363-a74b-4cd6-b7e2-04a1e7591121	pending	\N	\N	\N	\N	\N	\N
66d43776-6b12-463b-8079-a03ac1dcfec5	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	21f9f74b-d38a-49ea-9f0a-5ff062ad9a25	pending	\N	\N	\N	\N	\N	\N
b6d37c38-98e7-4140-9fb3-844221c134b9	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	4d2275e3-0590-4352-9bc4-42738e2fa3e3	pending	\N	\N	\N	\N	\N	\N
62c497f1-c07d-41f6-8688-b8d338fb61f7	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	8f0844ab-cade-4aa7-af50-acf8b8ac8392	pending	\N	\N	\N	\N	\N	\N
b4c89ef5-1263-4095-a183-0f2988394140	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	c8ab532b-2912-4ba1-bf23-5b6a9675e891	pending	\N	\N	\N	\N	\N	\N
0df184e3-cc17-4418-abe0-1ee9e789cd6a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	a6bb2a07-c44e-4fee-8b04-624ec4fbf63a	pending	\N	\N	\N	\N	\N	\N
c9cb9400-6b8e-4249-902b-41106965da4b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	e7d6645c-bf43-48b2-96d1-a4e2489a1e31	pending	\N	\N	\N	\N	\N	\N
e4a48e3a-ad31-44a3-90d5-cfafd9a6891f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	975a504a-b40b-44db-b4e9-6e93e0f50c5e	pending	\N	\N	\N	\N	\N	\N
7b6903fe-ca2f-4c81-a992-a68976d1b4db	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	9b1180f3-8170-40e9-a21d-f082cb480b1f	pending	\N	\N	\N	\N	\N	\N
78ced8ec-781d-428d-a2a9-47bf1d15b9b0	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	55563828-0f0b-4b0c-b95d-acbb8f83ae6f	pending	\N	\N	\N	\N	\N	\N
6e1a36a5-3123-4551-9f91-3f5cd68f16ed	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	3bfc5834-eaba-4c3d-b82e-f2a74eb30dca	pending	\N	\N	\N	\N	\N	\N
aba682a7-414a-4a72-bf71-9176f6b26ab7	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	335dc9f5-ee0d-4ea3-9d32-78b49c554073	pending	\N	\N	\N	\N	\N	\N
9b95df98-28fb-4045-a3bd-b0dbc0051cf3	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	90e72c62-d36e-4561-9c1e-765c7504eb73	pending	\N	\N	\N	\N	\N	\N
15c9f07e-abb2-4669-9514-6a2e0d1c1ba4	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	cce27dbe-160a-4844-b83a-cb5715812517	pending	\N	\N	\N	\N	\N	\N
acf1d6b9-ce52-4de5-a6c2-5912c1fbf5dd	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	257b0f05-b370-4607-8ce6-84aec9080d49	pending	\N	\N	\N	\N	\N	\N
4a23489f-9589-4b6f-b6d5-a1961bafc141	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	40cd9142-c1c4-4969-9fd0-ba27e1553ba2	pending	\N	\N	\N	\N	\N	\N
f9340e02-5fb8-4a79-a344-a157d97a071c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	2e1b030d-b55d-46df-a3be-404bb7a368cf	pending	\N	\N	\N	\N	\N	\N
41c466ff-eadc-4cfa-aa4f-94d66252d223	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	13b241b5-e959-48b8-b741-86d932fb1e7c	pending	\N	\N	\N	\N	\N	\N
a32a25a2-6a46-4ea4-8728-888db2bdb5fe	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	3f3a4628-3be8-4cef-8480-46d2fb99c9f9	pending	\N	\N	\N	\N	\N	\N
25963568-6862-4e63-b685-11429bdf9c52	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	b4f32f00-af34-4e60-ace0-f37843d5f2ab	pending	\N	\N	\N	\N	\N	\N
66c72cb2-1b68-43bd-b0eb-7665f4fe812f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	41b19327-d33c-45fa-bc37-b0346414a85b	pending	\N	\N	\N	\N	\N	\N
3349f035-88d5-4713-a504-7859a8f80bc4	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	a2f740a5-867d-40c4-9dee-9ef96886554c	pending	\N	\N	\N	\N	\N	\N
3c537885-9a7f-4fe5-875d-cbaf98465e90	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	eebdc4eb-df2c-4064-9875-5d0267660480	pending	\N	\N	\N	\N	\N	\N
a7969c63-4825-4e69-b9bd-7abe6accaa39	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	dff31d86-d6ab-4125-9e24-2205029a8379	pending	\N	\N	\N	\N	\N	\N
64fa35b1-9b36-4c22-b793-4e0b7afa1b20	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	48e071b5-3332-4582-948b-bffc48d3ca9c	pending	\N	\N	\N	\N	\N	\N
c68169d4-5ca2-4a08-8f1f-0599b7a8b70f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	ce5811e7-b6bb-4a33-953a-194b7a294da3	pending	\N	\N	\N	\N	\N	\N
ae6dc86b-5b88-4899-88e3-8e12fc97c798	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	fb660454-871c-4436-ab39-6a61f64e044b	pending	\N	\N	\N	\N	\N	\N
65b4bdb0-19f0-456c-93de-b23b47e0ad18	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	9cbaea41-b097-468b-a55d-1b60d825ab04	pending	\N	\N	\N	\N	\N	\N
546fca07-392a-49fa-8b94-09af996757c5	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	4be05588-7ad7-4cec-9f5d-112bcaecdd21	pending	\N	\N	\N	\N	\N	\N
ccf0019d-2133-48e6-b2e1-7ef65bc7b705	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	be2fd2b2-0039-4e17-b2b1-9f3e2fc33c6b	pending	\N	\N	\N	\N	\N	\N
a6e5875e-ec13-4c2b-87af-7583f1d6e666	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	f120e862-68f0-40eb-a84a-b6927ce51a90	pending	\N	\N	\N	\N	\N	\N
b9da2677-5a16-4ffe-bb9a-6e9e1e5ac965	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	b5547bbf-ab34-4882-9846-fba230b69a7b	pending	\N	\N	\N	\N	\N	\N
88b29239-d2d8-4bd2-9028-48d8dc7f8963	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	64c1aa57-1dbf-4e8c-83cd-2325b8ba0e13	pending	\N	\N	\N	\N	\N	\N
43a0a131-3bba-4ad3-ac9a-dd20d4cb6538	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	2c9d0db2-83b8-4340-bba1-12ad1acebcda	pending	\N	\N	\N	\N	\N	\N
763bb64e-bf82-4767-b0a0-1a687620f324	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	ea8bd191-46fd-4e86-ae8d-b3f7354e6c2c	pending	\N	\N	\N	\N	\N	\N
1451fdf2-d93d-4274-a04e-8c22ad61f8b8	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	a419c96c-bb0f-4973-9598-49e88ab2cfa0	pending	\N	\N	\N	\N	\N	\N
80bc45ee-c79c-405e-a781-4c07b0a0abd6	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	5b76ebc3-05b5-4008-9e8a-8e91866c4536	pending	\N	\N	\N	\N	\N	\N
c43075e7-4ed8-4569-bc47-577deab535ac	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	4b42d2d7-df7a-425d-b753-5d83c3103d65	pending	\N	\N	\N	\N	\N	\N
d02c9600-b596-4226-9ca8-59b3098525ae	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	96347f98-91c7-4fec-bc21-be300e60ba28	pending	\N	\N	\N	\N	\N	\N
e0ce9f1a-5455-4a97-be5d-e705b41b6613	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	60b0cf22-6574-4d36-b521-7b1725bca50f	pending	\N	\N	\N	\N	\N	\N
cef4e8a2-36b4-4cd7-bab0-9147b046fc68	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	a7f68e92-8192-4183-912b-8af85c4d13ee	pending	\N	\N	\N	\N	\N	\N
0d34f65f-4cef-41fb-9048-3e94752a3b6a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	65718161-113b-4d95-9df4-f0405428a823	pending	\N	\N	\N	\N	\N	\N
dce4e2de-2187-4082-b102-3e5fb7048279	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	f291c7cd-cfea-47e1-a384-b4ecdef4f4da	pending	\N	\N	\N	\N	\N	\N
b1281d36-d979-4a75-b6f6-f6fadf80f3d2	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	63171dcb-e633-49a5-b02e-639280fe490d	96a66cc1-f80a-47ad-a643-0b946cffa02e	pending	\N	\N	\N	\N	\N	\N
c24a1f22-54ba-4891-a880-c847c0b7c3a8	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	54de01b5-6711-4e2f-b4e5-83b8a658c1ea	pending	\N	\N	\N	\N	\N	\N
9866678e-1448-4a71-ac43-d54af1d05e98	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	2bbf52cf-3942-43da-9e74-1ccab5d8f5b7	pending	\N	\N	\N	\N	\N	\N
aaef871f-a61c-4709-871e-19b7629d04d0	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	40fed8d4-2408-4e91-998d-04548cf33cf1	pending	\N	\N	\N	\N	\N	\N
78f064ce-6776-48de-8a33-2ae5a4c4f20d	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	df7f131c-ad24-413e-8640-dac8493be026	pending	\N	\N	\N	\N	\N	\N
5e00fb78-e0ee-40f7-8794-9d8b032c16ba	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	609bab0d-72bd-4ee9-80fd-3f4d1db92bed	pending	\N	\N	\N	\N	\N	\N
039cb84b-571f-4481-8489-106a4909ed9c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	011aa579-858b-4fec-a3cb-bed8bdd9f82d	pending	\N	\N	\N	\N	\N	\N
b65d7f3e-25ba-4bbf-9b8e-5b12c178e12f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	8a2d8daa-1687-4d8d-b54d-7864bd8d7887	pending	\N	\N	\N	\N	\N	\N
81c58eba-bba0-4363-9ece-51377e1ed9e3	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	a0498893-beb3-4500-adcc-f56270dab200	pending	\N	\N	\N	\N	\N	\N
6bc8076e-ee36-45cd-adba-58c7cd80546f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	8c16dfa4-433d-44fb-aa00-82b12b83febc	pending	\N	\N	\N	\N	\N	\N
c4e10688-d853-4160-a1c1-689c819f4450	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	c071fc1e-af9a-490b-bcdf-af80b46d511c	pending	\N	\N	\N	\N	\N	\N
0202c23c-dd6d-4f61-aab3-57f83fe477fc	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	46c90232-8f81-49a5-84e3-5eada2ab01e3	pending	\N	\N	\N	\N	\N	\N
402f4675-fc96-4eb8-af10-31fe4703e1fe	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	812f8dcd-a92b-46dc-b9ec-18b272872999	pending	\N	\N	\N	\N	\N	\N
ffd8ff41-9885-4946-8ba5-95770a5c71a6	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	ec95e8fd-2203-46f6-b941-0e19cb62d92f	pending	\N	\N	\N	\N	\N	\N
f5981c62-a552-48ed-a5b8-49f210d27475	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	cf1ead87-bc0e-4710-8356-8791329f48d1	pending	\N	\N	\N	\N	\N	\N
cdb71f6b-a885-4604-b864-f9cdebbb454f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	cdd2f7af-be6e-457a-a465-13900fd2449b	pending	\N	\N	\N	\N	\N	\N
2f5f0716-527c-4e8b-8de8-2bca479e485b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	e48c91a4-3b94-463c-8977-5e35344d1315	pending	\N	\N	\N	\N	\N	\N
ed2d025f-f535-4fe2-9d32-e69b871c4955	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	81af9c2e-f599-47e5-8b27-b29b5cc577cd	pending	\N	\N	\N	\N	\N	\N
f8e80f22-4d90-4d4f-b914-eb3e8f757107	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	72ed8bbc-c906-462b-91ae-5c8e602a9581	pending	\N	\N	\N	\N	\N	\N
35da6b66-ed7c-477b-bd97-f670fb524b09	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	f5fcaeab-8802-4e50-b73d-4a057431d3fd	pending	\N	\N	\N	\N	\N	\N
227a14ce-6152-4337-adca-dbe54cbca1dd	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	7c2ee432-f7a2-468a-91a4-d6da3a69ee91	pending	\N	\N	\N	\N	\N	\N
88c3081e-09be-42c5-ab34-e7b2ea2e5d6b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	56e7195e-9d95-41eb-b776-924d6ead8b45	pending	\N	\N	\N	\N	\N	\N
4fe33d13-555b-495a-a415-9604c2349bfc	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	ec151a25-440b-4bb8-951a-60f8fa5c42aa	pending	\N	\N	\N	\N	\N	\N
6468a93a-29bf-475f-bf28-7349e9a98e77	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	db552fa7-40d4-4f8b-ae35-535d9a38f422	pending	\N	\N	\N	\N	\N	\N
04b292af-8632-48f9-af32-78da0e8e2448	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	59703fc1-3792-4e00-ba45-d2612bdf9cd2	pending	\N	\N	\N	\N	\N	\N
2ab73725-880b-47eb-93a9-4795960953ed	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	c768a363-a74b-4cd6-b7e2-04a1e7591121	pending	\N	\N	\N	\N	\N	\N
709ce9e7-1197-4d37-ba2d-0db181ede57b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	21f9f74b-d38a-49ea-9f0a-5ff062ad9a25	pending	\N	\N	\N	\N	\N	\N
25444c61-d865-4d91-8e37-0c9d191ff1f1	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	4d2275e3-0590-4352-9bc4-42738e2fa3e3	pending	\N	\N	\N	\N	\N	\N
a09e0ad2-19a1-463b-8d8b-3152b19df46f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	8f0844ab-cade-4aa7-af50-acf8b8ac8392	pending	\N	\N	\N	\N	\N	\N
c65e173c-a1f0-44c1-8c41-35e049e03544	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	c8ab532b-2912-4ba1-bf23-5b6a9675e891	pending	\N	\N	\N	\N	\N	\N
865a2936-9cd9-4d35-b723-435d0a1f8252	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	a6bb2a07-c44e-4fee-8b04-624ec4fbf63a	pending	\N	\N	\N	\N	\N	\N
cc00472b-8003-4eea-858b-aafcdbdceeb8	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	e7d6645c-bf43-48b2-96d1-a4e2489a1e31	pending	\N	\N	\N	\N	\N	\N
8d681a92-a6da-4bc6-92f3-ab527ed1117d	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	975a504a-b40b-44db-b4e9-6e93e0f50c5e	pending	\N	\N	\N	\N	\N	\N
1e987267-d6de-4695-b972-b0a76d7effab	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	9b1180f3-8170-40e9-a21d-f082cb480b1f	pending	\N	\N	\N	\N	\N	\N
26f0e2bf-61c9-49eb-b93f-d8e689be3ceb	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	55563828-0f0b-4b0c-b95d-acbb8f83ae6f	pending	\N	\N	\N	\N	\N	\N
77664432-85ed-46b2-8c8e-104cb7ed1efc	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	3bfc5834-eaba-4c3d-b82e-f2a74eb30dca	pending	\N	\N	\N	\N	\N	\N
18243055-c7a3-430c-86eb-01b3ceb10c4c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	335dc9f5-ee0d-4ea3-9d32-78b49c554073	pending	\N	\N	\N	\N	\N	\N
3ffc9127-a985-4f1c-b456-03e049dce2cb	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	90e72c62-d36e-4561-9c1e-765c7504eb73	pending	\N	\N	\N	\N	\N	\N
62a078eb-3e40-46ed-852b-f31467b608fd	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	cce27dbe-160a-4844-b83a-cb5715812517	pending	\N	\N	\N	\N	\N	\N
42791a74-7a97-4559-a5dc-3af7fa094c49	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	257b0f05-b370-4607-8ce6-84aec9080d49	pending	\N	\N	\N	\N	\N	\N
4c757d6f-4c52-4671-be80-2bee7e410747	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	40cd9142-c1c4-4969-9fd0-ba27e1553ba2	pending	\N	\N	\N	\N	\N	\N
9fa74968-c3b3-4410-8fb4-06f2b7f86994	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	2e1b030d-b55d-46df-a3be-404bb7a368cf	pending	\N	\N	\N	\N	\N	\N
036e1ae2-d211-469d-bdee-26031f909cfa	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	13b241b5-e959-48b8-b741-86d932fb1e7c	pending	\N	\N	\N	\N	\N	\N
1bb55721-3bb5-4646-8223-4f7a8a0cf282	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	3f3a4628-3be8-4cef-8480-46d2fb99c9f9	pending	\N	\N	\N	\N	\N	\N
a722a6a7-ae85-4e82-97df-802f4d55a8ff	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	b4f32f00-af34-4e60-ace0-f37843d5f2ab	pending	\N	\N	\N	\N	\N	\N
b37c34dc-83a5-4b2e-be6b-5f3048cec430	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	41b19327-d33c-45fa-bc37-b0346414a85b	pending	\N	\N	\N	\N	\N	\N
63931b14-f900-4fda-bc68-05a0d115d80b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	a2f740a5-867d-40c4-9dee-9ef96886554c	pending	\N	\N	\N	\N	\N	\N
5bcd1f4e-5d1d-4d90-8b2e-a910d427351c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	eebdc4eb-df2c-4064-9875-5d0267660480	pending	\N	\N	\N	\N	\N	\N
f51274f5-becf-4663-a933-e2c47967c8d0	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	dff31d86-d6ab-4125-9e24-2205029a8379	pending	\N	\N	\N	\N	\N	\N
30236812-8e42-450d-a11d-3c59a4a4ea7f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	48e071b5-3332-4582-948b-bffc48d3ca9c	pending	\N	\N	\N	\N	\N	\N
5f9183bb-e378-459f-9db2-ee3a8bdf2f28	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	ce5811e7-b6bb-4a33-953a-194b7a294da3	pending	\N	\N	\N	\N	\N	\N
102ef92c-5a12-40b7-9ba8-aef50fddbc33	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	fb660454-871c-4436-ab39-6a61f64e044b	pending	\N	\N	\N	\N	\N	\N
0ce6aa95-2104-4ea0-af85-510edb09d117	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	9cbaea41-b097-468b-a55d-1b60d825ab04	pending	\N	\N	\N	\N	\N	\N
f906703f-7f1a-4c3f-a6a5-0f7f889718b9	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	4be05588-7ad7-4cec-9f5d-112bcaecdd21	pending	\N	\N	\N	\N	\N	\N
30a18b5f-bd1c-49c8-9211-3dd5199d2c07	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	be2fd2b2-0039-4e17-b2b1-9f3e2fc33c6b	pending	\N	\N	\N	\N	\N	\N
5c6a7b77-e6de-46aa-9751-a1b43f525e36	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	f120e862-68f0-40eb-a84a-b6927ce51a90	pending	\N	\N	\N	\N	\N	\N
3b8c8bd6-dd9a-4ce5-bf9e-975a8ddbbe29	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	b5547bbf-ab34-4882-9846-fba230b69a7b	pending	\N	\N	\N	\N	\N	\N
dce4bc7e-9f03-408b-b9ee-78b522564f53	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	64c1aa57-1dbf-4e8c-83cd-2325b8ba0e13	pending	\N	\N	\N	\N	\N	\N
6523b9e8-4d2c-434c-94dc-ab9a9199d032	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	2c9d0db2-83b8-4340-bba1-12ad1acebcda	pending	\N	\N	\N	\N	\N	\N
027f7f23-da6e-44b0-8781-8186f5685266	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	ea8bd191-46fd-4e86-ae8d-b3f7354e6c2c	pending	\N	\N	\N	\N	\N	\N
808de6b7-e9b7-4e58-894f-157e5ca3d400	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	a419c96c-bb0f-4973-9598-49e88ab2cfa0	pending	\N	\N	\N	\N	\N	\N
c5e1fa84-1c89-454a-8f01-e5482cf99612	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	5b76ebc3-05b5-4008-9e8a-8e91866c4536	pending	\N	\N	\N	\N	\N	\N
ccf73155-9045-41e3-beec-834e2017d988	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	4b42d2d7-df7a-425d-b753-5d83c3103d65	pending	\N	\N	\N	\N	\N	\N
b38eed86-9cea-4c4b-8cde-8ce57259892a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	96347f98-91c7-4fec-bc21-be300e60ba28	pending	\N	\N	\N	\N	\N	\N
641d4b0c-2f27-445a-9237-8872e5d7bac8	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	60b0cf22-6574-4d36-b521-7b1725bca50f	pending	\N	\N	\N	\N	\N	\N
d9ea8e62-c4d0-4b34-a098-fa3dc408b0d0	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	a7f68e92-8192-4183-912b-8af85c4d13ee	pending	\N	\N	\N	\N	\N	\N
1e9bb370-3fff-438f-829c-d90557c03e62	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	65718161-113b-4d95-9df4-f0405428a823	pending	\N	\N	\N	\N	\N	\N
fec75068-fb6d-4dc6-9622-45d497649bd6	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	f291c7cd-cfea-47e1-a384-b4ecdef4f4da	pending	\N	\N	\N	\N	\N	\N
22e08d04-544a-4823-9dcf-8eed495f5206	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	c3361316-4327-48ca-b590-3cc7cdd47cc8	96a66cc1-f80a-47ad-a643-0b946cffa02e	pending	\N	\N	\N	\N	\N	\N
e0fc337b-f5af-40d0-bc55-8f81f58e632d	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	54de01b5-6711-4e2f-b4e5-83b8a658c1ea	pending	\N	\N	\N	\N	\N	\N
5201a7c7-200a-4aa7-9f1d-e9dafeca870e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	2bbf52cf-3942-43da-9e74-1ccab5d8f5b7	pending	\N	\N	\N	\N	\N	\N
bb2778e1-f213-4dfc-96bc-667947da3092	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	40fed8d4-2408-4e91-998d-04548cf33cf1	pending	\N	\N	\N	\N	\N	\N
4254b201-d073-45e4-96b4-94e96232266e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	df7f131c-ad24-413e-8640-dac8493be026	pending	\N	\N	\N	\N	\N	\N
f7fe47fa-8781-4407-999d-a7404243495e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	609bab0d-72bd-4ee9-80fd-3f4d1db92bed	pending	\N	\N	\N	\N	\N	\N
ae98aeab-f1bc-4095-8ae4-97c9b666eaf7	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	011aa579-858b-4fec-a3cb-bed8bdd9f82d	pending	\N	\N	\N	\N	\N	\N
3c73e354-4e16-4104-9755-72792e313bf9	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	8a2d8daa-1687-4d8d-b54d-7864bd8d7887	pending	\N	\N	\N	\N	\N	\N
4c83b11d-1e0d-48c8-b449-ff908af794d5	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	a0498893-beb3-4500-adcc-f56270dab200	pending	\N	\N	\N	\N	\N	\N
a20a34cc-7e0d-45cd-ad17-a6db2741aba6	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	8c16dfa4-433d-44fb-aa00-82b12b83febc	pending	\N	\N	\N	\N	\N	\N
3d455954-5fdd-4792-981a-6cb9c13b8fd0	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	c071fc1e-af9a-490b-bcdf-af80b46d511c	pending	\N	\N	\N	\N	\N	\N
e16a8ff9-8083-49e0-ad83-a08f2794ea1e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	46c90232-8f81-49a5-84e3-5eada2ab01e3	pending	\N	\N	\N	\N	\N	\N
f5af2606-ffa0-4a04-a0ff-6127fc0306dc	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	812f8dcd-a92b-46dc-b9ec-18b272872999	pending	\N	\N	\N	\N	\N	\N
f5bc7154-8f87-440a-b596-05888eb1285d	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	ec95e8fd-2203-46f6-b941-0e19cb62d92f	pending	\N	\N	\N	\N	\N	\N
dd27dc6e-b0b5-4770-a33a-4d9e0b85e0e1	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	cf1ead87-bc0e-4710-8356-8791329f48d1	pending	\N	\N	\N	\N	\N	\N
0e9260e0-b7be-4ca8-a48b-d2c8de11b261	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	cdd2f7af-be6e-457a-a465-13900fd2449b	pending	\N	\N	\N	\N	\N	\N
6d54b000-0d25-4be9-bd85-7089be77935a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	e48c91a4-3b94-463c-8977-5e35344d1315	pending	\N	\N	\N	\N	\N	\N
da0d9d87-6c7a-427c-93be-7998399e26a7	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	81af9c2e-f599-47e5-8b27-b29b5cc577cd	pending	\N	\N	\N	\N	\N	\N
b78f93ae-6118-4459-b662-f669b3aa39ca	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	72ed8bbc-c906-462b-91ae-5c8e602a9581	pending	\N	\N	\N	\N	\N	\N
3e3681ac-2a01-4dab-92be-a6bb340b1102	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	f5fcaeab-8802-4e50-b73d-4a057431d3fd	pending	\N	\N	\N	\N	\N	\N
e0b3c105-46c0-434f-b4ab-7594d21526dc	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	7c2ee432-f7a2-468a-91a4-d6da3a69ee91	pending	\N	\N	\N	\N	\N	\N
e956cb7e-d9b2-4104-a5f5-783aaf6db7c1	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	56e7195e-9d95-41eb-b776-924d6ead8b45	pending	\N	\N	\N	\N	\N	\N
8865a8bf-fa37-4743-a880-97265a280cc1	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	ec151a25-440b-4bb8-951a-60f8fa5c42aa	pending	\N	\N	\N	\N	\N	\N
ad84c3f9-0795-4783-8810-3b72cfdd704b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	db552fa7-40d4-4f8b-ae35-535d9a38f422	pending	\N	\N	\N	\N	\N	\N
5e54ffe4-9c4d-485d-81b6-1dccf99c7eaf	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	59703fc1-3792-4e00-ba45-d2612bdf9cd2	pending	\N	\N	\N	\N	\N	\N
e11cfe49-36d8-4fde-bced-efab3214e828	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	c768a363-a74b-4cd6-b7e2-04a1e7591121	pending	\N	\N	\N	\N	\N	\N
91a5bec1-f5a1-4226-b678-93e3ae6b8a7e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	21f9f74b-d38a-49ea-9f0a-5ff062ad9a25	pending	\N	\N	\N	\N	\N	\N
f53b2bc8-631e-4145-a3be-e8f7bc0c8dc3	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	4d2275e3-0590-4352-9bc4-42738e2fa3e3	pending	\N	\N	\N	\N	\N	\N
c98ad9f5-5d9f-4208-aaa8-0a5a50e15d07	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	8f0844ab-cade-4aa7-af50-acf8b8ac8392	pending	\N	\N	\N	\N	\N	\N
ce70a238-a447-4396-a4f0-b9e037134e8f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	c8ab532b-2912-4ba1-bf23-5b6a9675e891	pending	\N	\N	\N	\N	\N	\N
a9c2aa39-4d4a-4c41-9f13-7ebaf47797b4	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	a6bb2a07-c44e-4fee-8b04-624ec4fbf63a	pending	\N	\N	\N	\N	\N	\N
2aca2cdc-bf88-407d-bb6e-e2363dfb0e62	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	e7d6645c-bf43-48b2-96d1-a4e2489a1e31	pending	\N	\N	\N	\N	\N	\N
069a4ca8-3213-4d1f-b3b7-5d9343ad1eea	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	975a504a-b40b-44db-b4e9-6e93e0f50c5e	pending	\N	\N	\N	\N	\N	\N
f87aebb4-0151-497c-8f87-1aacddaf5f5c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	9b1180f3-8170-40e9-a21d-f082cb480b1f	pending	\N	\N	\N	\N	\N	\N
456a7b8d-54f9-4727-bf4e-c62c59ceb2f3	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	55563828-0f0b-4b0c-b95d-acbb8f83ae6f	pending	\N	\N	\N	\N	\N	\N
d7a93092-9e80-46ea-9f7d-c6db356a47bb	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	3bfc5834-eaba-4c3d-b82e-f2a74eb30dca	pending	\N	\N	\N	\N	\N	\N
30abd570-8b15-47c0-bddb-7154161b06c5	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	335dc9f5-ee0d-4ea3-9d32-78b49c554073	pending	\N	\N	\N	\N	\N	\N
0a03eacf-3589-4d25-9009-dcac8046f9cf	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	90e72c62-d36e-4561-9c1e-765c7504eb73	pending	\N	\N	\N	\N	\N	\N
2aee1dcb-0702-4d98-bb0a-defbd7b46ef8	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	cce27dbe-160a-4844-b83a-cb5715812517	pending	\N	\N	\N	\N	\N	\N
877d2ee9-d413-404f-b150-b7bf4b26b804	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	257b0f05-b370-4607-8ce6-84aec9080d49	pending	\N	\N	\N	\N	\N	\N
b88e0cf0-eadc-4610-a7cc-b0e4c133a079	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	40cd9142-c1c4-4969-9fd0-ba27e1553ba2	pending	\N	\N	\N	\N	\N	\N
21ed4af1-be98-4b54-8ec2-2e9adbb3c52c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	2e1b030d-b55d-46df-a3be-404bb7a368cf	pending	\N	\N	\N	\N	\N	\N
3d8344fc-3ab2-4cb5-812d-6801235f34f8	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	13b241b5-e959-48b8-b741-86d932fb1e7c	pending	\N	\N	\N	\N	\N	\N
f41c6180-1450-408f-8102-72742fae3d4d	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	3f3a4628-3be8-4cef-8480-46d2fb99c9f9	pending	\N	\N	\N	\N	\N	\N
267153ec-f5ca-425f-82a8-8ae4d471b9a1	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	b4f32f00-af34-4e60-ace0-f37843d5f2ab	pending	\N	\N	\N	\N	\N	\N
23190482-39ed-45a3-ae2f-7f668aa19273	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	41b19327-d33c-45fa-bc37-b0346414a85b	pending	\N	\N	\N	\N	\N	\N
c6ad5e6d-e35b-41f4-a51c-5316de76e67e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	a2f740a5-867d-40c4-9dee-9ef96886554c	pending	\N	\N	\N	\N	\N	\N
85ba5183-3b8c-44e5-b81c-c5878d7b0225	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	eebdc4eb-df2c-4064-9875-5d0267660480	pending	\N	\N	\N	\N	\N	\N
b1c28663-3432-41d7-92a7-725bae1e1bdc	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	dff31d86-d6ab-4125-9e24-2205029a8379	pending	\N	\N	\N	\N	\N	\N
60f8cb2d-e94a-4fe3-aaf1-ae8da0a1f214	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	48e071b5-3332-4582-948b-bffc48d3ca9c	pending	\N	\N	\N	\N	\N	\N
af6d0a63-855b-423b-98f8-69f8a3fd969b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	ce5811e7-b6bb-4a33-953a-194b7a294da3	pending	\N	\N	\N	\N	\N	\N
76abfbdb-702b-4481-b501-f81ffbc47f4e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	fb660454-871c-4436-ab39-6a61f64e044b	pending	\N	\N	\N	\N	\N	\N
0d9bec1c-fe04-4cb5-833e-b4751660ec93	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	9cbaea41-b097-468b-a55d-1b60d825ab04	pending	\N	\N	\N	\N	\N	\N
a1b28a9d-22fe-48db-9a52-000b1e9a123a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	4be05588-7ad7-4cec-9f5d-112bcaecdd21	pending	\N	\N	\N	\N	\N	\N
419168fc-3013-46a2-adce-2a2b8a212003	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	be2fd2b2-0039-4e17-b2b1-9f3e2fc33c6b	pending	\N	\N	\N	\N	\N	\N
5ad5d652-55b4-4859-84ae-3e66ffa3e418	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	f120e862-68f0-40eb-a84a-b6927ce51a90	pending	\N	\N	\N	\N	\N	\N
c868293c-12ce-4f14-abba-0deb7d2746c0	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	b5547bbf-ab34-4882-9846-fba230b69a7b	pending	\N	\N	\N	\N	\N	\N
4d4e08c7-3340-44da-9000-747dd4e2ae10	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	64c1aa57-1dbf-4e8c-83cd-2325b8ba0e13	pending	\N	\N	\N	\N	\N	\N
c4f13c0c-c3ed-46a0-b1ed-b1fd285170ee	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	2c9d0db2-83b8-4340-bba1-12ad1acebcda	pending	\N	\N	\N	\N	\N	\N
69e55665-39ec-4dd4-b6cd-667b8affb56c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	ea8bd191-46fd-4e86-ae8d-b3f7354e6c2c	pending	\N	\N	\N	\N	\N	\N
869bb7f2-ca90-458e-9f88-83248df9eba4	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	a419c96c-bb0f-4973-9598-49e88ab2cfa0	pending	\N	\N	\N	\N	\N	\N
fed92df7-a307-4438-b4f5-3dd418e183c7	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	5b76ebc3-05b5-4008-9e8a-8e91866c4536	pending	\N	\N	\N	\N	\N	\N
1a2acbb5-92ea-4724-8ac8-6c413263499a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	4b42d2d7-df7a-425d-b753-5d83c3103d65	pending	\N	\N	\N	\N	\N	\N
a17ce77f-450a-4afd-a710-76719296789f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	96347f98-91c7-4fec-bc21-be300e60ba28	pending	\N	\N	\N	\N	\N	\N
d7a303b4-b814-4bf6-adc0-ab1689ebe2db	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	60b0cf22-6574-4d36-b521-7b1725bca50f	pending	\N	\N	\N	\N	\N	\N
dd1c16d4-d380-49b2-832b-b8b68e8a3c1b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	a7f68e92-8192-4183-912b-8af85c4d13ee	pending	\N	\N	\N	\N	\N	\N
144686d1-92c3-4aaa-8756-c6f035bc6104	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	65718161-113b-4d95-9df4-f0405428a823	pending	\N	\N	\N	\N	\N	\N
51d430f9-5fbd-4482-9a97-aa5b1d8deac3	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	f291c7cd-cfea-47e1-a384-b4ecdef4f4da	pending	\N	\N	\N	\N	\N	\N
56d19883-4ffd-42f9-a175-f52dbe0a9cba	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	2c483c84-1085-449f-90d3-680062e0c07a	96a66cc1-f80a-47ad-a643-0b946cffa02e	pending	\N	\N	\N	\N	\N	\N
d64c16d1-4a68-4b7f-8d7e-70dcfd905f9c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	54de01b5-6711-4e2f-b4e5-83b8a658c1ea	pending	\N	\N	\N	\N	\N	\N
e06791a5-519f-4f29-aa01-ffd7e4f67ff6	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	2bbf52cf-3942-43da-9e74-1ccab5d8f5b7	pending	\N	\N	\N	\N	\N	\N
399aff38-2832-4c88-b8af-cc0a25c06f8b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	40fed8d4-2408-4e91-998d-04548cf33cf1	pending	\N	\N	\N	\N	\N	\N
a3d75645-324d-4a28-8f86-70462f1aba0e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	df7f131c-ad24-413e-8640-dac8493be026	pending	\N	\N	\N	\N	\N	\N
a4af500c-0429-4ec0-b87b-4b077ba5ca5a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	609bab0d-72bd-4ee9-80fd-3f4d1db92bed	pending	\N	\N	\N	\N	\N	\N
22b658e0-4b0a-4ba5-a010-66f5463c9bde	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	011aa579-858b-4fec-a3cb-bed8bdd9f82d	pending	\N	\N	\N	\N	\N	\N
6b67c406-571a-43a3-8473-0b5544d1bcbb	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	8a2d8daa-1687-4d8d-b54d-7864bd8d7887	pending	\N	\N	\N	\N	\N	\N
239fbef6-8bab-4b54-82a0-3f0fdb7d179d	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	a0498893-beb3-4500-adcc-f56270dab200	pending	\N	\N	\N	\N	\N	\N
92b62633-f969-4c12-b625-8ddccbceab17	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	8c16dfa4-433d-44fb-aa00-82b12b83febc	pending	\N	\N	\N	\N	\N	\N
a10a387b-27ee-4e1d-be6d-25435174d6c5	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	c071fc1e-af9a-490b-bcdf-af80b46d511c	pending	\N	\N	\N	\N	\N	\N
f331157e-a25a-4e0a-ba0d-a4bbc60aaea5	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	46c90232-8f81-49a5-84e3-5eada2ab01e3	pending	\N	\N	\N	\N	\N	\N
701a23e2-55e0-4727-8cfc-2438b1db0de6	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	812f8dcd-a92b-46dc-b9ec-18b272872999	pending	\N	\N	\N	\N	\N	\N
ae2f79fa-8f07-4d2d-ad2c-47043df026ab	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	ec95e8fd-2203-46f6-b941-0e19cb62d92f	pending	\N	\N	\N	\N	\N	\N
eaa5053d-d757-4db4-aa96-f45a16ee6948	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	cf1ead87-bc0e-4710-8356-8791329f48d1	pending	\N	\N	\N	\N	\N	\N
622a29e8-9ef1-4f56-a969-341d97830d20	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	cdd2f7af-be6e-457a-a465-13900fd2449b	pending	\N	\N	\N	\N	\N	\N
d2170139-37bb-4eef-b3bc-837905be9e68	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	e48c91a4-3b94-463c-8977-5e35344d1315	pending	\N	\N	\N	\N	\N	\N
d433430a-75ec-412d-a395-ced0bec445bd	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	81af9c2e-f599-47e5-8b27-b29b5cc577cd	pending	\N	\N	\N	\N	\N	\N
83852852-312a-4d67-88ee-a1f48250c566	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	72ed8bbc-c906-462b-91ae-5c8e602a9581	pending	\N	\N	\N	\N	\N	\N
25fdae80-82cb-4490-8256-551dbbaca802	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	f5fcaeab-8802-4e50-b73d-4a057431d3fd	pending	\N	\N	\N	\N	\N	\N
6a10a2f4-4dcd-4233-9127-2bc3e33fdb98	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	7c2ee432-f7a2-468a-91a4-d6da3a69ee91	pending	\N	\N	\N	\N	\N	\N
efc5a3f7-2862-43d6-984c-e76d337d45f6	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	56e7195e-9d95-41eb-b776-924d6ead8b45	pending	\N	\N	\N	\N	\N	\N
ffd7f158-5188-4fea-a6ce-7210923f6adc	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	ec151a25-440b-4bb8-951a-60f8fa5c42aa	pending	\N	\N	\N	\N	\N	\N
e5b73ae4-ccae-4dd4-9c1d-67d8cee59559	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	db552fa7-40d4-4f8b-ae35-535d9a38f422	pending	\N	\N	\N	\N	\N	\N
4202ed12-7b51-4c38-8403-52ba5c028625	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	59703fc1-3792-4e00-ba45-d2612bdf9cd2	pending	\N	\N	\N	\N	\N	\N
d18282f6-1e84-473c-a266-8cbd7486b354	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	c768a363-a74b-4cd6-b7e2-04a1e7591121	pending	\N	\N	\N	\N	\N	\N
03b2ef09-8a7f-4457-8e85-e0a386eed216	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	21f9f74b-d38a-49ea-9f0a-5ff062ad9a25	pending	\N	\N	\N	\N	\N	\N
3fb170a9-c247-4e3d-bc24-ea403b8b6c78	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	4d2275e3-0590-4352-9bc4-42738e2fa3e3	pending	\N	\N	\N	\N	\N	\N
bed26a4c-794d-4856-b598-563060c29377	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	8f0844ab-cade-4aa7-af50-acf8b8ac8392	pending	\N	\N	\N	\N	\N	\N
315a0248-9870-4b21-946b-03beba84aa4d	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	c8ab532b-2912-4ba1-bf23-5b6a9675e891	pending	\N	\N	\N	\N	\N	\N
9c80b08e-9dc2-4212-a2c7-cea51af5e824	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	a6bb2a07-c44e-4fee-8b04-624ec4fbf63a	pending	\N	\N	\N	\N	\N	\N
666ff637-b4fd-403b-8d65-459d8135b7bc	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	e7d6645c-bf43-48b2-96d1-a4e2489a1e31	pending	\N	\N	\N	\N	\N	\N
353fd49a-e9f3-4f28-9b83-d27e0525c852	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	975a504a-b40b-44db-b4e9-6e93e0f50c5e	pending	\N	\N	\N	\N	\N	\N
460a5c3b-600c-474d-bcca-52d22de9dcdf	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	9b1180f3-8170-40e9-a21d-f082cb480b1f	pending	\N	\N	\N	\N	\N	\N
4b4a7a71-3eb3-4561-8e4b-3451a21bfc20	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	55563828-0f0b-4b0c-b95d-acbb8f83ae6f	pending	\N	\N	\N	\N	\N	\N
23815d53-f1ff-46cb-bf5a-bd530ef481b1	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	3bfc5834-eaba-4c3d-b82e-f2a74eb30dca	pending	\N	\N	\N	\N	\N	\N
7923d48a-f7a8-4148-9f90-532891324786	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	335dc9f5-ee0d-4ea3-9d32-78b49c554073	pending	\N	\N	\N	\N	\N	\N
2e5a8880-acdd-41f0-ae18-04d2ef58c140	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	90e72c62-d36e-4561-9c1e-765c7504eb73	pending	\N	\N	\N	\N	\N	\N
6dde08a3-bbbe-4964-bb82-4fa409486fb5	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	cce27dbe-160a-4844-b83a-cb5715812517	pending	\N	\N	\N	\N	\N	\N
1fe85965-fce7-438b-89ce-d0ceaddbde17	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	257b0f05-b370-4607-8ce6-84aec9080d49	pending	\N	\N	\N	\N	\N	\N
4a72160b-56d0-49b2-9d96-271c29b9ecf1	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	40cd9142-c1c4-4969-9fd0-ba27e1553ba2	pending	\N	\N	\N	\N	\N	\N
6e948574-9e3d-4c46-8aa4-84527e86b9b6	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	2e1b030d-b55d-46df-a3be-404bb7a368cf	pending	\N	\N	\N	\N	\N	\N
57595137-a69f-49fa-a573-34f777e315d0	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	13b241b5-e959-48b8-b741-86d932fb1e7c	pending	\N	\N	\N	\N	\N	\N
dbbb8fe0-499e-439e-8af8-b349dc79fa68	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	3f3a4628-3be8-4cef-8480-46d2fb99c9f9	pending	\N	\N	\N	\N	\N	\N
6fe75ddb-46a1-45ae-a160-61b9007fed03	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	b4f32f00-af34-4e60-ace0-f37843d5f2ab	pending	\N	\N	\N	\N	\N	\N
7cdaddd2-a17c-45bb-9568-23e05819f6e6	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	41b19327-d33c-45fa-bc37-b0346414a85b	pending	\N	\N	\N	\N	\N	\N
ae53073f-552c-4157-9fee-aea3890a1489	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	a2f740a5-867d-40c4-9dee-9ef96886554c	pending	\N	\N	\N	\N	\N	\N
a8933d49-f7f5-4693-afbb-eba04bfaa42f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	eebdc4eb-df2c-4064-9875-5d0267660480	pending	\N	\N	\N	\N	\N	\N
0c98f51b-67d6-444b-9718-9bfd7e6cf76f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	dff31d86-d6ab-4125-9e24-2205029a8379	pending	\N	\N	\N	\N	\N	\N
3fd4d2d0-b5e4-4e31-a807-c28933541627	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	48e071b5-3332-4582-948b-bffc48d3ca9c	pending	\N	\N	\N	\N	\N	\N
bda738bf-de2d-4a8e-a4f6-88345a44d1da	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	ce5811e7-b6bb-4a33-953a-194b7a294da3	pending	\N	\N	\N	\N	\N	\N
99778b94-d760-46f9-87fe-d84b9c9c7fd5	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	fb660454-871c-4436-ab39-6a61f64e044b	pending	\N	\N	\N	\N	\N	\N
8f3c2428-5c47-46b1-9263-5e65174b9b4a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	9cbaea41-b097-468b-a55d-1b60d825ab04	pending	\N	\N	\N	\N	\N	\N
2908b0b5-1d44-497e-a56d-8c196ebf44a5	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	4be05588-7ad7-4cec-9f5d-112bcaecdd21	pending	\N	\N	\N	\N	\N	\N
77e2ab9b-75ed-4857-8f7a-dd7992ed3050	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	be2fd2b2-0039-4e17-b2b1-9f3e2fc33c6b	pending	\N	\N	\N	\N	\N	\N
9c03519d-b0bf-4895-9370-6e11467b8f6a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	f120e862-68f0-40eb-a84a-b6927ce51a90	pending	\N	\N	\N	\N	\N	\N
3662624f-8e36-47a1-a4e2-07608d61d2de	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	b5547bbf-ab34-4882-9846-fba230b69a7b	pending	\N	\N	\N	\N	\N	\N
e803e729-ebb3-4cd6-87c7-61ceaa40b69d	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	64c1aa57-1dbf-4e8c-83cd-2325b8ba0e13	pending	\N	\N	\N	\N	\N	\N
3fd677d5-f030-4044-863b-8801028aeb1a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	2c9d0db2-83b8-4340-bba1-12ad1acebcda	pending	\N	\N	\N	\N	\N	\N
2515e1fa-d604-4bc1-a5e7-4a414c15fc78	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	ea8bd191-46fd-4e86-ae8d-b3f7354e6c2c	pending	\N	\N	\N	\N	\N	\N
0735529d-0c3a-4551-9578-350eca49cb60	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	a419c96c-bb0f-4973-9598-49e88ab2cfa0	pending	\N	\N	\N	\N	\N	\N
ee33487a-f294-4355-8f43-66f5e3fc7e85	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	5b76ebc3-05b5-4008-9e8a-8e91866c4536	pending	\N	\N	\N	\N	\N	\N
9dbfb37d-587b-438a-a88a-ec6ccdc8ec0d	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	4b42d2d7-df7a-425d-b753-5d83c3103d65	pending	\N	\N	\N	\N	\N	\N
6c1fcf3d-4925-4637-840d-e2a4c4eab520	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	96347f98-91c7-4fec-bc21-be300e60ba28	pending	\N	\N	\N	\N	\N	\N
7aa3eb8b-c363-41cf-8420-80496b763208	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	60b0cf22-6574-4d36-b521-7b1725bca50f	pending	\N	\N	\N	\N	\N	\N
f8629cd0-bcd8-454f-a538-6d7a29ad5e27	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	a7f68e92-8192-4183-912b-8af85c4d13ee	pending	\N	\N	\N	\N	\N	\N
10fda183-71dd-4004-aa50-c29e7d907643	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	65718161-113b-4d95-9df4-f0405428a823	pending	\N	\N	\N	\N	\N	\N
29f7e95e-58fc-4d88-bda9-e07c28496e73	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	f291c7cd-cfea-47e1-a384-b4ecdef4f4da	pending	\N	\N	\N	\N	\N	\N
f3a1da80-7ee5-4e8f-8a33-ab702a0029d5	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	19503862-917e-4322-a676-5fdb902138fa	96a66cc1-f80a-47ad-a643-0b946cffa02e	pending	\N	\N	\N	\N	\N	\N
e0d5556d-51a9-4551-bb73-d3e7b51474b6	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	54de01b5-6711-4e2f-b4e5-83b8a658c1ea	pending	\N	\N	\N	\N	\N	\N
613da0fb-99ae-4afa-b3bf-09aa1f19d94a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	2bbf52cf-3942-43da-9e74-1ccab5d8f5b7	pending	\N	\N	\N	\N	\N	\N
f73f2846-f303-406e-a1eb-da7ef262868b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	40fed8d4-2408-4e91-998d-04548cf33cf1	pending	\N	\N	\N	\N	\N	\N
05c8bd5c-745a-4603-8d8e-16405330a8c5	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	df7f131c-ad24-413e-8640-dac8493be026	pending	\N	\N	\N	\N	\N	\N
1d78da5b-e67a-4e61-a077-3c321b024b5e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	609bab0d-72bd-4ee9-80fd-3f4d1db92bed	pending	\N	\N	\N	\N	\N	\N
82820a18-7763-44d2-95b0-555c97a892f3	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	011aa579-858b-4fec-a3cb-bed8bdd9f82d	pending	\N	\N	\N	\N	\N	\N
5021564d-9c3f-4058-bf54-2b4d9d5dca54	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	8a2d8daa-1687-4d8d-b54d-7864bd8d7887	pending	\N	\N	\N	\N	\N	\N
76c5bd9a-9749-40ec-940a-5faf6bd95f1a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	a0498893-beb3-4500-adcc-f56270dab200	pending	\N	\N	\N	\N	\N	\N
f39a8927-f826-40d3-9620-ffd1b6fff330	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	8c16dfa4-433d-44fb-aa00-82b12b83febc	pending	\N	\N	\N	\N	\N	\N
c440a4c0-d300-4a47-8c52-b0f78a79553b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	c071fc1e-af9a-490b-bcdf-af80b46d511c	pending	\N	\N	\N	\N	\N	\N
7163cfdc-adc7-4d7a-9fb4-107fb5e9f631	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	46c90232-8f81-49a5-84e3-5eada2ab01e3	pending	\N	\N	\N	\N	\N	\N
2129323c-8ecb-455e-8808-c470c60f7d85	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	812f8dcd-a92b-46dc-b9ec-18b272872999	pending	\N	\N	\N	\N	\N	\N
61f25620-4b1e-4fdf-80ee-52e712732807	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	ec95e8fd-2203-46f6-b941-0e19cb62d92f	pending	\N	\N	\N	\N	\N	\N
0b1a4237-b805-4fdf-82fb-5a11074e3e1c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	cf1ead87-bc0e-4710-8356-8791329f48d1	pending	\N	\N	\N	\N	\N	\N
f48b32a5-2194-4743-88c9-b190ef6c79c8	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	cdd2f7af-be6e-457a-a465-13900fd2449b	pending	\N	\N	\N	\N	\N	\N
824a301e-e8fe-4cd2-bf82-c336e8c78334	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	e48c91a4-3b94-463c-8977-5e35344d1315	pending	\N	\N	\N	\N	\N	\N
bd532382-6215-452c-b7d0-da27c270d5ed	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	81af9c2e-f599-47e5-8b27-b29b5cc577cd	pending	\N	\N	\N	\N	\N	\N
fde572c3-96e8-4ab1-a69f-536f184eaa52	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	72ed8bbc-c906-462b-91ae-5c8e602a9581	pending	\N	\N	\N	\N	\N	\N
2a272370-ff52-4fbf-8d45-1ad5966682b1	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	f5fcaeab-8802-4e50-b73d-4a057431d3fd	pending	\N	\N	\N	\N	\N	\N
7c312979-af87-44c0-af92-cfb7f5fc5765	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	7c2ee432-f7a2-468a-91a4-d6da3a69ee91	pending	\N	\N	\N	\N	\N	\N
37545e20-d491-4682-9df9-cda70772bccd	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	56e7195e-9d95-41eb-b776-924d6ead8b45	pending	\N	\N	\N	\N	\N	\N
8ce8f6c5-1ab4-4bb4-944b-82e94b04cab4	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	ec151a25-440b-4bb8-951a-60f8fa5c42aa	pending	\N	\N	\N	\N	\N	\N
2da81e40-bf56-47ce-8c1e-26c82532d913	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	db552fa7-40d4-4f8b-ae35-535d9a38f422	pending	\N	\N	\N	\N	\N	\N
bddbb145-9efe-4e48-b048-4080224944e2	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	59703fc1-3792-4e00-ba45-d2612bdf9cd2	pending	\N	\N	\N	\N	\N	\N
b25a84df-6331-43b3-9b91-c7f9195a51d9	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	c768a363-a74b-4cd6-b7e2-04a1e7591121	pending	\N	\N	\N	\N	\N	\N
67789317-85b4-4af9-85ae-e85d4d4fa99c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	21f9f74b-d38a-49ea-9f0a-5ff062ad9a25	pending	\N	\N	\N	\N	\N	\N
3b4298d3-be82-4ed3-b9a5-1a2ed7f70981	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	4d2275e3-0590-4352-9bc4-42738e2fa3e3	pending	\N	\N	\N	\N	\N	\N
b5af35ac-0f98-4032-a63d-ab0481c53d1e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	8f0844ab-cade-4aa7-af50-acf8b8ac8392	pending	\N	\N	\N	\N	\N	\N
14d28fcd-b2f2-437b-8c0f-a826b4b1d572	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	c8ab532b-2912-4ba1-bf23-5b6a9675e891	pending	\N	\N	\N	\N	\N	\N
886a350d-5b60-4c0f-80c9-5a5af052b936	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	a6bb2a07-c44e-4fee-8b04-624ec4fbf63a	pending	\N	\N	\N	\N	\N	\N
7fcc7110-07d0-4028-ad67-0580b5a72397	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	e7d6645c-bf43-48b2-96d1-a4e2489a1e31	pending	\N	\N	\N	\N	\N	\N
630015fb-7729-40ff-b122-c6737e7c0261	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	975a504a-b40b-44db-b4e9-6e93e0f50c5e	pending	\N	\N	\N	\N	\N	\N
e720fbb4-271f-40e2-8a01-4a8260696eb2	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	9b1180f3-8170-40e9-a21d-f082cb480b1f	pending	\N	\N	\N	\N	\N	\N
92970f96-b8c3-4c0c-a2b7-c995219d0093	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	55563828-0f0b-4b0c-b95d-acbb8f83ae6f	pending	\N	\N	\N	\N	\N	\N
b44396ea-796c-4719-88a3-529ffc862e4c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	3bfc5834-eaba-4c3d-b82e-f2a74eb30dca	pending	\N	\N	\N	\N	\N	\N
0682e15e-350f-499e-997f-5776a148d926	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	335dc9f5-ee0d-4ea3-9d32-78b49c554073	pending	\N	\N	\N	\N	\N	\N
8e330480-0398-42cc-88b5-31f4170b0502	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	90e72c62-d36e-4561-9c1e-765c7504eb73	pending	\N	\N	\N	\N	\N	\N
6106316c-1ff5-4ea6-a6f8-6536d798167a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	cce27dbe-160a-4844-b83a-cb5715812517	pending	\N	\N	\N	\N	\N	\N
0c41b253-6e68-4187-8587-598a64bf63a9	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	257b0f05-b370-4607-8ce6-84aec9080d49	pending	\N	\N	\N	\N	\N	\N
5f29b9cf-5e22-44cb-9a61-cfbf9dd8cbf7	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	40cd9142-c1c4-4969-9fd0-ba27e1553ba2	pending	\N	\N	\N	\N	\N	\N
f53263ed-8dbb-4be2-8426-02880a8c52f1	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	2e1b030d-b55d-46df-a3be-404bb7a368cf	pending	\N	\N	\N	\N	\N	\N
9b52f890-eeab-46b9-a101-ce81b0f29a91	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	13b241b5-e959-48b8-b741-86d932fb1e7c	pending	\N	\N	\N	\N	\N	\N
e664041d-a785-476b-a0ba-de011f8f39fd	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	3f3a4628-3be8-4cef-8480-46d2fb99c9f9	pending	\N	\N	\N	\N	\N	\N
a2571fa5-cca4-4950-acc4-699c8fd616b8	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	b4f32f00-af34-4e60-ace0-f37843d5f2ab	pending	\N	\N	\N	\N	\N	\N
d2adacec-f22b-4958-a79c-ff251a6c3463	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	41b19327-d33c-45fa-bc37-b0346414a85b	pending	\N	\N	\N	\N	\N	\N
36778653-8cc1-43b2-b282-9f3a2098cb01	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	a2f740a5-867d-40c4-9dee-9ef96886554c	pending	\N	\N	\N	\N	\N	\N
313908b7-0a1f-419a-9255-aace2f8baade	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	eebdc4eb-df2c-4064-9875-5d0267660480	pending	\N	\N	\N	\N	\N	\N
565dfcf0-436e-4871-b1b5-da6d8827037b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	dff31d86-d6ab-4125-9e24-2205029a8379	pending	\N	\N	\N	\N	\N	\N
0d4a5d0b-988e-4273-9b4d-88f378790686	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	48e071b5-3332-4582-948b-bffc48d3ca9c	pending	\N	\N	\N	\N	\N	\N
4b1f72a6-94b3-4944-98f5-377386d3681a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	ce5811e7-b6bb-4a33-953a-194b7a294da3	pending	\N	\N	\N	\N	\N	\N
8cc014e2-d05f-454c-9b99-cebfad2d1a46	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	fb660454-871c-4436-ab39-6a61f64e044b	pending	\N	\N	\N	\N	\N	\N
f4045100-1b3e-4916-bc6e-6bad2af025a8	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	9cbaea41-b097-468b-a55d-1b60d825ab04	pending	\N	\N	\N	\N	\N	\N
a783cff0-77d3-4638-9ad6-f3e271fab3e6	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	4be05588-7ad7-4cec-9f5d-112bcaecdd21	pending	\N	\N	\N	\N	\N	\N
d8580f64-b868-426b-b27d-62060e973270	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	be2fd2b2-0039-4e17-b2b1-9f3e2fc33c6b	pending	\N	\N	\N	\N	\N	\N
d53c2f47-4a3a-4708-9fbc-bb6bb2f9f913	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	f120e862-68f0-40eb-a84a-b6927ce51a90	pending	\N	\N	\N	\N	\N	\N
dffa3c23-3e49-4177-b781-ca3a1780e73a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	b5547bbf-ab34-4882-9846-fba230b69a7b	pending	\N	\N	\N	\N	\N	\N
7f7b9d36-f58a-41fe-825d-1592f64ffc69	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	64c1aa57-1dbf-4e8c-83cd-2325b8ba0e13	pending	\N	\N	\N	\N	\N	\N
211733a0-63c4-4ab8-ae9e-b427953e7640	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	2c9d0db2-83b8-4340-bba1-12ad1acebcda	pending	\N	\N	\N	\N	\N	\N
945db0b5-f6b4-4ed1-9579-a5c83bb25e5d	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	ea8bd191-46fd-4e86-ae8d-b3f7354e6c2c	pending	\N	\N	\N	\N	\N	\N
8db0700d-6daf-49a5-97df-8f131909f3b5	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	a419c96c-bb0f-4973-9598-49e88ab2cfa0	pending	\N	\N	\N	\N	\N	\N
f3ec0a1b-808d-4ee4-bc97-245890c7c915	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	5b76ebc3-05b5-4008-9e8a-8e91866c4536	pending	\N	\N	\N	\N	\N	\N
8a73ecd7-4a01-4e90-9df5-5bbb3e6ce6a2	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	4b42d2d7-df7a-425d-b753-5d83c3103d65	pending	\N	\N	\N	\N	\N	\N
72871e3d-5c53-4073-910a-78bceacf02bb	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	96347f98-91c7-4fec-bc21-be300e60ba28	pending	\N	\N	\N	\N	\N	\N
20e433d0-17a8-4fd9-a467-f7af7714f5d2	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	60b0cf22-6574-4d36-b521-7b1725bca50f	pending	\N	\N	\N	\N	\N	\N
c767ed32-9714-4bb5-8720-d1553e7198f6	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	a7f68e92-8192-4183-912b-8af85c4d13ee	pending	\N	\N	\N	\N	\N	\N
06599aa3-4896-47ad-a247-345cfc16f1fc	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	65718161-113b-4d95-9df4-f0405428a823	pending	\N	\N	\N	\N	\N	\N
07412c6b-0545-47d2-b866-43d2777c7b8e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	f291c7cd-cfea-47e1-a384-b4ecdef4f4da	pending	\N	\N	\N	\N	\N	\N
26663cd8-38fa-4627-bfd8-f06b390237a4	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	3a6e4427-eb06-419e-828a-9655456e15e9	96a66cc1-f80a-47ad-a643-0b946cffa02e	pending	\N	\N	\N	\N	\N	\N
19be991e-63f8-4e6b-b45f-44441127a588	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	54de01b5-6711-4e2f-b4e5-83b8a658c1ea	pending	\N	\N	\N	\N	\N	\N
2f130511-b65e-45ad-8f19-ccfe8bd02080	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	2bbf52cf-3942-43da-9e74-1ccab5d8f5b7	pending	\N	\N	\N	\N	\N	\N
36c19ba7-1491-41ed-95cb-074f52e59577	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	40fed8d4-2408-4e91-998d-04548cf33cf1	pending	\N	\N	\N	\N	\N	\N
58ee1c0e-d0a8-4933-8347-e0d058dd6383	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	df7f131c-ad24-413e-8640-dac8493be026	pending	\N	\N	\N	\N	\N	\N
a924af3c-1132-40ce-a0f2-19825631e008	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	609bab0d-72bd-4ee9-80fd-3f4d1db92bed	pending	\N	\N	\N	\N	\N	\N
7b74400b-eb50-40cf-8069-61e9758bd457	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	011aa579-858b-4fec-a3cb-bed8bdd9f82d	pending	\N	\N	\N	\N	\N	\N
7205d1af-703e-4a69-83f1-a4bc3fe09435	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	8a2d8daa-1687-4d8d-b54d-7864bd8d7887	pending	\N	\N	\N	\N	\N	\N
88d3c980-3324-46c9-8d6f-79aac0de94d5	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	a0498893-beb3-4500-adcc-f56270dab200	pending	\N	\N	\N	\N	\N	\N
ac458de5-9edf-41f3-afcd-ad5cb947717d	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	8c16dfa4-433d-44fb-aa00-82b12b83febc	pending	\N	\N	\N	\N	\N	\N
1cfa6b8f-d08a-4bed-b1f2-f8293a3a151c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	c071fc1e-af9a-490b-bcdf-af80b46d511c	pending	\N	\N	\N	\N	\N	\N
e4d3ea95-342c-4b22-954c-c3d7f9583bae	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	46c90232-8f81-49a5-84e3-5eada2ab01e3	pending	\N	\N	\N	\N	\N	\N
7e233f4b-fa5f-4dc0-aa86-e5d996a457f9	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	812f8dcd-a92b-46dc-b9ec-18b272872999	pending	\N	\N	\N	\N	\N	\N
c0c5d407-65e0-4338-a68c-74adbd617c9f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	ec95e8fd-2203-46f6-b941-0e19cb62d92f	pending	\N	\N	\N	\N	\N	\N
4c0d710c-3f69-462f-b837-8bbe6b1c330e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	cf1ead87-bc0e-4710-8356-8791329f48d1	pending	\N	\N	\N	\N	\N	\N
f2586379-1e39-474d-bdb7-f1d75e025e9f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	cdd2f7af-be6e-457a-a465-13900fd2449b	pending	\N	\N	\N	\N	\N	\N
911bf3a9-659e-4571-a13b-2f93800ac608	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	e48c91a4-3b94-463c-8977-5e35344d1315	pending	\N	\N	\N	\N	\N	\N
7e0af521-9775-4330-a22d-613c31e9f0cc	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	81af9c2e-f599-47e5-8b27-b29b5cc577cd	pending	\N	\N	\N	\N	\N	\N
8bd17311-c314-4413-a833-d152b0d3aff4	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	72ed8bbc-c906-462b-91ae-5c8e602a9581	pending	\N	\N	\N	\N	\N	\N
7f02f78c-1f3e-4f4e-8326-b8f338030f6a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	f5fcaeab-8802-4e50-b73d-4a057431d3fd	pending	\N	\N	\N	\N	\N	\N
11f7186b-220d-47ae-9394-978ab1ee17c8	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	7c2ee432-f7a2-468a-91a4-d6da3a69ee91	pending	\N	\N	\N	\N	\N	\N
c3b70c5b-1092-499b-abcc-321e3e85879f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	56e7195e-9d95-41eb-b776-924d6ead8b45	pending	\N	\N	\N	\N	\N	\N
f192fafc-f526-4b4e-b95c-438a2da02030	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	ec151a25-440b-4bb8-951a-60f8fa5c42aa	pending	\N	\N	\N	\N	\N	\N
8f7de367-55e2-4e39-abae-dde0d0109545	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	db552fa7-40d4-4f8b-ae35-535d9a38f422	pending	\N	\N	\N	\N	\N	\N
0b6ae364-3f1d-4f76-8e09-96f6a8b4bcc4	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	59703fc1-3792-4e00-ba45-d2612bdf9cd2	pending	\N	\N	\N	\N	\N	\N
6641e637-8f80-4486-a324-794f3f00a9aa	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	c768a363-a74b-4cd6-b7e2-04a1e7591121	pending	\N	\N	\N	\N	\N	\N
95c116e2-77fe-4a01-b180-f95e9ff1ee81	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	21f9f74b-d38a-49ea-9f0a-5ff062ad9a25	pending	\N	\N	\N	\N	\N	\N
6a85de92-c48e-491f-a13b-f64cbcce67d8	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	4d2275e3-0590-4352-9bc4-42738e2fa3e3	pending	\N	\N	\N	\N	\N	\N
8bd8b0c0-5978-4f05-80d4-766b59409ef3	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	8f0844ab-cade-4aa7-af50-acf8b8ac8392	pending	\N	\N	\N	\N	\N	\N
2287b3bc-35cc-46ec-ade4-03175fd88e5b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	c8ab532b-2912-4ba1-bf23-5b6a9675e891	pending	\N	\N	\N	\N	\N	\N
d7daf523-b91f-4458-b434-2fa46d74ad73	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	a6bb2a07-c44e-4fee-8b04-624ec4fbf63a	pending	\N	\N	\N	\N	\N	\N
b2f4487c-d2b8-487c-9316-6a7cf6ac6dda	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	f6f96670-c693-47ec-96dd-0d65cc2fac0d	pending	\N	\N	\N	\N	\N	\N
535e542e-2580-4259-9669-23f9e4ca9cfb	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	e7d6645c-bf43-48b2-96d1-a4e2489a1e31	pending	\N	\N	\N	\N	\N	\N
1760c7fc-37a9-428c-a2dc-f4a0df70fcad	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	975a504a-b40b-44db-b4e9-6e93e0f50c5e	pending	\N	\N	\N	\N	\N	\N
b54860f9-3dfc-4e52-a59a-54945f030586	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	9b1180f3-8170-40e9-a21d-f082cb480b1f	pending	\N	\N	\N	\N	\N	\N
cdda4115-4dd4-4a33-a151-4a0ec6706302	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	55563828-0f0b-4b0c-b95d-acbb8f83ae6f	pending	\N	\N	\N	\N	\N	\N
aa853eea-38e7-47e7-8bd7-f8e09d264eb9	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	3bfc5834-eaba-4c3d-b82e-f2a74eb30dca	pending	\N	\N	\N	\N	\N	\N
7cd8ed7b-c778-41e3-a7da-b1d073d4af03	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	335dc9f5-ee0d-4ea3-9d32-78b49c554073	pending	\N	\N	\N	\N	\N	\N
79677151-3359-40a5-8e05-7b63e5edd2a0	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	3de55700-3af8-4f44-9edb-653db4c4b70c	pending	\N	\N	\N	\N	\N	\N
304e3dd4-2b78-4e94-aa33-c2d0571e1561	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	90e72c62-d36e-4561-9c1e-765c7504eb73	pending	\N	\N	\N	\N	\N	\N
97396755-43e0-4a18-be1c-46f671bcca48	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	cce27dbe-160a-4844-b83a-cb5715812517	pending	\N	\N	\N	\N	\N	\N
2cb15ac1-53d6-41de-a2a7-5fc4fb34a268	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	257b0f05-b370-4607-8ce6-84aec9080d49	pending	\N	\N	\N	\N	\N	\N
90ae6fd9-cea9-48a6-94ab-c262c34d7616	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	40cd9142-c1c4-4969-9fd0-ba27e1553ba2	pending	\N	\N	\N	\N	\N	\N
d6fd37a4-be5d-4f54-81d5-a3e1eccc2873	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	2e1b030d-b55d-46df-a3be-404bb7a368cf	pending	\N	\N	\N	\N	\N	\N
c6666622-6d6f-4396-8c7d-28568911967a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	13b241b5-e959-48b8-b741-86d932fb1e7c	pending	\N	\N	\N	\N	\N	\N
08ae7aa6-f59a-4331-ba70-fbbc05644846	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	b0e855bf-75d3-45b9-af72-cc7a1754aed8	pending	\N	\N	\N	\N	\N	\N
c16943da-f054-45c5-b179-99b2d0137a94	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	3f3a4628-3be8-4cef-8480-46d2fb99c9f9	pending	\N	\N	\N	\N	\N	\N
4d2d9e79-6fd1-4033-8888-e45eb15db418	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	b4f32f00-af34-4e60-ace0-f37843d5f2ab	pending	\N	\N	\N	\N	\N	\N
a3ad3422-5ad1-4047-bfa9-94a1291c13cc	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	41b19327-d33c-45fa-bc37-b0346414a85b	pending	\N	\N	\N	\N	\N	\N
0ef22f81-68bf-46e3-8232-b14846fb60f8	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	a2f740a5-867d-40c4-9dee-9ef96886554c	pending	\N	\N	\N	\N	\N	\N
d7e0e2a0-c3b9-4cc7-a127-df9322cc9ad2	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	eebdc4eb-df2c-4064-9875-5d0267660480	pending	\N	\N	\N	\N	\N	\N
c5895c3c-5e81-4a54-9e9b-415b96369603	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	dff31d86-d6ab-4125-9e24-2205029a8379	pending	\N	\N	\N	\N	\N	\N
c83ab6aa-611b-4f75-a425-1b328f224c3a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	48e071b5-3332-4582-948b-bffc48d3ca9c	pending	\N	\N	\N	\N	\N	\N
87e2a86c-595c-4e98-bdc7-4e1ee13bdc62	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	ce5811e7-b6bb-4a33-953a-194b7a294da3	pending	\N	\N	\N	\N	\N	\N
3e4d47fa-57f6-4d0e-a8aa-48f7d2af6938	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	fb660454-871c-4436-ab39-6a61f64e044b	pending	\N	\N	\N	\N	\N	\N
7042e0c7-664a-49be-917a-324e1fb071fc	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	9cbaea41-b097-468b-a55d-1b60d825ab04	pending	\N	\N	\N	\N	\N	\N
80ba0e54-5473-42a5-9fe5-f17d2ebd7cd3	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	4be05588-7ad7-4cec-9f5d-112bcaecdd21	pending	\N	\N	\N	\N	\N	\N
8957e2c5-34a6-470e-b674-e295384af12f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	be2fd2b2-0039-4e17-b2b1-9f3e2fc33c6b	pending	\N	\N	\N	\N	\N	\N
71729c14-ff6c-4792-8ea3-222c7d79c05a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	f120e862-68f0-40eb-a84a-b6927ce51a90	pending	\N	\N	\N	\N	\N	\N
e703939e-c08b-42cb-9c8c-d133f1809033	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	d28459b3-7fc0-44ed-bc18-6bd79a3a2b0b	pending	\N	\N	\N	\N	\N	\N
e3dcac99-5a56-4bb2-96cd-1c4a0acf23a8	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	b5547bbf-ab34-4882-9846-fba230b69a7b	pending	\N	\N	\N	\N	\N	\N
e71abbc3-0a89-4f1f-a431-bc756f753219	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	64c1aa57-1dbf-4e8c-83cd-2325b8ba0e13	pending	\N	\N	\N	\N	\N	\N
892c219e-d15c-44f3-ae15-20b0570f20e8	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	2c9d0db2-83b8-4340-bba1-12ad1acebcda	pending	\N	\N	\N	\N	\N	\N
cbe80235-20e7-4eb4-bc83-de4d8d5e3087	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	ea8bd191-46fd-4e86-ae8d-b3f7354e6c2c	pending	\N	\N	\N	\N	\N	\N
9fffe4ea-0f34-454e-800a-efa93a5753a3	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	a419c96c-bb0f-4973-9598-49e88ab2cfa0	pending	\N	\N	\N	\N	\N	\N
19075a60-24da-4b4b-abad-aa8570069137	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	5b76ebc3-05b5-4008-9e8a-8e91866c4536	pending	\N	\N	\N	\N	\N	\N
b4f8aa80-63c8-4c0e-ba6f-d6df185a6ea7	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	4b42d2d7-df7a-425d-b753-5d83c3103d65	pending	\N	\N	\N	\N	\N	\N
f6f6c959-aabb-41a7-bfac-b8b7a528d5ad	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	96347f98-91c7-4fec-bc21-be300e60ba28	pending	\N	\N	\N	\N	\N	\N
1a705b3e-7d48-440f-a690-740dfdea6d2f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	60b0cf22-6574-4d36-b521-7b1725bca50f	pending	\N	\N	\N	\N	\N	\N
00f8e065-43c0-4ff6-8764-c5b95351c641	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	a7f68e92-8192-4183-912b-8af85c4d13ee	pending	\N	\N	\N	\N	\N	\N
6dc6afd9-f0f9-4800-ae2a-ecc98e4bbc88	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	65718161-113b-4d95-9df4-f0405428a823	pending	\N	\N	\N	\N	\N	\N
fa891ce7-8bd4-4fbd-be39-75cd6620d446	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	f291c7cd-cfea-47e1-a384-b4ecdef4f4da	pending	\N	\N	\N	\N	\N	\N
9cf722c6-f37b-4925-b2f7-21b9195e224a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	1312bbfa-f16c-4844-9ff3-9bba0c9cb0bc	96a66cc1-f80a-47ad-a643-0b946cffa02e	pending	\N	\N	\N	\N	\N	\N
21702692-9117-484a-b45b-f615144bb9f6	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	54de01b5-6711-4e2f-b4e5-83b8a658c1ea	pending	\N	\N	\N	\N	\N	\N
30368ffd-2364-4a56-9aac-fea2cd135def	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	2bbf52cf-3942-43da-9e74-1ccab5d8f5b7	pending	\N	\N	\N	\N	\N	\N
31815859-975f-456e-a482-daa671abb283	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	40fed8d4-2408-4e91-998d-04548cf33cf1	pending	\N	\N	\N	\N	\N	\N
1d436bca-cb61-4aeb-83c4-619791c08c1e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	df7f131c-ad24-413e-8640-dac8493be026	pending	\N	\N	\N	\N	\N	\N
34dcf289-2822-4e10-b8f6-4e5b285d445b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	609bab0d-72bd-4ee9-80fd-3f4d1db92bed	pending	\N	\N	\N	\N	\N	\N
ef1d26a8-49a1-4145-b142-b21bbec86522	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	011aa579-858b-4fec-a3cb-bed8bdd9f82d	pending	\N	\N	\N	\N	\N	\N
acff9286-10a7-4d5e-9da6-08a4ce33a8af	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	8a2d8daa-1687-4d8d-b54d-7864bd8d7887	pending	\N	\N	\N	\N	\N	\N
1afdbba2-9432-4c19-9b97-55d99f210799	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	a0498893-beb3-4500-adcc-f56270dab200	pending	\N	\N	\N	\N	\N	\N
c3997e9b-569f-447d-a146-5526dcf67344	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	8c16dfa4-433d-44fb-aa00-82b12b83febc	pending	\N	\N	\N	\N	\N	\N
ab2a44e1-08a3-405f-bf03-a1cd4ff53474	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	c071fc1e-af9a-490b-bcdf-af80b46d511c	pending	\N	\N	\N	\N	\N	\N
4940c84b-4e58-4723-a2a0-511b0d78cc5a	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	46c90232-8f81-49a5-84e3-5eada2ab01e3	pending	\N	\N	\N	\N	\N	\N
42a2770e-e3e7-4fc8-8e95-0ba20a05247f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	812f8dcd-a92b-46dc-b9ec-18b272872999	pending	\N	\N	\N	\N	\N	\N
6d8e25ea-caba-4dc3-b731-5a3e0e07b2fe	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	ec95e8fd-2203-46f6-b941-0e19cb62d92f	pending	\N	\N	\N	\N	\N	\N
69fd61c9-d4e5-4725-a7da-a25a3d67842b	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	cf1ead87-bc0e-4710-8356-8791329f48d1	pending	\N	\N	\N	\N	\N	\N
b5518a86-0374-46e7-8564-65238f12c703	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	cdd2f7af-be6e-457a-a465-13900fd2449b	pending	\N	\N	\N	\N	\N	\N
ca44a07b-58eb-42db-a649-42b620fc12c8	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	e48c91a4-3b94-463c-8977-5e35344d1315	pending	\N	\N	\N	\N	\N	\N
2b2b3763-5b12-44ac-9a46-39c80adf314d	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	81af9c2e-f599-47e5-8b27-b29b5cc577cd	pending	\N	\N	\N	\N	\N	\N
39f326c1-f573-4945-86a0-c9d0cf6a0acb	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	72ed8bbc-c906-462b-91ae-5c8e602a9581	pending	\N	\N	\N	\N	\N	\N
1a5f626d-920f-4df7-a379-a7e91de38948	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	f5fcaeab-8802-4e50-b73d-4a057431d3fd	pending	\N	\N	\N	\N	\N	\N
1f504961-fbe3-48c0-aaa7-93367cf88c32	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	7c2ee432-f7a2-468a-91a4-d6da3a69ee91	pending	\N	\N	\N	\N	\N	\N
e7470be7-5251-4f59-ab0c-c885bcfba2df	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	56e7195e-9d95-41eb-b776-924d6ead8b45	pending	\N	\N	\N	\N	\N	\N
65282f9f-6713-4769-832d-8062e5574c60	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	ec151a25-440b-4bb8-951a-60f8fa5c42aa	pending	\N	\N	\N	\N	\N	\N
41c1cf22-0222-44c8-93d5-d3b38a252da4	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	db552fa7-40d4-4f8b-ae35-535d9a38f422	pending	\N	\N	\N	\N	\N	\N
5e25e909-884a-43ae-920f-306bccc28503	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	59703fc1-3792-4e00-ba45-d2612bdf9cd2	pending	\N	\N	\N	\N	\N	\N
b43b1247-4a46-4ece-8903-8206d97ffb12	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	c768a363-a74b-4cd6-b7e2-04a1e7591121	pending	\N	\N	\N	\N	\N	\N
6fd87e34-37be-4a3c-a230-c7cd5fd6daff	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	21f9f74b-d38a-49ea-9f0a-5ff062ad9a25	pending	\N	\N	\N	\N	\N	\N
de2f9baa-8348-498f-8a3b-f313061129fb	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	4d2275e3-0590-4352-9bc4-42738e2fa3e3	pending	\N	\N	\N	\N	\N	\N
2c7dd379-5fe1-46ca-9ca9-67649befd6a0	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	8f0844ab-cade-4aa7-af50-acf8b8ac8392	pending	\N	\N	\N	\N	\N	\N
8e2ea5e7-534e-4317-b166-f9581145b1a2	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	c8ab532b-2912-4ba1-bf23-5b6a9675e891	pending	\N	\N	\N	\N	\N	\N
60a8ff92-0cfb-4511-ac89-b12e8deb119f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	a6bb2a07-c44e-4fee-8b04-624ec4fbf63a	pending	\N	\N	\N	\N	\N	\N
e1e8771f-6665-42ff-8c5f-bdf35b6fefc3	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	f6f96670-c693-47ec-96dd-0d65cc2fac0d	pending	\N	\N	\N	\N	\N	\N
797c7132-cfc7-48bc-829e-0c7d17e896d1	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	e7d6645c-bf43-48b2-96d1-a4e2489a1e31	pending	\N	\N	\N	\N	\N	\N
e37096a2-6ef3-48dd-a7e3-0a329d546dbf	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	975a504a-b40b-44db-b4e9-6e93e0f50c5e	pending	\N	\N	\N	\N	\N	\N
38b237b3-9cfc-4285-a3d3-48cce563dd81	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	9b1180f3-8170-40e9-a21d-f082cb480b1f	pending	\N	\N	\N	\N	\N	\N
b33d4d12-6c17-4cd1-ac7e-cbacbc4d4928	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	55563828-0f0b-4b0c-b95d-acbb8f83ae6f	pending	\N	\N	\N	\N	\N	\N
7f8ee55a-7241-4215-b066-349c814b70ce	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	3bfc5834-eaba-4c3d-b82e-f2a74eb30dca	pending	\N	\N	\N	\N	\N	\N
93e802d8-8781-410e-bce1-bf404fe68e9d	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	335dc9f5-ee0d-4ea3-9d32-78b49c554073	pending	\N	\N	\N	\N	\N	\N
4a28e966-62c7-4a90-9132-f852448186d9	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	3de55700-3af8-4f44-9edb-653db4c4b70c	pending	\N	\N	\N	\N	\N	\N
d1d1f327-89d6-4fc7-9525-e7ef77f37dbf	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	90e72c62-d36e-4561-9c1e-765c7504eb73	pending	\N	\N	\N	\N	\N	\N
fccf3e80-3a78-4141-be08-44b127376f21	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	cce27dbe-160a-4844-b83a-cb5715812517	pending	\N	\N	\N	\N	\N	\N
c1bcd58d-a503-4f16-958d-c4011ed68bbc	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	257b0f05-b370-4607-8ce6-84aec9080d49	pending	\N	\N	\N	\N	\N	\N
bb7c56b4-d221-43dc-975e-1f2301afb8bb	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	40cd9142-c1c4-4969-9fd0-ba27e1553ba2	pending	\N	\N	\N	\N	\N	\N
9b70b9ad-0613-4d76-97df-49e9a767f3b8	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	2e1b030d-b55d-46df-a3be-404bb7a368cf	pending	\N	\N	\N	\N	\N	\N
f001a060-8bb3-4087-925c-83372581bbf3	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	13b241b5-e959-48b8-b741-86d932fb1e7c	pending	\N	\N	\N	\N	\N	\N
21c8b61b-4064-4950-b79e-1f6a3d85f303	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	b0e855bf-75d3-45b9-af72-cc7a1754aed8	pending	\N	\N	\N	\N	\N	\N
d70051bc-95f1-4f30-b2d5-a700dcd90d37	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	3f3a4628-3be8-4cef-8480-46d2fb99c9f9	pending	\N	\N	\N	\N	\N	\N
469cdfbd-3c47-49a2-88d5-4bca8b970637	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	b4f32f00-af34-4e60-ace0-f37843d5f2ab	pending	\N	\N	\N	\N	\N	\N
9f23753f-6d25-479b-9c0a-f1d6eecefa75	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	41b19327-d33c-45fa-bc37-b0346414a85b	pending	\N	\N	\N	\N	\N	\N
0e6dd307-c315-4d5d-870c-cbe11d2c0874	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	a2f740a5-867d-40c4-9dee-9ef96886554c	pending	\N	\N	\N	\N	\N	\N
3281c3be-5303-4388-ab8e-038f10427ab8	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	eebdc4eb-df2c-4064-9875-5d0267660480	pending	\N	\N	\N	\N	\N	\N
811e3d96-0ba3-426e-a9fc-2fd0d2497da6	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	dff31d86-d6ab-4125-9e24-2205029a8379	pending	\N	\N	\N	\N	\N	\N
17fc3e0d-6aeb-42ee-831f-822d2ccdbbf4	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	48e071b5-3332-4582-948b-bffc48d3ca9c	pending	\N	\N	\N	\N	\N	\N
dfe07819-aa55-4658-9d20-3790616ad5ec	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	ce5811e7-b6bb-4a33-953a-194b7a294da3	pending	\N	\N	\N	\N	\N	\N
0b328dba-28b5-4c66-b408-99089996c561	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	fb660454-871c-4436-ab39-6a61f64e044b	pending	\N	\N	\N	\N	\N	\N
d743db23-a4cd-4e6b-8c12-6dba579b94de	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	9cbaea41-b097-468b-a55d-1b60d825ab04	pending	\N	\N	\N	\N	\N	\N
5240689b-fc4f-40d1-996a-6f75ff998bc6	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	4be05588-7ad7-4cec-9f5d-112bcaecdd21	pending	\N	\N	\N	\N	\N	\N
a63b9211-9b3e-43f3-86ce-e200aa46aba1	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	be2fd2b2-0039-4e17-b2b1-9f3e2fc33c6b	pending	\N	\N	\N	\N	\N	\N
bafab124-8132-45b1-858f-e41b89130939	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	f120e862-68f0-40eb-a84a-b6927ce51a90	pending	\N	\N	\N	\N	\N	\N
29d1d26b-f782-4198-831f-46acb5508d51	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	d28459b3-7fc0-44ed-bc18-6bd79a3a2b0b	pending	\N	\N	\N	\N	\N	\N
4f6f04f4-2830-41e3-bd69-448e99ae5938	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	b5547bbf-ab34-4882-9846-fba230b69a7b	pending	\N	\N	\N	\N	\N	\N
913374bd-701e-49bb-9737-ee6a23a9ef9c	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	64c1aa57-1dbf-4e8c-83cd-2325b8ba0e13	pending	\N	\N	\N	\N	\N	\N
d6913125-2c25-4cec-91bd-f5ea3a132765	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	2c9d0db2-83b8-4340-bba1-12ad1acebcda	pending	\N	\N	\N	\N	\N	\N
d4b72203-426e-4abc-b3a5-ea2914d15b24	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	ea8bd191-46fd-4e86-ae8d-b3f7354e6c2c	pending	\N	\N	\N	\N	\N	\N
212aff48-4c80-4ebf-9743-5da0a05b271e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	a419c96c-bb0f-4973-9598-49e88ab2cfa0	pending	\N	\N	\N	\N	\N	\N
4f41bbec-70e2-4b2b-8020-30e6220f40c0	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	5b76ebc3-05b5-4008-9e8a-8e91866c4536	pending	\N	\N	\N	\N	\N	\N
9b5ddb57-9a99-40ac-a28b-559af4094b33	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	4b42d2d7-df7a-425d-b753-5d83c3103d65	pending	\N	\N	\N	\N	\N	\N
a7573496-ff2b-47ed-ac84-c398365b3f74	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	96347f98-91c7-4fec-bc21-be300e60ba28	pending	\N	\N	\N	\N	\N	\N
288e321c-42dd-4f43-8014-3a6d9f1b4d7e	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	60b0cf22-6574-4d36-b521-7b1725bca50f	pending	\N	\N	\N	\N	\N	\N
4c67e727-0b40-4121-9d0c-6a76646becd6	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	a7f68e92-8192-4183-912b-8af85c4d13ee	pending	\N	\N	\N	\N	\N	\N
516a9580-83b7-4002-b867-20410072fdb9	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	65718161-113b-4d95-9df4-f0405428a823	pending	\N	\N	\N	\N	\N	\N
26faa66e-dc7d-43ad-b2ce-07ed68d6335f	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	f291c7cd-cfea-47e1-a384-b4ecdef4f4da	pending	\N	\N	\N	\N	\N	\N
50d46664-0a0b-4955-a153-3711ce87fea8	2fee15ed-84fb-408f-aaed-bd798a1dae92	\N	72b7c008-d486-47fa-b773-7371b385334c	96a66cc1-f80a-47ad-a643-0b946cffa02e	pending	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: protocol_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.protocol_templates (id, name, frequency, site_id, organization_id, contract_id, description, default_executor_id, default_responsible_id, signatory_executor_label, signatory_responsible_label, template_file_path, template_file_name, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: saved_graphs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.saved_graphs (id, user_id, name, description, host_ids, item_keys, chart_type, time_range, aggregation, is_template, is_shared, tz_requirement_codes, config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sites (id, name, address, city, organization, description, created_at, updated_at, organization_id) FROM stdin;
aabafe11-24b9-41f6-9480-5c2873e21c7d	Филиал "Энерготелеком"	ул. Я.Купалы, 15А	Брест	РУП "Брестэнерго"	Site 1	2026-05-21 09:50:11.677172+00	2026-05-21 09:50:11.677172+00	cf0cefb9-7892-4d29-8f42-764c19512092
532e5161-d889-4e48-9aed-81fa29f401d0	РУП "Брестэнерго"	ул.Воровского, 13/1	Брест	РУП "Брестэнерго"	Site 2	2026-05-21 09:50:51.209913+00	2026-05-21 09:50:51.209913+00	cf0cefb9-7892-4d29-8f42-764c19512092
\.


--
-- Data for Name: support_scheme_lines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.support_scheme_lines (id, scheme_id, "position", line_number, line_name, description, primary_engineer_name, primary_engineer_phone, fallback_engineer_name, fallback_engineer_phone, color, created_at, updated_at) FROM stdin;
3efd9165-3e29-43da-8fbc-d4b64ac5f699	e4007b04-0fe7-47eb-9e0e-fa0258c212e1	0	1	Администрирование	Виртуальные активы и сервисы ПТК	Шкулипа Андрей	+375 44 786 58 40	Садовников Дмитрий	+375 29 728 88 16	emerald	2026-05-21 11:46:16.783896+00	2026-05-21 11:46:22.737856+00
3730beda-e9ce-4eac-a43e-6352c8ce785f	e4007b04-0fe7-47eb-9e0e-fa0258c212e1	1	2	Инфраструктура	Аппаратные активы ПТК (сетевое и серверное оборудование)	Лавринович Артур	+375 29 516 21 56	Шантыко Максим	+375 29 775 45 29	amber	2026-05-21 11:47:31.616041+00	2026-05-21 11:47:31.616041+00
d2672c65-4021-4d0f-8804-fa424cb05e8e	e4007b04-0fe7-47eb-9e0e-fa0258c212e1	2	3	Программное обеспечение ПТК	Data Engineering, СК-11, 1С СУПА	Прокопович Михаил	+375 33 324 15 39	Садовников Дмитрий	+375 29 728 88 16	rose	2026-05-21 11:49:14.287468+00	2026-05-21 11:49:18.886428+00
\.


--
-- Data for Name: support_schemes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.support_schemes (id, organization_id, title, subtitle, hotline_city, hotline_mobile, ivr_business_hours, ivr_after_hours, sla_note, customer_responsible_name, customer_responsible_phone, customer_responsible_role, contractor_responsible_name, contractor_responsible_phone, contractor_responsible_role, escalation_name, escalation_phone, escalation_role, created_at, updated_at) FROM stdin;
e4007b04-0fe7-47eb-9e0e-fa0258c212e1	cf0cefb9-7892-4d29-8f42-764c19512092	Техническое сопровождение ПТК АСДТУ РУП "Брестэнерго"		+375 17 336 60 45	+375 29 336 60 45	08:00 — 17:00	17:00 — 08:00, выходные и праздники		Дмитрук Максим	+375 33 681 70 66		Савицкий Александр	+375 29 669 86 82		Садовников Дмитрий	+375 29 728 88 16	Старший дежурный	2026-05-21 09:50:59.950349+00	2026-05-21 11:50:28.052642+00
\.


--
-- Data for Name: system_kill_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_kill_log (id, triggered_by, triggered_email, status, details, created_at) FROM stdin;
\.


--
-- Data for Name: ticket_ai_analyses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_ai_analyses (id, ticket_id, analysis, model, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ticket_comment_reactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_comment_reactions (id, comment_id, user_id, emoji, created_at) FROM stdin;
\.


--
-- Data for Name: ticket_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_comments (id, ticket_id, user_id, content, is_internal, created_at, mentions) FROM stdin;
\.


--
-- Data for Name: ticket_links; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_links (id, source_ticket_id, target_ticket_id, kind, note, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: ticket_status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_status_history (id, ticket_id, old_status, new_status, changed_by, changed_by_name, comment, created_at) FROM stdin;
51e5f0fd-9e0d-45fb-85af-6f24b9b8d605	2f24110b-9d6f-4a4b-9fb2-c4f0bdc33938	open	cancelled	393ee63e-3282-4e05-bd99-dc01241e84e2	Шантыко Максим Геннадьевич	\N	2026-05-22 10:19:16.817499+00
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tickets (id, site_id, equipment_id, title, description, priority, status, created_by, assigned_to, resolved_at, sla_deadline, created_at, updated_at, first_response_at, product_code, subcategory, request_type, incident_category, organization_id) FROM stdin;
2f24110b-9d6f-4a4b-9fb2-c4f0bdc33938	\N	\N	[Мониторинг] VMware Hypervisor: The 791102f5-3473-8e14-ed11-3b968c4ebd15 health is Red	Автоматически создана из проблемы мониторинга.\n\nОписание: VMware Hypervisor: The 791102f5-3473-8e14-ed11-3b968c4ebd15 health is Red\nСерьёзность: Высокий\nВремя: 15.05.2026, 12:41:09\nZabbix eventid: 32931	P1	cancelled	393ee63e-3282-4e05-bd99-dc01241e84e2	\N	\N	\N	2026-05-22 10:18:48.646387+00	2026-05-22 10:19:16.798148+00	\N	\N	\N	incident	\N	\N
\.


--
-- Data for Name: tz_coverage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tz_coverage (id, requirement_id, host_id, status, related_items, notes, updated_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tz_requirements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tz_requirements (id, code, title, category, check_type, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_dashboard_widgets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_dashboard_widgets (id, user_id, widget_type, title, config, "position", created_at, updated_at) FROM stdin;
2648b14f-4607-483f-aa8a-4e4a80dff11a	04eaa7fe-2753-42a7-b335-7ffe6be31c09	summary	Сводка	{"h": 3, "w": 12, "x": 0, "y": 0, "extra": {}, "chartType": null}	0	2026-05-21 14:09:10.682338+00	2026-05-21 14:09:23.4193+00
6901d711-2591-4a49-88d3-f5b38976f35f	04eaa7fe-2753-42a7-b335-7ffe6be31c09	tickets-by-status	Заявки по статусам	{"h": 7, "w": 4, "x": 0, "y": 3, "extra": {}, "chartType": "bar"}	1	2026-05-21 14:09:10.682338+00	2026-05-21 14:09:23.4193+00
f48f3aea-1018-4d0a-8a44-e3e4bc79d5f2	04eaa7fe-2753-42a7-b335-7ffe6be31c09	tickets-by-priority	Открытые заявки по приоритету	{"h": 7, "w": 4, "x": 4, "y": 3, "extra": {}, "chartType": "donut"}	2	2026-05-21 14:09:10.682338+00	2026-05-21 14:09:23.4193+00
15b98ecf-dc09-4547-b7fb-6ef4b3bee6e6	04eaa7fe-2753-42a7-b335-7ffe6be31c09	closed-stats	Закрытые заявки	{"h": 7, "w": 4, "x": 8, "y": 3, "extra": {}, "chartType": null}	3	2026-05-21 14:09:10.682338+00	2026-05-21 14:09:23.4193+00
2a5356d3-209d-4b56-9c47-4a07dc21e72f	04eaa7fe-2753-42a7-b335-7ffe6be31c09	monitoring-hosts	Хосты мониторинга	{"h": 7, "w": 6, "x": 0, "y": 10, "extra": {}, "chartType": "donut"}	4	2026-05-21 14:09:10.682338+00	2026-05-21 14:09:23.4193+00
fd4f06da-a0fd-4758-abfa-4aa6fadf607c	04eaa7fe-2753-42a7-b335-7ffe6be31c09	monitoring-events	События мониторинга	{"h": 7, "w": 6, "x": 6, "y": 10, "extra": {}, "chartType": null}	5	2026-05-21 14:09:10.682338+00	2026-05-21 14:09:23.4193+00
71051e28-3400-4cc3-b257-c6e307366187	04eaa7fe-2753-42a7-b335-7ffe6be31c09	protocols-by-status	Протоколы по статусам	{"h": 7, "w": 6, "x": 0, "y": 17, "extra": {}, "chartType": "bar"}	6	2026-05-21 14:09:10.682338+00	2026-05-21 14:09:23.4193+00
1b3497fe-a8d4-441b-ad31-e79b80cbd9bc	04eaa7fe-2753-42a7-b335-7ffe6be31c09	equipment-by-status	Оборудование по статусу	{"h": 7, "w": 6, "x": 6, "y": 17, "extra": {}, "chartType": "donut"}	7	2026-05-21 14:09:10.682338+00	2026-05-21 14:09:23.4193+00
7c7e94a9-ab67-4962-b417-11a7767bfa76	04eaa7fe-2753-42a7-b335-7ffe6be31c09	activity	Активность за 14 дней	{"h": 7, "w": 12, "x": 0, "y": 24, "extra": {}, "chartType": "line"}	8	2026-05-21 14:09:10.682338+00	2026-05-21 14:09:23.4193+00
90cd8e22-6f61-4c90-89a1-3851818e7d2e	04eaa7fe-2753-42a7-b335-7ffe6be31c09	recent-tickets	Последние заявки	{"h": 7, "w": 12, "x": 0, "y": 31, "extra": {}, "chartType": null}	9	2026-05-21 14:09:10.682338+00	2026-05-21 14:09:23.4193+00
\.


--
-- Data for Name: user_favorite_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_favorite_metrics (id, user_id, zabbix_host_id, host_name, itemid, item_key, item_name, units, "position", created_at) FROM stdin;
\.


--
-- Data for Name: user_metric_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_metric_preferences (id, user_id, display_language, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_module_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_module_permissions (id, user_id, module_key, created_at) FROM stdin;
952016af-82d9-43e6-8b36-cf58b650458e	393ee63e-3282-4e05-bd99-dc01241e84e2	dashboard	2026-05-20 11:58:31.619512+00
b08fb69b-2e43-42bf-a453-d1ca93d6cd94	04eaa7fe-2753-42a7-b335-7ffe6be31c09	dashboard	2026-05-21 09:24:30.651371+00
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (id, user_id, role) FROM stdin;
59dc27e2-a4bc-440e-8dd9-02a1d2995989	393ee63e-3282-4e05-bd99-dc01241e84e2	admin
759f6a20-f031-4a97-a76f-4202edc79dd0	04eaa7fe-2753-42a7-b335-7ffe6be31c09	admin
7ac719e6-6ae9-42b5-8122-c4b625ab0b09	6612e16b-ba9f-49cf-9ed2-184cf00dde2c	engineer
1fcfcb95-363d-4f05-b899-fa9d383bd53d	9233c31a-6cc8-4ec0-90c8-3aaedf88e7ef	customer
\.


--
-- Data for Name: zabbix_connections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.zabbix_connections (id, organization_id, name, zabbix_url, zabbix_user, zabbix_password, vpn_info, is_active, is_default, created_at, updated_at, updated_by) FROM stdin;
e51d3711-c9d0-43d3-9d7f-7385711a8dcc	cf0cefb9-7892-4d29-8f42-764c19512092	Collector_Brest	http://10.11.12.245:8081/zabbix	Admin	Alex___159248654		t	f	2026-05-21 15:03:55.126132+00	2026-05-22 09:51:31.592754+00	\N
\.


--
-- Data for Name: zabbix_template_library; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.zabbix_template_library (id, name, source, source_url, category, description, yaml_content, tags, imported_from, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id) FROM stdin;
documents	documents	\N	2026-05-20 06:59:53.36617+00	2026-05-20 06:59:53.36617+00	t	f	\N	\N	\N
signatures	signatures	\N	2026-05-20 07:00:00.019916+00	2026-05-20 07:00:00.019916+00	f	f	\N	\N	\N
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2026-05-20 06:56:56.642038
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2026-05-20 06:56:56.653833
2	storage-schema	5c7968fd083fcea04050c1b7f6253c9771b99011	2026-05-20 06:56:56.65848
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2026-05-20 06:56:56.673865
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2026-05-20 06:56:56.691569
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2026-05-20 06:56:56.694907
6	change-column-name-in-get-size	f93f62afdf6613ee5e7e815b30d02dc990201044	2026-05-20 06:56:56.698545
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2026-05-20 06:56:56.706191
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2026-05-20 06:56:56.708827
9	fix-search-function	3a0af29f42e35a4d101c259ed955b67e1bee6825	2026-05-20 06:56:56.71154
10	search-files-search-function	68dc14822daad0ffac3746a502234f486182ef6e	2026-05-20 06:56:56.715204
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2026-05-20 06:56:56.728769
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2026-05-20 06:56:56.732989
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2026-05-20 06:56:56.735527
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2026-05-20 06:56:56.738773
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2026-05-20 06:56:56.871171
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2026-05-20 06:56:56.87554
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2026-05-20 06:56:56.877984
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2026-05-20 06:56:56.882376
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2026-05-20 06:56:56.887425
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2026-05-20 06:56:56.890187
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2026-05-20 06:56:56.895857
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2026-05-20 06:56:57.038733
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2026-05-20 06:56:57.127681
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id) FROM stdin;
07551fb8-3175-4319-a49a-863678379a4c	signatures	393ee63e-3282-4e05-bd99-dc01241e84e2/signature.png	393ee63e-3282-4e05-bd99-dc01241e84e2	2026-05-21 07:28:04.839542+00	2026-05-21 07:28:04.839542+00	2026-05-21 07:28:04.839542+00	{"eTag": "\\"b5d7f6aed255a338e59e1a0bc68cc018\\"", "size": 42117, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-05-21T07:28:04.822Z", "contentLength": 42117, "httpStatusCode": 200}	529104f7-e55c-4f51-8dcd-9c4770c49d35	393ee63e-3282-4e05-bd99-dc01241e84e2
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 59, true);


--
-- Name: key_key_id_seq; Type: SEQUENCE SET; Schema: pgsodium; Owner: supabase_admin
--

SELECT pg_catalog.setval('pgsodium.key_key_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: alert_thresholds alert_thresholds_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_thresholds
    ADD CONSTRAINT alert_thresholds_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: automation_logs automation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_logs
    ADD CONSTRAINT automation_logs_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: equipment_categories equipment_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment_categories
    ADD CONSTRAINT equipment_categories_name_key UNIQUE (name);


--
-- Name: equipment_categories equipment_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment_categories
    ADD CONSTRAINT equipment_categories_pkey PRIMARY KEY (id);


--
-- Name: equipment equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_pkey PRIMARY KEY (id);


--
-- Name: factory_reset_requests factory_reset_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factory_reset_requests
    ADD CONSTRAINT factory_reset_requests_pkey PRIMARY KEY (id);


--
-- Name: gitlab_ticket_links gitlab_ticket_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gitlab_ticket_links
    ADD CONSTRAINT gitlab_ticket_links_pkey PRIMARY KEY (id);


--
-- Name: holidays holidays_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.holidays
    ADD CONSTRAINT holidays_date_key UNIQUE (date);


--
-- Name: holidays holidays_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.holidays
    ADD CONSTRAINT holidays_pkey PRIMARY KEY (id);


--
-- Name: infrastructure_map_versions infrastructure_map_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.infrastructure_map_versions
    ADD CONSTRAINT infrastructure_map_versions_pkey PRIMARY KEY (id);


--
-- Name: infrastructure_maps infrastructure_maps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.infrastructure_maps
    ADD CONSTRAINT infrastructure_maps_pkey PRIMARY KEY (id);


--
-- Name: integration_settings integration_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integration_settings
    ADD CONSTRAINT integration_settings_key_key UNIQUE (key);


--
-- Name: integration_settings integration_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integration_settings
    ADD CONSTRAINT integration_settings_pkey PRIMARY KEY (id);


--
-- Name: item_aliases item_aliases_host_id_item_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_aliases
    ADD CONSTRAINT item_aliases_host_id_item_key_key UNIQUE (host_id, item_key);


--
-- Name: item_aliases item_aliases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_aliases
    ADD CONSTRAINT item_aliases_pkey PRIMARY KEY (id);


--
-- Name: maintenance_protocols maintenance_protocols_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_protocols
    ADD CONSTRAINT maintenance_protocols_pkey PRIMARY KEY (id);


--
-- Name: maintenance_schedules maintenance_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_schedules
    ADD CONSTRAINT maintenance_schedules_pkey PRIMARY KEY (id);


--
-- Name: maintenance_tasks maintenance_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_tasks
    ADD CONSTRAINT maintenance_tasks_pkey PRIMARY KEY (id);


--
-- Name: metric_translations metric_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metric_translations
    ADD CONSTRAINT metric_translations_pkey PRIMARY KEY (id);


--
-- Name: monitored_hosts monitored_hosts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monitored_hosts
    ADD CONSTRAINT monitored_hosts_pkey PRIMARY KEY (id);


--
-- Name: monitoring_host_links monitoring_host_links_equipment_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monitoring_host_links
    ADD CONSTRAINT monitoring_host_links_equipment_id_key UNIQUE (equipment_id);


--
-- Name: monitoring_host_links monitoring_host_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monitoring_host_links
    ADD CONSTRAINT monitoring_host_links_pkey PRIMARY KEY (id);


--
-- Name: monitoring_host_links monitoring_host_links_zabbix_host_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monitoring_host_links
    ADD CONSTRAINT monitoring_host_links_zabbix_host_id_key UNIQUE (zabbix_host_id);


--
-- Name: notification_channels notification_channels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_channels
    ADD CONSTRAINT notification_channels_pkey PRIMARY KEY (id);


--
-- Name: notification_log notification_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_log
    ADD CONSTRAINT notification_log_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (user_id);


--
-- Name: notification_queue notification_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_queue
    ADD CONSTRAINT notification_queue_pkey PRIMARY KEY (id);


--
-- Name: notification_subscriptions notification_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_subscriptions
    ADD CONSTRAINT notification_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: notification_subscriptions notification_subscriptions_user_id_event_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_subscriptions
    ADD CONSTRAINT notification_subscriptions_user_id_event_type_key UNIQUE (user_id, event_type);


--
-- Name: organizations organizations_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_name_key UNIQUE (name);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: protocol_items protocol_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.protocol_items
    ADD CONSTRAINT protocol_items_pkey PRIMARY KEY (id);


--
-- Name: protocol_templates protocol_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.protocol_templates
    ADD CONSTRAINT protocol_templates_pkey PRIMARY KEY (id);


--
-- Name: saved_graphs saved_graphs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_graphs
    ADD CONSTRAINT saved_graphs_pkey PRIMARY KEY (id);


--
-- Name: sites sites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_pkey PRIMARY KEY (id);


--
-- Name: support_scheme_lines support_scheme_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_scheme_lines
    ADD CONSTRAINT support_scheme_lines_pkey PRIMARY KEY (id);


--
-- Name: support_schemes support_schemes_organization_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_schemes
    ADD CONSTRAINT support_schemes_organization_id_key UNIQUE (organization_id);


--
-- Name: support_schemes support_schemes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_schemes
    ADD CONSTRAINT support_schemes_pkey PRIMARY KEY (id);


--
-- Name: system_kill_log system_kill_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_kill_log
    ADD CONSTRAINT system_kill_log_pkey PRIMARY KEY (id);


--
-- Name: ticket_ai_analyses ticket_ai_analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_ai_analyses
    ADD CONSTRAINT ticket_ai_analyses_pkey PRIMARY KEY (id);


--
-- Name: ticket_ai_analyses ticket_ai_analyses_ticket_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_ai_analyses
    ADD CONSTRAINT ticket_ai_analyses_ticket_id_key UNIQUE (ticket_id);


--
-- Name: ticket_comment_reactions ticket_comment_reactions_comment_id_user_id_emoji_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comment_reactions
    ADD CONSTRAINT ticket_comment_reactions_comment_id_user_id_emoji_key UNIQUE (comment_id, user_id, emoji);


--
-- Name: ticket_comment_reactions ticket_comment_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comment_reactions
    ADD CONSTRAINT ticket_comment_reactions_pkey PRIMARY KEY (id);


--
-- Name: ticket_comments ticket_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_pkey PRIMARY KEY (id);


--
-- Name: ticket_links ticket_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_links
    ADD CONSTRAINT ticket_links_pkey PRIMARY KEY (id);


--
-- Name: ticket_links ticket_links_source_ticket_id_target_ticket_id_kind_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_links
    ADD CONSTRAINT ticket_links_source_ticket_id_target_ticket_id_kind_key UNIQUE (source_ticket_id, target_ticket_id, kind);


--
-- Name: ticket_status_history ticket_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_status_history
    ADD CONSTRAINT ticket_status_history_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: tz_coverage tz_coverage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tz_coverage
    ADD CONSTRAINT tz_coverage_pkey PRIMARY KEY (id);


--
-- Name: tz_requirements tz_requirements_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tz_requirements
    ADD CONSTRAINT tz_requirements_code_key UNIQUE (code);


--
-- Name: tz_requirements tz_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tz_requirements
    ADD CONSTRAINT tz_requirements_pkey PRIMARY KEY (id);


--
-- Name: user_dashboard_widgets user_dashboard_widgets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_dashboard_widgets
    ADD CONSTRAINT user_dashboard_widgets_pkey PRIMARY KEY (id);


--
-- Name: user_favorite_metrics user_favorite_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorite_metrics
    ADD CONSTRAINT user_favorite_metrics_pkey PRIMARY KEY (id);


--
-- Name: user_favorite_metrics user_favorite_metrics_user_id_itemid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorite_metrics
    ADD CONSTRAINT user_favorite_metrics_user_id_itemid_key UNIQUE (user_id, itemid);


--
-- Name: user_metric_preferences user_metric_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_metric_preferences
    ADD CONSTRAINT user_metric_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_metric_preferences user_metric_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_metric_preferences
    ADD CONSTRAINT user_metric_preferences_user_id_key UNIQUE (user_id);


--
-- Name: user_module_permissions user_module_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_module_permissions
    ADD CONSTRAINT user_module_permissions_pkey PRIMARY KEY (id);


--
-- Name: user_module_permissions user_module_permissions_user_id_module_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_module_permissions
    ADD CONSTRAINT user_module_permissions_user_id_module_key_key UNIQUE (user_id, module_key);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: zabbix_connections zabbix_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zabbix_connections
    ADD CONSTRAINT zabbix_connections_pkey PRIMARY KEY (id);


--
-- Name: zabbix_template_library zabbix_template_library_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zabbix_template_library
    ADD CONSTRAINT zabbix_template_library_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: idx_alert_thresholds_host; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alert_thresholds_host ON public.alert_thresholds USING btree (host_id);


--
-- Name: idx_alert_thresholds_item_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alert_thresholds_item_key ON public.alert_thresholds USING btree (item_key);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_module; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_module ON public.audit_logs USING btree (module);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_automation_logs_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_automation_logs_created ON public.automation_logs USING btree (created_at DESC);


--
-- Name: idx_contracts_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_active ON public.contracts USING btree (is_active, start_date);


--
-- Name: idx_contracts_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_org ON public.contracts USING btree (organization_id);


--
-- Name: idx_documents_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_category ON public.documents USING btree (doc_category);


--
-- Name: idx_documents_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_org ON public.documents USING btree (organization_id);


--
-- Name: idx_equipment_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_equipment_org ON public.equipment USING btree (organization_id);


--
-- Name: idx_gitlab_links_ticket; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gitlab_links_ticket ON public.gitlab_ticket_links USING btree (ticket_id);


--
-- Name: idx_holidays_country_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_holidays_country_year ON public.holidays USING btree (country_code, date);


--
-- Name: idx_holidays_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_holidays_date ON public.holidays USING btree (date);


--
-- Name: idx_hosts_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hosts_org ON public.monitored_hosts USING btree (organization_id);


--
-- Name: idx_hosts_zbx_conn; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hosts_zbx_conn ON public.monitored_hosts USING btree (zabbix_connection_id);


--
-- Name: idx_imv_map_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_imv_map_id ON public.infrastructure_map_versions USING btree (map_id, created_at DESC);


--
-- Name: idx_item_aliases_host; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_item_aliases_host ON public.item_aliases USING btree (host_id);


--
-- Name: idx_metric_translations_pattern; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_metric_translations_pattern ON public.metric_translations USING btree (key_pattern);


--
-- Name: idx_metric_translations_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_metric_translations_priority ON public.metric_translations USING btree (priority);


--
-- Name: idx_monitoring_host_links_equipment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_monitoring_host_links_equipment ON public.monitoring_host_links USING btree (equipment_id);


--
-- Name: idx_monitoring_host_links_zabbix; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_monitoring_host_links_zabbix ON public.monitoring_host_links USING btree (zabbix_host_id);


--
-- Name: idx_mtasks_equipment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mtasks_equipment ON public.maintenance_tasks USING btree (equipment_id);


--
-- Name: idx_mtasks_freq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mtasks_freq ON public.maintenance_tasks USING btree (frequency);


--
-- Name: idx_mtasks_site; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mtasks_site ON public.maintenance_tasks USING btree (site_id);


--
-- Name: idx_notif_channels_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_channels_user ON public.notification_channels USING btree (user_id);


--
-- Name: idx_notif_log_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_log_status ON public.notification_log USING btree (status) WHERE (status = ANY (ARRAY['pending'::text, 'failed'::text]));


--
-- Name: idx_notif_log_unread; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_log_unread ON public.notification_log USING btree (user_id, is_read) WHERE (is_read = false);


--
-- Name: idx_notif_log_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_log_user ON public.notification_log USING btree (user_id, created_at DESC);


--
-- Name: idx_notif_queue_due; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_queue_due ON public.notification_queue USING btree (scheduled_for) WHERE (status = 'queued'::text);


--
-- Name: idx_notif_subs_event; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_subs_event ON public.notification_subscriptions USING btree (event_type) WHERE (enabled = true);


--
-- Name: idx_notif_subs_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_subs_user ON public.notification_subscriptions USING btree (user_id);


--
-- Name: idx_protocols_ticket_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_protocols_ticket_id ON public.maintenance_protocols USING btree (ticket_id);


--
-- Name: idx_saved_graphs_shared; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_saved_graphs_shared ON public.saved_graphs USING btree (is_shared) WHERE (is_shared = true);


--
-- Name: idx_saved_graphs_template; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_saved_graphs_template ON public.saved_graphs USING btree (is_template) WHERE (is_template = true);


--
-- Name: idx_saved_graphs_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_saved_graphs_user ON public.saved_graphs USING btree (user_id);


--
-- Name: idx_sites_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sites_org ON public.sites USING btree (organization_id);


--
-- Name: idx_support_scheme_lines_scheme; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_support_scheme_lines_scheme ON public.support_scheme_lines USING btree (scheme_id, "position");


--
-- Name: idx_tcr_comment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tcr_comment ON public.ticket_comment_reactions USING btree (comment_id);


--
-- Name: idx_ticket_status_history_ticket_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_status_history_ticket_id ON public.ticket_status_history USING btree (ticket_id);


--
-- Name: idx_tickets_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_org ON public.tickets USING btree (organization_id);


--
-- Name: idx_tl_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tl_source ON public.ticket_links USING btree (source_ticket_id);


--
-- Name: idx_tl_target; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tl_target ON public.ticket_links USING btree (target_ticket_id);


--
-- Name: idx_tz_coverage_host; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tz_coverage_host ON public.tz_coverage USING btree (host_id);


--
-- Name: idx_tz_coverage_req; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tz_coverage_req ON public.tz_coverage USING btree (requirement_id);


--
-- Name: idx_user_favorite_metrics_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_favorite_metrics_user ON public.user_favorite_metrics USING btree (user_id, "position");


--
-- Name: idx_widgets_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_widgets_user ON public.user_dashboard_widgets USING btree (user_id);


--
-- Name: item_aliases_item_key_global_uniq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX item_aliases_item_key_global_uniq ON public.item_aliases USING btree (item_key) WHERE (host_id IS NULL);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--
-- Name: zabbix_connections trg_archive_hosts_on_conn_delete; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_archive_hosts_on_conn_delete BEFORE DELETE ON public.zabbix_connections FOR EACH ROW EXECUTE FUNCTION public.archive_monitored_hosts_on_conn_delete();


--
-- Name: factory_reset_requests trg_factory_reset_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_factory_reset_updated BEFORE UPDATE ON public.factory_reset_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: gitlab_ticket_links trg_gitlab_links_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_gitlab_links_updated_at BEFORE UPDATE ON public.gitlab_ticket_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: integration_settings trg_integration_settings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_integration_settings_updated_at BEFORE UPDATE ON public.integration_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: item_aliases trg_item_aliases_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_item_aliases_updated BEFORE UPDATE ON public.item_aliases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: metric_translations trg_metric_translations_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_metric_translations_updated BEFORE UPDATE ON public.metric_translations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: maintenance_tasks trg_mtasks_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_mtasks_updated BEFORE UPDATE ON public.maintenance_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notification_channels trg_notif_channels_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_notif_channels_updated BEFORE UPDATE ON public.notification_channels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notification_preferences trg_notif_prefs_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_notif_prefs_updated BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notification_queue trg_notif_queue_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_notif_queue_updated BEFORE UPDATE ON public.notification_queue FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notification_subscriptions trg_notif_subs_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_notif_subs_updated BEFORE UPDATE ON public.notification_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: protocol_templates trg_protocol_templates_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_protocol_templates_updated BEFORE UPDATE ON public.protocol_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tz_coverage trg_tz_cov_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_tz_cov_updated BEFORE UPDATE ON public.tz_coverage FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tz_requirements trg_tz_req_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_tz_req_updated BEFORE UPDATE ON public.tz_requirements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_metric_preferences trg_user_metric_prefs_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_user_metric_prefs_updated BEFORE UPDATE ON public.user_metric_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_dashboard_widgets trg_widgets_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_widgets_updated BEFORE UPDATE ON public.user_dashboard_widgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: zabbix_template_library trg_zabbix_tpl_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_zabbix_tpl_updated_at BEFORE UPDATE ON public.zabbix_template_library FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: alert_thresholds update_alert_thresholds_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_alert_thresholds_updated_at BEFORE UPDATE ON public.alert_thresholds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contracts update_contracts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: documents update_documents_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: equipment update_equipment_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: holidays update_holidays_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON public.holidays FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: infrastructure_maps update_infrastructure_maps_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_infrastructure_maps_updated_at BEFORE UPDATE ON public.infrastructure_maps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: monitored_hosts update_monitored_hosts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_monitored_hosts_updated_at BEFORE UPDATE ON public.monitored_hosts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: monitoring_host_links update_monitoring_host_links_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_monitoring_host_links_updated_at BEFORE UPDATE ON public.monitoring_host_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: organizations update_organizations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: maintenance_protocols update_protocols_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_protocols_updated_at BEFORE UPDATE ON public.maintenance_protocols FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: saved_graphs update_saved_graphs_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_saved_graphs_updated_at BEFORE UPDATE ON public.saved_graphs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sites update_sites_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON public.sites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: support_scheme_lines update_support_scheme_lines_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_support_scheme_lines_updated_at BEFORE UPDATE ON public.support_scheme_lines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: support_schemes update_support_schemes_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_support_schemes_updated_at BEFORE UPDATE ON public.support_schemes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ticket_ai_analyses update_ticket_ai_analyses_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_ticket_ai_analyses_updated_at BEFORE UPDATE ON public.ticket_ai_analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tickets update_tickets_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: zabbix_connections update_zabbix_connections_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_zabbix_connections_updated_at BEFORE UPDATE ON public.zabbix_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: alert_thresholds alert_thresholds_host_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_thresholds
    ADD CONSTRAINT alert_thresholds_host_id_fkey FOREIGN KEY (host_id) REFERENCES public.monitored_hosts(id) ON DELETE CASCADE;


--
-- Name: contracts contracts_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: documents documents_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: documents documents_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE SET NULL;


--
-- Name: equipment equipment_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.equipment_categories(id);


--
-- Name: equipment equipment_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: equipment equipment_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: item_aliases item_aliases_host_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_aliases
    ADD CONSTRAINT item_aliases_host_id_fkey FOREIGN KEY (host_id) REFERENCES public.monitored_hosts(id) ON DELETE CASCADE;


--
-- Name: maintenance_protocols maintenance_protocols_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_protocols
    ADD CONSTRAINT maintenance_protocols_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES auth.users(id);


--
-- Name: maintenance_protocols maintenance_protocols_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_protocols
    ADD CONSTRAINT maintenance_protocols_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- Name: maintenance_protocols maintenance_protocols_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_protocols
    ADD CONSTRAINT maintenance_protocols_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: maintenance_protocols maintenance_protocols_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_protocols
    ADD CONSTRAINT maintenance_protocols_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id);


--
-- Name: maintenance_protocols maintenance_protocols_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_protocols
    ADD CONSTRAINT maintenance_protocols_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.protocol_templates(id) ON DELETE SET NULL;


--
-- Name: maintenance_protocols maintenance_protocols_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_protocols
    ADD CONSTRAINT maintenance_protocols_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE SET NULL;


--
-- Name: maintenance_schedules maintenance_schedules_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_schedules
    ADD CONSTRAINT maintenance_schedules_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id);


--
-- Name: maintenance_schedules maintenance_schedules_equipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_schedules
    ADD CONSTRAINT maintenance_schedules_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE;


--
-- Name: maintenance_schedules maintenance_schedules_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_schedules
    ADD CONSTRAINT maintenance_schedules_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.maintenance_tasks(id) ON DELETE CASCADE;


--
-- Name: maintenance_tasks maintenance_tasks_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_tasks
    ADD CONSTRAINT maintenance_tasks_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.equipment_categories(id);


--
-- Name: maintenance_tasks maintenance_tasks_equipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_tasks
    ADD CONSTRAINT maintenance_tasks_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE;


--
-- Name: maintenance_tasks maintenance_tasks_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_tasks
    ADD CONSTRAINT maintenance_tasks_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: maintenance_tasks maintenance_tasks_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_tasks
    ADD CONSTRAINT maintenance_tasks_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: monitored_hosts monitored_hosts_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monitored_hosts
    ADD CONSTRAINT monitored_hosts_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: monitored_hosts monitored_hosts_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monitored_hosts
    ADD CONSTRAINT monitored_hosts_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE SET NULL;


--
-- Name: monitored_hosts monitored_hosts_zabbix_connection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monitored_hosts
    ADD CONSTRAINT monitored_hosts_zabbix_connection_id_fkey FOREIGN KEY (zabbix_connection_id) REFERENCES public.zabbix_connections(id);


--
-- Name: monitoring_host_links monitoring_host_links_equipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monitoring_host_links
    ADD CONSTRAINT monitoring_host_links_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: protocol_items protocol_items_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.protocol_items
    ADD CONSTRAINT protocol_items_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES auth.users(id);


--
-- Name: protocol_items protocol_items_equipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.protocol_items
    ADD CONSTRAINT protocol_items_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: protocol_items protocol_items_protocol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.protocol_items
    ADD CONSTRAINT protocol_items_protocol_id_fkey FOREIGN KEY (protocol_id) REFERENCES public.maintenance_protocols(id) ON DELETE CASCADE;


--
-- Name: protocol_items protocol_items_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.protocol_items
    ADD CONSTRAINT protocol_items_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.maintenance_schedules(id);


--
-- Name: protocol_items protocol_items_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.protocol_items
    ADD CONSTRAINT protocol_items_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.maintenance_tasks(id);


--
-- Name: protocol_templates protocol_templates_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.protocol_templates
    ADD CONSTRAINT protocol_templates_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL;


--
-- Name: protocol_templates protocol_templates_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.protocol_templates
    ADD CONSTRAINT protocol_templates_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: protocol_templates protocol_templates_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.protocol_templates
    ADD CONSTRAINT protocol_templates_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;


--
-- Name: sites sites_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: support_scheme_lines support_scheme_lines_scheme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_scheme_lines
    ADD CONSTRAINT support_scheme_lines_scheme_id_fkey FOREIGN KEY (scheme_id) REFERENCES public.support_schemes(id) ON DELETE CASCADE;


--
-- Name: support_schemes support_schemes_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_schemes
    ADD CONSTRAINT support_schemes_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: ticket_comment_reactions ticket_comment_reactions_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comment_reactions
    ADD CONSTRAINT ticket_comment_reactions_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.ticket_comments(id) ON DELETE CASCADE;


--
-- Name: ticket_comments ticket_comments_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: ticket_comments ticket_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: ticket_status_history ticket_status_history_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_status_history
    ADD CONSTRAINT ticket_status_history_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: tickets tickets_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id);


--
-- Name: tickets tickets_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: tickets tickets_equipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: tickets tickets_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: tickets tickets_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id);


--
-- Name: tz_coverage tz_coverage_host_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tz_coverage
    ADD CONSTRAINT tz_coverage_host_id_fkey FOREIGN KEY (host_id) REFERENCES public.monitored_hosts(id) ON DELETE SET NULL;


--
-- Name: tz_coverage tz_coverage_requirement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tz_coverage
    ADD CONSTRAINT tz_coverage_requirement_id_fkey FOREIGN KEY (requirement_id) REFERENCES public.tz_requirements(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: zabbix_connections zabbix_connections_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zabbix_connections
    ADD CONSTRAINT zabbix_connections_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: automation_logs Admins can manage automation logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage automation logs" ON public.automation_logs USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: equipment_categories Admins can manage categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage categories" ON public.equipment_categories USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ticket_comments Admins can manage comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage comments" ON public.ticket_comments USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: documents Admins can manage documents; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage documents" ON public.documents USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: equipment Admins can manage equipment; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage equipment" ON public.equipment USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: item_aliases Admins can manage item aliases; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage item aliases" ON public.item_aliases USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_module_permissions Admins can manage module permissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage module permissions" ON public.user_module_permissions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: monitored_hosts Admins can manage monitored hosts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage monitored hosts" ON public.monitored_hosts USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: protocol_items Admins can manage protocol items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage protocol items" ON public.protocol_items USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: maintenance_protocols Admins can manage protocols; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage protocols" ON public.maintenance_protocols USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: maintenance_schedules Admins can manage schedules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage schedules" ON public.maintenance_schedules USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: sites Admins can manage sites; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage sites" ON public.sites USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: maintenance_tasks Admins can manage tasks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage tasks" ON public.maintenance_tasks USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: tickets Admins can manage tickets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage tickets" ON public.tickets USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can update all profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ticket_comments Admins can view all comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all comments" ON public.ticket_comments FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ticket_status_history Admins can view all status history; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all status history" ON public.ticket_status_history FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: tickets Admins can view all tickets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all tickets" ON public.tickets FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: audit_logs Admins can view audit logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: tz_coverage Admins manage TZ coverage; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage TZ coverage" ON public.tz_coverage USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: tz_requirements Admins manage TZ requirements; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage TZ requirements" ON public.tz_requirements USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: saved_graphs Admins manage all graphs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage all graphs" ON public.saved_graphs USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: contracts Admins manage contracts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage contracts" ON public.contracts USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: gitlab_ticket_links Admins manage gitlab links; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage gitlab links" ON public.gitlab_ticket_links USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: holidays Admins manage holidays; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage holidays" ON public.holidays USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: monitoring_host_links Admins manage host links; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage host links" ON public.monitoring_host_links USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: infrastructure_maps Admins manage infra maps; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage infra maps" ON public.infrastructure_maps USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: integration_settings Admins manage integration settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage integration settings" ON public.integration_settings USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: organizations Admins manage orgs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage orgs" ON public.organizations USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: notification_queue Admins manage queue; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage queue" ON public.notification_queue USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: factory_reset_requests Admins manage reset requests; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage reset requests" ON public.factory_reset_requests USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: support_scheme_lines Admins manage scheme lines; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage scheme lines" ON public.support_scheme_lines TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: support_schemes Admins manage schemes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage schemes" ON public.support_schemes TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: protocol_templates Admins manage templates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage templates" ON public.protocol_templates USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: zabbix_template_library Admins manage templates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage templates" ON public.zabbix_template_library USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: alert_thresholds Admins manage thresholds; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage thresholds" ON public.alert_thresholds USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: metric_translations Admins manage translations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage translations" ON public.metric_translations USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: zabbix_connections Admins manage zabbix connections; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage zabbix connections" ON public.zabbix_connections USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: notification_channels Admins view all channels; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins view all channels" ON public.notification_channels FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: notification_log Admins view all log; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins view all log" ON public.notification_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: notification_preferences Admins view all prefs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins view all prefs" ON public.notification_preferences FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: notification_subscriptions Admins view all subs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins view all subs" ON public.notification_subscriptions FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_dashboard_widgets Admins view all widgets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins view all widgets" ON public.user_dashboard_widgets FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: system_kill_log Admins view kill log; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins view kill log" ON public.system_kill_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: zabbix_connections Admins view zabbix connections; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins view zabbix connections" ON public.zabbix_connections FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'engineer'::public.app_role)));


--
-- Name: ticket_comments Authenticated can create comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated can create comments" ON public.ticket_comments FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: tickets Authenticated can create tickets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated can create tickets" ON public.tickets FOR INSERT TO authenticated WITH CHECK ((auth.uid() = created_by));


--
-- Name: audit_logs Authenticated can insert audit logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: ticket_status_history Authenticated can insert status history; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated can insert status history" ON public.ticket_status_history FOR INSERT TO authenticated WITH CHECK ((auth.uid() = changed_by));


--
-- Name: automation_logs Authenticated can view automation logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated can view automation logs" ON public.automation_logs FOR SELECT TO authenticated USING (true);


--
-- Name: equipment_categories Authenticated can view categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated can view categories" ON public.equipment_categories FOR SELECT TO authenticated USING (true);


--
-- Name: documents Authenticated can view documents; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated can view documents" ON public.documents FOR SELECT TO authenticated USING (true);


--
-- Name: equipment Authenticated can view equipment; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated can view equipment" ON public.equipment FOR SELECT TO authenticated USING (true);


--
-- Name: item_aliases Authenticated can view item aliases; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated can view item aliases" ON public.item_aliases FOR SELECT TO authenticated USING (true);


--
-- Name: monitored_hosts Authenticated can view monitored hosts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated can view monitored hosts" ON public.monitored_hosts FOR SELECT TO authenticated USING (true);


--
-- Name: protocol_items Authenticated can view protocol items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated can view protocol items" ON public.protocol_items FOR SELECT TO authenticated USING (true);


--
-- Name: maintenance_protocols Authenticated can view protocols; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated can view protocols" ON public.maintenance_protocols FOR SELECT TO authenticated USING (true);


--
-- Name: maintenance_schedules Authenticated can view schedules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated can view schedules" ON public.maintenance_schedules FOR SELECT TO authenticated USING (true);


--
-- Name: sites Authenticated can view sites; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated can view sites" ON public.sites FOR SELECT TO authenticated USING (true);


--
-- Name: maintenance_tasks Authenticated can view tasks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated can view tasks" ON public.maintenance_tasks FOR SELECT TO authenticated USING (true);


--
-- Name: tz_coverage Authenticated view TZ coverage; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated view TZ coverage" ON public.tz_coverage FOR SELECT TO authenticated USING (true);


--
-- Name: tz_requirements Authenticated view TZ requirements; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated view TZ requirements" ON public.tz_requirements FOR SELECT TO authenticated USING (true);


--
-- Name: contracts Authenticated view contracts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated view contracts" ON public.contracts FOR SELECT TO authenticated USING (true);


--
-- Name: gitlab_ticket_links Authenticated view gitlab links; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated view gitlab links" ON public.gitlab_ticket_links FOR SELECT TO authenticated USING (true);


--
-- Name: holidays Authenticated view holidays; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated view holidays" ON public.holidays FOR SELECT TO authenticated USING (true);


--
-- Name: monitoring_host_links Authenticated view host links; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated view host links" ON public.monitoring_host_links FOR SELECT TO authenticated USING (true);


--
-- Name: infrastructure_maps Authenticated view infra maps; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated view infra maps" ON public.infrastructure_maps FOR SELECT TO authenticated USING (true);


--
-- Name: infrastructure_map_versions Authenticated view map versions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated view map versions" ON public.infrastructure_map_versions FOR SELECT TO authenticated USING (true);


--
-- Name: organizations Authenticated view orgs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated view orgs" ON public.organizations FOR SELECT TO authenticated USING (true);


--
-- Name: ticket_comment_reactions Authenticated view reactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated view reactions" ON public.ticket_comment_reactions FOR SELECT TO authenticated USING (true);


--
-- Name: support_scheme_lines Authenticated view scheme lines; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated view scheme lines" ON public.support_scheme_lines FOR SELECT TO authenticated USING (true);


--
-- Name: support_schemes Authenticated view schemes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated view schemes" ON public.support_schemes FOR SELECT TO authenticated USING (true);


--
-- Name: zabbix_template_library Authenticated view templates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated view templates" ON public.zabbix_template_library FOR SELECT TO authenticated USING (true);


--
-- Name: alert_thresholds Authenticated view thresholds; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated view thresholds" ON public.alert_thresholds FOR SELECT TO authenticated USING (true);


--
-- Name: ticket_links Authenticated view ticket links; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated view ticket links" ON public.ticket_links FOR SELECT TO authenticated USING (true);


--
-- Name: metric_translations Authenticated view translations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated view translations" ON public.metric_translations FOR SELECT TO authenticated USING (true);


--
-- Name: automation_logs Engineers can manage automation logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers can manage automation logs" ON public.automation_logs USING (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: documents Engineers can manage documents; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers can manage documents" ON public.documents USING (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: equipment Engineers can manage equipment; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers can manage equipment" ON public.equipment USING (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: item_aliases Engineers can manage item aliases; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers can manage item aliases" ON public.item_aliases USING (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: monitored_hosts Engineers can manage monitored hosts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers can manage monitored hosts" ON public.monitored_hosts USING (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: protocol_items Engineers can manage protocol items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers can manage protocol items" ON public.protocol_items USING (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: maintenance_protocols Engineers can manage protocols; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers can manage protocols" ON public.maintenance_protocols USING (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: maintenance_schedules Engineers can manage schedules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers can manage schedules" ON public.maintenance_schedules USING (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: sites Engineers can manage sites; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers can manage sites" ON public.sites USING (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: maintenance_tasks Engineers can manage tasks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers can manage tasks" ON public.maintenance_tasks USING (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: tickets Engineers can update tickets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers can update tickets" ON public.tickets FOR UPDATE USING (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: ticket_comments Engineers can view all comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers can view all comments" ON public.ticket_comments FOR SELECT USING (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: profiles Engineers can view all profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: ticket_status_history Engineers can view all status history; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers can view all status history" ON public.ticket_status_history FOR SELECT USING (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: tickets Engineers can view all tickets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers can view all tickets" ON public.tickets FOR SELECT USING (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: tz_coverage Engineers manage TZ coverage; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers manage TZ coverage" ON public.tz_coverage USING (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: tz_requirements Engineers manage TZ requirements; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers manage TZ requirements" ON public.tz_requirements USING (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: gitlab_ticket_links Engineers manage gitlab links; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers manage gitlab links" ON public.gitlab_ticket_links USING (public.has_role(auth.uid(), 'engineer'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: holidays Engineers manage holidays; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers manage holidays" ON public.holidays USING (public.has_role(auth.uid(), 'engineer'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: monitoring_host_links Engineers manage host links; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers manage host links" ON public.monitoring_host_links USING (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: infrastructure_maps Engineers manage infra maps; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers manage infra maps" ON public.infrastructure_maps USING (public.has_role(auth.uid(), 'engineer'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: saved_graphs Engineers manage shared and templates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers manage shared and templates" ON public.saved_graphs USING (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: protocol_templates Engineers manage templates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers manage templates" ON public.protocol_templates USING (public.has_role(auth.uid(), 'engineer'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: zabbix_template_library Engineers manage templates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers manage templates" ON public.zabbix_template_library USING (public.has_role(auth.uid(), 'engineer'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: alert_thresholds Engineers manage thresholds; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers manage thresholds" ON public.alert_thresholds USING (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: metric_translations Engineers manage translations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers manage translations" ON public.metric_translations USING (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: integration_settings Engineers view integration settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Engineers view integration settings" ON public.integration_settings FOR SELECT USING (public.has_role(auth.uid(), 'engineer'::public.app_role));


--
-- Name: infrastructure_map_versions Staff create map versions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Staff create map versions" ON public.infrastructure_map_versions FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'engineer'::public.app_role)));


--
-- Name: infrastructure_map_versions Staff delete map versions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Staff delete map versions" ON public.infrastructure_map_versions FOR DELETE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'engineer'::public.app_role)));


--
-- Name: ticket_links Staff manage ticket links; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Staff manage ticket links" ON public.ticket_links TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'engineer'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'engineer'::public.app_role)));


--
-- Name: ticket_ai_analyses Staff read analyses; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Staff read analyses" ON public.ticket_ai_analyses FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'engineer'::public.app_role)));


--
-- Name: ticket_ai_analyses Staff write analyses; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Staff write analyses" ON public.ticket_ai_analyses TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'engineer'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'engineer'::public.app_role)));


--
-- Name: ticket_comment_reactions Users add own reactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users add own reactions" ON public.ticket_comment_reactions FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: contracts Users can view all active contracts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view all active contracts" ON public.contracts FOR SELECT USING (true);


--
-- Name: ticket_comments Users can view non-internal comments on own tickets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view non-internal comments on own tickets" ON public.ticket_comments FOR SELECT USING (((NOT is_internal) AND (EXISTS ( SELECT 1
   FROM public.tickets
  WHERE ((tickets.id = ticket_comments.ticket_id) AND (tickets.created_by = auth.uid()))))));


--
-- Name: user_module_permissions Users can view own permissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own permissions" ON public.user_module_permissions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ticket_status_history Users can view own ticket history; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own ticket history" ON public.ticket_status_history FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.tickets
  WHERE ((tickets.id = ticket_status_history.ticket_id) AND (tickets.created_by = auth.uid())))));


--
-- Name: tickets Users can view own tickets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own tickets" ON public.tickets FOR SELECT USING ((auth.uid() = created_by));


--
-- Name: notification_channels Users manage own channels; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own channels" ON public.notification_channels USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_favorite_metrics Users manage own favorite metrics; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own favorite metrics" ON public.user_favorite_metrics USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: saved_graphs Users manage own graphs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own graphs" ON public.saved_graphs USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_metric_preferences Users manage own metric prefs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own metric prefs" ON public.user_metric_preferences USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: notification_preferences Users manage own prefs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own prefs" ON public.notification_preferences USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: notification_subscriptions Users manage own subs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own subs" ON public.notification_subscriptions USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_dashboard_widgets Users manage own widgets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users manage own widgets" ON public.user_dashboard_widgets USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: notification_log Users mark own notifications read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users mark own notifications read" ON public.notification_log FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: ticket_comment_reactions Users remove own reactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users remove own reactions" ON public.ticket_comment_reactions FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: saved_graphs Users view own and shared graphs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users view own and shared graphs" ON public.saved_graphs FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR (is_shared = true) OR (is_template = true)));


--
-- Name: notification_log Users view own log; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users view own log" ON public.notification_log FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notification_queue Users view own queue; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users view own queue" ON public.notification_queue FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: protocol_templates View templates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "View templates" ON public.protocol_templates FOR SELECT TO authenticated USING (true);


--
-- Name: alert_thresholds; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.alert_thresholds ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: automation_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: contracts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

--
-- Name: documents; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

--
-- Name: equipment; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

--
-- Name: equipment_categories; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.equipment_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: factory_reset_requests; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.factory_reset_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: gitlab_ticket_links; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.gitlab_ticket_links ENABLE ROW LEVEL SECURITY;

--
-- Name: holidays; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

--
-- Name: infrastructure_map_versions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.infrastructure_map_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: infrastructure_maps; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.infrastructure_maps ENABLE ROW LEVEL SECURITY;

--
-- Name: integration_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: item_aliases; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.item_aliases ENABLE ROW LEVEL SECURITY;

--
-- Name: maintenance_protocols; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.maintenance_protocols ENABLE ROW LEVEL SECURITY;

--
-- Name: maintenance_schedules; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: maintenance_tasks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: metric_translations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.metric_translations ENABLE ROW LEVEL SECURITY;

--
-- Name: monitored_hosts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.monitored_hosts ENABLE ROW LEVEL SECURITY;

--
-- Name: monitoring_host_links; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.monitoring_host_links ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_channels; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notification_channels ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_log; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_preferences; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_queue; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_subscriptions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notification_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: organizations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: protocol_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.protocol_items ENABLE ROW LEVEL SECURITY;

--
-- Name: protocol_templates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.protocol_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: saved_graphs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.saved_graphs ENABLE ROW LEVEL SECURITY;

--
-- Name: sites; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

--
-- Name: support_scheme_lines; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.support_scheme_lines ENABLE ROW LEVEL SECURITY;

--
-- Name: support_schemes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.support_schemes ENABLE ROW LEVEL SECURITY;

--
-- Name: system_kill_log; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.system_kill_log ENABLE ROW LEVEL SECURITY;

--
-- Name: ticket_ai_analyses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ticket_ai_analyses ENABLE ROW LEVEL SECURITY;

--
-- Name: ticket_comment_reactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ticket_comment_reactions ENABLE ROW LEVEL SECURITY;

--
-- Name: ticket_comments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: ticket_links; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ticket_links ENABLE ROW LEVEL SECURITY;

--
-- Name: ticket_status_history; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ticket_status_history ENABLE ROW LEVEL SECURITY;

--
-- Name: tickets; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: tz_coverage; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tz_coverage ENABLE ROW LEVEL SECURITY;

--
-- Name: tz_requirements; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tz_requirements ENABLE ROW LEVEL SECURITY;

--
-- Name: user_dashboard_widgets; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_dashboard_widgets ENABLE ROW LEVEL SECURITY;

--
-- Name: user_favorite_metrics; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_favorite_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: user_metric_preferences; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_metric_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: user_module_permissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: zabbix_connections; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.zabbix_connections ENABLE ROW LEVEL SECURITY;

--
-- Name: zabbix_template_library; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.zabbix_template_library ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Admins can delete document files; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Admins can delete document files" ON storage.objects FOR DELETE USING (((bucket_id = 'documents'::text) AND public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: objects Admins can upload document files; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Admins can upload document files" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'documents'::text) AND public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: objects Admins view all signatures; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Admins view all signatures" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'signatures'::text) AND public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: objects Authenticated can view document files; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Authenticated can view document files" ON storage.objects FOR SELECT TO authenticated USING ((bucket_id = 'documents'::text));


--
-- Name: objects Engineers can delete document files; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Engineers can delete document files" ON storage.objects FOR DELETE USING (((bucket_id = 'documents'::text) AND public.has_role(auth.uid(), 'engineer'::public.app_role)));


--
-- Name: objects Engineers can upload document files; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Engineers can upload document files" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'documents'::text) AND public.has_role(auth.uid(), 'engineer'::public.app_role)));


--
-- Name: objects Staff view signatures for protocols; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Staff view signatures for protocols" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'signatures'::text) AND public.has_role(auth.uid(), 'engineer'::public.app_role)));


--
-- Name: objects Users delete own signature; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Users delete own signature" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'signatures'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects Users update own signature; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Users update own signature" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'signatures'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects Users upload own signature; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Users upload own signature" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'signatures'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects Users view own signature; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Users view own signature" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'signatures'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT ALL ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT ALL ON SCHEMA storage TO postgres;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION algorithm_sign(signables text, secret text, algorithm text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.algorithm_sign(signables text, secret text, algorithm text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.algorithm_sign(signables text, secret text, algorithm text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM postgres;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM postgres;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT blk_read_time double precision, OUT blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT blk_read_time double precision, OUT blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION sign(payload json, secret text, algorithm text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.sign(payload json, secret text, algorithm text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.sign(payload json, secret text, algorithm text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION try_cast_double(inp text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.try_cast_double(inp text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.try_cast_double(inp text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION url_decode(data text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.url_decode(data text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.url_decode(data text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION url_encode(data bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.url_encode(data bytea) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.url_encode(data bytea) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION verify(token text, secret text, algorithm text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.verify(token text, secret text, algorithm text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.verify(token text, secret text, algorithm text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- Name: FUNCTION lo_export(oid, text); Type: ACL; Schema: pg_catalog; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pg_catalog.lo_export(oid, text) FROM postgres;
GRANT ALL ON FUNCTION pg_catalog.lo_export(oid, text) TO supabase_admin;


--
-- Name: FUNCTION lo_import(text); Type: ACL; Schema: pg_catalog; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pg_catalog.lo_import(text) FROM postgres;
GRANT ALL ON FUNCTION pg_catalog.lo_import(text) TO supabase_admin;


--
-- Name: FUNCTION lo_import(text, oid); Type: ACL; Schema: pg_catalog; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pg_catalog.lo_import(text, oid) FROM postgres;
GRANT ALL ON FUNCTION pg_catalog.lo_import(text, oid) TO supabase_admin;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: postgres
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;


--
-- Name: FUNCTION crypto_aead_det_decrypt(message bytea, additional bytea, key_uuid uuid, nonce bytea); Type: ACL; Schema: pgsodium; Owner: pgsodium_keymaker
--

GRANT ALL ON FUNCTION pgsodium.crypto_aead_det_decrypt(message bytea, additional bytea, key_uuid uuid, nonce bytea) TO service_role;


--
-- Name: FUNCTION crypto_aead_det_encrypt(message bytea, additional bytea, key_uuid uuid, nonce bytea); Type: ACL; Schema: pgsodium; Owner: pgsodium_keymaker
--

GRANT ALL ON FUNCTION pgsodium.crypto_aead_det_encrypt(message bytea, additional bytea, key_uuid uuid, nonce bytea) TO service_role;


--
-- Name: FUNCTION crypto_aead_det_keygen(); Type: ACL; Schema: pgsodium; Owner: supabase_admin
--

GRANT ALL ON FUNCTION pgsodium.crypto_aead_det_keygen() TO service_role;


--
-- Name: FUNCTION archive_monitored_hosts_on_conn_delete(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.archive_monitored_hosts_on_conn_delete() FROM PUBLIC;
GRANT ALL ON FUNCTION public.archive_monitored_hosts_on_conn_delete() TO service_role;


--
-- Name: FUNCTION get_tables_list(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.get_tables_list() FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_tables_list() TO anon;
GRANT ALL ON FUNCTION public.get_tables_list() TO authenticated;
GRANT ALL ON FUNCTION public.get_tables_list() TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION has_role(_user_id uuid, _role public.app_role); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO anon;
GRANT ALL ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO authenticated;
GRANT ALL ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO service_role;


--
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT ALL ON TABLE auth.audit_log_entries TO postgres;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.flow_state TO postgres;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.identities TO postgres;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT ALL ON TABLE auth.instances TO postgres;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.mfa_amr_claims TO postgres;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.mfa_challenges TO postgres;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.mfa_factors TO postgres;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT ALL ON TABLE auth.refresh_tokens TO postgres;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.saml_providers TO postgres;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.saml_relay_states TO postgres;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.schema_migrations TO dashboard_user;
GRANT ALL ON TABLE auth.schema_migrations TO postgres;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.sessions TO postgres;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.sso_domains TO postgres;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.sso_providers TO postgres;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT ALL ON TABLE auth.users TO postgres;


--
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;


--
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;


--
-- Name: TABLE decrypted_key; Type: ACL; Schema: pgsodium; Owner: supabase_admin
--

GRANT ALL ON TABLE pgsodium.decrypted_key TO pgsodium_keyholder;


--
-- Name: TABLE masking_rule; Type: ACL; Schema: pgsodium; Owner: supabase_admin
--

GRANT ALL ON TABLE pgsodium.masking_rule TO pgsodium_keyholder;


--
-- Name: TABLE mask_columns; Type: ACL; Schema: pgsodium; Owner: supabase_admin
--

GRANT ALL ON TABLE pgsodium.mask_columns TO pgsodium_keyholder;


--
-- Name: TABLE alert_thresholds; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.alert_thresholds TO anon;
GRANT ALL ON TABLE public.alert_thresholds TO authenticated;
GRANT ALL ON TABLE public.alert_thresholds TO service_role;


--
-- Name: TABLE audit_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.audit_logs TO anon;
GRANT ALL ON TABLE public.audit_logs TO authenticated;
GRANT ALL ON TABLE public.audit_logs TO service_role;


--
-- Name: TABLE automation_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.automation_logs TO anon;
GRANT ALL ON TABLE public.automation_logs TO authenticated;
GRANT ALL ON TABLE public.automation_logs TO service_role;


--
-- Name: TABLE contracts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.contracts TO anon;
GRANT ALL ON TABLE public.contracts TO authenticated;
GRANT ALL ON TABLE public.contracts TO service_role;


--
-- Name: TABLE documents; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.documents TO anon;
GRANT ALL ON TABLE public.documents TO authenticated;
GRANT ALL ON TABLE public.documents TO service_role;


--
-- Name: TABLE equipment; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.equipment TO anon;
GRANT ALL ON TABLE public.equipment TO authenticated;
GRANT ALL ON TABLE public.equipment TO service_role;


--
-- Name: TABLE equipment_categories; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.equipment_categories TO anon;
GRANT ALL ON TABLE public.equipment_categories TO authenticated;
GRANT ALL ON TABLE public.equipment_categories TO service_role;


--
-- Name: TABLE factory_reset_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.factory_reset_requests TO anon;
GRANT ALL ON TABLE public.factory_reset_requests TO authenticated;
GRANT ALL ON TABLE public.factory_reset_requests TO service_role;


--
-- Name: TABLE gitlab_ticket_links; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.gitlab_ticket_links TO anon;
GRANT ALL ON TABLE public.gitlab_ticket_links TO authenticated;
GRANT ALL ON TABLE public.gitlab_ticket_links TO service_role;


--
-- Name: TABLE holidays; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.holidays TO anon;
GRANT ALL ON TABLE public.holidays TO authenticated;
GRANT ALL ON TABLE public.holidays TO service_role;


--
-- Name: TABLE infrastructure_map_versions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.infrastructure_map_versions TO anon;
GRANT ALL ON TABLE public.infrastructure_map_versions TO authenticated;
GRANT ALL ON TABLE public.infrastructure_map_versions TO service_role;


--
-- Name: TABLE infrastructure_maps; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.infrastructure_maps TO anon;
GRANT ALL ON TABLE public.infrastructure_maps TO authenticated;
GRANT ALL ON TABLE public.infrastructure_maps TO service_role;


--
-- Name: TABLE integration_settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.integration_settings TO anon;
GRANT ALL ON TABLE public.integration_settings TO authenticated;
GRANT ALL ON TABLE public.integration_settings TO service_role;


--
-- Name: TABLE item_aliases; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.item_aliases TO anon;
GRANT ALL ON TABLE public.item_aliases TO authenticated;
GRANT ALL ON TABLE public.item_aliases TO service_role;


--
-- Name: TABLE maintenance_protocols; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.maintenance_protocols TO anon;
GRANT ALL ON TABLE public.maintenance_protocols TO authenticated;
GRANT ALL ON TABLE public.maintenance_protocols TO service_role;


--
-- Name: TABLE maintenance_schedules; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.maintenance_schedules TO anon;
GRANT ALL ON TABLE public.maintenance_schedules TO authenticated;
GRANT ALL ON TABLE public.maintenance_schedules TO service_role;


--
-- Name: TABLE maintenance_tasks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.maintenance_tasks TO anon;
GRANT ALL ON TABLE public.maintenance_tasks TO authenticated;
GRANT ALL ON TABLE public.maintenance_tasks TO service_role;


--
-- Name: TABLE metric_translations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.metric_translations TO anon;
GRANT ALL ON TABLE public.metric_translations TO authenticated;
GRANT ALL ON TABLE public.metric_translations TO service_role;


--
-- Name: TABLE monitored_hosts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.monitored_hosts TO anon;
GRANT ALL ON TABLE public.monitored_hosts TO authenticated;
GRANT ALL ON TABLE public.monitored_hosts TO service_role;


--
-- Name: TABLE monitoring_host_links; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.monitoring_host_links TO anon;
GRANT ALL ON TABLE public.monitoring_host_links TO authenticated;
GRANT ALL ON TABLE public.monitoring_host_links TO service_role;


--
-- Name: TABLE notification_channels; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notification_channels TO anon;
GRANT ALL ON TABLE public.notification_channels TO authenticated;
GRANT ALL ON TABLE public.notification_channels TO service_role;


--
-- Name: TABLE notification_log; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notification_log TO anon;
GRANT ALL ON TABLE public.notification_log TO authenticated;
GRANT ALL ON TABLE public.notification_log TO service_role;


--
-- Name: TABLE notification_preferences; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notification_preferences TO anon;
GRANT ALL ON TABLE public.notification_preferences TO authenticated;
GRANT ALL ON TABLE public.notification_preferences TO service_role;


--
-- Name: TABLE notification_queue; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notification_queue TO anon;
GRANT ALL ON TABLE public.notification_queue TO authenticated;
GRANT ALL ON TABLE public.notification_queue TO service_role;


--
-- Name: TABLE notification_subscriptions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notification_subscriptions TO anon;
GRANT ALL ON TABLE public.notification_subscriptions TO authenticated;
GRANT ALL ON TABLE public.notification_subscriptions TO service_role;


--
-- Name: TABLE organizations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.organizations TO anon;
GRANT ALL ON TABLE public.organizations TO authenticated;
GRANT ALL ON TABLE public.organizations TO service_role;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- Name: TABLE protocol_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.protocol_items TO anon;
GRANT ALL ON TABLE public.protocol_items TO authenticated;
GRANT ALL ON TABLE public.protocol_items TO service_role;


--
-- Name: TABLE protocol_templates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.protocol_templates TO anon;
GRANT ALL ON TABLE public.protocol_templates TO authenticated;
GRANT ALL ON TABLE public.protocol_templates TO service_role;


--
-- Name: TABLE saved_graphs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.saved_graphs TO anon;
GRANT ALL ON TABLE public.saved_graphs TO authenticated;
GRANT ALL ON TABLE public.saved_graphs TO service_role;


--
-- Name: TABLE sites; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sites TO anon;
GRANT ALL ON TABLE public.sites TO authenticated;
GRANT ALL ON TABLE public.sites TO service_role;


--
-- Name: TABLE support_scheme_lines; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.support_scheme_lines TO anon;
GRANT ALL ON TABLE public.support_scheme_lines TO authenticated;
GRANT ALL ON TABLE public.support_scheme_lines TO service_role;


--
-- Name: TABLE support_schemes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.support_schemes TO anon;
GRANT ALL ON TABLE public.support_schemes TO authenticated;
GRANT ALL ON TABLE public.support_schemes TO service_role;


--
-- Name: TABLE system_kill_log; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.system_kill_log TO anon;
GRANT ALL ON TABLE public.system_kill_log TO authenticated;
GRANT ALL ON TABLE public.system_kill_log TO service_role;


--
-- Name: TABLE ticket_ai_analyses; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ticket_ai_analyses TO anon;
GRANT ALL ON TABLE public.ticket_ai_analyses TO authenticated;
GRANT ALL ON TABLE public.ticket_ai_analyses TO service_role;


--
-- Name: TABLE ticket_comment_reactions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ticket_comment_reactions TO anon;
GRANT ALL ON TABLE public.ticket_comment_reactions TO authenticated;
GRANT ALL ON TABLE public.ticket_comment_reactions TO service_role;


--
-- Name: TABLE ticket_comments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ticket_comments TO anon;
GRANT ALL ON TABLE public.ticket_comments TO authenticated;
GRANT ALL ON TABLE public.ticket_comments TO service_role;


--
-- Name: TABLE ticket_links; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ticket_links TO anon;
GRANT ALL ON TABLE public.ticket_links TO authenticated;
GRANT ALL ON TABLE public.ticket_links TO service_role;


--
-- Name: TABLE ticket_status_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ticket_status_history TO anon;
GRANT ALL ON TABLE public.ticket_status_history TO authenticated;
GRANT ALL ON TABLE public.ticket_status_history TO service_role;


--
-- Name: TABLE tickets; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tickets TO anon;
GRANT ALL ON TABLE public.tickets TO authenticated;
GRANT ALL ON TABLE public.tickets TO service_role;


--
-- Name: TABLE tz_coverage; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tz_coverage TO anon;
GRANT ALL ON TABLE public.tz_coverage TO authenticated;
GRANT ALL ON TABLE public.tz_coverage TO service_role;


--
-- Name: TABLE tz_requirements; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tz_requirements TO anon;
GRANT ALL ON TABLE public.tz_requirements TO authenticated;
GRANT ALL ON TABLE public.tz_requirements TO service_role;


--
-- Name: TABLE user_dashboard_widgets; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_dashboard_widgets TO anon;
GRANT ALL ON TABLE public.user_dashboard_widgets TO authenticated;
GRANT ALL ON TABLE public.user_dashboard_widgets TO service_role;


--
-- Name: TABLE user_favorite_metrics; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_favorite_metrics TO anon;
GRANT ALL ON TABLE public.user_favorite_metrics TO authenticated;
GRANT ALL ON TABLE public.user_favorite_metrics TO service_role;


--
-- Name: TABLE user_metric_preferences; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_metric_preferences TO anon;
GRANT ALL ON TABLE public.user_metric_preferences TO authenticated;
GRANT ALL ON TABLE public.user_metric_preferences TO service_role;


--
-- Name: TABLE user_module_permissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_module_permissions TO anon;
GRANT ALL ON TABLE public.user_module_permissions TO authenticated;
GRANT ALL ON TABLE public.user_module_permissions TO service_role;


--
-- Name: TABLE user_roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_roles TO anon;
GRANT ALL ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO service_role;


--
-- Name: TABLE zabbix_connections; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.zabbix_connections TO anon;
GRANT ALL ON TABLE public.zabbix_connections TO authenticated;
GRANT ALL ON TABLE public.zabbix_connections TO service_role;


--
-- Name: TABLE zabbix_template_library; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.zabbix_template_library TO anon;
GRANT ALL ON TABLE public.zabbix_template_library TO authenticated;
GRANT ALL ON TABLE public.zabbix_template_library TO service_role;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO postgres;


--
-- Name: TABLE migrations; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.migrations TO anon;
GRANT ALL ON TABLE storage.migrations TO authenticated;
GRANT ALL ON TABLE storage.migrations TO service_role;
GRANT ALL ON TABLE storage.migrations TO postgres;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO postgres;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES  TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS  TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES  TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES  TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS  TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES  TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: pgsodium; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA pgsodium GRANT ALL ON SEQUENCES  TO pgsodium_keyholder;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: pgsodium; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA pgsodium GRANT ALL ON TABLES  TO pgsodium_keyholder;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: pgsodium_masks; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA pgsodium_masks GRANT ALL ON SEQUENCES  TO pgsodium_keyiduser;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: pgsodium_masks; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA pgsodium_masks GRANT ALL ON FUNCTIONS  TO pgsodium_keyiduser;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: pgsodium_masks; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA pgsodium_masks GRANT ALL ON TABLES  TO pgsodium_keyiduser;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES  TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS  TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES  TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES  TO service_role;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: postgres
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO postgres;

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

--
-- PostgreSQL database dump complete
--

