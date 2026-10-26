-- ============================================================================
-- 006 · Table coach_store : données commerciales réservées au serveur (26 oct. 2026)
-- Prospects, invitations, journal des ventes, Intro Class et formation quittent
-- la table studios (lisible par chaque session isseo). RLS active et AUCUNE
-- policy : seules les fonctions serveur (clé service role) y accèdent.
-- À lancer AVANT le déploiement de coach-sync / allo-webhook / allo-backfill.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coach_store (
  id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coach_store ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.coach_store FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.coach_store TO service_role;
