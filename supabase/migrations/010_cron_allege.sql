-- ============================================================================
-- 010 · Allègement des tâches automatiques (après la saturation du 27 oct. 2026)
--  · synchro Boost : toutes les 10 minutes (au lieu de 5), les deux clubs décalés
--  · envoi vers Boost : vérifié toutes les 2 minutes, et lancé SEULEMENT s'il y a
--    quelque chose à envoyer (signal `_boost_pending` posé par coach-sync)
--  · journal du planificateur purgé (il grossit à chaque passage)
-- À lancer APRÈS le déploiement de coach-sync, boost-push et boost-sync.
-- ============================================================================

SELECT cron.alter_job((SELECT jobid FROM cron.job WHERE jobname = 'boost-sync-garenne'), schedule := '*/10 * * * *');
SELECT cron.alter_job((SELECT jobid FROM cron.job WHERE jobname = 'boost-sync-lattes'),  schedule := '5-59/10 * * * *');

SELECT cron.unschedule('boost-push');
SELECT cron.schedule('boost-push', '*/2 * * * *', $job$
  SELECT net.http_post(
    url := 'https://wfqtpcujujqxgfsgbpvp.supabase.co/functions/v1/boost-push?action=run',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-sync-key', (SELECT data->>'key' FROM public.coach_store WHERE id = '_boost_cron')),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  )
  WHERE NOT EXISTS (
    SELECT 1 FROM public.coach_store
    WHERE id = '_boost_pending' AND data ? 'done'
      AND coalesce(data->>'at', '') <= data->>'done'
  );
$job$);

-- Journal du planificateur : on ne garde que 2 jours
DELETE FROM cron.job_run_details WHERE end_time < now() - interval '2 days';
SELECT cron.schedule('cron-purge-journal', '17 3 * * *', $job$
  DELETE FROM cron.job_run_details WHERE end_time < now() - interval '2 days';
$job$);

-- Contrôle
SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
