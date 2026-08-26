begin;

-- These legacy helpers predate the project's fixed-search-path standard. Keep
-- public in the path because several bodies intentionally reference unqualified
-- application tables and types, but make the path immutable so callers cannot
-- redirect SECURITY DEFINER lookups to attacker-controlled objects.
do $$
declare
  function_record record;
begin
  for function_record in
    select
      namespace.nspname as schema_name,
      procedure.proname as function_name,
      pg_catalog.pg_get_function_identity_arguments(procedure.oid) as identity_arguments
    from pg_catalog.pg_proc procedure
    join pg_catalog.pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname = any (array[
        'adjust_points',
        'can_curate_gift_card_catalog',
        'can_manage_business',
        'can_manage_business_catalog',
        'current_business_id',
        'gen_random_bytes',
        'generate_gift_card_code',
        'generate_partner_referrer_code',
        'generate_referral_code',
        'generate_secure_token',
        'gift_card_face_value_from_label',
        'handle_new_user',
        'handle_updated_at',
        'has_business_access',
        'has_staff_access',
        'is_business_owner',
        'jwt_role',
        'parse_gift_card_value_label',
        'set_updated_at',
        'set_user_role',
        'touch_synergize_follow_up_statuses_updated_at',
        'touch_synergize_invitation_requests_updated_at',
        'touch_synergize_operations_updated_at',
        'touch_updated_at'
      ])
  loop
    execute pg_catalog.format(
      'alter function %I.%I(%s) set search_path = pg_catalog, public',
      function_record.schema_name,
      function_record.function_name,
      function_record.identity_arguments
    );
  end loop;
end;
$$;

commit;
