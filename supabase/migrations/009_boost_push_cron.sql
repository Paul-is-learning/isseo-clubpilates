-- ============================================================================
-- 009 · Écriture Sales Coach → Fitness Boost, toutes les minutes
-- boost-push démarre en mode SIMULATION (rien n'est envoyé à Boost) ; le mode
-- se change par Paul uniquement : ?action=mode&set=simulation|test|live
-- Arrêt : select cron.unschedule('boost-push');
-- ============================================================================

SELECT cron.schedule('boost-push', '* * * * *', $job$
  SELECT net.http_post(
    url := 'https://wfqtpcujujqxgfsgbpvp.supabase.co/functions/v1/boost-push?action=run',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-sync-key', (SELECT data->>'key' FROM public.coach_store WHERE id = '_boost_cron')),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);

SELECT jobname, schedule, active FROM cron.job WHERE jobname IN ('boost-sync-garenne', 'boost-push');
