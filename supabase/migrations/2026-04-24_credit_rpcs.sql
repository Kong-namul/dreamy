-- ============================================================
-- Atomic credit operations
-- ============================================================
-- 두 개 함수 모두 security definer + single-statement 또는 단일 트랜잭션으로
-- "잔액 확인 + 차감(혹은 증가) + 트랜잭션 기록" 을 원자적으로 수행한다.
--
-- 기존 /api/credits/spend 의 구조는 select → update 두 스텝이라
-- 동시 두 요청이 같은 구 잔액을 읽어 중복 차감될 수 있었다.
-- 이 RPC 는 update … returning 을 쓰기 때문에 MVCC + row-lock 으로 안전.
-- ============================================================

-- ------------------------------------------------------------
-- spend_credits(p_email, p_amount, p_label)
-- - 유저의 credits 가 p_amount 이상이면 차감 + credit_transactions 기록.
-- - 반환: 차감 후 남은 크레딧. 잔액 부족이면 -1 반환 (호출부에서 402 처리).
-- ------------------------------------------------------------
create or replace function public.spend_credits(
  p_email  text,
  p_amount integer,
  p_label  text
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_new     integer;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid amount';
  end if;

  -- 1) 조건부 UPDATE — 잔액이 충분할 때만 차감, row 에 암묵 lock 이 걸려 동시성 안전.
  update public.users
     set credits = credits - p_amount
   where email      = p_email
     and deleted_at is null
     and credits    >= p_amount
  returning id, credits
       into v_user_id, v_new;

  if v_user_id is null then
    -- 유저 없음 또는 잔액 부족. 둘을 구분해 호출부가 판단하게 한다.
    if exists (
      select 1 from public.users
       where email = p_email and deleted_at is null
    ) then
      return -1;  -- 잔액 부족
    end if;
    raise exception 'no user';
  end if;

  -- 2) 트랜잭션 기록 (같은 transaction 내)
  insert into public.credit_transactions (user_id, type, amount, label)
  values (v_user_id, 'spend', -p_amount, p_label);

  return v_new;
end;
$$;


-- ------------------------------------------------------------
-- refund_credits(p_email, p_amount, p_label)
-- - 실패한 AI 작업 등에서 쓴 크레딧을 즉시 환불. credits 증가 + transactions 기록.
-- - 반환: 환불 후 크레딧.
-- ------------------------------------------------------------
create or replace function public.refund_credits(
  p_email  text,
  p_amount integer,
  p_label  text
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_new     integer;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid amount';
  end if;

  update public.users
     set credits = credits + p_amount
   where email      = p_email
     and deleted_at is null
  returning id, credits
       into v_user_id, v_new;

  if v_user_id is null then
    raise exception 'no user';
  end if;

  insert into public.credit_transactions (user_id, type, amount, label)
  values (v_user_id, 'refund', p_amount, p_label);

  return v_new;
end;
$$;


-- ------------------------------------------------------------
-- 실행 권한 — Supabase 의 service role (supabaseServer) 만 호출.
-- anon/authenticated 에게는 노출하지 않는다.
-- ------------------------------------------------------------
revoke all on function public.spend_credits(text, integer, text)  from public;
revoke all on function public.refund_credits(text, integer, text) from public;
grant execute on function public.spend_credits(text, integer, text)  to service_role;
grant execute on function public.refund_credits(text, integer, text) to service_role;
