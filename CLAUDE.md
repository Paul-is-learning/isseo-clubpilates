# CLAUDE.md · règles de travail sur isseo-app

À lire en début de session. La carte détaillée du code (démarrage, rendu,
données, fichiers, « où intervenir pour... ») est dans `ARCHITECTURE.md`.

## Avec Paul

- Paul est le propriétaire et le décideur ; il n'est pas développeur.
  Lui parler en français, simplement, et expliquer l'effet visible d'un
  changement plutôt que le code.
- **Ne jamais inventer de chiffres métier** : nombre de studios, objectifs,
  CA, prix, effectifs, primes, témoignages clients. Demander la valeur à Paul
  ou mettre un texte neutre à compléter. Ne pas prendre de décision produit à
  sa place.
- **Secrets jamais dans le chat**, ni dans le code du site, ni dans un
  commit : mots de passe, jetons, clés d'API (Boost, Allo, Aircall, Resend,
  Mistral, service role, VAPID privée...). Ne jamais recopier une valeur lue
  dans un fichier ou une sortie de commande ; citer seulement le nom du
  secret. Paul pose lui-même les secrets serveur (`supabase secrets set
  NOM=...`). Les clés publiques de `index.html` et `js/config.js` sont faites
  pour être visibles ; aucune clé secrète ne doit jamais aller côté site.

## Texte affiché

- **Jamais de tiret cadratin (U+2014) ni de demi-cadratin (U+2013)** dans un
  texte visible : interface, toasts, e-mails, notifications, PDF, prompts
  envoyés à l'IA. Utiliser le point médian « · » (ou une virgule, deux-points,
  parenthèses). Ne pas en ajouter, même si du code ancien en contient encore ;
  par habitude, les éviter aussi dans les commentaires et les commits.
- **Statuts des prospects (Sales Coach) : vocabulaire exact de Fitness
  Boost.** À traiter, Contacté, RDV planifié, RDV non venu, Séance d'essai,
  RDV venu, Client, Perdu. Les codes internes (`rappeler`, `essai`, `venu`,
  `abo`, `perdu`) ne changent pas. Tout nouveau libellé, filtre ou compteur
  de statut reprend ces termes.

## Code

- Scripts classiques, tout est global : style compact ES5 (`var`,
  `function`), commentaires courts en français. Une fonction appelée par un
  `onclick="..."` doit rester globale.
- Après toute modification de `S`, appeler `render()` (il reconstruit tout
  `#root`).
- Nouvelle sorte de ligne dans la table `studios` : la ranger dans
  `loadAll` (`js/state.js`) **et** dans `_handleRowChange` (`js/sync.js`).
- Les champs `name`, `addr`, `ouverture`, `capex`, `emprunt`, `leasing`,
  `loyerVarPct` d'un studio sont réimposés depuis `INIT`
  (`js/constants.js`) : les modifier là.
- Ne pas renommer un identifiant de ligne Supabase, un code de statut ou une
  clé de données existante sans plan de migration validé par Paul.

## Avant de pousser

1. `node --check` sur chaque fichier JS modifié.
2. Filet golden (voir `ARCHITECTURE.md`, section 13) :
   ```
   node tests/golden/render-snapshot.mjs /tmp/isseo-golden-base    # avant la modification
   node tests/golden/render-snapshot.mjs /tmp/isseo-golden-apres   # après
   diff -r -x _timings.txt /tmp/isseo-golden-base /tmp/isseo-golden-apres
   ```
   Aucune différence attendue, sauf le changement voulu.
3. `npx vitest run` : les 18 tests doivent passer.
4. **Fichier JS ou CSS modifié** : changer son `?v=` dans `index.html` **et**
   `CACHE_VERSION` dans `sw.js`, sinon les navigateurs gardent l'ancienne
   version.
5. Mise en ligne : `git push origin main` (Vercel publie). Fonctions serveur :
   `supabase functions deploy NOM --no-verify-jwt --project-ref wfqtpcujujqxgfsgbpvp`,
   sauf `task-notify` et `ask-ai`, à déployer sans `--no-verify-jwt`
   (`ARCHITECTURE.md`, section 11). Déployer la fonction avant le site
   quand le site en dépend.
6. Sales Coach : la source est `~/Desktop/cp-sales-coach/index.html`, à
   recopier dans `cp-sales-coach/index.html` avant le push.
