-- Read-only tenant index and table-size review.
with tenant_columns as (
  select n.nspname as schema_name, c.relname as table_name, a.attname as column_name, c.oid
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join pg_attribute a on a.attrelid = c.oid
  where n.nspname = 'public' and c.relkind = 'r'
    and a.attname in ('program_id', 'profile_id', 'business_id')
    and not a.attisdropped
),
coverage as (
  select tc.*,
    exists (
      select 1 from pg_index i
      join pg_attribute ia on ia.attrelid = i.indrelid and ia.attnum = any(i.indkey)
      where i.indrelid = tc.oid and ia.attname = tc.column_name and i.indisvalid
    ) as indexed
  from tenant_columns tc
)
select schema_name, table_name, column_name, indexed,
  pg_size_pretty(pg_total_relation_size(oid)) as total_size
from coverage
order by indexed, pg_total_relation_size(oid) desc, table_name, column_name;

-- Run EXPLAIN (ANALYZE, BUFFERS) manually against representative program IDs
-- only in a non-production transaction or during an approved low-traffic window.
