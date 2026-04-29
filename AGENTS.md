<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Collaboration Notes

- This repo is shared between the user, Claude, and Codex. Always run `git status --short --branch` and `git pull` before starting work.
- Push completed work promptly so the other agent can continue from GitHub.
- Latest important Codex work:
  - `8869d32 Make payment confirmation idempotent`
  - Adds `supabase/migrations/2026-04-29_confirm_provider_payment.sql`.
  - The Supabase migration must be applied to production before relying on Coinbase, BitPay, Binance Pay, or Base Pay confirmations; otherwise the new `confirm_payment_by_provider` RPC will be missing.
- Known remaining cleanup: `npm run lint` still fails on existing React lint issues in `StarField`, `Header`, `InAppBrowserGuard`, `DiaryTab`, `StatsTab`, `useOnboardingFlag`, and translation hooks. `npm run typecheck` passes as of this note.
