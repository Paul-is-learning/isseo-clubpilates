-- ============================================================================
-- 005 · Verrouillage de patch_studio_data (26 oct. 2026)
-- La 004 ne retirait pas le droit EXECUTE par défaut de anon / PUBLIC :
-- la clé publique du site suffisait à lire et écrire n'importe quelle ligne
-- de studios (SECURITY DEFINER contourne la RLS). L'app isseo n'appelle
-- cette RPC qu'avec une session (js/state.js rpcPatch), donc rien ne casse.
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.patch_studio_data(text,jsonb,text,jsonb,text,text,timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.patch_studio_data(text,jsonb,text,jsonb,text,text,timestamptz) TO authenticated, service_role;

-- Chemin de recherche figé : bonne pratique pour toute fonction SECURITY DEFINER
ALTER FUNCTION public.patch_studio_data(text,jsonb,text,jsonb,text,text,timestamptz) SET search_path = public;
