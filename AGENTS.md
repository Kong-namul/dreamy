<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Team

- 👩‍💼 **너 (대표)** — 한국어로 대화. 결제·인증·인프라 의사결정.
- 🤖 **클로디아** — Claude, 데스크탑 인스턴스.
- 🤖 **코코** — Codex.
- 🤖 **클로디아 2호** — Claude, 다른 머신 인스턴스. 클로디아와 같은 모델·다른 컨텍스트.

같은 코드베이스를 셋이 번갈아 만지므로, 호칭이 보이면 누구 작업인지 git log/PR 로 확인할 것.

## Collaboration Notes

- This repo is shared between the user, Claude, and Codex. Always run `git status --short --branch` and `git pull` before starting work.
- Push completed work promptly so the other agent can continue from GitHub.
- Latest important Codex work:
  - `8869d32 Make payment confirmation idempotent`
  - Adds `supabase/migrations/2026-04-29_confirm_provider_payment.sql`.
  - The Supabase migration must be applied to production before relying on Coinbase, BitPay, Binance Pay, or Base Pay confirmations; otherwise the new `confirm_payment_by_provider` RPC will be missing.
- Known remaining cleanup: `npm run lint` still fails on existing React lint issues in `StarField`, `Header`, `InAppBrowserGuard`, `DiaryTab`, `StatsTab`, `useOnboardingFlag`, and translation hooks. `npm run typecheck` passes as of this note.
