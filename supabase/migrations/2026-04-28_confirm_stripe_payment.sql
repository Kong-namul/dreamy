-- ------------------------------------------------------------
-- confirm_stripe_payment(p_session_id, p_label)
-- ------------------------------------------------------------
-- Stripe webhook 의 "payments confirm + users credits 가산 + credit_transactions insert" 를
-- 단일 트랜잭션 + row lock 으로 원자화.
--
-- 기존엔 webhook 코드가 select → status check → update payments → select user
-- → update users → insert tx 를 따로 호출해서, webhook 재전송이나 동시 호출 시
-- 두 번 다 'pending' 으로 읽고 크레딧을 두 번 지급할 위험이 있었다.
--
-- 흐름:
--   1) payments row 를 FOR UPDATE 로 잠근다 (method='stripe' AND provider_payment_id=session_id)
--   2) 이미 confirmed 면 그대로 현재 잔액 반환 (idempotent)
--   3) 아니면 confirmed 로 마킹 + users.credits += payment.credits + tx 기록
--
-- returns: 갱신 후의 users.credits.   payments 가 없으면 -1.
-- ------------------------------------------------------------

create or replace function public.confirm_stripe_payment(
  p_session_id text,
  p_label      text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment    payments%rowtype;
  v_credits    integer;
begin
  select * into v_payment
  from payments
  where method = 'stripe'
    and provider_payment_id = p_session_id
  for update;

  if not found then
    return -1;
  end if;

  -- 이미 처리된 결제는 잔액만 돌려주고 끝낸다 (재전송 방어).
  if v_payment.status = 'confirmed' then
    select credits into v_credits from users where id = v_payment.user_id;
    return coalesce(v_credits, 0);
  end if;

  update payments
  set status = 'confirmed',
      confirmed_at = now()
  where id = v_payment.id;

  update users
  set credits = credits + v_payment.credits
  where id = v_payment.user_id
  returning credits into v_credits;

  insert into credit_transactions (user_id, type, amount, label)
  values (v_payment.user_id, 'purchase', v_payment.credits, p_label);

  return coalesce(v_credits, 0);
end;
$$;

-- service_role 만 호출 (webhook 은 server-side 에서 supabaseServer 사용).
revoke all on function public.confirm_stripe_payment(text, text) from public;
grant execute on function public.confirm_stripe_payment(text, text) to service_role;
