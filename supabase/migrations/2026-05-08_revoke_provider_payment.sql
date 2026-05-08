-- ------------------------------------------------------------
-- revoke_credits_by_provider(p_method, p_provider_payment_id, ...)
-- ------------------------------------------------------------
-- Refund counterpart to confirm_payment_by_provider:
--   payments confirmed -> refunded
--   users.credits -= payments.credits  (clamp at 0)
--   credit_transactions insert (type='refund', amount=-credits)
--
-- Idempotent under row lock so duplicate refund webhooks don't
-- double-revoke. Symmetric to the confirm RPC.
-- ------------------------------------------------------------

-- 1. Allow 'refunded' as a payments.status value.
alter table public.payments
  drop constraint if exists payments_status_check;

alter table public.payments
  add constraint payments_status_check
  check (status in ('pending', 'confirmed', 'failed', 'expired', 'refunded'));


-- 2. RPC: revoke credits for a refunded provider payment.
create or replace function public.revoke_credits_by_provider(
  p_method text,
  p_provider_payment_id text,
  p_label text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment payments%rowtype;
  v_credits integer;
  v_revoke  integer;
begin
  select * into v_payment
  from payments
  where method = p_method
    and provider_payment_id = p_provider_payment_id
  for update;

  if not found then
    return -1;
  end if;

  -- Idempotent: if already refunded, just return current balance.
  if v_payment.status = 'refunded' then
    select credits into v_credits from users where id = v_payment.user_id;
    return coalesce(v_credits, 0);
  end if;

  -- Only refund a payment that was actually confirmed and credited.
  -- Pending/failed/expired never granted credits, so refund is a no-op
  -- on credits but still mark the row to keep history honest.
  if v_payment.status <> 'confirmed' then
    update payments
    set status = 'refunded'
    where id = v_payment.id;

    select credits into v_credits from users where id = v_payment.user_id;
    return coalesce(v_credits, 0);
  end if;

  -- v_payment.status = 'confirmed' → real revocation.
  v_revoke := v_payment.credits;

  update payments
  set status = 'refunded'
  where id = v_payment.id;

  -- Clamp at 0 so a user who already spent some credits doesn't go negative.
  -- Trade-off: merchant absorbs the spent portion. Acceptable for now;
  -- revisit if abuse pattern emerges.
  update users
  set credits = greatest(0, credits - v_revoke)
  where id = v_payment.user_id
  returning credits into v_credits;

  insert into credit_transactions (user_id, type, amount, label, price_won)
  values (v_payment.user_id, 'refund', -v_revoke, p_label, null);

  return coalesce(v_credits, 0);
end;
$$;

revoke all on function public.revoke_credits_by_provider(text, text, text) from public;
grant execute on function public.revoke_credits_by_provider(text, text, text) to service_role;
