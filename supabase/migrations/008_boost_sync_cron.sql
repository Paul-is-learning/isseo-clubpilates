-- ============================================================================
-- 008 · Synchro automatique Fitness Boost → Sales Coach, toutes les 5 minutes
-- Le planificateur (pg_cron) appelle boost-sync avec une clé tirée au hasard,
-- rangée dans coach_store (lisible par le serveur seul), jamais affichée.
-- Arrêt : select cron.unschedule('boost-sync-garenne');
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

INSERT INTO public.coach_store (id, data)
VALUES ('_boost_cron', jsonb_build_object('key', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')))
ON CONFLICT (id) DO NOTHING;

SELECT cron.schedule('boost-sync-garenne', '*/5 * * * *', $job$
  SELECT net.http_post(
    url := 'https://wfqtpcujujqxgfsgbpvp.supabase.co/functions/v1/boost-sync?action=import&club=garenne',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-sync-key', (SELECT data->>'key' FROM public.coach_store WHERE id = '_boost_cron')),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);

-- Contrôle
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'boost-sync-garenne';
