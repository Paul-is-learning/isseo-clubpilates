-- ============================================================================
-- 010 · Allègement des tâches automatiques (après la saturation du 27 oct. 2026)
--  · synchro Boost : toutes les 10 minutes (au lieu de 5), les deux clubs décalés
--  · envoi vers Boost : toutes les 2 minutes (au lieu de chaque minute). boost-push
--    se met lui-même en veille quand la liste n'a pas changé depuis un passage
--    entièrement traité (il ne lit alors que la date de la liste, pas son contenu).
--    Chaque changement fait dans l'app part toujours tout de suite (coach-sync).
--  · journal du planificateur purgé chaque nuit (on garde 2 jours)
-- À lancer APRÈS le déploiement de boost-push et boost-sync.
-- ============================================================================

SELECT cron.alter_job((SELECT jobid FROM cron.job WHERE jobname = 'boost-sync-garenne'), schedule := '*/10 * * * *');
SELECT cron.alter_job((SELECT jobid FROM cron.job WHERE jobname = 'boost-sync-lattes'),  schedule := '5-59/10 * * * *');
SELECT cron.alter_job((SELECT jobid FROM cron.job WHERE jobname = 'boost-push'),         schedule := '*/2 * * * *');

DELETE FROM cron.job_run_details WHERE end_time < now() - interval '2 days';
SELECT cron.schedule('cron-purge-journal', '17 3 * * *', $job$
  DELETE FROM cron.job_run_details WHERE end_time < now() - interval '2 days';
$job$);

-- Contrôle
SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
