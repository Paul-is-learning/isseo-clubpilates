-- ══════════════════════════════════════════════════════════════════════
-- Migration: Table notifications + RLS policies
-- Exécuter dans Supabase SQL Editor (https://supabase.com/dashboard)
-- ══════════════════════════════════════════════════════════════════════

-- 1. Créer la table notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type        text NOT NULL CHECK (type IN ('message','document','depense','statut','echeance')),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  studio_id   text NOT NULL,
  title       text NOT NULL,
  body        text,
  read        boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- 2. Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_notif_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notif_created ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_studio ON public.notifications(studio_id);

-- 3. Activer RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. Policies RLS — chaque utilisateur ne voit que ses propres notifications
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Activer Realtime sur la table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
