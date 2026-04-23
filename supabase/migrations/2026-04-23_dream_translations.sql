-- dreams.translations JSONB — locale 별 번역 캐시.
-- 예: { "en": { "dream": "...", "interpretation": "...", "pages": [...], "interpretationBlocks": [...], "lucky": {...} } }
-- 번역이 새로 호출될 때 클라우드 번역 API 호출을 줄이기 위한 영구 캐시.

alter table public.dreams
  add column if not exists translations jsonb;
