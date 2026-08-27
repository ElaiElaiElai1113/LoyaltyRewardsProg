select
  p.proname,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_userbyid(p.proowner) as owner,
  p.proacl,
  has_function_privilege('anon', p.oid, 'execute') as anon_execute,
  has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute,
  exists (
    select 1 from pg_trigger trigger
    where trigger.tgfoid = p.oid and not trigger.tgisinternal
  ) as used_by_trigger
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
order by p.proname, arguments;

select
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and (
    coalesce(qual, '') ~ 'auth\\.(uid|jwt)\\(\\)'
    or coalesce(with_check, '') ~ 'auth\\.(uid|jwt)\\(\\)'
  )
order by tablename, policyname;

with index_signatures as (
  select
    indrelid,
    indexrelid,
    indkey,
    indclass,
    indcollation,
    indoption,
    indexprs,
    indpred
  from pg_index
  where indisvalid and indisready
)
select
  table_class.relname as table_name,
  array_agg(index_class.relname order by index_class.relname) as duplicate_indexes
from index_signatures signature
join pg_class table_class on table_class.oid = signature.indrelid
join pg_namespace namespace on namespace.oid = table_class.relnamespace
join pg_class index_class on index_class.oid = signature.indexrelid
where namespace.nspname = 'public'
group by table_class.relname, signature.indkey, signature.indclass, signature.indcollation,
  signature.indoption, signature.indexprs, signature.indpred
having count(*) > 1
order by table_class.relname;
