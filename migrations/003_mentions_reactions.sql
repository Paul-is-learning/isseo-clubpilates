-- ══════════════════════════════════════════════════════════════════════
-- Migration: Étend notifications.type pour 'mention' + 'reaction' (V2 tâches)
-- Exécuter dans Supabase SQL Editor (https://supabase.com/dashboard)
-- ══════════════════════════════════════════════════════════════════════
--
-- Contexte : le chantier V2 de la plateforme de tâches ajoute les
-- mentions @user dans les commentaires et les réactions emoji. Les
-- notifications correspondantes ont besoin de nouveaux types qui ne
-- sont pas acceptés par le CHECK constraint actuel de 001_notifications.sql.
--
-- Cette migration ajoute 'rapport', 'mention', 'reaction' à la liste
-- des valeurs autorisées. Elle est idempotente : si la contrainte a
-- déjà été étendue, le DROP IF EXISTS suivi du ADD reflète l'état final.

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'message',
    'document',
    'depense',
    'statut',
    'echeance',
    'rapport',
    'mention',
    'reaction'
  ));
