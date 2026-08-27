with security_definer_functions as (
  select jsonb_agg(to_jsonb(audited) order by audited.function_name, audited.arguments) as value
  from (
    select
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as arguments,
      pg_get_userbyid(p.proowner) as owner,
      p.proacl as acl,
      has_function_privilege('anon', p.oid, 'execute') as anon_execute,
      has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute,
      exists (
        select 1 from pg_trigger trigger
        where trigger.tgfoid = p.oid and not trigger.tgisinternal
      ) as used_by_trigger
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
  ) audited
), auth_policies as (
  select jsonb_agg(to_jsonb(audited) order by audited.tablename, audited.policyname) as value
  from (
    select tablename, policyname, roles, cmd, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (
        coalesce(qual, '') ~ 'auth\\.(uid|jwt)\\(\\)'
        or coalesce(with_check, '') ~ 'auth\\.(uid|jwt)\\(\\)'
      )
  ) audited
), index_signatures as (
  select indrelid, indexrelid, indkey, indclass, indcollation, indoption, indexprs, indpred
  from pg_index
  where indisvalid and indisready
), duplicate_indexes as (
  select jsonb_agg(to_jsonb(audited) order by audited.table_name) as value
  from (
    select
      table_class.relname as table_name,
      array_agg(index_class.relname order by index_class.relname) as indexes
    from index_signatures signature
    join pg_class table_class on table_class.oid = signature.indrelid
    join pg_namespace namespace on namespace.oid = table_class.relnamespace
    join pg_class index_class on index_class.oid = signature.indexrelid
    where namespace.nspname = 'public'
    group by table_class.relname, signature.indkey, signature.indclass, signature.indcollation,
      signature.indoption, signature.indexprs, signature.indpred
    having count(*) > 1
  ) audited
)
select jsonb_pretty(jsonb_build_object(
  'security_definer_functions', coalesce(security_definer_functions.value, '[]'::jsonb),
  'auth_policies', coalesce(auth_policies.value, '[]'::jsonb),
  'duplicate_indexes', coalesce(duplicate_indexes.value, '[]'::jsonb)
)) as rewards_linter_audit
from security_definer_functions, auth_policies, duplicate_indexes;
