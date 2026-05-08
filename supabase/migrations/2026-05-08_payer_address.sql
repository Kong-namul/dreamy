-- ------------------------------------------------------------
-- payments.provider_payer_address
-- ------------------------------------------------------------
-- Coinbase / Base Pay 등 온체인 결제의 손님 지갑 주소.
-- 환불 destination 추적, 사기 패턴 탐지, CS 응대 시 필요.
-- 옛 결제는 null 로 남고, 새 결제부터 webhook 에서 채움.
-- ------------------------------------------------------------

alter table public.payments
  add column if not exists provider_payer_address text;

create index if not exists payments_payer_address_idx
  on public.payments(provider_payer_address)
  where provider_payer_address is not null;
