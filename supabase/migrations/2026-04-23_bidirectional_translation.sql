-- 양방향 번역 지원을 위한 컬럼 추가.
--  1) dreams.source_locale : 꿈 작성 당시 언어 ('ko' | 'en'). 기존 row 는 모두 'ko' 로 가정.
--  2) dream_comments.translations : locale 별 번역 캐시 (예: { en: '...', ko: '...' }).
--  3) dream_comments.source_locale : 댓글 작성 언어. 기본 'ko'.

alter table public.dreams
  add column if not exists source_locale text not null default 'ko';

alter table public.dream_comments
  add column if not exists translations jsonb;

alter table public.dream_comments
  add column if not exists source_locale text not null default 'ko';
