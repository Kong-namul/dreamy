-- ------------------------------------------------------------
-- confirm_payment_by_provider(p_method, p_provider_payment_id, ...)
-- ------------------------------------------------------------
-- Non-Stripe payment confirmations share the same critical section:
--   payments pending -> confirmed
--   users.credits += payments.credits
--   credit_transactions insert
--
-- Do this under a row lock so webhook retries / concurrent verifies cannot
-- grant credits twice.
-- ------------------------------------------------------------

create or replace function public.confirm_payment_by_provider(
  p_method text,
  p_provider_payment_id text,
  p_label text,
  p_provider_tx_hash text default null,
  p_price_won integer default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment payments%rowtype;
  v_credits integer;
begin
  select * into v_payment
  from payments
  where method = p_method
    and provider_payment_id = p_provider_payment_id
  for update;

  if not found then
    return -1;
  end if;

  if v_payment.status = 'confirmed' then
    select credits into v_credits from users where id = v_payment.user_id;
    return coalesce(v_credits, 0);
  end if;

  update payments
  set status = 'confirmed',
      provider_tx_hash = coalesce(p_provider_tx_hash, provider_tx_hash),
      confirmed_at = now()
  where id = v_payment.id;

  update users
  set credits = credits + v_payment.credits
  where id = v_payment.user_id
  returning credits into v_credits;

  insert into credit_transactions (user_id, type, amount, label, price_won)
  values (v_payment.user_id, 'purchase', v_payment.credits, p_label, p_price_won);

  return coalesce(v_credits, 0);
end;
$$;

revoke all on function public.confirm_payment_by_provider(text, text, text, text, integer) from public;
grant execute on function public.confirm_payment_by_provider(text, text, text, text, integer) to service_role;
