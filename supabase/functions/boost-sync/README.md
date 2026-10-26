# Fitness Boost · référence API (transmise par Paul, 26 oct. 2026)

Base `https://www.app-boost.com/api/v1` · `Authorization: Bearer boost_live_…` · un token par club
(lecture seule = GET ; lecture-écriture = contacts + RDV). Boost est la **source maîtresse** des leads.

## Contact
- Champs lus : `id` (uuid), `name`, `email`, `phone` (format variable : `+33612345678` ou `33612345678`
  → toujours comparer sur les 9 derniers chiffres), `status`, `source`, `scoring`, `tags`, `date_rdv`,
  5 consentements (`email_/sms_/phone_/whatsapp_/messenger_consent` : null = non défini, true, false),
  `consent_updated_at`, `created_at`, `updated_at`. D'autres champs probables (`...` dans la doc) : voir discover.
- Statuts : a_traiter, contacte, rdv_planifie, client, ancien_client, perdu, archive.
  **Un contact `client` ne peut pas redescendre (PATCH → 400).**
- Sources : site_web, reseaux_sociaux, bouche_a_oreille, publicite, autre, popup_lead, tunnel_vente,
  google_my_business (et `api` vu en lecture).
- `POST /contacts` : `name` requis ; `ext_lead_id` = notre identifiant ; doublon détecté **par email** →
  200 + `reentry: true` (contact existant mis à jour, tags ajoutés). Pas de dédoublonnage par téléphone.
- `PATCH /contacts/{id}` : champs modifiables uniquement (sinon 422) : name, email, phone, status, source,
  notes, notes_entries, next_step, tags (remplace la liste), badge, assigned_to, archived,
  date_premier_appel, date_rdv, date_relance, date_last_rdv_venu, date_contrat, date_inscription,
  next_rdv, last_entry_at, est_venu, contractuel, parrain_id, tunnel_id, tunnel_stage_id, messenger_url,
  inbox_url, platform, 5 consentements.
- `GET /contacts/{id}/activities/summary` (?created_after/?created_before) : totaux appels, SMS, emails,
  RDV (booked/attended/no_show/cancelled), `rdv_by_type` (seance_essai, rdv_commercial, bilan, autre).

## Activités · `GET /activities`
- Filtres : `type` (ex. appel_ok,appel_nok, rdv), `created_after|from`, `created_before|to`,
  `scheduled_after/before`, `prospect_id`, `user_id`, `status` (planifie, termine, annule),
  `limit` (max 200, défaut 50), `offset` ou `page`.
- Champs : id, club_id, prospect_id, user_id, action_type, title, content, description, scheduled_at,
  ended_at, duration, status, est_venu, est_relance, est_auto, delivery_status, created_at,
  `rdv_type` (seance_essai, rdv_commercial, bilan, null).
- Seules les activités d'un contact actif sont renvoyées.
- Pagination : `{ total, limit, offset, page, total_pages, has_more }`.

## Suppressions · `GET /contacts/deleted`
- `?deleted_after` / `?deleted_before`, `limit` (max 1000), `offset` → `[{ id, deleted_at }]`.
  Sert à l'effacement (RGPD) côté Sales Coach.

## Correspondance des statuts (validée par Paul le 26 oct. 2026, point 1)
Statuts réels (/reference) : a_traiter, contacte, rdv_planifie, rdv_venu, rdv_nok, client, ancien_client, perdu, archive.
| Boost | Sales Coach |
|---|---|
| a_traiter, contacte | rappeler |
| **rdv_planifie** | **rappeler + date/heure de rappel** (chez Club Pilates = rappel convenu avec le prospect, PAS une séance d'essai). Date : prochaine activité planifiée du contact (`rappel`/`rdv`, `scheduled_at`, UTC → heure de Paris), sinon `next_rdv` / `date_relance` / `date_rdv` |
| rdv_venu | venu |
| rdv_nok | rappeler + pastille « N'est pas venu » |
| client | pastille « Client Boost » (jamais d'abo automatique : primes) |
| perdu | perdu |
| ancien_client, archive | non importés |
Essai booké (Sales Coach) ← activité `seance_essai` / `rdv_type=seance_essai` planifiée.

## RDV · `POST /contacts/{id}/rdv` (jeton lecture-écriture)
- Corps : `scheduled_at` (ISO 8601, requis), `user_id` (commercial, requis · voir /users), `title`, `content`,
  `duration` (minutes, défaut 60).
- Réponse : activité `action_type: "rdv"`, `status: "planifie"`, `rdv_type` déduit du titre (null si non reconnu)
  → pour une séance d'essai, titrer « Séance d'essai » (à vérifier au premier envoi sur un contact de test).
- Aucune route d'annulation ou de modification de RDV connue : un RDV créé par erreur se corrige à la main dans Boost.

## Statistiques · `GET /stats/activities`
- `created_after` et `created_before` **requis** (92 jours maximum), `group_by` = none (défaut), prospect, user ou type.
- Réponse : `data[]` (par groupe : `total`, `totals{calls, …}`), `total_activities`, bornes de dates.
- Usage prévu (phase 4) : activité par commercial et par mois dans le dashboard isseo (`group_by=user`).

## Découverte du 26 oct. 2026 (La Garenne)
157 contacts, 948 activités, 8 utilisateurs, 0 tunnel, téléphones 100 % `+33`, consentements tous null,
pas d'en-tête de limite de débit, `/stats/activities` → 422 sans les dates requises.

## Encore inconnu
Filtre incrémental sur GET /contacts (inutile à 157 contacts : synchro complète), webhooks.

## Règles d'import (Paul, 26 oct. 2026)
- Seuls les leads **arrivés depuis 60 jours** (`effective_entry_at`, sinon `created_at`) sont créés dans le Sales Coach ;
  un ancien lead entre s'il a un rappel dans les 30 jours ou s'il revient (nouvelle entrée).
- **Un rappel au-delà de J+30 n'est pas traité** (ni comme motif d'import, ni comme date de rappel).
- Les fiches déjà liées restent mises à jour quel que soit leur âge.
- Montpellier Lattes (découverte du 26 oct.) : 2 826 contacts, ~80 s de lecture complète.
