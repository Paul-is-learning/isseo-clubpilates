-- ============================================================================
-- 011 · Alertes « rappel dans 10 min » du Sales Coach, toutes les 5 minutes (7h à 21h, heure de Paris ≈ 6h à 20h UTC)
-- Arrêt : select cron.unschedule('coach-rappel-push');
-- ============================================================================
SELECT cron.schedule('coach-rappel-push', '*/5 5-20 * * *', $job$
  SELECT net.http_post(
    url := 'https://wfqtpcujujqxgfsgbpvp.supabase.co/functions/v1/coach-sync',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-sync-key', (SELECT data->>'key' FROM public.coach_store WHERE id = '_boost_cron')),
    body := '{"action":"rappel_push"}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'coach-rappel-push';
