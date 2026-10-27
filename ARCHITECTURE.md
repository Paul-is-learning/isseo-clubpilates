# isseo-app · carte du code

Document de référence pour Paul (propriétaire, non développeur) et pour toute
personne ou session d'IA qui reprend le code. Il décrit comment l'application
démarre, où vivent les données et dans quel fichier intervenir.

- État décrit : le code au 27 oct. 2026 (après le retrait des rubriques
  Prospection et Fichiers du menu).
- Les noms de fichiers et de fonctions cités ont été vérifiés dans le code.
  Les numéros de ligne bougent à chaque modification : pour retrouver une
  fonction, chercher son nom, par exemple `grep -n "function renderSidebar" js/*.js`.
- Règles de travail courtes pour les sessions d'IA : voir `CLAUDE.md`.

---

## 1. En deux minutes (pour Paul)

- **Un site web d'une seule page, sans compilation.** Le navigateur charge
  `index.html`, puis 35 fichiers JavaScript du dossier `js/`, toujours dans le
  même ordre. Il n'y a pas d'étape de « build » : ce qui est dans le dépôt est
  ce qui est publié.
- **Toutes les données sont dans Supabase** (base de données hébergée). Presque
  tout tient dans une seule table, `studios`, où chaque ligne est un « tiroir »
  reconnu par son identifiant (par exemple `lattes` pour la fiche du studio,
  `lattes_todos` pour ses tâches, `global_chat` pour le chat).
- **Un état unique, un redessin complet.** Toute l'application tient dans un
  objet global `S` (l'état). Chaque action modifie `S` puis appelle `render()`,
  qui reconstruit tout l'écran.
- **Le multi-utilisateur passe par le temps réel Supabase.** Quand quelqu'un
  enregistre, les autres écrans reçoivent la ligne modifiée et se redessinent.
  Un relevé de secours tourne toutes les 5 minutes au cas où.
- **Mise en ligne : `git push` sur `main`.** Vercel publie alors le site sur
  https://clubpilates.isseo-dev.com.
- **Le Sales Coach** (`cp-sales-coach/`) est un outil à part, en un seul
  fichier HTML, qui ne parle au serveur que par la fonction `coach-sync`.
- **Le code serveur** (`supabase/functions/`) se déploie séparément, fonction
  par fonction, avec la commande Supabase (section 11).

---

## 2. Arborescence

| Chemin | Contenu |
|---|---|
| `index.html` | Coquille de l'app : bibliothèques externes, client Supabase, ordre de chargement des scripts, enregistrement du service worker |
| `js/` | Tout le code de l'application (scripts « classiques », toutes les fonctions sont globales) |
| `js/vendor/` | `preact.umd.js`, `htm.umd.js` (Preact + htm, pour un seul composant) |
| `js/preact-components/` | `next-steps-widget.js` (widget « Prochaines étapes » de l'Accueil) |
| `styles.css` | Feuille de style unique (variables `:root`, mode sombre `body.dark`) |
| `sw.js` | Service worker (cache hors ligne, notifications push, partage de fichiers) |
| `manifest.json` | Manifeste PWA (icônes, raccourcis, cible de partage) |
| `task-action.html` | Page relais des boutons d'e-mails de tâches vers la fonction `task-action` |
| `cp-sales-coach/` | Copie publiée du CP Sales Coach (section 10) |
| `supabase/functions/` | Edge Functions (code serveur Deno, section 11) |
| `supabase/migrations/` | Scripts SQL récents (004 à 010), lancés à la main par Paul dans l'éditeur SQL Supabase |
| `migrations/` | Scripts SQL plus anciens (001 à 004 : notifications, prospects, mentions, abonnements push) |
| `tests/` | Tests automatiques (`bp-calc.test.js`) et filet « golden » (`tests/golden/render-snapshot.mjs`), section 13 |
| `tests.html` | Ancienne page de tests à ouvrir dans le navigateur |
| `types/app.d.ts` | Types TypeScript des objets métier (contrôle facultatif, `npm run typecheck`) |
| `icons/`, `img/`, `photos/`, `plans/`, `video/`, `logo-*.png`, `logo-cp.webp` | Images, photos d'équipe, plan du local, vidéos |
| `scripts/generate-vapid-keys.mjs` | Génération des clés Web Push |
| `vercel.json`, `.vercelignore` | Réglages de publication Vercel |

Fichiers présents mais **non chargés** par `index.html` : `js/gdrive.js` et
`js/gdrive-ui.js` (intégration Google Drive en pause).

---

## 3. Démarrage de l'application

### 3.1 Chargement d'`index.html`

1. Dans `<head>` : `supabase-js@2` et Leaflet 1.9.4 depuis unpkg, polices
   Google (Montserrat, Cormorant Garamond), `styles.css?v=...`, puis un petit
   bloc de style pour l'app installée (marges de sécurité iPhone).
2. Début de `<body>` : script qui remet le mode sombre si
   `localStorage.isseo_darkMode` vaut `true`, et qui envoie les erreurs non
   gérées à `isseoCaptureError` (Sentry).
3. Éléments fixes de la page : `#root` (tout l'écran de l'app), `#toast`,
   `#dirty-bar` (bandeau « Modifications non enregistrées » avec
   `saveAllDirty()` / `discardAllDirty()`), `#chat-root`, `#hamburger-btn`,
   `#sidebar-overlay`.
4. Script en ligne Supabase : constantes globales `SURL`, `SKEY` (clé
   publique, faite pour être visible) et `sb` (le client Supabase utilisé
   partout). Il repère aussi un lien e-mail de réinitialisation de mot de passe
   (`window._isseoRecovery`) et, sur l'évènement `PASSWORD_RECOVERY`, affiche
   `renderRecoveryScreen()`.
5. Les 35 scripts locaux, dans cet ordre (l'ordre compte, voir 3.2) :
   `js/config.js`, `js/observability.js`, `js/vendor/preact.umd.js`,
   `js/vendor/htm.umd.js`, `js/constants.js`, `js/animations.js`,
   `js/state.js`, `js/notifications.js`, `js/auth.js`, `js/pages-accueil.js`,
   `js/pages-fichiers.js`, `js/pages-prospection.js`,
   `js/pages-engagements.js`, `js/pages-bp-consolide.js`,
   `js/pages-collab.js`, `js/pages-local.js`, `js/pages-echanges.js`,
   `js/pages-financier.js`, `js/pages-introclass.js`, `js/pages-detail.js`,
   `js/pages.js`, `js/bp-edit.js`, `js/push.js`,
   `js/preact-components/next-steps-widget.js`, `js/map.js`, `js/utils.js`,
   `js/exports.js`, `js/simulator.js`, `js/chat.js`, `js/sync.js`,
   `js/pages-how.js`, `js/pages-equipe.js`, `js/coach-marks.js`,
   `js/onboarding-tour.js`, `js/app.js`.
6. Dernier script : enregistrement de `sw.js`, **en production seulement**.
   Sur `localhost`, `127.0.0.1`, `192.168.*` et `10.*`, il désinscrit au
   contraire tout service worker et vide les caches.

### 3.2 Pourquoi l'ordre des scripts compte

- `js/constants.js` doit passer avant `js/state.js` : `S.studios` est une copie
  de `INIT` faite au moment même où `js/state.js` est lu.
- Les `const` et `let` de premier niveau d'un script classique sont visibles
  des scripts suivants mais **ne sont pas** des propriétés de `window`
  (exemple : `window.STEPS` vaut `undefined`). Les fonctions déclarées avec
  `function` et les `var`, elles, sont sur `window`.
- `js/animations.js` est chargé avant `js/app.js` : il attend que
  `window.render` existe (essai toutes les 30 ms) puis l'enveloppe pour lancer
  `afterRenderAnimations()` après chaque rendu.
- `js/app.js` est le dernier : il lance la vérification de session.

### 3.3 Ouverture avec une session existante (`js/app.js`, appel `sb.auth.getSession()`)

1. Lien de réinitialisation de mot de passe en cours : `renderRecoveryScreen()`
   et arrêt.
2. Pas de session : `render()` affiche l'écran de connexion (`S.view` vaut
   `'auth'` au départ).
3. Session présente :
   - sur ordinateur (pas sur mobile, voir `_isMobileDevice`), si l'onglet est
     resté caché plus de `_INACTIVITY_MS` (30 min, `localStorage.isseo_hidden_at`),
     déconnexion ;
   - `S.user` est rempli et un écran d'attente `#boot-wait` s'affiche
     (message « Réessayer » au bout de 20 s si la base ne répond pas) ;
   - lecture du profil dans la table `profiles` vers `S.profile` ;
   - `loadAll()` (section 6) ;
   - le rôle peut être surchargé par `S.adminSettings.roles[uid]` ; un
     compte présent dans `S.adminSettings.blocked` est déconnecté ;
   - `S._dataLoaded=true`, `restoreNavState()`, puis atterrissage forcé sur
     l'Accueil sauf si l'adresse contient un lien direct (`#/...`) ;
   - `_restoreFromHash()`, `render()`, `startSync()`,
     `_startSessionWatcher()`, `startPresenceHeartbeat()`,
     `recordLastLogin()`, `_loadAllProfiles()`, `loadNotifications()` puis
     `checkEcheances()` + `checkMondayReport()`, `subscribeNotifications()`,
     `window.isseoPush.refresh()`, `maybeStartOnboardingTour()` ;
   - lien direct d'e-mail `#tache=SID:TASKID` : ouverture du studio, onglet
     `echanges`, puis `openTacheModal(sid, taskId)`.

### 3.4 Connexion par le formulaire (`js/utils.js`, `doLogin`)

Même enchaînement après `sb.auth.signInWithPassword` : profil, `loadAll()`,
rôle surchargé, contrôle du blocage, atterrissage sur l'Accueil, `render()`,
`startSync()`, présence, notifications, push, visite guidée.

### 3.5 Déconnexion (`js/exports.js`, `doLogout`)

Arrête les minuteries (inactivité, présence, sauvegardes différées), coupe la
synchro (`stopSync`) et les notifications (`unsubscribeNotifications`),
appelle `sb.auth.signOut()`, vide l'état et supprime `isseo_nav`.

---

## 4. Boucle de rendu

### 4.1 `render()` (`js/app.js`)

- Garde-fou `_rendering` : un rendu ne peut pas en relancer un autre.
- Applique la classe `dark` sur `<body>` selon `S.darkMode`.
- `S.view==='auth'` : `#root` reçoit `renderAuth()`, menu, bouton hamburger,
  barre du bas et bouton de tuto sont masqués.
- Sinon, choix de la page selon `S.page` (tableau 4.2), puis, en simplifié :
  `#root.innerHTML = renderSidebar() + '<div class="main-content"><div class="app">' + page + '</div></div>'`
  (classe `page-transition` ajoutée quand la page change).
- La barre d'onglets du bas (mobile, `#bottom-tab-bar` : Accueil, Studios,
  Collab) est créée une seule fois, puis seulement affichée ou masquée.
- Après le HTML : `initLocalisationMap()` 60 ms plus tard si l'onglet
  Localisation est ouvert, `_syncHash()`, `renderChat()`,
  `mountNextStepsWidget()`, `mountGDriveBrowsers()` (sans effet, Drive non
  chargé), `renderCoachFab()`.
- Puis, grâce à l'enveloppe de `js/animations.js`, `afterRenderAnimations()` :
  infobulles, ripple, indicateur d'onglet, gestes (balayage, tirer pour
  rafraîchir, appui long sur une tâche), compteurs animés, carrousel de
  l'Accueil.

Conséquences pratiques :

- Tout l'écran est du HTML construit en chaînes de caractères. Les boutons
  appellent des fonctions globales par `onclick="nomFonction(...)"` : une
  fonction appelée ainsi doit rester globale (pas enfermée dans un module).
- Après toute modification de `S`, il faut appeler `render()`.
- Un rendu efface le champ en cours de saisie. C'est pourquoi la synchro
  (`_tryRender` dans `js/sync.js`) ne redessine pas si un `input` ou un
  `textarea` a le focus, et pourquoi `renderChat()` n'écrase pas le chat
  pendant la frappe.

### 4.2 Pages (`S.page`)

| `S.page` | Fonction | Fichier |
|---|---|---|
| `accueil` (et page par défaut) | `renderAccueil` | `js/pages-accueil.js` |
| `projets` | `renderProjets` ; `renderProjetsAdmin` si `S.mainTab==='admin'` ; `renderDetail` si `S.view==='detail'` | `js/pages.js`, `js/pages-detail.js` |
| `collab` | `renderCollab` | `js/pages-collab.js` |
| `bp` | `renderBPConsolide` | `js/pages-bp-consolide.js` |
| `equipe` | `renderEquipe` | `js/pages-equipe.js` |
| `introclass` | `renderIntroClass` | `js/pages-introclass.js` |
| `how-it-works` | `renderHowItWorks` | `js/pages-how.js` |
| `engagements` | `renderPageEngagements` (plus dans le menu, encore routée) | `js/pages-engagements.js` |
| `prospection`, `fichiers` | rubriques retirées : renvoi vers l'Accueil | `js/app.js` |

### 4.3 Onglets de la fiche studio (`S.detailTab`, routeur dans `renderDetail`)

| Onglet (libellé) | Clé | Fonction | Fichier |
|---|---|---|---|
| Workflow | `workflow` | `renderWorkflow` (en tête : `renderBP3YInfographic`) | `js/pages-detail.js`, `js/pages-financier.js` |
| Adhérents & Prévisionnels | `adherents` | `renderAdherents` | `js/pages-financier.js` |
| Business plan | `forecast` | `renderForecast` (simulateur `renderBPlayPanel`) | `js/pages-financier.js` |
| Engagements | `engagements` | `renderEngagements` | `js/pages-engagements.js` |
| Questions & Tâches | `echanges` | `renderEchanges` | `js/pages-echanges.js` |
| Localisation | `localisation` | `renderLocalisation` + carte `initLocalisationMap` | `js/pages-local.js`, `js/map.js` |
| Local | `local` | `renderLocal` | `js/pages-local.js` |
| IA | `ia` | `renderAI` | `js/utils.js` |

Un lecteur (viewer) peut être limité à certains onglets et studios par
`S.adminSettings.viewerPerms[uid]`.

### 4.4 Navigation et adresse

- `setPage(p)`, `openDetail(id)`, `retourProjets()` (`js/exports.js`) et
  `setDetailTab(t)` (`js/simulator.js`) demandent confirmation s'il reste des
  modifications non enregistrées (`_checkDirtyBeforeNav`). `setMainTab(t)`
  (`js/simulator.js`) change seulement `S.mainTab`.
- `_syncHash()` écrit l'adresse : `#/accueil`, `#/collab`, ou
  `#/studio/<nom-du-studio>/<onglet>`. `_restoreFromHash()` la relit ; pages
  acceptées par URL : `accueil`, `projets`, `collab`, `bp`, plus les fiches
  studio.
- `#/share-received` : fichiers partagés depuis une autre app vers la PWA
  (`handleShareReceived`, `js/app.js`).
- La position est mémorisée dans `localStorage.isseo_nav` (`saveNavState`,
  `restoreNavState`).

---

## 5. L'état global `S` (`js/state.js`)

`S` est un seul objet global, déclaré avec `var` en tête de `js/state.js`.

| Groupe | Champs principaux |
|---|---|
| Session | `user`, `profile`, `_dataLoaded` |
| Navigation | `view` (`auth`, `dashboard`, `detail`), `page`, `mainTab`, `selectedId`, `detailTab`, `sidebarOpen` |
| Données studios | `studios`, `files`, `depenses`, `adherents`, `messages`, `topics`, `todos`, `scenarios`, `simConfig`, `activeScenarioId`, `scenarioEditMode` |
| Équipe | `people`, `shifts`, `shiftTemplates`, `shiftProposals`, `equipe*` (filtres de la page) |
| Partagé | `globalChat`, `adminSettings`, `userPresence`, `lastLogins`, `avatarUrls`, `notifications` |
| Saisies en cours | `dirty`, `_dirtyBackup` (modifications non enregistrées), `editMoisIdx`, `showNewForm`, `newForm` |
| Interface | `darkMode`, `chatOpen`, `notifOpen`, `notifFilter`, `dashView`, `dashFilter`, `search*`, `map*`, `forecastYear`, `forecastSection`, `adherentYear`, `eng*`, `fileNav` (hub fichiers de l'Accueil) |
| Simulateur BP | `S.bpPlay[sid]`, créé à la demande par `_bpPlay` (`js/pages-financier.js`) |
| Dormant | `prospects`, `prospect*` |

Mémoire locale du navigateur (`localStorage`) : `isseo_nav`,
`isseo_darkMode`, `chatLastSeen`, `isseo_sim_<sid>` (copie du réglage du
simulateur), `isseo_hidden_at`, `isseo_collab_filters`, `isseo_tasks_view_*`,
compteurs de la visite guidée (`js/onboarding-tour.js`). Rien d'important n'y
est gardé : la vérité est dans Supabase.

Modifications non enregistrées (bandeau `#dirty-bar`) : `markDirty(type, sid)`
garde une copie de sauvegarde, `saveAllDirty()` enregistre,
`discardAllDirty()` remet la copie. Types gérés : `adherents`, `sim`, `taux`,
`loyer`, `capex`.

---

## 6. Modèle de données (Supabase)

### 6.1 La table `studios` : une ligne par « tiroir »

Colonnes : `id` (texte), `data` (JSON), `updated_at`. `loadAll()` lit toute la
table au démarrage et range chaque ligne selon la fin de son identifiant.
La même logique de rangement existe dans `_handleRowChange` (`js/sync.js`) :
**toute nouvelle sorte de ligne doit être ajoutée aux deux endroits**.

| Identifiant | Contenu (`data`) | Rangé dans | Écrit par |
|---|---|---|---|
| `<sid>` (ex. `lattes`, `garenne`, `levallois`, `issy`, `toulouse`, `goldgym`, `pw_occitanie`) | fiche studio : `name`, `addr`, `societe`, `ouverture`, `statut`, `cohorte`, `capex`, `emprunt`, `leasing`, `loyer_mensuel`, `steps`, `forecast`, etc. | `S.studios[sid]` | `saveStudio` (`js/notifications.js`) via `rpcPatch` |
| `<sid>_files` | `files` | `S.files` | `uploadFichier`, `deleteFichier` (`js/simulator.js`) + stockage `studio-files` |
| `<sid>_depenses` | `depenses` | `S.depenses` | `saveDepenses` (`js/notifications.js`) |
| `<sid>_adherents` | `actuel` (saisies mensuelles) | `S.adherents` | `saveAdherents` (fusion via `rpcPatch`), `replaceAdherents` (remplacement complet) |
| `<sid>_scenarios` | `scenarios` | `S.scenarios` | `saveScenarios` (`js/state.js`) |
| `<sid>_simconfig` | `config` (mix et prix du simulateur adhérents) | `S.simConfig` | `saveSimConfig` (différé 500 ms), `flushSimConfig` |
| `<sid>_todos` | `todos` (tâches) | `S.todos` | `saveTodos` (`js/pages-echanges.js`) |
| `<sid>_topics` | `topics` (questions / forum) | `S.topics` | `saveTopics` (`js/pages-echanges.js`) |
| `<sid>_messages` | `messages` (ancien fil 1:1) | `S.messages` | `envoyerMessage`, relu par `rechargerMessages` toutes les 8 s sur l'onglet Questions & Tâches |
| `_people` | `people` (annuaire équipe) | `S.people` | `_savePeople` (`js/pages-equipe.js`) |
| `<sid>_shifts` | `shifts` (planning) | `S.shifts` | `_saveShifts` |
| `<sid>_shift_templates` | `templates` | `S.shiftTemplates` | `_saveTemplates` |
| `<sid>_shift_proposals` | `proposals` | `S.shiftProposals` | `_saveProposals` |
| `global_chat` | `messages` | `S.globalChat` | `envoyerGlobalMessage`, `supprimerGlobalMessage` (`js/chat.js`) : relit puis réécrit toute la ligne |
| `_admin_settings` | `settings` : `blocked`, `roles`, `viewers`, `viewerPerms`, `passwords`, `invitations`, `deletedStudios` | `S.adminSettings` | `saveAdminSettings` (`js/auth.js`) |
| `_user_presence` | `presence` : `{uid: {ts, nom}}` | `S.userPresence` | `updatePresence` (`js/utils.js`), toutes les 3 min, onglet visible seulement |
| `_avatars` | `avatars` : `{nom: url}` | `S.avatarUrls` | `uploadAvatar` (`js/auth.js`) |
| `_login_<uid>` | `{ts, nom, uid}` (dernière connexion, une ligne par personne) | `S.lastLogins` via `loadLastLogins` | `recordLastLogin` (`js/utils.js`) |
| `_prospects` | `items` | `S.prospects` | dormant (rubrique Prospection retirée) |

À savoir :

- Une ligne qui ne correspond à aucun suffixe est traitée comme un studio.
  `_getStudioIds()` (`js/auth.js`) ne garde que les entrées qui ont un `name`,
  ce qui écarte par exemple les lignes `_login_<uid>` et `_prospects`. Ne
  jamais donner à un studio un identifiant qui finit par un suffixe réservé.
- **Champs réimposés depuis `INIT`** (`js/constants.js`) à chaque chargement
  et à chaque synchro : `ouverture`, `capex`, `emprunt`, `leasing`, `name`,
  `addr`, `loyerVarPct`, et `forecast.moisDebut`. Les changer ailleurs ne sert
  à rien : il faut modifier `INIT`. `loyer_mensuel` n'est semé qu'une fois.
- Un studio présent dans `INIT` mais absent de la base est recréé, sauf s'il
  figure dans `S.adminSettings.deletedStudios` (pierre tombale).
- Les données commerciales du Sales Coach ne sont **plus** dans `studios` :
  elles sont dans `coach_store` (6.2).

### 6.2 Autres tables, stockage et RPC

| Élément | Usage |
|---|---|
| `profiles` | Profil de chaque compte (nom, rôle). Lu au démarrage et par `_loadAllProfiles` |
| `notifications` | Notifications in-app, une ligne par destinataire. Temps réel sur `INSERT` filtré par utilisateur (`subscribeNotifications`) |
| `push_subscriptions` | Abonnements Web Push des appareils (`js/push.js`, fonction `send-push`) |
| `coach_store` | Données du Sales Coach (`_coach_prospects`, `_coach_access`, `_coach_stats`, `_ic_data`, `_training`, journaux Boost et Aircall...). Sécurité active sans aucune règle d'accès : lisible **uniquement** par les Edge Functions (clé service role). Voir `supabase/migrations/006_coach_store.sql` et `supabase/functions/_shared/store.ts` |
| Stockage `studio-files` | Fichiers des studios, justificatifs de dépenses (`uploadJustif`), photos de profil (`uploadAvatar`) |
| RPC `patch_studio_data` | Fusion atomique dans `studios.data`, avec contrôle de conflit (`expected_updated_at`). Appelée par `rpcPatch` (`js/state.js`). Définie par `supabase/migrations/004_patch_studio_data.sql`, verrouillée par `005_lock_patch_studio_data.sql` (session obligatoire) |

### 6.3 Façons d'écrire

- **`rpcPatch(id, {merge: ...})`** : fusion partielle et atomique, conflit
  détecté (message puis rechargement). C'est le chemin de `saveStudio`,
  `saveAdherents`, `saveDepenses` et des saisies taux / loyer / CAPEX. Les
  options `array_append` / `array_remove_key` ajoutent ou retirent un élément
  d'une liste (fichiers : `uploadFichier`, `deleteFichier`).
- **`sb.from('studios').upsert({id, data, updated_at})`** : remplacement de
  toute la ligne, le dernier qui écrit gagne. Utilisé pour les listes (tâches,
  questions, scénarios, équipe, chat, réglages admin).
- **Écriture optimiste** : `saveStudio` met `S` à jour tout de suite, puis
  `withRollback` remet l'ancienne valeur si la base refuse.

---

## 7. Synchronisation temps réel et secours (`js/sync.js`)

- **Temps réel** : `subscribeDataChanges()` ouvre le canal `studios-sync` sur
  la table `studios` (`INSERT`, `UPDATE`, `DELETE`). Chaque ligne reçue passe
  par `_handleRowChange(r)`, qui :
  - ignore tout pendant une saisie mensuelle (`S.editMoisIdx`) ou le
    formulaire nouveau studio ;
  - ignore une ligne déjà connue (même `updated_at`, mémorisé dans
    `_syncTimestamps`) ;
  - ne remplace jamais une saisie locale non enregistrée (adhérents,
    simulateur) ni un studio dont le taux est en cours d'édition
    (`_tauxPending`) ;
  - réimpose les champs `INIT` (6.1) ;
  - compare l'ancien et le nouveau contenu, puis demande un rendu par
    `_tryRender()` (sauf si un champ de saisie a le focus) ;
  - redessine à part une tâche ouverte dans sa fenêtre
    (`_rerenderTacheModal`) et le chat s'il est ouvert (`renderChat`).
- **Secours** : `syncDataFallback()` lit seulement `id` et `updated_at` de
  toute la table, puis télécharge les lignes changées par paquets de 40.
  Cadence : toutes les 5 min (`SYNC_POLL_OK`) quand le temps réel marche,
  toutes les 30 s (`SYNC_POLL_DOWN`) quand il est coupé. Rien n'est lu quand
  l'onglet est caché ; rattrapage au retour sur l'onglet (`visibilitychange`),
  au retour du réseau (`online`) et à chaque reconnexion du temps réel.
- **Reconnexion** : en cas d'erreur du canal, nouvel essai après 10 s, 20 s,
  puis 30 s au plus.
- `startSync()` démarre le tout (au login), `stopSync()` l'arrête (à la
  déconnexion).

Autres rythmes : notifications en temps réel (canal `notif-<uid>`), présence
toutes les 3 min (`startPresenceHeartbeat`), présence rafraîchie toutes les
30 s sur la page Administration (`_startAdminPresenceRefresh`, `js/pages.js`),
messages de l'ancien fil toutes les 8 s (`setDetailTab`, `js/simulator.js`).

---

## 8. Les fichiers `js/`, un par un (ordre de chargement)

Plusieurs fichiers ont un nom qui ne reflète plus leur contenu (`js/auth.js`,
`js/utils.js`, `js/simulator.js`, `js/animations.js` sont des fourre-tout). Se fier au
tableau ci-dessous plutôt qu'au nom.

| Fichier | Rôle | Points d'entrée principaux |
|---|---|---|
| `js/config.js` | Réglages publics sur `window` | `ISSEO_SENTRY_DSN`, `ISSEO_POSTHOG_KEY` (vide), `ISSEO_ENV`, `ISSEO_GOOGLE_*` (lus seulement par Drive, non chargé), `ISSEO_VAPID_PUBLIC_KEY` |
| `js/observability.js` | Charge Sentry si un DSN est réglé | `window.isseoCaptureError(err, ctx)` |
| `js/vendor/preact.umd.js`, `js/vendor/htm.umd.js` | Preact + htm | `window.preact`, `window.htm` |
| `js/constants.js` | Données métier fixes et **moteur du BP** | `INIT` (graines des studios), `STEPS`, `getStudioSteps`, `STATUT_CFG`, `inferStatut`, `resolveStatut`, `ROLE_FILTER`, `LOCALISATION_DATA`, `STUDIO_COORDS`, `OWNERSHIP_MAP`, `BUDGET_CAPEX_DETAIL`, `DEPENSE_CATS`, `DEBLOCAGE`, formats `fmt` / `fmtN` / `num` / `cleanName`, `getBPAdherents`, `adhCurveFromTargets`, `caFromAdherents`, tables `CA_*` / `CA_MENSUEL_*` / `BP_CHARGES_ANNUELLES*` / `BP_RESULTATS*`, `BP_LINES`, `getStudioBPOpts`, `getStudioCharges`, `getStudioResultats`, `getCapexDetailForStudio`, `computeCapexTotals`, `buildBPFromDossier`, `buildBP`, `build3YearBP`, `PROSPECT_TABS` (dormant) |
| `js/animations.js` | Effets visuels, petits composants et **post-rendu** | `afterRenderAnimations` (après chaque `render()`), `window.fmtC`, `progressRingSVG`, `donutChart`, `sparkline`, `emptyState`, `skeletonGrid`, `confettiBurst`, `successCheck`, `openCommandPalette` (Cmd+K), `_buildCommandItems`, `window.toast` (version enrichie), gestes `initSwipeGestures` / `initPullToRefresh` / `initTaskGestures` |
| `js/state.js` | État `S` et persistance | `S`, `loadAll`, `saveNavState`, `restoreNavState`, `rpcPatch`, `withRollback`, `safeSave` (inutilisé), `saveSimConfig`, `flushSimConfig`, `markDirty`, `saveAllDirty`, `discardAllDirty`, `_checkDirtyBeforeNav`, scénarios `enregistrerScenario`, `_confirmerScenario`, `chargerScenario`, `supprimerScenario`, `saveScenarios` |
| `js/notifications.js` | Notifications, e-mails, rapport du lundi, rappels ; aussi des écritures studio | `NOTIF_TYPES`, `loadNotifications`, `createNotification`, `subscribeNotifications`, `notifyAll`, `notifyUserByNom`, `renderNotifPanel`, `handleNotifClick`, `sendEmail`, `_emailLayout`, `_emailBtn`, `checkMondayReport`, `checkEcheances`, `saveStudio`, `setStudioCohorte`, `setStudioStatut`, `saveDepenses`, `replaceAdherents`, `saveAdherents` |
| `js/auth.js` | Fourre-tout : connexion, administration, menu, recherche | `renderAuth`, `doForgotPassword`, `renderRecoveryScreen`, `renderAdminPanel`, `saveAdminSettings`, `submitCreateUser`, `executeDeleteUser`, `setUserRole`, `toggleViewer`, `userAvatarWidget`, `uploadAvatar`, `globalSearch`, `renderSearchBar`, `openChangePassword`, `renderSidebar`, `_getStudioIds`, invitations (`showInviteViewerModal`, `submitInvitation`, `approveInvitation`, `renderInvitationsSection`), aides `htmlEscape`, `toast` (version de base), `badge`, `progBar`, `avatarHTML`, `saveTauxInteret` |
| `js/pages-accueil.js` | Page Accueil | `renderAccueil`, `_computeFocusItems` / `_renderFocusCard` (centre d'attention), `_renderHeroBanner`, `_computeTodayBriefing`, `renderMyTasks` (se termine par `renderFichiersHub()`) ; `_computeHealthScore`, `_renderHealthGauge` inutilisés |
| `js/pages-fichiers.js` | Rubrique Fichiers retirée du menu, encore chargée | `renderFichiersHub` (bas de l'Accueil), `openMyTask` (ouvre une tâche depuis l'Accueil), `_extractDriveFolderId` ; `renderFichiersPage` plus appelé |
| `js/pages-prospection.js` | Rubrique Prospection retirée, dormante | encore chargée car `js/sync.js` appelle `migrateProspects` et `doLogout` lit `_lienLoyerTimer` / `_ficheLoyerTimer` |
| `js/pages-engagements.js` | Engagements financiers | `renderEngagements` (onglet studio), `toggleCapexDetail`, `renderPageEngagements` (page hors menu), saisie de dépenses `ouvrirFormDepense`, `sauvegarderDepense`, `modifierDepense`, `supprimerDepense`, `uploadJustif` |
| `js/pages-bp-consolide.js` | Page BP Consolidé | `renderBPConsolide`, `_getScenarioCA`, `_getScenarioLabel` ; bascules de la page Engagements (`toggleEngView`, `toggleEngSection`, `setEngRecapStudio`...) |
| `js/pages-collab.js` | Page Collab (tâches et discussions de tous les studios) | `renderCollab`, `setCollabFilter`, `setCollabFromKpi`, `resetCollabFilters`, `_collabOpenTopic` |
| `js/pages-local.js` | Onglets Local et Localisation | `renderLocal`, `openPlanLightbox`, `renderLocalisation` |
| `js/pages-echanges.js` | Onglet Questions & Tâches | `renderEchanges`, forum (`creerTopic`, `repondreTopic`, `saveTopics`), tâches (`TACHE_STATUTS`, `ouvrirFormTache`, `creerTache`, `toggleTacheStatut`, `openTacheModal`, `_rerenderTacheModal`, `addCommentToTache`, `saveTodos`, kanban `_renderTachesKanban`), e-mails `task-notify`, ancien fil (`renderMessages`, `envoyerMessage`, `rechargerMessages`), aides carte `toggleStreetView`, `updateStudioAddr` |
| `js/pages-financier.js` | Onglets financiers du studio | `renderBP3YInfographic`, `renderAdherents`, `buildAdherentSVG`, `renderForecast`, simulateur BP `renderBPlayPanel` / `setBPlay` / `applyBPlay`, `renderCA3Chart` |
| `js/pages-introclass.js` | Page Intro Class | `loadIntroClass` (`coach-sync`, action `isseo_ic`), `_icCompute`, `renderIntroClass`, `_icExport` (CSV paie), `_icAddBareme` (action `isseo_ic_bareme`) |
| `js/pages-detail.js` | Cartes studio et fiche studio | `renderCard`, `renderViewToggle`, `renderStatusFilters`, `renderCohorteView`, `renderListView`, `setDashView`, `setDashFilter`, `renderActivityFeed`, `renderDetail`, `renderWorkflow` |
| `js/pages.js` | Page Studios et page Administration | `renderProjets`, `renderProjetsAdmin`, `_startAdminPresenceRefresh`, `_stopAdminPresenceRefresh`, `renderDashboard` (ancien) |
| `js/bp-edit.js` | Retouches du BP par studio et validation | `build3YearBPWithOverrides`, `applyBPOverridesToYear`, `distributeAnnualToMonths`, `onEditBPAnnual`, `renderBPProposalsPanel`, `approveBPProposal`, `rejectBPProposal`, `resetBPYear`, `seedBPMetaIfMissing` |
| `js/push.js` | Notifications Web Push | `window.isseoPush` : `isSupported`, `isEnabled`, `enable`, `disable`, `refresh`, `sendTo` |
| `js/preact-components/next-steps-widget.js` | Widget « Prochaines étapes » | `window.mountNextStepsWidget` (après chaque rendu, dans `[data-preact-widget="next-steps"]`) |
| `js/map.js` | Carte Leaflet et zone de chalandise | `initLocalisationMap`, `updateZoneRadius`, `calcPopZoneINSEE`, `renderLocalisationData` ; `renderFichiers` ancien |
| `js/utils.js` | Fourre-tout : rôles, session, présence, aides tâches | `renderAI` (onglet IA), `renderNewForm` (nouveau studio), `isSuperAdmin`, `isViewer`, `_INACTIVITY_MS`, `_isMobileDevice`, `_startSessionWatcher`, `updatePresence`, `loadPresence`, `startPresenceHeartbeat`, `recordLastLogin`, `loadLastLogins`, `doLogin`, aides `_getAssignees`, `_namesMatch`, `_taskAssignedTo`, `_getPriorityMeta`, `_getStatusMeta`, `_kanbanColumns`, `TASK_REACTIONS`, `_parseMentions`, `_avatarHtml`, `_relTime`, `_escHtml` |
| `js/exports.js` | Exports et navigation | `generateReport` (rapport imprimable), `exportStudioCSV`, `exportStudioExcel`, `doLogout`, `openDetail`, `retourProjets`, `setPage`, `toggleSidebar`, `toggleDarkMode`, `clearAppCacheAndReload` |
| `js/simulator.js` | Fourre-tout : actions de la fiche studio et simulateur adhérents | `setDetailTab`, `setMainTab`, `setFS`, `setForecastYear`, `setAdherentYear`, `toggleNewForm`, `setNF`, `createStudio`, `openEditMois`, `saveMois`, `clearMois`, `toggleStep`, `ajouterEtape`, `supprimerEtape`, `archiverStudio`, `restaurerStudio`, `supprimerStudio`, `saisirAdherentLive`, `saisirPreInscrits`, `uploadFichier`, `deleteFichier`, `askAI`, moteur `SIM_ARPU_TOTAL_BP`, `SIM_PRIX_REF`, `SIM_BOUTIQUE_FACTOR`, `computeBPCA`, `computeSimARPU`, `computeSimCA`, vues `renderStepRepartition`, `renderStepPrix`, `renderSimResults`, `buildSimCAChart`, scénarios `toggleScenarioEditMode`, `nouveauScenario`, saisie en direct `updateSimRep`, `updateSimPrix`, `animBPBars` |
| `js/chat.js` | Chat flottant entre associés | `renderChat`, `renderFloatingChat`, `toggleChat`, `envoyerGlobalMessage`, `supprimerGlobalMessage` ; aussi `saveLoyerMensuel`, `saveCapexLine` |
| `js/sync.js` | Temps réel et secours (section 7) | `startSync`, `stopSync`, `subscribeDataChanges`, `_handleRowChange`, `_tryRender`, `syncDataFallback` |
| `js/pages-how.js` | Page Comment ça marche | `window.renderHowItWorks` |
| `js/pages-equipe.js` | Page Équipe (tout dans une IIFE, styles injectés) | `window.renderEquipe` ; boutons `window._eq*` (`_eqSetSub`, `_eqWeek`, `_eqOpenPerson`, `_eqOpenShift`, `_eqSeedPlanning`...) |
| `js/coach-marks.js` | Tuto contextuel de chaque page (IIFE) | `FLOWS` (sélecteurs par page et onglet), `window.renderCoachFab`, `window.hideCoachFab`, `window.startCoachForCurrentPage` |
| `js/onboarding-tour.js` | Visite guidée plein écran au login (IIFE) | `window.maybeStartOnboardingTour`, `window.startOnboardingTour`, `window.resetOnboardingTour`, démos `DEMOS` |
| `js/app.js` | Rendu, routeur, démarrage | `render`, `_syncHash`, `_restoreFromHash`, `handleShareReceived`, démarrage `sb.auth.getSession()`, bannière hors ligne `_showOfflineBanner`, raccourci Cmd+K |

---

## 9. Où intervenir pour...

| Je veux... | Où | Repère |
|---|---|---|
| Changer un libellé ou l'ordre du menu | `js/auth.js` | `renderSidebar` (tableau `links`). Barre du bas sur mobile : `js/app.js`, `render()` (tableau `_btLinks`) |
| Ajouter une page | `js/app.js` | routeur dans `render()` ; lien dans `renderSidebar` (`js/auth.js`) ; `validPages` dans `_restoreFromHash` si la page doit avoir une adresse ; tuto dans `FLOWS` (`js/coach-marks.js`) |
| Ajouter ou renommer un onglet de fiche studio | `js/pages-detail.js` | `renderDetail` (tableau `tabs` et routeur) |
| Modifier le simulateur de business plan (onglet Business plan) | `js/pages-financier.js` | `renderBPlayPanel` (affichage), `setBPlay` (réglages), `applyBPlay` (enregistrement) ; calculs `adhCurveFromTargets`, `caFromAdherents` (`js/constants.js`) |
| Modifier le simulateur d'adhérents (assistant 3 étapes) | `js/simulator.js` | `renderStepRepartition`, `renderStepPrix`, `renderSimResults`, `computeSimCA` ; intégré par `renderAdherents` (`js/pages-financier.js`) |
| Modifier les scénarios enregistrés | `js/state.js` | `enregistrerScenario`, `_confirmerScenario`, `chargerScenario`, `supprimerScenario` |
| Changer les calculs du BP (CA, charges, EBITDA) | `js/constants.js` | `buildBPFromDossier`, `build3YearBP`, `BP_LINES`, `getStudioBPOpts` ; retouches par studio `build3YearBPWithOverrides` (`js/bp-edit.js`). Relancer `npx vitest run` |
| Changer l'en-tête BP 3 ans de l'onglet Workflow | `js/pages-financier.js` | `renderBP3YInfographic` |
| Changer les étapes du workflow | `js/constants.js` | `STEPS`, `getStudioSteps` ; cocher : `toggleStep` (`js/simulator.js`) ; affichage : `renderWorkflow` (`js/pages-detail.js`) |
| Changer les statuts de projet (Pipeline, En chantier...) | `js/constants.js` | `STATUT_CFG`, `inferStatut`, `resolveStatut` ; choix manuel : `setStudioStatut` (`js/notifications.js`) |
| Modifier nom, adresse, ouverture, CAPEX, emprunt ou leasing d'un studio | `js/constants.js` | `INIT` (ces champs sont réimposés à chaque chargement) |
| Ajouter un studio | app ou `js/constants.js` | formulaire : `renderNewForm` (`js/utils.js`), `createStudio` (`js/simulator.js`) ; studio permanent : `INIT` |
| Modifier l'Accueil | `js/pages-accueil.js` | `renderAccueil`, `_computeFocusItems`, `_renderHeroBanner`, `renderMyTasks` |
| Modifier la liste des studios | `js/pages.js`, `js/pages-detail.js` | `renderProjets`, `renderCard`, `renderListView`, `renderCohorteView` |
| Modifier les tâches (statuts, fenêtre, kanban) | `js/pages-echanges.js` | `TACHE_STATUTS`, `openTacheModal`, `creerTache`, `_renderTachesKanban` ; libellés et couleurs partagés : `_getStatusMeta`, `_getPriorityMeta` (`js/utils.js`) ; vue tous studios : `renderCollab` (`js/pages-collab.js`) |
| Modifier l'onglet Engagements | `js/pages-engagements.js` | `renderEngagements` |
| Modifier le BP consolidé | `js/pages-bp-consolide.js` | `renderBPConsolide` |
| Modifier la page Équipe | `js/pages-equipe.js` | `renderEquipe` et les fonctions `_render*` internes |
| Modifier l'Intro Class | `js/pages-introclass.js` | `renderIntroClass`, `_icCompute` ; données : `supabase/functions/coach-sync` (actions `isseo_ic`, `isseo_ic_bareme`) |
| Modifier l'écran de connexion | `js/auth.js` | `renderAuth` ; connexion `doLogin` (`js/utils.js`) ; mot de passe oublié `renderRecoveryScreen` |
| Gérer comptes, rôles et lecteurs | `js/auth.js` | `renderAdminPanel`, `submitCreateUser`, `setUserRole`, `toggleViewer`, `showInviteViewerModal` ; studios visibles par rôle : `ROLE_FILTER` (`js/constants.js`) ; super-admin : `isSuperAdmin` (`js/utils.js`) |
| Modifier une notification ou un e-mail | `js/notifications.js` | `NOTIF_TYPES`, `createNotification`, `notifyAll`, `_emailLayout`, `checkMondayReport`, `checkEcheances` ; e-mails de tâches : `supabase/functions/task-notify` |
| Recherche globale et palette Cmd+K | `js/auth.js`, `js/animations.js` | `globalSearch`, `renderSearchBar` ; `openCommandPalette`, `_buildCommandItems` |
| Exports PDF, CSV, Excel | `js/exports.js` | `generateReport`, `exportStudioCSV`, `exportStudioExcel` |
| Carte et zone de chalandise | `js/map.js`, `js/pages-local.js` | `initLocalisationMap`, `updateZoneRadius`, `renderLocalisation` ; données `LOCALISATION_DATA`, `STUDIO_COORDS` (`js/constants.js`) |
| Onglet IA | `js/utils.js`, `js/simulator.js` | `renderAI`, `askAI` (fonction serveur `ask-ai`) |
| Chat entre associés | `js/chat.js` | `renderFloatingChat`, `envoyerGlobalMessage` |
| Tutoriels | `js/coach-marks.js`, `js/onboarding-tour.js` | `FLOWS` (tuto par page), `DEMOS` (visite guidée) |
| Couleurs, styles, mode sombre | `styles.css` | variables `:root`, règles `body.dark` ; styles injectés par `js/pages-equipe.js`, `js/coach-marks.js`, `js/pages-how.js`, `js/onboarding-tour.js` (`_ensureStyles`) |
| Format des nombres et des montants | `js/constants.js`, `js/animations.js` | `fmt`, `fmtN`, `num` ; format compact `window.fmtC` |
| Ajouter une sorte de ligne Supabase | `js/state.js`, `js/sync.js` | `loadAll` **et** `_handleRowChange` |
| Le Sales Coach | `~/Desktop/cp-sales-coach/index.html` | puis copie dans `cp-sales-coach/` (section 10) |
| La synchro Fitness Boost | `supabase/functions/boost-sync`, `boost-push` | section 11 |

---

## 10. Le CP Sales Coach (`cp-sales-coach/`)

- Outil d'aide à la vente téléphonique pour les commerciaux. Application
  autonome en **un seul fichier**, `cp-sales-coach/index.html` (HTML, CSS et
  JavaScript ensemble), avec ses images (`avatars/`, `icons/`,
  `flower-white.png`, `logo-cp.webp`), son `manifest.json` et le livret
  `livret-formation-commerciale.pdf`.
- Ouvert depuis le lien « Sales Coach » du menu (`renderSidebar`, nouvel
  onglet), à l'adresse `/cp-sales-coach/`.
- **Source de travail** : `~/Desktop/cp-sales-coach/index.html`. Le fichier du
  dépôt en est une copie. Pour publier une modification :
  ```
  cp ~/Desktop/cp-sales-coach/index.html ~/Desktop/isseo-app/cp-sales-coach/index.html
  ```
  puis commit et `git push` (section 12). Vérifier avant que les deux fichiers
  sont identiques (`cmp`), pour ne pas écraser une modification faite
  directement dans le dépôt.
- Il ne lit jamais la base directement : tout passe par la fonction
  `coach-sync` (code maître de Paul ou code d'invitation personnel), qui range
  les données dans `coach_store`.
- Les statuts des prospects reprennent le vocabulaire exact de Fitness Boost
  (source maîtresse des leads) : À traiter, Contacté, RDV planifié, RDV non
  venu, Séance d'essai, RDV venu, Client, Perdu. Les codes internes
  (`rappeler`, `essai`, `venu`, `abo`, `perdu`) ne changent pas.

---

## 11. Supabase Edge Functions (`supabase/functions/`)

Code serveur en TypeScript (Deno). Les outils communs sont dans
`supabase/functions/_shared/` : `store.ts` (lecture et écriture de
`coach_store`, limite d'essais par adresse IP, comparaison sûre) et
`aircall.ts`.

| Fonction | Rôle | Appelée par | Protection |
|---|---|---|---|
| `admin-users` | Créer et supprimer des comptes (super-admins) | `js/auth.js` (`submitCreateUser`, `approveInvitation`, `executeDeleteUser`) | jeton de session vérifié dans la fonction + liste d'e-mails admin |
| `manage-user` | Création, suppression, réinitialisation de mot de passe | `js/auth.js` (`_applyUserPassword`) | jeton de session vérifié |
| `send-email` | Envoi d'e-mails (Resend) | `sendEmail` (`js/notifications.js`) | jeton de session vérifié |
| `send-push` | Notifications Web Push vers les appareils | `sendTo` (`js/push.js`), via `createNotification` | aucune vérification de l'appelant (voir section 14) |
| `task-notify` | E-mails aux personnes assignées à une tâche, boutons signés | `js/pages-echanges.js` | **vérification du jeton par la plateforme Supabase** (le code ne contrôle que la présence de l'en-tête) |
| `task-action` | Page publique des boutons d'e-mails de tâches (statut, commentaire) | `task-action.html` | jeton signé HMAC |
| `ask-ai` | Onglet IA (Mistral) | `askAI` (`js/simulator.js`) | aucune vérification dans le code, repose sur la plateforme (voir section 14) |
| `coach-sync` | Stockage serveur du Sales Coach (prospects, équipe, statistiques, formation) et données Intro Class d'isseo | `cp-sales-coach/index.html` ; `js/pages-introclass.js` | code maître ou code d'invitation ; session isseo pour `isseo_ic` |
| `boost-sync` | Lecture de Fitness Boost vers les fiches du Sales Coach (`discover`, `dry_run`, `import`) | planificateur pg_cron toutes les 10 min, ou Paul | en-tête `x-sync-key` |
| `boost-push` | Écriture Sales Coach vers Boost (statuts, rappels) ; modes `simulation`, `test`, `live` | planificateur toutes les 2 min, ou Paul | en-tête `x-sync-key` |
| `aircall-sync` | Aircall (Montpellier Lattes) : découverte, création du webhook, import rétroactif | Paul, à la main | en-tête `x-sync-key` |
| `aircall-webhook` | Appels terminés et transcriptions Aircall vers les fiches Boost de Lattes | Aircall | jeton du webhook |
| `allo-webhook` | Téléphonie Allo (appels, SMS, contacts, résumés) vers les fiches | Allo | signature du webhook |
| `allo-backfill` | Import rétroactif de l'historique Allo | Paul, à la main | en-tête `x-admin-code` |

**Déployer une fonction** (depuis la racine du dépôt) :

```
supabase functions deploy NOM --no-verify-jwt --project-ref wfqtpcujujqxgfsgbpvp
```

Exemple : `supabase functions deploy coach-sync --no-verify-jwt --project-ref wfqtpcujujqxgfsgbpvp`.

- `--no-verify-jwt` est indispensable pour les fonctions appelées sans
  session isseo (Sales Coach, planificateur, webhooks, liens d'e-mail) :
  `coach-sync`, `boost-sync`, `boost-push`, `aircall-sync`,
  `aircall-webhook`, `allo-webhook`, `allo-backfill`, `task-action`,
  `send-push`. Elles se protègent elles-mêmes (code, clé, signature) ou pas
  du tout (`send-push`, section 14).
- `admin-users`, `manage-user` et `send-email` vérifient elles-mêmes le jeton
  de session : la commande ci-dessus leur convient.
- **Exception** : `task-notify` et `ask-ai` comptent sur la vérification du
  jeton par la plateforme (commentaire explicite dans `task-notify`). Les
  déployer **sans** `--no-verify-jwt`
  (`supabase functions deploy task-notify --project-ref wfqtpcujujqxgfsgbpvp`)
  tant que leur code ne vérifie pas lui-même l'appelant.
- L'en-tête de chaque `index.ts` décrit ses actions, ses secrets et son mode
  de déploiement : le lire avant de déployer.
- `boost-push` partage du code avec `boost-sync` (`boost-sync/sync.ts`) :
  redéployer les deux après une modification de ce fichier.
- Quand une modification du site dépend d'une fonction, déployer la fonction
  **avant** de pousser le site.
- **Secrets** : seuls leurs noms figurent dans le code (`Deno.env.get(...)`).
  Paul les pose lui-même avec `supabase secrets set NOM=valeur` ; une valeur
  de secret ne doit jamais apparaître dans le chat, le code ou un commit.
- **SQL** : les fichiers de `supabase/migrations/` se lancent à la main dans
  l'éditeur SQL Supabase, dans l'ordre, en suivant la consigne de leur
  en-tête (« à lancer avant / après le déploiement de... »).
- **Tâches planifiées** (pg_cron, migrations 008 à 010) : `boost-sync-garenne`
  et `boost-sync-lattes` toutes les 10 min (décalées), `boost-push` toutes les
  2 min, `cron-purge-journal` chaque nuit.

---

## 12. Mise en ligne

1. **Site** : `git push origin main`. Vercel (projet relié au dépôt GitHub
   `Paul-is-learning/isseo-clubpilates`) publie la racine telle quelle
   (`vercel.json` : pas de build, dossier publié `.`) sur
   https://clubpilates.isseo-dev.com. `.vercelignore` exclut notamment
   `supabase/`, `migrations/`, `tests/`, `scripts/`, `types/`, les `*.md` et
   `*.sql` : ces fichiers ne sont jamais servis.
2. **Forcer les navigateurs à prendre la nouvelle version** :
   - chaque fichier est appelé avec un suffixe de version dans `index.html`,
     par exemple `js/app.js?v=20261027lite` et `styles.css?v=20261027lite`.
     **Tout fichier JS ou CSS modifié doit recevoir un nouveau `?v=`**
     (habitude : date AAAAMMJJ + mot court) ;
   - `sw.js` contient `CACHE_VERSION` (par exemple `isseo-v1-20261027-lite`).
     **Le changer à chaque mise en ligne d'assets** : le navigateur installe
     alors le nouveau service worker, qui efface les anciens caches, et l'app
     affiche « Nouvelle version disponible ».
   - La liste `APP_SHELL` de `sw.js` (fichiers mis en cache à l'installation)
     a ses propres `?v=`, qui ne suivent plus ceux d'`index.html`. Le site
     reste à jour car les fichiers du site sont servis « réseau d'abord » ;
     si on remet cette liste à jour, recopier exactement les `?v=`
     d'`index.html`.
   - Un utilisateur bloqué sur une ancienne version peut cliquer sur le
     bouton « Vider le cache et recharger » du menu
     (`clearAppCacheAndReload`).
3. **Sales Coach** : même `git push` après la copie (section 10).
4. **Fonctions serveur** : déploiement séparé (section 11).

En local : servir le dossier par n'importe quel serveur statique (`npm run dev`
lance Vite sur le port 5173). Le service worker n'est jamais actif en local.

---

## 13. Tests et filet de sécurité

À lancer depuis la racine du dépôt, **avant chaque push**.

1. **Syntaxe** de chaque fichier JS modifié :
   ```
   node --check js/app.js
   ```
2. **Calculs du BP** (Vitest, `tests/bp-calc.test.js`, 18 tests ; il charge
   `js/utils.js`, `js/constants.js`, `js/state.js` et `js/simulator.js` par
   `tests/_setup.js`) :
   ```
   npx vitest run
   ```
   (équivalent : `npm test`).
3. **Filet « golden »** (`tests/golden/render-snapshot.mjs`) : charge toute
   l'app dans un navigateur simulé (happy-dom), dans l'ordre d'`index.html`,
   avec Supabase remplacé par un faux client qui renvoie des listes vides, les
   données de démonstration `INIT`, une horloge figée au 27 oct. 2026 et un
   hasard reproductible. Il enregistre le HTML de 34 écrans : les 8 pages
   (`accueil`, `projets`, `collab`, `bp`, `equipe`, `introclass`,
   `how-it-works`, `engagements`), la page Administration, les 8 onglets des
   3 premiers studios (`lattes`, `garenne`, `levallois`) et l'écran de
   connexion, plus `_errors.txt` (erreurs console) et `_timings.txt` (temps de
   rendu, exclu de la comparaison). Le message final annonce « 35 écrans » car
   il compte aussi `_errors.txt`.
   ```
   # 1. avant la modification : photo de référence
   node tests/golden/render-snapshot.mjs /tmp/isseo-golden-base
   # 2. après la modification
   node tests/golden/render-snapshot.mjs /tmp/isseo-golden-apres
   # 3. comparaison : aucune sortie = rendu identique
   diff -r -x _timings.txt /tmp/isseo-golden-base /tmp/isseo-golden-apres
   ```
   - Une modification qui ne doit rien changer à l'écran doit donner un `diff`
     vide. Une modification visible ne doit faire apparaître que le
     changement voulu.
   - `_errors.txt` contient normalement une seule ligne : le script Sentry,
     que le navigateur simulé ne peut pas télécharger.
   - `GOLDEN_DEBUG=1` devant la commande affiche les premières erreurs de
     chargement.
   - Le script a besoin de `node_modules` (happy-dom). Dans une copie de
     travail `git worktree` qui n'en a pas, créer un lien :
     `ln -s /Users/paulbecaud/Desktop/isseo-app/node_modules node_modules`
     (ne jamais le committer).
4. Contrôles facultatifs : `npm run lint` (ESLint, réglages permissifs),
   `npm run typecheck` (TypeScript).

---

## 14. Points d'attention connus

- **Code dormant encore chargé** : `js/pages-prospection.js` (dépendances dans
  `js/sync.js` et `doLogout`), `js/pages-fichiers.js` (le hub fichiers est
  toujours affiché en bas de l'Accueil et `openMyTask` y vit),
  `renderPageEngagements` (page hors menu mais routée), `renderFichiers`
  (`js/map.js`), `renderDashboard` (`js/pages.js`), `safeSave`
  (`js/state.js`). Les retirer demande de déplacer d'abord ce qui sert encore.
- **Google Drive** : `js/gdrive.js` et `js/gdrive-ui.js` ne sont pas chargés ;
  le partage de fichiers vers la PWA (`_uploadSharedFilesToStudio`) ne peut
  donc pas aboutir (message « Google Drive non configuré »).
- **Noms trompeurs** : `js/auth.js`, `js/utils.js`, `js/simulator.js`,
  `js/animations.js` contiennent bien plus que leur nom (section 8).
- **Écritures « dernier qui écrit gagne »** pour les listes (tâches,
  questions, scénarios, équipe) : deux personnes qui modifient la même liste
  au même instant peuvent s'écraser. Le chat relit la ligne avant d'écrire,
  ce qui réduit le risque sans le supprimer.
- **Fonctions serveur sans contrôle de l'appelant dans leur code** :
  `send-push` (son en-tête la dit déployée avec `--no-verify-jwt` : n'importe
  qui pourrait alors envoyer une notification à un identifiant d'utilisateur
  connu) et `ask-ai` (repose
  sur la seule vérification de la plateforme). `task-notify` ne vérifie que
  la présence de l'en-tête. À corriger avant d'en élargir l'usage.
- **`APP_SHELL` de `sw.js`** désynchronisée d'`index.html` (section 12).
- **`doLogin` (`js/utils.js`)** : la correspondance automatique e-mail vers
  rôle écrit la ligne `_admin_settings` avec `data: S.adminSettings`, sans
  l'enveloppe `settings` que lisent `loadAll` et `_handleRowChange`. Si ce
  cas se déclenche, les réglages d'accès relus seraient vides. Écrire plutôt
  par `saveAdminSettings()`.
