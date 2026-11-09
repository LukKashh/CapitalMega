create or replace function private.commit_player_action(
  p_user_id uuid, p_idempotency_key text, p_action_type text,
  p_expected_version bigint, p_state jsonb, p_public_player jsonb,
  p_response jsonb, p_ledger jsonb default '[]'::jsonb,
  p_stock jsonb default '[]'::jsonb, p_corporation jsonb default null
) returns jsonb
language plpgsql security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_existing public.action_receipts%rowtype;
  v_current_version bigint;
  v_stock jsonb;
  v_corp_id uuid;
  v_result jsonb;
  v_sold bigint;
  v_limit bigint;
begin
  if p_user_id is null or p_idempotency_key is null
     or length(p_idempotency_key) < 1 or length(p_idempotency_key) > 128 then
    raise exception 'invalid_action_identity' using errcode = '22023';
  end if;
  if jsonb_typeof(p_state) <> 'object'
     or jsonb_typeof(p_public_player) <> 'object'
     or jsonb_typeof(p_response) <> 'object'
     or jsonb_typeof(coalesce(p_ledger, '[]'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(p_stock, '[]'::jsonb)) <> 'array' then
    raise exception 'invalid_action_payload' using errcode = '22023';
  end if;

  select version into v_current_version from public.player_states
    where user_id = p_user_id for update;
  select * into v_existing from public.action_receipts
    where user_id = p_user_id and idempotency_key = p_idempotency_key;
  if found then
    return coalesce(v_existing.response, jsonb_build_object('ok', true, 'duplicate', true));
  end if;
  if v_current_version is null then raise exception 'player_state_missing' using errcode = 'P0002'; end if;
  if v_current_version <> p_expected_version then raise exception 'player_state_conflict' using errcode = '40001'; end if;

  -- Create the counter row before locking it. This prevents two first-time
  -- buyers from both passing an edition-limit check against a missing row.
  for v_stock in select value from jsonb_array_elements(coalesce(p_stock, '[]'::jsonb)) loop
    if coalesce((v_stock->>'qty')::bigint, 0) <= 0
       or coalesce(v_stock->>'item_id', '') = '' then
      raise exception 'invalid_stock_quantity' using errcode = '22023';
    end if;
    insert into public.collectible_stock(item_id, sold, edition_limit)
      values (v_stock->>'item_id', 0, nullif(v_stock->>'edition_limit', '')::bigint)
      on conflict (item_id) do nothing;
    select sold, edition_limit into v_sold, v_limit
      from public.collectible_stock where item_id = v_stock->>'item_id' for update;
    v_limit := coalesce(nullif(v_stock->>'edition_limit', '')::bigint, v_limit);
    if v_limit is not null and v_sold + (v_stock->>'qty')::bigint > v_limit then
      raise exception 'collectible_sold_out' using errcode = '23514';
    end if;
  end loop;

  update public.player_states set state = p_state, version = version + 1,
    last_action_at = now(), updated_at = now() where user_id = p_user_id;
  update public.public_players set
    username = coalesce(p_public_player->>'username', username),
    level = coalesce((p_public_player->>'level')::integer, level),
    net_worth = coalesce((p_public_player->>'net_worth')::numeric, net_worth),
    corporation_tag = p_public_player->>'corporation_tag', updated_at = now()
    where user_id = p_user_id;

  for v_stock in select value from jsonb_array_elements(coalesce(p_stock, '[]'::jsonb)) loop
    update public.collectible_stock set
      sold = sold + (v_stock->>'qty')::bigint,
      edition_limit = coalesce(nullif(v_stock->>'edition_limit', '')::bigint, edition_limit),
      updated_at = now()
      where item_id = v_stock->>'item_id';
  end loop;

  insert into public.game_ledger(user_id, entry_type, source, destination, amount, entity_id, idempotency_key)
  select p_user_id, item->>'type', item->>'source', item->>'destination',
    (item->>'amount')::numeric, nullif(item->>'entity', ''), p_idempotency_key
  from jsonb_array_elements(coalesce(p_ledger, '[]'::jsonb)) as item;

  if p_corporation is not null then
    v_corp_id := (p_corporation->>'id')::uuid;
    insert into public.corporations(id, founder_id, name, tag, state, version, dissolved, updated_at)
    values (v_corp_id, coalesce(nullif(p_corporation->>'founder_id', '')::uuid, p_user_id),
      p_corporation->>'name', p_corporation->>'tag', p_corporation->'state',
      coalesce((p_corporation->>'version')::bigint, 1),
      coalesce((p_corporation->>'dissolved')::boolean, false), now())
    on conflict (id) do update set name = excluded.name, tag = excluded.tag, state = excluded.state,
      version = public.corporations.version + 1, dissolved = excluded.dissolved, updated_at = now();
  end if;

  v_result := p_response || jsonb_build_object('ok', true, 'duplicate', false, 'version', p_expected_version + 1);
  insert into public.action_receipts(user_id, idempotency_key, action_type, response)
    values (p_user_id, p_idempotency_key, coalesce(p_action_type, 'unknown'), v_result);
  return v_result;
end;
$$;
