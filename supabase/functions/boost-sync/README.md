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

## Correspondances pressenties (à confirmer avec discover + Paul)
| Sales Coach | Boost |
|---|---|
| rappeler | a_traiter / contacte |
| essai (+ date) | rdv_planifie · activité `rdv_type=seance_essai`, `scheduled_at` = date de l'essai |
| venu | `est_venu` / `date_last_rdv_venu` (pas de statut dédié) |
| abo | client (+ `date_inscription` / `date_contrat`) · jamais de vente auto côté primes |
| perdu | perdu |

## Encore inconnu
GET /contacts (liste : pagination, filtre `updated_after` ?), /me, /users, /tags, /tunnels, /reference,
POST /contacts/{id}/rdv (corps), /stats/activities, limites de débit, webhooks.
