-- ============================================================================
-- 007 · Fin de la migration vers coach_store (à lancer APRÈS le déploiement
-- des 3 fonctions et la vérification du Sales Coach)
-- 1. recopie les lignes que les fonctions n'ont pas encore lues
-- 2. supprime les copies de la table studios (lisibles par isseo)
-- ============================================================================

BEGIN;
INSERT INTO public.coach_store (id, data, updated_at)
SELECT id, data, updated_at FROM public.studios
WHERE id IN ('_coach_prospects','_coach_access','_coach_stats','_ic_data','_training')
ON CONFLICT (id) DO NOTHING;

DELETE FROM public.studios
WHERE id IN ('_coach_prospects','_coach_access','_coach_stats','_ic_data','_training');
COMMIT;

-- Contrôle : 5 lignes attendues dans coach_store, 0 dans studios
SELECT 'coach_store' AS ou, count(*) FROM public.coach_store WHERE id IN ('_coach_prospects','_coach_access','_coach_stats','_ic_data','_training')
UNION ALL
SELECT 'studios', count(*) FROM public.studios WHERE id IN ('_coach_prospects','_coach_access','_coach_stats','_ic_data','_training');
