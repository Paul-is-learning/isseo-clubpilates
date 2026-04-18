-- ═══════════════════════════════════════════════════════════════════════════
-- Web Push subscriptions — pour envoyer des notifications OS quand l'app est
-- fermée via l'Edge Function send-push.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  endpoint      text not null,
  p256dh        text not null,
  auth          text not null,
  user_agent    text,
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz not null default now(),
  unique(user_id, endpoint)
);

create index if not exists idx_push_subs_user on push_subscriptions(user_id);

-- RLS : chaque utilisateur gère seulement ses propres subscriptions
alter table push_subscriptions enable row level security;

drop policy if exists "Users manage their own push subscriptions" on push_subscriptions;
create policy "Users manage their own push subscriptions"
  on push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- L'Edge Function send-push utilise la clé service_role et bypass les RLS,
-- donc pas besoin de policy supplémentaire pour elle.

-- Helper : supprime les subscriptions mortes (410 Gone) signalées par l'Edge
-- Function. Expose une fonction RPC callable depuis l'Edge Function avec la
-- clé service_role.
create or replace function prune_dead_push_subscription(sub_endpoint text)
returns void
language sql
security definer
as $$
  delete from push_subscriptions where endpoint = sub_endpoint;
$$;
