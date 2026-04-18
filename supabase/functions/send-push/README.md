# Edge Function `send-push`

Envoie des notifications Web Push aux subscriptions d'une liste d'utilisateurs.

## Déploiement (4 commandes)

**1. Génère une paire de clés VAPID** (une seule fois, garde-les au chaud) :

```bash
node scripts/generate-vapid-keys.mjs
```

Le script affiche `VAPID_PUBLIC_KEY` et `VAPID_PRIVATE_KEY` en base64url.

**2. Colle la clé publique dans le front** :

Édite `js/config.js` :

```js
window.ISSEO_VAPID_PUBLIC_KEY = 'BJ_dIXns...';  // ← clé publique
```

**3. Déclare les secrets côté Supabase** :

```bash
supabase secrets set \
  VAPID_PUBLIC_KEY="BJ_dIXns..." \
  VAPID_PRIVATE_KEY="WJTG1nxw..." \
  VAPID_SUBJECT="mailto:paul@isseo.fr"
```

**4. Déploie la function + applique la migration** :

```bash
supabase functions deploy send-push --no-verify-jwt
```

Puis dans le dashboard Supabase → SQL Editor → colle le contenu de
`migrations/004_push_subscriptions.sql` et exécute.

## Payload

`POST /functions/v1/send-push` avec body JSON :

```json
{
  "user_ids": ["uuid1", "uuid2"],
  "title": "Nouvelle tâche assignée",
  "body": "Montpellier Lattes — Bail commercial",
  "data": { "studioId": "lattes" },
  "tag": "isseo-task-lattes",
  "url": "#/studio/lattes"
}
```

Réponse :

```json
{ "ok": true, "sent": 3, "failed": 0, "pruned": 1 }
```

- `sent` : nombre de push délivrés
- `failed` : erreurs non-terminales
- `pruned` : subscriptions 404/410 supprimées de la DB

## Usage côté client (déjà wire)

Le flow est déjà câblé dans `js/notifications.js#createNotification()` :
à chaque insert dans la table `notifications`, le client invoque
`send-push` avec les user_ids ciblés. Aucun changement métier à faire.

## Opt-in utilisateur

Dans le panel notifications de l'app, quand `Notification.permission === 'default'`,
un bandeau 🔔 "Activez les notifications natives" propose l'activation.
Le bouton appelle `isseoPush.enable()` qui :

1. Demande la permission OS
2. S'abonne au `PushManager` avec la clé VAPID publique
3. Upsert la subscription dans `push_subscriptions`

## Test manuel rapide

Depuis l'app, ouvre la console :

```js
// 1. Active le push (prompt permission + subscribe)
await isseoPush.enable()

// 2. Envoie-toi un push de test
await isseoPush.sendTo([S.user.id], { title: 'Test ISSEO', body: 'Ça marche ✓' })
```

Tu devrais voir la notif OS apparaître, même app minimisée ou fermée
(sur Safari iOS, app ajoutée à l'écran d'accueil uniquement).
