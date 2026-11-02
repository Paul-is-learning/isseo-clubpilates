-- Bilan commercial du lundi (weekly-digest) : la fonction lit tous les contacts Boost,
-- le délai HTTP par défaut de pg_net (5 s) est trop court. Passage à 120 s.
-- À lancer à la main : supabase db query --linked -f supabase/migrations/012_weekly_digest_timeout.sql
select cron.alter_job(
  job_id := (select jobid from cron.job where jobname = 'weekly-digest-lundi-9h'),
  command := regexp_replace(
    (select command from cron.job where jobname = 'weekly-digest-lundi-9h'),
    E'body := \'\\{\\}\'::jsonb\\s*\\)',
    E'body := \'{}\'::jsonb,\n    timeout_milliseconds := 120000\n  )'));
select jobname, schedule, active, command like '%timeout_milliseconds := 120000%' as has_timeout
from cron.job where jobname = 'weekly-digest-lundi-9h';
