-- ═══════════════════════════════════════════════════════════════════════════
-- 014 · Noms des contacts dans Allo (nov. 2026)
-- Toutes les 10 minutes en journée, la fonction allo-contacts crée dans le carnet Allo les
-- contacts des nouvelles fiches du studio (vrai nom + numéro). 40 contacts au plus par passage ;
-- rien n'est fait quand la liste des fiches n'a pas changé.
-- À lancer APRÈS : 1) clé ALLO_API_KEY dotée des droits CRM_READ + CRM_WRITE
--                  2) déploiement de la fonction allo-contacts
--                  3) un contrôle ?action=check concluant
-- Arrêt : select cron.unschedule('allo-contacts');
-- ═══════════════════════════════════════════════════════════════════════════
SELECT cron.schedule('allo-contacts', '3-59/10 5-20 * * *', $job$
  SELECT net.http_post(
    url := 'https://wfqtpcujujqxgfsgbpvp.supabase.co/functions/v1/allo-contacts?action=run',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-sync-key', (SELECT data->>'key' FROM public.coach_store WHERE id = '_boost_cron')),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'allo-contacts';
