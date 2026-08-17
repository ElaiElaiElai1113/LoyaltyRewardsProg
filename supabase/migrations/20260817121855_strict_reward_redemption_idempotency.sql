-- Preserve the validated reward-redemption implementation behind a strict
-- idempotency wrapper. A client request ID may replay only the exact normalized
-- reward, pickup window, and notes payload that originally used it.
alter function public.redeem_reward(uuid, text, text, uuid)
  rename to redeem_reward_once;

alter function public.redeem_reward_once(uuid, text, text, uuid)
  set search_path = '';

revoke all on function public.redeem_reward_once(uuid, text, text, uuid)
  from public, anon, authenticated, service_role;

create function public.redeem_reward(
  p_reward_id uuid,
  p_pickup_window text,
  p_notes text default null,
  p_client_request_id uuid default null
)
returns public.redemptions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  requested_program_id uuid;
  normalized_pickup_window text := trim(coalesce(p_pickup_window, ''));
  normalized_notes text := nullif(trim(coalesce(p_notes, '')), '');
  result_redemption public.redemptions%rowtype;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if p_client_request_id is not null then
    -- Serialize all attempts for the same customer/request pair. This closes
    -- the race between the replay lookup and the unique redemption insert.
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        v_actor_id::text || ':' || p_client_request_id::text,
        0
      )
    );
  end if;

  -- Always enter the validated implementation, including for a replay, so its
  -- customer-role, active-program, membership, and reward-business checks are
  -- never bypassed by the idempotency fast path.
  begin
    select public.redeem_reward_once(
      p_reward_id,
      normalized_pickup_window,
      normalized_notes,
      p_client_request_id
    ) into result_redemption;
  exception
    when unique_violation then
      -- The database currently enforces request IDs per profile globally. If a
      -- caller reuses an ID across programs, translate that collision into the
      -- same non-leaking payload-mismatch error instead of exposing a constraint.
      if p_client_request_id is not null
        and exists (
          select 1
          from public.redemptions redemption_row
          where redemption_row.profile_id = v_actor_id
            and redemption_row.client_request_id = p_client_request_id
        )
      then
        raise exception 'This request was already used for a different reward redemption.';
      end if;
      raise;
  end;

  -- The validated implementation holds a row lock on this reward until this
  -- transaction ends, so the program used for comparison cannot change here.
  select reward_row.program_id
    into requested_program_id
  from public.rewards reward_row
  where reward_row.id = p_reward_id;

  if requested_program_id is null then
    raise exception 'Reward not found.';
  end if;

  -- The inner function has legacy replay handling for older callers. Validate
  -- its returned row as well so a racing legacy request cannot bypass strict
  -- payload matching.
  if result_redemption.profile_id <> v_actor_id
    or result_redemption.program_id <> requested_program_id
    or result_redemption.reward_id <> p_reward_id
    or trim(result_redemption.pickup_window) <> normalized_pickup_window
    or nullif(trim(coalesce(result_redemption.notes, '')), '')
      is distinct from normalized_notes
  then
    raise exception 'This request was already used for a different reward redemption.';
  end if;

  return result_redemption;
end;
$$;

revoke all on function public.redeem_reward(uuid, text, text, uuid)
  from public, anon, service_role;
grant execute on function public.redeem_reward(uuid, text, text, uuid)
  to authenticated;

notify pgrst, 'reload schema';
